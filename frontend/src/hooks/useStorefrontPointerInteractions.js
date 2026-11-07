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

    const clearVisualState = (interaction) => {
      if (!interaction?.node) return;

      interaction.node.style.transform = '';
      interaction.node.style.zIndex = '';
      interaction.node.style.position = '';
      interaction.node.style.willChange = '';
      interaction.node.style.transition = '';
    };

    const getDropTargets = (x, y, draggedNode) => {
      const nodes = document.elementsFromPoint(x, y);

      let targetElement = null;
      let targetSection = null;

      for (const node of nodes) {
        if (!(node instanceof Element)) continue;

        const element = getElement(node);
        const section = getSection(node);

        if (
          element &&
          element !== draggedNode &&
          !draggedNode?.contains(element)
        ) {
          targetElement = element;
        }

        if (section && !targetSection) {
          targetSection = section;
        }

        if (targetElement && targetSection) break;
      }

      return { targetElement, targetSection };
    };

    const getElementDestination = (
      targetSectionId,
      targetElement,
      x,
      y
    ) => {
      const targetSection = sections.find(
        (section) => section.id === targetSectionId
      );

      if (!targetSection) return null;

      const elements = [...(targetSection.elements || [])];

      if (!targetElement) {
        return elements.length;
      }

      const targetId =
        targetElement.dataset.editorElementWrapper;

      const targetIndex = elements.findIndex(
        (element) => element.id === targetId
      );

      if (targetIndex < 0) return elements.length;

      const rect = targetElement.getBoundingClientRect();

      const horizontal = rect.width > rect.height * 1.35;

      const insertAfter = horizontal
        ? x > rect.left + rect.width / 2
        : y > rect.top + rect.height / 2;

      return targetIndex + (insertAfter ? 1 : 0);
    };

    const finishElementMove = (interaction, x, y) => {
      const { targetElement, targetSection } = getDropTargets(
        x,
        y,
        interaction.node
      );

      if (!targetSection) return;

      const sourceSectionId = interaction.sectionId;
      const targetSectionId =
        targetSection.dataset.editorSection;

      if (!targetSectionId) return;

      const sourceSection = sections.find(
        (section) => section.id === sourceSectionId
      );

      const targetSectionData = sections.find(
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

      const destinationIndex = getElementDestination(
        targetSectionId,
        targetElement,
        x,
        y
      );

      if (destinationIndex === null) return;

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

        onReorderElements(sourceSectionId, sourceElements);
      } else {
        onMoveElement(
          sourceSectionId,
          interaction.id,
          targetSectionId,
          destinationIndex
        );
      }

      onSelectElement(interaction.id, targetSectionId);
    };

    const finishSectionMove = (interaction, x, y) => {
      const { targetSection } = getDropTargets(
        x,
        y,
        interaction.node
      );

      if (!targetSection) return;

      const targetId = targetSection.dataset.editorSection;

      if (!targetId || targetId === interaction.id) return;

      const reordered = [...sections];

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
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const element = getElement(event.target);
      const section = getSection(event.target);

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
          lastX: event.clientX,
          lastY: event.clientY,
          started: false,
        };

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
          lastX: event.clientX,
          lastY: event.clientY,
          started: false,
        };
      }
    };

    const handlePointerMove = (event) => {
      const interaction = interactionRef.current;

      if (!interaction) return;
      if (interaction.pointerId !== event.pointerId) return;

      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;

      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;

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
      node.style.transform =
        `translate3d(${dx}px, ${dy}px, 0)`;

      node.classList.add('zuno-pointer-moving');
    };

    const handlePointerUp = (event) => {
      const interaction = interactionRef.current;

      if (!interaction) return;
      if (interaction.pointerId !== event.pointerId) return;

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

      interaction.node.classList.remove(
        'zuno-pointer-moving'
      );

      interactionRef.current = null;
    };

    const handlePointerCancel = () => {
      const interaction = interactionRef.current;

      if (!interaction) return;

      clearVisualState(interaction);

      interaction.node.classList.remove(
        'zuno-pointer-moving'
      );

      interactionRef.current = null;
    };

    root.addEventListener(
      'pointerdown',
      handlePointerDown,
      true
    );

    root.addEventListener(
      'pointermove',
      handlePointerMove,
      true
    );

    root.addEventListener(
      'pointerup',
      handlePointerUp,
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
        handlePointerUp,
        true
      );

      root.removeEventListener(
        'pointercancel',
        handlePointerCancel,
        true
      );

      handlePointerCancel();
    };
  }, [
    rootRef,
    sections,
    selectedSectionId,
    selectedElementId,
    onSelectSection,
    onSelectElement,
    onReorderSections,
    onReorderElements,
    onMoveElement,
  ]);
}
