export function merchantOriginAllowed(origin, domain) {
  if (!domain || typeof origin !== 'string') return false;
  try {
    const url = new URL(origin);
    const suffix = `.${domain.toLowerCase()}`;
    const hostname = url.hostname.toLowerCase();
    const subdomain = hostname.endsWith(suffix) ? hostname.slice(0, -suffix.length) : '';
    return url.protocol === 'https:' && !url.port && !!subdomain && !subdomain.includes('.');
  } catch {
    return false;
  }
}