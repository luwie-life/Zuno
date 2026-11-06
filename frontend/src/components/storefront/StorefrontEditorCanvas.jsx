import { useEffect, useRef } from ‘react’;
import {
Monitor,
Tablet,
Smartphone,
ZoomIn,
ZoomOut,
Maximize2,
Plus,
Eye,
MousePointer2,
GripVertical,
} from ‘lucide-react’;

import { StorefrontRenderer } from ‘../../pages/StorefrontHome.jsx’;

const DEVICES = [
{ id: ‘desktop’, label: ‘Desktop’, icon: Monitor, width: 1200 },
{ id: ‘tablet’, label: ‘Tablet’, icon: Tablet, width: 768 },
{ id: ‘mobile’, label: ‘Mobile’, icon: Smartphone, width: 390 },
];

const DRAG_TYPE = ‘application/x-zuno-storefront-item’;

export default function StorefrontEditorCanvas({
business = {},
storefront = {},
activePage = null,
device = ‘desktop’,
setDevice = () => {},
zoom = 100,
setZoom = () => {},
selectedSectionId = ‘’,
selectedElementId = ‘’,
onSelectSection = () => {},
onSelectElement = () => {},
onReorderSections = () => {},
onReorderElements = () => {},
onAddSection = () => {},
onPreview = () => {},
}) {
const canvasRef = useRef(null);
const dragRef = useRef(null);

const currentDevice =
DEVICES.find((item) => item.id === device) || DEVICES[0];

const pageSlug = activePage?.isHome
? ‘home’
: activePage?.slug || ‘home’;

const sections = activePage?.sections || [];

const changeZoom = (amount) => {
setZoom((current) => Math.min(150, Math.max(40, current + amount)));
};

const resetZoom = () => setZoom(100);

useEffect(() => {
const root = canvasRef.current;
if (!root) return undefined;

const getElementWrapper = (target) =>
  target instanceof Element
    ? target.closest('[data-editor-element-wrapper]')
    : null;
const getSection = (target) =>
  target instanceof Element
    ? target.closest('[data-editor-section]')
    : null;
const getInsertionIndex = (items, targetId, targetRect, clientY) => {
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (targetIndex < 0) return -1;
  const after = clientY > targetRect.top + targetRect.height / 2;
  return targetIndex + (after ? 1 : 0);
};
const handleDragStart = (event) => {
  const elementWrapper = getElementWrapper(event.target);
  const sectionWrapper = getSection(event.target);
  if (elementWrapper) {
    const elementId = elementWrapper.dataset.editorElementWrapper;
    const section = sectionWrapper;
    const sectionId = section?.dataset.editorSection;
    if (!elementId || !sectionId) return;
    dragRef.current = {
      kind: 'element',
      id: elementId,
      sectionId,
    };
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      DRAG_TYPE,
      JSON.stringify(dragRef.current)
    );
    elementWrapper.classList.add('opacity-50', 'ring-2', 'ring-emerald-500');
    return;
  }
  if (sectionWrapper) {
    const sectionId = sectionWrapper.dataset.editorSection;
    if (!sectionId) return;
    dragRef.current = {
      kind: 'section',
      id: sectionId,
    };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      DRAG_TYPE,
      JSON.stringify(dragRef.current)
    );
    sectionWrapper.classList.add('opacity-50', 'ring-2', 'ring-emerald-500');
  }
};
const handleDragOver = (event) => {
  if (!dragRef.current) return;
  const elementWrapper = getElementWrapper(event.target);
  const sectionWrapper = getSection(event.target);
  if (
    dragRef.current.kind === 'element' &&
    elementWrapper &&
    elementWrapper.dataset.editorElementWrapper !== dragRef.current.id
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    return;
  }
  if (
    dragRef.current.kind === 'section' &&
    sectionWrapper &&
    sectionWrapper.dataset.editorSection !== dragRef.current.id
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }
};
const handleDrop = (event) => {
  if (!dragRef.current) return;
  const dragged = dragRef.current;
  const elementWrapper = getElementWrapper(event.target);
  const sectionWrapper = getSection(event.target);
  if (dragged.kind === 'element') {
    event.preventDefault();
    event.stopPropagation();
    if (!elementWrapper) return;
    const targetElementId =
      elementWrapper.dataset.editorElementWrapper;
    const targetSectionId =
      sectionWrapper?.dataset.editorSection;
    if (
      !targetElementId ||
      !targetSectionId ||
      targetSectionId !== dragged.sectionId ||
      targetElementId === dragged.id
    ) {
      return;
    }
    const section = sections.find(
      (item) => item.id === dragged.sectionId
    );
    if (!section) return;
    const elements = [...(section.elements || [])];
    const sourceIndex = elements.findIndex(
      (item) => item.id === dragged.id
    );
    const targetIndex = getInsertionIndex(
      elements,
      targetElementId,
      elementWrapper.getBoundingClientRect(),
      event.clientY
    );
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = elements.splice(sourceIndex, 1);
    const adjustedIndex =
      sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    elements.splice(adjustedIndex, 0, moved);
    onReorderElements(dragged.sectionId, elements);
    onSelectElement(dragged.id, dragged.sectionId);
    return;
  }
  if (dragged.kind === 'section') {
    event.preventDefault();
    if (!sectionWrapper) return;
    const targetSectionId =
      sectionWrapper.dataset.editorSection;
    if (!targetSectionId || targetSectionId === dragged.id) return;
    const reordered = [...sections];
    const sourceIndex = reordered.findIndex(
      (item) => item.id === dragged.id
    );
    const targetIndex = getInsertionIndex(
      reordered,
      targetSectionId,
      sectionWrapper.getBoundingClientRect(),
      event.clientY
    );
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = reordered.splice(sourceIndex, 1);
    const adjustedIndex =
      sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(adjustedIndex, 0, moved);
    onReorderSections(reordered);
    onSelectSection(dragged.id);
  }
};
const handleDragEnd = () => {
  root
    .querySelectorAll('.opacity-50')
    .forEach((node) => {
      node.classList.remove(
        'opacity-50',
        'ring-2',
        'ring-emerald-500'
      );
    });
  dragRef.current = null;
};
const handlePointerDown = (event) => {
  const elementWrapper = getElementWrapper(event.target);
  const sectionWrapper = getSection(event.target);
  if (elementWrapper) {
    elementWrapper.setAttribute('draggable', 'true');
    return;
  }
  if (sectionWrapper) {
    sectionWrapper.setAttribute('draggable', 'true');
  }
};
const handleClick = (event) => {
  const elementWrapper = getElementWrapper(event.target);
  if (elementWrapper) {
    const elementId = elementWrapper.dataset.editorElementWrapper;
    const sectionId = getSection(elementWrapper)?.dataset.editorSection;
    if (elementId) {
      event.preventDefault();
      event.stopPropagation();
      onSelectElement(elementId, sectionId);
    }
  }
};
root.addEventListener('pointerdown', handlePointerDown, true);
root.addEventListener('dragstart', handleDragStart, true);
root.addEventListener('dragover', handleDragOver, true);
root.addEventListener('drop', handleDrop, true);
root.addEventListener('dragend', handleDragEnd, true);
root.addEventListener('click', handleClick, true);
return () => {
  root.removeEventListener('pointerdown', handlePointerDown, true);
  root.removeEventListener('dragstart', handleDragStart, true);
  root.removeEventListener('dragover', handleDragOver, true);
  root.removeEventListener('drop', handleDrop, true);
  root.removeEventListener('dragend', handleDragEnd, true);
  root.removeEventListener('click', handleClick, true);
};

}, [
sections,
onReorderSections,
onReorderElements,
onSelectElement,
onSelectSection,
]);

