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
const planView = (p) => ({ id: p._id, key: p.key, name: p.name, description: p.description, setupFee: p.setupFee, monthlyFee: p.monthlyFee, priceIsFrom: p.priceIsFrom, features: p.features, limits: p.limits });

// Public: plan list for pricing page.
r.get('/plans', asyncH(async (req, res) => res.json({ plans: (await Plan.find({ active: true }).sort('sortOrder')).map(planView) })));

r.use(requireAuth);
r.get('/', requireBusiness('billing.manage', { allowSuspended: true }), asyncH(async (req, res) => {
  const { sub, plan, state } = await getAccess(req.business._id);
  const [plans, payments, pendingPlan, scheduledPlan] = await Promise.all([
    Plan.find({ active: true }).sort('sortOrder'),
    Payment.find({ business: req.business._id, purpose: { $in: ['setup_fee', 'subscription'] } }).sort('-createdAt').limit(50).select('purpose amount status reference verifiedAt createdAt'),
    sub?.pendingPlan ? Plan.findById(sub.pendingPlan) : null, sub?.scheduledPlan ? Plan.findById(sub.scheduledPlan) : null,
  ]);
  res.json({ state, plan: plan && planView(plan), pendingPlan: pendingPlan && planView(pendingPlan), scheduledPlan: scheduledPlan && planView(scheduledPlan), setupStatus: sub?.setupStatus, currentPeriodEnd: sub?.currentPeriodEnd, cancelAtPeriodEnd: sub?.cancelAtPeriodEnd, card: sub?.authorization?.last4 ? { last4: sub.authorization.last4, brand: sub.authorization.brand } : null, plans: plans.map(planView), payments });
}));

// Amount is ALWAYS taken from the plan record, never from the request.
r.post('/checkout', requireBusiness('billing.manage', { allowSuspended: true }), asyncH(async (req, res) => {
  const { purpose } = parse(z.object({ purpose: z.enum(['setup_fee', 'subscription']) }), req.body);
  const sub = await Subscription.findOne({ business: req.business._id });
  if (!sub) throw notFound('No subscription found');
  const plan = await Plan.findById(sub.pendingPlan && purpose === 'setup_fee' ? sub.pendingPlan : (sub.scheduledPlan && purpose === 'subscription' ? sub.scheduledPlan : sub.plan));
  let amount;
  if (purpose === 'setup_fee') {
    if (sub.pendingPlan) { const cur = await Plan.findById(sub.plan); amount = Math.max(0, plan.setupFee - (sub.setupStatus === 'paid' ? cur.setupFee : 0)); }
    else { if (sub.setupStatus !== 'unpaid') throw conflict('Setup fee is already settled.'); amount = plan.setupFee; }
    if (amount === 0) throw conflict('Nothing to pay for setup.');
  } else {
    if (sub.setupStatus === 'unpaid' && plan.setupFee > 0) throw conflict('Pay the setup fee first. Setup and monthly fees are separate payments.');
    amount = plan.monthlyFee;
  }
  const { payment, authorizationUrl } = await startPayment({ business: req.business._id, purpose, amount, email: req.user.email, meta: { planId: plan._id }, callbackUrl: `${env.frontendUrl}/app/billing` });
  await audit({ req, action: 'billing.checkout_started', business: req.business._id, related: { kind: 'Payment', id: payment._id }, meta: { purpose, amount } });
  res.status(201).json({ authorizationUrl, reference: payment.reference, amount });
}));

r.get('/verify', requireBusiness('billing.manage', { allowSuspended: true }), asyncH(async (req, res) => {
  const payment = await Payment.findOne({ reference: String(req.query.reference || ''), business: req.business._id, purpose: { $in: ['setup_fee', 'subscription'] } });
  if (!payment) throw notFound('Payment not found');
  const out = await verifyAndApply(payment.reference, { expectedContext: 'platform' });
  res.json({ result: out.result, reason: out.reason });
}));

r.post('/change-plan', requireBusiness('billing.manage', { allowSuspended: true }), asyncH(async (req, res) => {
  const { planKey } = parse(z.object({ planKey: z.string() }), req.body);
  const [sub, next] = await Promise.all([Subscription.findOne({ business: req.business._id }), Plan.findOne({ key: planKey, active: true })]);
  if (!sub || !next) throw notFound('Plan not found');
  const cur = await Plan.findById(sub.plan);
  if (String(cur._id) === String(next._id)) throw bad('You are already on this plan.');
  if (sub.setupStatus === 'unpaid') { sub.plan = next._id; sub.pendingPlan = undefined; sub.scheduledPlan = undefined; }       // nothing paid yet: just switch
  else if (next.sortOrder > cur.sortOrder) { sub.pendingPlan = next._id; sub.scheduledPlan = undefined; }                    // upgrade: effective after setup-fee difference is paid
  else { sub.scheduledPlan = next._id; sub.pendingPlan = undefined; }                                                         // downgrade: effective at next renewal
  await sub.save();
  await audit({ req, action: 'billing.plan_change_requested', business: req.business._id, meta: { from: cur.key, to: next.key } });
  res.json({ ok: true, upgrade: !!sub.pendingPlan, downgradeAtPeriodEnd: !!sub.scheduledPlan });
}));

r.post('/cancel', requireBusiness('billing.manage', { allowSuspended: true }), asyncH(async (req, res) => {
  const { cancel } = parse(z.object({ cancel: z.boolean() }), req.body);
  await Subscription.updateOne({ business: req.business._id }, { cancelAtPeriodEnd: cancel, ...(cancel ? {} : { status: 'active' }) });
  await audit({ req, action: cancel ? 'billing.cancel_scheduled' : 'billing.cancel_reverted', business: req.business._id });
  res.json({ ok: true, note: 'Your data is kept. Access ends when the paid period finishes.' });
}));

export default r;
