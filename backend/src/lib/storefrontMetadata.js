const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const image = value => {
  const url = text(value, 3000);
  if (/^\/(?!\/)/.test(url)) return url;
  try { return ['http:', 'https:'].includes(new URL(url).protocol) ? url : ''; } catch { return ''; }
};
const platforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin', 'pinterest', 'threads'];
export function normalizeStorefrontMetadata(input = {}) {
  const source = object(input), identity = object(source.identity), contact = object(source.contact), seo = object(source.seo);
  const templateId = text(source.templateId, 80);
  const links = Array.isArray(source.socialLinks) ? source.socialLinks : Object.entries(object(source.socialLinks)).map(([platform, url]) => ({ platform, url }));
  const socialLinks = [], seen = new Set();
  for (const entry of links.slice(0, 100)) {
    const item = object(entry), platform = text(item.platform, 30).toLowerCase();
    if (!platforms.includes(platform) || seen.has(platform)) continue;
    const candidate = text(item.url, 2000);
    let url;
    try { const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`); if (!['http:', 'https:'].includes(parsed.protocol)) continue; url = parsed.href; } catch { continue; }
    if (!candidate) continue;
    seen.add(platform);
    socialLinks.push({ id: text(item.id, 100) || `social-${platform}`, platform, url, visible: item.visible !== false });
  }
  return {
    templateId: /^[a-z0-9][a-z0-9-]{0,79}$/.test(templateId) ? templateId : '',
    identity: { displayName: text(identity.displayName, 120), tagline: text(identity.tagline, 180), description: text(identity.description, 1000), logo: image(identity.logo), favicon: image(identity.favicon), announcement: text(identity.announcement, 300) },
    contact: { email: text(contact.email, 180), phone: text(contact.phone, 50), whatsapp: text(contact.whatsapp, 50), address: text(contact.address, 300), city: text(contact.city, 100), country: text(contact.country, 100) },
    seo: { title: text(seo.title, 70), description: text(seo.description, 180), keywords: Array.isArray(seo.keywords) ? seo.keywords.slice(0, 20).map(value => text(value, 50)).filter(Boolean) : [], ogImage: image(seo.ogImage), noIndex: seo.noIndex === true },
    socialLinks,
  };
}
