import { Sale, Business, Customer } from '../models/index.js';
import { withTxn, nextSeq } from './db.js';
import * as inv from './inventory.js';
import { buildItems } from './orders.js';
import { computeTotals } from '../lib/money.js';
import { bad, conflict } from '../lib/errors.js';
import { getSettings } from './settings.js';
import { startPayment } from './payments.js';
import * as paystack from '../lib/paystack.js';
import { env } from '../config/env.js';

const OFFLINE = ['cash', 'transfer', 'card_terminal'];

export async function createSale({ business, actor, body, canDiscount }) {
  const { items: requested, idempotencyKey, discount, paymentMethod, cashReceived, customerId, customerEmail } = body;

  const existing = await Sale.findOne({ business: business._id, idempotencyKey });
  if (existing) return { sale: existing, duplicate: true };

  if (discount && discount.value > 0 && !canDiscount) throw conflict('You do not have permission to apply discounts.', 'DISCOUNT_FORBIDDEN');
  const items = await buildItems(business._id, requested);
  const totals = computeTotals(items, { discount });
  if (totals.total <= 0) throw bad('Sale total must be greater than zero.');
  if (paymentMethod === 'cash' && cashReceived !== undefined && cashReceived < totals.total) throw bad('Cash received is less than the total.');
  if (paymentMethod === 'paystack' && !customerEmail) throw bad('An email address is needed for electronic payments.');
  if (customerId) {
    const c = await Customer.findOne({ _id: customerId, business: business._id });
    if (!c) throw bad('Customer not found for this business.');
  }
  const settings = await getSettings();
  const base = {
    business: business._id, idempotencyKey, items, subtotal: totals.subtotal, discount: totals.discountAmount, total: totals.total,
    discountInput: discount?.value ? discount : undefined, paymentMethod, customer: customerId || undefined, cashier: actor, cashReceived,
  };

  try {
    if (OFFLINE.includes(paymentMethod)) {
      // Cashier confirms receipt of cash / transfer / terminal approval, so the sale is recorded as paid.
      const sale = await withTxn(async (session) => {
        const seq = await nextSeq(business._id, 'receipt', session);
        const receiptNo = `R-${String(seq).padStart(6, '0')}`;
        const [s] = await Sale.create([{ ...base, receiptNo, paymentStatus: 'paid', paymentVerification: paymentMethod === 'cash' ? 'cash_recorded' : 'manual_recorded', stockState: 'deducted', status: 'completed' }], { session });
        await inv.deduct({ business: business._id, items, type: 'sale_pos', actor, ref: { kind: 'Sale', id: s._id }, session });
        if (customerId) await Customer.updateOne({ _id: customerId }, { $inc: { orderCount: 1, totalSpent: totals.total } }, { session });
        return s;
      });
      return { sale, duplicate: false };
    }
    // Electronic: reserve stock now, deduct only after server-side verification.
    const sale = await withTxn(async (session) => {
      const seq = await nextSeq(business._id, 'receipt', session);
      const [s] = await Sale.create([{ ...base, receiptNo: `R-${String(seq).padStart(6, '0')}`, paymentStatus: 'pending', stockState: 'reserved', status: 'pending', reservationExpiresAt: new Date(Date.now() + settings.reservationMinutes * 60000) }], { session });
      await inv.reserve({ business: business._id, items, actor, ref: { kind: 'Sale', id: s._id }, session });
      return s;
    });
    try {
      const { payment, authorizationUrl } = await startPayment({ business: business._id, purpose: 'pos_sale', amount: sale.total, email: customerEmail, target: { kind: 'Sale', id: sale._id }, callbackUrl: `${env.frontendUrl}/app/pos/sales/${sale._id}` });
      await Sale.updateOne({ _id: sale._id }, { paymentReference: payment.reference });
      return { sale, duplicate: false, authorizationUrl, reference: payment.reference };
    } catch (e) { await failSalePayment(sale._id); throw e; }
  } catch (e) {
    if (e?.code === 11000 || /E11000/.test(e?.message || '')) {
      const again = await Sale.findOne({ business: business._id, idempotencyKey });
      if (again) return { sale: again, duplicate: true };
    }
    throw e;
  }
}

export async function finalizeSalePayment(saleId, payment) {
  const sale = await Sale.findById(saleId);
  if (!sale) return;
  await withTxn(async (session) => {
    const claimed = await Sale.findOneAndUpdate({ _id: saleId, stockState: 'reserved' }, { stockState: 'deducted', paymentStatus: 'paid', paymentVerification: 'gateway_verified', status: 'completed', paymentReference: payment.reference }, { new: true, session });
    if (!claimed) return;
    await inv.commit({ business: sale.business, items: claimed.items, type: 'sale_pos', actor: sale.cashier, ref: { kind: 'Sale', id: saleId }, session });
    if (sale.customer) await Customer.updateOne({ _id: sale.customer }, { $inc: { orderCount: 1, totalSpent: sale.total } }, { session });
  });
}

export async function failSalePayment(saleId) {
  const s = await Sale.findOneAndUpdate({ _id: saleId, stockState: 'reserved', paymentStatus: 'pending' }, { stockState: 'released', paymentStatus: 'failed', status: 'voided' }, { new: true });
  if (s) await withTxn((session) => inv.release({ business: s.business, items: s.items, reason: 'payment_failed', ref: { kind: 'Sale', id: s._id }, session }));
}

/** Pure: refund value of returned lines, with the sale discount shared proportionally. */
export function refundFor(sale, lines) {
  const value = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const share = sale.subtotal ? Math.round((sale.discount || 0) * (value / sale.subtotal)) : 0;
  return value - share;
}

export async function processReturn({ sale, lines, restock, reason, actor, voided = false }) {
  if (sale.paymentStatus !== 'paid' && sale.paymentStatus !== 'partially_refunded') throw conflict('Only paid sales can be returned.');
  const already = new Map();
  for (const r of sale.returns) for (const i of r.items) already.set(String(i.product), (already.get(String(i.product)) || 0) + i.qty);
  const resolved = lines.map((l) => {
    const item = sale.items.find((i) => String(i.product) === String(l.productId));
    if (!item) throw bad('Item not part of this sale.');
    const left = item.qty - (already.get(String(item.product)) || 0);
    if (l.qty > left) throw bad(`Cannot return more than ${left} of "${item.name}".`);
    return { product: item.product, name: item.name, unitPrice: item.unitPrice, qty: l.qty, track: item.track };
  });
  const refundAmount = refundFor(sale, resolved);
  return withTxn(async (session) => {
    const fresh = await Sale.findOne({ _id: sale._id, __v: sale.__v }).session(session);
    if (!fresh) throw conflict('Sale changed; refresh and try again.');
    fresh.returns.push({ at: new Date(), by: actor, reason, restock, refundAmount, items: resolved.map((r) => ({ product: r.product, qty: r.qty })) });
    const totalReturned = fresh.returns.flatMap((r) => r.items).reduce((s, i) => s + i.qty, 0);
    const totalSold = fresh.items.reduce((s, i) => s + i.qty, 0);
    fresh.status = voided ? 'voided' : totalReturned >= totalSold ? 'returned' : 'partially_returned';
    fresh.paymentStatus = totalReturned >= totalSold ? 'refunded' : 'partially_refunded';
    await fresh.save({ session });
    if (restock) await inv.restock({ business: sale.business, items: resolved, type: 'return_restock', actor, reason, ref: { kind: 'Sale', id: sale._id }, session });
    return { sale: fresh, refundAmount };
  });
}
