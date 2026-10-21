import { Router } from 'express';
import { RecoveryRequest, User, Business, Membership, Session, Token } from '../../models/index.js';
import { asyncH, notFound, bad, forbidden } from '../../lib/errors.js';
import { parse, z, pageParams, escapeRegex } from '../../lib/validate.js';
import { requireAuth, requirePlatform } from '../../middleware/auth.js';
import { recoveryMachine } from '../../lib/statusMachines.js';
import { recoveryActionCheck } from '../../lib/recoveryRules.js';
import { newToken } from '../../lib/tokens.js';
import { issueResetToken } from '../auth.js';
import { sendMail } from '../../services/mailer.js';
import { audit } from '../../services/audit.js';
import { env } from '../../config/env.js';

const r = Router();
r.use(requireAuth, requirePlatform('recovery.read'));
const idLike = z.string().regex(/^[a-f\d]{24}$/i);

r.get('/', asyncH(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.category) f.category = req.query.category;
  if (req.query.risk) f.riskLevel = req.query.risk;
  if (req.query.search) f.reference = new RegExp(escapeRegex(String(req.query.search).slice(0, 30)), 'i');
  const [items, total] = await Promise.all([RecoveryRequest.find(f).sort('-createdAt').skip(skip).limit(limit).populate('assignedTo', 'name'), RecoveryRequest.countDocuments(f)]);
  res.json({ items: items.map((x) => ({ id: x._id, reference: x.reference, category: x.category, status: x.status, riskLevel: x.riskLevel, applicantName: x.applicant.name, assignedTo: x.assignedTo, linked: !!x.user, createdAt: x.createdAt })), total, page, limit });
}));

r.get('/:id', asyncH(async (req, res) => {
  const x = await RecoveryRequest.findById(req.params.id).populate('user', 'name email phone status').populate('business', 'name slug').populate('assignedTo', 'name').populate('notes.by verification.by', 'name');
  if (!x) throw notFound();
  res.json({ request: x });
}));

const load = async (id) => { const x = await RecoveryRequest.findById(id); if (!x) throw notFound(); return x; };
const role = (req) => req.platformRole;
const log = (x, req, action, note) => x.actionsTaken.push({ at: new Date(), by: req.user._id, action, note });
const needReview = requirePlatform('recovery.review');

r.post('/:id/assign', needReview, asyncH(async (req, res) => {
  const { assignee } = parse(z.object({ assignee: idLike.nullable() }), req.body);
  const x = await load(req.params.id);
  x.assignedTo = assignee || undefined; log(x, req, 'assigned'); await x.save();
  await audit({ req, action: 'recovery.assigned', targetType: 'RecoveryRequest', targetId: x._id });
  res.json({ ok: true });
}));

r.post('/:id/link', needReview, asyncH(async (req, res) => {
  const b = parse(z.object({ userId: idLike.optional(), businessSlug: z.string().max(60).optional() }), req.body);
  const x = await load(req.params.id);
  if (b.userId) { if (!(await User.exists({ _id: b.userId, platformRole: null }))) throw bad('Merchant not found'); x.user = b.userId; }
  if (b.businessSlug) { const biz = await Business.findOne({ slug: b.businessSlug.toLowerCase() }); if (!biz) throw bad('Business not found'); x.business = biz._id; }
  log(x, req, 'linked_account'); await x.save();
  await audit({ req, action: 'recovery.linked', targetType: 'RecoveryRequest', targetId: x._id });
  res.json({ ok: true });
}));

r.post('/:id/note', needReview, asyncH(async (req, res) => {
  const { body } = parse(z.object({ body: z.string().trim().min(2).max(3000) }), req.body);
  const x = await load(req.params.id);
  x.notes.push({ at: new Date(), by: req.user._id, body }); await x.save(); // private: never exposed by public endpoints
  res.json({ ok: true });
}));

r.post('/:id/verification', needReview, asyncH(async (req, res) => {
  const b = parse(z.object({ method: z.enum(['registered_contact', 'established_recovery_method', 'authenticated_owner', 'business_records', 'authority_evidence', 'manual_review']), outcome: z.enum(['passed', 'failed', 'inconclusive']), note: z.string().trim().min(3).max(1000) }), req.body);
  const x = await load(req.params.id);
  if (['closed', 'rejected'].includes(x.status)) throw bad('Request is closed.');
  x.verification.push({ at: new Date(), by: req.user._id, ...b }); log(x, req, 'verification_recorded', `${b.method}:${b.outcome}`); await x.save();
  await audit({ req, action: 'recovery.verification_recorded', targetType: 'RecoveryRequest', targetId: x._id, meta: { method: b.method, outcome: b.outcome } });
  res.json({ ok: true });
}));

