// Database-backed tests: tenant isolation, shared inventory, concurrency, idempotency, payments, recovery.
// They need a MongoDB REPLICA SET (Atlas free tier works, or a local `mongod --replSet rs0`).
//   TEST_MONGODB_URI="mongodb+srv://.../zuno_test" npm run test:integration
// WARNING: this DROPS the target database. Use a dedicated empty database.
import './helpers.js';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const URI = process.env.TEST_MONGODB_URI;
const skip = !URI && 'Set TEST_MONGODB_URI (replica set) to run integration tests';

function assertDisposableTestDatabase(uri) {
  const database = decodeURIComponent(new URL(uri).pathname.replace(/^\/+/, '').split('/')[0] || '');
  if (!/(^|[-_])tests?(?:ing)?($|[-_])/i.test(database)) {
    throw new Error('Refusing to run destructive integration tests: TEST_MONGODB_URI must target a database whose name contains a test marker.');
  }
}

let server; let base; let M; let mongoose;
const realFetch = globalThis.fetch;
const txs = new Map(); // reference -> mocked Paystack transaction

before(async () => {
  if (skip) return;
  assertDisposableTestDatabase(URI);
  process.env.MONGODB_URI = URI;
  mongoose = (await import('mongoose')).default;
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  M = await import('../src/models/index.js');
  await Promise.all(Object.values(M).map((m) => m.syncIndexes?.()));
  const { ensureDefaultPlans } = await import('../src/services/subscriptions.js');
  await ensureDefaultPlans();
  await M.Plan.updateOne({ key: 'store_business' }, { $setOnInsert: {
    key: 'store_business', name: 'Test Store Business', setupFee: 45000000, monthlyFee: 3000000,
    features: ['online_store', 'products', 'orders', 'basic_reports', 'services', 'bookings', 'pos', 'shared_inventory', 'stock_movements', 'low_stock', 'customers', 'suppliers', 'purchasing', 'enhanced_reports'],
    limits: { products: -1, staff: -1, services: -1, bookings: -1 }, active: true,
  } }, { upsert: true });
  await M.Plan.updateOne({ key: 'online_store' }, { $setOnInsert: {
    key: 'online_store', name: 'Test Online Store', setupFee: 0, monthlyFee: 500000,
    features: ['online_store', 'products', 'orders', 'basic_reports'],
    limits: { products: 200, staff: 1, services: 0, bookings: 0 }, active: true,
  } }, { upsert: true });
  await M.PlatformSettings.create({ key: 'platform' });
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  // Mock ONLY Paystack. Real payments are never made by tests.
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://api.paystack.co')) return realFetch(url, opts);
    const json = (data) => ({ ok: true, json: async () => data });
    if (u.endsWith('/transaction/initialize')) { const b = JSON.parse(opts.body); txs.set(b.reference, { status: 'abandoned', reference: b.reference, amount: b.amount, currency: b.currency }); return json({ status: true, data: { authorization_url: 'https://checkout.paystack.test/' + b.reference, reference: b.reference } }); }
    if (u.includes('/transaction/verify/')) { const ref = decodeURIComponent(u.split('/verify/')[1]); return json({ status: true, data: txs.get(ref) }); }
    return json({ status: true, data: {} });
  };
});
after(async () => { globalThis.fetch = realFetch; if (skip) return; server?.close(); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

const api = async (path, { method = 'GET', body, token, biz } = {}) => {
  const r = await fetch(base + path, { method, body: body && JSON.stringify(body), headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }), ...(biz && { 'x-business-id': biz }) } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
let n = 0;
async function merchant(planKey = 'store_business', businessType = 'product') {
  n++;
  const email = `m${n}-${Date.now()}@test.dev`;
  const reg = await api('/api/auth/register', { method: 'POST', body: { name: 'Merchant ' + n, email, password: 'a-long-test-password-1' } });
  const token = reg.body.token;
  await M.User.updateOne({ email }, { emailVerified: true });
  const b = await api('/api/businesses', { method: 'POST', token, body: { name: 'Shop ' + n, slug: `shop-${n}-${Date.now() % 100000}`, planKey, ...(businessType !== 'product' && { businessType }) } });
  const biz = b.body.business._id;
  await M.Subscription.updateOne({ business: biz }, { setupStatus: 'paid', currentPeriodEnd: new Date(Date.now() + 20 * 86400000) }); // simulate verified payments
  return { token, biz, email, slug: b.body.business.slug };
}
async function product(m, over = {}) {
  const r = await api('/api/catalog/products', { method: 'POST', token: m.token, biz: m.biz, body: { name: 'Widget', price: 100000, initialStock: 20, ...over } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.product;
}
async function publishStore(m, profile = {}) {
  const updated = await api('/api/businesses/current', {
    method: 'PATCH',
    token: m.token,
    biz: m.biz,
    body: { category: 'Retail', phone: '08030000000', address: { city: 'Lagos' }, ...profile },
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  const selected = await api('/api/businesses/current/storefront', {
    method: 'PUT',
    token: m.token,
    biz: m.biz,
    body: { templateId: 'clean-store', appearance: { primaryColor: '#0B6B4F' } },
  });
  assert.equal(selected.status, 200, JSON.stringify(selected.body));
  return api('/api/businesses/current/publish', {
    method: 'POST',
    token: m.token,
    biz: m.biz,
    body: { publish: true },
  });
}
const stock = async (id) => (({ stock, reserved }) => ({ stock, reserved }))(await M.Product.findById(id));

test('business types configure modules and service-only businesses cannot call commerce APIs', { skip }, async () => {
  const legacy = await merchant();
  const legacyContext = await api('/api/businesses/current', { token: legacy.token, biz: legacy.biz });
  assert.equal(legacyContext.body.businessType, 'product');
  assert.deepEqual(legacyContext.body.modules, ['commerce']);

  const service = await merchant('store_business', 'service');
  const serviceContext = await api('/api/businesses/current', { token: service.token, biz: service.biz });
  assert.equal(serviceContext.body.businessType, 'service');
  assert.deepEqual(serviceContext.body.modules, ['services']);
  assert.equal((await api('/api/catalog/products', { method: 'POST', token: service.token, biz: service.biz, body: { name: 'Blocked', price: 1000 } })).status, 403);
  assert.equal((await api('/api/inventory', { token: service.token, biz: service.biz })).status, 403);
  assert.equal((await api('/api/pos/products', { token: service.token, biz: service.biz })).status, 403);

  const hybrid = await merchant('store_business', 'hybrid');
  const hybridContext = await api('/api/businesses/current', { token: hybrid.token, biz: hybrid.biz });
  assert.deepEqual(hybridContext.body.modules, ['commerce', 'services', 'menu']);
  await product(hybrid);
});

test('unverified accounts can verify their email but cannot access merchant APIs', { skip }, async () => {
  const email = `unverified-${Date.now()}@test.dev`;
  const reg = await api('/api/auth/register', { method: 'POST', body: { name: 'Unverified', email, password: 'a-long-test-password-1' } });
  assert.equal(reg.status, 201);
  assert.equal((await api('/api/businesses/current', { token: reg.body.token })).status, 403);
  assert.equal((await api('/api/auth/me', { token: reg.body.token })).status, 200);

  const { newToken } = await import('../src/lib/tokens.js');
  const verification = newToken();
  const user = await M.User.findOne({ email });
  await M.Token.create({ user: user._id, purpose: 'email_verify', tokenHash: verification.hash, expiresAt: new Date(Date.now() + 3600000) });
  assert.equal((await api('/api/auth/verify-email', { method: 'POST', body: { token: verification.raw } })).status, 200);
  const created = await api('/api/businesses', { method: 'POST', token: reg.body.token, body: { name: 'Verified Shop', slug: `verified-${Date.now() % 1000000}`, planKey: 'starter' } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
});

test('restaurant menu is tenant-isolated and public storefront data is allowlisted', { skip }, async () => {
  const restaurant = await merchant('store_business', 'restaurant');
  const other = await merchant('store_business', 'restaurant');
  const published = await publishStore(restaurant, { category: 'Restaurant', address: { city: 'Lagos', line: '1 Market Road' }, email: restaurant.email });
  assert.equal(published.status, 200, JSON.stringify(published.body));

  const category = await api('/api/menu/categories', {
    method: 'POST',
    token: restaurant.token,
    biz: restaurant.biz,
    body: { name: 'Lunch', sortOrder: 1 },
  });
  assert.equal(category.status, 201, JSON.stringify(category.body));
  const item = await api('/api/menu/items', {
    method: 'POST',
    token: restaurant.token,
    biz: restaurant.biz,
    body: { category: category.body.category._id, name: 'Jollof rice', description: 'Smoky rice', price: 250000, published: true },
  });
  assert.equal(item.status, 201, JSON.stringify(item.body));
  assert.equal((await api('/api/menu/items', { token: other.token, biz: restaurant.biz })).status, 403);

  const storefront = await api(`/api/store/${restaurant.slug}`);
  assert.equal(storefront.status, 200);
  assert.equal(storefront.body.business.storefront.templateId, 'clean-store');
  assert.equal(Object.hasOwn(storefront.body.business, 'owner'), false);
  assert.equal(Object.hasOwn(storefront.body.business, 'defaultPaymentProvider'), false);
  const menu = await api(`/api/store/${restaurant.slug}/menu`);
  assert.equal(menu.status, 200);
  assert.equal(menu.body.categories[0].items[0].name, 'Jollof rice');
  assert.equal(menu.body.categories[0].items[0].price, 250000);
});

test('guided storefront configuration persists and is publicly available', { skip }, async () => {
  const merchantAccount = await merchant();

  await publishStore(merchantAccount);

  const config = {
    version: 1,
    theme: {
      primaryColor: '#0B3D2E',
      accentColor: '#E9A23B',
    },
    pages: [
      {
        title: 'Home',
        slug: 'home',
        isHome: true,
        visible: true,
        sections: [],
      },
    ],
  };

  const guided = {
    category: 'fashion',
    details: {
      brandName: 'Test Fashion',
      tagline: 'Everyday style.',
    },
    announcement: 'New collection available.',
  };

  const saved = await api('/api/businesses/current/storefront', {
    method: 'PUT',
    token: merchantAccount.token,
    biz: merchantAccount.biz,
    body: {
      templateId: 'fashion-editorial',
      config,
      guided,
      appearance: {
        primaryColor: '#0B3D2E',
        accentColor: '#E9A23B',
      },
    },
  });

  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.deepEqual(saved.body.storefront.config, config);
  assert.deepEqual(saved.body.storefront.guided, guided);

  const published = await api('/api/store/' + merchantAccount.slug);

  assert.equal(published.status, 200);
  assert.deepEqual(
    published.body.business.storefront.config,
    config,
  );
  assert.deepEqual(
    published.body.business.storefront.guided,
    guided,
  );

  assert.equal(
    Object.hasOwn(published.body.business, 'owner'),
    false,
  );
});

test('booking requests stay pending until merchant action and rejection releases the slot', { skip }, async () => {
  const m = await merchant('store_business', 'service');
  const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, open: '09:00', close: '17:00', closed: false }));
  const published = await publishStore(m, { serviceArea: 'Lagos', weeklyHours: hours });
  assert.equal(published.status, 200, JSON.stringify(published.body));
  const service = await api('/api/services', {
    method: 'POST',
    token: m.token,
    biz: m.biz,
    body: { name: 'Consultation', pricingDescription: 'Starting from NGN 500', bookable: true, durationMinutes: 60 },
  });
  assert.equal(service.status, 201, JSON.stringify(service.body));

  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const request = async (time, email) => api(`/api/store/${m.slug}/bookings`, {
    method: 'POST',
    body: {
      serviceId: service.body.service._id,
      date,
      startTime: time,
      customer: { name: 'Customer Name', email, phone: '08031112222' },
    },
  });
  const pending = await request('09:00', 'first@test.dev');
  const second = await request('10:30', 'second@test.dev');
  assert.equal(pending.status, 201, JSON.stringify(pending.body));
  assert.equal(pending.body.booking.status, 'pending');
  assert.equal(second.status, 201, JSON.stringify(second.body));
  assert.equal(await M.Payment.countDocuments({ business: m.biz }), 0);

  const bookings = await api(`/api/bookings?date=${date}`, { token: m.token, biz: m.biz });
  assert.deepEqual(bookings.body.items.map((booking) => booking.status), ['pending', 'pending']);
  const rejected = await api(`/api/bookings/${bookings.body.items[0]._id}`, {
    method: 'PATCH',
    token: m.token,
    biz: m.biz,
    body: { status: 'rejected', reason: 'Unavailable' },
  });
  assert.equal(rejected.status, 200, JSON.stringify(rejected.body));
  assert.equal(rejected.body.booking.status, 'rejected');
  assert.equal(await M.BookingSlot.countDocuments({ booking: rejected.body.booking._id }), 0);
  const confirmed = await api(`/api/bookings/${bookings.body.items[1]._id}`, {
    method: 'PATCH',
    token: m.token,
    biz: m.biz,
    body: { status: 'confirmed' },
  });
  assert.equal(confirmed.body.booking.status, 'confirmed');
});

test('tenant isolation: merchant A cannot touch merchant B data', { skip }, async () => {
  const A = await merchant(); const B = await merchant();
  const pB = await product(B);
  assert.equal((await api(`/api/catalog/products/${pB._id}`, { token: A.token, biz: A.biz })).status, 404);
  assert.equal((await api('/api/catalog/products', { token: A.token, biz: B.biz })).status, 403); // spoofed business header
  assert.equal((await api(`/api/catalog/products/${pB._id}`, { method: 'PATCH', token: A.token, biz: A.biz, body: { name: 'hacked' } })).status, 404);
  assert.equal((await api('/api/inventory/adjust', { method: 'POST', token: A.token, biz: A.biz, body: { productId: pB._id, delta: 5, reason: 'attack' } })).status, 409);
  assert.equal((await M.Product.findById(pB._id)).name, 'Widget');
  const sale = await api('/api/pos/sales', { method: 'POST', token: B.token, biz: B.biz, body: { idempotencyKey: 'iso-key-0001', paymentMethod: 'cash', items: [{ productId: pB._id, qty: 1 }] } });
  assert.equal(sale.status, 201);
  assert.equal((await api(`/api/pos/sales/${sale.body.sale._id}`, { token: A.token, biz: A.biz })).status, 404);
  assert.equal((await api('/api/pos/sales', { method: 'POST', token: A.token, biz: A.biz, body: { idempotencyKey: 'iso-key-0002', paymentMethod: 'cash', items: [{ productId: pB._id, qty: 1 }] } })).status, 409); // product not visible to A
});

test('POS cash sale deducts stock, uses server prices and rejects overselling', { skip }, async () => {
  const m = await merchant(); const p = await product(m, { price: 250000, initialStock: 3 });
  const ok = await api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: 'cash-sale-01', paymentMethod: 'cash', cashReceived: 600000, items: [{ productId: p._id, qty: 2 }] } });
  assert.equal(ok.status, 201); assert.equal(ok.body.sale.total, 500000); assert.equal(ok.body.change, 100000);
  assert.deepEqual(await stock(p._id), { stock: 1, reserved: 0 });
  const over = await api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: 'cash-sale-02', paymentMethod: 'cash', items: [{ productId: p._id, qty: 2 }] } });
  assert.equal(over.status, 409); assert.equal(over.body.error.code, 'INSUFFICIENT_STOCK');
  assert.deepEqual(await stock(p._id), { stock: 1, reserved: 0 });
});

