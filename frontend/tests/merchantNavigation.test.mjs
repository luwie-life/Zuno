import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORE_EDITOR_NAVIGATION, visibleMerchantNavigation } from '../src/lib/merchantNavigation.js';
import { merchantCan } from '../../backend/src/lib/permissions.js';

test('editor uses the existing route and permission', () => {
  assert.equal(STORE_EDITOR_NAVIGATION.to, '/app/storefront');
  assert.equal(STORE_EDITOR_NAVIGATION.label, 'Store Editor');
  assert.equal(STORE_EDITOR_NAVIGATION.perm, 'business.update');
});
test('authorized merchants see the editor for every business module combination', () => {
  for (const modules of [['commerce'], ['services'], ['commerce', 'services']]) {
    assert.equal(visibleMerchantNavigation([STORE_EDITOR_NAVIGATION], { modules, can: p => p === 'business.update' }).length, 1);
  }
});
test('merchants without business.update cannot see the editor', () => {
  assert.deepEqual(visibleMerchantNavigation([STORE_EDITOR_NAVIGATION], { modules: ['commerce'], can: () => false }), []);
  assert.deepEqual(visibleMerchantNavigation([STORE_EDITOR_NAVIGATION]), []);
});
test('existing module and read-only navigation behavior is preserved', () => {
  const entries = [{ to: '/app' }, STORE_EDITOR_NAVIGATION, { to: '/app/products', module: 'commerce', perm: 'products.write', alsoRead: true }];
  const can = p => p === 'products.read';
  assert.deepEqual(visibleMerchantNavigation(entries, { modules: ['commerce'], can }).map(n => n.to), ['/app', '/app/products']);
  assert.deepEqual(visibleMerchantNavigation(entries, { modules: ['services'], can }).map(n => n.to), ['/app']);
});
test('actual merchant roles retain editor permission boundaries', () => {
  for (const [role, count] of [['owner', 1], ['manager', 1], ['cashier', 0], ['unknown', 0]]) {
    assert.equal(visibleMerchantNavigation([STORE_EDITOR_NAVIGATION], { can: p => merchantCan(role, p) }).length, count, role);
  }
});
test('layout adds a single shared editor entry and retains active NavLinks', () => {
  const source = readFileSync(new URL('../src/components/Layouts.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/\.\.\.STORE_EDITOR_NAVIGATION/g) || []).length, 1);
  assert.match(source, /visibleMerchantNavigation\(NAV,/);
  assert.match(source, /<NavLink to=\{n\.to\}/);
  assert.match(source, /items\.filter\(\(i\) => !mobileMain\.includes\(i\)\)/);
});
