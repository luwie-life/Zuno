import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { Plan, Subscription, Payment } from '../models/index.js';
import { asyncH, bad, notFound, conflict } from '../lib/errors.js';
import { parse, z } from '../lib/validate.js';
import { requireAuth, requireBusiness } from '../middleware/auth.js';
import { getAccess } from '../services/subscriptions.js';
import { startPayment, verifyAndApply } from '../services/payments.js';
import { env } from '../config/env.js';
import { audit } from '../services/audit.js';

const r = Router();

const planView = (p) => ({
  id: p._id,
  key: p.key,
  name: p.name,
  description: p.description,
  setupFee: 0,
  monthlyFee: p.monthlyFee,
  priceIsFrom: p.priceIsFrom,
  features: p.features,
  limits: p.limits,
});

// Public: plans for the pricing page.
r.get('/plans', asyncH(async (req, res) => {
  const plans = await Plan.find({
    active: true,
    key: { $in: ['free', 'starter', 'growth', 'pro'] },
  }).sort('sortOrder');

  res.json({
    plans: plans.map(planView),
  });
}));

r.use(requireAuth);

// Current billing information.
r.get(
  '/',
  requireBusiness('billing.manage', { allowSuspended: true }),
  asyncH(async (req, res) => {
    const { sub, plan, state } = await getAccess(req.business._id);

    const [
      plans,
      payments,
      pendingPlan,
      scheduledPlan,
    ] = await Promise.all([
      Plan.find({ active: true }).sort('sortOrder'),
      Payment.find({
        business: req.business._id,
        purpose: { $in: ['setup_fee', 'subscription'] },
      })
        .sort('-createdAt')
        .limit(50)
        .select('purpose amount status reference verifiedAt createdAt failureReason'),
      sub?.pendingPlan ? Plan.findById(sub.pendingPlan) : null,
      sub?.scheduledPlan ? Plan.findById(sub.scheduledPlan) : null,
    ]);

    res.json({
      state,
      plan: plan && planView(plan),
      pendingPlan: pendingPlan && planView(pendingPlan),
      scheduledPlan: scheduledPlan && planView(scheduledPlan),

      setupStatus: sub?.setupStatus,
      currentPeriodEnd: sub?.currentPeriodEnd,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd,

      pendingRenewalReference:
        sub?.pendingRenewalPaymentReference || null,

      plans: plans.map(planView),
      payments,
    });
  }),
);



// Start a subscription payment. Amount always comes from the Plan record.

// Start a subscription payment. Amount always comes from the Plan record.
r.post(
  '/checkout',
  requireBusiness('billing.manage', { allowSuspended: true }),
  asyncH(async (req, res) => {
    parse(
      z.object({
        purpose: z.literal('subscription'),
      }),
      req.body,
    );

const businessId = req.business._id;
const lockToken = randomUUID();
const lockNow = new Date();
const lockUntil = new Date(lockNow.getTime() + 5 * 60_000);

    // Atomically acquire the checkout lock. Only one request per
    // subscription can initialize a renewal checkout at a time.
const sub = await Subscription.findOneAndUpdate(
  {
    business: businessId,
    $or: [
      { checkoutLockUntil: { $exists: false } },
      { checkoutLockUntil: null },
      { checkoutLockUntil: { $lte: lockNow } },
    ],
  },
  {
    $set: {
      checkoutLockToken: lockToken,
      checkoutLockUntil: lockUntil,
    },
  },
  { new: true },
);

    if (!sub) {
      const existingSub = await Subscription.findOne({
        business: businessId,
      });

      if (!existingSub) throw notFound('No subscription found');

      throw conflict(
        'Another billing operation is in progress. Please wait and try again.',
      );
    }

    try {
      if (sub.pendingRenewalPaymentReference) {
        throw conflict(
          'A renewal payment is already being processed. Please wait while we verify it.',
        );
      }

      if (sub.scheduledPlan) {
        throw conflict(
          'Your plan change is scheduled for the end of your current billing period. No payment is required right now.',
        );
      }

      const unresolvedPayment = await Payment.findOne({
        business: businessId,
        purpose: 'subscription',
        status: 'initialized',
      }).sort('-createdAt');

      if (unresolvedPayment) {
        throw conflict(
          'You already have a subscription payment awaiting verification. Please verify it before starting another checkout.',
        );
      }

      const plan = await Plan.findById(sub.pendingPlan || sub.plan);

      if (!plan || !plan.active) {
        throw notFound('Plan not found or unavailable');
      }

      const amount = Number(plan.monthlyFee);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw conflict(
          'The Free plan does not require payment. Select a paid plan to continue.',
        );
      }

      const { payment, authorizationUrl } = await startPayment({
        business: businessId,
        purpose: 'subscription',
        amount,
        email: req.user.email,
        meta: {
          planId: plan._id,
          planKey: plan.key,
        },
        callbackUrl: `${env.frontendUrl}/app/billing`,
      });

      // Save the reference only while this request still owns the lock.
      const linked = await Subscription.updateOne(
        {
            _id: sub._id,
            checkoutLockToken: lockToken,
            pendingRenewalPaymentReference: { $in: [null, ''] },
          },
        {
          $set: {
            pendingRenewalPaymentReference: payment.reference,
          },
        },
      );

      if (!linked.modifiedCount) {
        throw new Error(
          'Could not link the initialized payment to the subscription.',
        );
      }

      await audit({
        req,
        action: 'billing.checkout_started',
        business: businessId,
        related: {
          kind: 'Payment',
          id: payment._id,
        },
        meta: {
          purpose: 'subscription',
          plan: plan.key,
          amount,
        },
      });

      res.status(201).json({
        authorizationUrl,
        reference: payment.reference,
        amount,
        plan: planView(plan),
      });
    } finally {
      // Release only the lock acquired by this request.
await Subscription.updateOne(
  { _id: sub._id, checkoutLockToken: lockToken },
  {
    $unset: {
      checkoutLockToken: 1,
      checkoutLockUntil: 1,
    },
  },
);
    }
  }),
);


