import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { merchantCan, platformCan } from '../src/lib/permissions.js';
import { appMachine, recoveryMachine, supportMachine, fulfilmentMachine, APP_MERCHANT_EDGES } from '../src/lib/statusMachines.js';
import { computeSubscriptionState, hasAccess, nextPeriodEnd, featureAllowed, limitReached, DAY } from '../src/lib/subscriptionRules.js';
import { verifyWebhookSignature, checkVerifiedTransaction } from '../src/lib/paystack.js';
import { computeTotals } from '../src/lib/money.js';
import { recoveryActionCheck, riskFor } from '../src/lib/recoveryRules.js';
import { newToken, hashToken, newReference } from '../src/lib/tokens.js';
import { passwordProblem } from '../src/lib/password.js';
import { sanitize } from '../src/services/audit.js';
import { refundFor } from '../src/services/pos.js';
import { validateMongoUri } from '../src/services/mongo.js';
import { env, envFilePath, assertEnv } from '../src/config/env.js';
import { startServer } from '../src/server.js';
import { validatePaystackSecret, createPaystackAdapter } from '../src/lib/paystack.js';
import { encryptGatewaySecret, decryptGatewaySecret } from '../src/lib/gatewayEncryption.js';
import { gatewayStatus, SUPPORTED_PROVIDERS } from '../src/services/paymentProviders.js';

test('merchant permissions: cashier cannot discount/refund/adjust; manager cannot manage staff or billing', () => {
  for (const p of ['pos.discount', 'pos.refund', 'inventory.adjust', 'staff.manage', 'reports.read']) assert.equal(merchantCan('cashier', p), false, p);
  assert.equal(merchantCan('cashier', 'pos.sell'), true);
  assert.equal(merchantCan('manager', 'pos.discount'), true);
  assert.equal(merchantCan('manager', 'staff.manage'), false);
  assert.equal(merchantCan('manager', 'billing.manage'), false);
  assert.equal(merchantCan('owner', 'anything'), true);
  assert.equal(merchantCan('stranger', 'pos.sell'), false);
});

test('platform permissions are role-scoped', () => {
  assert.equal(platformCan('support', 'recovery.review'), true);
  assert.equal(platformCan('support', 'plans.write'), false);
  assert.equal(platformCan('support', '*'), false);
  assert.equal(platformCan('billing', 'plans.write'), true);
  assert.equal(platformCan('billing', 'recovery.review'), false);
  assert.equal(platformCan('owner', '*'), true);
  assert.equal(platformCan(null, 'overview.read'), false);
});

test('status machines reject invalid transitions', () => {
  assert.equal(appMachine.can('draft', 'delivered'), false);
  assert.equal(appMachine.can('submitted', 'under_review'), true);
  assert.throws(() => appMachine.assert('delivered', 'in_development'), /Invalid application status change/);
  assert.equal(recoveryMachine.can('submitted', 'approved'), false); // must be reviewed first
  assert.equal(recoveryMachine.can('closed', 'under_review'), false);
  assert.equal(supportMachine.can('closed', 'open'), false);
  assert.equal(fulfilmentMachine.can('new', 'delivered'), false);
  assert.equal(fulfilmentMachine.can('delivered', 'cancelled'), false);
});

test('merchants cannot move an application to staff-only states', () => {
  for (const to of ['in_development', 'delivered', 'quotation_issued', 'ready_for_review']) {
    for (const from of Object.keys(APP_MERCHANT_EDGES)) assert.equal((APP_MERCHANT_EDGES[from] || []).includes(to), false, `${from}->${to}`);
  }
  assert.ok(APP_MERCHANT_EDGES.quotation_issued.includes('approved'));
});

