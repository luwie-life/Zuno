import { HttpError } from '../lib/errors.js';

export const VERIFICATION_MINUTES = 30;
export const verificationCutoff = (now = new Date()) => new Date(now.getTime() - VERIFICATION_MINUTES * 60_000);
export const verificationExpiry = (now = new Date()) => new Date(now.getTime() + VERIFICATION_MINUTES * 60_000);

export function assertVerified(user) {
  if (user?.emailVerified !== true) throw new HttpError(403, 'Verify your email before accessing your workspace.', 'EMAIL_VERIFICATION_REQUIRED');
}

export function assertSessionAccess(req) {
  if (req.user?.emailVerified === true) return;
  const allowed = req.baseUrl === '/api/auth' && (
    (req.method === 'GET' && req.path === '/me') ||
    (req.method === 'POST' && ['/resend-verification', '/logout'].includes(req.path))
  );
  if (!allowed) assertVerified(req.user);
}
