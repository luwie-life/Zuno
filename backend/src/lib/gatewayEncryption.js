import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from './errors.js';

function encryptionKey() {
  const raw = process.env.GATEWAY_ENCRYPTION_KEY || env.gatewayEncryptionKey;
  const key = /^[a-f\d]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (!raw || key.length !== 32) throw new HttpError(503, 'Merchant gateway storage is not configured. Set GATEWAY_ENCRYPTION_KEY to a base64-encoded 32-byte key.', 'GATEWAY_STORAGE_NOT_CONFIGURED');
  return key;
}

export function encryptGatewaySecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return { encryptedSecret: encrypted.toString('base64'), encryptionIv: iv.toString('base64'), encryptionTag: cipher.getAuthTag().toString('base64') };
}

export function decryptGatewaySecret(gateway) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(gateway.encryptionIv, 'base64'));
    decipher.setAuthTag(Buffer.from(gateway.encryptionTag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(gateway.encryptedSecret, 'base64')), decipher.final()]).toString('utf8');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'Stored gateway credentials could not be decrypted. Reconnect the provider.', 'GATEWAY_CREDENTIALS_UNAVAILABLE');
  }
}
