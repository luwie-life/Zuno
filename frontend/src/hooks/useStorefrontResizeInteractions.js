import { useEffect, useRef } from 'react';

const MIN_WIDTH = 24;
const MIN_HEIGHT = 24;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 160;

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

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export default function useStorefrontResizeInteractions({
  rootRef,
  selectedElementId = '',
  selectedElement = null,
  zoom = 100,
  onResizeElement = () => {},
}) {
  const callbackRef = useRef(onResizeElement);

  callbackRef.current = onResizeElement;

  const elementType = selectedElement?.type || '';

  useEffect(() => {
    const root = rootRef?.current;

    if (!root || !selectedElementId || !elementType) {
      return undefined;
    }

    const wrapper = root.querySelector(
      `[data-editor-element-wrapper="${CSS.escape(
        String(selectedElementId)
      )}"]`
    );

    if (!wrapper) return undefined;

    const elementNode = wrapper.firstElementChild || wrapper;

    const isText =
      elementType === 'heading' ||
      elementType === 'text';

    const isImage = elementType === 'image';

    const scale = Math.max(0.1, Number(zoom) / 100 || 1);

    const getVisualRect = () => {
      if (isText && elementNode.textContent?.trim()) {
        const range = document.createRange();

        range.selectNodeContents(elementNode);

        const rect = range.getBoundingClientRect();

        if (rect.width && rect.height) {
          return rect;
        }
      }

      return elementNode.getBoundingClientRect();
    };

    const getRootCoordinates = (rect) => {
      const rootRect = root.getBoundingClientRect();

      return {
        left: (rect.left - rootRect.left) / scale,
        top: (rect.top - rootRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
    };

    const initialRect = getVisualRect();

    if (!initialRect.width || !initialRect.height) {
      return undefined;
    }

    const initial = getRootCoordinates(initialRect);

    const initialFontSize =
      Number.parseFloat(
        window.getComputedStyle(elementNode).fontSize
      ) || 16;

    const initialInlineStyles = {
      width: elementNode.style.width,
      height: elementNode.style.height,
      fontSize: elementNode.style.fontSize,
    };

    const overlay = document.createElement('div');

    overlay.className = 'zuno-resize-overlay';

    Object.assign(overlay.style, {
      position: 'absolute',
      left: `${initial.left}px`,
      top: `${initial.top}px`,
      width: `${initial.width}px`,
      height: `${initial.height}px`,
      boxSizing: 'border-box',
      border: '1.5px solid #059669',
      zIndex: '999',
      pointerEvents: 'none',
      touchAction: 'none',
      transform: 'none',
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
      lineHeight: '16px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none',
    });

    const updateLabel = (width, height) => {
      label.textContent =
        `${Math.round(width)} × ${Math.round(height)}`;
    };

    const updateOverlay = (width, height) => {
      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;

      updateLabel(width, height);
    };

    updateLabel(initial.width, initial.height);

    overlay.appendChild(label);

    let activeInteraction = null;

    const handlePositions = {
      nw: { left: '-7px', top: '-7px' },
      n: {
        left: '50%',
        top: '-7px',
        transform: 'translateX(-50%)',
      },
      ne: { right: '-7px', top: '-7px' },
      e: {
        right: '-7px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
      se: { right: '-7px', bottom: '-7px' },
      s: {
        left: '50%',
        bottom: '-7px',
        transform: 'translateX(-50%)',
      },
      sw: { left: '-7px', bottom: '-7px' },
      w: {
        left: '-7px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
    };

    const createHandle = (handle) => {
      const button = document.createElement('button');

      button.type = 'button';

      button.setAttribute(
        'aria-label',
        `Resize ${handle.id}`
      );

      button.setAttribute(
        'data-zuno-resize-handle',
        handle.id
      );

      Object.assign(button.style, {
        position: 'absolute',
        width: '14px',
        height: '14px',
        padding: '0',
        margin: '0',
        border: '2px solid #047857',
        borderRadius: '4px',
        background: '#ffffff',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        touchAction: 'none',
        cursor: handle.cursor,
        zIndex: '1000',
        ...handlePositions[handle.id],
      });

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (activeInteraction) return;

        activeInteraction = {
          pointerId: event.pointerId,
          handle,
          startX: event.clientX,
          startY: event.clientY,
          width: initial.width,
          height: initial.height,
          fontSize: initialFontSize,
          startInlineWidth: elementNode.style.width,
          startInlineHeight: elementNode.style.height,
          startInlineFontSize: elementNode.style.fontSize,
        };

        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture may be unavailable.
        }
      });

      return button;
    };

    HANDLES.forEach((handle) => {
      overlay.appendChild(createHandle(handle));
    });

    root.appendChild(overlay);

    const handlePointerMove = (event) => {
      const interaction = activeInteraction;

      if (!interaction) return;

      if (event.pointerId !== interaction.pointerId) {
        return;
      }

      event.preventDefault();

      const dx =
        (event.clientX - interaction.startX) / scale;

      const dy =
        (event.clientY - interaction.startY) / scale;

      const handle = interaction.handle;

      let width = interaction.width;
      let height = interaction.height;
      let fontSize = interaction.fontSize;

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

      // Keep images proportional when resizing from a corner.
      if (
        isImage &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const aspectRatio =
          interaction.width / interaction.height;

        const widthChange = Math.abs(
          width - interaction.width
        );

        const heightChange = Math.abs(
          height - interaction.height
        );

        if (widthChange >= heightChange) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }

        width = Math.max(MIN_WIDTH, width);
        height = Math.max(MIN_HEIGHT, height);
      }

      // Scale text when resizing from a corner.
      if (
        isText &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const ratio = clamp(
          (
            width / interaction.width +
            height / interaction.height
          ) / 2,
          0.5,
          3
        );

        fontSize = clamp(
          interaction.fontSize * ratio,
          MIN_FONT_SIZE,
          MAX_FONT_SIZE
        );
      }

      elementNode.style.width = `${width}px`;
      elementNode.style.height = `${height}px`;

      if (
        isText &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        elementNode.style.fontSize = `${fontSize}px`;
      }

      updateOverlay(width, height);
    };

    const handlePointerUp = (event) => {
      const interaction = activeInteraction;

      if (!interaction) return;

      if (event.pointerId !== interaction.pointerId) {
        return;
      }

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

      if (
        isText &&
        interaction.handle.x !== 0 &&
        interaction.handle.y !== 0
      ) {
        dimensions.fontSize = Math.round(finalFontSize);
      }

      callbackRef.current(
        selectedElementId,
        dimensions
      );

      try {
        if (root.hasPointerCapture(event.pointerId)) {
          root.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore unsupported pointer capture.
      }
    };

    const handlePointerCancel = (event) => {
      const interaction = activeInteraction;

      if (!interaction) return;

      if (
        event?.pointerId !== undefined &&
        interaction.pointerId !== event.pointerId
      ) {
        return;
      }

      activeInteraction = null;

      elementNode.style.width =
        interaction.startInlineWidth;

      elementNode.style.height =
        interaction.startInlineHeight;

      elementNode.style.fontSize =
        interaction.startInlineFontSize;

      updateOverlay(
        interaction.width,
        interaction.height
      );

      try {
        if (root.hasPointerCapture(interaction.pointerId)) {
          root.releasePointerCapture(interaction.pointerId);
        }
      } catch {
        // Ignore unsupported pointer capture.
      }
    };

    root.addEventListener(
      'pointermove',
      handlePointerMove,
      { passive: false }
    );

    root.addEventListener('pointerup', handlePointerUp);
    root.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerup', handlePointerUp);
      root.removeEventListener('pointercancel', handlePointerCancel);

      if (activeInteraction) {
        elementNode.style.width =
          activeInteraction.startInlineWidth;

        elementNode.style.height =
          activeInteraction.startInlineHeight;

        elementNode.style.fontSize =
          activeInteraction.startInlineFontSize;
      }

      overlay.remove();
    };
   }, [
    rootRef,
    selectedElementId,
    elementType,
    zoom,
    selectedElement?.style?.x,
    selectedElement?.style?.y,
    selectedElement?.style?.positioned,
    selectedElement?.style?.width,
    selectedElement?.style?.height,
  ]);
}
