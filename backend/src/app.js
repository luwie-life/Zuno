import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { getSettings } from './services/settings.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import webhooks from './routes/webhooks.js';
import auth from './routes/auth.js';
import business from './routes/business.js';
import catalog from './routes/catalog.js';
import store from './routes/store.js';
import orders from './routes/orders.js';
import customers from './routes/customers.js';
import pos from './routes/pos.js';
import inventory from './routes/inventory.js';
import reports from './routes/reports.js';
import billing from './routes/billing.js';
import recovery from './routes/recovery.js';
import { merchantSupport, adminSupport } from './routes/support.js';
import { merchantApps, adminApps, publicApps } from './routes/apps.js';
import adminCore from './routes/admin/core.js';
import adminRecovery from './routes/admin/recovery.js';
import payments from './routes/payments.js';

export function createApp() {
  const app = express();
  if (env.trustProxy) app.set('trust proxy', 1); // set TRUST_PROXY=true on Render so rate limits see real client IPs
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, cb) {
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true); // allow-list only; no wildcard
      cb(null, false);
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Business-Id'], methods: ['GET', 'POST', 'PATCH', 'DELETE'], maxAge: 600,
  }));

  app.use('/api/webhooks', webhooks); // BEFORE express.json: needs the raw body
  app.use(express.json({ limit: '200kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.get('/api/contact', async (req, res, next) => { try { const s = await getSettings(); res.json({ supportEmail: s.supportEmail, supportPhone: s.supportPhone }); } catch (e) { next(e); } });
  app.use('/api/auth', auth);
  app.use('/api/recovery', recovery);
  app.use('/api/store', store);
  app.use('/api/billing', billing);
  app.use('/api/payments', payments);
  app.use('/api/businesses', business);
  app.use('/api/catalog', catalog);
  app.use('/api/orders', orders);
  app.use('/api/customers', customers);
  app.use('/api/pos', pos);
  app.use('/api/inventory', inventory);
  app.use('/api/reports', reports);
  app.use('/api/support', merchantSupport);
  app.use('/api/mobile-apps', publicApps);
  app.use('/api/mobile-apps', merchantApps);
  app.use('/api/admin/support', adminSupport);
  app.use('/api/admin/mobile-apps', adminApps);
  app.use('/api/admin/recovery', adminRecovery);
  app.use('/api/admin', adminCore);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
