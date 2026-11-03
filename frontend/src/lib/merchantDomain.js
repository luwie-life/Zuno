const RESERVED = new Set(['admin', 'api', 'app', 'store', 'login', 'register', 'pricing', 'support', 'zuno', 'www', 'recover', 'mobile-app', 'privacy', 'terms']);

export function merchantSlugFromHost(hostname = window.location.hostname) {
  const domain = (import.meta.env.VITE_MERCHANT_DOMAIN || '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  const host = hostname.toLowerCase();
  if (!domain) return null;
  const suffix = `.${domain}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug) || RESERVED.has(slug)) return null;
  return slug;
}