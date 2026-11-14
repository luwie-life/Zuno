import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeStorefrontConfig } from '../src/lib/storefront.js';
import { normalizeStorefrontConfig as backendNormalize } from '../../backend/src/lib/storefront.js';

test('settings connect all three identity/sharing image fields to the shared upload control', () => {
  const source = readFileSync(new URL('../src/components/storefront/StorefrontSettingsPanel.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/<ImageUploadField/g) || []).length, 3);
  assert.match(source, /label="Store logo"[\s\S]*?updateIdentity\('logo', value\)/);
  assert.match(source, /label="Favicon image"[\s\S]*?updateIdentity\('favicon', value\)/);
  assert.match(source, /label="Social sharing image"[\s\S]*?updateSEO\('ogImage', value\)/);
  assert.equal(source.includes('Auto-updated'), false);
  assert.equal(source.includes('Media uploads will be connected'), false);
});
test('uploaded identity image URLs survive frontend/backend normalization and serialization', () => {
  const logo = 'https://res.cloudinary.com/demo/image/upload/v1/zuno/logo.png';
  const favicon = 'https://res.cloudinary.com/demo/image/upload/v1/zuno/favicon.png';
  const ogImage = 'https://res.cloudinary.com/demo/image/upload/v1/zuno/sharing.webp';
  const current = normalizeStorefrontConfig({ identity: { displayName: 'Acme', logo, favicon }, seo: { title: 'Acme', ogImage }, pages: [{ id: 'home', slug: 'home', isHome: true, sections: [] }] }, 'Acme');
  const reopened = normalizeStorefrontConfig(backendNormalize(JSON.parse(JSON.stringify(current)), 'Acme'), 'Acme');
  assert.equal(reopened.identity.logo, logo);
  assert.equal(reopened.identity.favicon, favicon);
  assert.equal(reopened.seo.ogImage, ogImage);
  const cleared = normalizeStorefrontConfig({ ...reopened, identity: { ...reopened.identity, favicon: '' } }, 'Acme');
  assert.equal(cleared.identity.favicon, '');
  assert.equal(cleared.identity.logo, logo);
  assert.equal(cleared.seo.ogImage, ogImage);
});
