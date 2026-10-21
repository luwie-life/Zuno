import { Router } from 'express';
import { User, Business, Membership, Subscription, Plan, Payment, SupportTicket, RecoveryRequest, AppApplication, AuditLog, Session, PlatformSettings } from '../../models/index.js';
import { asyncH, notFound, bad, conflict, forbidden } from '../../lib/errors.js';
import { parse, z, objectId, kobo, pageParams, escapeRegex } from '../../lib/validate.js';
import { requireAuth, requirePlatform } from '../../middleware/auth.js';
import { getAccess } from '../../services/subscriptions.js';
import { getSettings } from '../../services/settings.js';
import { audit } from '../../services/audit.js';
import { releaseExpiredReservations } from '../../services/orders.js';
import { expireAndRenewDue } from '../../services/subscriptions.js';
import { reconcilePayments } from '../../services/payments.js';

const r = Router();
r.use(requireAuth);

r.get('/me', requirePlatform(), (req, res) => res.json({ role: req.platformRole, user: { name: req.user.name, email: req.user.email } }));

r.get('/overview', requirePlatform('overview.read'), asyncH(async (req, res) => {
  const [merchants, businesses, active, suspended, subs, payments, openSupport, pendingRecovery, pendingApps, recent] = await Promise.all([
    User.countDocuments({ platformRole: null }), Business.countDocuments(), Business.countDocuments({ status: 'active' }), Business.countDocuments({ status: 'suspended' }),
    Subscription.find({ suspended: false, currentPeriodEnd: { $gt: new Date() } }).countDocuments(),
    Payment.aggregate([{ $match: { status: 'success', purpose: { $in: ['setup_fee', 'subscription'] } } }, { $group: { _id: '$purpose', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_on_merchant', 'escalated'] } }),
    RecoveryRequest.countDocuments({ status: { $in: ['submitted', 'under_review', 'more_info_required', 'awaiting_applicant_verification', 'verification_in_progress'] } }),
    AppApplication.countDocuments({ status: { $in: ['submitted', 'under_review', 'more_info_required'] } }),
    AuditLog.find({ actorType: 'platform' }).sort('-createdAt').limit(8).populate('actor', 'name'),
  ]);
  res.json({ merchants, businesses, activeBusinesses: active, suspendedBusinesses: suspended, activeSubscriptions: subs, verifiedPlatformRevenue: payments.map((p) => ({ purpose: p._id, total: p.total, count: p.count })), openSupport, pendingRecovery, pendingApps, recentActions: recent.map((a) => ({ id: a._id, action: a.action, actor: a.actor?.name, at: a.createdAt, reason: a.reason })) });
}));

r.get('/merchants', requirePlatform('merchants.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { platformRole: null };
  if (req.query.status) f.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');
    const bizUsers = (await Business.find({ $or: [{ name: rx }, { slug: rx }] }).select('owner').limit(50)).map((b) => b.owner);
    f.$or = [{ name: rx }, { email: rx }, { phone: rx }, { _id: { $in: bizUsers } }];
  }
  if (req.query.from) f.createdAt = { $gte: new Date(req.query.from) };
  const [items, total] = await Promise.all([User.find(f).sort('-createdAt').skip(skip).limit(limit), User.countDocuments(f)]);
  res.json({ items: items.map((u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, status: u.status, emailVerified: u.emailVerified, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt })), total, page, limit });
}));

r.get('/merchants/:id', requirePlatform('merchants.read'), asyncH(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw notFound();
  const memberships = await Membership.find({ user: u._id }).populate('business', 'name slug status');
  const bizIds = memberships.map((m) => m.business?._id).filter(Boolean);
  const [subs, payments, tickets, recovery, logs, sessions] = await Promise.all([
    Subscription.find({ business: { $in: bizIds } }).populate('plan', 'name key'),
    Payment.find({ business: { $in: bizIds }, purpose: { $in: ['setup_fee', 'subscription'] } }).sort('-createdAt').limit(30).select('purpose amount status reference createdAt'),
    SupportTicket.find({ createdBy: u._id }).sort('-createdAt').limit(20).select('reference subject status createdAt'),
    RecoveryRequest.find({ user: u._id }).sort('-createdAt').limit(20).select('reference category status createdAt'),
    AuditLog.find({ $or: [{ actor: u._id }, { targetId: u._id }] }).sort('-createdAt').limit(40).select('action actorType createdAt outcome reason ip'),
    Session.countDocuments({ user: u._id, revokedAt: null, expiresAt: { $gt: new Date() } }),
  ]);
  res.json({
    profile: { id: u._id, name: u.name, email: u.email, phone: u.phone, status: u.status, emailVerified: u.emailVerified, phoneVerified: u.phoneVerified, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, activeSessions: sessions },
    memberships: memberships.map((m) => ({ id: m._id, role: m.role, status: m.status, business: m.business })), subscriptions: subs, payments, tickets, recovery, activity: logs,
  });
}));

