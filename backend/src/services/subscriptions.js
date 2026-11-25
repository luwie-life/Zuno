
import { Plan, Subscription, Payment, Business, User } from '../models/index.js';
import {
  computeSubscriptionState,
  hasAccess,
  nextPeriodEnd,
  featureAllowed,
} from '../lib/subscriptionRules.js';
import { getSettings } from './settings.js';
import { notFound } from '../lib/errors.js';
import { audit } from './audit.js';
import { sendMail } from './mailer.js';

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
    key: 'free',
    name: 'Free',
    description: 'Get started with Zuno at no monthly cost.',
    setupFee: 0,
    monthlyFee: 0,
    features: [],
    limits: { products: 0, staff: 0, services: 0, bookings: 0 },
    sortOrder: 0,
  },
  {
    key: 'starter',
    name: 'Starter',
    description: 'Establish your online business presence.',
    setupFee: 0,
    monthlyFee: NGN(5000),
    features: BASE,
    limits: { products: 200, staff: 1, services: 200, bookings: -1 },
    sortOrder: 1,
  },
  {
    key: 'growth',
    name: 'Growth',
    description: 'More tools to manage and grow your business.',
    setupFee: 0,
    monthlyFee: NGN(10000),
    features: BUSINESS,
    limits: { products: 2000, staff: 5, services: 2000, bookings: -1 },
    sortOrder: 2,
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'The complete Zuno experience for growing businesses.',
    setupFee: 0,
    monthlyFee: NGN(20000),
    features: [...BUSINESS, 'priority_support'],
    limits: { products: -1, staff: -1, services: -1, bookings: -1 },
    sortOrder: 3,
  },
];

export async function ensureDefaultPlans() {
  for (const plan of DEFAULT_PLANS) {
    await Plan.updateOne(
      { key: plan.key },
      {
        $setOnInsert: {
          ...plan,
          active: true,
          priceIsFrom: false,
        },
      },
      { upsert: true },
    );
  }
}

export async function createSubscription(businessId, planKey = 'free') {
  const plan = await Plan.findOne({
    key: planKey,
    active: true,
  });

  if (!plan) throw notFound('Plan not found');

  const existing = await Subscription.findOne({
    business: businessId,
  });

  if (existing) return existing;

  const subscription = await Subscription.create({
    business: businessId,
    plan: plan._id,
    setupStatus: 'waived',
    status: 'active',
    ...(Number(plan.monthlyFee) === 0
      ? { currentPeriodEnd: undefined }
      : {}),
  });

  return subscription;
}

