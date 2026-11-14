const metaFields = [['name', 'description'], ['name', 'keywords'], ['name', 'robots'], ['property', 'og:title'], ['property', 'og:description'], ['property', 'og:image'], ['property', 'og:url'], ['property', 'og:type'], ['property', 'og:site_name'], ['name', 'twitter:card'], ['name', 'twitter:title'], ['name', 'twitter:description'], ['name', 'twitter:image']];
export const storefrontHeadSelectors = [...metaFields.map(([attribute, value]) => `meta[${attribute}="${value}"]`), 'link[rel="icon"]', 'link[rel="canonical"]'];
const text = (value, limit = 1000) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
function imageUrl(value, origin) {
  const source = text(value, 3000);
  if (!source || (!source.startsWith('https://') && (!source.startsWith('/') || source.startsWith('//')))) return '';
  try { const url = new URL(source, origin); return !url.username && !url.password && ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function buildStorefrontMetadata(business = {}, pathname = '/', storeBase = '', origin = '') {
  const storefront = business.storefront || {}, seo = storefront.seo || {}, identity = storefront.identity || {};
  const path = String(pathname).split(/[?#]/)[0];
  const relative = storeBase && (path === storeBase || path.startsWith(storeBase + '/')) ? path.slice(storeBase.length) : path;
  const route = relative.replace(/^\/+|\/+$/g, '');
  const reserved = ['services', 'portfolio', 'p', 'checkout', 'order'];
  const custom = !!route && !reserved.includes(route.split('/')[0]);
  const page = (storefront.pages || []).find(item => !item.isHome && item.slug === route && item.visible !== false);
  const siteName = text(identity.displayName, 120) || text(business.name, 120) || 'Online store';
  const baseTitle = text(seo.title, 200) || `${siteName} | Online store`;
  let canonical = '';
  try { const url = new URL(path, origin); url.search = ''; url.hash = ''; canonical = url.href; } catch { /* no valid page origin */ }
  return { title: custom && page ? `${text(page.title, 120)} | ${baseTitle}` : baseTitle, description: text(seo.description, 1000) || text(identity.description, 1000) || text(business.description, 1000), keywords: Array.isArray(seo.keywords) ? seo.keywords.map(value => text(value, 50)).filter(Boolean).slice(0, 20).join(', ') : '', siteName, image: imageUrl(seo.ogImage, origin), favicon: imageUrl(identity.favicon, origin), canonical, noIndex: !!seo.noIndex || ['checkout', 'order'].includes(route.split('/')[0]) || (custom && !page) };
}
export function captureStorefrontHead(doc) {
  const title = doc.title;
  const originals = storefrontHeadSelectors.flatMap(selector => [...doc.head.querySelectorAll(selector)]).map(node => node.cloneNode(true));
  return () => {
    storefrontHeadSelectors.forEach(selector => doc.head.querySelectorAll(selector).forEach(node => node.remove()));
    originals.forEach(node => doc.head.appendChild(node.cloneNode(true)));
    doc.title = title;
  };
}
export function applyStorefrontMetadata(doc, metadata) {
  doc.title = metadata.title;
  const values = { description: metadata.description, keywords: metadata.keywords, robots: metadata.noIndex ? 'noindex, nofollow' : 'index, follow', 'og:title': metadata.title, 'og:description': metadata.description, 'og:image': metadata.image, 'og:url': metadata.canonical, 'og:type': 'website', 'og:site_name': metadata.siteName, 'twitter:card': metadata.image ? 'summary_large_image' : 'summary', 'twitter:title': metadata.title, 'twitter:description': metadata.description, 'twitter:image': metadata.image };
  for (const [attribute, key] of metaFields) {
    const selector = `meta[${attribute}="${key}"]`;
    doc.head.querySelectorAll(selector).forEach(node => node.remove());
    if (!values[key]) continue;
    const node = doc.createElement('meta'); node.setAttribute(attribute, key); node.setAttribute('content', values[key]); doc.head.appendChild(node);
  }
  for (const [rel, href] of [['canonical', metadata.canonical], ['icon', metadata.favicon]]) {
    if (!href) continue;
    doc.head.querySelectorAll(`link[rel="${rel}"]`).forEach(node => node.remove());
    const node = doc.createElement('link'); node.setAttribute('rel', rel); node.setAttribute('href', href); doc.head.appendChild(node);
  }
}
