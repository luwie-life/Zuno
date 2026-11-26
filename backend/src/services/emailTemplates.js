
import { env } from '../config/env.js';

const TITLES = Object.freeze({
  verify_email: 'Verify your email address',
  password_reset: 'Reset your password',
  admin_reset: 'Reset your password',
  password_changed: 'Your password was changed',
  password_reset_done: 'Password reset complete',
  contact_changed_old: 'Your email address was changed',
  welcome: 'Welcome to Zuno',
  store_published: 'Your storefront is live',
  order_paid_merchant: 'You have a new paid order',
  order_paid_customer: 'Your order is confirmed',
  booking_request_merchant: 'You have a new booking request',
  booking_request_customer: 'Your booking request is received',
  booking_confirmed_customer: 'Your booking is confirmed',
  booking_rejected_customer: 'Booking request update',
  booking_cancelled_customer: 'Booking cancelled',
  booking_rescheduled_customer: 'Booking rescheduled',
  booking_completed_customer: 'Booking completed',
  subscription_payment: 'Payment successfully confirmed',
  payment_receipt: 'Your payment receipt',
  subscription_reminder: 'Your subscription renewal is approaching',
  subscription_expired: 'Your subscription has expired',
});

const ACTIONS = Object.freeze({
  verify_email: {
    label: 'Verify email address',
    fallback: 'Complete your email verification using the button below.',
  },
  password_reset: {
    label: 'Reset my password',
    fallback: 'Use the button below to securely reset your password.',
  },
  admin_reset: {
    label: 'Reset my password',
    fallback: 'Use the button below to securely reset your password.',
  },
  welcome: {
    label: 'Open my workspace',
  },
  subscription_payment: {
    label: 'View my subscription',
    path: '/app/billing',
  },
  payment_receipt: {
    label: 'View billing',
    path: '/app/billing',
  },
  store_published: {
    label: 'Open my workspace',
    path: '/app',
  },
});

const COLORS = {
  forest: '#0B3D2E',
  dark: '#0B2118',
  green: '#1C6F52',
  mango: '#E9A23B',
  paper: '#F6F7F5',
  ink: '#12201A',
  muted: '#68756D',
  line: '#DCE2DD',
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const baseUrl = String(env.frontendUrl || 'https://www.zuno.com.ng')
  .replace(/\/+$/, '');

function getActionUrl(template, discoveredUrl) {
  if (discoveredUrl) return discoveredUrl;

  const action = ACTIONS[template];

  if (action?.path) return `${baseUrl}${action.path}`;

  return `${baseUrl}/app`;
}

function renderMessage(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const urlPattern = /https?:\/\/[^\s<>"']+/i;
  let actionUrl = null;

  const paragraphs = lines
    .map((line) => {
      const match = line.match(urlPattern);

      if (match && !actionUrl) {
        actionUrl = match[0].replace(/[.,)]$/, '');
        return null;
      }

      if (match) {
        return `<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:${COLORS.muted};">${escapeHtml(line)}</p>`;
      }

      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:${COLORS.ink};">${escapeHtml(line)}</p>`;
    })
    .filter(Boolean)
    .join('');

  return { paragraphs, actionUrl };
}

function button(label, url) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 20px;">
      <tr>
        <td align="center" bgcolor="${COLORS.forest}" style="border-radius:8px;">
          <a
            href="${escapeHtml(url)}"
            target="_blank"
            style="display:inline-block;padding:15px 25px;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;border-radius:8px;"
          >${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailTemplate({ template, text, html }) {
  const plainText = String(text || '').trim();
  const title = TITLES[template] || 'A notification from Zuno';
  const action = ACTIONS[template];
  const rendered = renderMessage(plainText);

  const actionUrl = getActionUrl(template, rendered.actionUrl);
  const actionButton = action
    ? button(action.label, actionUrl)
    : '';

  const customContent = html
    ? `<div style="font-size:15px;line-height:1.8;color:${COLORS.ink};">${html}</div>`
    : rendered.paragraphs;

  const fallbackLink = action
    ? `
      <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:${COLORS.muted};">
        If the button doesn't work, copy this link into your browser:
      </p>
      <p style="margin:7px 0 0;word-break:break-all;font-size:12px;line-height:1.7;">
        <a href="${escapeHtml(actionUrl)}" style="color:${COLORS.green};">${escapeHtml(actionUrl)}</a>
      </p>
    `
    : '';

  const preheader = escapeHtml(
    plainText.split(/\r?\n/).find((line) => line.trim()) || title,
  );

  const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;padding:0;background:${COLORS.paper};font-family:Arial,Helvetica,sans-serif;color:${COLORS.ink};">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${COLORS.paper};">
    <tr>
      <td align="center" style="padding:38px 16px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">

          <tr>
            <td style="padding:0 0 20px;">
              <span style="font-size:25px;font-weight:800;letter-spacing:-1.2px;color:${COLORS.forest};">Zuno</span>
              <span style="display:block;margin-top:5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};">
                Business, moving forward.
              </span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border:1px solid ${COLORS.line};border-radius:14px;overflow:hidden;">

              <div style="height:5px;background:${COLORS.mango};font-size:0;line-height:0;">&nbsp;</div>

              <div style="padding:38px 34px 34px;">

                <p style="margin:0 0 13px;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${COLORS.green};">
                  ZUNO ACCOUNT UPDATE
                </p>

                <h1 style="margin:0 0 24px;font-size:27px;line-height:1.25;letter-spacing:-0.8px;color:${COLORS.dark};font-weight:750;">
                  ${escapeHtml(title)}
                </h1>

                ${customContent}

                ${actionButton}

                ${fallbackLink}

              </div>

            </td>
          </tr>

          <tr>
            <td style="padding:25px 5px 0;">

              <p style="margin:0 0 9px;font-size:12px;line-height:1.7;color:${COLORS.muted};">
                This email was sent by Zuno because of activity on your account.
              </p>

              <p style="margin:0 0 9px;font-size:12px;line-height:1.7;color:${COLORS.muted};">
                If you did not initiate this activity, please contact our support team.
              </p>

              <p style="margin:18px 0 0;font-size:12px;font-weight:700;color:${COLORS.forest};">
                Zuno · Business, moving forward.
              </p>

              <p style="margin:7px 0 0;font-size:11px;color:${COLORS.muted};">
                © ${new Date().getFullYear()} Zuno. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  return {
    text: plainText,
    html: emailHtml,
  };
}
