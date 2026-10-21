import { AuditLog } from '../models/index.js';

const SENSITIVE = /pass|token|secret|authorization|card|cvv|signature/i;
export function sanitize(obj, depth = 0) {
  if (obj == null || depth > 4) return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitize(v, depth + 1));
  if (obj instanceof Date || typeof obj !== 'object') return obj;
  if (obj._bsontype) return String(obj);
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = SENSITIVE.test(k) ? '[redacted]' : sanitize(v, depth + 1);
  return out;
}

export async function audit({ req, actor, actorType, action, targetType, targetId, business, related, reason, outcome = 'success', meta }) {
  try {
    await AuditLog.create({
      actor: actor ?? req?.user?._id, actorType: actorType || (req?.user?.platformRole && req?.baseUrl?.includes('/admin') ? 'platform' : req?.user ? 'merchant' : 'system'),
      action, targetType, targetId, business, related, reason, outcome, meta: sanitize(meta), ip: req?.ip,
    });
  } catch (e) {
    console.error('audit write failed', e.message); // never break the request because of audit I/O, but do surface it
  }
}
