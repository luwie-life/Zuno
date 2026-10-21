import { Router } from 'express';
import { Category, Product, StockMovement } from '../models/index.js';
import { asyncH, bad, notFound, conflict } from '../lib/errors.js';
import { parse, z, objectId, kobo, escapeRegex, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature, assertLimit } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth);

r.get('/categories', requireBusiness('products.read'), asyncH(async (req, res) => {
  res.json({ categories: await Category.find({ business: req.business._id }).sort('name') });
}));
r.post('/categories', requireBusiness('products.write'), requireFeature('products'), asyncH(async (req, res) => {
  const { name } = parse(z.object({ name: z.string().trim().min(1).max(60) }), req.body);
  try { res.status(201).json({ category: await Category.create({ business: req.business._id, name }) }); } catch (e) { if (e.code === 11000) throw conflict('Category already exists.'); throw e; }
}));
r.delete('/categories/:id', requireBusiness('products.write'), asyncH(async (req, res) => {
  const c = await Category.findOneAndDelete({ _id: req.params.id, business: req.business._id });
  if (!c) throw notFound();
  await Product.updateMany({ business: req.business._id, category: c._id }, { $unset: { category: 1 } });
  res.json({ ok: true });
}));

const image = z.string().url().refine((u) => u.startsWith('https://'), 'Image links must be https');
const productBody = z.object({
  name: z.string().trim().min(1).max(160), description: z.string().max(4000), images: z.array(image).max(5), price: kobo, cost: kobo,
  sku: z.string().trim().max(60), category: objectId.nullable(), trackStock: z.boolean(), lowStockThreshold: z.number().int().min(0).max(100000), published: z.boolean(),
});

r.get('/products', requireBusiness('products.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id, archived: req.query.archived === 'true' };
  if (req.query.search) f.name = new RegExp(escapeRegex(req.query.search), 'i');
  if (req.query.category && /^[a-f\d]{24}$/i.test(req.query.category)) f.category = req.query.category;
  if (req.query.low === 'true') f.$expr = { $and: [{ $eq: ['$trackStock', true] }, { $lte: [{ $subtract: ['$stock', '$reserved'] }, '$lowStockThreshold'] }] };
  const [items, total] = await Promise.all([Product.find(f).sort('-createdAt').skip(skip).limit(limit).populate('category', 'name'), Product.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.get('/products/:id', requireBusiness('products.read'), asyncH(async (req, res) => {
  const p = await Product.findOne({ _id: req.params.id, business: req.business._id });
  if (!p) throw notFound('Product not found');
  res.json({ product: p });
}));

r.post('/products', requireBusiness('products.write'), requireFeature('products'), asyncH(async (req, res) => {
  const b = parse(productBody.partial({ description: true, images: true, cost: true, sku: true, category: true, trackStock: true, lowStockThreshold: true, published: true }).extend({ initialStock: z.number().int().min(0).max(10_000_000).optional() }), req.body);
  await assertLimit(req, 'products', await Product.countDocuments({ business: req.business._id, archived: false }));
  if (b.category && !(await Category.exists({ _id: b.category, business: req.business._id }))) throw bad('Category not found.');
  const { initialStock = 0, ...rest } = b;
  if (!rest.sku) delete rest.sku;
  const p = await Product.create({ ...rest, business: req.business._id, stock: rest.trackStock === false ? 0 : initialStock });
  if (initialStock > 0 && p.trackStock) await StockMovement.create({ business: req.business._id, product: p._id, type: 'initial', stockDelta: initialStock, stockAfter: initialStock, actor: req.user._id });
  res.status(201).json({ product: p });
}));

// Stock is deliberately NOT editable here; use /inventory/adjust so every change is audited.
r.patch('/products/:id', requireBusiness('products.write'), asyncH(async (req, res) => {
  const b = parse(productBody.partial(), req.body);
  if (b.category && !(await Category.exists({ _id: b.category, business: req.business._id }))) throw bad('Category not found.');
  if (b.sku === '') { b.sku = undefined; }
  const p = await Product.findOneAndUpdate({ _id: req.params.id, business: req.business._id }, b.sku === undefined && 'sku' in b ? { ...b, $unset: { sku: 1 } } : b, { new: true, runValidators: true });
  if (!p) throw notFound('Product not found');
  res.json({ product: p });
}));

r.post('/products/:id/archive', requireBusiness('products.write'), asyncH(async (req, res) => {
  const { archived } = parse(z.object({ archived: z.boolean() }), req.body);
  const p = await Product.findOneAndUpdate({ _id: req.params.id, business: req.business._id }, { archived, ...(archived ? { published: false } : {}) }, { new: true });
  if (!p) throw notFound('Product not found');
  await audit({ req, action: archived ? 'product.archived' : 'product.restored', business: req.business._id, targetType: 'Product', targetId: p._id });
  res.json({ product: p });
}));

export default r;
