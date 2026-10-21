import { z } from 'zod';
import { bad } from './errors.js';

export { z };
export function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (!r.success) {
    const first = r.error.issues[0];
    throw bad(`${first.path.join('.') || 'input'}: ${first.message}`, r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return r.data;
}
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const phone = z.string().trim().min(7).max(20).regex(/^[+\d][\d\s-]+$/, 'Invalid phone number');
export const kobo = z.number().int().min(0).max(100_000_000_000);
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const pageParams = (q) => {
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};
