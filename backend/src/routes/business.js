import { Router } from 'express';
import { Business, Membership, Product, User, Plan } from '../models/index.js';
import { asyncH, bad, conflict, forbidden } from '../lib/errors.js';
import { parse, z, phone, kobo } from '../lib/validate.js';
import { requireAuth, requireBusiness, requirePerm, assertLimit } from '../middleware/auth.js';
import { createSubscription, getAccess } from '../services/subscriptions.js';
import { audit } from '../services/audit.js';

const r = Router();
r.use(requireAuth);

const RESERVED = new Set(['admin', 'api', 'app', 'store', 'login', 'register', 'pricing', 'support', 'zuno', 'www', 'recover', 'mobile-app', 'privacy', 'terms']);
const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, 'Use 3-40 letters, numbers or hyphens').refine((s) => !RESERVED.has(s), 'That store address is reserved');
const addr = z.object({ line: z.string().max(200).optional(), city: z.string().max(80).optional(), state: z.string().max(80).optional() });
const httpsUrl = z.string().url().refine((u) => u.startsWith('https://'), 'Must be an https URL');

r.post('/', asyncH(async (req, res) => {
  const b = parse(z.object({ name: z.string().trim().min(2).max(120), slug: slugSchema, planKey: z.string().min(2).max(40), category: z.string().max(80).optional() }), req.body);
  if (await Business.exists({ slug: b.slug })) throw conflict('That store address is taken.', 'SLUG_TAKEN');
  const plan = await Plan.findOne({ key: b.planKey, active: true });
  if (!plan) throw bad('Choose a valid plan.');
  const owned = await Membership.countDocuments({ user: req.user._id, role: 'owner', status: 'active' });
  if (owned >= 5) throw bad('Business limit reached for one account.');
  const business = await Business.create({ name: b.name, slug: b.slug, category: b.category, owner: req.user._id, email: req.user.email, phone: req.user.phone });
  await Membership.create({ user: req.user._id, business: business._id, role: 'owner' });
  await createSubscription(business._id, b.planKey);
  await audit({ req, action: 'business.created', targetType: 'Business', targetId: business._id, business: business._id });
  res.status(201).json({ business });
}));

r.get('/slug-available/:slug', asyncH(async (req, res) => {
  const s = slugSchema.safeParse(req.params.slug);
  res.json({ available: s.success && !(await Business.exists({ slug: s.data })) });
}));

r.get('/current', requireBusiness(null, { allowSuspended: true }), asyncH(async (req, res) => {
  const b = req.business;
  const [products, access] = await Promise.all([Product.countDocuments({ business: b._id, archived: false }), getAccess(b._id)]);
  const overrideFeatures = access.access && access.sub?.override?.until > new Date() ? access.sub.override.features || [] : [];
  const availableFeatures = access.access ? [...new Set([...(access.plan?.features || []), ...overrideFeatures])] : [];
  const profileDone = !!(b.category && b.phone && b.address?.city);
  const steps = [
    { key: 'profile', label: 'Add business details', done: profileDone },
    { key: 'plan', label: 'Activate your plan', done: access.access },
    { key: 'products', label: 'Add your first product', done: products > 0 },
    { key: 'publish', label: 'Publish your store', done: b.storePublished },
  ];
  res.json({
    business: b, role: req.role, permissions: ['business.update', 'products.write', 'orders.write', 'pos.sell', 'pos.discount', 'pos.refund', 'inventory.adjust', 'reports.read', 'suppliers.write', 'customers.write', 'staff.manage', 'billing.manage', 'apps.read'].filter(req.can),
    subscription: { state: access.state, plan: access.plan && { key: access.plan.key, name: access.plan.name, features: access.plan.features, limits: access.plan.limits }, features: availableFeatures, currentPeriodEnd: access.sub?.currentPeriodEnd, setupStatus: access.sub?.setupStatus },
    setup: { steps, complete: steps.every((s) => s.done) },
  });
}));

