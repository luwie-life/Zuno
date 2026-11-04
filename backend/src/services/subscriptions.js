import { Plan, Subscription, Payment } from '../models/index.js';
import {
  computeSubscriptionState,
  hasAccess,
  nextPeriodEnd,
  featureAllowed,
} from '../lib/subscriptionRules.js';
import { getSettings } from './settings.js';
import { notFound } from '../lib/errors.js';
import { audit } from './audit.js';

const NGN = (n) => n * 100;
const DAY = 24 * 60 * 60 * 1000;
const LOCK_DURATION = 10 * 60 * 1000;
const VERIFY_RETRY_DELAY = 30 * 60 * 1000;
const CHARGE_RETRY_DELAY = 6 * 60 * 60 * 1000;
const REVIEW_RETRY_DELAY = 365 * DAY;

const VERIFICATION_MISMATCH_REASONS = new Set([
  'reference_mismatch',
  'amount_mismatch',
  'currency_mismatch',
]);

const BASE = [
  'online_store',
  'products',
  'orders',
  'basic_reports',
  'services',
  'bookings',
];

const BUSINESS = [
  ...BASE,
  'pos',
  'shared_inventory',
  'stock_movements',
  'low_stock',
  'customers',
  'suppliers',
  'purchasing',
  'enhanced_reports',
];

export const DEFAULT_PLANS = [
  {
    key: 'online_store',
    name: 'Online Store',
    description: 'Online selling or service booking with product management and customer requests.',
    setupFee: NGN(250000),
    monthlyFee: NGN(15000),
    features: BASE,
    limits: { products: 200, staff: 1, services: 200, bookings: -1 },
    sortOrder: 1,
  },
  {
    key: 'store_business',
    name: 'Store + Business Management',
    description: 'Everything in Online Store plus integrated POS and shared inventory.',
    setupFee: NGN(450000),
    monthlyFee: NGN(30000),
    features: BUSINESS,
    limits: { products: 2000, staff: 5, services: 2000, bookings: -1 },
    sortOrder: 2,
  },
  {
    key: 'advanced',
    name: 'Advanced Business',
    description: 'Everything in Store + Business Management with higher limits and priority support.',
    setupFee: NGN(750000),
    monthlyFee: NGN(50000),
    priceIsFrom: true,
    features: [...BUSINESS, 'priority_support'],
    limits: { products: -1, staff: -1, services: -1, bookings: -1 },
    sortOrder: 3,
  },
];

export async function ensureDefaultPlans() {
  for (const p of DEFAULT_PLANS) {
    await Plan.updateOne(
      { key: p.key },
      { $setOnInsert: p },
      { upsert: true },
    );

    await Plan.updateOne(
      { key: p.key },
      {
        $addToSet: {
          features: { $each: ['services', 'bookings'] },
        },
        $set: {
          'limits.services': p.limits.services,
          'limits.bookings': p.limits.bookings,
        },
      },
    );
  }
}

export async function createSubscription(businessId, planKey) {
  const plan = await Plan.findOne({ key: planKey, active: true });

  if (!plan) throw notFound('Plan not found');

  return Subscription.create({
    business: businessId,
    plan: plan._id,
  });
}

export async function getAccess(businessId) {
  const sub = await Subscription.findOne({ business: businessId });

  if (!sub) {
    return {
      sub: null,
      plan: null,
      state: 'none',
      access: false,
    };
  }

  const [plan, settings] = await Promise.all([
    Plan.findById(sub.plan),
    getSettings(),
  ]);

  const state = computeSubscriptionState(
    sub,
    plan,
    new Date(),
    settings.graceDays,
  );

  return {
    sub,
    plan,
    state,
    access: hasAccess(state),
    settings,
  };
}

export async function hasFeature(businessId, feature) {
  const { sub, plan, access } = await getAccess(businessId);

  if (!access) return false;

  return featureAllowed(plan, feature, sub?.override);
}

/**
 * Called only after Payment has been verified server-side and claimed.
 * Payment application is idempotent per payment reference.
 */
