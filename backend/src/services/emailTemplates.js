
import { env } from '../config/env.js';

const BRAND = {
  forest: '#0B3D2E',
  green: '#1C6F52',
  mango: '#E9A23B',
  lime: '#D7F36A',
  dark: '#0B2118',
  ink: '#12201A',
  muted: '#68756D',
  paper: '#F6F7F5',
  white: '#FFFFFF',
  line: '#DCE2DD',
};

const TITLES = {
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
};

const ACTIONS = {
  verify_email: {
    label: 'Verify my email',
    path: null,
  },
  password_reset: {
    label: 'Reset my password',
    path: null,
  },
  admin_reset: {
    label: 'Reset my password',
    path: null,
  },
  welcome: {
    label: 'Open my workspace',
    path: '/app',
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
    label: 'View my storefront',
    path: '/app/storefront',
  },
};

const baseUrl = String(
  env.frontendUrl || 'https://www.zuno.com.ng',
).replace(/\/+$/, '');

// Public favicon URL. The original Zuno icon is preserved.
const BRAND_ICON_URL = `${baseUrl}/favicon.svg`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function getActionUrl(template, discoveredUrl) {
  if (discoveredUrl) return discoveredUrl;

  const action = ACTIONS[template];

  if (action?.path) {
    return `${baseUrl}${action.path}`;
  }

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
        return '';
      }

      return `
        <p style="
          margin:0 0 15px;
          color:${BRAND.ink};
          font-size:15px;
          line-height:1.85;
          font-family:Arial,Helvetica,sans-serif;
        ">${escapeHtml(line)}</p>
      `;
    })
    .filter(Boolean)
    .join('');

  return { paragraphs, actionUrl };
}

function renderButton(label, url) {
  return `
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="margin:28px 0 22px;"
    >
      <tr>
        <td
          align="center"
          bgcolor="${BRAND.mango}"
          style="border-radius:9px;"
        >
          <a
            href="${escapeHtml(url)}"
            target="_blank"
            style="
              display:inline-block;
              padding:16px 28px;
              color:${BRAND.dark};
              font-family:Arial,Helvetica,sans-serif;
              font-size:14px;
              font-weight:700;
              line-height:1;
              text-decoration:none;
              border-radius:9px;
            "
          >${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

function renderFallbackLink(url) {
  return `
    <div style="
      margin-top:25px;
      padding-top:20px;
      border-top:1px solid ${BRAND.line};
    ">
      <p style="
        margin:0 0 8px;
        color:${BRAND.muted};
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:1.7;
      ">
        Having trouble with the button? Copy and paste this link into your browser:
      </p>

      <a
        href="${escapeHtml(url)}"
        style="
          color:${BRAND.green};
          font-size:12px;
          line-height:1.7;
          word-break:break-all;
        "
      >${escapeHtml(url)}</a>
    </div>
  `;
}

export function renderEmailTemplate({
  template,
  text,
  html,
}) {
  const plainText = String(text || '').trim();

  const title =
    TITLES[template] || 'A notification from Zuno';

  const action = ACTIONS[template];

  const rendered = renderMessage(plainText);

  const actionUrl = getActionUrl(
    template,
    rendered.actionUrl,
  );

  const content = html
    ? `<div style="
        color:${BRAND.ink};
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:1.85;
      ">${html}</div>`
    : rendered.paragraphs;

  const actionButton = action
    ? renderButton(action.label, actionUrl)
    : '';

  const fallbackLink =
    action && rendered.actionUrl
      ? renderFallbackLink(actionUrl)
      : '';

  const preheader = escapeHtml(
    plainText.split(/\r?\n/).find(Boolean) || title,
  );

  const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:${BRAND.paper};
  font-family:Arial,Helvetica,sans-serif;
  color:${BRAND.ink};
">

  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
  ">${preheader}</div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    bgcolor="${BRAND.paper}"
    style="background-color:${BRAND.paper};"
  >
    <tr>
      <td align="center" style="padding:38px 16px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:620px;"
        >

          <!-- BRAND HEADER -->
          <tr>
            <td
              bgcolor="${BRAND.dark}"
              style="
                padding:27px 30px;
                background-color:${BRAND.dark};
                border-radius:14px 14px 0 0;
              "
            >
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td valign="middle" style="padding-right:12px;">
                    <img
                      src="${BRAND_ICON_URL}"
                      width="43"
                      height="43"
                      alt="Zuno"
                      style="
                        display:block;
                        width:43px;
                        height:43px;
                        border:0;
                        border-radius:50%;
                      "
                    >
                  </td>

                  <td valign="middle">
                    <span style="
                      display:block;
                      color:${BRAND.white};
                      font-size:27px;
                      font-weight:800;
                      letter-spacing:-1px;
                      line-height:1.1;
                    ">Zuno</span>

                    <span style="
                      display:block;
                      margin-top:5px;
                      color:${BRAND.lime};
                      font-size:10px;
                      font-weight:700;
                      letter-spacing:1.8px;
                      text-transform:uppercase;
                    ">BUSINESS, MOVING FORWARD.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MANGO BRAND ACCENT -->
          <tr>
            <td
              bgcolor="${BRAND.mango}"
              height="5"
              style="
                height:5px;
                background-color:${BRAND.mango};
                font-size:0;
                line-height:0;
              "
            >&nbsp;</td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td
              bgcolor="${BRAND.white}"
              style="
                padding:42px 38px 38px;
                background-color:${BRAND.white};
                border-left:1px solid ${BRAND.line};
                border-right:1px solid ${BRAND.line};
              "
            >

              <p style="
                margin:0 0 13px;
                color:${BRAND.green};
                font-size:10px;
                font-weight:700;
                letter-spacing:2px;
                text-transform:uppercase;
              ">
                YOUR ZUNO UPDATE
              </p>

              <h1 style="
                margin:0 0 24px;
                color:${BRAND.dark};
                font-family:Arial,Helvetica,sans-serif;
                font-size:29px;
                font-weight:750;
                letter-spacing:-1px;
                line-height:1.25;
              ">
                ${escapeHtml(title)}
              </h1>

              ${content}

              ${actionButton}

              ${fallbackLink}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              bgcolor="${BRAND.paper}"
              style="
                padding:26px 30px 30px;
                background-color:${BRAND.paper};
                border:1px solid ${BRAND.line};
                border-top:0;
                border-radius:0 0 14px 14px;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td
                    height="3"
                    bgcolor="${BRAND.mango}"
                    style="
                      height:3px;
                      background-color:${BRAND.mango};
                      font-size:0;
                      line-height:0;
                    "
                  >&nbsp;</td>
                </tr>
              </table>

              <p style="
                margin:19px 0 8px;
                color:${BRAND.forest};
                font-size:14px;
                font-weight:700;
              ">
                Business, moving forward.
              </p>

              <p style="
                margin:0 0 12px;
                color:${BRAND.muted};
                font-size:12px;
                line-height:1.8;
              ">
                This email was sent because of activity on your Zuno account.
                If you did not initiate this activity, please contact our support team.
              </p>

              <p style="
                margin:0;
                color:${BRAND.muted};
                font-size:11px;
                line-height:1.7;
              ">
                <a
                  href="${baseUrl}"
                  style="color:${BRAND.green};text-decoration:none;font-weight:700;"
                >www.zuno.com.ng</a>
                &nbsp;·&nbsp;
                © ${new Date().getFullYear()} Zuno.
                All rights reserved.
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
