import { Router } from 'express';
import { Customer, Order, Sale } from '../models/index.js';
import { asyncH, notFound } from '../lib/errors.js';
import { parse, z, phone, escapeRegex, pageParams } from '../lib/validate.js';
import { requireAuth, requireBusiness, requireFeature } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);
const body = z.object({ name: z.string().trim().min(2).max(120), phone: phone.optional(), email: z.string().email().optional(), address: z.object({ line: z.string().max(200), city: z.string().max(80), state: z.string().max(80) }).partial().optional() });

r.get('/', requireBusiness('customers.read'), requireFeature('customers'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { business: req.business._id };
  if (req.query.search) { const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i'); f.$or = [{ name: rx }, { phone: rx }, { email: rx }]; }
  const [items, total] = await Promise.all([Customer.find(f).sort('-updatedAt').skip(skip).limit(limit), Customer.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));
r.post('/', requireBusiness('customers.write'), requireFeature('customers'), asyncH(async (req, res) => {
  const b = parse(body, req.body);
  const dupe = await Customer.findOne({ business: req.business._id, $or: [...(b.phone ? [{ phone: b.phone }] : []), ...(b.email ? [{ email: b.email.toLowerCase() }] : [])] });
  if (dupe) return res.status(200).json({ customer: dupe, existing: true });
  res.status(201).json({ customer: await Customer.create({ ...b, business: req.business._id }) });
}));
r.get('/:id', requireBusiness('customers.read'), requireFeature('customers'), asyncH(async (req, res) => {
  const c = await Customer.findOne({ _id: req.params.id, business: req.business._id });
  if (!c) throw notFound('Customer not found');
  const [orders, sales] = await Promise.all([Order.find({ business: req.business._id, customer: c._id }).sort('-createdAt').limit(50).select('ref total paymentStatus fulfilmentStatus createdAt'), Sale.find({ business: req.business._id, customer: c._id }).sort('-createdAt').limit(50).select('receiptNo total paymentStatus createdAt')]);
  res.json({ customer: c, orders, sales });
}));
r.patch('/:id', requireBusiness('customers.write'), requireFeature('customers'), asyncH(async (req, res) => {
  const c = await Customer.findOneAndUpdate({ _id: req.params.id, business: req.business._id }, parse(body.partial(), req.body), { new: true });
  if (!c) throw notFound('Customer not found');
  res.json({ customer: c });
}));
export default r;
