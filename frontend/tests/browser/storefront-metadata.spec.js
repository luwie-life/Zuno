import { test, expect } from '@playwright/test';
const favicon = 'https://media.fixture.invalid/favicon.png';
const share = 'https://media.fixture.invalid/sharing.png';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
let unexpected;
async function navigate(page, path) {
  await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
}
test.beforeEach(async ({ page }) => {
  unexpected = [];
  await page.addInitScript(() => localStorage.clear());
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const reply = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (url.origin === 'https://fonts.googleapis.com' && url.pathname === '/css2' && request.method() === 'GET' && request.resourceType() === 'stylesheet') return route.fulfill({ contentType: 'text/css', body: '/* Offline font fixture. */' });
    if (url.hostname === 'media.fixture.invalid') return route.fulfill({ contentType: 'image/png', body: png });
    if (url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')) return route.continue();
    const match = url.pathname.match(/^\/api\/store\/(fixture|other)$/);
    if (request.method() === 'GET' && match) {
      const other = match[1] === 'other';
      return reply({ business: { name: other ? 'Other Store' : 'Fixture Store', slug: match[1], businessType: 'product', acceptingOrders: true, acceptingServices: false, brandColor: '#0B3D2E', storefront: { identity: { displayName: other ? 'Other Store' : 'Fixture Store', favicon: other ? '' : favicon }, seo: other ? {} : { title: 'Custom storefront title', description: 'Saved search description', ogImage: share, noIndex: true }, pages: [{ id: 'home', slug: 'home', title: 'Home', isHome: true, visible: true, sections: [{ id: 'text', type: 'rich_text', visible: true, settings: { title: 'Metadata fixture content' }, elements: [] }] }] } }, categories: [] });
    }
    if (request.method() === 'GET' && /^\/api\/store\/(fixture|other)\/products$/.test(url.pathname)) return reply({ items: [], total: 0, page: 1, limit: 24 });
    unexpected.push({ method: request.method(), url: request.url() }); return route.abort();
  });
});
test.afterEach(() => { expect(unexpected).toEqual([]); });
test('saved browser metadata is applied without query parameters in canonical URLs', async ({ page }) => {
  await page.goto('/store/fixture?campaign=fixture');
  await expect(page).toHaveTitle('Custom storefront title');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Saved search description');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', share);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', favicon);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL('/store/fixture', page.url()).href);
});
test('switching storefronts and leaving public routes clears prior merchant metadata', async ({ page }) => {
  await page.goto('/store/fixture');
  await expect(page).toHaveTitle('Custom storefront title');
  await navigate(page, '/store/other');
  await expect(page.getByRole('link', { name: 'Other Store', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Other Store | Online store');
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator(`link[rel="icon"][href="${favicon}"]`)).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await navigate(page, '/store/other/order');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await navigate(page, '/login');
  await expect(page).not.toHaveTitle(/Custom storefront title|Other Store/);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
});
