import mongoose from 'mongoose';
import { env, assertEnv } from './config/env.js';
import { createApp } from './app.js';
import { connectMongo } from './services/mongo.js';
import { ensureDefaultPlans, expireAndRenewDue } from './services/subscriptions.js';
import { releaseExpiredReservations } from './services/orders.js';
import { reconcilePayments } from './services/payments.js';
import { getSettings } from './services/settings.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export async function startServer({ connect = connectMongo, initialize = async () => {
  await ensureDefaultPlans();
  await getSettings();
}, listen = (app) => new Promise((resolve, reject) => {
  const server = app.listen(env.port, () => resolve(server));
  server.once('error', reject);
}) } = {}) {
  assertEnv();
  await connect();
  await initialize();

  const app = createApp();
  const server = await listen(app);
  console.log(`Zuno API listening on :${env.port} (${env.nodeEnv})`);

  if (env.runJobs) {
    // Reservation expiry every minute; renewals + payment reconciliation every 30 minutes.
    // On Render free instances that sleep, also trigger POST /api/admin/jobs/run from a cron service.
    setInterval(() => releaseExpiredReservations().catch((e) => console.error('job: reservations', e.message)), 60_000).unref();
    setInterval(async () => {
      await expireAndRenewDue().catch((e) => console.error('job: renewals', e.message));
      await reconcilePayments().catch((e) => console.error('job: reconcile', e.message));
    }, 30 * 60_000).unref();
  }

  let shutdownPromise;
  const shutdown = () => {
    if (!shutdownPromise) shutdownPromise = new Promise((resolve) => server.close(resolve)).then(() => mongoose.disconnect());
    return shutdownPromise;
  };
  process.once('SIGTERM', () => shutdown().catch(() => { process.exitCode = 1; }));
  process.once('SIGINT', () => shutdown().catch(() => { process.exitCode = 1; }));
  return { server, shutdown };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer().catch((error) => {
    console.error(error.message || 'Zuno startup failed.');
    process.exitCode = 1;
  });
}
