import test from 'node:test';
import assert from 'node:assert/strict';
import { storefrontUpdateSchema } from '../src/lib/storefrontPayload.js';
import { parse } from '../src/lib/validate.js';
import { normalizeStorefrontConfig } from '../src/lib/storefront.js';
import { normalizeStorefrontMetadata } from '../src/lib/storefrontMetadata.js';

test('non-empty theme and nested page records parse under Zod 4', () => {
  const payload = { version: 4, theme: { primaryColor: '#0B6B4F', palette: [{ color: '#FFFFFF' }] }, pages: [{ id: 'home', slug: 'home', sections: [{ id: 'hero', elements: [{ id: 'title', type: 'heading', style: { x: 125.5, y: 240, positioned: true, width: '300px' } }] }] }], activePage: 'home' };
  assert.deepEqual(parse(storefrontUpdateSchema, payload), payload);
});
test('legacy and partial storefront payloads remain accepted', () => {
  assert.deepEqual(parse(storefrontUpdateSchema, { heroTitle: 'Welcome', published: false }), { heroTitle: 'Welcome', published: false });
  assert.deepEqual(parse(storefrontUpdateSchema, {}), {});
});
test('invalid record shapes produce a controlled validation error', () => {
  for (const body of [{ theme: 'green' }, { pages: [12] }, { pages: 'home' }, { published: 'yes' }]) assert.throws(() => parse(storefrontUpdateSchema, body), error => error.status === 400);
});
test('unknown tenant and owner fields cannot pass through the storefront schema', () => {
  assert.deepEqual(parse(storefrontUpdateSchema, { heroTitle: 'Welcome', business: 'another-merchant', owner: 'someone-else' }), { heroTitle: 'Welcome' });
});
test('storefront metadata and element coordinates survive the backend serialization pipeline', () => {
  const payload = { templateId: 'fashion-luxury', identity: { displayName: ' Acme ', logo: 'https://example.com/logo.png' }, contact: { city: ' Lagos ' }, seo: { title: 'Acme', keywords: [' style ', ''], noIndex: true }, socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/acme', visible: false }], pages: [{ id: 'home', slug: 'home', isHome: true, sections: [{ id: 'hero', type: 'hero', elements: [{ id: 'title', type: 'heading', content: 'Hello', style: { x: 125.5, y: 240, positioned: true, width: '300px' } }] }] }] };
  const once = normalizeStorefrontConfig(parse(storefrontUpdateSchema, payload), 'Acme');
  const reopened = normalizeStorefrontConfig(JSON.parse(JSON.stringify(once)), 'Acme');
  assert.deepEqual(reopened, once);
  assert.equal(reopened.templateId, 'fashion-luxury');
  assert.equal(reopened.identity.displayName, 'Acme');
  assert.equal(reopened.contact.city, 'Lagos');
  assert.deepEqual(reopened.seo.keywords, ['style']);
  assert.equal(reopened.socialLinks[0].visible, false);
  assert.equal(reopened.pages[0].sections[0].elements[0].style.x, 125.5);
  assert.equal(reopened.pages[0].sections[0].elements[0].style.y, 240);
});
test('legacy social maps normalize to canonical unique records', () => {
  const out = normalizeStorefrontMetadata({ socialLinks: { instagram: 'https://instagram.com/acme', facebook: 'https://facebook.com/acme' } });
  assert.equal(out.socialLinks.length, 2);
  assert.equal(out.socialLinks[0].id, 'social-instagram');
  assert.equal(normalizeStorefrontMetadata({ socialLinks: [{ platform: 'x', url: 'https://x.com/a' }, { platform: 'x', url: 'https://x.com/b' }] }).socialLinks.length, 1);
});
test('metadata cannot set domain verification, owner fields or executable image schemes', () => {
  const out = normalizeStorefrontMetadata({ owner: 'private', domain: { verified: true }, templateId: '<script>', identity: { logo: 'javascript:alert(1)' }, seo: { ogImage: 'data:text/html,evil' } });
  assert.equal('owner' in out, false); assert.equal('domain' in out, false);
  assert.equal(out.templateId, ''); assert.equal(out.identity.logo, ''); assert.equal(out.seo.ogImage, '');
});
