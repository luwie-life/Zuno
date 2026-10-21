import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Notification } from '../models/index.js';

let transport;
const configured = () => !!(env.smtp.host && env.smtp.user && env.smtp.pass);

/**
 * Sends an email through SMTP. If no provider is configured the message is NOT sent and
 * the Notification record says so honestly. In non-production with DEV_LOG_EMAILS=true the
 * body is printed to the server console so you can follow links locally.
 */
export async function sendMail({ user, to, template, subject, text }) {
  if (!to) return { sent: false, reason: 'no_recipient' };
  if (!configured()) {
    await Notification.create({ user: user?._id || user, toEmail: to, template, subject, status: 'skipped_no_provider' }).catch(() => {});
    if (env.devLogEmails && env.nodeEnv !== 'production') console.log(`\n[DEV EMAIL] to=${to} subject="${subject}"\n${text}\n`);
    return { sent: false, reason: 'no_provider' };
  }
  try {
    transport ||= nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.port === 465, auth: { user: env.smtp.user, pass: env.smtp.pass } });
    await transport.sendMail({ from: env.smtp.from, to, subject, text });
    await Notification.create({ user: user?._id || user, toEmail: to, template, subject, status: 'sent' });
    return { sent: true };
  } catch (e) {
    await Notification.create({ user: user?._id || user, toEmail: to, template, subject, status: 'failed', error: String(e.message).slice(0, 200) }).catch(() => {});
    console.error('email send failed:', template, e.message);
    return { sent: false, reason: 'send_failed' };
  }
}
