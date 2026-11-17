import test from 'node:test';
import assert from 'node:assert/strict';
import { socialLinkValue, updateSocialLink } from '../src/lib/storefrontSocialEditor.js';
import { normalizeSocialLinks } from '../src/lib/storefront.js';
import { normalizeStorefrontMetadata } from '../../backend/src/lib/storefrontMetadata.js';

test('canonical stored links populate their fields', () => assert.equal(socialLinkValue([{ id: 'ig', platform: 'instagram', url: 'https://instagram.com/acme' }], 'instagram'), 'https://instagram.com/acme'));
test('legacy maps remain readable and migrate without dropping other platforms', () => {
  const old = { instagram: 'https://instagram.com/acme', facebook: 'https://facebook.com/acme' };
  const next = updateSocialLink(old, 'instagram', 'https://instagram.com/new');
  assert.equal(next.length, 2);
  assert.equal(socialLinkValue(next, 'facebook'), old.facebook);
});
test('replacement preserves identity and hidden visibility and removes duplicate target entries', () => {
  const next = updateSocialLink([{ id: 'old', platform: 'x', url: 'https://x.com/a', visible: false }, { id: 'dup', platform: 'x', url: 'https://x.com/b' }], 'x', 'https://x.com/new');
  assert.deepEqual(next, [{ id: 'old', platform: 'x', url: 'https://x.com/new', visible: false }]);
});
test('clearing a field removes only that platform', () => {
  const next = updateSocialLink([{ platform: 'x', url: 'https://x.com/a' }, { platform: 'instagram', url: 'https://instagram.com/a' }], 'x', '  ');
  assert.equal(next.length, 1);
  assert.equal(next[0].platform, 'instagram');
});
test('editing does not mutate the input', () => {
  const input = Object.freeze([Object.freeze({ id: 'x', platform: 'x', url: 'https://x.com/a', visible: false })]);
  const next = updateSocialLink(input, 'x', 'https://x.com/b');
  assert.equal(input[0].url, 'https://x.com/a');
  assert.notEqual(next, input);
});
test('empty data and unknown platforms fail safely', () => {
  assert.equal(socialLinkValue(null, 'x'), '');
  assert.deepEqual(updateSocialLink(undefined, 'unknown', 'value'), []);
  assert.deepEqual(updateSocialLink([], 'x', ''), []);
});
test('edited records remain readable through both social normalizers', () => {
  const edited = updateSocialLink([{ id: 'ig', platform: 'instagram', url: 'https://instagram.com/old', visible: false }], 'instagram', 'https://instagram.com/new');
  const saved = normalizeStorefrontMetadata({ socialLinks: normalizeSocialLinks(edited) });
  const reopened = normalizeSocialLinks(saved.socialLinks);
  assert.equal(socialLinkValue(reopened, 'instagram'), 'https://instagram.com/new');
  assert.equal(reopened[0].id, 'ig');
  assert.equal(reopened[0].visible, false);
});
