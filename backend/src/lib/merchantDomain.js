
const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'store',
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

export function merchantOriginAllowed(origin, domain) {
  const configuredDomain = normalizeDomain(domain);

  if (!configuredDomain || typeof origin !== 'string') {
    return false;
  }

  try {
    const url = new URL(origin);

    // Accept only a clean HTTPS origin, without credentials or a port.
    if (
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password ||
      url.origin !== origin
    ) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    const suffix = `.${configuredDomain}`;

    if (!hostname.endsWith(suffix)) {
      return false;
    }

    const slug = hostname.slice(0, -suffix.length);

    // Exactly one valid, non-reserved merchant subdomain.
    return isValidMerchantSlug(slug);
  } catch {
    return false;
  }
}
