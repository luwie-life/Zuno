import test from 'node:test';
import assert from 'node:assert/strict';
import { storefrontInput, normalizeStorefrontMetadata } from '../../backend/src/lib/storefrontMetadata.js';
import { normalizeStorefrontConfig } from '../../backend/src/lib/storefront.js';

test('document fields are read from toObject rather than wrapper properties', () => {
  const saved = { templateId: 'fashion-luxury', pages: [{ id: 'home' }] };
  let calls = 0;
  const doc = { templateId: 'stale-wrapper', toObject() { calls++; return saved; } };
  assert.equal(storefrontInput(doc), saved);
  assert.equal(calls, 1);
  assert.equal(doc.templateId, 'stale-wrapper');
});
test('plain input remains supported and invalid shapes fail closed', () => {
  const saved = { pages: [] };
  assert.equal(storefrontInput(saved), saved);
  for (const value of [null, undefined, [], 123, 'text']) assert.deepEqual(storefrontInput(value), {});
  assert.deepEqual(storefrontInput({ toObject: () => null }), {});
});
test('serialization errors propagate instead of replacing content with defaults', () => {
  assert.throws(() => storefrontInput({ toObject() { throw Error('serialization failed'); } }), /serialization failed/);
});
test('document-shaped storefronts retain metadata, pages and element coordinates', () => {
  const saved = { templateId: 'fashion-luxury', identity: { displayName: 'Acme' }, pages: [{ id: 'home', slug: 'home', isHome: true, sections: [{ id: 'hero', type: 'hero', elements: [{ id: 'title', type: 'heading', content: 'Hello', style: { x: 125.5, y: 240, positioned: true, width: '300px' } }] }] }] };
  const doc = { toObject: () => saved };
  const result = normalizeStorefrontConfig(doc, 'Acme');
  assert.deepEqual(result, normalizeStorefrontConfig(saved, 'Acme'));
  assert.equal(result.templateId, 'fashion-luxury');
  assert.equal(result.pages[0].sections[0].elements[0].style.x, 125.5);
  assert.equal(result.pages[0].sections[0].elements[0].style.y, 240);
  assert.equal(normalizeStorefrontMetadata(doc).identity.displayName, 'Acme');
});
