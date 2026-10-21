import { Router } from 'express';
import express from 'express';
import { WebhookEvent, Order, Payment } from '../models/index.js';
import { verifyWebhookSignature } from '../lib/paystack.js';
import { verifyAndApply } from '../services/payments.js';
import { resolvePaymentProvider } from '../services/paymentProviders.js';
import { audit } from '../services/audit.js';

const r = Router();
// Raw body is required: the signature is computed over the exact bytes Paystack sent.
r.post('/paystack', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  const raw = req.body;
  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.sendStatus(400); }
  // Fast-path invalid signatures using the Zuno webhook key. Valid merchant
  // signatures are subsequently checked against the tenant-bound gateway key.
  const signature = req.headers['x-paystack-signature'];
  const platformSigned = verifyWebhookSignature(raw, signature);
  if (!platformSigned && (!signature || !/^[a-f\d]{128}$/i.test(String(signature)))) {
    await audit({ actorType: 'public', action: 'webhook.invalid_signature', outcome: 'rejected', ip: req.ip, req });
    return res.sendStatus(401);
  }
  const data = event.data || {};
  const reference = data.reference || data.transaction_reference || data.transaction?.reference;
  let payment;
  try { payment = reference ? await Payment.findOne({ reference }) : null; }
  catch { return res.sendStatus(503); }
  if (!payment) {
    if (!platformSigned) {
      await audit({ actorType: 'public', action: 'webhook.invalid_signature', outcome: 'rejected', ip: req.ip, req });
      return res.sendStatus(401);
    }
    return res.sendStatus(200);
  }
  let provider;
  try { provider = await resolvePaymentProvider(payment); } catch { return res.sendStatus(401); }
  if (!provider.adapter.verifyWebhook(raw, signature)) {
    await audit({ actorType: 'public', action: 'webhook.invalid_signature', business: payment.business, outcome: 'rejected', ip: req.ip, req });
    return res.sendStatus(401);
  }
  const contextKey = provider.context === 'merchant' ? String(provider.gateway._id) : 'platform';
  const key = `${contextKey}:${event.event}:${data.id || reference || data.refund_reference}`;
  try {
    await WebhookEvent.create({ key, event: event.event }); // unique key: replays are acknowledged and ignored
  } catch (e) {
    if (e.code === 11000) return res.sendStatus(200);
    return res.sendStatus(500);
  }
  try {
    if (event.event === 'charge.success' && data.reference) {
      const expectedContext = ['storefront_order', 'pos_sale'].includes(payment.purpose) ? 'merchant' : 'platform';
      await verifyAndApply(data.reference, { expectedContext, gatewayId: provider.gateway?._id }); // re-verified with the exact account, never trusted from payload
    }
    if (event.event === 'refund.processed') {
      if (provider.context === 'merchant' && ['storefront_order', 'pos_sale'].includes(payment.purpose)) {
        await Order.updateOne({ business: payment.business, paymentReference: reference, paymentStatus: 'refund_pending' }, { paymentStatus: 'refunded', $push: { history: { action: 'refund_processed' } } });
        await Payment.updateOne({ _id: payment._id, business: payment.business, context: 'merchant' }, { status: 'refunded' });
      }
    }
    await WebhookEvent.updateOne({ key }, { processedAt: new Date() });
    res.sendStatus(200);
  } catch (e) {
    console.error('webhook processing failed', event.event, e.message);
    await WebhookEvent.deleteOne({ key }).catch(() => {}); // allow Paystack to retry
    res.sendStatus(500);
  }
});
export default r;