export async function applySubscriptionPayment(payment, tx) {
  const sub = await Subscription.findOne({
    business: payment.business,
  });

  if (!sub) return;

  if (sub.lastAppliedPaymentReference === payment.reference) return;

  const planId = payment.meta?.planId;

  if (payment.purpose === 'setup_fee') {
    sub.setupStatus = 'paid';
    sub.setupPaidAt = new Date();

    if (
      planId &&
      String(sub.pendingPlan) === String(planId)
    ) {
      sub.plan = sub.pendingPlan;
      sub.pendingPlan = undefined;
    }
  } else if (payment.purpose === 'subscription') {
    sub.currentPeriodEnd = nextPeriodEnd(sub.currentPeriodEnd);
    sub.failedRenewals = 0;
    sub.status = 'active';
    sub.cancelAtPeriodEnd = false;

    if (sub.scheduledPlan) {
      sub.plan = sub.scheduledPlan;
      sub.scheduledPlan = undefined;
    }

    const authorization = tx?.authorization;

    if (
      authorization?.authorization_code &&
      authorization.reusable
    ) {
      sub.authorization = {
        code: authorization.authorization_code,
        email: tx.customer?.email,
        reusable: true,
        last4: authorization.last4,
        brand: authorization.brand,
      };
    }

    sub.renewalStatus = 'current';
    sub.lastRenewalFailureAt = undefined;
    sub.lastRenewalFailureReason = undefined;
    sub.nextRenewalRetryAt = undefined;
    sub.pendingRenewalPaymentReference = undefined;
    sub.renewalLockUntil = undefined;
  }

  sub.lastAppliedPaymentReference = payment.reference;

  await sub.save();

  await audit({
    actorType: 'system',
    action: `billing.${payment.purpose}_applied`,
    business: payment.business,
    related: {
      kind: 'Payment',
      id: payment._id,
    },
    meta: {
      amount: payment.amount,
    },
  });
}

/**
 * Atomically acquire a renewal lock.
 *
 * Automatic retries respect nextRenewalRetryAt.
 * Manual retries can happen immediately after a confirmed failure,
 * but only when the subscription is due or has a pending payment.
 */
async function acquireRenewalLock(
  businessId,
  now = new Date(),
  manual = false,
) {
  const lockAvailable = {
    $or: [
      { renewalLockUntil: { $exists: false } },
      { renewalLockUntil: null },
      { renewalLockUntil: { $lte: now } },
    ],
  };

  const eligibility = manual
    ? {
        $or: [
          {
            pendingRenewalPaymentReference: {
              $exists: true,
              $ne: null,
            },
          },
          {
            renewalStatus: 'retry_required',
            currentPeriodEnd: {
              $lte: new Date(now.getTime() + DAY),
            },
          },
        ],
      }
    : {
        $and: [
          {
            $or: [
              { nextRenewalRetryAt: { $exists: false } },
              { nextRenewalRetryAt: null },
              { nextRenewalRetryAt: { $lte: now } },
            ],
          },
          {
            $or: [
              {
                pendingRenewalPaymentReference: {
                  $exists: true,
                  $ne: null,
                },
              },
              {
                currentPeriodEnd: {
                  $lte: new Date(now.getTime() + DAY),
                },
              },
            ],
          },
        ],
      };

  return Subscription.findOneAndUpdate(
    {
      business: businessId,
      suspended: false,
      cancelAtPeriodEnd: false,
      setupStatus: { $ne: 'unpaid' },
      'authorization.code': { $exists: true, $ne: null },
      $and: [
        lockAvailable,
        eligibility,
      ],
    },
    {
      $set: {
        renewalLockUntil: new Date(now.getTime() + LOCK_DURATION),
      },
    },
    { new: true },
  );
}

async function deferVerification(
  sub,
  reference,
  reason = 'verification_pending',
) {
  await Subscription.updateOne(
    { _id: sub._id },
    {
      $set: {
        renewalStatus: 'retry_required',
        nextRenewalRetryAt: new Date(
          Date.now() + VERIFY_RETRY_DELAY,
        ),
        ...(reference
          ? { pendingRenewalPaymentReference: reference }
          : {}),
        lastRenewalFailureReason: reason,
      },
    },
  );
}

