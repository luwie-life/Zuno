import { test, expect } from '@playwright/test';
const businessA = 'a'.repeat(24);
const businessB = 'b'.repeat(24);
const original = 'https://media.fixture.invalid/original.png';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
let state;
function asset(index) {
  return { id: index.toString(16).padStart(24, '0'), publicId: `zuno/${businessA}/image-${index}`, name: `Image ${index}`, url: index === 1 ? original : `https://media.fixture.invalid/image-${index}.png` };
}
async function openLibrary(page) {
  await page.getByRole('button', { name: 'Choose from media library', exact: true }).click();
  return page.getByRole('region', { name: 'Media library', exact: true });
}
test.beforeEach(async ({ page }) => {
  state = { assets: Array.from({ length: 13 }, (_, index) => asset(index + 1)), deletes: [], uploads: [], forbidden: [], listError: false, uploadError: false, holdUpload: false, releaseUpload: null };
  await page.addInitScript(({ businessA }) => { localStorage.setItem('zuno_token', 'fixture-session'); localStorage.setItem('zuno_biz', businessA); }, { businessA });
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const reply = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.hostname === 'media.fixture.invalid') return route.fulfill({ contentType: 'image/png', body: png });
    if (url.hostname !== '127.0.0.1') { state.forbidden.push(request.url()); return route.abort(); }
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/auth/me') return reply({ user: { _id: 'c'.repeat(24), email: 'fixture@example.invalid' }, businesses: [{ id: businessA }, { id: businessB }] });
    const business = request.headers()['x-business-id'];
    if (url.pathname === '/api/businesses/current') return reply({ business: { _id: business, name: 'Fixture business' }, permissions: ['business.update'] });
    if (url.pathname.startsWith('/api/media/images')) {
      expect(request.headers().authorization).toBe('Bearer fixture-session');
      expect([businessA, businessB]).toContain(business);
      if (request.method() === 'DELETE') {
        const id = url.pathname.split('/').pop(); state.deletes.push(id); state.assets = state.assets.filter(item => item.id !== id);
        return reply({ archived: true, fileRetained: true });
      }
      if (request.method() === 'POST') {
        state.uploads.push(request.postDataJSON());
        if (state.holdUpload) await new Promise(resolve => { state.releaseUpload = resolve; });
        try { return await reply(state.uploadError ? { error: { message: 'Upload fixture unavailable' } } : { asset: asset(99) }, state.uploadError ? 503 : 201); }
        catch (error) { if (!state.holdUpload) throw error; return; }
      }
      if (state.listError) return reply({ error: { message: 'Library fixture unavailable' } }, 503);
      const pageNumber = Number(url.searchParams.get('page') || 1);
      return reply({ items: state.assets.slice((pageNumber - 1) * 12, pageNumber * 12), total: state.assets.length, page: pageNumber, limit: 12 });
    }
    state.forbidden.push(request.url()); return reply({ error: { message: 'Unexpected fixture request' } }, 404);
  });
  await page.goto('/tests/browser/fixture.html');
  await expect(page.getByTestId('current-business')).toHaveText(businessA);
});
test.afterEach(async () => { state.releaseUpload?.(); expect(state.forbidden).toEqual([]); });

test('selects a stored image from the second page without uploading again', async ({ page }) => {
  const library = await openLibrary(page);
  await expect(library.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await library.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(library.getByText('Image 13', { exact: true })).toBeVisible();
  await library.getByRole('button', { name: 'Use image', exact: true }).click();
  await expect(page.getByTestId('selected-image')).toHaveText(asset(13).url);
  await expect(library).toHaveCount(0);
  expect(state.uploads).toHaveLength(0);
});
test('requires archive confirmation and leaves the field reference unchanged', async ({ page }) => {
  const library = await openLibrary(page);
  const card = library.locator('article').filter({ has: page.getByText('Image 1', { exact: true }) });
  await card.getByRole('button', { name: 'Archive image', exact: true }).click();
  expect(state.deletes).toHaveLength(0);
  await library.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(state.deletes).toHaveLength(0);
  await card.getByRole('button', { name: 'Archive image', exact: true }).click();
  await library.getByRole('button', { name: 'Confirm archive', exact: true }).click();
  await expect(library.getByText('Image 1', { exact: true })).toHaveCount(0);
  await expect(library.getByRole('status').filter({ hasText: 'Image archived' })).toBeVisible();
  await expect(page.getByTestId('selected-image')).toHaveText(original);
  expect(state.deletes).toEqual([asset(1).id]);
});
test('shows a list error and recovers through Refresh library', async ({ page }) => {
  state.listError = true;
  const library = await openLibrary(page);
  await expect(library.getByRole('alert')).toHaveText('Library fixture unavailable');
  state.listError = false;
  await library.getByRole('button', { name: 'Refresh library', exact: true }).click();
  await expect(library.getByText('Image 1', { exact: true })).toBeVisible();
});
test('closes the old library when switching business', async ({ page }) => {
  const library = await openLibrary(page);
  await expect(library.getByText('Image 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch fixture business', exact: true }).click();
  await expect(page.getByTestId('current-business')).toHaveText(businessB);
  await expect(library).toHaveCount(0);
  await expect(page.getByTestId('selected-image')).toHaveText('https://media.fixture.invalid/second-business.png');
});
test('uploads a PNG through the production FileReader and XHR code', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByTestId('selected-image')).toHaveText(asset(99).url);
  await expect(page.getByRole('status').filter({ hasText: 'Image uploaded' })).toBeVisible();
  expect(state.uploads).toHaveLength(1);
  expect(state.uploads[0].mimeType).toBe('image/png');
  expect(state.uploads[0].data).toBe(png.toString('base64'));
});
test('shows upload errors without replacing the old image', async ({ page }) => {
  state.uploadError = true;
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('alert')).toHaveText('Upload fixture unavailable');
  await expect(page.getByTestId('selected-image')).toHaveText(original);
});
test('rejects unsupported and oversized files before making an upload request', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert')).toHaveText('Choose a JPEG, PNG or WebP image.');
  await page.locator('input[type=file]').setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toHaveText('Images must be 5 MB or smaller.');
  expect(state.uploads).toHaveLength(0);
  await expect(page.getByTestId('selected-image')).toHaveText(original);
});
test('cancels an in-flight upload without replacing the previous image', async ({ page }) => {
  state.holdUpload = true;
  const started = page.waitForRequest(request => request.url().includes('/api/media/images') && request.method() === 'POST');
  await page.locator('input[type=file]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png });
  await started;
  await page.getByRole('button', { name: 'Cancel upload', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Upload cancelled. Your previous image has not changed.');
  state.releaseUpload?.();
  await expect(page.getByTestId('selected-image')).toHaveText(original);
});
