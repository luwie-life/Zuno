import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Always load backend/.env regardless of the process working directory. Explicit
// process environment variables (e.g. Render) take precedence over this file.
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const envFilePath = path.join(backendRoot, '.env');
dotenv.config({ path: envFilePath, override: false });

const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  // Standalone MongoDB (no replica set) cannot run transactions. Only allow this in local dev.
  allowNoTxn: process.env.ALLOW_NO_TXN === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: list(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173'),
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  jwtSecret: process.env.JWT_SECRET || '',
  sessionHours: Number(process.env.SESSION_HOURS || 12),
  platformPaystackSecret: process.env.PLATFORM_PAYSTACK_SECRET_KEY || '',
  gatewayEncryptionKey: process.env.GATEWAY_ENCRYPTION_KEY || '',
  paystackBase: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Zuno <no-reply@example.com>',
  },
  devLogEmails: process.env.DEV_LOG_EMAILS === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',
  runJobs: process.env.RUN_JOBS !== 'false',
};

export function assertEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  else {
    try {
      const parsed = new URL(env.mongoUri.trim());
      if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !parsed.hostname || /<|>|replace.?me|your.?cluster|username:password/i.test(env.mongoUri)) {
        missing.push('MONGODB_URI (must be a valid MongoDB URI, not a placeholder)');
      }
    } catch {
      missing.push('MONGODB_URI (must be a valid mongodb:// or mongodb+srv:// URI)');
    }
    if (env.mongoUri !== env.mongoUri.trim()) missing.push('MONGODB_URI (remove surrounding whitespace)');
  }
  if (!env.jwtSecret || env.jwtSecret.length < 32) missing.push('JWT_SECRET (min 32 chars)');
  if (env.nodeEnv === 'production') {
    if (!process.env.FRONTEND_URL) missing.push('FRONTEND_URL');
    if (env.allowNoTxn) missing.push('ALLOW_NO_TXN must not be true in production');
  }
  if (missing.length) throw new Error('Invalid environment configuration: ' + missing.join(', '));
}