test('setup fee and monthly subscription are independent', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const plan = { setupFee: 25000000 };
  const future = new Date(now.getTime() + 10 * DAY);
  // monthly paid but setup NOT paid => not active
  assert.equal(computeSubscriptionState({ setupStatus: 'unpaid', currentPeriodEnd: future }, plan, now), 'pending_setup');
  // setup paid but monthly never paid => not active
  assert.equal(computeSubscriptionState({ setupStatus: 'paid' }, plan, now), 'pending_payment');
  assert.equal(hasAccess(computeSubscriptionState({ setupStatus: 'paid' }, plan, now)), false);
  // both => active
  assert.equal(computeSubscriptionState({ setupStatus: 'paid', currentPeriodEnd: future }, plan, now), 'active');
  assert.equal(computeSubscriptionState({ setupStatus: 'waived', currentPeriodEnd: future }, plan, now), 'active');
});

test('grace period, expiry, cancellation and suspension', () => {
  const now = new Date('2026-10-20T00:00:00Z');
  const plan = { setupFee: 0 };
  const ended = new Date(now.getTime() - 2 * DAY);
  assert.equal(computeSubscriptionState({ setupStatus: 'paid', currentPeriodEnd: ended }, plan, now, 7), 'grace');
  assert.equal(hasAccess('grace'), true);
  assert.equal(computeSubscriptionState({ setupStatus: 'paid', currentPeriodEnd: new Date(now.getTime() - 9 * DAY) }, plan, now, 7), 'expired');
  assert.equal(hasAccess('expired'), false);
  assert.equal(computeSubscriptionState({ status: 'cancelled', setupStatus: 'paid', currentPeriodEnd: ended }, plan, now), 'cancelled');
  assert.equal(computeSubscriptionState({ status: 'cancelled', setupStatus: 'paid', currentPeriodEnd: new Date(now.getTime() + 5 * DAY) }, plan, now), 'active'); // paid period still honoured
  assert.equal(computeSubscriptionState({ suspended: true, setupStatus: 'paid', currentPeriodEnd: new Date(now.getTime() + 5 * DAY) }, plan, now), 'suspended');
});

test('period renewal extends from the current end, not from today', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const end = new Date('2026-10-15T00:00:00Z');
  assert.equal(nextPeriodEnd(end, now).toISOString().slice(0, 10), '2026-11-15');
  assert.equal(nextPeriodEnd(new Date('2026-08-01T00:00:00Z'), now).toISOString().slice(0, 10), '2026-11-01');
});

test('feature entitlements, overrides and limits', () => {
  const plan = { features: ['online_store'], limits: { products: 2, staff: -1 } };
  assert.equal(featureAllowed(plan, 'pos'), false);
  const now = new Date();
  assert.equal(featureAllowed(plan, 'pos', { until: new Date(now.getTime() + DAY), features: ['pos'] }, now), true);
  assert.equal(featureAllowed(plan, 'pos', { until: new Date(now.getTime() - DAY), features: ['pos'] }, now), false);
  assert.equal(limitReached(plan, 'products', 2), true);
  assert.equal(limitReached(plan, 'products', 1), false);
  assert.equal(limitReached(plan, 'staff', 9999), false);
});

test('paystack webhook signature: valid, tampered, missing', () => {
  const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ZP-1' } }));
  const secret = 'sk_test_abc';
  const sig = crypto.createHmac('sha512', secret).update(body).digest('hex');
  assert.equal(verifyWebhookSignature(body, sig, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from(body.toString() + ' '), sig, secret), false);
  assert.equal(verifyWebhookSignature(body, 'deadbeef', secret), false);
  assert.equal(verifyWebhookSignature(body, undefined, secret), false);
  assert.equal(verifyWebhookSignature(body, sig, 'other_secret'), false);
});

test('Mongo URI validation accepts SRV and standard URIs without exposing credentials', () => {
  assert.deepEqual(validateMongoUri('mongodb+srv://user:secret@cluster.example.mongodb.net/zuno'), { hostname: 'cluster.example.mongodb.net', protocol: 'mongodb+srv:' });
  assert.deepEqual(validateMongoUri('mongodb://user:secret@db.example.net:27017/zuno?replicaSet=rs0'), { hostname: 'db.example.net', protocol: 'mongodb:' });
  for (const uri of ['', ' mongodb://db.example.net/zuno', 'mongodb+srv://<user>:<pass>@<cluster>/zuno', 'https://secret@example.net']) {
    assert.throws(() => validateMongoUri(uri), (error) => !error.message.includes('secret') && !error.message.includes('user:'));
  }
  assert.match(envFilePath, /backend[\\/]\.env$/);
});

