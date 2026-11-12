import test from 'node:test';
import assert from 'node:assert/strict';
import { publicStoreBusinessFields } from '../../backend/src/lib/publicStoreBusiness.js';
import { getBusinessCapabilities } from '../src/lib/storefront.js';

test('product, service and hybrid types remain explicit', () => {
  for (const businessType of ['product', 'service', 'both']) assert.equal(publicStoreBusinessFields({ businessType }, false, false).businessType, businessType);
});
test('legacy or invalid type retains product fallback', () => {
  for (const businessType of [undefined, null, 'unknown', '']) assert.equal(publicStoreBusinessFields({ businessType }, false, false).businessType, 'product');
});
test('merchant secrets and internal fields are not projected', () => {
  const out = publicStoreBusinessFields({ name: 'Zuno Merchant', businessType: 'service', owner: 'private', _id: 'private', authorization: { code: 'private' }, encryptedSecret: 'private' }, false, true);
  for (const key of ['owner', '_id', 'authorization', 'encryptedSecret']) assert.equal(key in out, false);
  assert.equal(out.name, 'Zuno Merchant');
});
test('availability flags and timezone retain their existing values', () => {
  const out = publicStoreBusinessFields({ businessType: 'both', timezone: 'UTC' }, true, true);
  assert.equal(out.acceptingOrders, true);
  assert.equal(out.acceptingServices, true);
  assert.equal(out.timezone, 'UTC');
  assert.equal(publicStoreBusinessFields({}, false, false).timezone, 'Africa/Lagos');
});
test('public business type reaches the existing renderer capability selector', () => {
  const service = publicStoreBusinessFields({ businessType: 'service' }, false, true);
  assert.equal(getBusinessCapabilities(service.businessType).services, true);
  assert.equal(getBusinessCapabilities(service.businessType).products, false);
  const both = publicStoreBusinessFields({ businessType: 'both' }, true, true);
  assert.equal(getBusinessCapabilities(both.businessType).services, true);
  assert.equal(getBusinessCapabilities(both.businessType).products, true);
});