// Server-side payment verification.
r.get(
  '/verify',
  requireBusiness('billing.manage', { allowSuspended: true }),
  asyncH(async (req, res) => {
    const payment = await Payment.findOne({
      reference: String(req.query.reference || ''),
      business: req.business._id,
      purpose: { $in: ['setup_fee', 'subscription'] },
    });

    if (!payment) throw notFound('Payment not found');

    const out = await verifyAndApply(payment.reference, {
      expectedContext: 'platform',
    });

    res.json({
      result: out.result,
      reason: out.reason,
    });
  }),
);


// Request a plan change.
r.post(
  '/change-plan',
  requireBusiness('billing.manage', { allowSuspended: true }),
  asyncH(async (req, res) => {
    const { planKey } = parse(
      z.object({
        planKey: z.string().min(1),
      }),
      req.body,
    );

    const businessId = req.business._id;
    const lockToken = randomUUID();
    const lockNow = new Date();
    const lockUntil = new Date(lockNow.getTime() + 5 * 60_000);

    const sub = await Subscription.findOneAndUpdate(
      {
        business: businessId,
        $or: [
          { checkoutLockUntil: { $exists: false } },
          { checkoutLockUntil: null },
          { checkoutLockUntil: { $lte: lockNow } },
        ],
      },
      {
        $set: {
          checkoutLockToken: lockToken,
          checkoutLockUntil: lockUntil,
        },
      },
      { new: true },
    );

    if (!sub) {
      const existingSub = await Subscription.findOne({
        business: businessId,
      });

      if (!existingSub) throw notFound('No subscription found');

      throw conflict(
        'Another billing operation is in progress. Please wait and try again.',
      );
    }

    try {
      const next = await Plan.findOne({
        key: planKey,
        active: true,
      });

      if (!next) throw notFound('Plan not found');

      if (sub.pendingRenewalPaymentReference) {
        throw conflict(
          'A renewal payment is being verified. Please wait before changing your plan.',
        );
      }

      const cur = await Plan.findById(sub.plan);

      if (!cur) throw notFound('Current plan not found');

      if (String(cur._id) === String(next._id)) {
        throw bad('You are already on this plan.');
      }

      const currentPrice = Number(cur.monthlyFee || 0);
      const nextPrice = Number(next.monthlyFee || 0);

      // Free-to-paid or paid-to-higher-tier changes require immediate checkout.
      if (nextPrice > currentPrice) {
        sub.pendingPlan = next._id;
        sub.scheduledPlan = undefined;
      } else {
        // Downgrades, including switching to Free, happen at period end.
        if (!sub.currentPeriodEnd) {
          sub.plan = next._id;
          sub.pendingPlan = undefined;
          sub.scheduledPlan = undefined;

          if (nextPrice === 0) {
            sub.status = 'active';
            sub.setupStatus = 'waived';
            sub.currentPeriodEnd = undefined;
          }
        } else {
          sub.scheduledPlan = next._id;
          sub.pendingPlan = undefined;
        }
      }

      await sub.save();

      await audit({
        req,
        action: 'billing.plan_change_requested',
        business: businessId,
        meta: {
          from: cur.key,
          to: next.key,
          immediate: String(sub.plan) === String(next._id),
          scheduled: String(sub.scheduledPlan) === String(next._id),
        },
      });

      res.json({
        ok: true,
        upgrade: !!sub.pendingPlan,
        downgradeAtPeriodEnd: !!sub.scheduledPlan,
        immediate: String(sub.plan) === String(next._id),
      });
    } finally {
      await Subscription.updateOne(
        { _id: sub._id, checkoutLockToken: lockToken },
        {
          $unset: {
            checkoutLockToken: 1,
            checkoutLockUntil: 1,
          },
        },
      );
    }
  }),
);


// Schedule or revert cancellation.
r.post(
  '/cancel',
  requireBusiness('billing.manage', { allowSuspended: true }),
  asyncH(async (req, res) => {
    const { cancel } = parse(
      z.object({
        cancel: z.boolean(),
      }),
      req.body,
    );

    await Subscription.updateOne(
      { business: req.business._id },
      {
        cancelAtPeriodEnd: cancel,
        ...(cancel ? {} : { status: 'active' }),
      },
    );

    await audit({
      req,
      action: cancel
        ? 'billing.cancel_scheduled'
        : 'billing.cancel_reverted',
      business: req.business._id,
    });

    res.json({
      ok: true,
      note: 'Your data is kept. Access ends when the paid period finishes.',
    });
  }),
);

export default r;
