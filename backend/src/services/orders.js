import { Order, Product, Customer, Business, Payment, Sale } from '../models/index.js';
import { withTxn } from './db.js';
import * as inv from './inventory.js';
import { computeTotals } from '../lib/money.js';
import { newReference } from '../lib/tokens.js';
import { bad, conflict } from '../lib/errors.js';
import { getSettings } from './settings.js';
import { env } from '../config/env.js';
import { startPayment } from './payments.js';

export async function upsertCustomer(business, info, session) {
  const or = [];
  if (info.phone) or.push({ phone: info.phone });
  if (info.email) or.push({ email: info.email.toLowerCase() });
  let c = or.length ? await Customer.findOne({ business, $or: or }).session(session || null) : null;
  if (!c) {
    [c] = await Customer.create([{ business, name: info.name, phone: info.phone, email: info.email?.toLowerCase(), address: info.address }], { session });
  }
  return c;
}

/** Builds line items from SERVER prices. Client-supplied prices are never read. */
export async function buildItems(businessId, requested, { requirePublished = false } = {}) {
  const ids = requested.map((r) => r.productId);
  if (new Set(ids).size !== ids.length) throw bad('Duplicate products in cart; combine quantities.');
  const filter = { _id: { $in: ids }, business: businessId, archived: false };
  if (requirePublished) filter.published = true;
  const products = await Product.find(filter);
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return requested.map((r) => {
    const p = byId.get(String(r.productId));
    if (!p) throw conflict('A product in your cart is no longer available.', 'PRODUCT_UNAVAILABLE');
    return { product: p._id, name: p.name, sku: p.sku, unitPrice: p.price, qty: r.qty, lineTotal: p.price * r.qty, track: p.trackStock };
  });
}

export async function createOnlineOrder(business, { items: requested, customer, note }) {
  const items = await buildItems(business._id, requested, { requirePublished: true });
  const totals = computeTotals(items, { deliveryFee: business.deliveryFee || 0 });
  const settings = await getSettings();
  const ref = newReference('ZN', 8);

  const order = await withTxn(async (session) => {
    const cust = await upsertCustomer(business._id, customer, session);
    const [o] = await Order.create([{
      business: business._id, ref, customer: cust._id,
      customerInfo: { ...customer, email: customer.email.toLowerCase(), note },
      items, subtotal: totals.subtotal, deliveryFee: totals.deliveryFee, total: totals.total,
      reservationExpiresAt: new Date(Date.now() + settings.reservationMinutes * 60000),
      history: [{ action: 'order_placed', note: 'Awaiting payment' }],
    }], { session });
    await inv.reserve({ business: business._id, items, ref: { kind: 'Order', id: o._id }, session });
    return o;
  });

  try {
    const { payment, authorizationUrl } = await startPayment({
      business: business._id, purpose: 'storefront_order', amount: order.total, email: order.customerInfo.email,
      target: { kind: 'Order', id: order._id }, callbackUrl: `${env.frontendUrl}/store/${business.slug}/order`, // Paystack appends ?reference=...
    });
    await Order.updateOne({ _id: order._id }, { paymentReference: payment.reference });
    return { order, authorizationUrl, reference: payment.reference };
  } catch (e) {
    await failOrderPayment(order._id);
    throw e;
  }
}

export async function finalizeOrderPayment(orderId, payment) {
  const order = await Order.findById(orderId);
  if (!order) return;
  await withTxn(async (session) => {
    // Atomic claim: only one caller can move reserved -> deducted
    const claimed = await Order.findOneAndUpdate({ _id: orderId, stockState: 'reserved' }, { stockState: 'deducted', paymentStatus: 'paid', $push: { history: { action: 'payment_verified', note: payment.reference } } }, { new: true, session });
    if (claimed) {
      await inv.commit({ business: order.business, items: claimed.items, type: 'sale_online', ref: { kind: 'Order', id: orderId }, session });
      await Customer.updateOne({ _id: order.customer }, { $inc: { orderCount: 1, totalSpent: order.total } }, { session });
      return;
    }
    // Reservation already released (expired/cancelled) but money arrived: re-deduct if stock allows, else flag for refund.
    const late = await Order.findOneAndUpdate({ _id: orderId, stockState: 'released' }, { paymentStatus: 'paid', stockState: 'deducted', $push: { history: { action: 'late_payment', note: 'Paid after reservation expired' } } }, { new: true, session });
    if (!late) return; // already deducted: idempotent no-op
    try {
      await inv.deduct({ business: order.business, items: late.items, type: 'sale_online', ref: { kind: 'Order', id: orderId }, session });
      await Customer.updateOne({ _id: order.customer }, { $inc: { orderCount: 1, totalSpent: order.total } }, { session });
    } catch {
      throw Object.assign(new Error('late_payment_no_stock'), { lateNoStock: true });
    }
  }).catch(async (e) => {
    if (!e.lateNoStock) throw e;
    await Order.updateOne({ _id: orderId }, { paymentStatus: 'refund_pending', stockState: 'released', fulfilmentStatus: 'cancelled', $push: { history: { action: 'needs_refund', note: 'Payment received after reservation expired and stock is no longer available. Refund the customer.' } } });
  });
}

