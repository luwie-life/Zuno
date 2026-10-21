// HTTP-level tests that do not need a database: access control, validation, headers, webhook signature.
import './helpers.js';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

let server; let base;
before(async () => {
  mongoose.set('bufferCommands', false); // fail fast instead of waiting for a DB that is not there
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
const call = (path, opts = {}) => fetch(base + path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });

test('health endpoint works and security headers are set', async () => {
  const r = await call('/api/health');
  assert.equal(r.status, 200);
  assert.ok(r.headers.get('x-content-type-options'));
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('protected merchant routes reject unauthenticated requests', async () => {
  for (const p of ['/api/catalog/products', '/api/orders', '/api/pos/sales', '/api/inventory', '/api/reports/summary', '/api/customers', '/api/support', '/api/mobile-apps', '/api/auth/me', '/api/businesses/current']) {
    assert.equal((await call(p)).status, 401, p);
  }
});

test('platform admin routes reject unauthenticated requests', async () => {
  for (const p of ['/api/admin/overview', '/api/admin/merchants', '/api/admin/recovery', '/api/admin/support', '/api/admin/mobile-apps', '/api/admin/audit', '/api/admin/settings']) {
    assert.equal((await call(p)).status, 401, p);
  }
});

test('forged or garbage bearer tokens are rejected', async () => {
  assert.equal((await call('/api/auth/me', { headers: { authorization: 'Bearer abc.def.ghi' } })).status, 401);
  const forged = (await import('jsonwebtoken')).default.sign({ sid: 'x', sub: 'y' }, 'wrong-secret-wrong-secret-wrong-secret');
  assert.equal((await call('/api/auth/me', { headers: { authorization: `Bearer ${forged}` } })).status, 401);
});

test('registration validation rejects weak passwords and bad emails before touching the database', async () => {
  const weak = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Test User', email: 'a@b.com', password: 'short' }) });
  assert.equal(weak.status, 400);
  const badEmail = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Test User', email: 'nope', password: 'a-long-enough-pass-1' }) });
  assert.equal(badEmail.status, 400);
});

test('webhook with invalid or missing signature is rejected', async () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ZP-x', id: 1 } });
  assert.equal((await fetch(`${base}/api/webhooks/paystack`, { method: 'POST', body, headers: { 'content-type': 'application/json' } })).status, 401);
  assert.equal((await fetch(`${base}/api/webhooks/paystack`, { method: 'POST', body, headers: { 'content-type': 'application/json', 'x-paystack-signature': 'bad' } })).status, 401);
  const wrong = crypto.createHmac('sha512', 'not-the-secret').update(body).digest('hex');
  assert.equal((await fetch(`${base}/api/webhooks/paystack`, { method: 'POST', body, headers: { 'content-type': 'application/json', 'x-paystack-signature': wrong } })).status, 503); // DB lookup needed to select tenant key; provider retries
});

test('recovery request honeypot and validation are enforced', async () => {
  const bot = await call('/api/recovery', { method: 'POST', body: JSON.stringify({ category: 'forgot_password', name: 'Bot', explanation: 'I am a bot filling every field', contactEmail: 'b@b.com', website: 'http://spam' }) });
  assert.equal(bot.status, 400);
  const empty = await call('/api/recovery', { method: 'POST', body: JSON.stringify({ category: 'nonsense' }) });
  assert.equal(empty.status, 400);
});

test('unknown routes return JSON 404 and CORS does not allow arbitrary origins', async () => {
  const r = await call('/api/nope');
  assert.equal(r.status, 404);
  const c = await fetch(`${base}/api/health`, { headers: { origin: 'https://evil.example' } });
  assert.equal(c.headers.get('access-control-allow-origin'), null);
  const ok = await fetch(`${base}/api/health`, { headers: { origin: 'http://localhost:5173' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});