test('POS retries with the same idempotency key do not duplicate the sale or the deduction', { skip }, async () => {
  const m = await merchant(); const p = await product(m, { initialStock: 10 });
  const body = { idempotencyKey: 'retry-key-0001', paymentMethod: 'cash', items: [{ productId: p._id, qty: 2 }] };
  const rs = await Promise.all([1, 2, 3, 4].map(() => api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body })));
  assert.ok(rs.every((r) => [200, 201].includes(r.status)), JSON.stringify(rs.map((r) => r.status)));
  assert.equal(await M.Sale.countDocuments({ business: m.biz }), 1);
  assert.equal((await stock(p._id)).stock, 8);
});

test('concurrent POS sales cannot oversell', { skip }, async () => {
  const m = await merchant(); const p = await product(m, { initialStock: 5 });
  const rs = await Promise.all(Array.from({ length: 12 }, (_, i) => api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: `race-key-${i}-xyz`, paymentMethod: 'cash', items: [{ productId: p._id, qty: 1 }] } })));
  const okCount = rs.filter((r) => r.status === 201).length;
  assert.equal(okCount, 5);
  assert.equal((await stock(p._id)).stock, 0);
});

test('online and POS sales share one inventory (20 -> 18 -> 15)', { skip }, async () => {
  const m = await merchant(); const p = await product(m, { initialStock: 20 });
  assert.equal((await publishStore(m)).status, 200);
  const co = await api(`/api/store/${m.slug}/checkout`, { method: 'POST', body: { items: [{ productId: p._id, qty: 2 }], customer: { name: 'Ada Obi', email: 'ada@test.dev', phone: '08031112222', address: { line: '1 Test Street', city: 'Lagos', state: 'Lagos' } } } });
  assert.equal(co.status, 201, JSON.stringify(co.body));
  assert.deepEqual(await stock(p._id), { stock: 20, reserved: 2 }); // reserved, not yet deducted
  const tx = txs.get(co.body.reference); tx.status = 'success';
  const v = await api(`/api/store/${m.slug}/orders/verify?reference=${co.body.reference}`);
  assert.equal(v.body.order.paymentStatus, 'paid');
  assert.deepEqual(await stock(p._id), { stock: 18, reserved: 0 });
  await api(`/api/store/${m.slug}/orders/verify?reference=${co.body.reference}`); // repeat: must not deduct twice
  assert.deepEqual(await stock(p._id), { stock: 18, reserved: 0 });
  const s = await api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: 'shared-inv-001', paymentMethod: 'cash', items: [{ productId: p._id, qty: 3 }] } });
  assert.equal(s.status, 201);
  assert.deepEqual(await stock(p._id), { stock: 15, reserved: 0 });
});

