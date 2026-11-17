import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeElementStyle as frontendStyle } from '../src/lib/storefront.js';
import { normalizeElementStyle as backendStyle } from '../../backend/src/lib/storefront.js';

test('resize font boundaries survive frontend and backend normalization', () => {
  const source = readFileSync(new URL('../src/hooks/useStorefrontResizeInteractions.js', import.meta.url), 'utf8');
  const minimum = Number(source.match(/const MIN_FONT_SIZE = (\d+);/)?.[1]);
  const maximum = Number(source.match(/const MAX_FONT_SIZE = (\d+);/)?.[1]);
  assert.ok(Number.isFinite(minimum) && Number.isFinite(maximum));
  assert.equal(minimum, 8);
  assert.equal(maximum, 120);
  for (const fontSize of [minimum, 16, 64, maximum]) {
    const preview = frontendStyle({ fontSize });
    const saved = backendStyle(preview);
    const reopened = frontendStyle(saved);
    assert.equal(preview.fontSize, fontSize);
    assert.equal(saved.fontSize, fontSize);
    assert.equal(reopened.fontSize, fontSize);
  }
});
