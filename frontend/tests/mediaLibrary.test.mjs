import test from 'node:test';
import assert from 'node:assert/strict';
import { createMediaLibraryClient, parseMediaPage } from '../src/lib/mediaLibrary.js';
const asset = { id: 'a'.repeat(24), url: 'https://images.example/image.png', name: 'Logo' };
const page = { items: [asset], total: 1, page: 1, limit: 12 };
function fixture(handler) {
  const session = { token: 'fixture-token', business: 'b'.repeat(24) };
  const calls = [];
  const client = createMediaLibraryClient({ baseUrl: '/api/media/images', token: session.token, businessId: session.business, getToken: () => session.token, getBusinessId: () => session.business, fetchImpl: async (url, options) => { calls.push({ url, options }); return handler ? handler(session) : { ok: true, status: 200, json: async () => page }; } });
  return { client, session, calls };
}
test('lists a page with captured tenant and session headers', async () => {
  const { client, calls } = fixture();
  assert.deepEqual(await client.list(2), page);
  assert.equal(calls[0].url, '/api/media/images?page=2&limit=12');
  assert.equal(calls[0].options.headers['X-Business-Id'], 'b'.repeat(24));
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
});
test('a business switch before request prevents network activity', async () => {
  const { client, session, calls } = fixture(); session.business = 'c'.repeat(24);
  await assert.rejects(client.list(), /session or business changed/);
  assert.equal(calls.length, 0);
});
test('a session switch while loading rejects the old response', async () => {
  const { client } = fixture(session => { session.token = 'replacement'; return { ok: true, status: 200, json: async () => page }; });
  await assert.rejects(client.list(), /session or business changed/);
});
test('API errors and malformed lists are not treated as empty success', async () => {
  const { client } = fixture(() => ({ ok: false, status: 503, json: async () => ({ error: { message: 'Media unavailable' } }) }));
  await assert.rejects(client.list(), /Media unavailable/);
  assert.throws(() => parseMediaPage({}), /invalid media list/);
  assert.throws(() => parseMediaPage({ ...page, items: [{ ...asset, url: 'javascript:alert(1)' }] }), /insecure/);
});
test('archive requires a valid ID and explicit retained-file confirmation', async () => {
  const { client, calls } = fixture(() => ({ ok: true, status: 200, json: async () => ({ archived: true, fileRetained: true }) }));
  await assert.rejects(client.archive('../other'), /Invalid image/);
  assert.equal(calls.length, 0);
  await client.archive(asset.id);
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].url, `/api/media/images/${asset.id}`);
});
test('cancellation signal is passed to the transport', async () => {
  const { client, calls } = fixture(); const controller = new AbortController();
  await client.list(1, controller.signal);
  assert.equal(calls[0].options.signal, controller.signal);
});
