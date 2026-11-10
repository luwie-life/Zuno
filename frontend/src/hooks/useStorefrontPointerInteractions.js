import { useEffect, useRef } from 'react';

const DRAG_THRESHOLD = 3;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export default function useStorefrontPointerInteractions({
  rootRef,
  sections = [],
  selectedSectionId = '',
  selectedElementId = '',
  onSelectSection = () => {},
  onSelectElement = () => {},
  onReorderSections = () => {},
  onReorderElements = () => {},
  onMoveElement = () => {},
  onPositionElement = () => {},
}) {
  const interactionRef = useRef(null);
  const latestRef = useRef({});

  latestRef.current = {
    sections,
    selectedSectionId,
    selectedElementId,
    onSelectSection,
    onSelectElement,
    onReorderSections,
    onReorderElements,
    onMoveElement,
    onPositionElement,
  };

  useEffect(() => {
    const root = rootRef?.current;

    if (!root) return undefined;

    const selected = selectedElementId
      ? root.querySelector(
          `[data-editor-element-wrapper="${CSS.escape(selectedElementId)}"]`
        )
      : selectedSectionId
        ? root.querySelector(
            `[data-editor-section="${CSS.escape(selectedSectionId)}"]`
          )
        : null;

    if (!selected) return undefined;

    const previousTouchAction = selected.style.touchAction;
    selected.style.touchAction = 'none';

    return () => {
      selected.style.touchAction = previousTouchAction;
    };
  }, [rootRef, selectedElementId, selectedSectionId]);

  useEffect(() => {
    const root = rootRef?.current;

    if (!root) return undefined;

    const getElement = (target) =>
      target instanceof Element
        ? target.closest('[data-editor-element-wrapper]')
        : null;

    const getSection = (target) =>
      target instanceof Element
        ? target.closest('[data-editor-section]')
        : null;

    const getScale = () => {
      const rect = root.getBoundingClientRect();

      return {
        x: root.offsetWidth ? rect.width / root.offsetWidth : 1,
        y: root.offsetHeight ? rect.height / root.offsetHeight : 1,
      };
    };

    // Used for section reordering.
    const getDropTargetAtPoint = (x, y, interaction) => {
      const nodes = document.elementsFromPoint(x, y);
      let section = null;

      for (const node of nodes) {
        if (!(node instanceof Element)) continue;

        if (
          interaction?.node === node ||
          interaction?.node?.contains(node)
        ) {
          continue;
        }

        const candidate = getSection(node);

        if (candidate) {
          section = candidate;
          break;
        }
      }

      if (!section) {
        const { x: scaleX, y: scaleY } = getScale();

        const maxDistance =
          96 * Math.max(scaleX || 1, scaleY || 1);

        let nearestSection = null;
        let nearestDistance = Infinity;

        const availableSections = root.querySelectorAll(
          '[data-editor-section]'
        );

        for (const candidate of availableSections) {
          const rect = candidate.getBoundingClientRect();

          const distanceX = Math.max(
            rect.left - x,
            0,
            x - rect.right
          );

          const distanceY = Math.max(
            rect.top - y,
            0,
            y - rect.bottom
          );

          const distance = Math.hypot(
            distanceX,
            distanceY
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestSection = candidate;
          }
        }

        if (
          !nearestSection ||
          nearestDistance > maxDistance
        ) {
          return null;
        }

        section = nearestSection;
      }

      const sectionId = section.dataset.editorSection;

      if (!sectionId) return null;

      return {
        section,
        sectionId,
      };
    };

    const getResizeOverlay = () =>
      root.querySelector('.zuno-resize-overlay');

    const clearVisualState = (interaction) => {
      if (!interaction?.node) return;

      interaction.node.style.transform = '';
      interaction.node.style.zIndex = '';
      interaction.node.style.willChange = '';
      interaction.node.style.transition = '';
      interaction.node.classList.remove('zuno-pointer-moving');

      const overlay = getResizeOverlay();

      if (overlay) {
        overlay.style.transform = '';
      }
    };

    // Position elements freely across the entire page canvas.
    const finishElementMove = (interaction, pointerX, pointerY) => {
      const {
        onPositionElement: positionElement,
        onSelectElement: selectElement,
      } = latestRef.current;

      const sourceSectionId = interaction.sectionId;

      if (!sourceSectionId || !interaction.id) return;

      const { x: scaleX, y: scaleY } = getScale();

      const safeScaleX = scaleX || 1;
      const safeScaleY = scaleY || 1;

      const canvasRect = root.getBoundingClientRect();

      // Convert screen coordinates into coordinates
      // relative to the entire page canvas.
      const canvasX =
        (pointerX - canvasRect.left) / safeScaleX;

      const canvasY =
        (pointerY - canvasRect.top) / safeScaleY;

      // Preserve the exact point where the element was grabbed.
      const x = Math.max(
        0,
        canvasX - interaction.grabOffsetX
      );

      const y = Math.max(
        0,
        canvasY - interaction.grabOffsetY
      );

      const position = {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        positioned: true,
      };

      // Keep the element's original section association.
      // Its visual position is global to the page canvas.
      positionElement(
        interaction.id,
        sourceSectionId,
        position
      );

      selectElement(interaction.id, sourceSectionId);
    };

    const finishSectionMove = (interaction, x, y) => {
      const {
        sections: currentSections,
        onReorderSections,
        onSelectSection,
      } = latestRef.current;

      const dropTarget = getDropTargetAtPoint(
        x,
        y,
        interaction
      );

      if (!dropTarget) return;

      const targetId = dropTarget.sectionId;

      if (!targetId || targetId === interaction.id) return;

      const reordered = [...currentSections];

      const sourceIndex = reordered.findIndex(
        (section) => section.id === interaction.id
      );

      const targetIndex = reordered.findIndex(
        (section) => section.id === targetId
      );

      if (sourceIndex < 0 || targetIndex < 0) return;

      const rect = dropTarget.section.getBoundingClientRect();

      const insertAfter = y > rect.top + rect.height / 2;

      const destinationIndex =
        targetIndex + (insertAfter ? 1 : 0);

      const [movedSection] = reordered.splice(sourceIndex, 1);

      const adjustedIndex =
        sourceIndex < destinationIndex
          ? destinationIndex - 1
          : destinationIndex;

      reordered.splice(
        clamp(adjustedIndex, 0, reordered.length),
        0,
        movedSection
      );

      onReorderSections(reordered);
      onSelectSection(interaction.id);
    };

    const startInteraction = (
      event,
      type,
      id,
      sectionId,
      node
    ) => {
      const rect = node.getBoundingClientRect();
      const { x: scaleX, y: scaleY } = getScale();

      interactionRef.current = {
        type,
        id,
        sectionId,
        node,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,

        grabOffsetX: (event.clientX - rect.left) / (scaleX || 1),
        grabOffsetY: (event.clientY - rect.top) / (scaleY || 1),

        started: false,
      };

      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    };

    const handlePointerDown = (event) => {
      if (!(event.target instanceof Element)) return;

      if (
        event.target.closest(
          '[data-zuno-resize-handle], button, input, textarea, select, a'
        )
      ) {
        return;
      }

      if (!event.isPrimary) return;

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (interactionRef.current) return;

      const element = getElement(event.target);
      const section = getSection(event.target);

      const {
        selectedSectionId: currentSelectedSectionId,
        onSelectElement,
        onSelectSection,
      } = latestRef.current;

      if (element) {
        const elementId =
          element.dataset.editorElementWrapper;

        const parentSection = getSection(element);

        const sectionId =
          parentSection?.dataset.editorSection;

        if (!elementId || !sectionId) return;

        onSelectElement(elementId, sectionId);

        startInteraction(
          event,
          'element',
          elementId,
          sectionId,
          element
        );

        return;
      }

      if (section) {
        const sectionId = section.dataset.editorSection;

        if (!sectionId) return;

        if (sectionId !== currentSelectedSectionId) {
          onSelectSection(sectionId);
        }

        startInteraction(
          event,
          'section',
          sectionId,
          '',
          section
        );
      }
    };

    const handlePointerMove = (event) => {
      const interaction = interactionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;

      if (
        !interaction.started &&
        Math.hypot(dx, dy) < DRAG_THRESHOLD
      ) {
        return;
      }

      interaction.started = true;

      event.preventDefault();

      const { x: scaleX, y: scaleY } = getScale();

      const movement = `translate3d(
        ${dx / (scaleX || 1)}px,
        ${dy / (scaleY || 1)}px,
        0
      )`;

      interaction.node.style.willChange = 'transform';
      interaction.node.style.transition = 'none';
      interaction.node.style.zIndex = '80';
      interaction.node.style.transform = movement;
      interaction.node.classList.add('zuno-pointer-moving');

      if (interaction.type === 'element') {
        const overlay = getResizeOverlay();

        if (overlay) {
          overlay.style.transform = movement;
        }
      }
    };

    const finishInteraction = (event) => {
      const interaction = interactionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      interactionRef.current = null;

      if (interaction.started) {
        if (interaction.type === 'element') {
          finishElementMove(
            interaction,
            event.clientX,
            event.clientY
          );
        } else {
          finishSectionMove(
            interaction,
            event.clientX,
            event.clientY
          );
        }
      }

      clearVisualState(interaction);

      try {
        if (root.hasPointerCapture(event.pointerId)) {
          root.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore unsupported pointer capture.
      }
    };

    const handlePointerCancel = (event) => {
      const interaction = interactionRef.current;

      if (!interaction) return;

      if (
        event?.pointerId !== undefined &&
        interaction.pointerId !== event.pointerId
      ) {
        return;
      }

      interactionRef.current = null;
      clearVisualState(interaction);
    };

    root.addEventListener('pointerdown', handlePointerDown, true);

    root.addEventListener(
      'pointermove',
      handlePointerMove,
      { capture: true, passive: false }
    );

    root.addEventListener('pointerup', finishInteraction, true);

    root.addEventListener(
      'pointercancel',
      handlePointerCancel,
      true
    );

    return () => {
      root.removeEventListener('pointerdown', handlePointerDown, true);
      root.removeEventListener('pointermove', handlePointerMove, true);
      root.removeEventListener('pointerup', finishInteraction, true);
      root.removeEventListener('pointercancel', handlePointerCancel, true);

      handlePointerCancel();
    };
  }, [rootRef]);
}