r.post('/:id/status', needReview, asyncH(async (req, res) => {
  const b = parse(z.object({ status: z.enum(['under_review', 'more_info_required', 'awaiting_applicant_verification', 'verification_in_progress', 'approved', 'rejected', 'resolved', 'closed']), reason: z.string().trim().min(3).max(1000), messageToApplicant: z.string().trim().max(2000).optional() }), req.body);
  const x = await load(req.params.id);
  recoveryMachine.assert(x.status, b.status);
  if (b.status === 'approved' && !x.verification.some((v) => v.outcome === 'passed')) throw bad('Record at least one passed verification before approving.');
  if (x.riskLevel === 'high' && ['approved', 'rejected'].includes(b.status) && role(req) !== 'owner') throw forbidden('High-risk requests need a Platform Owner decision.');
  const from = x.status; x.status = b.status;
  if (['approved', 'rejected'].includes(b.status)) x.decision = { outcome: b.status, reason: b.reason, by: req.user._id, at: new Date() };
  if (['resolved', 'closed'].includes(b.status)) x.resolvedAt = new Date();
  if (b.messageToApplicant) x.publicMessages.push({ at: new Date(), from: 'staff', body: b.messageToApplicant });
  log(x, req, `status_${from}_to_${b.status}`, b.reason); await x.save();
  await audit({ req, action: `recovery.${b.status}`, targetType: 'RecoveryRequest', targetId: x._id, reason: b.reason, meta: { from } });
  if (b.messageToApplicant && x.applicant.contactEmail) await sendMail({ to: x.applicant.contactEmail, template: 'recovery_update', subject: `Update on recovery request ${x.reference}`, text: `There is an update on request ${x.reference}. Check progress at ${env.frontendUrl}/recover/status using your reference and access key.` });
  res.json({ ok: true, status: x.status });
}));

// ---- actions that change account access: each is re-checked against pure rules + role ----
async function guard(req, action) {
  const x = await load(req.params.id);
  const c = recoveryActionCheck({ request: x, action, role: role(req) });
  if (!c.ok) throw forbidden(c.reason);
  return x;
}

r.post('/:id/actions/send-reset', requirePlatform('recovery.reset'), asyncH(async (req, res) => {
  const { reason, revokeSessions } = parse(z.object({ reason: z.string().trim().min(5).max(500), revokeSessions: z.boolean().default(false) }), req.body);
  const x = await guard(req, 'send_reset');
  const user = await User.findById(x.user);
  await issueResetToken(user, { initiatedBy: req.user._id, reason }); // link goes ONLY to the registered email; admins never see or set a password
  if (revokeSessions) await Session.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  log(x, req, 'reset_link_sent', reason); await x.save();
  await audit({ req, action: 'recovery.reset_initiated', targetType: 'User', targetId: user._id, related: { kind: 'RecoveryRequest', id: x._id }, reason, meta: { revokeSessions } });
  res.json({ ok: true, message: 'Reset link sent to the registered email address.' });
}));

r.post('/:id/actions/revoke-sessions', needReview, asyncH(async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().min(5).max(500) }), req.body);
  const x = await guard(req, 'revoke_sessions');
  const out = await Session.updateMany({ user: x.user, revokedAt: null }, { revokedAt: new Date() });
  log(x, req, 'sessions_revoked', reason); await x.save();
  await audit({ req, action: 'recovery.sessions_revoked', targetType: 'User', targetId: x.user, related: { kind: 'RecoveryRequest', id: x._id }, reason, meta: { count: out.modifiedCount } });
  res.json({ ok: true, revoked: out.modifiedCount });
}));

r.post('/:id/actions/suspend-user', needReview, asyncH(async (req, res) => {
  const { reason, suspended } = parse(z.object({ reason: z.string().trim().min(5).max(500), suspended: z.boolean() }), req.body);
  const x = await guard(req, 'suspend_user');
  await User.updateOne({ _id: x.user, platformRole: null }, { status: suspended ? 'suspended' : 'active' });
  if (suspended) await Session.updateMany({ user: x.user, revokedAt: null }, { revokedAt: new Date() });
  log(x, req, suspended ? 'user_suspended' : 'user_restored', reason); await x.save();
  await audit({ req, action: suspended ? 'recovery.user_suspended' : 'recovery.user_restored', targetType: 'User', targetId: x.user, related: { kind: 'RecoveryRequest', id: x._id }, reason });
  res.json({ ok: true });
}));

