import crypto from 'node:crypto';

// Raw tokens are sent to the user. Only the SHA-256 hash is stored.
export function newToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString('base64url');
  return { raw, hash: hashToken(raw) };
}
export const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');
export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export const newReference = (prefix, len = 8) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous characters
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${s}`;
};
