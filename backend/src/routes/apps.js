import { Router } from 'express';
import { AppApplication, Business, User } from '../models/index.js';
import { asyncH, notFound, conflict, forbidden, bad } from '../lib/errors.js';
import { parse, z, phone, kobo, pageParams, escapeRegex } from '../lib/validate.js';
import { newReference } from '../lib/tokens.js';
import { requireAuth, requireBusiness, requirePlatform } from '../middleware/auth.js';
import { appMachine, APP_MERCHANT_EDGES } from '../lib/statusMachines.js';
import { getSettings } from '../services/settings.js';
import { sendMail } from '../services/mailer.js';
import { audit } from '../services/audit.js';

export const publicApps = Router();
publicApps.get('/pricing', asyncH(async (req, res) => { const s = await getSettings(); res.json({ setupFrom: s.appSetupFrom, monthlyFrom: s.appMonthlyFrom, note: 'Indicative starting prices. Every app is quoted individually.' }); }));

const form = z.object({
  businessName: z.string().trim().min(2).max(120), applicantName: z.string().trim().min(2).max(120), email: z.string().email(), phone,
  category: z.string().max(80).optional(), storeSlug: z.string().max(60).optional(), reason: z.string().trim().min(10).max(2000),
  platform: z.enum(['android', 'ios', 'both']), features: z.array(z.string().max(80)).max(20).optional(), brandAssets: z.array(z.string().url().max(500)).max(10).optional(),
  additional: z.string().max(2000).optional(), preferredContact: z.enum(['email', 'phone', 'whatsapp']),
});
const merchantView = (a) => ({ id: a._id, reference: a.reference, form: a.form, status: a.status, messages: a.messages, quotation: a.quotation?.issuedAt ? a.quotation : undefined, setupPayment: { status: a.setupPayment?.status }, supportArrangement: a.supportArrangement, progress: (a.progress || []).map((p) => ({ at: p.at, note: p.note })), delivery: a.status === 'delivered' ? a.delivery : undefined, history: a.history.map((h) => ({ at: h.at, from: h.from, to: h.to })), createdAt: a.createdAt, updatedAt: a.updatedAt });

export const merchantApps = Router();
merchantApps.use(requireAuth);
merchantApps.get('/', requireBusiness('apps.read'), asyncH(async (req, res) => res.json({ items: (await AppApplication.find({ business: req.business._id }).sort('-createdAt')).map(merchantView) })));
merchantApps.get('/:id', requireBusiness('apps.read'), asyncH(async (req, res) => {
  const a = await AppApplication.findOne({ _id: req.params.id, business: req.business._id });
  if (!a) throw notFound('Application not found'); res.json({ application: merchantView(a) });
}));
merchantApps.post('/', requireBusiness('billing.manage'), asyncH(async (req, res) => {
  const b = parse(form.extend({ submit: z.boolean().default(true) }), req.body);
  const { submit, ...f } = b;
  // Submitting an application never creates a charge. Pricing is only a quotation issued by staff.
  const a = await AppApplication.create({ reference: newReference('MA', 8), business: req.business._id, createdBy: req.user._id, form: f, status: submit ? 'submitted' : 'draft', history: [{ at: new Date(), by: req.user._id, to: submit ? 'submitted' : 'draft' }] });
  await audit({ req, action: 'app.created', business: req.business._id, targetType: 'AppApplication', targetId: a._id });
  res.status(201).json({ application: merchantView(a) });
}));
merchantApps.patch('/:id', requireBusiness('billing.manage'), asyncH(async (req, res) => {
  const a = await AppApplication.findOne({ _id: req.params.id, business: req.business._id });
  if (!a) throw notFound('Application not found');
  if (a.status !== 'draft') throw conflict('Only drafts can be edited. Send a message instead.');
  a.form = { ...a.form.toObject(), ...parse(form.partial(), req.body) }; await a.save();
  res.json({ application: merchantView(a) });
}));
merchantApps.post('/:id/message', requireBusiness('billing.manage'), asyncH(async (req, res) => {
  const { message } = parse(z.object({ message: z.string().trim().min(2).max(3000) }), req.body);
  const a = await AppApplication.findOne({ _id: req.params.id, business: req.business._id });
  if (!a) throw notFound('Application not found');
  if (['delivered', 'rejected', 'cancelled'].includes(a.status)) throw conflict('This application is closed.');
  a.messages.push({ author: 'merchant', body: message });
  if (a.status === 'more_info_required') { appMachine.assert(a.status, 'under_review'); a.history.push({ at: new Date(), by: req.user._id, from: a.status, to: 'under_review' }); a.status = 'under_review'; }
  await a.save(); res.json({ application: merchantView(a) });
}));
// Merchants may only use the limited edge set; everything else is staff-only and validated server-side.
merchantApps.post('/:id/status', requireBusiness('billing.manage'), asyncH(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['submitted', 'under_review', 'cancelled', 'approved', 'rejected']) }), req.body);
  const a = await AppApplication.findOne({ _id: req.params.id, business: req.business._id });
  if (!a) throw notFound('Application not found');
  if (!(APP_MERCHANT_EDGES[a.status] || []).includes(status)) throw forbidden('You cannot make that change.');
  appMachine.assert(a.status, status);
  a.history.push({ at: new Date(), by: req.user._id, from: a.status, to: status }); a.status = status; await a.save();
  await audit({ req, action: `app.merchant_${status}`, business: req.business._id, targetType: 'AppApplication', targetId: a._id });
  res.json({ application: merchantView(a) });
}));

