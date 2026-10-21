import { Business, MerchantGateway } from '../models/index.js';
import { createPaystackAdapter, validatePaystackSecret } from '../lib/paystack.js';
import { decryptGatewaySecret, encryptGatewaySecret } from '../lib/gatewayEncryption.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/errors.js';

export const SUPPORTED_PROVIDERS = Object.freeze([
  { id: 'paystack', name: 'Paystack', onlineCheckout: true, refunds: true, authorizationFlow: false },
]);

export function platformPaystack() {
  if (!env.platformPaystackSecret) throw new HttpError(503, 'Zuno platform billing is not configured.', 'PLATFORM_PAYMENTS_NOT_CONFIGURED');
  return createPaystackAdapter(env.platformPaystackSecret);
}

export async function connectMerchantPaystack({ business, secret }) {
  if (!validatePaystackSecret(secret)) throw new HttpError(400, 'Enter a valid Paystack secret key. Use a test key for development.', 'INVALID_GATEWAY_CREDENTIALS');
  const adapter = createPaystackAdapter(secret);
  const account = await adapter.testConnection();
  const encrypted = encryptGatewaySecret(secret);
  const credentials = {
    enabled: true, ...encrypted,
    maskedAccount: `••••${secret.slice(-4)}`, providerAccountId: account.accountId,
    testedAt: new Date(), connectedAt: new Date(),
  };
  // Update the existing record when reconnecting, so retries don't create duplicate
  // business/provider rows (and old unique indexes remain compatible).
  let gateway = await MerchantGateway.findOneAndUpdate(
    { business, provider: 'paystack', enabled: true }, { $set: credentials }, { new: true, runValidators: true },
  );
  if (!gateway) gateway = await MerchantGateway.findOneAndUpdate(
    { business, provider: 'paystack' }, { $set: credentials }, { new: true, sort: { connectedAt: -1 }, runValidators: true },
  );
  if (!gateway) {
    try {
      [gateway] = await MerchantGateway.create([{ business, provider: 'paystack', ...credentials }]);
    } catch (error) {
      // A concurrent connect may have inserted the first record after our lookup.
      if (error?.code !== 11000) throw error;
      gateway = await MerchantGateway.findOneAndUpdate(
        { business, provider: 'paystack' }, { $set: credentials }, { new: true, sort: { connectedAt: -1 }, runValidators: true },
      );
      if (!gateway) throw error;
    }
  }
  const b = await Business.findByIdAndUpdate(business, { defaultPaymentProvider: 'paystack' }, { new: true }).select('_id');
  return { gateway, accountName: account.accountName, business: b?._id };
}

export async function testMerchantPaystackConnection(secret) {
  if (!validatePaystackSecret(secret)) throw new HttpError(400, 'Enter a valid Paystack secret key. Use a test key for development.', 'INVALID_GATEWAY_CREDENTIALS');
  const account = await createPaystackAdapter(secret).testConnection();
  return { provider: 'paystack', connected: true, accountName: account.accountName, accountId: account.accountId };
}

export async function resolveMerchantProvider(businessId, provider = 'paystack', { allowDisabled = false, gatewayId } = {}) {
  if (!SUPPORTED_PROVIDERS.some((p) => p.id === provider)) throw new HttpError(400, 'This payment provider is not supported.', 'PROVIDER_UNSUPPORTED');
  const query = MerchantGateway.findOne({ business: businessId, provider, ...(gatewayId ? { _id: gatewayId } : {}), ...(allowDisabled ? {} : { enabled: true }) })
    .select('+encryptedSecret +encryptionIv +encryptionTag');
  const gateway = await query;
  if (!gateway) throw new HttpError(503, 'This merchant has not connected an enabled payment gateway. Contact the store owner or choose another payment method.', 'MERCHANT_GATEWAY_NOT_CONFIGURED');
  const secret = decryptGatewaySecret(gateway);
  if (!validatePaystackSecret(secret)) throw new HttpError(503, 'The merchant payment gateway configuration is invalid. Contact the store owner.', 'MERCHANT_GATEWAY_INVALID');
  return { adapter: createPaystackAdapter(secret), gateway };
}

export async function resolvePaymentProvider(payment, options = {}) {
  const merchantPurposes = ['storefront_order', 'pos_sale'];
  const isMerchantPayment = merchantPurposes.includes(payment.purpose);
  if (isMerchantPayment) {
    if (payment.context !== 'merchant' || !payment.business || !payment.gateway || !payment.provider) {
      throw new HttpError(503, 'This merchant payment is missing its gateway binding and cannot be verified.', 'PAYMENT_GATEWAY_BINDING_INVALID');
    }
    if (options.expectedContext && options.expectedContext !== 'merchant') throw new HttpError(403, 'This event is not for a merchant sale.', 'PAYMENT_CONTEXT_MISMATCH');
    if (options.gatewayId && String(payment.gateway) !== String(options.gatewayId)) throw new HttpError(403, 'The payment does not belong to this merchant gateway.', 'PAYMENT_TENANT_MISMATCH');
    const { adapter, gateway } = await resolveMerchantProvider(payment.business, payment.provider, { allowDisabled: true, gatewayId: payment.gateway });
    if (String(gateway._id) !== String(payment.gateway)) throw new HttpError(403, 'The payment is bound to a different merchant gateway.', 'PAYMENT_TENANT_MISMATCH');
    return { adapter, gateway, context: 'merchant' };
  }
  if (!['setup_fee', 'subscription', 'app_setup'].includes(payment.purpose) || (options.expectedContext && options.expectedContext !== 'platform')) {
    throw new HttpError(403, 'This payment is not a Zuno platform charge.', 'PAYMENT_CONTEXT_MISMATCH');
  }
  if (payment.context && payment.context !== 'platform') throw new HttpError(403, 'This payment is not a Zuno platform charge.', 'PAYMENT_CONTEXT_MISMATCH');
  if (payment.provider && payment.provider !== 'paystack') throw new HttpError(503, 'The payment provider is not supported for this transaction.', 'PROVIDER_UNSUPPORTED');
  return { adapter: platformPaystack(), gateway: null, context: 'platform' };
}

export async function gatewaysForWebhook() {
  return MerchantGateway.find({ provider: 'paystack', enabled: true }).select('+encryptedSecret +encryptionIv +encryptionTag');
}

export function gatewayStatus(gateway) {
  return {
    id: gateway._id,
    provider: gateway.provider,
    enabled: gateway.enabled,
    // The status endpoint intentionally does not select encryptedSecret.
    // An enabled record is only persisted after credentials are encrypted.
    connected: gateway.enabled === true,
    maskedAccount: gateway.maskedAccount || null,
    providerAccountId: gateway.providerAccountId || null,
    testedAt: gateway.testedAt || null,
    connectedAt: gateway.connectedAt || null,
  };
}
