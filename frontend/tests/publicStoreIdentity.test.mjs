import test from 'node:test';
import assert from 'node:assert/strict';
import { publicStoreBusinessFields } from '../../backend/src/lib/publicStoreBusiness.js';
const profile = { name: 'Legal business', slug: 'example', businessType: 'service', description: 'Profile description', logoUrl: 'https://images.example/profile.png', brandColor: '#123456', phone: '08030000000', email: 'profile@example.invalid', address: { line: 'Profile street', city: 'Lagos', state: 'Lagos' }, deliveryFee: 1000, owner: 'private-owner', status: 'active' };
test('public storefront branding uses saved identity and theme without mutating the profile', () => {
  const business = { ...profile, storefront: { identity: { displayName: 'Display studio', description: 'Store description', logo: 'https://images.example/store.png' }, theme: { primaryColor: '#654321' } } };
  const result = publicStoreBusinessFields(business, false, true);
  assert.equal(result.name, 'Display studio'); assert.equal(result.description, 'Store description');
  assert.equal(result.logoUrl, business.storefront.identity.logo); assert.equal(result.brandColor, '#654321');
  assert.equal(business.name, 'Legal business'); assert.equal(business.logoUrl, profile.logoUrl);
  assert.equal(result.businessType, 'service'); assert.equal(result.acceptingOrders, false); assert.equal(result.acceptingServices, true);
  assert.equal('owner' in result, false); assert.equal('status' in result, false);
});
test('legacy businesses and empty storefront identity fields retain profile fallbacks', () => {
  for (const storefront of [undefined, { identity: { displayName: ' ', logo: '' }, contact: {} }]) {
    const result = publicStoreBusinessFields({ ...profile, storefront }, true, false);
    assert.equal(result.name, profile.name); assert.equal(result.logoUrl, profile.logoUrl);
    assert.equal(result.phone, profile.phone); assert.equal(result.email, profile.email);
    assert.deepEqual(result.address, profile.address); assert.equal(result.brandColor, profile.brandColor);
  }
});
test('saved public contact details override only corresponding profile fields', () => {
  const business = { ...profile, storefront: { contact: { phone: '08040000000', email: 'store@example.invalid', address: 'Store street', city: 'Abuja' } } };
  const result = publicStoreBusinessFields(business, true, true);
  assert.equal(result.phone, '08040000000'); assert.equal(result.email, 'store@example.invalid');
  assert.deepEqual(result.address, { line: 'Store street', city: 'Abuja', state: 'Lagos' });
  assert.equal(result.deliveryFee, profile.deliveryFee); assert.equal(profile.address.line, 'Profile street');
});