test('payment verification rejects wrong amounts and a browser "success" alone never marks an order paid', { skip }, async () => {
  const m = await merchant(); const p = await product(m);
  await publishStore(m);
  const co = await api(`/api/store/${m.slug}/checkout`, { method: 'POST', body: { items: [{ productId: p._id, qty: 1 }], customer: { name: 'Bayo K', email: 'b@test.dev', phone: '08031112222', address: { line: '2 Test Street', city: 'Ikeja', state: 'Lagos' } } } });
  let v = await api(`/api/store/${m.slug}/orders/verify?reference=${co.body.reference}`); // user "returned" but Paystack says not paid
  assert.notEqual(v.body.order.paymentStatus, 'paid');
  const tx = txs.get(co.body.reference); tx.status = 'success'; tx.amount = 100; // underpayment
  v = await api(`/api/store/${m.slug}/orders/verify?reference=${co.body.reference}`);
  assert.equal(v.body.result, 'rejected'); assert.notEqual(v.body.order.paymentStatus, 'paid');
});

test('webhook: valid signature processes once; duplicates are ignored; bad signature rejected', { skip }, async () => {
  const m = await merchant();
  const { startPayment } = await import('../src/services/payments.js');
  const { payment } = await startPayment({ business: m.biz, purpose: 'subscription', amount: 3000000, email: m.email, meta: {} });
  txs.get(payment.reference).status = 'success';
  const raw = JSON.stringify({ event: 'charge.success', data: { id: 777, reference: payment.reference } });
  const sig = crypto.createHmac('sha512', process.env.PLATFORM_PAYSTACK_SECRET_KEY).update(raw).digest('hex');
  const send = (s) => fetch(`${base}/api/webhooks/paystack`, { method: 'POST', body: raw, headers: { 'content-type': 'application/json', 'x-paystack-signature': s } });
  assert.equal((await send('bad')).status, 401);
  assert.equal((await send(sig)).status, 200);
  const end1 = (await M.Subscription.findOne({ business: m.biz })).currentPeriodEnd.getTime();
  assert.equal((await send(sig)).status, 200); // replay
  assert.equal((await M.Subscription.findOne({ business: m.biz })).currentPeriodEnd.getTime(), end1); // not extended twice
  assert.equal(await M.Payment.countDocuments({ reference: payment.reference, status: 'success' }), 1);
});

