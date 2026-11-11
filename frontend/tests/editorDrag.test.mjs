import test from 'node:test';
import assert from 'node:assert/strict';
import { createDragSnapshot, dragPosition } from '../src/lib/editorDrag.js';
test('drag distance remains linear at supported zoom levels', () => {
  for (const scale of [0.4, 0.75, 1, 1.5]) {
    const canvas = { left: 50, top: 70, width: 1200 * scale, height: 900 * scale };
    const node = { left: 50 + 100 * scale, top: 70 + 200 * scale };
    const pointer = { clientX: node.left + 12 * scale, clientY: node.top + 18 * scale };
    const snapshot = createDragSnapshot(node, canvas, 1200, 900, pointer);
    for (const distance of [0, 10, 100, 500]) assert.deepEqual(dragPosition(snapshot, { clientX: pointer.clientX + distance * scale, clientY: pointer.clientY + distance * scale }, canvas), { x: 100 + distance, y: 200 + distance, positioned: true });
  }
});
test('canvas movement caused by scrolling is included', () => {
  const canvas = { left: 50, top: 70, width: 600, height: 450 };
  const pointer = { clientX: 110, clientY: 179 };
  const snapshot = createDragSnapshot({ left: 100, top: 170 }, canvas, 1200, 900, pointer);
  assert.deepEqual(dragPosition(snapshot, pointer, { ...canvas, left: 30, top: 20 }), { x: 140, y: 300, positioned: true });
});
test('preview and persisted positions can use the same clamped result', () => {
  const snapshot = createDragSnapshot({left:100,top:200},{left:0,top:0,width:1200,height:900},1200,900,{clientX:110,clientY:210});
  assert.deepEqual(dragPosition(snapshot,{clientX:-20,clientY:-30},{left:0,top:0}),{x:0,y:0,positioned:true});
});
test('snapshot is unaffected by later canvas dimension changes', () => {
  const canvas = {left:0,top:0,width:600,height:450};
  const snapshot = createDragSnapshot({left:50,top:100},canvas,1200,900,{clientX:55,clientY:105});
  assert.deepEqual(dragPosition(snapshot,{clientX:105,clientY:155},{...canvas,width:900,height:600}),{x:200,y:300,positioned:true});
});
