import { useEffect, useRef } from 'react';

const DRAG_THRESHOLD = 5;

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
  };

  useEffect(() => {
    const root = rootRef?.current;

    if (!root) return undefined;

    const selected = selectedElementId
      ? root.querySelector(
          `[data-editor-element-wrapper="${CSS.escape(
            selectedElementId
          )}"]`
        )
      : selectedSectionId
        ? root.querySelector(
            `[data-editor-section="${CSS.escape(
              selectedSectionId
            )}"]`
          )
        : null;

    if (!selected) return undefined;

    const previousTouchAction = selected.style.touchAction;

    selected.style.touchAction = 'none';

    return () => {
      selected.style.touchAction = previousTouchAction;
    };
  }, [
    rootRef,
    selectedElementId,
    selectedSectionId,
  ]);

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

    const getDropTargets = (x, y, interaction) => {
      const nodes = document.elementsFromPoint(x, y);

      let targetElement = null;
      let targetSection = null;

      for (const node of nodes) {
        if (!(node instanceof Element)) continue;

        if (
          interaction.node === node ||
          interaction.node.contains(node)
        ) {
          continue;
        }

        // First identify an actual editable element.
        const element = getElement(node);

        if (
          interaction.type === 'element' &&
          element &&
          element !== interaction.node &&
          !interaction.node.contains(element)
        ) {
          targetElement = element;
        }

        // Prefer the explicit dropzone's section ID.
        const dropzone = node.closest(
          '[data-editor-element-dropzone]'
        );

        if (dropzone) {
          const dropzoneSectionId =
            dropzone.dataset.editorElementDropzone;

          if (dropzoneSectionId) {
            const matchingSection = root.querySelector(
              `[data-editor-section="${CSS.escape(
                dropzoneSectionId
              )}"]`
            );

            if (matchingSection) {
              targetSection = matchingSection;
            }
          }
        }

        // Fall back to the nearest section wrapper.
        if (!targetSection) {
          const section = getSection(node);

          if (
            section &&
            section.dataset.editorSection
          ) {
            targetSection = section;
          }
        }

        if (
          interaction.type === 'section' &&
          targetSection
        ) {
          break;
        }

        if (
          interaction.type === 'element' &&
          targetElement &&
          targetSection
        ) {
          break;
        }
      }

      return {
        targetElement,
        targetSection,
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

      const resizeOverlay = getResizeOverlay();

      if (resizeOverlay) {
        resizeOverlay.style.transform = '';
      }

      interaction.node.classList.remove(
        'zuno-pointer-moving'
      );
    };

    const finishElementMove = (interaction, x, y) => {
      const {
        sections: currentSections,
        onMoveElement,
        onReorderElements,
        onSelectElement,
      } = latestRef.current;

      const {
        targetElement,
        targetSection,
      } = getDropTargets(x, y, interaction);

      if (!targetSection) return;

      const sourceSectionId = interaction.sectionId;

      const targetSectionId =
        targetSection.dataset.editorSection;

      if (!targetSectionId) return;

      const sourceSection = currentSections.find(
        (section) => section.id === sourceSectionId
      );

      const targetSectionData = currentSections.find(
        (section) => section.id === targetSectionId
      );

      if (!sourceSection || !targetSectionData) return;

      const sourceElements = [
        ...(sourceSection.elements || []),
      ];

      const sourceIndex = sourceElements.findIndex(
        (element) => element.id === interaction.id
      );

      if (sourceIndex < 0) return;

      let destinationIndex = (
        targetSectionData.elements || []
      ).length;

      if (targetElement) {
        const targetId =
          targetElement.dataset.editorElementWrapper;

        const targetIndex = (
          targetSectionData.elements || []
        ).findIndex(
          (element) => element.id === targetId
        );

        if (targetIndex >= 0) {
          const rect = targetElement.getBoundingClientRect();

          const horizontal =
            rect.width > rect.height * 1.35;

          const insertAfter = horizontal
            ? x > rect.left + rect.width / 2
            : y > rect.top + rect.height / 2;

          destinationIndex =
            targetIndex + (insertAfter ? 1 : 0);
        }
      }

      if (sourceSectionId === targetSectionId) {
        const [movedElement] = sourceElements.splice(
          sourceIndex,
          1
        );

        const adjustedIndex =
          sourceIndex < destinationIndex
            ? destinationIndex - 1
            : destinationIndex;

        sourceElements.splice(
          Math.max(
            0,
            Math.min(adjustedIndex, sourceElements.length)
          ),
          0,
          movedElement
        );

        onReorderElements(
          sourceSectionId,
          sourceElements
        );
      } else {
        onMoveElement(
          sourceSectionId,
          interaction.id,
          targetSectionId,
          destinationIndex
        );
      }

      onSelectElement(
        interaction.id,
        targetSectionId
      );
    };

    const finishSectionMove = (interaction, x, y) => {
      const {
        sections: currentSections,
        onReorderSections,
        onSelectSection,
      } = latestRef.current;

      const { targetSection } = getDropTargets(
        x,
        y,
        interaction
      );

      if (!targetSection) return;

      const targetId =
        targetSection.dataset.editorSection;

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

      const insertAfter =
        y > rect.top + rect.height / 2;

      const destinationIndex =
        targetIndex + (insertAfter ? 1 : 0);

      const [movedSection] = reordered.splice(
        sourceIndex,
        1
      );

      const adjustedIndex =
        sourceIndex < destinationIndex
          ? destinationIndex - 1
          : destinationIndex;

      reordered.splice(
        Math.max(
          0,
          Math.min(adjustedIndex, reordered.length)
        ),
        0,
        movedSection
      );

      onReorderSections(reordered);
      onSelectSection(interaction.id);
    };

    const handlePointerDown = (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-zuno-resize-handle]')
      ) {
        return;
      }

      if (!event.isPrimary) return;

      if (
        event.pointerType === 'mouse' &&
        event.button !== 0
      ) {
        return;
      }

      if (interactionRef.current) return;

      const element = getElement(event.target);
      const section = getSection(event.target);

      const {
        selectedElementId,
        selectedSectionId,
        onSelectElement,
        onSelectSection,
      } = latestRef.current;

      if (element) {
        const elementId =
          element.dataset.editorElementWrapper;

        const sectionId =
          getSection(element)?.dataset.editorSection;

        if (!elementId || !sectionId) return;

        if (elementId !== selectedElementId) {
          onSelectElement(elementId, sectionId);
          return;
        }

        interactionRef.current = {
          type: 'element',
          id: elementId,
          sectionId,
          node: element,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          started: false,
        };

        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture may be unavailable.
        }

        return;
      }

      if (section) {
        const sectionId =
          section.dataset.editorSection;

        if (!sectionId) return;

        if (sectionId !== selectedSectionId) {
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
          // Pointer capture may be unavailable.
        }
      }
    };

    const handlePointerMove = (event) => {
      const interaction = interactionRef.current;

      if (!interaction) return;

      if (interaction.pointerId !== event.pointerId) return;

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

      const node = interaction.node;

      node.style.willChange = 'transform';
      node.style.transition = 'none';
      node.style.zIndex = '80';

      const movement = `translate3d(${dx}px, ${dy}px, 0)`;

      node.style.transform = movement;

      // Keep the resize outline visually attached to the element.
      if (interaction.type === 'element') {
        const resizeOverlay = getResizeOverlay();

        if (resizeOverlay) {
          resizeOverlay.style.transform = movement;
        }
      }

      node.classList.add('zuno-pointer-moving');
    };

    const finishInteraction = (event) => {
      const interaction = interactionRef.current;

      if (!interaction) return;

      if (interaction.pointerId !== event.pointerId) return;

      interactionRef.current = null;

      if (interaction.started) {
        if (interaction.type === 'element') {
          finishElementMove(
            interaction,
            event.clientX,
            event.clientY
          );
        }

        if (interaction.type === 'section') {
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

    root.addEventListener(
      'pointerdown',
      handlePointerDown,
      true
    );

    root.addEventListener(
      'pointermove',
      handlePointerMove,
      {
        capture: true,
        passive: false,
      }
    );

    root.addEventListener(
      'pointerup',
      finishInteraction,
      true
    );

    root.addEventListener(
      'pointercancel',
      handlePointerCancel,
      true
    );

    return () => {
      root.removeEventListener(
        'pointerdown',
        handlePointerDown,
        true
      );

      root.removeEventListener(
        'pointermove',
        handlePointerMove,
        true
      );

      root.removeEventListener(
        'pointerup',
        finishInteraction,
        true
      );

      root.removeEventListener(
        'pointercancel',
        handlePointerCancel,
        true
      );

      handlePointerCancel();
    };
  }, [rootRef]);
}
