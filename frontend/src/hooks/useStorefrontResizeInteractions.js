import { useEffect } from 'react';

const MIN_WIDTH = 24;
const MIN_HEIGHT = 24;

const HANDLES = [
  { id: 'nw', cursor: 'nwse-resize', x: -1, y: -1 },
  { id: 'n', cursor: 'ns-resize', x: 0, y: -1 },
  { id: 'ne', cursor: 'nesw-resize', x: 1, y: -1 },
  { id: 'e', cursor: 'ew-resize', x: 1, y: 0 },
  { id: 'se', cursor: 'nwse-resize', x: 1, y: 1 },
  { id: 's', cursor: 'ns-resize', x: 0, y: 1 },
  { id: 'sw', cursor: 'nesw-resize', x: -1, y: 1 },
  { id: 'w', cursor: 'ew-resize', x: -1, y: 0 },
];

export default function useStorefrontResizeInteractions({
  rootRef,
  selectedElementId = '',
  selectedElement = null,
  zoom = 100,
  onResizeElement = () => {},
}) {
  useEffect(() => {
    const root = rootRef?.current;

    if (!root || !selectedElementId || !selectedElement) {
      return undefined;
    }

    const elementNode = Array.from(
      root.querySelectorAll('[data-editor-element]')
    ).find(
      (node) =>
        node.getAttribute('data-editor-element') ===
        String(selectedElementId)
    );

    if (!elementNode) return undefined;

    const scale = Math.max(0.1, zoom / 100);
    const rootRect = root.getBoundingClientRect();
    const elementRect = elementNode.getBoundingClientRect();

    const initialWidth = elementRect.width / scale;
    const initialHeight = elementRect.height / scale;

    if (!initialWidth || !initialHeight) return undefined;

    const initialFontSize =
      Number.parseFloat(
        window.getComputedStyle(elementNode).fontSize
      ) || 16;

    const isText =
      selectedElement.type === 'heading' ||
      selectedElement.type === 'text';

    const isImage = selectedElement.type === 'image';

    const overlay = document.createElement('div');

    overlay.className = 'zuno-resize-overlay';

    Object.assign(overlay.style, {
      position: 'absolute',
      left: `${(elementRect.left - rootRect.left) / scale}px`,
      top: `${(elementRect.top - rootRect.top) / scale}px`,
      width: `${initialWidth}px`,
      height: `${initialHeight}px`,
      border: '1.5px solid #059669',
      boxSizing: 'border-box',
      zIndex: '999',
      pointerEvents: 'none',
    });

    const label = document.createElement('div');

    Object.assign(label.style, {
      position: 'absolute',
      top: '-25px',
      left: '-1px',
      padding: '3px 7px',
      borderRadius: '4px',
      background: '#047857',
      color: '#ffffff',
      fontSize: '10px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    });

    label.textContent = `${Math.round(initialWidth)} × ${Math.round(
      initialHeight
    )}`;

    overlay.appendChild(label);

    let activeInteraction = null;

    const updateLabel = (width, height) => {
      label.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    };

    const createHandle = (handle) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.setAttribute('aria-label', `Resize ${handle.id}`);

      Object.assign(button.style, {
        position: 'absolute',
        width: '12px',
        height: '12px',
        padding: '0',
        border: '2px solid #047857',
        borderRadius: '3px',
        background: '#ffffff',
        pointerEvents: 'auto',
        touchAction: 'none',
        cursor: handle.cursor,
        zIndex: '1000',
      });

      const positions = {
        nw: { left: '-6px', top: '-6px' },
        n: {
          left: '50%',
          top: '-6px',
          transform: 'translateX(-50%)',
        },
        ne: { right: '-6px', top: '-6px' },
        e: {
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
        },
        se: { right: '-6px', bottom: '-6px' },
        s: {
          left: '50%',
          bottom: '-6px',
          transform: 'translateX(-50%)',
        },
        sw: { left: '-6px', bottom: '-6px' },
        w: {
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
        },
      };

      Object.assign(button.style, positions[handle.id]);

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const currentStyle = elementNode.style;

        activeInteraction = {
          pointerId: event.pointerId,
          handle,
          startX: event.clientX,
          startY: event.clientY,
          width: initialWidth,
          height: initialHeight,
          fontSize: initialFontSize,
          startInlineWidth: currentStyle.width,
          startInlineHeight: currentStyle.height,
          startInlineFontSize: currentStyle.fontSize,
        };

        button.setPointerCapture?.(event.pointerId);
      });

      return button;
    };

    HANDLES.forEach((handle) => {
      overlay.appendChild(createHandle(handle));
    });

    root.appendChild(overlay);

    const handlePointerMove = (event) => {
      if (!activeInteraction) return;

      if (event.pointerId !== activeInteraction.pointerId) return;

      event.preventDefault();

      const interaction = activeInteraction;

      const dx = (event.clientX - interaction.startX) / scale;
      const dy = (event.clientY - interaction.startY) / scale;

      let width = interaction.width;
      let height = interaction.height;
      let fontSize = interaction.fontSize;

      const handle = interaction.handle;

      if (handle.x !== 0) {
        width = Math.max(
          MIN_WIDTH,
          interaction.width + dx * handle.x
        );
      }

      if (handle.y !== 0) {
        height = Math.max(
          MIN_HEIGHT,
          interaction.height + dy * handle.y
        );
      }

      // Images preserve their original proportions when corner-resized.
      if (
        isImage &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const ratio = interaction.width / interaction.height;

        const widthChange = Math.abs(
          width - interaction.width
        );

        const heightChange = Math.abs(
          height - interaction.height
        );

        if (widthChange >= heightChange) {
          height = width / ratio;
        } else {
          width = height * ratio;
        }

        width = Math.max(MIN_WIDTH, width);
        height = Math.max(MIN_HEIGHT, height);
      }

      // Corner resizing on text changes its font size.
      if (
        isText &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const ratio = Math.max(
          0.5,
          Math.min(
            3,
            (width / interaction.width +
              height / interaction.height) /
              2
          )
        );

        fontSize = Math.max(
          8,
          Math.min(160, interaction.fontSize * ratio)
        );
      }

      elementNode.style.width = `${width}px`;
      elementNode.style.height = `${height}px`;

      if (isText && handle.x !== 0 && handle.y !== 0) {
        elementNode.style.fontSize = `${fontSize}px`;
      }

      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;

      updateLabel(width, height);
    };

    const handlePointerUp = (event) => {
      if (!activeInteraction) return;

      if (event.pointerId !== activeInteraction.pointerId) return;

      const interaction = activeInteraction;

      activeInteraction = null;

      const finalWidth =
        Number.parseFloat(elementNode.style.width) ||
        interaction.width;

      const finalHeight =
        Number.parseFloat(elementNode.style.height) ||
        interaction.height;

      const finalFontSize =
        Number.parseFloat(elementNode.style.fontSize) ||
        interaction.fontSize;

      const dimensions = {
        width: `${Math.round(finalWidth)}px`,
        height: `${Math.round(finalHeight)}px`,
      };

      if (isText && interaction.handle.x !== 0 && interaction.handle.y !== 0) {
        dimensions.fontSize = Math.round(finalFontSize);
      }

      onResizeElement(selectedElementId, dimensions);
    };

    const handlePointerCancel = () => {
      if (!activeInteraction) return;

      activeInteraction = null;

      elementNode.style.width = '';
      elementNode.style.height = '';
      elementNode.style.fontSize = '';
    };

    root.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    });

    root.addEventListener('pointerup', handlePointerUp);

    root.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerup', handlePointerUp);
      root.removeEventListener('pointercancel', handlePointerCancel);

      overlay.remove();
    };
  }, [
    rootRef,
    selectedElementId,
    selectedElement,
    zoom,
    onResizeElement,
  ]);
}
