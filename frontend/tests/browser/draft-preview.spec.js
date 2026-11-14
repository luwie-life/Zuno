import { test, expect } from '@playwright/test';
const tenant = 'a'.repeat(24);
let requests;
test.beforeEach(async ({ page }) => {
  requests = [];
  await page.addInitScript(tenant => { localStorage.setItem('zuno_token', 'fixture-session'); localStorage.setItem('zuno_biz', tenant); }, tenant);
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const reply = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/auth/me') return reply({ user: { _id: 'c'.repeat(24) }, businesses: [{ id: tenant }] });
    if (url.pathname === '/api/businesses/current') return reply({ business: { _id: tenant, name: 'Fixture business', slug: 'fixture', businessType: 'product' }, permissions: ['business.update'] });
    requests.push({ method: request.method(), url: request.url() });
    return route.abort();
  });
  await page.goto('/tests/browser/fixture.html?mode=preview');
  await expect(page.getByRole('button', { name: 'Preview draft', exact: true })).toBeVisible();
});
test.afterEach(() => { expect(requests).toEqual([]); });
test('previews unsaved selected-page content without changing visibility or enabling actions', async ({ page }) => {
  await page.getByLabel('Draft heading', { exact: true }).fill('Unsaved selected-page heading');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Draft preview', exact: true });
  await expect(dialog).toBeVisible();
  const frame = page.frameLocator('iframe[title="Draft storefront preview"]');
  await expect(frame.getByRole('heading', { name: 'Unsaved selected-page heading', exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'Home draft heading', exact: true })).toHaveCount(0);
  await expect(frame.locator('[data-editor-element-wrapper]')).toHaveCount(0);
  await frame.getByRole('link', { name: 'Disabled preview action', exact: true }).click();
  await expect(page).toHaveURL(/fixture.html\?mode=preview$/);
  expect(page.context().pages()).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('draft-page-visibility')).toHaveText('false');
  await expect(page.getByLabel('Draft heading', { exact: true })).toHaveValue('Unsaved selected-page heading');
});
test('uses a real iframe viewport for mobile width and closes without saving', async ({ page }) => {
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await page.getByLabel('Draft preview width', { exact: true }).selectOption('mobile');
  const iframe = page.locator('iframe[title="Draft storefront preview"]');
  await expect.poll(() => iframe.evaluate(element => element.contentWindow.innerWidth)).toBe(390);
  await page.getByRole('button', { name: 'Close draft preview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Draft preview', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('draft-page-visibility')).toHaveText('false');
});