r.patch('/current', requireBusiness('business.update'), asyncH(async (req, res) => {
  const b = parse(z.object({
    name: z.string().trim().min(2).max(120), category: z.string().max(80), description: z.string().max(1000), phone, email: z.string().email(),
    address: addr, logoUrl: httpsUrl.or(z.literal('')), brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), deliveryFee: kobo,
  }).partial(), req.body);
  Object.assign(req.business, b);
  await req.business.save();
  res.json({ business: req.business });
}));

r.post('/current/publish', requireBusiness('business.update'), asyncH(async (req, res) => {
  const { publish } = parse(z.object({ publish: z.boolean() }), req.body);
  const b = req.business;
  if (publish) {
    const { access, plan, sub } = await getAccess(b._id);
    if (!access || !plan.features.includes('online_store')) throw forbidden('Activate your plan in Billing before publishing your store.');
    if (!req.user.emailVerified) throw forbidden('Verify your email before publishing your store.');
    if (!(b.category && b.phone && b.address?.city)) throw bad('Add your category, phone and city first.');
    if (!(await Product.exists({ business: b._id, archived: false, published: true }))) throw bad('Publish at least one product first.');
  }
  b.storePublished = publish;
  await b.save();
  await audit({ req, action: publish ? 'store.published' : 'store.unpublished', targetType: 'Business', targetId: b._id, business: b._id });
  res.json({ business: b });
}));

// ---- team ----
r.get('/current/members', requireBusiness('staff.manage'), asyncH(async (req, res) => {
  const ms = await Membership.find({ business: req.business._id, status: 'active' }).populate('user', 'name email phone');
  res.json({ members: ms.map((m) => ({ id: m._id, role: m.role, user: m.user })) });
}));

r.post('/current/members', requireBusiness('staff.manage'), asyncH(async (req, res) => {
  const b = parse(z.object({ email: z.string().email(), role: z.enum(['manager', 'cashier']) }), req.body);
  const count = await Membership.countDocuments({ business: req.business._id, status: 'active' });
  await assertLimit(req, 'staff', count);
  const user = await User.findOne({ email: b.email.toLowerCase(), status: 'active' });
  if (!user) throw bad('No Zuno account exists for that email. Ask them to register first.');
  const existing = await Membership.findOne({ user: user._id, business: req.business._id });
  if (existing?.status === 'active') throw conflict('They are already on this team.');
  if (existing) { existing.status = 'active'; existing.role = b.role; await existing.save(); }
  else await Membership.create({ user: user._id, business: req.business._id, role: b.role });
  await audit({ req, action: 'team.member_added', business: req.business._id, targetType: 'User', targetId: user._id, meta: { role: b.role } });
  res.status(201).json({ ok: true });
}));

r.patch('/current/members/:id', requireBusiness('staff.manage'), asyncH(async (req, res) => {
  const b = parse(z.object({ role: z.enum(['manager', 'cashier']) }), req.body);
  const m = await Membership.findOne({ _id: req.params.id, business: req.business._id, status: 'active' });
  if (!m || m.role === 'owner') throw bad('Member not found or cannot be changed.');
  m.role = b.role; await m.save();
  await audit({ req, action: 'team.role_changed', business: req.business._id, targetType: 'User', targetId: m.user, meta: { role: b.role } });
  res.json({ ok: true });
}));

r.delete('/current/members/:id', requireBusiness('staff.manage'), asyncH(async (req, res) => {
  const m = await Membership.findOne({ _id: req.params.id, business: req.business._id, status: 'active' });
  if (!m || m.role === 'owner') throw bad('Member not found or cannot be removed.');
  m.status = 'revoked'; await m.save();
  await audit({ req, action: 'team.member_removed', business: req.business._id, targetType: 'User', targetId: m.user });
  res.json({ ok: true });
}));

export default r;