r.get('/businesses', requirePlatform('businesses.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.search) { const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i'); f.$or = [{ name: rx }, { slug: rx }, { email: rx }, { phone: rx }]; }
  const [items, total] = await Promise.all([Business.find(f).sort('-createdAt').skip(skip).limit(limit).populate('owner', 'name email'), Business.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.get('/businesses/:id', requirePlatform('businesses.read'), asyncH(async (req, res) => {
  const b = await Business.findById(req.params.id).populate('owner', 'name email phone');
  if (!b) throw notFound();
  const { sub, plan, state } = await getAccess(b._id);
  const [members, logs] = await Promise.all([Membership.find({ business: b._id }).populate('user', 'name email'), AuditLog.find({ business: b._id }).sort('-createdAt').limit(40)]);
  res.json({ business: b, subscription: sub && { state, plan: plan?.name, setupStatus: sub.setupStatus, currentPeriodEnd: sub.currentPeriodEnd, override: sub.override, suspended: sub.suspended }, members, activity: logs });
}));

r.post('/businesses/:id/suspend', requirePlatform('businesses.write'), asyncH(async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5).max(500) }), req.body);
  const b = await Business.findByIdAndUpdate(req.params.id, { status: 'suspended', suspensionReason: reason, storePublished: false }, { new: true }); // data is kept
  if (!b) throw notFound();
  await audit({ req, action: 'business.suspended', business: b._id, targetType: 'Business', targetId: b._id, reason });
  res.json({ business: b });
}));
r.post('/businesses/:id/restore', requirePlatform('businesses.write'), asyncH(async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5).max(500) }), req.body);
  const b = await Business.findByIdAndUpdate(req.params.id, { status: 'active', $unset: { suspensionReason: 1 } }, { new: true });
  if (!b) throw notFound();
  await audit({ req, action: 'business.restored', business: b._id, targetType: 'Business', targetId: b._id, reason });
  res.json({ business: b });
}));
r.post('/users/:id/status', requirePlatform('*'), asyncH(async (req, res) => {
  const { status, reason } = parse(z.object({ status: z.enum(['active', 'suspended']), reason: z.string().trim().min(5).max(500) }), req.body);
  const u = await User.findById(req.params.id);
  if (!u) throw notFound();
  if (u.platformRole) throw forbidden('Platform staff accounts cannot be changed here.');
  u.status = status; await u.save();
  if (status === 'suspended') await Session.updateMany({ user: u._id, revokedAt: null }, { revokedAt: new Date() });
  await audit({ req, action: `user.${status}`, targetType: 'User', targetId: u._id, reason });
  res.json({ ok: true });
}));

// ----- plans & subscriptions -----
r.get('/plans', requirePlatform('subscriptions.read'), asyncH(async (req, res) => res.json({ plans: await Plan.find().sort('sortOrder') })));
r.patch('/plans/:id', requirePlatform('plans.write'), asyncH(async (req, res) => {
  const b = parse(z.object({ name: z.string().min(2).max(80), description: z.string().max(400), setupFee: kobo, monthlyFee: kobo, priceIsFrom: z.boolean(), features: z.array(z.string().max(40)).max(40), limits: z.object({ products: z.number().int().min(-1), staff: z.number().int().min(-1) }), active: z.boolean(), reason: z.string().min(3).max(300) }).partial().required({ reason: true }), req.body);
  const { reason, ...patch } = b;
  const before = await Plan.findById(req.params.id);
  if (!before) throw notFound();
  const p = await Plan.findByIdAndUpdate(req.params.id, patch, { new: true });
  await audit({ req, action: 'plan.updated', targetType: 'Plan', targetId: p._id, reason, meta: { before: { setupFee: before.setupFee, monthlyFee: before.monthlyFee, features: before.features, limits: before.limits }, after: patch } });
  res.json({ plan: p });
}));

