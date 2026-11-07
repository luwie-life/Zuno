import { useRef } from 'react';
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
} from 'lucide-react';

import { StorefrontRenderer } from '../../pages/StorefrontHome.jsx';
import useStorefrontPointerInteractions from '../../hooks/useStorefrontPointerInteractions.js';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 1200 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 390 },
];

export default function StorefrontEditorCanvas({
  business = {},
  storefront = {},
  activePage = null,
  device = 'desktop',
  setDevice = () => {},
  zoom = 100,
  setZoom = () => {},
  selectedSectionId = '',
  selectedElementId = '',
  onSelectSection = () => {},
  onSelectElement = () => {},
  onReorderSections = () => {},
  onReorderElements = () => {},
  onMoveElement = () => {},
  onAddSection = () => {},
  onPreview = () => {},
}) {
  const canvasRef = useRef(null);

  const currentDevice =
    DEVICES.find((item) => item.id === device) || DEVICES[0];

  const pageSlug = activePage?.isHome
    ? 'home'
    : activePage?.slug || 'home';

  const sections = activePage?.sections || [];

  useStorefrontPointerInteractions({
    rootRef: canvasRef,
    sections,
    selectedSectionId,
    selectedElementId,
    onSelectSection,
    onSelectElement,
    onReorderSections,
    onReorderElements,
    onMoveElement,
  });

  const changeZoom = (amount) => {
    setZoom((current) => Math.min(150, Math.max(40, current + amount)));
  };

  const resetZoom = () => setZoom(100);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f1f2f5]">
      {/* TOP TOOLBAR */}
      <div className="z-10 flex min-h-[52px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-800">
            {activePage?.title || 'Your storefront'}
          </p>

          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {activePage?.isHome ? 'Homepage' : `/${activePage?.slug || ''}`}
          </p>
        </div>

        {/* DESKTOP DEVICE SELECTOR */}
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

        {/* ZOOM CONTROLS */}
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

        {/* PREVIEW */}
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

      {/* MOBILE DEVICE SELECTOR */}
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

      {/* CANVAS SCROLL AREA */}
      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        <div className="flex min-h-full min-w-full items-start justify-center p-3 sm:p-5 md:p-8">
          <div
            className="relative shrink-0 transition-[width] duration-200 ease-out"
            style={{
              width: `${currentDevice.width}px`,
              maxWidth: '100%',
            }}
          >
            {/* CANVAS INFORMATION */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                  {currentDevice.label}
                </span>

                <span>{currentDevice.width}px preview</span>
              </div>

              <span className="text-[10px] text-slate-400">
                {sections.length}{' '}
                {sections.length === 1 ? 'section' : 'sections'}
              </span>
            </div>

            {/* STOREFRONT CANVAS */}
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
                storeBase={
                  business.slug ? `/store/${business.slug}` : ''
                }
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

              {/* EMPTY PAGE STATE */}
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

            {/* EDITOR INSTRUCTIONS */}
            <div className="py-5 text-center">
              <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                <GripVertical size={12} />
                Tap an element to select it, then drag to move it.
                Select a section before dragging it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
