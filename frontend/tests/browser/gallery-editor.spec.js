import { test, expect } from '@playwright/test';
const tenant = 'a'.repeat(24);
const firstUrl = 'https://media.fixture.invalid/gallery-one.png';
const secondUrl = 'https://media.fixture.invalid/gallery-two.png';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
let unexpected;
const current = page => page.getByTestId('gallery-state').textContent().then(JSON.parse);
test.beforeEach(async ({ page }) => {
  unexpected = [];
  await page.addInitScript(tenant => { localStorage.setItem('zuno_token', 'fixture-session'); localStorage.setItem('zuno_biz', tenant); }, tenant);
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const reply = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (url.hostname === 'media.fixture.invalid') return route.fulfill({ contentType: 'image/png', body: png });
    if (url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/auth/me') return reply({ user: { _id: 'c'.repeat(24) }, businesses: [{ id: tenant }] });
    if (url.pathname === '/api/businesses/current') return reply({ business: { _id: tenant, name: 'Gallery fixture' }, permissions: ['business.update'] });
    unexpected.push({ method: request.method(), url: request.url() }); return route.abort();
  });
  await page.goto('/tests/browser/gallery-fixture.html');
  await expect(page.getByTestId('gallery-state')).toBeVisible();
});
test.afterEach(() => { expect(unexpected).toEqual([]); });
test('edits legacy image descriptions, reorders entries and removes only the selected reference', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Image description 1', exact: true }).fill('First gallery description');
  await expect.poll(async () => (await current(page)).settings.images[0].alt).toBe('First gallery description');
  await page.getByRole('button', { name: 'Move gallery image 1 later', exact: true }).click();
  await expect.poll(async () => (await current(page)).settings.images[1].url).toBe(firstUrl);
  await page.getByRole('textbox', { name: 'Image URL 2', exact: true }).fill('https://media.fixture.invalid/replacement.png');
  await expect.poll(async () => (await current(page)).settings.images[1].alt).toBe('First gallery description');
  await page.getByRole('button', { name: 'Remove gallery image 2', exact: true }).click();
  await expect.poll(async () => (await current(page)).settings.images.length).toBe(1);
  const result = await current(page);
  expect(result.settings.images).toEqual([{ url: secondUrl, alt: 'Second gallery description', caption: 'Retain this caption' }]);
  expect(result.settings.columns).toBe(3);
  await expect(page.getByRole('button', { name: 'Move gallery image 1 earlier', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Move gallery image 1 later', exact: true })).toBeDisabled();
});
test('editing single-image alt text preserves the source and unrelated settings', async ({ page }) => {
  await page.goto('/tests/browser/gallery-fixture.html?mode=image');
  await page.getByRole('textbox', { name: 'Image alt text', exact: true }).fill('Updated image description');
  await expect.poll(async () => (await current(page)).settings.alt).toBe('Updated image description');
  const result = await current(page);
  expect(result.src).toBe(firstUrl);
  expect(result.settings.caption).toBe('Retain the image caption');
});
