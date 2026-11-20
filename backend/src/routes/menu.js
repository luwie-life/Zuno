import { Router } from 'express';
import { MenuCategory, MenuItem } from '../models/index.js';
import { asyncH, bad, conflict, notFound } from '../lib/errors.js';
import { parse, z, objectId, kobo, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireModule } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth, requireBusiness(null), requireModule('menu'));

const imageUrl = z.string().url().refine((value) => value.startsWith('https://'), 'Image links must be https');
const categoryBody = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  published: z.boolean().optional(),
});
const itemBody = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  price: kobo,
  category: objectId,
  imageUrl: imageUrl.or(z.literal('')).optional(),
  available: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});

async function validateCategory(businessId, categoryId) {
  if (!(await MenuCategory.exists({ _id: categoryId, business: businessId }))) {
    throw bad('Menu category not found.');
  }
}

r.get('/categories', requireBusiness('menu.read'), asyncH(async (req, res) => {
  res.json({ categories: await MenuCategory.find({ business: req.business._id }).sort({ sortOrder: 1, name: 1 }) });
}));

r.post('/categories', requireBusiness('menu.write'), asyncH(async (req, res) => {
  const body = parse(categoryBody, req.body);
  const category = await MenuCategory.create({ ...body, business: req.business._id });
  await audit({ req, action: 'menu.category_created', business: req.business._id, targetType: 'MenuCategory', targetId: category._id });
  res.status(201).json({ category });
}));

r.patch('/categories/:id', requireBusiness('menu.write'), asyncH(async (req, res) => {
  const body = parse(categoryBody.partial(), req.body);
  const category = await MenuCategory.findOneAndUpdate(
    { _id: req.params.id, business: req.business._id },
    body,
    { new: true, runValidators: true },
  );
  if (!category) throw notFound('Menu category not found.');
  await audit({ req, action: 'menu.category_updated', business: req.business._id, targetType: 'MenuCategory', targetId: category._id });
  res.json({ category });
}));

r.delete('/categories/:id', requireBusiness('menu.write'), asyncH(async (req, res) => {
  if (await MenuItem.exists({ business: req.business._id, category: req.params.id })) {
    throw conflict("Move or remove this category's menu items before deleting it.");
  }
  const category = await MenuCategory.findOneAndDelete({ _id: req.params.id, business: req.business._id });
  if (!category) throw notFound('Menu category not found.');
  await audit({ req, action: 'menu.category_deleted', business: req.business._id, targetType: 'MenuCategory', targetId: category._id });
  res.json({ ok: true });
}));

r.get('/items', requireBusiness('menu.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { business: req.business._id };
  if (req.query.category && /^[a-f\d]{24}$/i.test(String(req.query.category))) filter.category = req.query.category;
  if (req.query.published === 'true') filter.published = true;
  if (req.query.published === 'false') filter.published = false;
  if (req.query.available === 'true') filter.available = true;
  if (req.query.available === 'false') filter.available = false;
  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort({ category: 1, sortOrder: 1, name: 1 }).skip(skip).limit(limit).populate('category', 'name'),
    MenuItem.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
}));

r.post('/items', requireBusiness('menu.write'), asyncH(async (req, res) => {
  const body = parse(itemBody, req.body);
  await validateCategory(req.business._id, body.category);
  const item = await MenuItem.create({ ...body, business: req.business._id });
  await audit({ req, action: 'menu.item_created', business: req.business._id, targetType: 'MenuItem', targetId: item._id });
  res.status(201).json({ item });
}));

r.patch('/items/:id', requireBusiness('menu.write'), asyncH(async (req, res) => {
  const body = parse(itemBody.partial(), req.body);
  if ('category' in body) await validateCategory(req.business._id, body.category);
  const item = await MenuItem.findOneAndUpdate(
    { _id: req.params.id, business: req.business._id },
    body,
    { new: true, runValidators: true },
  );
  if (!item) throw notFound('Menu item not found.');
  await audit({ req, action: 'menu.item_updated', business: req.business._id, targetType: 'MenuItem', targetId: item._id });
  res.json({ item });
}));

r.delete('/items/:id', requireBusiness('menu.write'), asyncH(async (req, res) => {
  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, business: req.business._id });
  if (!item) throw notFound('Menu item not found.');
  await audit({ req, action: 'menu.item_deleted', business: req.business._id, targetType: 'MenuItem', targetId: item._id });
  res.json({ ok: true });
}));

export default r;
