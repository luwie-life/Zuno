// Server-side permission maps. The UI may hide things, but these are what is enforced.
export const MERCHANT_PERMISSIONS = {
  owner: ['*'],
  manager: [
    'business.update', 'products.read', 'products.write', 'orders.read', 'orders.write', 'orders.refund',
    'pos.sell', 'pos.discount', 'pos.refund', 'inventory.read', 'inventory.adjust', 'customers.read',
    'customers.write', 'suppliers.read', 'suppliers.write', 'purchases.write', 'reports.read', 'support.write',
    'apps.read',
  ],
  cashier: ['products.read', 'pos.sell', 'customers.read', 'customers.write', 'inventory.read', 'support.write'],
};

export const PLATFORM_PERMISSIONS = {
  owner: ['*'],
  support: [
    'overview.read', 'merchants.read', 'businesses.read', 'recovery.read', 'recovery.review', 'recovery.reset',
    'support.manage', 'audit.read', 'apps.review',
  ],
  billing: [
    'overview.read', 'merchants.read', 'businesses.read', 'subscriptions.read', 'subscriptions.write', 'payments.read',
    'plans.write', 'apps.review', 'apps.quote', 'audit.read',
  ],
};

export function hasPermission(map, role, perm) {
  const p = map[role];
  if (!p) return false;
  return p.includes('*') || p.includes(perm);
}
export const merchantCan = (role, perm) => hasPermission(MERCHANT_PERMISSIONS, role, perm);
export const platformCan = (role, perm) => hasPermission(PLATFORM_PERMISSIONS, role, perm);
