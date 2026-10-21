import mongoose from 'mongoose';
import { env } from '../config/env.js';

const PLACEHOLDER = /<|>|replace.?me|your.?cluster|username:password|example\.com/i;

export function validateMongoUri(uri) {
  if (typeof uri !== 'string' || !uri || uri !== uri.trim() || /\s/.test(uri)) {
    throw new Error('Invalid MongoDB configuration: MONGODB_URI is missing or contains whitespace. Set the backend MONGODB_URI to the exact URI copied from your Atlas cluster.');
  }
  let parsed;
  try { parsed = new URL(uri); } catch {
    throw new Error('Invalid MongoDB configuration: MONGODB_URI must be a valid mongodb:// or mongodb+srv:// URI.');
  }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !parsed.hostname || PLACEHOLDER.test(uri)) {
    throw new Error('Invalid MongoDB configuration: MONGODB_URI is malformed or still contains a placeholder. Copy the URI from the intended MongoDB Atlas cluster.');
  }
  return { hostname: parsed.hostname, protocol: parsed.protocol };
}

function hasDnsFailure(error) {
  let current = error;
  for (let i = 0; current && i < 6; i++, current = current.cause || current.reason) {
    if (current.code === 'ENOTFOUND' || current.code === 'EAI_AGAIN' || /getaddrinfo ENOTFOUND|EAI_AGAIN/i.test(current.message || '')) return true;
  }
  return false;
}

export async function connectMongo(uri = env.mongoUri) {
  const { hostname, protocol } = validateMongoUri(uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12_000 });
    console.info(`MongoDB connected (${protocol}//${hostname})`);
  } catch (error) {
    const diagnostic = hasDnsFailure(error)
      ? `DNS lookup failed for configured MongoDB hostname "${hostname}". Check that this exact hostname is current in Atlas and that Windows/network DNS can resolve it.`
      : `Could not connect to configured MongoDB hostname "${hostname}". Check Atlas cluster status, DNS/network reachability, credentials, and database access settings.`;
    await mongoose.disconnect().catch(() => {});
    // Deliberately omit Mongoose's original message and cause; they may include URI details.
    throw new Error(`MongoDB startup failed: ${diagnostic}`);
  }
}