/**
 * A transaction reported as successful but failed verification checks
 * must be quarantined. Preserve its reference and do not create another
 * charge automatically.
 *
 * Manual retries may re-check this same reference, but cannot create
 * a replacement charge while the reference remains pending.
 */
async function quarantineRenewalPayment(
  sub,
  reference,
  reason = 'payment_verification_mismatch_needs_review',
) {
  await Subscription.updateOne(
    { _id: sub._id },
    {
      $set: {
        renewalStatus: 'retry_required',
        lastRenewalFailureAt: new Date(),
        lastRenewalFailureReason: reason,
        nextRenewalRetryAt: new Date(
          Date.now() + REVIEW_RETRY_DELAY,
        ),
        pendingRenewalPaymentReference: reference,
      },
    },
  );
}

async function recordRenewalFailure(
  sub,
  reason = 'charge_failed',
) {
  await Subscription.updateOne(
    { _id: sub._id },
    {
      $set: {
        renewalStatus: 'retry_required',
        lastRenewalFailureAt: new Date(),
        lastRenewalFailureReason: reason,
        nextRenewalRetryAt: new Date(
          Date.now() + CHARGE_RETRY_DELAY,
        ),
      },
      $unset: {
        pendingRenewalPaymentReference: 1,
      },
      $inc: {
        failedRenewals: 1,
      },
    },
  );
}

/**
 * Verify an existing payment reference.
 * Never assume a network error means a payment failed.
 */
async function verifyRenewalPayment(sub, reference) {
  const { verifyAndApply } = await import('./payments.js');

  try {
    const result = await verifyAndApply(reference);

    if (
      result.result === 'success' ||
      result.result === 'already_processed'
    ) {
      return 'success';
    }

    if (result.result === 'pending_application') {
      await deferVerification(
        sub,
        reference,
        'payment_application_pending',
      );

      return 'pending';
    }

    if (result.result === 'rejected') {
      await quarantineRenewalPayment(
        sub,
        reference,
        result.reason || 'payment_verification_mismatch_needs_review',
      );

      return 'review';
    }

    if (result.result === 'failed') {
      await recordRenewalFailure(
        sub,
        result.reason || 'payment_failed',
      );

      return 'failed';
    }

    await deferVerification(sub, reference);

    return 'pending';
  } catch (error) {
    await deferVerification(
      sub,
      reference,
      'verification_error',
    );

    return 'pending';
  }
}

async function processLockedRenewal(sub, now = new Date()) {
  const { initPaymentFor } = await import('./payments.js');
  const { chargeAuthorization } = await import('../lib/paystack.js');

  // Always reconcile an existing payment before creating another.
  if (sub.pendingRenewalPaymentReference) {
    const existingPayment = await Payment.findOne({
      reference: sub.pendingRenewalPaymentReference,
      business: sub.business,
      purpose: 'subscription',
    });

    if (!existingPayment) {
      // Unknown payment state: preserve the reference.
      // Never risk a duplicate charge.
      await deferVerification(
        sub,
        sub.pendingRenewalPaymentReference,
        'payment_record_not_found',
      );

      return;
    }

    if (existingPayment.status === 'success') {
      await verifyRenewalPayment(
        sub,
        existingPayment.reference,
      );

      return;
    }

    if (
      ['failed', 'abandoned'].includes(existingPayment.status)
    ) {
      if (
        VERIFICATION_MISMATCH_REASONS.has(
          existingPayment.failureReason,
        )
      ) {
        await quarantineRenewalPayment(
          sub,
          existingPayment.reference,
          existingPayment.failureReason,
        );

        return;
      }

      await recordRenewalFailure(
        sub,
        existingPayment.failureReason || existingPayment.status,
      );

      return;
    }

    await verifyRenewalPayment(
      sub,
      existingPayment.reference,
    );

    return;
  }

  const latestSub = await Subscription.findById(sub._id);

  if (!latestSub) return;

  if (latestSub.pendingRenewalPaymentReference) return;

  if (
    latestSub.cancelAtPeriodEnd ||
    latestSub.suspended ||
    latestSub.setupStatus === 'unpaid'
  ) {
    return;
  }

  const plan = await Plan.findById(
    latestSub.scheduledPlan || latestSub.plan,
  );

  if (!plan || !plan.monthlyFee || plan.monthlyFee <= 0) {
    await recordRenewalFailure(
      latestSub,
      'invalid_plan_amount',
    );

    return;
  }

  if (!latestSub.authorization?.code) return;

  const payment = await initPaymentFor({
    business: latestSub.business,
    purpose: 'subscription',
    amount: plan.monthlyFee,
    meta: {
      planId: plan._id,
      renewal: true,
    },
  });

  // Save the reference before contacting Paystack.
  await Subscription.updateOne(
    { _id: latestSub._id },
    {
      $set: {
        pendingRenewalPaymentReference: payment.reference,
        lastRenewalAttemptAt: now,
        renewalStatus: 'retry_required',
      },
    },
  );

  try {
    await chargeAuthorization({
      authorization_code: latestSub.authorization.code,
      email: latestSub.authorization.email,
      amount: plan.monthlyFee,
      currency: 'NGN',
      reference: payment.reference,
    });
  } catch (error) {
    // A timeout does not prove the charge failed.
    // The existing reference will be verified below.
  }

  await verifyRenewalPayment(
    latestSub,
    payment.reference,
  );
}