// ---------- platform ----------
export const adminApps = Router();
adminApps.use(requireAuth, requirePlatform('apps.review'));
adminApps.get('/', asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.search) { const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 60)), 'i'); f.$or = [{ reference: rx }, { 'form.businessName': rx }, { 'form.email': rx }]; }
  const [items, total] = await Promise.all([AppApplication.find(f).sort('-updatedAt').skip(skip).limit(limit).populate('business', 'name slug'), AppApplication.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));
adminApps.get('/:id', asyncH(async (req, res) => { const a = await AppApplication.findById(req.params.id).populate('business', 'name slug'); if (!a) throw notFound(); res.json({ application: a }); }));

async function notifyMerchant(a, subject, text) { const u = await User.findById(a.createdBy); if (u) await sendMail({ user: u, to: u.email, template: 'app_update', subject, text }); }

adminApps.post('/:id/status', asyncH(async (req, res) => {
  const b = parse(z.object({ status: z.enum(['under_review', 'more_info_required', 'quotation_issued', 'approved', 'in_development', 'ready_for_review', 'delivered', 'rejected', 'cancelled']), reason: z.string().max(500).optional() }), req.body);
  const a = await AppApplication.findById(req.params.id);
  if (!a) throw notFound();
  appMachine.assert(a.status, b.status);
  if (b.status === 'quotation_issued' && !a.quotation?.issuedAt) throw bad('Record a quotation before moving to Quotation issued.');
  if (b.status === 'in_development' && !['paid', 'waived'].includes(a.setupPayment?.status)) throw conflict('Record the setup-fee payment (or a waiver) before development starts.');
  if (b.status === 'delivered') a.delivery = { ...(a.delivery?.toObject?.() || {}), deliveredAt: new Date() };
  a.history.push({ at: new Date(), by: req.user._id, from: a.status, to: b.status }); a.status = b.status;
  await a.save();
  await audit({ req, action: 'app.status_changed', business: a.business, targetType: 'AppApplication', targetId: a._id, reason: b.reason, meta: { to: b.status } });
  await notifyMerchant(a, `Mobile app application ${a.reference}: ${b.status.replace(/_/g, ' ')}`, `Your branded app application ${a.reference} is now "${b.status.replace(/_/g, ' ')}". Sign in to Zuno and open Mobile App for details.`);
  res.json({ application: a });
}));
adminApps.post('/:id/message', asyncH(async (req, res) => {
  const { message } = parse(z.object({ message: z.string().trim().min(2).max(3000) }), req.body);
  const a = await AppApplication.findByIdAndUpdate(req.params.id, { $push: { messages: { author: 'staff', body: message } } }, { new: true });
  if (!a) throw notFound(); await notifyMerchant(a, `New message on ${a.reference}`, 'We replied to your mobile app application. Sign in to Zuno to read it.'); res.json({ application: a });
}));
adminApps.post('/:id/note', asyncH(async (req, res) => {
  const { note } = parse(z.object({ note: z.string().trim().min(2).max(3000) }), req.body);
  const a = await AppApplication.findByIdAndUpdate(req.params.id, { $push: { internalNotes: { at: new Date(), by: req.user._id, body: note } } }, { new: true });
  if (!a) throw notFound(); res.json({ application: a });
}));
adminApps.post('/:id/quotation', requirePlatform('apps.quote'), asyncH(async (req, res) => {
  const b = parse(z.object({ setupFee: kobo, monthlyFee: kobo, notes: z.string().max(2000).optional() }), req.body);
  const a = await AppApplication.findById(req.params.id);
  if (!a) throw notFound();
  if (!['under_review', 'quotation_issued'].includes(a.status)) throw conflict('Move the application to Under review before quoting.');
  a.quotation = { ...b, issuedAt: new Date(), issuedBy: req.user._id }; // recording a quotation never charges the merchant
  await a.save();
  await audit({ req, action: 'app.quotation_recorded', business: a.business, targetType: 'AppApplication', targetId: a._id, meta: b });
  res.json({ application: a });
}));
adminApps.post('/:id/payment', requirePlatform('apps.quote'), asyncH(async (req, res) => {
  const b = parse(z.object({ setupStatus: z.enum(['unpaid', 'paid', 'waived']).optional(), note: z.string().max(500).optional(), support: z.object({ status: z.enum(['none', 'agreed', 'active', 'ended']), monthlyFee: kobo.optional(), note: z.string().max(500).optional() }).optional() }), req.body);
  const a = await AppApplication.findById(req.params.id);
  if (!a) throw notFound();
  if (b.setupStatus) a.setupPayment = { status: b.setupStatus, recordedBy: req.user._id, at: new Date(), note: b.note };
  if (b.support) a.supportArrangement = b.support; // tracked separately from the one-time setup payment
  await a.save();
  await audit({ req, action: 'app.payment_recorded', business: a.business, targetType: 'AppApplication', targetId: a._id, meta: b });
  res.json({ application: a });
}));
adminApps.post('/:id/progress', asyncH(async (req, res) => {
  const b = parse(z.object({ note: z.string().trim().min(2).max(1000), delivery: z.object({ notes: z.string().max(1000), androidUrl: z.string().url().optional(), iosUrl: z.string().url().optional() }).partial().optional() }), req.body);
  const a = await AppApplication.findById(req.params.id);
  if (!a) throw notFound();
  a.progress.push({ at: new Date(), by: req.user._id, note: b.note });
  if (b.delivery) a.delivery = { ...(a.delivery?.toObject?.() || {}), ...b.delivery };
  await a.save(); res.json({ application: a });
}));
