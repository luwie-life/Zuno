import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { MAX_IMAGE_BYTES, imageUploadConfig, validateImageUpload, cloudinaryImageParameters, signCloudinaryImage, verifiedCloudinaryImage } from '../src/lib/cloudinaryImages.js';
const png = Buffer.from([137,80,78,71,13,10,26,10]);
test('configuration failures never include the secret', () => {
  assert.throws(() => imageUploadConfig({ CLOUDINARY_API_SECRET: 'never-print-this' }), error => error.status === 503 && !error.message.includes('never-print-this'));
});
test('header checks accept allowed signatures and reject MIME spoofing', () => {
  assert.equal(validateImageUpload('image/png', png.toString('base64')).format, 'png');
  assert.equal(validateImageUpload('image/jpeg', Buffer.from([255,216,255,0]).toString('base64')).format, 'jpg');
  assert.equal(validateImageUpload('image/webp', Buffer.from('RIFF0000WEBP').toString('base64')).format, 'webp');
  assert.throws(() => validateImageUpload('image/jpeg', png.toString('base64')), error => error.code === 'INVALID_IMAGE_CONTENT');
  assert.throws(() => validateImageUpload('image/svg+xml', Buffer.from('<svg/>').toString('base64')), error => error.code === 'INVALID_IMAGE_TYPE');
});
test('invalid and oversized base64 are rejected before upload', () => {
  assert.throws(() => validateImageUpload('image/png', '%%%'), error => error.status === 400);
  assert.throws(() => validateImageUpload('image/png', 'A'.repeat(Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1)), error => error.status === 413);
});
test('signature uses sorted fixed upload parameters and forbids overwrite', () => {
  const params = cloudinaryImageParameters('zuno/tenant/image', new Date('2026-01-01T00:00:00Z'));
  assert.equal(params.overwrite, 'false');
  const expected = createHash('sha1').update('allowed_formats=jpg,png,webp&overwrite=false&public_id=zuno/tenant/image&timestamp=1767225600unit-test-secret').digest('hex');
  assert.equal(signCloudinaryImage(params, 'unit-test-secret'), expected);
});
test('provider metadata must match the server-owned public ID and secure image URL', () => {
  const good = { public_id:'zuno/tenant/image', resource_type:'image', type:'upload', format:'png', bytes:100, width:10, height:10, secure_url:'https://res.cloudinary.com/demo/image/upload/v1/zuno/tenant/image.png' };
  assert.equal(verifiedCloudinaryImage(good, good.public_id, 'demo').format, 'png');
  for (const patch of [{public_id:'zuno/other/image'},{bytes:MAX_IMAGE_BYTES+1},{secure_url:'http://res.cloudinary.com/demo/image/upload/image.png'},{secure_url:'https://evil.example/demo/image/upload/image.png'},{format:'svg'}]) assert.throws(() => verifiedCloudinaryImage({...good,...patch}, good.public_id, 'demo'), error => error.status === 502);
});