async function runRenewal(
  businessId,
  now = new Date(),
  manual = false,
) {
  const sub = await acquireRenewalLock(
    businessId,
    now,
    manual,
  );

  if (!sub) {
    return {
      attempted: false,
      reason: 'not_due_or_locked',
    };
  }

  try {
    await processLockedRenewal(sub, now);

    return {
      attempted: true,
    };
  } catch (error) {
    const current = await Subscription.findById(sub._id);

    if (current?.pendingRenewalPaymentReference) {
      await deferVerification(
        current,
        current.pendingRenewalPaymentReference,
        'renewal_processing_error',
      );
    } else {
      await recordRenewalFailure(
        sub,
        'renewal_processing_error',
      );
    }

    return {
      attempted: true,
      error: true,
    };
  } finally {
    await Subscription.updateOne(
      { _id: sub._id },
      {
        $unset: {
          renewalLockUntil: 1,
        },
      },
    );
  }
}

/**
 * Scheduler entry point.
 */
export async function expireAndRenewDue(now = new Date()) {
  const candidates = await Subscription.find({
    suspended: false,
    cancelAtPeriodEnd: false,
    setupStatus: { $ne: 'unpaid' },
    'authorization.code': { $exists: true, $ne: null },
    $or: [
      {
        pendingRenewalPaymentReference: {
          $exists: true,
          $ne: null,
        },
      },
      {
        currentPeriodEnd: {
          $lte: new Date(now.getTime() + DAY),
        },
      },
    ],
    $and: [
      {
        $or: [
          { nextRenewalRetryAt: { $exists: false } },
          { nextRenewalRetryAt: null },
          { nextRenewalRetryAt: { $lte: now } },
        ],
      },
      {
        $or: [
          { renewalLockUntil: { $exists: false } },
          { renewalLockUntil: null },
          { renewalLockUntil: { $lte: now } },
        ],
      },
    ],
  }).select('business');

  let attempted = 0;

  for (const candidate of candidates) {
    const result = await runRenewal(
      candidate.business,
      now,
    );

    if (result.attempted) {
      attempted += 1;
    }
  }

  return { attempted };
}

/**
 * Manual retry entry point for the billing API.
 */
export async function retrySubscriptionRenewal(businessId) {
  const result = await runRenewal(
    businessId,
    new Date(),
    true,
  );

  if (!result.attempted) {
    return {
      ok: false,
      reason: result.reason,
    };
  }

  const sub = await Subscription.findOne({
    business: businessId,
  });

  return {
    ok: true,
    renewalStatus: sub?.renewalStatus || 'current',
    pending: !!sub?.pendingRenewalPaymentReference,
    nextRetryAt: sub?.nextRenewalRetryAt || null,
  };
}