test('subscription is not active from a monthly payment alone; setup fee is tracked separately', { skip }, async () => {
  n++;
  const email = `fresh${n}-${Date.now()}@test.dev`;
  const reg = await api('/api/auth/register', { method: 'POST', body: { name: 'Fresh', email, password: 'a-long-test-password-1' } });
  await M.User.updateOne({ email }, { emailVerified: true });
  const b = await api('/api/businesses', { method: 'POST', token: reg.body.token, body: { name: 'Fresh Shop', slug: `fresh-${Date.now() % 1000000}`, planKey: 'starter' } });
  const biz = b.body.business._id;
  const monthly = await api('/api/billing/checkout', { method: 'POST', token: reg.body.token, biz, body: { purpose: 'subscription' } });
  assert.equal(monthly.status, 409); // must pay setup first
  const setup = await api('/api/billing/checkout', { method: 'POST', token: reg.body.token, biz, body: { purpose: 'setup_fee' } });
  assert.equal(setup.status, 201); assert.equal(setup.body.amount, 45000000); // price comes from the plan, not the client
  txs.get(setup.body.reference).status = 'success';
  await api(`/api/billing/verify?reference=${setup.body.reference}`, { token: reg.body.token, biz });
  let st = await api('/api/billing', { token: reg.body.token, biz });
  assert.equal(st.body.setupStatus, 'paid'); assert.notEqual(st.body.state, 'active'); // setup alone != active subscription
  const mo = await api('/api/billing/checkout', { method: 'POST', token: reg.body.token, biz, body: { purpose: 'subscription' } });
  assert.equal(mo.body.amount, 3000000);
  txs.get(mo.body.reference).status = 'success';
  await api(`/api/billing/verify?reference=${mo.body.reference}`, { token: reg.body.token, biz });
  st = await api('/api/billing', { token: reg.body.token, biz });
  assert.equal(st.body.state, 'active');
});

