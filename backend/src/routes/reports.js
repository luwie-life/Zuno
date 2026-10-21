import { Router } from 'express';
import mongoose from 'mongoose';
import { Order, Sale, Product } from '../models/index.js';
import { asyncH, bad } from '../lib/errors.js';
import { requireAuth, requireBusiness, requireFeature } from '../middleware/auth.js';
import { featureAllowed } from '../lib/subscriptionRules.js';

const r = Router();
r.use(requireAuth);

/*
 * METRIC DEFINITIONS
 *  Online revenue ..... sum of Order.total where paymentStatus = 'paid' (verified by Paystack). Excludes pending, failed,
 *                       expired, refund_pending and refunded orders.
 *  POS revenue ........ sum of Sale.total where paymentStatus in (paid, partially_refunded), minus refundAmount of returns.
 *  Net sales .......... online revenue + POS revenue.
 *  Cancellations ...... online orders cancelled after or before payment. Returns = POS return events.
 */
r.get('/summary', requireBusiness('reports.read'), requireFeature('basic_reports'), asyncH(async (req, res) => {
  const biz = new mongoose.Types.ObjectId(String(req.business._id));
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  if (isNaN(from) || isNaN(to) || from > to) throw bad('Invalid date range');
  const range = { business: biz, createdAt: { $gte: from, $lte: to } };

  const [onlineAgg, posAgg, pending] = await Promise.all([
    Order.aggregate([{ $match: { ...range, paymentStatus: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Sale.aggregate([{ $match: { ...range, paymentStatus: { $in: ['paid', 'partially_refunded'] } } }, { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 }, refunds: { $sum: { $sum: '$returns.refundAmount' } } } }]),
    Order.countDocuments({ ...range, paymentStatus: 'pending' }),
  ]);
  const online = onlineAgg[0] || { revenue: 0, count: 0 };
  const pos = posAgg[0] || { revenue: 0, count: 0, refunds: 0 };
  const summary = { range: { from, to }, online: { revenue: online.revenue, orders: online.count }, pos: { revenue: pos.revenue - pos.refunds, transactions: pos.count, refunds: pos.refunds }, netSales: online.revenue + pos.revenue - pos.refunds, pendingOnlineOrders: pending };

  const { sub, plan } = req.access;
  if (featureAllowed(plan, 'enhanced_reports', sub.override)) {
    const [top, methods, cancelled, returns, low] = await Promise.all([
      Order.aggregate([{ $match: { ...range, paymentStatus: 'paid' } }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
        { $unionWith: { coll: 'sales', pipeline: [{ $match: { ...range, paymentStatus: { $in: ['paid', 'partially_refunded'] } } }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } }] } },
        { $group: { _id: '$_id', name: { $first: '$name' }, qty: { $sum: '$qty' }, revenue: { $sum: '$revenue' } } }, { $sort: { qty: -1 } }, { $limit: 10 }]),
      Sale.aggregate([{ $match: { ...range, paymentStatus: { $in: ['paid', 'partially_refunded'] } } }, { $group: { _id: '$paymentMethod', total: { $sum: '$total' }, count: { $sum: 1 } } }]),
      Order.countDocuments({ ...range, fulfilmentStatus: 'cancelled' }),
      Sale.aggregate([{ $match: { ...range, 'returns.0': { $exists: true } } }, { $group: { _id: null, count: { $sum: { $size: '$returns' } } } }]),
      Product.find({ business: biz, archived: false, trackStock: true, $expr: { $lte: [{ $subtract: ['$stock', '$reserved'] }, '$lowStockThreshold'] } }).limit(20).select('name stock reserved lowStockThreshold'),
    ]);
    summary.enhanced = { topProducts: top, posPaymentMethods: methods.map((m) => ({ method: m._id, total: m.total, count: m.count })), onlineCancellations: cancelled, posReturns: returns[0]?.count || 0, lowStock: low.map((p) => ({ id: p._id, name: p.name, available: p.stock - p.reserved, threshold: p.lowStockThreshold })) };
  }
  res.json({ summary });
}));
export default r;