test('missing Mongo config is actionable and startup never listens before DB connection', async () => {
  const oldUri = env.mongoUri;
  env.mongoUri = '';
  assert.throws(() => assertEnv(), /MONGODB_URI/);
  env.mongoUri = 'mongodb://username:secret@<placeholder>/db';
  assert.throws(() => assertEnv(), (error) => error.message.includes('MONGODB_URI') && !error.message.includes('secret') && !error.message.includes('username'));
  env.mongoUri = 'mongodb://127.0.0.1:27017/zuno-test';
  let listened = false;
  await assert.rejects(startServer({ connect: async () => { throw new Error('DNS failure; URI is redacted'); }, listen: async () => { listened = true; } }), /DNS failure/);
  assert.equal(listened, false);
  env.mongoUri = oldUri;
});

test('merchant Paystack credentials are encrypted with authenticated encryption and never exposed in status', () => {
  process.env.GATEWAY_ENCRYPTION_KEY ||= crypto.randomBytes(32).toString('base64');
  const plaintext = 'sk_test_merchantsecret123456789';
  const stored = encryptGatewaySecret(plaintext);
  assert.notEqual(stored.encryptedSecret, plaintext);
  assert.equal(decryptGatewaySecret(stored), plaintext);
  assert.throws(() => decryptGatewaySecret({ ...stored, encryptionTag: Buffer.alloc(16).toString('base64') }), /could not be decrypted/);
  assert.equal(validatePaystackSecret(plaintext), true);
  assert.equal(validatePaystackSecret('sk_test_short'), false);
  assert.deepEqual(SUPPORTED_PROVIDERS.map((provider) => provider.id), ['paystack']);
  // The status query intentionally excludes encryptedSecret (select: false).
  const status = gatewayStatus({ _id: 'gw', provider: 'paystack', enabled: true, maskedAccount: '••••6789' });
  assert.equal(status.maskedAccount, '••••6789');
  assert.equal(status.connected, true);
  assert.equal(gatewayStatus({ _id: 'gw', provider: 'paystack', enabled: false }).connected, false);
  assert.equal(JSON.stringify(status).includes('encryptedSecret'), false);
  assert.equal(createPaystackAdapter(plaintext).provider, 'paystack');
});

test('verified transaction must match reference, amount, currency and status', () => {
  const exp = { reference: 'ZP-1', amount: 1500000, currency: 'NGN' };
  const tx = { status: 'success', reference: 'ZP-1', amount: 1500000, currency: 'NGN' };
  assert.deepEqual(checkVerifiedTransaction(tx, exp), { ok: true });
  assert.equal(checkVerifiedTransaction({ ...tx, amount: 100 }, exp).reason, 'amount_mismatch');
  assert.equal(checkVerifiedTransaction({ ...tx, currency: 'USD' }, exp).reason, 'currency_mismatch');
  assert.equal(checkVerifiedTransaction({ ...tx, reference: 'ZP-2' }, exp).reason, 'reference_mismatch');
  assert.equal(checkVerifiedTransaction({ ...tx, status: 'failed' }, exp).reason, 'not_successful');
  assert.equal(checkVerifiedTransaction(null, exp).ok, false);
});

test('totals use integer kobo and cap discounts', () => {
  const items = [{ unitPrice: 150000, qty: 2 }, { unitPrice: 99999, qty: 1 }];
  assert.deepEqual(computeTotals(items), { subtotal: 399999, discountAmount: 0, deliveryFee: 0, total: 399999 });
  assert.equal(computeTotals(items, { discount: { type: 'percent', value: 10 } }).discountAmount, 40000);
  assert.equal(computeTotals(items, { discount: { type: 'amount', value: 9_999_999 } }).total, 0); // never negative
  assert.equal(computeTotals(items, { deliveryFee: 50000 }).total, 449999);
});