export async function getAccess(businessId) {
  const sub = await Subscription.findOne({
    business: businessId,
  });

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
export async function applySubscriptionPayment(payment) {
  const sub = await Subscription.findOne({
    business: payment.business,
  });

  if (!sub) return;

  if (sub.lastAppliedPaymentReference === payment.reference) return;

  if (payment.purpose === 'setup_fee') {
    // Historical setup-fee payments remain readable.
    // They must not trigger a new plan transition.
    sub.setupStatus = 'waived';
  } else if (payment.purpose === 'subscription') {
    const paidPlanId = payment.meta?.planId;

    if (paidPlanId) {
      const paidPlan = await Plan.findById(paidPlanId);

      if (!paidPlan || Number(paidPlan.monthlyFee) <= 0) {
        throw new Error('Invalid subscription plan payment.');
      }

      sub.plan = paidPlan._id;
    }

    sub.currentPeriodEnd = nextPeriodEnd(sub.currentPeriodEnd);
    sub.failedRenewals = 0;
    sub.status = 'active';
    sub.cancelAtPeriodEnd = false;
    sub.scheduledPlan = undefined;
    sub.pendingPlan = undefined;
    sub.setupStatus = 'waived';

    // Zuno subscriptions renew manually. Remove any legacy
    // reusable authorization rather than saving new card details.
    sub.authorization = undefined;

    sub.renewalStatus = 'current';
    sub.lastRenewalFailureAt = undefined;
    sub.lastRenewalFailureReason = undefined;
    sub.nextRenewalRetryAt = undefined;
    sub.pendingRenewalPaymentReference = undefined;
    sub.renewalLockUntil = undefined;
  } else {
    return;
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

  if (['setup_fee', 'subscription'].includes(payment.purpose)) {
    const business = await Business.findById(payment.business).select('name email owner');
    const owner = business && await User.findById(business.owner).select('name email');
    const recipient = business?.email || owner?.email;

    if (recipient) {
      await sendMail({
        user: owner?._id,
        to: recipient,
        template: 'subscription_payment',
        subject: `Payment confirmed for ${business.name}`,
        text: `Your ${payment.purpose === 'setup_fee' ? 'setup fee' : 'subscription'} payment for ${business.name} has been verified. Reference: ${payment.reference}.`,
      });
    }
  }
}

/**
 * Apply scheduled Free downgrades at the end of the paid period.
 * No Paystack request is made for a zero-cost plan.
 */
async function applyScheduledFreeDowngrades(now = new Date()) {
  const graceCutoff = new Date(
  now.getTime() - 7 * 24 * 60 * 60 * 1000,
);
  const candidates = await Subscription.find({
    scheduledPlan: { $exists: true, $ne: null },
   currentPeriodEnd: { $lte: graceCutoff },
    suspended: false,
    cancelAtPeriodEnd: false,
    pendingRenewalPaymentReference: { $in: [null, ''] },
  }).select('_id business scheduledPlan');

  let applied = 0;

  for (const candidate of candidates) {
    const targetPlan = await Plan.findById(candidate.scheduledPlan);

    if (!targetPlan || Number(targetPlan.monthlyFee) !== 0) {
      continue;
    }

    const result = await Subscription.updateOne(
{
  _id: candidate._id,
  scheduledPlan: targetPlan._id,
  currentPeriodEnd: { $lte: graceCutoff },
  pendingRenewalPaymentReference: { $in: [null, ''] },
  $or: [
    { checkoutLockUntil: { $exists: false } },
    { checkoutLockUntil: null },
    { checkoutLockUntil: { $lte: now } },
  ],
},
      {
        $set: {
          plan: targetPlan._id,
          setupStatus: 'waived',
          status: 'active',
          renewalStatus: 'current',
          failedRenewals: 0,
          cancelAtPeriodEnd: false,
        },
        $unset: {
          scheduledPlan: 1,
          pendingPlan: 1,
          currentPeriodEnd: 1,
          lastRenewalFailureAt: 1,
          lastRenewalFailureReason: 1,
          nextRenewalRetryAt: 1,
          renewalLockUntil: 1,
          pendingRenewalPaymentReference: 1,
        },
      },
    );

    if (result.modifiedCount) {
      applied += 1;

      await audit({
        actorType: 'system',
        action: 'billing.free_downgrade_applied',
        business: candidate.business,
        related: {
          kind: 'Plan',
          id: targetPlan._id,
        },
        meta: {
          plan: targetPlan.key,
        },
      });
    }
  }

  return applied;
}


async function sendRenewalReminders(now = new Date()) {
  const candidates = await Subscription.find({
    currentPeriodEnd: { $exists: true, $ne: null },
    suspended: { $ne: true },
    cancelAtPeriodEnd: { $ne: true },
    status: { $ne: 'cancelled' },
    pendingRenewalPaymentReference: { $in: [null, ''] },
  }).select('_id business plan currentPeriodEnd');

  const stages = [
    {
      marker: 'renewalReminder7DayFor',
      lock: 'renewalReminder7DayLockUntil',
      start: -7 * DAY,
      end: -3 * DAY,
      subject: 'Your Zuno subscription expires in 7 days',
      message: 'Your subscription expires in 7 days.',
    },
    {
      marker: 'renewalReminder3DayFor',
      lock: 'renewalReminder3DayLockUntil',
      start: -3 * DAY,
      end: 0,
      subject: 'Your Zuno subscription expires in 3 days',
      message: 'Your subscription expires in 3 days.',
    },
    {
      marker: 'renewalReminderExpiryFor',
      lock: 'renewalReminderExpiryLockUntil',
      start: 0,
      end: 3 * DAY,
      subject: 'Your Zuno subscription expires today',
      message: 'Your subscription period has ended today.',
    },
    {
      marker: 'renewalReminderGraceFor',
      lock: 'renewalReminderGraceLockUntil',
      start: 3 * DAY,
      end: 7 * DAY,
      subject: 'Your Zuno subscription grace period is ending',
      message: 'Your subscription is in its 7-day grace period. Renew now to keep your business active on Zuno.',
    },
  ];

  const CLAIM_DURATION = 5 * 60 * 1000;
  let sent = 0;

  for (const sub of candidates) {
    const periodEnd = new Date(sub.currentPeriodEnd);
    const elapsed = now.getTime() - periodEnd.getTime();

    const stage = stages.find(
      (item) => elapsed >= item.start && elapsed < item.end,
    );

    if (!stage) continue;

    const [plan, business] = await Promise.all([
      Plan.findById(sub.plan).select('name monthlyFee'),
      Business.findById(sub.business).select('name email owner'),
    ]);

    if (!plan || Number(plan.monthlyFee) <= 0 || !business) {
      continue;
    }

    const owner = business.owner
      ? await User.findById(business.owner).select('name email')
      : null;

    const recipient = business.email || owner?.email;

    if (!recipient) continue;

    // Acquire a temporary lease. Another maintenance process
    // cannot claim the same reminder while this lease is active.
    const leaseUntil = new Date(now.getTime() + CLAIM_DURATION);

    const claimed = await Subscription.updateOne(
      {
        _id: sub._id,
        currentPeriodEnd: periodEnd,
        [stage.marker]: { $ne: periodEnd },
        $or: [
          { [stage.lock]: { $exists: false } },
          { [stage.lock]: null },
          { [stage.lock]: { $lte: now } },
        ],
      },
      {
        $set: {
          [stage.lock]: leaseUntil,
        },
      },
    );

    if (!claimed.modifiedCount) continue;

    const releaseLease = async () => {
      await Subscription.updateOne(
        {
          _id: sub._id,
          currentPeriodEnd: periodEnd,
          [stage.lock]: leaseUntil,
        },
        {
          $unset: {
            [stage.lock]: 1,
          },
        },
      );
    };

    const monthlyFee = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(Number(plan.monthlyFee) / 100);

    try {
      const result = await sendMail({
        user: owner?._id,
        to: recipient,
        template: 'subscription_reminder',
        subject: stage.subject,
        text: [
          `Hello ${owner?.name || 'there'},`,
          '',
          stage.message,
          '',
          `Business: ${business.name}`,
          `Plan: ${plan.name}`,
          `Monthly subscription: ${monthlyFee}`,
          `Subscription period ends: ${periodEnd.toLocaleDateString('en-NG')}`,
          '',
          'To keep your subscription active, sign in to your Zuno dashboard and open Billing to renew.',
          'Zuno will not automatically charge your saved payment method.',
        ].join('\n'),
      });

      if (result?.sent) {
        // Record successful delivery only if this process
        // still owns the lease.
        const completed = await Subscription.updateOne(
          {
            _id: sub._id,
            currentPeriodEnd: periodEnd,
            [stage.marker]: { $ne: periodEnd },
            [stage.lock]: leaseUntil,
          },
          {
            $set: {
              [stage.marker]: periodEnd,
            },
            $unset: {
              [stage.lock]: 1,
            },
          },
        );

        if (completed.modifiedCount) {
          sent += 1;
        }
      } else {
        await releaseLease();
      }
    } catch (error) {
      await releaseLease();

      console.error(
        'subscription reminder email failed',
        sub._id,
        error.message,
      );
    }
  }

  return sent;
}


/**
 * Subscription maintenance.
 *
 * This job never creates a payment or charges a saved authorization.
 * It only reconciles subscription payments already initiated by merchants
 * and applies scheduled Free-plan downgrades.
 */
export async function runSubscriptionMaintenance(now = new Date()) {
  const freeDowngrades = await applyScheduledFreeDowngrades(now);
  const renewalReminders = await sendRenewalReminders(now);
  const candidates = await Subscription.find({
    pendingRenewalPaymentReference: {
      $exists: true,
      $nin: [null, ''],
    },
  }).select('_id business pendingRenewalPaymentReference');

  let checked = 0;
  let resolved = 0;
  let pending = 0;
  let missing = 0;

  const clearPendingReference = async (sub, reference) => {
    await Subscription.updateOne(
      {
        _id: sub._id,
        pendingRenewalPaymentReference: reference,
      },
      {
        $unset: {
          pendingRenewalPaymentReference: 1,
          renewalLockUntil: 1,
        },
      },
    );
  };

  for (const sub of candidates) {
    const reference = sub.pendingRenewalPaymentReference;

    const payment = await Payment.findOne({
      reference,
      business: sub.business,
      purpose: 'subscription',
    });

    if (!payment) {
      await clearPendingReference(sub, reference);
      missing += 1;

      await audit({
        actorType: 'system',
        action: 'billing.pending_payment_reference_cleared',
        business: sub.business,
        related: {
          kind: 'Subscription',
          id: sub._id,
        },
        meta: {
          reason: 'payment_record_not_found',
        },
      });

      continue;
    }

    if (['failed', 'abandoned'].includes(payment.status)) {
      await clearPendingReference(sub, reference);
      resolved += 1;

      await audit({
        actorType: 'system',
        action: 'billing.pending_payment_reference_cleared',
        business: sub.business,
        related: {
          kind: 'Payment',
          id: payment._id,
        },
        meta: {
          reason: payment.status,
        },
      });

      continue;
    }

    checked += 1;

    try {
      const { verifyAndApply } = await import('./payments.js');

      const result = await verifyAndApply(reference, {
        expectedContext: 'platform',
      });

      if (
        ['success', 'already_processed', 'failed', 'rejected'].includes(
          result.result,
        )
      ) {
        await clearPendingReference(sub, reference);
        resolved += 1;
      } else {
        // Pending verification/application stays attached to this
        // reference. Never create another payment automatically.
        pending += 1;
      }
    } catch (error) {
      // A temporary verification error is not proof of payment failure.
      // Keep the reference so the same payment can be checked later.
      pending += 1;

      console.error(
        'subscription payment reconciliation failed',
        reference,
        error.message,
      );
    }
  }

  // Remove reusable authorizations left behind by the previous
  // automatic-renewal implementation.
  const legacyAuthorizations = await Subscription.updateMany(
    {
      'authorization.code': {
        $exists: true,
        $ne: null,
      },
    },
    {
      $unset: {
        authorization: 1,
      },
    },
  );

  return {
    freeDowngrades,
    renewalReminders,
    checked,
    resolved,
    pending,
    missing,
    legacyAuthorizationsCleared:
      legacyAuthorizations.modifiedCount || 0,
  };
}