test('plan entitlements are enforced server-side (Online Store plan has no POS)', { skip }, async () => {
  const m = await merchant('online_store'); const p = await product(m);
  const r = await api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: 'plan-gate-0001', paymentMethod: 'cash', items: [{ productId: p._id, qty: 1 }] } });
  assert.equal(r.status, 403); assert.equal(r.body.error.code, 'FEATURE_NOT_IN_PLAN');
});

test('cashier permissions: no discounts, no returns, no stock adjustments', { skip }, async () => {
  const owner = await merchant(); const p = await product(owner);
  const c = await api('/api/auth/register', { method: 'POST', body: { name: 'Cashier', email: `cash-${Date.now()}@test.dev`, password: 'a-long-test-password-1' } });
  await M.User.updateOne({ name: 'Cashier' }, { emailVerified: true });
  await api('/api/businesses/current/members', { method: 'POST', token: owner.token, biz: owner.biz, body: { email: (await M.User.findOne({ name: 'Cashier' }).sort('-createdAt')).email, role: 'cashier' } });
  const disc = await api('/api/pos/sales', { method: 'POST', token: c.body.token, biz: owner.biz, body: { idempotencyKey: 'cashier-disc-01', paymentMethod: 'cash', discount: { type: 'percent', value: 50 }, items: [{ productId: p._id, qty: 1 }] } });
  assert.equal(disc.status, 409);
  const sale = await api('/api/pos/sales', { method: 'POST', token: c.body.token, biz: owner.biz, body: { idempotencyKey: 'cashier-sale-01', paymentMethod: 'cash', items: [{ productId: p._id, qty: 1 }] } });
  assert.equal(sale.status, 201);
  assert.equal((await api(`/api/pos/sales/${sale.body.sale._id}/void`, { method: 'POST', token: c.body.token, biz: owner.biz, body: { restock: true, reason: 'nope' } })).status, 403);
  assert.equal((await api('/api/inventory/adjust', { method: 'POST', token: c.body.token, biz: owner.biz, body: { productId: p._id, delta: 50, reason: 'free stock' } })).status, 403);
});