// Sends a confirmation link to the NEW email. The email only changes after that link is used, never because it was typed into a form.
r.post('/:id/actions/change-email', requirePlatform('recovery.review'), asyncH(async (req, res) => {
  const { newEmail, reason } = parse(z.object({ newEmail: z.string().email(), reason: z.string().trim().min(5).max(500) }), req.body);
  const x = await guard(req, 'change_contact');
  if (await User.exists({ email: newEmail.toLowerCase() })) throw bad('That email is already used by another account.');
  const user = await User.findById(x.user);
  const t = newToken();
  await Token.updateMany({ user: user._id, purpose: 'contact_change', usedAt: null }, { usedAt: new Date() });
  await Token.create({ user: user._id, purpose: 'contact_change', tokenHash: t.hash, expiresAt: new Date(Date.now() + 24 * 3600_000), initiatedBy: req.user._id, meta: { newEmail: newEmail.toLowerCase(), requestId: x._id } });
  await sendMail({ user, to: newEmail, template: 'contact_change_confirm', subject: 'Confirm your new Zuno email', text: `Confirm this address as the email for your Zuno account:\n${env.frontendUrl}/confirm-contact?token=${t.raw}\n\nExpires in 24 hours.` });
  await sendMail({ user, to: user.email, template: 'contact_change_notice', subject: 'A contact change was approved for your Zuno account', text: `An email change was approved on your Zuno account after a recovery review (${x.reference}). If this was not you, contact support immediately.` });
  log(x, req, 'email_change_link_sent', reason); await x.save();
  await audit({ req, action: 'recovery.email_change_initiated', targetType: 'User', targetId: user._id, related: { kind: 'RecoveryRequest', id: x._id }, reason });
  res.json({ ok: true, message: 'Confirmation link sent to the new address. The email changes only after they confirm.' });
}));

r.post('/:id/actions/transfer-ownership', requirePlatform('recovery.review'), asyncH(async (req, res) => {
  const { newOwnerEmail, reason, removePreviousOwner } = parse(z.object({ newOwnerEmail: z.string().email(), reason: z.string().trim().min(10).max(1000), removePreviousOwner: z.boolean().default(true) }), req.body);
  const x = await guard(req, 'transfer_ownership');
  const next = await User.findOne({ email: newOwnerEmail.toLowerCase(), status: 'active', platformRole: null });
  if (!next) throw bad('The new owner needs an existing, active Zuno account.');
  const business = await Business.findById(x.business);
  const prev = await Membership.findOne({ business: business._id, role: 'owner', status: 'active' });
  await Membership.updateOne({ user: next._id, business: business._id }, { role: 'owner', status: 'active' }, { upsert: true });
  if (prev && String(prev.user) !== String(next._id)) {
    await Membership.updateOne({ _id: prev._id }, removePreviousOwner ? { status: 'revoked' } : { role: 'manager' });
    if (removePreviousOwner) await Session.updateMany({ user: prev.user, revokedAt: null }, { revokedAt: new Date() });
  }
  business.owner = next._id; await business.save(); // products, orders, sales and audit history stay attached to the business
  const prevUser = prev && await User.findById(prev.user);
  if (prevUser) await sendMail({ user: prevUser, to: prevUser.email, template: 'ownership_transferred_old', subject: 'Ownership of your Zuno business changed', text: `Ownership of ${business.name} was transferred after an approved recovery review (${x.reference}). If this is wrong, contact support immediately.` });
  await sendMail({ user: next, to: next.email, template: 'ownership_transferred_new', subject: `You now own ${business.name} on Zuno`, text: `You were made owner of ${business.name} after an approved recovery review (${x.reference}).` });
  log(x, req, 'ownership_transferred', reason); await x.save();
  await audit({ req, action: 'recovery.ownership_transferred', business: business._id, targetType: 'Business', targetId: business._id, related: { kind: 'RecoveryRequest', id: x._id }, reason, meta: { to: String(next._id), from: prev && String(prev.user), removedPrevious: removePreviousOwner } });
  res.json({ ok: true });
}));

export default r;
