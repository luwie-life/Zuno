import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { User, Session, Token, Membership, Business } from '../models/index.js';
import { asyncH, bad, unauthorized } from '../lib/errors.js';
import { parse, z, phone } from '../lib/validate.js';
import { hashPassword, verifyPassword, passwordProblem } from '../lib/password.js';
import { newToken, hashToken } from '../lib/tokens.js';
import { requireAuth, signSession } from '../middleware/auth.js';
import { sendMail } from '../services/mailer.js';
import { audit } from '../services/audit.js';
import { env } from '../config/env.js';
import { getSettings } from '../services/settings.js';

const r = Router();
const limiter = (max, windowMs = 15 * 60_000) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } } });
const perEmail = (max) => rateLimit({ windowMs: 60 * 60_000, max, keyGenerator: (req) => (req.body?.email ? 'e:' + String(req.body.email).toLowerCase() : ipKeyGenerator(req.ip)), standardHeaders: false, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } } });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, emailVerified: u.emailVerified, platformRole: u.platformRole });

async function startSession(user, req) {
  const session = await Session.create({ user: user._id, expiresAt: new Date(Date.now() + env.sessionHours * 3600_000), userAgent: req.headers['user-agent']?.slice(0, 200), ip: req.ip });
  return signSession(session, user);
}

async function sendVerification(user) {
  const t = newToken();
  await Token.create({ user: user._id, purpose: 'email_verify', tokenHash: t.hash, expiresAt: new Date(Date.now() + 48 * 3600_000) });
  await sendMail({ user, to: user.email, template: 'verify_email', subject: 'Verify your Zuno email', text: `Hi ${user.name},\n\nConfirm your email address:\n${env.frontendUrl}/verify-email?token=${t.raw}\n\nThis link expires in 48 hours.` });
}

r.post('/register', limiter(10), asyncH(async (req, res) => {
  const b = parse(z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(200), phone: phone.optional(), password: z.string() }), req.body);
  const problem = passwordProblem(b.password, b.email);
  if (problem) throw bad(problem);
  if (await User.exists({ email: b.email.toLowerCase() })) throw bad('An account with this email already exists. Try signing in or recover your account.');
  const user = await User.create({ name: b.name, email: b.email, phone: b.phone, passwordHash: await hashPassword(b.password) });
  await sendVerification(user);
  await audit({ req, actor: user._id, actorType: 'merchant', action: 'auth.register', targetType: 'User', targetId: user._id });
  res.status(201).json({ token: await startSession(user, req), user: publicUser(user) });
}));

r.post('/login', limiter(30), perEmail(15), asyncH(async (req, res) => {
  const b = parse(z.object({ email: z.string().trim().email(), password: z.string().max(200) }), req.body);
  const user = await User.findOne({ email: b.email.toLowerCase() }).select('+passwordHash');
  const fail = async () => { await audit({ req, actorType: 'public', action: 'auth.login_failed', meta: { email: b.email.toLowerCase() }, outcome: 'failed' }); throw unauthorized('Incorrect email or password.'); };
  if (!user) { await verifyPassword(b.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv').catch(() => {}); return fail(); }
  if (user.lockUntil && user.lockUntil > new Date()) throw unauthorized('Too many failed attempts. Try again in a few minutes.');
  if (!(await verifyPassword(b.password, user.passwordHash))) {
    user.failedLogins += 1;
    if (user.failedLogins >= 5) { user.lockUntil = new Date(Date.now() + 15 * 60_000); user.failedLogins = 0; }
    await user.save();
    return fail();
  }
  if (user.status !== 'active') throw unauthorized('This account is unavailable. Contact support.');
  user.failedLogins = 0; user.lockUntil = undefined; user.lastLoginAt = new Date();
  await user.save();
  await audit({ req, actor: user._id, actorType: 'merchant', action: 'auth.login', targetType: 'User', targetId: user._id });
  res.json({ token: await startSession(user, req), user: publicUser(user) });
}));

r.post('/logout', requireAuth, asyncH(async (req, res) => {
  await Session.updateOne({ _id: req.session._id }, { revokedAt: new Date() });
  res.json({ ok: true });
}));

r.get('/me', requireAuth, asyncH(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id, status: 'active' }).populate('business', 'name slug status storePublished');
  res.json({ user: publicUser(req.user), businesses: memberships.filter((m) => m.business).map((m) => ({ id: m.business._id, name: m.business.name, slug: m.business.slug, status: m.business.status, role: m.role })) });
}));

