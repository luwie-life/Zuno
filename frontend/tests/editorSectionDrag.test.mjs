import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSectionDragPreview, updateSectionDragPreview } from '../src/lib/editorSectionDrag.js';

test('section preview does not transform or reparent section contents', () => {
  const preview = { style: {}, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const root = { children: [], ownerDocument: { createElement: () => preview }, appendChild(node) { this.children.push(node); } };
  const section = { style: { transform: '', willChange: '' }, getBoundingClientRect: () => ({ width: 600, height: 150 }) };
  const snapshot = { scaleX: 0.75, scaleY: 0.75, originX: 10, originY: 240 };
  const result = createSectionDragPreview(root, section, snapshot);
  updateSectionDragPreview(result, { x: 20, y: 270 });
  assert.equal(root.children.length, 1);
  assert.equal(result.style.width, '800px');
  assert.equal(result.style.height, '200px');
  assert.equal(result.style.top, '270px');
  assert.equal(result.style.pointerEvents, 'none');
  assert.equal(section.style.transform, '');
  assert.equal(section.style.willChange, '');
});
test('section branch exits before element transform preview and cleans up its outline', () => {
  const source = readFileSync(new URL('../src/hooks/useStorefrontPointerInteractions.js', import.meta.url), 'utf8');
  assert.match(source, /if \(interaction\.type === 'section'\) \{[\s\S]*?updateSectionDragPreview[\s\S]*?return;\s*\}/);
  assert.match(source, /interaction\.sectionPreview\?\.remove\(\)/);
});
