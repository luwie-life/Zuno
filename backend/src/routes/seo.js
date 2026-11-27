import { Router } from 'express';
import { Business } from '../models/index.js';
import { env } from '../config/env.js';

const r = Router();
const siteUrl = String(env.frontendUrl || 'https://www.zuno.com.ng').replace(/\/+$/, '');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(value) {
  if (!value) return '';
  try {
    return new URL(value, siteUrl).href;
  } catch {
    return '';
  }
}

function storefrontDescription(business) {
  const raw = String(business.description || '').trim();

  if (raw) return raw.slice(0, 160);

  const category = String(business.category || 'business').trim();

  return `Explore ${business.name}, view its ${category.toLowerCase()} offerings and connect directly with the business.`.slice(0, 160);
}

function renderStorefrontPage(business) {
  const title = `${business.name} | ${business.category || 'Storefront'}`.slice(0, 70);
  const description = storefrontDescription(business);
  const canonical = `${siteUrl}/s/${encodeURIComponent(business.slug)}`;
  const image = absoluteUrl(business.logoUrl || business.images?.[0] || '');

  const type = business.businessType === 'restaurant'
    ? 'Restaurant'
    : business.businessType === 'service'
      ? 'ProfessionalService'
      : 'Store';

  const imageTags = image
    ? `<meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:image" content="${escapeHtml(image)}">`
    : '';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: business.name,
    description,
    url: canonical,
    ...(image ? { image } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    ...(business.address?.city || business.address?.state ? {
      address: {
        '@type': 'PostalAddress',
        ...(business.address.line ? { streetAddress: business.address.line } : {}),
        ...(business.address.city ? { addressLocality: business.address.city } : {}),
        ...(business.address.state ? { addressRegion: business.address.state } : {}),
        ...(business.address.country ? { addressCountry: business.address.country } : {}),
      },
    } : {}),
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Zuno">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${imageTags}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
</head>
<body>
<main>
<h1>${escapeHtml(business.name)}</h1>
<p>${escapeHtml(description)}</p>
<p>Explore this business on Zuno.</p>
<a href="${escapeHtml(canonical)}">Visit ${escapeHtml(business.name)}</a>
</main>
</body>
</html>`;
}

r.get('/store/:slug', async (req, res, next) => {
  try {
    const business = await Business.findOne({
      slug: String(req.params.slug || '').toLowerCase(),
      storePublished: true,
      status: 'active',
    })
      .select('name slug category description businessType logoUrl images phone email address')
      .lean();

    if (!business) {
      return res.status(404).type('html').send(
        '<!doctype html><html><head><title>Store not found | Zuno</title><meta name="robots" content="noindex,nofollow"></head><body><h1>Store not found</h1></body></html>',
      );
    }

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.type('html').send(renderStorefrontPage(business));
  } catch (error) {
    next(error);
  }
});

r.get('/sitemap.xml', async (req, res, next) => {
  try {
    const businesses = await Business.find({
      storePublished: true,
      status: 'active',
    })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const staticPaths = [
  '',
  '/pricing',
  '/mobile-app',
  '/support',
  '/privacy',
  '/terms',
];

    const urls = staticPaths.map((path) => ({
      loc: `${siteUrl}${path}`,
      changefreq: path ? 'monthly' : 'weekly',
      priority: path ? '0.7' : '1.0',
    }));

    for (const business of businesses) {
      urls.push({
        loc: `${siteUrl}/s/${encodeURIComponent(business.slug)}`,
        lastmod: business.updatedAt
          ? new Date(business.updatedAt).toISOString().slice(0, 10)
          : '',
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${escapeHtml(item.loc)}</loc>
    ${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ''}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

export default r;