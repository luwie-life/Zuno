export function createSectionDragPreview(root, node, snapshot) {
  const preview = root.ownerDocument.createElement('div');
  const rect = node.getBoundingClientRect();
  preview.setAttribute('data-zuno-section-drag-preview', '');
  preview.setAttribute('aria-hidden', 'true');
  Object.assign(preview.style, {
    position: 'absolute', pointerEvents: 'none', boxSizing: 'border-box',
    border: '2px dashed #059669', background: 'rgba(5, 150, 105, 0.06)',
    zIndex: '1001', left: `${snapshot.originX}px`, top: `${snapshot.originY}px`,
    width: `${rect.width / snapshot.scaleX}px`, height: `${rect.height / snapshot.scaleY}px`,
  });
  root.appendChild(preview);
  return preview;
}
export function updateSectionDragPreview(preview, position) {
  preview.style.left = `${position.x}px`;
  preview.style.top = `${position.y}px`;
}
