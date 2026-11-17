import './helpers.js';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

const EXPECTED_URI = 'mongodb://127.0.0.1:27017/zuno_security_test';
const URI = process.env.TEST_MONGODB_URI;
const skip = !URI && 'Set TEST_MONGODB_URI to the disposable local security test database';
let mongoose, M, server, base, disposable = false, sequence = 0;
const realFetch = globalThis.fetch;

before(async () => {
  if (skip) return;
  if (URI !== EXPECTED_URI) throw new Error('Refusing destructive security tests outside the fixed local zuno_security_test database.');
  disposable = true;
  process.env.MONGODB_URI = URI;
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY']) process.env[key] = '';
  process.env.DEV_LOG_EMAILS = 'false';
  process.env.RUN_JOBS = 'false';
  mongoose = (await import('mongoose')).default;
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  M = await import('../src/models/index.js');
  await Promise.all(Object.values(M).map(model => model.syncIndexes?.()));
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0, '127.0.0.1');
  if (!server.listening) await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = `http://127.0.0.1:${server.address().port}`;
  globalThis.fetch = (url, options) => {
    if (new URL(String(url)).origin !== base) throw new Error('External HTTP is disabled in security integration tests.');
    return realFetch(url, options);
  };
});
after(async () => {
  globalThis.fetch = realFetch;
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  if (disposable && mongoose?.connection.readyState === 1) await mongoose.connection.dropDatabase();
  if (mongoose) await mongoose.disconnect();
});

