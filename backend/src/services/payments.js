import { Payment, Order, Sale } from '../models/index.js';
import { newReference } from '../lib/tokens.js';
import { CURRENCY } from '../lib/money.js';
import { checkVerifiedTransaction } from '../lib/paystack.js';
import { notFound } from '../lib/errors.js';
import { audit } from './audit.js';
import { applySubscriptionPayment } from './subscriptions.js';
import { finalizeOrderPayment, failOrderPayment } from './orders.js';
import { finalizeSalePayment, failSalePayment } from './pos.js';
import { platformPaystack, resolveMerchantProvider, resolvePaymentProvider } from './paymentProviders.js';
import { HttpError } from '../lib/errors.js';

export async function initPaymentFor({ business, purpose, amount, target, meta }) {
  if (!['setup_fee', 'subscription', 'app_setup'].includes(purpose)) throw new Error('initPaymentFor is reserved for Zuno-owned platform charges.');
  return Payment.create({ business, purpose, amount, currency: CURRENCY, reference: newReference('ZP', 14), target, meta, provider: 'paystack', context: 'platform' });
}

/** Merchant sales and Zuno billing always use separate Paystack accounts. */
export async function startPayment({ business, purpose, amount, email, target, meta, callbackUrl }) {
  const merchantSale = ['storefront_order', 'pos_sale'].includes(purpose);
  let providerContext;
  if (merchantSale) {
    if (!business) throw new Error('Merchant payment requires a business.');
    const { adapter, gateway } = await resolveMerchantProvider(business, 'paystack');
    providerContext = { adapter, gateway, context: 'merchant' };
  } else if (['setup_fee', 'subscription', 'app_setup'].includes(purpose)) {
    providerContext = { adapter: platformPaystack(), gateway: null, context: 'platform' };
  } else throw new Error('Unsupported payment purpose.');

  const payment = await Payment.create({
    business, purpose, amount, currency: CURRENCY, reference: newReference('ZP', 14), target, meta,
    provider: 'paystack', gateway: providerContext.gateway?._id, context: providerContext.context,
  });
  try {
    const res = await providerContext.adapter.initialize({
      email, amount, currency: CURRENCY, reference: payment.reference, callback_url: callbackUrl,
      metadata: { purpose, business: String(business || '') },
    });
    if (!res.status || !res.data?.authorization_url) throw new Error(res.message || 'init_failed');
    return { payment, authorizationUrl: res.data.authorization_url };
  } catch (e) {
    await Payment.updateOne({ _id: payment._id }, { status: 'failed', failureReason: 'initialize_failed' });
    throw e;
  }
}

async function dispatch(payment, tx) {
  switch (payment.purpose) {
    case 'storefront_order': await finalizeOrderPayment(payment.target.id, payment); break;
    case 'pos_sale': await finalizeSalePayment(payment.target.id, payment); break;
    case 'setup_fee': case 'subscription': await applySubscriptionPayment(payment, tx); break;
    default: break;
  }
}

async function applyClaimed(payment, tx) {
  if (payment.applied) return false;
  const claim = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'success', applied: false, applyClaimedAt: { $exists: false } },
    { applyClaimedAt: new Date() }, { new: true },
  );
  if (!claim) return false;
  try {
    await dispatch(claim, tx);
    await Payment.updateOne({ _id: claim._id, applyClaimedAt: { $exists: true } }, { applied: true, $unset: { applyClaimedAt: 1 } });
    return true;
  } catch (error) {
    await Payment.updateOne({ _id: claim._id, applied: false }, { $unset: { applyClaimedAt: 1 } });
    throw error;
  }
}

