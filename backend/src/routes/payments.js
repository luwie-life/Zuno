import { Router } from 'express';
import { Business, MerchantGateway } from '../models/index.js';
import { asyncH, forbidden, notFound } from '../lib/errors.js';
import { parse, z } from '../lib/validate.js';
import { requireAuth, requireBusiness } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { connectMerchantPaystack, gatewayStatus, SUPPORTED_PROVIDERS, testMerchantPaystackConnection } from '../services/paymentProviders.js';

const r = Router();
r.use(requireAuth, requireBusiness('business.update'));
const ownerOnly = (req) => { if (req.role !== 'owner') throw forbidden('Only a business owner can manage payment gateway credentials.'); };
const secretBody = z.object({ secretKey: z.string().trim().min(12).max(256) });

r.get('/gateways', asyncH(async (req, res) => {
  const [gateways, business] = await Promise.all([
    MerchantGateway.find({ business: req.business._id }).sort('-connectedAt').select('business provider enabled maskedAccount providerAccountId testedAt connectedAt').limit(1),
    Business.findById(req.business._id).select('defaultPaymentProvider'),
  ]);
  res.json({ providers: SUPPORTED_PROVIDERS, gateways: gateways.map(gatewayStatus), defaultProvider: business?.defaultPaymentProvider || null });
}));

r.post('/gateways/paystack/test', asyncH(async (req, res) => {
  ownerOnly(req);
  const { secretKey } = parse(secretBody, req.body);
  res.json(await testMerchantPaystackConnection(secretKey));
}));

r.post('/gateways/paystack/connect', asyncH(async (req, res) => {
  ownerOnly(req);
  const { secretKey } = parse(secretBody, req.body);
  const { gateway, accountName } = await connectMerchantPaystack({ business: req.business._id, secret: secretKey });
  await audit({ req, action: 'payment_gateway.connected', business: req.business._id, targetType: 'MerchantGateway', targetId: gateway._id, meta: { provider: 'paystack', accountName } });
  res.status(201).json({ gateway: gatewayStatus(gateway), accountName });
}));

r.patch('/gateways/default', asyncH(async (req, res) => {
  ownerOnly(req);
  const { provider } = parse(z.object({ provider: z.enum(['paystack']) }), req.body);
  const gateway = await MerchantGateway.findOne({ business: req.business._id, provider, enabled: true }).select('_id');
  if (!gateway) throw notFound('Connect this provider before selecting it as the default.');
  await Business.updateOne({ _id: req.business._id }, { defaultPaymentProvider: provider });
  await audit({ req, action: 'payment_gateway.default_changed', business: req.business._id, meta: { provider } });
  res.json({ defaultProvider: provider });
}));

r.delete('/gateways/paystack', asyncH(async (req, res) => {
  ownerOnly(req);
  const gateway = await MerchantGateway.findOneAndUpdate({ business: req.business._id, provider: 'paystack', enabled: true }, { enabled: false }, { new: true }).select('business provider enabled maskedAccount providerAccountId testedAt connectedAt');
  if (!gateway) throw notFound('No connected Paystack account was found.');
  await Business.updateOne({ _id: req.business._id, defaultPaymentProvider: 'paystack' }, { $unset: { defaultPaymentProvider: 1 } });
  await audit({ req, action: 'payment_gateway.disconnected', business: req.business._id, targetType: 'MerchantGateway', targetId: gateway._id, meta: { provider: 'paystack' } });
  // Credentials remain encrypted for verification/refunds of historical transactions; the disabled gateway cannot be selected for new payments.
  res.json({ gateway: gatewayStatus(gateway), defaultProvider: null });
}));

export default r;
