import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { merchantOriginAllowed } from './lib/merchantDomain.js';
import { getSettings } from './services/settings.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import webhooks from './routes/webhooks.js';
import auth from './routes/auth.js';
import business from './routes/business.js';
import catalog from './routes/catalog.js';
import store from './routes/store.js';
import publicPortfolio from './routes/publicPortfolio.js';
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
import services from './routes/services.js';
import bookings from './routes/bookings.js';
import serviceManagement from './routes/services.js';
import portfolio from './routes/portfolio.js';
import media from './routes/media.js';

export function createApp() {
  const app = express();

  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');

  app.use(helmet());

  app.use(cors({
    origin(origin, cb) {
      if (
        !origin ||
        env.corsOrigins.includes(origin) ||
        merchantOriginAllowed(origin, env.merchantDomain)
      ) {
        return cb(null, true);
      }

      cb(null, false);
    },

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Business-Id',
    ],

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ],

    maxAge: 600,
  }));

  // Webhooks need the raw request body.
  app.use('/api/webhooks', webhooks);

  // Media authenticates and resolves ownership before its route-specific 8 MB parser.
  app.use('/api/media', media);
  app.use(express.json({ limit: '200kb' }));

  app.use('/api', rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      time: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (req, res) => {
    const ready = mongoose.connection.readyState === 1;

    res.status(ready ? 200 : 503).json({
      ok: ready,
    });
  });

  app.get('/api/contact', async (req, res, next) => {
    try {
      const settings = await getSettings();

      res.json({
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', auth);
  app.use('/api/recovery', recovery);

  // Public portfolio routes must be registered before the storefront router.
  app.use('/api/store', publicPortfolio);
  app.use('/api/store', store);

  app.use('/api/billing', billing);
  app.use('/api/payments', payments);

  app.use('/api/businesses', business);
  app.use('/api/catalog', catalog);
  app.use('/api/orders', orders);
  app.use('/api/customers', customers);

  app.use('/api/services', services);
  app.use('/api/bookings', bookings);
  app.use('/api/services', serviceManagement);

  // Portfolio management.
  app.use('/api/portfolio', portfolio);

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
