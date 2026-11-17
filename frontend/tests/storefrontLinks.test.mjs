import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStorefrontDestination } from '../src/lib/storefront.js';

test('storefront destinations support internal paths and safe HTTP(S) URLs', () => {
  assert.deepEqual(resolveStorefrontDestination('/contact', '/store/acme'), {
    href: '/store/acme/contact',
    external: false,
  });
  assert.deepEqual(
    resolveStorefrontDestination('https://example.com/contact'),
    { href: 'https://example.com/contact', external: true }
  );
  assert.deepEqual(resolveStorefrontDestination('http://example.com'), {
    href: 'http://example.com/',
    external: true,
  });
});

test('storefront destinations reject unsafe or malformed URLs', () => {
  assert.equal(resolveStorefrontDestination('javascript:alert(1)'), null);
  assert.equal(resolveStorefrontDestination('//example.com'), null);
  assert.equal(resolveStorefrontDestination('https://user:pass@example.com'), null);
  assert.equal(resolveStorefrontDestination('/\\example.com'), null);
  assert.equal(resolveStorefrontDestination(''), null);
});
