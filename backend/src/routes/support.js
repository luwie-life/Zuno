import { Router } from 'express';
import { SupportTicket } from '../models/index.js';
import { asyncH, notFound, conflict } from '../lib/errors.js';
import { parse, z, pageParams, escapeRegex } from '../lib/validate.js';
import { newReference } from '../lib/tokens.js';
import { requireAuth, requireBusiness, requirePlatform } from '../middleware/auth.js';
import { supportMachine } from '../lib/statusMachines.js';
import { sendMail } from '../services/mailer.js';
import { audit } from '../services/audit.js';
import { User } from '../models/index.js';

export const merchantSupport = Router();
merchantSupport.use(requireAuth);
const cats = ['account_access', 'account_recovery', 'store_setup', 'products_inventory', 'pos_sales', 'payments', 'subscriptions', 'mobile_app', 'other'];
const view = (t) => ({ id: t._id, reference: t.reference, category: t.category, subject: t.subject, status: t.status, createdAt: t.createdAt, updatedAt: t.updatedAt, messages: t.messages.filter((m) => !m.internal).map((m) => ({ at: m.at, author: m.author, body: m.body })) });

merchantSupport.get('/', requireBusiness('support.write', { allowSuspended: true }), asyncH(async (req, res) => {
  const f = { business: req.business._id };
  if (!req.can('reports.read')) f.createdBy = req.user._id; // cashiers see only their own tickets
  res.json({ items: (await SupportTicket.find(f).sort('-updatedAt').limit(100)).map(view) });
}));
merchantSupport.post('/', requireBusiness('support.write', { allowSuspended: true }), asyncH(async (req, res) => {
  const b = parse(z.object({ category: z.enum(cats), subject: z.string().trim().min(3).max(160), message: z.string().trim().min(5).max(4000) }), req.body);
  const t = await SupportTicket.create({ reference: newReference('SP', 8), business: req.business._id, createdBy: req.user._id, category: b.category, subject: b.subject, messages: [{ author: 'merchant', user: req.user._id, body: b.message }] });
  res.status(201).json({ ticket: view(t) });
}));
async function mine(req) {
  const f = { _id: req.params.id, business: req.business._id };
  if (!req.can('reports.read')) f.createdBy = req.user._id;
  const t = await SupportTicket.findOne(f);
  if (!t) throw notFound('Request not found');
  return t;
}
merchantSupport.get('/:id', requireBusiness('support.write', { allowSuspended: true }), asyncH(async (req, res) => res.json({ ticket: view(await mine(req)) })));
merchantSupport.post('/:id/reply', requireBusiness('support.write', { allowSuspended: true }), asyncH(async (req, res) => {
  const { message } = parse(z.object({ message: z.string().trim().min(2).max(4000) }), req.body);
  const t = await mine(req);
  if (t.status === 'closed') throw conflict('This request is closed. Open a new one.');
  t.messages.push({ author: 'merchant', user: req.user._id, body: message });
  if (['waiting_on_merchant', 'resolved'].includes(t.status)) t.status = 'open';
  await t.save();
  res.json({ ticket: view(t) });
}));

// ---------- platform ----------
export const adminSupport = Router();
adminSupport.use(requireAuth, requirePlatform('support.manage'));
const adminView = (t) => ({ ...view(t), business: t.business, assignedTo: t.assignedTo, messages: t.messages.map((m) => ({ at: m.at, author: m.author, body: m.body, internal: m.internal })) });

adminSupport.get('/', asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.category) f.category = req.query.category;
  if (req.query.search) f.$or = [{ reference: new RegExp(escapeRegex(String(req.query.search).slice(0, 30)), 'i') }, { subject: new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i') }];
  const [items, total] = await Promise.all([SupportTicket.find(f).sort('-updatedAt').skip(skip).limit(limit).populate('business', 'name slug'), SupportTicket.countDocuments(f)]);
  res.json({ items: items.map((t) => ({ ...view(t), business: t.business, assignedTo: t.assignedTo })), total, page, limit });
}));
adminSupport.get('/:id', asyncH(async (req, res) => { const t = await SupportTicket.findById(req.params.id).populate('business', 'name slug'); if (!t) throw notFound(); res.json({ ticket: { ...adminView(t), business: t.business } }); }));
adminSupport.post('/:id/reply', asyncH(async (req, res) => {
  const b = parse(z.object({ message: z.string().trim().min(2).max(4000), internal: z.boolean().default(false) }), req.body);
  const t = await SupportTicket.findById(req.params.id);
  if (!t) throw notFound();
  t.messages.push({ author: 'staff', user: req.user._id, body: b.message, internal: b.internal });
  if (!b.internal && ['open'].includes(t.status)) t.status = 'in_progress';
  await t.save();
  if (!b.internal) { const u = await User.findById(t.createdBy); if (u) await sendMail({ user: u, to: u.email, template: 'support_reply', subject: `Update on ${t.reference}`, text: `Our team replied to your request ${t.reference}. Sign in to Zuno and open Support to read it.` }); }
  await audit({ req, action: b.internal ? 'support.note_added' : 'support.replied', business: t.business, targetType: 'SupportTicket', targetId: t._id });
  res.json({ ticket: adminView(t) });
}));
adminSupport.patch('/:id', asyncH(async (req, res) => {
  const b = parse(z.object({ status: z.enum(['open', 'in_progress', 'waiting_on_merchant', 'escalated', 'resolved', 'closed']).optional(), assignedTo: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional() }), req.body);
  const t = await SupportTicket.findById(req.params.id);
  if (!t) throw notFound();
  if (b.status && b.status !== t.status) { supportMachine.assert(t.status, b.status); t.status = b.status; }
  if (b.assignedTo !== undefined) t.assignedTo = b.assignedTo || undefined;
  await t.save();
  await audit({ req, action: 'support.updated', business: t.business, targetType: 'SupportTicket', targetId: t._id, meta: b });
  res.json({ ticket: adminView(t) });
}));
