import { Router } from 'express';
import { Product, StockMovement, Supplier, Purchase } from '../models/index.js';
import { asyncH, notFound, bad, conflict } from '../lib/errors.js';
import { parse, z, objectId, kobo, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature } from '../middleware/auth.js';
import * as inv from '../services/inventory.js';
import { withTxn } from '../services/db.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth);
const F = 'shared_inventory';

r.get('/', requireBusiness('inventory.read'), requireFeature(F), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id, archived: false, trackStock: true };
  if (req.query.low === 'true') f.$expr = { $lte: [{ $subtract: ['$stock', '$reserved'] }, '$lowStockThreshold'] };
  const [items, total] = await Promise.all([Product.find(f).sort('name').skip(skip).limit(limit).select('name sku stock reserved lowStockThreshold cost price'), Product.countDocuments(f)]);
  res.json({ items: items.map((p) => ({ id: p._id, name: p.name, sku: p.sku, stock: p.stock, reserved: p.reserved, available: p.stock - p.reserved, lowStockThreshold: p.lowStockThreshold, low: p.stock - p.reserved <= p.lowStockThreshold, cost: p.cost, price: p.price })), total, page, limit });
}));

r.get('/movements', requireBusiness('inventory.read'), requireFeature('stock_movements'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id };
  if (req.query.product && /^[a-f\d]{24}$/i.test(req.query.product)) f.product = req.query.product;
  const [items, total] = await Promise.all([StockMovement.find(f).sort('-createdAt').skip(skip).limit(limit).populate('product', 'name sku').populate('actor', 'name'), StockMovement.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.post('/adjust', requireBusiness('inventory.adjust'), requireFeature(F), asyncH(async (req, res) => {
  const b = parse(z.object({ productId: objectId, delta: z.number().int().refine((n) => n !== 0, 'Change cannot be zero').refine((n) => Math.abs(n) <= 10_000_000), reason: z.string().trim().min(3).max(300) }), req.body);
  await inv.adjust({ business: req.business._id, productId: b.productId, delta: b.delta, reason: b.reason, actor: req.user._id });
  await audit({ req, action: 'inventory.adjusted', business: req.business._id, targetType: 'Product', targetId: b.productId, reason: b.reason, meta: { delta: b.delta } });
  res.json({ product: await Product.findById(b.productId).select('name stock reserved') });
}));

// ---- suppliers ----
const sup = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().max(30), email: z.string().email().or(z.literal('')), address: z.string().max(300), notes: z.string().max(1000) });
r.get('/suppliers', requireBusiness('suppliers.read'), requireFeature('suppliers'), asyncH(async (req, res) => res.json({ items: await Supplier.find({ business: req.business._id }).sort('name') })));
r.post('/suppliers', requireBusiness('suppliers.write'), requireFeature('suppliers'), asyncH(async (req, res) => res.status(201).json({ supplier: await Supplier.create({ ...parse(sup.partial({ phone: true, email: true, address: true, notes: true }), req.body), business: req.business._id }) })));
r.patch('/suppliers/:id', requireBusiness('suppliers.write'), requireFeature('suppliers'), asyncH(async (req, res) => {
  const s = await Supplier.findOneAndUpdate({ _id: req.params.id, business: req.business._id }, parse(sup.partial(), req.body), { new: true });
  if (!s) throw notFound(); res.json({ supplier: s });
}));
r.delete('/suppliers/:id', requireBusiness('suppliers.write'), requireFeature('suppliers'), asyncH(async (req, res) => {
  if (await Purchase.exists({ business: req.business._id, supplier: req.params.id })) throw conflict('This supplier has purchase records and cannot be deleted.');
  const s = await Supplier.findOneAndDelete({ _id: req.params.id, business: req.business._id });
  if (!s) throw notFound(); res.json({ ok: true });
}));

// ---- purchases (receiving stock) ----
r.get('/purchases', requireBusiness('suppliers.read'), requireFeature('purchasing'), asyncH(async (req, res) => res.json({ items: await Purchase.find({ business: req.business._id }).sort('-createdAt').limit(100).populate('supplier', 'name').populate('items.product', 'name') })));
r.post('/purchases', requireBusiness('purchases.write'), requireFeature('purchasing'), asyncH(async (req, res) => {
  const b = parse(z.object({ supplier: objectId.optional(), note: z.string().max(300).optional(), items: z.array(z.object({ product: objectId, qty: z.number().int().min(1).max(10_000_000), unitCost: kobo })).min(1).max(100) }), req.body);
  const ids = b.items.map((i) => i.product);
  if ((await Product.countDocuments({ _id: { $in: ids }, business: req.business._id })) !== new Set(ids.map(String)).size) throw bad('One or more products were not found.');
  if (b.supplier && !(await Supplier.exists({ _id: b.supplier, business: req.business._id }))) throw bad('Supplier not found.');
  res.status(201).json({ purchase: await Purchase.create({ ...b, business: req.business._id, total: b.items.reduce((s, i) => s + i.qty * i.unitCost, 0) }) });
}));
r.post('/purchases/:id/receive', requireBusiness('purchases.write'), requireFeature('purchasing'), asyncH(async (req, res) => {
  const out = await withTxn(async (session) => {
    // atomic claim: a purchase can only be received once, so stock cannot be added twice
    const p = await Purchase.findOneAndUpdate({ _id: req.params.id, business: req.business._id, status: 'draft' }, { status: 'received', receivedAt: new Date(), receivedBy: req.user._id }, { new: true, session });
    if (!p) throw conflict('Purchase not found or already received.');
    for (const it of p.items) {
      await inv.adjust({ business: req.business._id, productId: it.product, delta: it.qty, reason: `Purchase received`, actor: req.user._id, type: 'purchase', ref: { kind: 'Purchase', id: p._id }, session });
      await Product.updateOne({ _id: it.product, business: req.business._id }, { cost: it.unitCost }, { session });
    }
    return p;
  });
  await audit({ req, action: 'purchase.received', business: req.business._id, targetType: 'Purchase', targetId: out._id });
  res.json({ purchase: out });
}));
r.post('/purchases/:id/cancel', requireBusiness('purchases.write'), requireFeature('purchasing'), asyncH(async (req, res) => {
  const p = await Purchase.findOneAndUpdate({ _id: req.params.id, business: req.business._id, status: 'draft' }, { status: 'cancelled' }, { new: true });
  if (!p) throw conflict('Only draft purchases can be cancelled.'); res.json({ purchase: p });
}));

export default r;