r.get('/subscriptions', requirePlatform('subscriptions.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const [subs, total] = await Promise.all([Subscription.find().sort('-updatedAt').skip(skip).limit(limit).populate('business', 'name slug status').populate('plan', 'name key'), Subscription.countDocuments()]);
  const settings = await getSettings();
  const { computeSubscriptionState } = await import('../../lib/subscriptionRules.js');
  res.json({ items: subs.map((s) => ({ id: s._id, business: s.business, plan: s.plan, state: computeSubscriptionState(s, s.plan, new Date(), settings.graceDays), setupStatus: s.setupStatus, currentPeriodEnd: s.currentPeriodEnd, failedRenewals: s.failedRenewals, override: s.override })), total, page, limit });
}));
r.post('/subscriptions/:id/override', requirePlatform('subscriptions.write'), asyncH(async (req, res) => {
  const b = parse(z.object({ until: z.coerce.date(), features: z.array(z.string()).max(40).default([]), reason: z.string().trim().min(5).max(500), setupWaived: z.boolean().optional(), extendPeriodTo: z.coerce.date().optional(), suspended: z.boolean().optional() }), req.body);
  const s = await Subscription.findById(req.params.id);
  if (!s) throw notFound();
  s.override = { until: b.until, features: b.features, reason: b.reason, by: req.user._id };
  if (b.setupWaived) s.setupStatus = 'waived';
  if (b.extendPeriodTo) s.currentPeriodEnd = b.extendPeriodTo;
  if (b.suspended !== undefined) s.suspended = b.suspended;
  await s.save();
  await audit({ req, action: 'subscription.override', business: s.business, targetType: 'Subscription', targetId: s._id, reason: b.reason, meta: { until: b.until, features: b.features, setupWaived: b.setupWaived, extendPeriodTo: b.extendPeriodTo, suspended: b.suspended } });
  res.json({ ok: true });
}));

r.get('/payments', requirePlatform('payments.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = { context: { $in: ['platform', null] }, purpose: { $in: ['setup_fee', 'subscription', 'app_setup'] } };
  if (req.query.status) f.status = req.query.status;
  if (req.query.purpose) f.purpose = req.query.purpose;
  if (req.query.search) f.reference = new RegExp(escapeRegex(String(req.query.search).slice(0, 40)), 'i');
  const [items, total] = await Promise.all([Payment.find(f).sort('-createdAt').skip(skip).limit(limit).populate('business', 'name slug').select('purpose amount currency status reference provider context providerTransactionId channel verifiedAt createdAt business applied'), Payment.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.get('/audit', requirePlatform('audit.read'), asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = {};
  if (req.query.action) f.action = new RegExp('^' + escapeRegex(String(req.query.action).slice(0, 40)));
  if (req.query.business && /^[a-f\d]{24}$/i.test(req.query.business)) f.business = req.query.business;
  const [items, total] = await Promise.all([AuditLog.find(f).sort('-createdAt').skip(skip).limit(limit).populate('actor', 'name email'), AuditLog.countDocuments(f)]);
  res.json({ items, total, page, limit });
}));

r.get('/settings', requirePlatform('*'), asyncH(async (req, res) => res.json({ settings: await getSettings() })));
r.patch('/settings', requirePlatform('*'), asyncH(async (req, res) => {
  const b = parse(z.object({ graceDays: z.number().int().min(0).max(60), appSetupFrom: kobo, appMonthlyFrom: kobo, reservationMinutes: z.number().int().min(5).max(240), recoveryTokenMinutes: z.number().int().min(10).max(1440), supportEmail: z.string().email().or(z.literal('')), supportPhone: z.string().max(30), reason: z.string().min(3).max(300) }).partial().required({ reason: true }), req.body);
  const { reason, ...patch } = b;
  const before = (await getSettings()).toObject();
  const s = await PlatformSettings.findOneAndUpdate({ key: 'platform' }, patch, { new: true, upsert: true });
  await audit({ req, action: 'settings.updated', reason, meta: { before, after: patch } });
  res.json({ settings: s });
}));

r.post('/jobs/run', requirePlatform('subscriptions.write'), asyncH(async (req, res) => {
  const released = await releaseExpiredReservations();
  const renewals = await expireAndRenewDue();
  const reconciled = await reconcilePayments();
  await audit({ req, action: 'jobs.run_manual', meta: { released, renewals, reconciled } });
  res.json({ released, renewals, reconciled });
}));

export default r;