async function validateMerchantPaymentTarget(payment) {
  if (payment.purpose === 'storefront_order') {
    const order = await Order.findOne({ _id: payment.target?.id, business: payment.business });
    if (!order || order.total !== payment.amount || (order.paymentReference && order.paymentReference !== payment.reference) || (payment.status === 'initialized' && order.paymentStatus !== 'pending')) throw new HttpError(409, 'The merchant order does not match this payment. No fulfillment was performed.', 'PAYMENT_ORDER_MISMATCH');
  } else if (payment.purpose === 'pos_sale') {
    const sale = await Sale.findOne({ _id: payment.target?.id, business: payment.business });
    if (!sale || sale.total !== payment.amount || sale.paymentMethod !== 'paystack' || (payment.status === 'initialized' && sale.paymentStatus !== 'pending') || (sale.paymentReference && sale.paymentReference !== payment.reference)) {
      throw new HttpError(409, 'The merchant sale does not match this payment. No fulfillment was performed.', 'PAYMENT_ORDER_MISMATCH');
    }
  }
}

/**
 * Server-side verification. Used by both the callback page and the webhook.
 * Safe to call repeatedly: only the first successful claim applies the payment.
 */
export async function verifyAndApply(reference, options = {}) {
  const payment = await Payment.findOne({ reference });
  if (!payment) throw notFound('Unknown payment reference');
  const provider = await resolvePaymentProvider(payment, options);
  if (provider.context === 'merchant') await validateMerchantPaymentTarget(payment);
  if (payment.status === 'success') {
    if (!payment.applied) { try { await applyClaimed(payment); } catch (e) { console.error('re-dispatch failed', e.message); } }
    return { payment, result: 'already_processed' };
  }
  if (payment.status !== 'initialized') return { payment, result: 'failed' };
  const res = await provider.adapter.verify(reference);
  const tx = res.data;
  if (tx && ['failed', 'abandoned', 'reversed'].includes(tx.status)) {
    const claimed = await Payment.findOneAndUpdate({ _id: payment._id, status: { $in: ['initialized'] } }, { status: tx.status === 'abandoned' ? 'abandoned' : 'failed', failureReason: tx.status }, { new: true });
    if (claimed) await handleFailure(claimed);
    return { payment: claimed || payment, result: 'failed' };
  }
  const check = checkVerifiedTransaction(tx, { reference: payment.reference, amount: payment.amount, currency: payment.currency });
  if (!check.ok) {
    if (tx?.status === 'success') {
      await audit({ actorType: 'system', action: 'payment.verification_mismatch', business: payment.business, related: { kind: 'Payment', id: payment._id }, outcome: 'rejected', meta: { reason: check.reason } });
      await Payment.updateOne({ _id: payment._id, status: 'initialized' }, { status: 'failed', failureReason: check.reason });
      return { payment, result: 'rejected', reason: check.reason };
    }
    return { payment, result: 'pending' };
  }
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: 'success' } },
    { status: 'success', paystackId: tx.id, providerTransactionId: tx.id == null ? undefined : String(tx.id), channel: tx.channel, verifiedAt: new Date() }, { new: true },
  );
  if (!claimed) return { payment, result: 'already_processed' }; // another request won the race
  await applyClaimed(claimed, tx);
  return { payment: claimed, result: 'success' };
}

export async function refundVerifiedPayment(reference, { amount, currency, reason }) {
  const payment = await Payment.findOne({ reference });
  if (!payment || payment.status !== 'success' || !payment.applied) throw notFound('Verified payment not found.');
  const { adapter } = await resolvePaymentProvider(payment);
  return adapter.refund({ transaction: payment.providerTransactionId || payment.reference, amount, currency, customer_note: reason });
}

async function handleFailure(payment) {
  if (payment.purpose === 'storefront_order') await failOrderPayment(payment.target.id);
  if (payment.purpose === 'pos_sale') await failSalePayment(payment.target.id);
}

export async function reconcilePayments() {
  const cutoff = new Date(Date.now() - 5 * 60_000);
  await Payment.updateMany({ status: 'success', applied: false, applyClaimedAt: { $lt: cutoff } }, { $unset: { applyClaimedAt: 1 } });
  const stale = await Payment.find({ status: 'success', applied: false, $or: [{ applyClaimedAt: { $exists: false } }, { applyClaimedAt: { $lt: cutoff } }] }).limit(50);
  for (const p of stale) { try { await applyClaimed(p); } catch (e) { console.error('reconcile failed', p.reference, e.message); } }
  return stale.length;
}
