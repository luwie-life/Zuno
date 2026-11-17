import { Token, User } from '../models/index.js';
import { newToken, hashToken } from '../lib/tokens.js';
import { bad, HttpError } from '../lib/errors.js';
import { env } from '../config/env.js';
import { sendMail } from './mailer.js';
import { verificationCutoff, verificationExpiry } from '../middleware/verification.js';

export async function sendVerification(user) {
  const t = newToken();
  await Token.create({ user: user._id, purpose: 'email_verify', tokenHash: t.hash, expiresAt: verificationExpiry(), meta: { email: user.email } });
  const delivery = await sendMail({ user, to: user.email, template: 'verify_email', subject: 'Verify your Zuno email', text: `Hi ${user.name},\n\nConfirm your email address:\n${env.frontendUrl}/verify-email?token=${t.raw}\n\nThis link expires in 30 minutes and can only be used once.` });
  if (!delivery.sent) throw new HttpError(503, 'We could not send your verification email. Please try resending shortly.', 'VERIFICATION_DELIVERY_FAILED');
}

export async function verifyEmailToken(raw) {
  const now = new Date();
  const t = await Token.findOneAndUpdate({ tokenHash: hashToken(raw), purpose: 'email_verify', usedAt: null, expiresAt: { $gt: now }, createdAt: { $gt: verificationCutoff(now) } }, { usedAt: now });
  if (!t) throw bad('This verification link is invalid or has expired. Request a new one.');
  const filter = { _id: t.user, status: 'active' };
  if (t.meta?.email) filter.email = t.meta.email;
  else throw bad('Request a new verification link to continue.');
  const result = await User.updateOne(filter, { emailVerified: true });
  if (!result.matchedCount) throw bad('This verification link no longer matches your account. Request a new one.');
  await Token.updateMany({ user: t.user, purpose: 'email_verify', usedAt: null }, { usedAt: now });
}