test('returns only restock when the actor confirms it', { skip }, async () => {
  const m = await merchant(); const p = await product(m, { initialStock: 10 });
  const sale = (await api('/api/pos/sales', { method: 'POST', token: m.token, biz: m.biz, body: { idempotencyKey: 'return-test-01', paymentMethod: 'cash', items: [{ productId: p._id, qty: 4 }] } })).body.sale;
  await api(`/api/pos/sales/${sale._id}/return`, { method: 'POST', token: m.token, biz: m.biz, body: { items: [{ productId: p._id, qty: 1 }], restock: false, reason: 'damaged item' } });
  assert.equal((await stock(p._id)).stock, 6);
  await api(`/api/pos/sales/${sale._id}/return`, { method: 'POST', token: m.token, biz: m.biz, body: { items: [{ productId: p._id, qty: 1 }], restock: true, reason: 'wrong size' } });
  assert.equal((await stock(p._id)).stock, 7);
  assert.equal((await api(`/api/pos/sales/${sale._id}/return`, { method: 'POST', token: m.token, biz: m.biz, body: { items: [{ productId: p._id, qty: 9 }], restock: true, reason: 'too many' } })).status, 400);
});

test('password reset: generic response, single-use, session revocation; recovery status needs the access key', { skip }, async () => {
  const m = await merchant();
  const unknown = await api('/api/auth/forgot-password', { method: 'POST', body: { email: 'nobody-here@test.dev' } });
  const known = await api('/api/auth/forgot-password', { method: 'POST', body: { email: m.email } });
  assert.equal(unknown.status, 200); assert.equal(known.status, 200); assert.deepEqual(unknown.body, known.body); // no enumeration
  const { newToken } = await import('../src/lib/tokens.js');
  const user = await M.User.findOne({ email: m.email });
  const t = newToken();
  await M.Token.create({ user: user._id, purpose: 'password_reset', tokenHash: t.hash, expiresAt: new Date(Date.now() + 600000) });
  const ok = await api('/api/auth/reset-password', { method: 'POST', body: { token: t.raw, password: 'brand-new-password-77' } });
  assert.equal(ok.status, 200);
  assert.equal((await api('/api/auth/reset-password', { method: 'POST', body: { token: t.raw, password: 'another-new-password-88' } })).status, 400); // single use
  assert.equal((await api('/api/auth/me', { token: m.token })).status, 401); // old session revoked
  const expired = newToken();
  await M.Token.create({ user: user._id, purpose: 'password_reset', tokenHash: expired.hash, expiresAt: new Date(Date.now() - 1000) });
  assert.equal((await api('/api/auth/reset-password', { method: 'POST', body: { token: expired.raw, password: 'brand-new-password-99' } })).status, 400);
  const rec = await api('/api/recovery', { method: 'POST', body: { category: 'lost_email_access', name: 'Real Owner', explanation: 'I lost my inbox and need help', contactEmail: 'new@test.dev', possibleEmail: m.email } });
  assert.equal(rec.status, 201);
  assert.equal((await api('/api/recovery/status', { method: 'POST', body: { reference: rec.body.reference, statusKey: 'WRONGKEY00' } })).status, 404); // reference alone is useless
  const good = await api('/api/recovery/status', { method: 'POST', body: { reference: rec.body.reference, statusKey: rec.body.statusKey } });
  assert.equal(good.status, 200); assert.equal(good.body.messages.length, 0); assert.equal(JSON.stringify(good.body).includes('notes'), false);
});

