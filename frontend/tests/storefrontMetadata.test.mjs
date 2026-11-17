import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStorefrontMetadata } from '../src/lib/storefrontMetadata.js';
const business = { name: 'Profile name', description: 'Profile description', storefront: { identity: { displayName: 'Studio', favicon: '/favicon.png' }, seo: { title: 'Custom SEO title', description: 'Search description', ogImage: 'https://images.example/share.png', keywords: ['studio', 'services'] }, pages: [{ id: 'about', title: 'About us', slug: 'about', visible: true }, { id: 'hidden', title: 'Hidden', slug: 'hidden', visible: false }] } };
test('saved metadata and images resolve without retaining query strings', () => {
  const result = buildStorefrontMetadata(business, '/store/studio?tracking=test#section', '/store/studio', 'https://example.invalid');
  assert.equal(result.title, 'Custom SEO title'); assert.equal(result.description, 'Search description');
  assert.equal(result.canonical, 'https://example.invalid/store/studio'); assert.equal(result.favicon, 'https://example.invalid/favicon.png');
  assert.equal(result.image, 'https://images.example/share.png'); assert.equal(result.keywords, 'studio, services'); assert.equal(result.noIndex, false);
});
test('visible custom pages receive page titles in path and host routing', () => {
  assert.equal(buildStorefrontMetadata(business, '/store/studio/about', '/store/studio', 'https://example.invalid').title, 'About us | Custom SEO title');
  assert.equal(buildStorefrontMetadata(business, '/about', '', 'https://studio.example.invalid').title, 'About us | Custom SEO title');
});
test('checkout, order, hidden and missing routes receive no-index preferences', () => {
  for (const route of ['checkout', 'order', 'hidden', 'missing']) assert.equal(buildStorefrontMetadata(business, '/store/studio/' + route, '/store/studio', 'https://example.invalid').noIndex, true);
  assert.equal(buildStorefrontMetadata({ ...business, storefront: { ...business.storefront, seo: { noIndex: true } } }, '/store/studio', '/store/studio', 'https://example.invalid').noIndex, true);
});
test('unsafe metadata image schemes and embedded credentials are excluded', () => {
  for (const value of ['javascript:alert(1)', 'data:image/png;base64,test', '//other.invalid/image.png', 'https://user:password@other.invalid/image.png']) {
    const model = { storefront: { identity: { favicon: value }, seo: { ogImage: value } } };
    const result = buildStorefrontMetadata(model, '/', '', 'https://example.invalid');
    assert.equal(result.image, ''); assert.equal(result.favicon, '');
  }
});
test('legacy stores retain business-profile text fallbacks', () => {
  const result = buildStorefrontMetadata({ name: 'Legacy', description: 'Legacy description' }, '/', '', 'https://example.invalid');
  assert.equal(result.title, 'Legacy | Online store'); assert.equal(result.description, 'Legacy description'); assert.equal(result.image, '');
});
