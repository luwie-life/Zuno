
const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'store',
  's',
  'login',
  'register',
  'pricing',
  'support',
  'zuno',
  'www',
  'recover',
  'mobile-app',
  'privacy',
  'terms',
]);

const normalizeDomain = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');

export function isValidMerchantSlug(value = '') {
  const slug = String(value).trim().toLowerCase();

  return (
    /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug) &&
    !RESERVED.has(slug)
  );
}

export function merchantSlugFromHost(
  hostname = window.location.hostname
) {
  const domain = normalizeDomain(
    import.meta.env.VITE_MERCHANT_DOMAIN || ''
  );

  const host = String(hostname).trim().toLowerCase();

  if (!domain) return null;

  const suffix = `.${domain}`;

  if (!host.endsWith(suffix)) return null;

  const slug = host.slice(0, -suffix.length);

  if (!isValidMerchantSlug(slug)) return null;

  return slug;
}

export function getMerchantStoreUrl(
  slug,
  domain = import.meta.env.VITE_MERCHANT_DOMAIN || 'zuno.com.ng'
) {
  const safeSlug = String(slug || '').trim().toLowerCase();
  const safeDomain = normalizeDomain(domain || '');

  if (!safeDomain || !isValidMerchantSlug(safeSlug)) {
    return '';
  }

  return `https://${safeDomain}/s/${safeSlug}`;
}
