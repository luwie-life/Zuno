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

    // Identify the destination section and its actual
    // positioned container.
    const getDropTargetAtPoint = (x, y, interaction) => {
      const nodes = document.elementsFromPoint(x, y);
      let section = null;

      // First detect the section directly beneath the pointer.
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

      // If the pointer is in a gap between sections,
      // identify the nearest section within a safe distance.
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

      // Find the section's dropzone even when the pointer
      // is over empty space.
      const dropzone = section.matches(
        '[data-editor-element-dropzone]'
      )
        ? section
        : section.querySelector(
            '[data-editor-element-dropzone]'
          );

      let container = dropzone || section;

      // Find the actual positioned ancestor used by
      // absolutely positioned storefront elements.
      while (
        container &&
        container !== root &&
        window.getComputedStyle(container).position === 'static'
      ) {
        container = container.parentElement;
      }

      if (!container || container === root) {
        container = section;
      }

      return {
        section,
        sectionId,
        container,
      };
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

    // Calculate and commit the element's final destination
    // and exact position.
    const finishElementMove = (interaction, pointerX, pointerY) => {
      const {
        sections: currentSections,
        onMoveElement: moveElement,
        onPositionElement: positionElement,
        onSelectElement: selectElement,
      } = latestRef.current;

      const dropTarget = getDropTargetAtPoint(
        pointerX,
        pointerY,
        interaction
      );

      if (!dropTarget) return;

      const {
        sectionId: targetSectionId,
        container,
      } = dropTarget;

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

      const { x: scaleX, y: scaleY } = getScale();

      const safeScaleX = scaleX || 1;
      const safeScaleY = scaleY || 1;

      const containerRect = container.getBoundingClientRect();
      const elementRect = interaction.node.getBoundingClientRect();

      // Convert the element dimensions into canvas coordinates.
      const elementWidth = elementRect.width / safeScaleX;
      const elementHeight = elementRect.height / safeScaleY;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Convert viewport coordinates into the destination
      // container's local content coordinates.
      const localPointerX =
        (pointerX - containerRect.left) / safeScaleX -
        container.clientLeft +
        container.scrollLeft;

      const localPointerY =
        (pointerY - containerRect.top) / safeScaleY -
        container.clientTop +
        container.scrollTop;

      // Preserve the exact point where the element was grabbed.
      const x = clamp(
        localPointerX - interaction.grabOffsetX,
        0,
        Math.max(0, containerWidth - elementWidth)
      );

      const y = clamp(
        localPointerY - interaction.grabOffsetY,
        0,
        Math.max(0, containerHeight - elementHeight)
      );

      // Determine the insertion position if the pointer
      // is over another element.
      const targetElementNode = document
        .elementsFromPoint(pointerX, pointerY)
        .map(getElement)
        .find((element) => {
          if (!element || element === interaction.node) {
            return false;
          }

          if (interaction.node.contains(element)) {
            return false;
          }

          const parentSection = getSection(element);

          return (
            parentSection?.dataset.editorSection === targetSectionId
          );
        });

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

      const position = {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        positioned: true,
      };

      if (sourceSectionId !== targetSectionId) {
        // Move the element and save its position together.
        moveElement(
          sourceSectionId,
          interaction.id,
          targetSectionId,
          destinationIndex,
          position
        );
      } else {
        positionElement(
          interaction.id,
          sourceSectionId,
          position
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
