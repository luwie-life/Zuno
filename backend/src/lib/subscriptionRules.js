// Pure subscription rules so they can be unit tested without a database.
export const DAY = 86400000;

/**
 * Setup fee and monthly fee are independent obligations.
 * A subscription is only "active" when the setup fee is settled (or the plan has none)
 * AND the paid monthly period has not ended. After the period ends there is a grace window.
 */
export function computeSubscriptionState(sub, plan, now = new Date(), graceDays = 7) {
  if (sub.suspended) return 'suspended';
  if (sub.status === 'cancelled' && (!sub.currentPeriodEnd || sub.currentPeriodEnd <= now)) return 'cancelled';
  const setupOk = !plan || plan.setupFee === 0 || sub.setupStatus === 'paid' || sub.setupStatus === 'waived';
  if (!setupOk) return 'pending_setup';
  if (!sub.currentPeriodEnd) return 'pending_payment';
  if (sub.currentPeriodEnd > now) return 'active';
  const graceEnd = new Date(sub.currentPeriodEnd.getTime() + graceDays * DAY);
  if (now < graceEnd) return 'grace';
  return 'expired';
}

export const hasAccess = (state) => state === 'active' || state === 'grace';

export function nextPeriodEnd(currentEnd, now = new Date()) {
  const base = currentEnd && currentEnd > now ? new Date(currentEnd) : new Date(now);
  const d = new Date(base);
  d.setMonth(d.getMonth() + 1);
  return d;
}

export function featureAllowed(plan, feature, override, now = new Date()) {
  if (override?.until && override.until > now && override.features?.includes(feature)) return true;
  return !!plan?.features?.includes(feature);
}

export function limitReached(plan, limitKey, current) {
  const max = plan?.limits?.[limitKey];
  if (max === undefined || max === null || max < 0) return false; // -1 / unset = unlimited
  return current >= max;
}
