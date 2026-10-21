import mongoose from 'mongoose';
import { env } from '../config/env.js';

/**
 * Runs fn inside a MongoDB transaction (needs a replica set; MongoDB Atlas always is one).
 * For local standalone MongoDB set ALLOW_NO_TXN=true to fall back to non-transactional execution.
 * Even then, every stock change uses a conditional atomic update, so overselling is still prevented;
 * only multi-document all-or-nothing rollback is lost.
 */
export async function withTxn(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await fn(session); });
    return result;
  } catch (e) {
    if (env.allowNoTxn && /replica set|Transaction numbers are only allowed/i.test(e.message || '')) return fn(null);
    throw e;
  } finally {
    session.endSession();
  }
}

export async function nextSeq(businessId, key, session) {
  const c = await mongoose.model('Counter').findOneAndUpdate(
    { business: businessId, key }, { $inc: { seq: 1 } }, { new: true, upsert: true, session },
  );
  return c.seq;
}