test('app applications: merchant isolation, no auto-charge, staff-only transitions, private notes', { skip }, async () => {
  const A = await merchant(); const B = await merchant();
  const form = { businessName: 'Shop', applicantName: 'Owner Name', email: 'o@test.dev', phone: '08030000000', reason: 'Customers keep asking for an app', platform: 'both', preferredContact: 'email' };
  const app = await api('/api/mobile-apps', { method: 'POST', token: A.token, biz: A.biz, body: form });
  assert.equal(app.status, 201); assert.equal(app.body.application.status, 'submitted');
  assert.equal(await M.Payment.countDocuments({ business: A.biz, purpose: 'app_setup' }), 0); // submission creates no charge
  assert.equal((await api(`/api/mobile-apps/${app.body.application.id}`, { token: B.token, biz: B.biz })).status, 404);
  assert.equal((await api(`/api/mobile-apps/${app.body.application.id}/status`, { method: 'POST', token: A.token, biz: A.biz, body: { status: 'approved' } })).status, 403);
  assert.equal((await api('/api/admin/mobile-apps', { token: A.token })).status, 404); // merchants cannot reach admin
  await M.AppApplication.updateOne({ _id: app.body.application.id }, { $push: { internalNotes: { body: 'SECRET internal', at: new Date() } } });
  const view = await api(`/api/mobile-apps/${app.body.application.id}`, { token: A.token, biz: A.biz });
  assert.equal(JSON.stringify(view.body).includes('SECRET'), false);
});
