
// HTTP-level tests that do not need a database: access control, validation, headers, webhook signature.
import './helpers.js';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AuditLog } from '../src/models/index.js';
import { createApp } from '../src/app.js';

let server;
let base;

const originalAuditCreate = AuditLog.create;
const auditEntries = [];

AuditLog.create = async function (entry) {
  auditEntries.push(entry);
  return entry;
};

before(async () => {
  mongoose.set('bufferCommands', false);
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  if (server) server.close();
  AuditLog.create = originalAuditCreate;
});

const call = (path, opts = {}) => fetch(base + path, {
  ...opts,
  headers: {
    'content-type': 'application/json',
    ...(opts.headers || {}),
  },
});

test('health endpoint works and security headers are set', async () => {
  const r = await call('/api/health');

  assert.equal(r.status, 200);
  assert.ok(r.headers.get('x-content-type-options'));
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('readiness endpoint reflects MongoDB connection state', async () => {
  const r = await call('/api/ready');

  assert.equal(r.status, mongoose.connection.readyState === 1 ? 200 : 503);
  assert.equal((await r.json()).ok, mongoose.connection.readyState === 1);
});

test('protected merchant routes reject unauthenticated requests', async () => {
  const paths = [
    '/api/catalog/products',
    '/api/orders',
    '/api/pos/sales',
    '/api/inventory',
    '/api/reports/summary',
    '/api/customers',
    '/api/support',
    '/api/mobile-apps',
    '/api/auth/me',
    '/api/businesses/current',
  ];

  for (const path of paths) {
    assert.equal((await call(path)).status, 401, path);
  }
});

test('platform admin routes reject unauthenticated requests', async () => {
  const paths = [
    '/api/admin/overview',
    '/api/admin/merchants',
    '/api/admin/recovery',
    '/api/admin/support',
    '/api/admin/mobile-apps',
    '/api/admin/audit',
    '/api/admin/settings',
  ];

  for (const path of paths) {
    assert.equal((await call(path)).status, 401, path);
  }
});

test('forged or garbage bearer tokens are rejected', async () => {
  const garbage = await call('/api/auth/me', {
    headers: { authorization: 'Bearer abc.def.ghi' },
  });

  assert.equal(garbage.status, 401);

  const forged = (await import('jsonwebtoken')).default.sign(
    { sid: 'x', sub: 'y' },
    'wrong-secret-wrong-secret-wrong-secret',
  );

  const response = await call('/api/auth/me', {
    headers: { authorization: `Bearer ${forged}` },
  });

  assert.equal(response.status, 401);
});

test('registration validation rejects weak passwords and bad emails before touching the database', async () => {
  const weak = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'a@b.com',
      password: 'short',
    }),
  });

  assert.equal(weak.status, 400);

  const badEmail = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'nope',
      password: 'a-long-enough-pass-1',
    }),
  });

  assert.equal(badEmail.status, 400);
});

test('webhook with invalid or missing signature is rejected and audited', async () => {
  auditEntries.length = 0;

  const body = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'ZP-x', id: 1 },
  });

  const missingSignature = await fetch(`${base}/api/webhooks/paystack`, {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });

  assert.equal(missingSignature.status, 401);

  const malformedSignature = await fetch(`${base}/api/webhooks/paystack`, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      'x-paystack-signature': 'bad',
    },
  });

  assert.equal(malformedSignature.status, 401);

  assert.equal(auditEntries.length, 2);

  assert.ok(auditEntries.every((entry) => (
    entry.action === 'webhook.invalid_signature'
    && entry.outcome === 'rejected'
    && entry.actorType === 'public'
  )));

  const wrong = crypto
    .createHmac('sha512', 'not-the-secret')
    .update(body)
    .digest('hex');

  const invalidSignature = await fetch(`${base}/api/webhooks/paystack`, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      'x-paystack-signature': wrong,
    },
  });

  // A validly formatted but incorrect signature requires a database lookup
  // to identify the payment provider. No database is connected in this test.
  assert.equal(invalidSignature.status, 503);
});

test('recovery request honeypot and validation are enforced', async () => {
  const bot = await call('/api/recovery', {
    method: 'POST',
    body: JSON.stringify({
      category: 'forgot_password',
      name: 'Bot',
      explanation: 'I am a bot filling every field',
      contactEmail: 'b@b.com',
      website: 'http://spam',
    }),
  });

  assert.equal(bot.status, 400);

  const empty = await call('/api/recovery', {
    method: 'POST',
    body: JSON.stringify({ category: 'nonsense' }),
  });

  assert.equal(empty.status, 400);
});

test('unknown routes return JSON 404 and CORS does not allow arbitrary origins', async () => {
  const r = await call('/api/nope');

  assert.equal(r.status, 404);

  const c = await fetch(`${base}/api/health`, {
    headers: { origin: 'https://evil.example' },
  });

  assert.equal(c.headers.get('access-control-allow-origin'), null);

  const ok = await fetch(`${base}/api/health`, {
    headers: { origin: 'http://localhost:5173' },
  });

  assert.equal(
    ok.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  );
});

test('CORS preflight allows storefront PUT requests from configured origins', async () => {
  const r = await fetch(`${base}/api/businesses/current/storefront`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'PUT',
      'access-control-request-headers': 'content-type,authorization,x-business-id',
    },
  });

  assert.equal(r.status, 204);
  assert.match(r.headers.get('access-control-allow-methods') || '', /PUT/);
});
