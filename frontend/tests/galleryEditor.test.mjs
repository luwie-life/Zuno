import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryImage, updateGalleryImage, moveGalleryImage, removeGalleryImage } from '../src/lib/galleryEditor.js';
test('legacy URL strings become editable without losing their source', () => {
  const images = ['https://images.example/one.png'];
  const next = updateGalleryImage(images, 0, { alt: 'First image' });
  assert.deepEqual(next, [{ url: images[0], alt: 'First image' }]);
  assert.equal(images[0], 'https://images.example/one.png');
});
test('metadata and untouched entries are preserved', () => {
  const first = { url: '/one.png', alt: 'One', caption: 'Keep me', id: 'original' };
  const second = { url: '/two.png', alt: 'Two' };
  const next = updateGalleryImage([first, second], 0, { url: '/replacement.png' });
  assert.deepEqual(next[0], { ...first, url: '/replacement.png' });
  assert.equal(next[1], second);
  assert.equal(first.url, '/one.png');
});
test('reordering preserves entries, descriptions and original order', () => {
  const images = [{ url: '/one.png', alt: 'One' }, '/two.png'];
  assert.deepEqual(moveGalleryImage(images, 1, -1), [images[1], images[0]]);
  assert.equal(images[0].alt, 'One');
  assert.equal(moveGalleryImage(images, 0, -1), images);
  assert.equal(moveGalleryImage(images, 1, 1), images);
});
test('removing an entry only changes the requested index', () => {
  const images = ['/one.png', '/two.png', '/one.png'];
  assert.deepEqual(removeGalleryImage(images, 0), ['/two.png', '/one.png']);
  assert.equal(images.length, 3);
});
test('invalid indexes do not silently mutate galleries', () => {
  const images = ['/one.png'];
  for (const index of [-1, 1, 0.5, NaN]) {
    assert.equal(updateGalleryImage(images, index, { alt: 'Wrong' }), images);
    assert.equal(removeGalleryImage(images, index), images);
    assert.equal(moveGalleryImage(images, index, 1), images);
  }
  assert.equal(moveGalleryImage(images, 0, 0), images);
  assert.deepEqual(galleryImage(null), { url: '', alt: '' });
});
