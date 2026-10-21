import { Router } from 'express';
import { Order, Customer, Payment } from '../models/index.js';
import { asyncH, notFound, conflict } from '../lib/errors.js';
import { parse, z, escapeRegex, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature } from '../middleware/auth.js';
import { fulfilmentMachine } from '../lib/statusMachines.js';
import { cancelOrder } from '../services/orders.js';
import { refundVerifiedPayment } from '../services/payments.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth);

r.get('/', requireBusiness('orders.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id };
  if (req.query.payment) f.paymentStatus = req.query.payment;
  if (req.query.fulfilment) f.fulfilmentStatus = req.query.fulfilment;
  if (req.query.search) { const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i'); f.$or = [{ ref: rx }, { 'customerInfo.name': rx }, { 'customerInfo.email': rx }, { 'customerInfo.phone': rx }]; }
  if (req.query.from || req.query.to) f.createdAt = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
  const [items, total] = await Promise.all([Order.find(f).sort('-createdAt').skip(skip).limit(limit).select('-history'), Order.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.get('/:id', requireBusiness('orders.read'), asyncH(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, business: req.business._id });
  if (!o) throw notFound('Order not found');
  const payment = await Payment.findOne({ reference: o.paymentReference }).select('status amount channel verifiedAt reference');
  res.json({ order: o, payment });
}));

r.patch('/:id/fulfilment', requireBusiness('orders.write'), asyncH(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['processing', 'ready', 'out_for_delivery', 'delivered']) }), req.body);
  const o = await Order.findOne({ _id: req.params.id, business: req.business._id });
  if (!o) throw notFound('Order not found');
  if (o.paymentStatus !== 'paid') throw conflict('Only paid orders can be fulfilled.');
  fulfilmentMachine.assert(o.fulfilmentStatus, status);
  const u = await Order.findOneAndUpdate({ _id: o._id, fulfilmentStatus: o.fulfilmentStatus }, { fulfilmentStatus: status, $push: { history: { actor: req.user._id, action: `fulfilment_${status}` } } }, { new: true });
  if (!u) throw conflict('Order changed; refresh and try again.');
  res.json({ order: u });
}));

r.post('/:id/cancel', requireBusiness('orders.write'), asyncH(async (req, res) => {
  const b = parse(z.object({ reason: z.string().trim().min(3).max(300), restock: z.boolean().default(false) }), req.body);
  const o = await Order.findOne({ _id: req.params.id, business: req.business._id });
  if (!o) throw notFound('Order not found');
  await cancelOrder(o, { actor: req.user._id, restock: b.restock, reason: b.reason });
  await audit({ req, action: 'order.cancelled', business: req.business._id, targetType: 'Order', targetId: o._id, reason: b.reason, meta: { restock: b.restock } });
  res.json({ order: await Order.findById(o._id) });
}));

// Refund goes through Paystack; the order becomes "refunded" only when Paystack confirms via webhook.
r.post('/:id/refund', requireBusiness('orders.refund'), asyncH(async (req, res) => {
  const b = parse(z.object({ reason: z.string().trim().min(3).max(300) }), req.body);
  const o = await Order.findOne({ _id: req.params.id, business: req.business._id });
  if (!o) throw notFound('Order not found');
  if (o.paymentStatus !== 'refund_pending') throw conflict('Cancel the order first (or it is not awaiting a refund).');
  await refundVerifiedPayment(o.paymentReference, { amount: o.total, currency: 'NGN', reason: b.reason });
  await Order.updateOne({ _id: o._id }, { $push: { history: { actor: req.user._id, action: 'refund_requested', note: b.reason } } });
  await audit({ req, action: 'order.refund_requested', business: req.business._id, targetType: 'Order', targetId: o._id, reason: b.reason });
  res.json({ ok: true, message: 'Refund submitted to Paystack. Status updates when Paystack confirms it.' });
}));

export default r;
