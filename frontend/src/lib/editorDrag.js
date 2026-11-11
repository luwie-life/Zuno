export function createDragSnapshot(nodeRect, canvasRect, width, height, pointer) {
  const scaleX = width > 0 && canvasRect.width > 0 ? canvasRect.width / width : 1;
  const scaleY = height > 0 && canvasRect.height > 0 ? canvasRect.height / height : 1;
  return {
    scaleX, scaleY,
    grabX: (pointer.clientX - nodeRect.left) / scaleX,
    grabY: (pointer.clientY - nodeRect.top) / scaleY,
    originX: (nodeRect.left - canvasRect.left) / scaleX,
    originY: (nodeRect.top - canvasRect.top) / scaleY,
  };
}
export function dragPosition(snapshot, pointer, canvasRect) {
  const x = (pointer.clientX - canvasRect.left) / snapshot.scaleX - snapshot.grabX;
  const y = (pointer.clientY - canvasRect.top) / snapshot.scaleY - snapshot.grabY;
  return { x: Number(Math.max(0, x).toFixed(2)), y: Number(Math.max(0, y).toFixed(2)), positioned: true };
}
