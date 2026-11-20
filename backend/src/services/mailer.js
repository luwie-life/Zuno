import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Notification } from '../models/index.js';
import { renderEmailTemplate } from './emailTemplates.js';

let transport;
const configured = () => !!(env.smtp.host && env.smtp.user && env.smtp.pass);

async function recordNotification(data) {
  try {
    await Notification.create(data);
  } catch (error) {
    console.error('email delivery status could not be recorded:', error.message);
  }
}

export async function sendMail({ user, to, template, subject, text, html }) {
  if (!to) {
    console.warn('email not sent: no recipient for', template);
    return { sent: false, reason: 'no_recipient' };
  }
  const rendered = renderEmailTemplate({ template, text, html });
  const notification = { user: user?._id || user, toEmail: to, template, subject };
  if (!configured()) {
    await recordNotification({ ...notification, status: 'skipped_no_provider' });
    if (env.devLogEmails && env.nodeEnv !== 'production') console.log(`\n[DEV EMAIL] to=${to} subject="${subject}"\n${text}\n`);
    return { sent: false, reason: 'no_provider' };
  }
  try {
    transport ||= nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.port === 465, auth: { user: env.smtp.user, pass: env.smtp.pass } });
    await transport.sendMail({ from: env.smtp.from, to, subject, ...rendered });
    await recordNotification({ ...notification, status: 'sent' });
    return { sent: true };
  } catch (e) {
    await recordNotification({ ...notification, status: 'failed', error: String(e.message).slice(0, 200) });
    console.error('email send failed:', template, e.message);
    return { sent: false, reason: 'send_failed' };
  }
}
