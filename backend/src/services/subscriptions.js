import { Plan, Subscription, Payment, Business } from '../models/index.js';
import { computeSubscriptionState, hasAccess, nextPeriodEnd, featureAllowed } from '../lib/subscriptionRules.js';
import { getSettings } from './settings.js';
import { notFound } from '../lib/errors.js';
import { audit } from './audit.js';

const NGN = (n) => n * 100;
const BASE = ['online_store', 'products', 'orders', 'basic_reports'];
const BUSINESS = [...BASE, 'pos', 'shared_inventory', 'stock_movements', 'low_stock', 'customers', 'suppliers', 'purchasing', 'enhanced_reports'];

export const DEFAULT_PLANS = [
  { key: 'online_store', name: 'Online Store', description: 'A professional storefront with product management and online orders.', setupFee: NGN(250000), monthlyFee: NGN(15000), features: BASE, limits: { products: 200, staff: 1 }, sortOrder: 1 },
  { key: 'store_business', name: 'Store + Business Management', description: 'Everything in Online Store plus an integrated POS and shared inventory.', setupFee: NGN(450000), monthlyFee: NGN(30000), features: BUSINESS, limits: { products: 2000, staff: 5 }, sortOrder: 2 },
  { key: 'advanced', name: 'Advanced Business', description: 'Everything in Store + Business Management with higher limits and priority support.', setupFee: NGN(750000), monthlyFee: NGN(50000), priceIsFrom: true, features: [...BUSINESS, 'priority_support'], limits: { products: -1, staff: -1 }, sortOrder: 3 },
];

export async function ensureDefaultPlans() {
  for (const p of DEFAULT_PLANS) await Plan.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
}

export async function createSubscription(businessId, planKey) {
  const plan = await Plan.findOne({ key: planKey, active: true });
  if (!plan) throw notFound('Plan not found');
  return Subscription.create({ business: businessId, plan: plan._id });
}

export async function getAccess(businessId) {
  const sub = await Subscription.findOne({ business: businessId });
  if (!sub) return { sub: null, plan: null, state: 'none', access: false };
  const [plan, settings] = await Promise.all([Plan.findById(sub.plan), getSettings()]);
  const state = computeSubscriptionState(sub, plan, new Date(), settings.graceDays);
  return { sub, plan, state, access: hasAccess(state), settings };
}

export async function hasFeature(businessId, feature) {
  const { sub, plan, access } = await getAccess(businessId);
  if (!access) return false;
  return featureAllowed(plan, feature, sub?.override);
}

/** Called only after Payment has been verified server-side and claimed. Idempotent per payment. */
export async function applySubscriptionPayment(payment, tx) {
  const sub = await Subscription.findOne({ business: payment.business });
  if (!sub) return;
  if (sub.lastAppliedPaymentReference === payment.reference) return;
  const planId = payment.meta?.planId;
  if (payment.purpose === 'setup_fee') {
    sub.setupStatus = 'paid'; sub.setupPaidAt = new Date();
    if (planId && String(sub.pendingPlan) === String(planId)) { sub.plan = sub.pendingPlan; sub.pendingPlan = undefined; }
  } else if (payment.purpose === 'subscription') {
    sub.currentPeriodEnd = nextPeriodEnd(sub.currentPeriodEnd);
    sub.failedRenewals = 0; sub.status = 'active'; sub.cancelAtPeriodEnd = false;
    if (sub.scheduledPlan) { sub.plan = sub.scheduledPlan; sub.scheduledPlan = undefined; }
    const a = tx?.authorization;
    if (a?.authorization_code && a.reusable) sub.authorization = { code: a.authorization_code, email: tx.customer?.email, reusable: true, last4: a.last4, brand: a.brand };
  }
  sub.lastAppliedPaymentReference = payment.reference;
  await sub.save();
  await audit({ actorType: 'system', action: `billing.${payment.purpose}_applied`, business: payment.business, related: { kind: 'Payment', id: payment._id }, meta: { amount: payment.amount } });
}

export async function expireAndRenewDue(now = new Date()) {
  const { initPaymentFor, verifyAndApply } = await import('./payments.js');
  const { chargeAuthorization } = await import('../lib/paystack.js');
  const subs = await Subscription.find({ suspended: false, 'authorization.code': { $exists: true }, cancelAtPeriodEnd: false, currentPeriodEnd: { $lte: new Date(now.getTime() + 86400000) } });
  let attempted = 0;
  for (const sub of subs) {
    if (sub.lastRenewalAttemptAt && now - sub.lastRenewalAttemptAt < 86400000) continue;
    if (sub.setupStatus === 'unpaid') continue;
    const plan = await Plan.findById(sub.scheduledPlan || sub.plan);
    sub.lastRenewalAttemptAt = now; attempted++;
    const payment = await initPaymentFor({ business: sub.business, purpose: 'subscription', amount: plan.monthlyFee, meta: { planId: plan._id, renewal: true } });
    try {
      const res = await chargeAuthorization({ authorization_code: sub.authorization.code, email: sub.authorization.email, amount: plan.monthlyFee, currency: 'NGN', reference: payment.reference });
      if (res.data?.status === 'success') await verifyAndApply(payment.reference);
      else { await Payment.updateOne({ _id: payment._id }, { status: 'failed', failureReason: res.data?.gateway_response || 'charge_failed' }); sub.failedRenewals += 1; }
    } catch (e) {
      await Payment.updateOne({ _id: payment._id }, { status: 'failed', failureReason: 'charge_error' }); sub.failedRenewals += 1;
    }
    await sub.save();
  }
  return { attempted };
}
