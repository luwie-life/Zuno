import test from 'node:test';
import assert from 'node:assert/strict';
import { storefrontUpdateSchema } from '../src/lib/storefrontPayload.js';
import { parse } from '../src/lib/validate.js';

test('non-empty theme and nested page records parse under Zod 4', () => {
  const payload = { version: 4, theme: { primaryColor: '#0B6B4F', palette: [{ color: '#FFFFFF' }] }, pages: [{ id: 'home', slug: 'home', sections: [{ id: 'hero', elements: [{ id: 'title', type: 'heading', style: { x: 125.5, y: 240, positioned: true, width: '300px' } }] }] }], activePage: 'home' };
  assert.deepEqual(parse(storefrontUpdateSchema, payload), payload);
});
test('legacy and partial storefront payloads remain accepted', () => {
  assert.deepEqual(parse(storefrontUpdateSchema, { heroTitle: 'Welcome', published: false }), { heroTitle: 'Welcome', published: false });
  assert.deepEqual(parse(storefrontUpdateSchema, {}), {});
});
test('invalid record shapes produce a controlled validation error', () => {
  for (const body of [{ theme: 'green' }, { pages: [12] }, { pages: 'home' }, { published: 'yes' }]) {
    assert.throws(() => parse(storefrontUpdateSchema, body), error => error.status === 400);
  }
});
test('unknown tenant and owner fields cannot pass through the storefront schema', () => {
  assert.deepEqual(parse(storefrontUpdateSchema, { heroTitle: 'Welcome', business: 'another-merchant', owner: 'someone-else' }), { heroTitle: 'Welcome' });
});
