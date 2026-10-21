import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Business, Product, Category, Order, Payment } from '../models/index.js';
import { asyncH, notFound, bad } from '../lib/errors.js';
import { parse, z, objectId, phone, escapeRegex, pageParams } from '../lib/validate.js';
import { getAccess } from '../services/subscriptions.js';
import { createOnlineOrder } from '../services/orders.js';
import { verifyAndApply } from '../services/payments.js';

const r = Router();
const checkoutLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many checkout attempts. Try again shortly.' } } });

async function liveStore(slug) {
  const b = await Business.findOne({ slug: String(slug).toLowerCase() });
  if (!b || !b.storePublished || b.status !== 'active') throw notFound('Store not found');
  const { access, plan } = await getAccess(b._id);
  return { b, accepting: access && plan.features.includes('online_store') };
}
const publicBiz = (b, accepting) => ({ name: b.name, slug: b.slug, description: b.description, category: b.category, phone: b.phone, email: b.email, address: b.address, logoUrl: b.logoUrl, brandColor: b.brandColor, deliveryFee: b.deliveryFee, acceptingOrders: accepting });
const publicProduct = (p) => ({ id: p._id, name: p.name, description: p.description, images: p.images, price: p.price, sku: p.sku, category: p.category, inStock: !p.trackStock || p.stock - p.reserved > 0, available: p.trackStock ? Math.max(0, Math.min(p.stock - p.reserved, 99)) : null });

r.get('/:slug', asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);
  res.json({ business: publicBiz(b, accepting), categories: await Category.find({ business: b._id }).select('name').sort('name') });
}));

r.get('/:slug/products', asyncH(async (req, res) => {
  const { b } = await liveStore(req.params.slug);
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: b._id, published: true, archived: false };
  if (req.query.search) f.name = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i');
  if (req.query.category && /^[a-f\d]{24}$/i.test(req.query.category)) f.category = req.query.category;
  const [items, total] = await Promise.all([Product.find(f).sort('-createdAt').skip(skip).limit(limit), Product.countDocuments(f)]);
  res.json({ items: items.map(publicProduct), total, page, limit });
}));

r.get('/:slug/products/:id', asyncH(async (req, res) => {
  const { b } = await liveStore(req.params.slug);
  const p = await Product.findOne({ _id: req.params.id, business: b._id, published: true, archived: false });
  if (!p) throw notFound('Product not found');
  res.json({ product: publicProduct(p) });
}));

r.post('/:slug/checkout', checkoutLimiter, asyncH(async (req, res) => {
  const { b, accepting } = await liveStore(req.params.slug);
  if (!accepting) throw bad('This store is not accepting orders right now.');
  const body = parse(z.object({
    items: z.array(z.object({ productId: objectId, qty: z.number().int().min(1).max(999) })).min(1).max(50),
    customer: z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email(), phone, address: z.object({ line: z.string().trim().min(3).max(200), city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80) }) }),
    note: z.string().max(500).optional(),
  }), req.body);
  const { order, authorizationUrl, reference } = await createOnlineOrder(b, body);
  res.status(201).json({ orderRef: order.ref, reference, authorizationUrl, total: order.total });
}));

// Callback page asks the server to verify with Paystack. The browser's "success" is never trusted.
r.get('/:slug/orders/verify', asyncH(async (req, res) => {
  const { b } = await liveStore(req.params.slug);
  const reference = String(req.query.reference || '');
  const payment = await Payment.findOne({ reference, purpose: 'storefront_order' });
  if (!payment || String(payment.business) !== String(b._id)) throw notFound('Order not found');
  const out = await verifyAndApply(reference, { expectedContext: 'merchant', gatewayId: payment.gateway });
  const order = await Order.findById(payment.target.id);
  res.json({ result: out.result, order: { ref: order.ref, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, total: order.total, items: order.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })) } });
}));

r.post('/:slug/orders/lookup', checkoutLimiter, asyncH(async (req, res) => {
  const { b } = await liveStore(req.params.slug);
  const body = parse(z.object({ ref: z.string().max(30), email: z.string().email() }), req.body);
  const order = await Order.findOne({ business: b._id, ref: body.ref.toUpperCase(), 'customerInfo.email': body.email.toLowerCase() });
  if (!order) throw notFound('No order matches those details');
  res.json({ order: { ref: order.ref, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, total: order.total, createdAt: order.createdAt } });
}));

export default r;
