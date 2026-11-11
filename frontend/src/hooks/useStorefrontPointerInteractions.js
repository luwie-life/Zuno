import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createDragSnapshot, dragPosition } from '../lib/editorDrag.js';

const DRAG_THRESHOLD = 3;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const transientStyles = (node) => ({ transform: node.style.transform, zIndex: node.style.zIndex, willChange: node.style.willChange, transition: node.style.transition });

export default function useStorefrontPointerInteractions(options) {
  const { rootRef, selectedElementId = '', selectedSectionId = '' } = options;
  const latest = useRef(options);
  const active = useRef(null);
  latest.current = options;

  useEffect(() => {
    const root = rootRef?.current;
    if (!root) return;
    const selector = selectedElementId
      ? `[data-editor-element-wrapper="${CSS.escape(selectedElementId)}"]`
      : selectedSectionId ? `[data-editor-section="${CSS.escape(selectedSectionId)}"]` : '';
    const node = selector ? root.querySelector(selector) : null;
    if (!node) return;
    const previous = node.style.touchAction;
    node.style.touchAction = 'none';
    return () => { node.style.touchAction = previous; };
  }, [rootRef, selectedElementId, selectedSectionId]);

  useEffect(() => {
    const root = rootRef?.current;
    if (!root) return;
    const closest = (target, selector) => target instanceof Element ? target.closest(selector) : null;
    const sectionFor = (target) => closest(target, '[data-editor-section]');
    const elementFor = (target) => closest(target, '[data-editor-element-wrapper]');

    const cleanup = (interaction) => {
      Object.assign(interaction.node.style, interaction.styles);
      if (!interaction.hadMovingClass) interaction.node.classList.remove('zuno-pointer-moving');
      if (interaction.overlay) interaction.overlay.style.transform = interaction.overlayTransform;
      root.style.transition = interaction.rootTransition;
      try {
        if (root.hasPointerCapture(interaction.pointerId)) root.releasePointerCapture(interaction.pointerId);
      } catch { /* Capture may already have been lost. */ }
    };
    const cancel = (event) => {
      const interaction = active.current;
      if (!interaction || (event?.pointerId !== undefined && event.pointerId !== interaction.pointerId)) return;
      active.current = null;
      cleanup(interaction);
    };
    const dropSection = (interaction, event) => {
      let target = null;
      for (const node of document.elementsFromPoint(event.clientX, event.clientY)) {
        if (interaction.node === node || interaction.node.contains(node)) continue;
        const candidate = sectionFor(node);
        if (candidate && root.contains(candidate)) { target = candidate; break; }
      }
      if (!target) {
        let distance = Infinity;
        for (const candidate of root.querySelectorAll('[data-editor-section]')) {
          if (candidate === interaction.node) continue;
          const rect = candidate.getBoundingClientRect();
          const next = Math.hypot(Math.max(rect.left - event.clientX, 0, event.clientX - rect.right), Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom));
          if (next < distance) { distance = next; target = candidate; }
        }
        if (distance > 96 * Math.max(interaction.snapshot.scaleX, interaction.snapshot.scaleY)) return;
      }
      if (!target || target.dataset.editorSection === interaction.id) return;
      const sections = [...(latest.current.sections || [])];
      const from = sections.findIndex((section) => section.id === interaction.id);
      const to = sections.findIndex((section) => section.id === target.dataset.editorSection);
      if (from < 0 || to < 0) return;
      const rect = target.getBoundingClientRect();
      const destination = to + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
      const [moved] = sections.splice(from, 1);
      sections.splice(clamp(from < destination ? destination - 1 : destination, 0, sections.length), 0, moved);
      latest.current.onReorderSections?.(sections);
    };
    const down = (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || active.current) return;
      if (closest(event.target, '[data-zuno-resize-handle], input, textarea, select, [contenteditable="true"]')) return;
      const element = elementFor(event.target);
      const section = sectionFor(event.target);
      const node = element || section;
      if (!node || !root.contains(node)) return;
      const id = element ? element.dataset.editorElementWrapper : section.dataset.editorSection;
      const sectionId = section?.dataset.editorSection;
      if (!id || !sectionId) return;
      const rootTransition = root.style.transition;
      root.style.transition = 'none';
      const snapshot = createDragSnapshot(node.getBoundingClientRect(), root.getBoundingClientRect(), root.offsetWidth, root.offsetHeight, event);
      const overlay = element && latest.current.selectedElementId === id ? root.querySelector('.zuno-resize-overlay') : null;
      active.current = { node, id, sectionId, type: element ? 'element' : 'section', snapshot, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, started: false, styles: transientStyles(node), rootTransition, overlay, overlayTransform: overlay?.style.transform || '', hadMovingClass: node.classList.contains('zuno-pointer-moving') };
      try { root.setPointerCapture(event.pointerId); } catch { /* Optional on older browsers. */ }
    };
    const move = (event) => {
      const interaction = active.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;
      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;
      if (!interaction.started && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      interaction.started = true;
      event.preventDefault();
      const position = dragPosition(interaction.snapshot, event, root.getBoundingClientRect());
      const x = interaction.type === 'element' ? position.x - interaction.snapshot.originX : dx / interaction.snapshot.scaleX;
      const y = interaction.type === 'element' ? position.y - interaction.snapshot.originY : dy / interaction.snapshot.scaleY;
      const translation = `translate3d(${x}px, ${y}px, 0)`;
      const original = interaction.styles.transform;
      Object.assign(interaction.node.style, { transform: `${translation}${original && original !== 'none' ? ` ${original}` : ''}`, transition: 'none', willChange: 'transform', zIndex: '80' });
      interaction.node.classList.add('zuno-pointer-moving');
      if (interaction.overlay) interaction.overlay.style.transform = translation;
    };
    const up = (event) => {
      const interaction = active.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;
      active.current = null;
      try {
        flushSync(() => {
          if (interaction.started) {
            if (interaction.type === 'element') latest.current.onPositionElement?.(interaction.id, interaction.sectionId, dragPosition(interaction.snapshot, event, root.getBoundingClientRect()));
            else dropSection(interaction, event);
          }
          if (interaction.type === 'element') latest.current.onSelectElement?.(interaction.id, interaction.sectionId);
          else latest.current.onSelectSection?.(interaction.id);
        });
      } finally { cleanup(interaction); }
    };
    const nativeDrag = (event) => { if (elementFor(event.target)) event.preventDefault(); };
    root.addEventListener('pointerdown', down, true);
    root.addEventListener('pointermove', move, { capture: true, passive: false });
    root.addEventListener('pointerup', up, true);
    root.addEventListener('pointercancel', cancel, true);
    root.addEventListener('lostpointercapture', cancel, true);
    root.addEventListener('dragstart', nativeDrag, true);
    return () => {
      root.removeEventListener('pointerdown', down, true);
      root.removeEventListener('pointermove', move, true);
      root.removeEventListener('pointerup', up, true);
      root.removeEventListener('pointercancel', cancel, true);
      root.removeEventListener('lostpointercapture', cancel, true);
      root.removeEventListener('dragstart', nativeDrag, true);
      cancel();
    };
  }, [rootRef]);
}
