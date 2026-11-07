import { useEffect, useRef } from 'react';

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

    // Resize the actual rendered object, not its outer editor wrapper.
    const elementNode = wrapper.firstElementChild || wrapper;

    const isText =
      elementType === 'heading' ||
      elementType === 'text';

    const isImage = elementType === 'image';

    const scale = Math.max(0.1, zoom / 100);

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

    const rootRect = root.getBoundingClientRect();
    const elementRect = getVisualRect();

    const initialWidth = elementRect.width / scale;
    const initialHeight = elementRect.height / scale;

    if (!initialWidth || !initialHeight) {
      return undefined;
    }

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
      left: `${(elementRect.left - rootRect.left) / scale}px`,
      top: `${(elementRect.top - rootRect.top) / scale}px`,
      width: `${initialWidth}px`,
      height: `${initialHeight}px`,
      border: '1.5px solid #059669',
      boxSizing: 'border-box',
      zIndex: '999',
      pointerEvents: 'none',
      touchAction: 'none',
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

    label.textContent =
      `${Math.round(initialWidth)} × ${Math.round(initialHeight)}`;

    overlay.appendChild(label);

    let activeInteraction = null;

    const updateLabel = (width, height) => {
      label.textContent =
        `${Math.round(width)} × ${Math.round(height)}`;
    };

    const updateOverlay = (width, height) => {
      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;

      updateLabel(width, height);
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
        'true'
      );

      Object.assign(button.style, {
        position: 'absolute',
        width: '14px',
        height: '14px',
        padding: '0',
        border: '2px solid #047857',
        borderRadius: '4px',
        background: '#ffffff',
        pointerEvents: 'auto',
        touchAction: 'none',
        cursor: handle.cursor,
        zIndex: '1000',
      });

      const positions = {
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

      Object.assign(button.style, positions[handle.id]);

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (activeInteraction) return;

        activeInteraction = {
          pointerId: event.pointerId,
          handle,
          startX: event.clientX,
          startY: event.clientY,
          width: initialWidth,
          height: initialHeight,
          fontSize: initialFontSize,
          startInlineWidth: elementNode.style.width,
          startInlineHeight: elementNode.style.height,
          startInlineFontSize: elementNode.style.fontSize,
        };

        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Ignore unsupported pointer capture.
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

      // Preserve image proportions during corner resizing.
      if (
        isImage &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const ratio =
          interaction.width / interaction.height;

        const widthChange =
          Math.abs(width - interaction.width);

        const heightChange =
          Math.abs(height - interaction.height);

        if (widthChange >= heightChange) {
          height = width / ratio;
        } else {
          width = height * ratio;
        }

        width = Math.max(MIN_WIDTH, width);
        height = Math.max(MIN_HEIGHT, height);
      }

      // Scale text size when using corner handles.
      if (
        isText &&
        handle.x !== 0 &&
        handle.y !== 0
      ) {
        const ratio = Math.max(
          0.5,
          Math.min(
            3,
            (
              width / interaction.width +
              height / interaction.height
            ) / 2
          )
        );

        fontSize = Math.max(
          8,
          Math.min(
            160,
            interaction.fontSize * ratio
          )
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
    };

    root.addEventListener(
      'pointermove',
      handlePointerMove,
      { passive: false }
    );

    root.addEventListener(
      'pointerup',
      handlePointerUp
    );

    root.addEventListener(
      'pointercancel',
      handlePointerCancel
    );

    return () => {
      root.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      root.removeEventListener(
        'pointerup',
        handlePointerUp
      );

      root.removeEventListener(
        'pointercancel',
        handlePointerCancel
      );

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
  ]);
}