export async function failOrderPayment(orderId) {
  const order = await Order.findOneAndUpdate({ _id: orderId, stockState: 'reserved', paymentStatus: 'pending' }, { stockState: 'released', paymentStatus: 'failed', fulfilmentStatus: 'cancelled', $push: { history: { action: 'payment_failed' } } }, { new: true });
  if (order) await withTxn((session) => inv.release({ business: order.business, items: order.items, reason: 'payment_failed', ref: { kind: 'Order', id: orderId }, session }));
}

/** restock must be an explicit decision by the actor; paid cancellations never restock automatically. */
export async function cancelOrder(order, { actor, restock = false, reason }) {
  if (['delivered', 'cancelled'].includes(order.fulfilmentStatus)) throw conflict('This order can no longer be cancelled.');
  await withTxn(async (session) => {
    if (order.paymentStatus === 'pending') {
      const o = await Order.findOneAndUpdate({ _id: order._id, stockState: 'reserved', paymentStatus: 'pending' }, { stockState: 'released', paymentStatus: 'failed', fulfilmentStatus: 'cancelled', $push: { history: { actor, action: 'cancelled', note: reason } } }, { session, new: true });
      if (!o) throw conflict('Order changed; refresh and try again.');
      await inv.release({ business: order.business, items: o.items, reason: 'order_cancelled', actor, ref: { kind: 'Order', id: order._id }, session });
    } else if (order.paymentStatus === 'paid') {
      const nextStock = restock ? 'restocked' : 'deducted';
      const o = await Order.findOneAndUpdate({ _id: order._id, stockState: 'deducted', paymentStatus: 'paid' }, { stockState: nextStock, paymentStatus: 'refund_pending', fulfilmentStatus: 'cancelled', $push: { history: { actor, action: restock ? 'cancelled_restocked' : 'cancelled_no_restock', note: reason } } }, { session, new: true });
      if (!o) throw conflict('Order changed; refresh and try again.');
      if (restock) await inv.restock({ business: order.business, items: o.items, type: 'cancel_restock', actor, reason, ref: { kind: 'Order', id: order._id }, session });
    } else throw conflict('Order cannot be cancelled in its current payment state.');
  });
}

/** Run periodically: releases stock held for unpaid orders/sales whose reservation window has passed. */
export async function releaseExpiredReservations(now = new Date()) {
  let n = 0;
  const orders = await Order.find({ stockState: 'reserved', paymentStatus: 'pending', reservationExpiresAt: { $lt: now } }).limit(100);
  for (const o of orders) {
    const c = await Order.findOneAndUpdate({ _id: o._id, stockState: 'reserved', paymentStatus: 'pending' }, { stockState: 'released', paymentStatus: 'expired', fulfilmentStatus: 'cancelled', $push: { history: { action: 'reservation_expired' } } }, { new: true });
    if (c) { await withTxn((s) => inv.release({ business: c.business, items: c.items, reason: 'expired', ref: { kind: 'Order', id: c._id }, session: s })); n++; }
  }
  const sales = await Sale.find({ stockState: 'reserved', paymentStatus: 'pending', reservationExpiresAt: { $lt: now } }).limit(100);
  for (const s of sales) {
    const c = await Sale.findOneAndUpdate({ _id: s._id, stockState: 'reserved', paymentStatus: 'pending' }, { stockState: 'released', paymentStatus: 'expired', status: 'voided' }, { new: true });
    if (c) { await withTxn((sess) => inv.release({ business: c.business, items: c.items, reason: 'expired', ref: { kind: 'Sale', id: c._id }, session: sess })); n++; }
  }
  return n;
}
