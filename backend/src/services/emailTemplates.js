const TITLES = Object.freeze({
  verify_email: 'Verify your email',
  password_reset: 'Reset your password',
  admin_reset: 'Reset your password',
  password_changed: 'Password changed',
  password_reset_done: 'Password reset complete',
  contact_changed_old: 'Email address changed',
  welcome: 'Welcome to Zuno',
  store_published: 'Your storefront is live',
  order_paid_merchant: 'New paid order',
  order_paid_customer: 'Order confirmation',
  booking_request_merchant: 'New booking request',
  booking_request_customer: 'Booking request received',
  booking_confirmed_customer: 'Booking confirmed',
  booking_rejected_customer: 'Booking request declined',
  booking_cancelled_customer: 'Booking cancelled',
  booking_rescheduled_customer: 'Booking rescheduled',
  booking_completed_customer: 'Booking completed',
  subscription_payment: 'Payment confirmation',
  payment_receipt: 'Payment receipt',
  subscription_reminder: 'Subscription renewal reminder',
  subscription_expired: 'Subscription expired',
});

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function renderEmailTemplate({ template, text, html }) {
  const plainText = String(text || '').trim();
  const content = html || `<p>${escapeHtml(plainText).replace(/\r?\n/g, '<br>')}</p>`;
  const title = TITLES[template] || 'Zuno notification';

  return {
    text: plainText,
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;background:#f4f6f5;color:#17211e;font-family:Arial,sans-serif">
    <main style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border-radius:12px">
      <header style="margin-bottom:24px;color:#0b6b4f;font-size:20px;font-weight:700">Zuno</header>
      <h1 style="font-size:22px;line-height:1.3">${escapeHtml(title)}</h1>
      <section style="font-size:16px;line-height:1.6">${content}</section>
    </main>
  </body>
</html>`,
  };
}
