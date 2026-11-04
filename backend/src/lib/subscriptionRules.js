
const DAY = 24 * 60 * 60 * 1000;

export function computeSubscriptionState(
  sub,
  plan,
  now = new Date(),
  graceDays = 7,
) {
  if (!sub) return 'none';

  if (sub.suspended) return 'suspended';

  if (
    sub.status === 'cancelled' &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd <= now)
  ) {
    return 'cancelled';
  }

  const setupOk =
    !plan ||
    Number(plan.setupFee || 0) === 0 ||
    sub.setupStatus === 'paid' ||
    sub.setupStatus === 'waived';

  if (!setupOk) return 'pending_setup';

  // Free plans remain active without a billing period or Paystack payment.
  if (plan && Number(plan.monthlyFee) === 0) {
    return 'active';
  }

  if (!sub.currentPeriodEnd) return 'pending_payment';

  if (sub.currentPeriodEnd > now) return 'active';

  const graceEnd = new Date(
    sub.currentPeriodEnd.getTime() + graceDays * DAY,
  );

  if (now < graceEnd) return 'grace';

  return 'expired';
}

export function hasAccess(state) {
  return ['active', 'grace'].includes(state);
}

export function nextPeriodEnd(currentPeriodEnd, now = new Date()) {
  const base =
    currentPeriodEnd && currentPeriodEnd > now
      ? currentPeriodEnd
      : now;

  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);

  return next;
}

export function featureAllowed(plan, feature, override) {
  if (override?.features?.includes(feature)) return true;

  if (!plan || !Array.isArray(plan.features)) return false;

  return plan.features.includes(feature);
}
