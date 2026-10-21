import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from './errors.js';

async function call(secret, method, path, body) {
  if (!secret) throw new HttpError(503, 'The selected Paystack account is not configured.', 'PAYSTACK_NOT_CONFIGURED');
  let res;
  try {
    res = await fetch(env.paystackBase + path, {
      method,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new HttpError(502, 'Could not reach the payment provider.', 'PAYSTACK_UNREACHABLE');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) throw new HttpError(502, 'The payment provider rejected this request. Verify the connected account and try again.', 'PAYSTACK_ERROR');
  return json;
}

export function validatePaystackSecret(secret) {
  return typeof secret === 'string' && /^sk_(test|live)_[A-Za-z0-9]{8,}$/.test(secret);
}

export function createPaystackAdapter(secret) {
  return {
    provider: 'paystack',
    validateConfiguration: () => validatePaystackSecret(secret),
    initialize: (p) => call(secret, 'POST', '/transaction/initialize', p),
    verify: (reference) => call(secret, 'GET', `/transaction/verify/${encodeURIComponent(reference)}`),
    refund: (p) => call(secret, 'POST', '/refund', p),
    testConnection: async () => {
      const response = await call(secret, 'GET', '/balance');
      return {
        accountName: null,
        accountId: response.data?.integration ? String(response.data.integration).slice(0, 80) : null,
      };
    },
    verifyWebhook: (rawBody, signature) => verifyWebhookSignature(rawBody, signature, secret),
  };
}

const platformAdapter = () => createPaystackAdapter(env.platformPaystackSecret);
export const initializeTransaction = (p) => platformAdapter().initialize(p);
export const verifyTransaction = (reference) => platformAdapter().verify(reference);
export const chargeAuthorization = (p) => call(env.platformPaystackSecret, 'POST', '/transaction/charge_authorization', p);
export const createRefund = (p) => platformAdapter().refund(p);

// Paystack signs the RAW request body with HMAC-SHA512 using your secret key (x-paystack-signature header).
export function verifyWebhookSignature(rawBody, signature, secret = env.platformPaystackSecret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Pure check that a verified Paystack transaction matches what we expected.
 * Never trust the browser: amount, currency, reference and status must all match.
 */
export function checkVerifiedTransaction(tx, expected) {
  if (!tx) return { ok: false, reason: 'no_transaction' };
  if (tx.status !== 'success') return { ok: false, reason: 'not_successful' };
  if (tx.reference !== expected.reference) return { ok: false, reason: 'reference_mismatch' };
  if (Number(tx.amount) !== Number(expected.amount)) return { ok: false, reason: 'amount_mismatch' };
  if (String(tx.currency).toUpperCase() !== String(expected.currency).toUpperCase()) return { ok: false, reason: 'currency_mismatch' };
  return { ok: true };
}
