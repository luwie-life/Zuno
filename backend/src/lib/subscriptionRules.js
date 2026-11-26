
export const DAY = 24 * 60 * 60 * 1000;

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

  // Free plans do not require a billing period.
  if (plan && Number(plan.monthlyFee) === 0) {
    return 'active';
  }

  // A scheduled cancellation ends access at the paid-through date.
  // The grace period applies only to subscriptions intended to renew.
  if (
    sub.cancelAtPeriodEnd &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd <= now)
  ) {
    return 'cancelled';
  }

  if (!sub.currentPeriodEnd) return 'pending_payment';

  if (sub.currentPeriodEnd > now) return 'active';

  if (sub.cancelAtPeriodEnd) return 'cancelled';

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
  const originalDay = next.getUTCDate();

  // Move to the first day before advancing the month to prevent overflow.
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);

  // Clamp to the final valid day of the destination month.
  const lastDay = new Date(
    Date.UTC(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  next.setUTCDate(Math.min(originalDay, lastDay));

  return next;
}


  export function featureAllowed(
  plan,
  feature,
  override,
  now = new Date(),
) {
  if (override?.features?.includes(feature)) {
    const expiresAt = override.until
      ? new Date(override.until)
      : null;

    if (
      !expiresAt ||
      (
        !Number.isNaN(expiresAt.getTime()) &&
        expiresAt > now
      )
    ) {
      return true;
    }
  }

  if (!plan || !Array.isArray(plan.features)) {
    return false;
  }

  return plan.features.includes(feature);
}

/**
 * Returns true when the current resource count has reached
 * the configured plan limit.
 *
 * -1 means unlimited.
 * Missing limits are treated as unlimited for backward compatibility.
 */
export function limitReached(plan, key, current = 0) {
  if (!plan || !plan.limits) return false;

  const limit = Number(plan.limits[key]);

  if (!Number.isFinite(limit) || limit < 0) {
    return false;
  }

  return Number(current) >= limit;
}
