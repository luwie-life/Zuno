import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session, User, Business, Membership } from '../models/index.js';
import { unauthorized, forbidden, notFound } from '../lib/errors.js';
import { merchantCan, platformCan } from '../lib/permissions.js';
import { asyncH } from '../lib/errors.js';
import { getAccess } from '../services/subscriptions.js';
import { featureAllowed, limitReached } from '../lib/subscriptionRules.js';

export function signSession(session, user) {
  return jwt.sign({ sid: String(session._id), sub: String(user._id) }, env.jwtSecret, { algorithm: 'HS256', expiresIn: `${env.sessionHours}h` });
}

export const requireAuth = asyncH(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw unauthorized();
  let payload;
  try { payload = jwt.verify(h.slice(7), env.jwtSecret, { algorithms: ['HS256'] }); } catch { throw unauthorized('Session expired. Please sign in again.'); }
  const session = await Session.findOne({ _id: payload.sid, user: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session) throw unauthorized('Session expired. Please sign in again.');
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw unauthorized('Account unavailable.');
  req.user = user; req.session = session;
  next();
});

/** Resolves the business from X-Business-Id and verifies the caller's active membership. Never trusts the id alone. */
export const requireBusiness = (perm, { allowSuspended = false } = {}) => asyncH(async (req, res, next) => {
  const id = req.headers['x-business-id'];
  if (!id || !/^[a-f\d]{24}$/i.test(id)) throw forbidden('No business selected');
  const membership = await Membership.findOne({ user: req.user._id, business: id, status: 'active' });
  if (!membership) throw forbidden('You do not have access to this business'); // identical for "missing" and "not yours"
  const business = await Business.findById(id);
  if (!business) throw forbidden('You do not have access to this business');
  if (business.status === 'suspended' && !allowSuspended) throw forbidden('This business is suspended. Contact support.');
  req.business = business; req.membership = membership; req.role = membership.role;
  req.can = (p) => merchantCan(membership.role, p);
  if (perm && !req.can(perm)) throw forbidden();
  next();
});

export const requirePerm = (perm) => (req, res, next) => (req.can(perm) ? next() : next(forbidden()));

export const requireFeature = (feature) => asyncH(async (req, res, next) => {
  const { sub, plan, access, state } = await getAccess(req.business._id);
  if (!access) return next(Object.assign(forbidden(`Your subscription is not active (${state}). Visit Billing to continue.`), { code: 'SUBSCRIPTION_INACTIVE' }));
  if (!featureAllowed(plan, feature, sub.override)) return next(Object.assign(forbidden('Your plan does not include this feature. Upgrade in Billing.'), { code: 'FEATURE_NOT_IN_PLAN' }));
  req.access = { sub, plan, state };
  next();
});

export async function assertLimit(req, key, current) {
  const { plan } = req.access || await getAccess(req.business._id);
  if (limitReached(plan, key, current)) throw Object.assign(forbidden(`Your plan's ${key} limit has been reached. Upgrade in Billing.`), { code: 'PLAN_LIMIT' });
}

export const requirePlatform = (perm) => (req, res, next) => {
  const role = req.user?.platformRole;
  if (!role || (perm && !platformCan(role, perm))) return next(role ? forbidden() : notFound());
  req.platformRole = role;
  next();
};
