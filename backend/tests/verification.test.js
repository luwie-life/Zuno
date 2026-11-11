import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSessionAccess, assertVerified, verificationCutoff, verificationExpiry } from '../src/middleware/verification.js';

const denied = (fn) => assert.throws(fn, (error) => error.status === 403 && error.code === 'EMAIL_VERIFICATION_REQUIRED');
test('verification lifetime is exactly 30 minutes', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(verificationExpiry(now).getTime() - now.getTime(), 30 * 60_000);
  assert.equal(now.getTime() - verificationCutoff(now).getTime(), 30 * 60_000);
});
test('unverified and missing users fail closed', () => {
  for (const user of [undefined, {}, { emailVerified: false }, { emailVerified: 'true' }]) denied(() => assertVerified(user));
  assert.doesNotThrow(() => assertVerified({ emailVerified: true }));
});
test('restricted sessions can only read status, resend, and log out', () => {
  const req = { user: { emailVerified: false }, baseUrl: '/api/auth' };
  for (const [method, path] of [['GET', '/me'], ['POST', '/resend-verification'], ['POST', '/logout']]) assert.doesNotThrow(() => assertSessionAccess({ ...req, method, path }));
  for (const [method, path] of [['PATCH', '/me'], ['GET', '/resend-verification'], ['POST', '/change-password'], ['POST', '/me']]) denied(() => assertSessionAccess({ ...req, method, path }));
  for (const baseUrl of ['/api/businesses', '/api/catalog', '/api/admin', '/api/bookings']) denied(() => assertSessionAccess({ ...req, baseUrl, method: 'GET', path: '/me' }));
});
test('existing verified sessions pass the verification boundary', () => {
  assert.doesNotThrow(() => assertSessionAccess({ user: { emailVerified: true }, baseUrl: '/api/businesses', method: 'PUT', path: '/current/storefront' }));
});