test('POS refund shares the discount proportionally', () => {
  const sale = { subtotal: 100000, discount: 10000 };
  assert.equal(refundFor(sale, [{ unitPrice: 50000, qty: 1 }]), 45000);
  assert.equal(refundFor(sale, [{ unitPrice: 50000, qty: 2 }]), 90000);
});

test('recovery: high-risk and weak-verification actions are blocked', () => {
  const base = { user: 'u', business: 'b', status: 'approved', category: 'lost_email_access', riskLevel: 'standard', verification: [] };
  assert.equal(recoveryActionCheck({ request: base, action: 'change_contact', role: 'support' }).ok, false); // no verification
  const weak = { ...base, verification: [{ method: 'registered_contact', outcome: 'passed' }, { method: 'manual_review', outcome: 'passed' }] };
  assert.equal(recoveryActionCheck({ request: weak, action: 'change_contact', role: 'support' }).ok, false); // no strong proof
  const strong = { ...base, verification: [{ method: 'business_records', outcome: 'passed' }, { method: 'manual_review', outcome: 'passed' }] };
  assert.equal(recoveryActionCheck({ request: strong, action: 'change_contact', role: 'support' }).ok, true);
  const failed = { ...base, verification: [{ method: 'business_records', outcome: 'failed' }, { method: 'authority_evidence', outcome: 'passed' }] };
  assert.equal(recoveryActionCheck({ request: failed, action: 'change_contact', role: 'support' }).ok, false); // failed checks do not count
  assert.equal(recoveryActionCheck({ request: { ...strong, status: 'under_review' }, action: 'change_contact', role: 'owner' }).ok, false); // must be approved
  const high = { ...strong, category: 'ownership_changed', riskLevel: 'high' };
  assert.equal(recoveryActionCheck({ request: high, action: 'change_contact', role: 'support' }).ok, false);
  assert.equal(recoveryActionCheck({ request: high, action: 'transfer_ownership', role: 'support' }).ok, false);
  assert.equal(recoveryActionCheck({ request: high, action: 'transfer_ownership', role: 'owner' }).ok, true);
  assert.equal(recoveryActionCheck({ request: { ...strong, category: 'forgot_password' }, action: 'transfer_ownership', role: 'owner' }).ok, false); // wrong category
  assert.equal(recoveryActionCheck({ request: { ...strong, status: 'rejected' }, action: 'send_reset', role: 'owner' }).ok, false);
  assert.equal(recoveryActionCheck({ request: { ...base, user: null }, action: 'send_reset', role: 'owner' }).ok, false);
  assert.equal(riskFor('suspected_compromise'), 'high');
  assert.equal(riskFor('forgot_password'), 'standard');
});

test('tokens are random, only hashes are comparable, references are unambiguous', () => {
  const a = newToken(); const b = newToken();
  assert.notEqual(a.raw, b.raw);
  assert.equal(a.hash, hashToken(a.raw));
  assert.notEqual(a.raw, a.hash);
  assert.ok(a.raw.length >= 40);
  assert.match(newReference('RC', 8), /^RC-[A-HJ-NP-Z2-9]{8}$/);
});

test('password policy', () => {
  assert.ok(passwordProblem('short'));
  assert.ok(passwordProblem('password123'));
  assert.ok(passwordProblem('franklynisgreat1', 'franklyn@x.com'));
  assert.equal(passwordProblem('a-much-longer-passphrase-42', 'franklyn@x.com'), null);
});

test('audit sanitizer removes secrets', () => {
  const out = sanitize({ password: 'p', resetToken: 't', nested: { authorization_code: 'AUTH_x', safe: 1 }, list: [{ secret: 's' }], card: '4111' });
  assert.equal(out.password, '[redacted]'); assert.equal(out.resetToken, '[redacted]');
  assert.equal(out.nested.authorization_code, '[redacted]'); assert.equal(out.nested.safe, 1);
  assert.equal(out.list[0].secret, '[redacted]'); assert.equal(out.card, '[redacted]');
});