async function api(path, { method = 'GET', token, biz, body } = {}) {
  const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(biz ? { 'x-business-id': String(biz) } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
async function register() {
  const email = `security-${++sequence}@test.dev`;
  const result = await api('/api/auth/register', { method: 'POST', body: { name: 'Security Merchant', email, password: 'a-long-test-password-1' } });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return { email, id: result.body.user.id, token: result.body.token };
}
async function verification(user, extra = {}) {
  const { newToken } = await import('../src/lib/tokens.js');
  const token = newToken();
  await M.Token.create({ user: user.id, purpose: 'email_verify', tokenHash: token.hash, expiresAt: new Date(Date.now() + 30 * 60_000), meta: { email: user.email }, ...extra });
  return token.raw;
}
const confirm = token => api('/api/auth/verify-email', { method: 'POST', body: { token } });

test('unverified sessions cannot enter merchant APIs and failed resend is not reported as sent', { skip }, async () => {
  const user = await register();
  const me = await api('/api/auth/me', { token: user.token });
  assert.equal(me.status, 200); assert.equal(me.body.user.emailVerified, false); assert.deepEqual(me.body.businesses, []);
  for (const path of ['/api/businesses/current', '/api/businesses/current/storefront']) {
    const denied = await api(path, { token: user.token });
    assert.equal(denied.status, 403); assert.equal(denied.body.error.code, 'EMAIL_VERIFICATION_REQUIRED');
  }
  const create = await api('/api/businesses', { method: 'POST', token: user.token, body: { name: 'Blocked Store', slug: 'blocked-store', planKey: 'store_business' } });
  assert.equal(create.status, 403);
  const resend = await api('/api/auth/resend-verification', { method: 'POST', token: user.token });
  assert.equal(resend.status, 503); assert.equal(resend.body.error.code, 'VERIFICATION_DELIVERY_FAILED');
});
test('real database claims reject expired and older-than-30-minute links', { skip }, async () => {
  const user = await register();
  assert.equal((await confirm(await verification(user, { expiresAt: new Date(Date.now() - 1000) }))).status, 400);
  assert.equal((await confirm(await verification(user, { createdAt: new Date(Date.now() - 31 * 60_000), expiresAt: new Date(Date.now() + 60_000) }))).status, 400);
  assert.equal((await M.User.findById(user.id)).emailVerified, false);
});
test('real database concurrent verification accepts only one claim and rejects replay', { skip }, async () => {
  const user = await register(), raw = await verification(user);
  const results = await Promise.all([confirm(raw), confirm(raw)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
  assert.equal((await confirm(raw)).status, 400);
  assert.equal((await api('/api/auth/me', { token: user.token })).body.user.emailVerified, true);
});
test('verified merchant save/reload/publish/unpublish/republish retains metadata and isolates tenants', { skip }, async () => {
  const user = await register();
  assert.equal((await confirm(await verification(user))).status, 200);
  const business = await M.Business.create({ name: 'Security Store', slug: 'security-store', owner: user.id, businessType: 'service', category: 'Services', phone: '08030000000', address: { city: 'Lagos' } });
  await M.Membership.create({ user: user.id, business: business._id, role: 'owner' });
  const foreign = await M.User.create({ name: 'Other Merchant', email: 'other-security@test.dev', passwordHash: 'test-fixture-only-not-a-login', emailVerified: true });
  const other = await M.Business.create({ name: 'Other Store', slug: 'other-security-store', owner: foreign._id });
  await M.Membership.create({ user: foreign._id, business: other._id, role: 'owner' });
  const payload = { templateId: 'professional-services', identity: { displayName: 'Security Studio', description: 'Saved studio description', logo: 'https://images.example/studio.png', favicon: 'https://images.example/favicon.png' }, contact: { city: 'Abuja', phone: '08040000000', email: 'studio@example.invalid' }, theme: { primaryColor: '#654321' }, seo: { title: 'Security Studio', description: 'Saved SEO description', ogImage: 'https://images.example/sharing.png', noIndex: true }, socialLinks: [{ id: 'ig', platform: 'instagram', url: 'https://instagram.com/security-studio' }], pages: [{ id: 'home', slug: 'home', isHome: true, sections: [{ id: 'hero', type: 'hero', elements: [{ id: 'title', type: 'heading', content: 'Hello', style: { x: 123.5, y: 240, positioned: true, width: '300px' } }] }] }] };
  assert.equal((await api('/api/store/security-store')).status, 404);
  const save = await api('/api/businesses/current/storefront', { method: 'PUT', token: user.token, biz: business._id, body: payload });
  assert.equal(save.status, 200, JSON.stringify(save.body));
  assert.equal((await api('/api/store/security-store')).status, 404);
  const reload = await api('/api/businesses/current/storefront', { token: user.token, biz: business._id });
  assert.equal(reload.status, 200); assert.equal(reload.body.storefront.templateId, payload.templateId);
  assert.equal(reload.body.storefront.identity.displayName, payload.identity.displayName);
  assert.equal(reload.body.storefront.identity.logo, payload.identity.logo);
  assert.equal(reload.body.storefront.identity.favicon, payload.identity.favicon);
  assert.equal(reload.body.storefront.seo.ogImage, payload.seo.ogImage);
  assert.equal(reload.body.storefront.seo.noIndex, true);
  assert.equal(reload.body.storefront.pages[0].sections[0].elements[0].style.x, 123.5);
  assert.equal(reload.body.storefront.pages[0].sections[0].elements[0].style.y, 240);
  const stored = await M.Business.findById(business._id);
  assert.equal(stored.storefront.templateId, payload.templateId);
  assert.equal(stored.storePublished, false);
  assert.equal((await api('/api/businesses/current/storefront', { method: 'PUT', token: user.token, biz: other._id, body: payload })).status, 403);
  assert.equal((await api('/api/businesses/current/publish', { method: 'POST', token: user.token, biz: other._id, body: { publish: true } })).status, 403);
  assert.equal((await M.Business.findById(other._id)).storefront.templateId, undefined);
  assert.equal((await M.Business.findById(other._id)).storePublished, false);
  assert.equal((await api('/api/businesses/current/publish', { method: 'POST', token: user.token, biz: business._id, body: { publish: true } })).status, 200);
  const live = await api('/api/store/security-store');
  assert.equal(live.status, 200, JSON.stringify(live.body));
  assert.equal(live.body.business.businessType, 'service');
  assert.equal(live.body.business.name, 'Security Studio');
  assert.equal(live.body.business.logoUrl, payload.identity.logo);
  assert.equal(live.body.business.phone, payload.contact.phone);
  assert.equal(live.body.business.address.city, payload.contact.city);
  assert.equal(live.body.business.brandColor, '#654321');
  assert.equal(live.body.business.storefront.templateId, payload.templateId);
  assert.equal((await M.Business.findById(business._id)).name, 'Security Store');
  const changed = JSON.parse(JSON.stringify(payload));
  changed.pages[0].sections[0].elements[0].content = 'Updated on live store';
  assert.equal((await api('/api/businesses/current/storefront', { method: 'PUT', token: user.token, biz: business._id, body: changed })).status, 200);
  assert.equal((await api('/api/store/security-store')).body.business.storefront.pages[0].sections[0].elements[0].content, 'Updated on live store');
  assert.equal((await api('/api/businesses/current/publish', { method: 'POST', token: user.token, biz: business._id, body: { publish: false } })).status, 200);
  assert.equal((await api('/api/store/security-store')).status, 404);
  const privateReload = await api('/api/businesses/current/storefront', { token: user.token, biz: business._id });
  assert.equal(privateReload.status, 200);
  assert.equal(privateReload.body.storefront.pages[0].sections[0].elements[0].content, 'Updated on live store');
  assert.equal((await api('/api/businesses/current/publish', { method: 'POST', token: user.token, biz: business._id, body: { publish: true } })).status, 200);
  const republished = await api('/api/store/security-store');
  assert.equal(republished.status, 200);
  assert.equal(republished.body.business.storefront.pages[0].sections[0].elements[0].content, 'Updated on live store');
});
test('a token bound to a previous email cannot verify the new address', { skip }, async () => {
  const user = await register(), raw = await verification(user);
  await M.User.updateOne({ _id: user.id }, { email: 'changed-security@test.dev', emailVerified: false });
  assert.equal((await confirm(raw)).status, 400);
  assert.equal((await M.User.findById(user.id)).emailVerified, false);
});
