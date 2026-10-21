import { Router } from 'express';
import { Product, Sale, Payment, Business } from '../models/index.js';
import { asyncH, notFound, conflict } from '../lib/errors.js';
import { parse, z, objectId, escapeRegex, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature } from '../middleware/auth.js';
import { createSale, processReturn, refundFor } from '../services/pos.js';
import { verifyAndApply } from '../services/payments.js';
import { refundVerifiedPayment } from '../services/payments.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth);

r.get('/products', requireBusiness('pos.sell'), requireFeature('pos'), asyncH(async (req, res) => {
  const f = { business: req.business._id, archived: false };
  if (req.query.search) f.$or = [{ name: new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i') }, { sku: String(req.query.search) }];
  if (req.query.category && /^[a-f\d]{24}$/i.test(req.query.category)) f.category = req.query.category;
  const items = await Product.find(f).sort('name').limit(60).select('name sku price stock reserved trackStock category images');
  res.json({ items: items.map((p) => ({ id: p._id, name: p.name, sku: p.sku, price: p.price, trackStock: p.trackStock, available: p.trackStock ? p.stock - p.reserved : null, image: p.images?.[0], category: p.category })) });
}));

const saleBody = z.object({
  idempotencyKey: z.string().min(8).max(80),
  items: z.array(z.object({ productId: objectId, qty: z.number().int().min(1).max(9999) })).min(1).max(100),
  discount: z.object({ type: z.enum(['amount', 'percent']), value: z.number().min(0).max(100_000_000_000) }).optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'card_terminal', 'paystack']),
  cashReceived: z.number().int().min(0).optional(),
  customerId: objectId.optional(),
  customerEmail: z.string().email().optional(),
});

r.post('/sales', requireBusiness('pos.sell'), requireFeature('pos'), asyncH(async (req, res) => {
  const body = parse(saleBody, req.body);
  const out = await createSale({ business: req.business, actor: req.user._id, body, canDiscount: req.can('pos.discount') });
  if (!out.duplicate) await audit({ req, action: 'pos.sale_created', business: req.business._id, targetType: 'Sale', targetId: out.sale._id, meta: { total: out.sale.total, method: body.paymentMethod, discount: out.sale.discount } });
  res.status(out.duplicate ? 200 : 201).json({ sale: out.sale, duplicate: out.duplicate, authorizationUrl: out.authorizationUrl, change: body.paymentMethod === 'cash' && body.cashReceived ? body.cashReceived - out.sale.total : undefined });
}));

r.get('/sales', requireBusiness('pos.sell'), requireFeature('pos'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id };
  if (!req.can('reports.read')) f.cashier = req.user._id; // cashiers only see their own sales
  if (req.query.search) f.receiptNo = new RegExp(escapeRegex(String(req.query.search).slice(0, 20)), 'i');
  if (req.query.from || req.query.to) f.createdAt = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
  const [items, total] = await Promise.all([Sale.find(f).sort('-createdAt').skip(skip).limit(limit).populate('cashier', 'name'), Sale.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

async function loadSale(req) {
  const f = { _id: req.params.id, business: req.business._id };
  if (!req.can('reports.read')) f.cashier = req.user._id;
  const s = await Sale.findOne(f).populate('cashier', 'name').populate('customer', 'name phone');
  if (!s) throw notFound('Sale not found');
  return s;
}

r.get('/sales/:id', requireBusiness('pos.sell'), requireFeature('pos'), asyncH(async (req, res) => {
  let s = await loadSale(req);
  if (s.paymentStatus === 'pending' && s.paymentReference) { await verifyAndApply(s.paymentReference, { expectedContext: 'merchant', gatewayId: (await Payment.findOne({ reference: s.paymentReference }).select('gateway'))?.gateway }).catch(() => {}); s = await loadSale(req); }
  res.json({ sale: s });
}));

r.get('/sales/:id/receipt', requireBusiness('pos.sell'), requireFeature('pos'), asyncH(async (req, res) => {
  const s = await loadSale(req);
  const b = req.business;
  res.json({ receipt: {
    business: { name: b.name, phone: b.phone, email: b.email, address: b.address }, receiptNo: s.receiptNo, date: s.createdAt, channel: 'pos',
    items: s.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
    subtotal: s.subtotal, discount: s.discount, total: s.total, paymentMethod: s.paymentMethod, paymentVerification: s.paymentVerification, paymentStatus: s.paymentStatus, paymentReference: s.paymentReference,
    cashier: s.cashier?.name, customer: s.customer?.name, cashReceived: s.cashReceived, change: s.cashReceived ? s.cashReceived - s.total : undefined, returns: s.returns.length,
  } });
}));

const returnBody = z.object({ items: z.array(z.object({ productId: objectId, qty: z.number().int().min(1) })).min(1), restock: z.boolean(), reason: z.string().trim().min(3).max(300) });

async function doReturn(req, { voided }) {
  const s = await loadSale(req);
  const body = voided ? { items: s.items.map((i) => ({ productId: String(i.product), qty: i.qty - s.returns.flatMap((x) => x.items).filter((x) => String(x.product) === String(i.product)).reduce((a, x) => a + x.qty, 0) })).filter((i) => i.qty > 0), ...parse(z.object({ restock: z.boolean(), reason: z.string().trim().min(3).max(300) }), req.body) } : parse(returnBody, req.body);
  if (!body.items.length) throw conflict('Nothing left to return on this sale.');
  const lines = body.items.map((l) => { const it = s.items.find((i) => String(i.product) === String(l.productId)); return { unitPrice: it?.unitPrice || 0, qty: l.qty }; });
  if (s.paymentMethod === 'paystack' && s.paymentReference) {
    await refundVerifiedPayment(s.paymentReference, { amount: refundFor(s, lines), currency: 'NGN', reason: body.reason });
  }
  const out = await processReturn({ sale: s, lines: body.items, restock: body.restock, reason: body.reason, actor: req.user._id, voided });
  await audit({ req, action: voided ? 'pos.sale_voided' : 'pos.sale_returned', business: req.business._id, targetType: 'Sale', targetId: s._id, reason: body.reason, meta: { refundAmount: out.refundAmount, restock: body.restock } });
  return out;
}
r.post('/sales/:id/return', requireBusiness('pos.refund'), requireFeature('pos'), asyncH(async (req, res) => res.json(await doReturn(req, { voided: false }))));
r.post('/sales/:id/void', requireBusiness('pos.refund'), requireFeature('pos'), asyncH(async (req, res) => res.json(await doReturn(req, { voided: true }))));

export default r;