return (
{activePage?.title || ‘Your storefront’}
{activePage?.isHome ? ‘Homepage’ : /${activePage?.slug || ''}}
    <div className="hidden shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
      {DEVICES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setDevice(id)}
          title={`${label} preview`}
          aria-label={`${label} preview`}
          aria-pressed={device === id}
          className={`flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 transition ${
            device === id
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon size={15} />
          <span className="hidden text-[10px] font-semibold lg:inline">
            {label}
          </span>
        </button>
      ))}
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => changeZoom(-10)}
        disabled={zoom <= 40}
        title="Zoom out"
        aria-label="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
      >
        <ZoomOut size={15} />
      </button>
      <button
        type="button"
        onClick={resetZoom}
        title="Reset zoom"
        className="min-w-[42px] rounded-lg px-1 py-2 text-center text-[10px] font-bold text-slate-600 hover:bg-slate-100"
      >
        {zoom}%
      </button>
      <button
        type="button"
        onClick={() => changeZoom(10)}
        disabled={zoom >= 150}
        title="Zoom in"
        aria-label="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
      >
        <ZoomIn size={15} />
      </button>
      <button
        type="button"
        onClick={resetZoom}
        title="Fit preview"
        aria-label="Fit preview"
        className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:flex"
      >
        <Maximize2 size={14} />
      </button>
    </div>
    <button
      type="button"
      onClick={onPreview}
      title="Open storefront preview"
      aria-label="Open storefront preview"
      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:flex"
    >
      <Eye size={15} />
    </button>
  </div>
  <div className="flex shrink-0 items-center justify-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:hidden">
    {DEVICES.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => setDevice(id)}
        aria-pressed={device === id}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
          device === id
            ? 'bg-emerald-50 text-emerald-800'
            : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Icon size={15} />
        {label}
      </button>
    ))}
  </div>
  <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
    <div className="flex min-h-full min-w-full items-start justify-center p-3 sm:p-5 md:p-8">
      <div
        className="relative shrink-0 transition-[width] duration-200 ease-out"
        style={{
          width: `${currentDevice.width}px`,
          maxWidth: '100%',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <span className="rounded-md bg-white px-2 py-1 shadow-sm">
              {currentDevice.label}
            </span>
            <span>{currentDevice.width}px preview</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </span>
        </div>
        <div
          ref={canvasRef}
          className="relative origin-top overflow-hidden bg-white shadow-[0_8px_40px_rgba(15,23,42,0.10)] ring-1 ring-slate-200 transition-transform duration-200"
          style={{
            width: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: `${Math.max(0, (zoom - 100) * 8)}px`,
          }}
        >
          <StorefrontRenderer
            pageSlug={pageSlug}
            biz={business}
            storefront={storefront}
            slug={business.slug || ''}
            storeBase={business.slug ? `/store/${business.slug}` : ''}
            color={
              storefront.theme?.primaryColor ||
              business.brandColor ||
              '#0B3D2E'
            }
            editorMode
            selectedSectionId={selectedSectionId}
            selectedElementId={selectedElementId}
            onSelectSection={onSelectSection}
            onSelectElement={onSelectElement}
          />
          {!sections.length && (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MousePointer2 size={24} />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Start building your page
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Add sections to introduce your business, showcase your
                products or services, and help visitors take action.
              </p>
              <button
                type="button"
                onClick={onAddSection}
                className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Plus size={16} />
                Add your first section
              </button>
            </div>
          )}
        </div>
        <div className="py-5 text-center">
          <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
            <GripVertical size={12} />
            Drag sections or elements to change their order
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

);
}