r.patch('/me', requireAuth, asyncH(async (req, res) => {
  const b = parse(z.object({ name: z.string().trim().min(2).max(120).optional(), phone: phone.optional() }), req.body);
  Object.assign(req.user, b);
  if (b.phone) req.user.phoneVerified = false;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

r.post('/change-password', requireAuth, limiter(10), asyncH(async (req, res) => {
  const b = parse(z.object({ currentPassword: z.string(), newPassword: z.string() }), req.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await verifyPassword(b.currentPassword, user.passwordHash))) throw bad('Current password is incorrect.');
  const problem = passwordProblem(b.newPassword, user.email);
  if (problem) throw bad(problem);
  user.passwordHash = await hashPassword(b.newPassword);
  await user.save();
  await Session.updateMany({ user: user._id, _id: { $ne: req.session._id }, revokedAt: null }, { revokedAt: new Date() });
  await audit({ req, action: 'auth.password_changed', targetType: 'User', targetId: user._id });
  await sendMail({ user, to: user.email, template: 'password_changed', subject: 'Your Zuno password was changed', text: 'Your password was just changed and other devices were signed out. If this was not you, recover your account immediately: ' + env.frontendUrl + '/recover' });
  res.json({ ok: true });
}));

r.post('/verify-email', limiter(20), asyncH(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(200) }), req.body);
  const t = await Token.findOneAndUpdate({ tokenHash: hashToken(token), purpose: 'email_verify', usedAt: null, expiresAt: { $gt: new Date() } }, { usedAt: new Date() });
  if (!t) throw bad('This verification link is invalid or has expired.');
  await User.updateOne({ _id: t.user }, { emailVerified: true });
  res.json({ ok: true });
}));

r.post('/resend-verification', requireAuth, limiter(5), asyncH(async (req, res) => {
  if (!req.user.emailVerified) await sendVerification(req.user);
  res.json({ ok: true });
}));

// Always the same response, whether or not the account exists (no account enumeration).
r.post('/forgot-password', limiter(20), perEmail(3), asyncH(async (req, res) => {
  const { email } = parse(z.object({ email: z.string().trim().email() }), req.body);
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  if (user) await issueResetToken(user, {});
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
}));

export async function issueResetToken(user, { initiatedBy, reason } = {}) {
  const settings = await getSettings();
  await Token.updateMany({ user: user._id, purpose: 'password_reset', usedAt: null }, { usedAt: new Date() }); // one live token at a time
  const t = newToken();
  await Token.create({ user: user._id, purpose: 'password_reset', tokenHash: t.hash, expiresAt: new Date(Date.now() + settings.recoveryTokenMinutes * 60_000), initiatedBy, meta: reason ? { reason } : undefined });
  await sendMail({ user, to: user.email, template: initiatedBy ? 'admin_reset' : 'password_reset', subject: 'Reset your Zuno password', text: `Hi ${user.name},\n\nUse this link to choose a new password:\n${env.frontendUrl}/reset-password?token=${t.raw}\n\nIt expires in ${settings.recoveryTokenMinutes} minutes and works once. If you did not expect this, ignore this email.` });
}

r.post('/reset-password', limiter(20), asyncH(async (req, res) => {
  const b = parse(z.object({ token: z.string().min(10).max(200), password: z.string() }), req.body);
  const t = await Token.findOne({ tokenHash: hashToken(b.token), purpose: 'password_reset', usedAt: null, expiresAt: { $gt: new Date() } });
  if (!t) throw bad('This reset link is invalid or has expired. Request a new one.');
  const user = await User.findById(t.user).select('+passwordHash');
  const problem = passwordProblem(b.password, user.email);
  if (problem) throw bad(problem); // token is NOT consumed on a weak password
  const claimed = await Token.findOneAndUpdate({ _id: t._id, usedAt: null }, { usedAt: new Date() });
  if (!claimed) throw bad('This reset link is invalid or has expired. Request a new one.');
  user.passwordHash = await hashPassword(b.password);
  user.failedLogins = 0; user.lockUntil = undefined; user.emailVerified = true; // they proved control of the inbox
  await user.save();
  await Token.updateMany({ user: user._id, purpose: 'password_reset', usedAt: null }, { usedAt: new Date() });
  await Session.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  await audit({ actor: user._id, actorType: 'merchant', action: 'auth.password_reset_completed', targetType: 'User', targetId: user._id, meta: { adminInitiated: !!t.initiatedBy } });
  await sendMail({ user, to: user.email, template: 'password_reset_done', subject: 'Your Zuno password was reset', text: 'Your password was reset and all devices were signed out. If this was not you, contact support right away: ' + env.frontendUrl + '/recover' });
  res.json({ ok: true });
}));

// Completes an admin-approved contact change by proving control of the NEW email address.
r.post('/confirm-contact-change', limiter(20), asyncH(async (req, res) => {
  const { token } = parse(z.object({ token: z.string().min(10).max(200) }), req.body);
  const t = await Token.findOneAndUpdate({ tokenHash: hashToken(token), purpose: 'contact_change', usedAt: null, expiresAt: { $gt: new Date() } }, { usedAt: new Date() });
  if (!t) throw bad('This confirmation link is invalid or has expired.');
  if (await User.exists({ email: t.meta.newEmail, _id: { $ne: t.user } })) throw bad('That email is already used by another account.');
  const user = await User.findById(t.user);
  const old = user.email;
  user.email = t.meta.newEmail; user.emailVerified = true;
  await user.save();
  await Session.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  await audit({ actor: user._id, actorType: 'merchant', action: 'recovery.contact_changed', targetType: 'User', targetId: user._id, related: t.meta.requestId ? { kind: 'RecoveryRequest', id: t.meta.requestId } : undefined, meta: { field: 'email' } });
  await sendMail({ user, to: old, template: 'contact_changed_old', subject: 'Your Zuno email was changed', text: `The email on your Zuno account was changed after an approved recovery request. If this was not you, contact support: ${env.frontendUrl}/recover` });
  res.json({ ok: true });
}));

export default r;
