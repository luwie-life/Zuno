export const STORE_EDITOR_NAVIGATION = Object.freeze({
  to: '/app/storefront', label: 'Store Editor', perm: 'business.update',
});

export function visibleMerchantNavigation(entries, { modules = [], can = () => false } = {}) {
  return entries.filter((n) => (!n.module || modules.includes(n.module)) && (!n.perm || can(n.perm) || n.cashier || (n.alsoRead && can('products.read'))));
}
