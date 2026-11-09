import { useEffect, useRef } from 'react';

const DRAG_THRESHOLD = 5;

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

    const getSectionAtPoint = (x, y, interaction) => {
      const nodes = document.elementsFromPoint(x, y);

      for (const node of nodes) {
        if (!(node instanceof Element)) continue;

        if (
          interaction?.node === node ||
          interaction?.node?.contains(node)
        ) {
          continue;
        }

        const dropzone = node.closest(
          '[data-editor-element-dropzone]'
        );

        if (dropzone?.dataset.editorElementDropzone) {
          const id = dropzone.dataset.editorElementDropzone;

          const match = root.querySelector(
            `[data-editor-section="${CSS.escape(id)}"]`
          );

          if (match) return match;
        }

        const section = getSection(node);

        if (section) return section;
      }

      return null;
    };

    const getNearestSection = (x, y) => {
      const sectionNodes = [
        ...root.querySelectorAll('[data-editor-section]'),
      ];

      if (!sectionNodes.length) return null;

      let nearest = null;
      let nearestDistance = Infinity;

      sectionNodes.forEach((section) => {
        const rect = section.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distance = Math.hypot(
          x - centerX,
          y - centerY
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = section;
        }
      });

      return nearest;
    };

    const getSectionData = (sectionId) =>
      latestRef.current.sections.find(
        (section) => section.id === sectionId
      );

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

    const finishElementMove = (interaction, pointerX, pointerY) => {
      const {
        sections: currentSections,
        onMoveElement: moveElement,
        onPositionElement: positionElement,
        onSelectElement: selectElement,
      } = latestRef.current;

      let targetSection = getSectionAtPoint(
        pointerX,
        pointerY,
        interaction
      );

      if (!targetSection) {
        targetSection = getNearestSection(pointerX, pointerY);
      }

      if (!targetSection) return;

      const targetSectionId =
        targetSection.dataset.editorSection;

      if (!targetSectionId) return;

      const sourceSectionId = interaction.sectionId;

      const sourceSection = currentSections.find(
        (section) => section.id === sourceSectionId
      );

      const targetSectionData = getSectionData(targetSectionId);

      if (!sourceSection || !targetSectionData) return;

      const sourceElement = (sourceSection.elements || []).find(
        (element) => element.id === interaction.id
      );

      if (!sourceElement) return;

      const rootRect = root.getBoundingClientRect();

      const scaleX = root.offsetWidth
        ? rootRect.width / root.offsetWidth
        : 1;

      const scaleY = root.offsetHeight
        ? rootRect.height / root.offsetHeight
        : 1;

      const sectionRect = targetSection.getBoundingClientRect();
      const elementRect = interaction.node.getBoundingClientRect();

      const elementWidth = elementRect.width / (scaleX || 1);
      const elementHeight = elementRect.height / (scaleY || 1);

      const x = clamp(
        (pointerX - sectionRect.left) / (scaleX || 1) -
          interaction.grabOffsetX,
        0,
        Math.max(0, targetSection.offsetWidth - elementWidth)
      );

      const y = clamp(
        (pointerY - sectionRect.top) / (scaleY || 1) -
          interaction.grabOffsetY,
        0,
        Math.max(0, targetSection.offsetHeight - elementHeight)
      );

      const targetElementNode = document
        .elementsFromPoint(pointerX, pointerY)
        .map(getElement)
        .find(
          (element) =>
            element &&
            element !== interaction.node &&
            !interaction.node.contains(element)
        );

      let destinationIndex = (
        targetSectionData.elements || []
      ).length;

      if (targetElementNode) {
        const targetId =
          targetElementNode.dataset.editorElementWrapper;

        const targetIndex = (
          targetSectionData.elements || []
        ).findIndex((element) => element.id === targetId);

        if (targetIndex >= 0) {
          destinationIndex = targetIndex;
        }
      }

      /*
       * IMPORTANT:
       * Persist coordinates before transferring the element.
       * The transfer then carries the updated style with it.
       */
      positionElement(
        interaction.id,
        sourceSectionId,
        {
          x: Math.round(x),
          y: Math.round(y),
          positioned: true,
        }
      );

      if (sourceSectionId !== targetSectionId) {
        moveElement(
          sourceSectionId,
          interaction.id,
          targetSectionId,
          destinationIndex
        );
      }

      selectElement(interaction.id, targetSectionId);
    };

    const finishSectionMove = (interaction, x, y) => {
      const {
        sections: currentSections,
        onReorderSections,
        onSelectSection,
      } = latestRef.current;

      const targetSection = getSectionAtPoint(x, y, interaction);

      if (!targetSection) return;

      const targetId = targetSection.dataset.editorSection;

      if (!targetId || targetId === interaction.id) return;

      const reordered = [...currentSections];

      const sourceIndex = reordered.findIndex(
        (section) => section.id === interaction.id
      );

      const targetIndex = reordered.findIndex(
        (section) => section.id === targetId
      );

      if (sourceIndex < 0 || targetIndex < 0) return;

      const rect = targetSection.getBoundingClientRect();

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
        selectedElementId: currentSelectedElementId,
        selectedSectionId: currentSelectedSectionId,
        onSelectElement,
        onSelectSection,
      } = latestRef.current;

      if (element) {
        const elementId =
          element.dataset.editorElementWrapper;

        const sectionId =
          getSection(element)?.dataset.editorSection;

        if (!elementId || !sectionId) return;

        if (elementId !== currentSelectedElementId) {
          onSelectElement(elementId, sectionId);
          return;
        }

        const rect = element.getBoundingClientRect();

        interactionRef.current = {
          type: 'element',
          id: elementId,
          sectionId,
          node: element,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          grabOffsetX: event.clientX - rect.left,
          grabOffsetY: event.clientY - rect.top,
          started: false,
        };

        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is optional.
        }

        return;
      }

      if (section) {
        const sectionId = section.dataset.editorSection;

        if (!sectionId) return;

        if (sectionId !== currentSelectedSectionId) {
          onSelectSection(sectionId);
          return;
        }

        interactionRef.current = {
          type: 'section',
          id: sectionId,
          node: section,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          started: false,
        };

        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is optional.
        }
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

      const movement = `translate3d(${dx}px, ${dy}px, 0)`;

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
