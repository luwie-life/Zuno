import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RecoveryRequest, User, Business, Membership } from '../models/index.js';
import { asyncH, notFound, bad } from '../lib/errors.js';
import { parse, z, phone } from '../lib/validate.js';
import { newReference, newToken, hashToken, safeEqual } from '../lib/tokens.js';
import { riskFor } from '../lib/recoveryRules.js';
import { sendMail } from '../services/mailer.js';
import { audit } from '../services/audit.js';
import { env } from '../config/env.js';

const r = Router();
const mk = (max, windowMs) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } } });
const NEUTRAL = 'We received your request. Keep your reference and access key: you need both to check progress. Our team will contact you using the details you provided.';

const body = z.object({
  category: z.enum(['forgot_password', 'forgot_email', 'lost_email_access', 'lost_phone_access', 'cannot_identify_account', 'former_admin_lost_access', 'ownership_changed', 'suspected_compromise', 'other']),
  name: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(120).optional(),
  possibleEmail: z.string().trim().email().optional().or(z.literal('')),
  registeredPhone: phone.optional().or(z.literal('')),
  storeSlug: z.string().trim().max(60).optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  contactPhone: phone.optional().or(z.literal('')),
  registrationPeriod: z.string().max(60).optional(),
  explanation: z.string().trim().min(10).max(2000),
  preferredContact: z.enum(['email', 'phone']).optional(),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

r.post('/', mk(5, 60 * 60_000), asyncH(async (req, res) => {
  const b = parse(body, req.body);
  if (!b.contactEmail && !b.contactPhone) throw bad('Give at least one way for us to reach you: a current email or phone.');
  // Best-effort internal matching. NEVER reflected back to the applicant.
  let user = null; let business = null;
  if (b.possibleEmail) user = await User.findOne({ email: b.possibleEmail.toLowerCase() });
  if (!user && b.registeredPhone) user = await User.findOne({ phone: b.registeredPhone });
  if (b.storeSlug) business = await Business.findOne({ slug: b.storeSlug.toLowerCase() });
  if (!user && business) user = await User.findById(business.owner);
  const key = newToken(6);
  const statusKey = key.raw.slice(0, 10).toUpperCase().replace(/[-_]/g, 'X');
  const reference = newReference('RC', 8);
  const doc = await RecoveryRequest.create({
    reference, statusKeyHash: hashToken(statusKey), category: b.category, riskLevel: riskFor(b.category),
    applicant: { name: b.name, businessName: b.businessName, possibleEmail: b.possibleEmail || undefined, registeredPhone: b.registeredPhone || undefined, storeSlug: b.storeSlug, contactEmail: b.contactEmail || undefined, contactPhone: b.contactPhone || undefined, registrationPeriod: b.registrationPeriod, explanation: b.explanation, preferredContact: b.preferredContact },
    user: user?._id, business: business?._id,
  });
  await audit({ req, actorType: 'public', action: 'recovery.submitted', targetType: 'RecoveryRequest', targetId: doc._id, meta: { category: b.category } });
  if (b.contactEmail) await sendMail({ to: b.contactEmail, template: 'recovery_received', subject: `Zuno recovery request ${reference}`, text: `We received your account recovery request.\nReference: ${reference}\n\nWe will contact you after review. Keep your access key private: it is shown only once on the confirmation page.` });
  res.status(201).json({ reference, statusKey, message: NEUTRAL });
}));

async function authorize(refIn, keyIn) {
  const doc = await RecoveryRequest.findOne({ reference: String(refIn || '').toUpperCase() }).select('+statusKeyHash');
  if (!doc || !safeEqual(doc.statusKeyHash, hashToken(String(keyIn || '').toUpperCase()))) throw notFound('No request matches those details.');
  return doc;
}

// Reference alone never reveals anything: it must be paired with the one-time access key.
r.post('/status', mk(20, 15 * 60_000), asyncH(async (req, res) => {
  const b = parse(z.object({ reference: z.string().max(30), statusKey: z.string().max(30) }), req.body);
  const doc = await authorize(b.reference, b.statusKey);
  res.json({ reference: doc.reference, status: doc.status, createdAt: doc.createdAt, messages: doc.publicMessages.map((m) => ({ at: m.at, from: m.from, body: m.body })) });
}));

r.post('/respond', mk(10, 15 * 60_000), asyncH(async (req, res) => {
  const b = parse(z.object({ reference: z.string().max(30), statusKey: z.string().max(30), message: z.string().trim().min(2).max(2000) }), req.body);
  const doc = await authorize(b.reference, b.statusKey);
  if (['closed', 'resolved', 'rejected'].includes(doc.status)) throw bad('This request is no longer open.');
  doc.publicMessages.push({ at: new Date(), from: 'applicant', body: b.message });
  if (doc.status === 'more_info_required') doc.status = 'under_review';
  await doc.save();
  res.json({ ok: true, status: doc.status });
}));
export default r;
