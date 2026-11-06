import {
  Layers,
  Palette,
  LayoutTemplate,
  FileText,
  Settings2,
  X,
} from 'lucide-react';

import PageManager from './storefront-editor/PageManager.jsx';
import LayerManager from './storefront-editor/LayerManager.jsx';
import ColorStudio from './storefront-editor/ColorStudio.jsx';
import ElementInspector from './storefront-editor/ElementInspector.jsx';
import SectionInspector from './storefront-editor/SectionInspector.jsx';
import StorefrontTemplatePanel from './StorefrontTemplatePanel.jsx';

const PANEL_ITEMS = [
  {
    id: 'layers',
    label: 'Layers',
    icon: Layers,
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: FileText,
  },
  {
    id: 'theme',
    label: 'Brand',
    icon: Palette,
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: LayoutTemplate,
  },
];

export default function StorefrontEditorPanels({
  panel = 'layers',
  setPanel = () => {},

  pages = [],
  activePage = null,
  activePageId = '',

  selectedElement = null,
  selectedSection = null,

  theme = {},
  onUpdateTheme = () => {},

  pageManagerProps = {},
  layerManagerProps = {},
  elementInspectorProps = {},
  sectionInspectorProps = {},
  templateProps = {},

  businessType = 'product',
  businessName = '',
  currentConfig = {},

  onApplyTemplate = () => {},
  onCloseTemplates = () => {},

  onClose = () => {},
  mobile = false,
}) {
  const panelTitle = {
    layers: 'Layers',
    pages: 'Pages',
    theme: 'Brand settings',
    templates: 'Template library',
    inspector: selectedElement
      ? 'Edit element'
      : selectedSection
        ? 'Edit section'
        : 'Inspector',
  };

  const renderPanelContent = () => {
    switch (panel) {
      case 'layers':
        return (
          <LayerManager
            pages={pages}
            activePage={activePage}
            {...layerManagerProps}
          />
        );

      case 'pages':
        return (
          <PageManager
            pages={pages}
            activePageId={activePageId}
            {...pageManagerProps}
          />
        );

      case 'theme':
        return (
          <ColorStudio
            theme={theme}
            onUpdate={onUpdateTheme}
          />
        );

      case 'inspector':
        if (selectedElement) {
          return (
            <ElementInspector
              element={selectedElement}
              {...elementInspectorProps}
            />
          );
        }

        if (selectedSection) {
          return (
            <SectionInspector
              section={selectedSection}
              {...sectionInspectorProps}
            />
          );
        }

        return (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Settings2 size={30} className="text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Nothing selected
            </p>

            <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
              Select a section or element on your storefront to customize it.
            </p>
          </div>
        );

      case 'templates':
        return (
          <StorefrontTemplatePanel
            businessType={businessType}
            businessName={businessName}
            currentConfig={currentConfig}
            onClose={onCloseTemplates}
            onApply={onApplyTemplate}
            {...templateProps}
          />
        );

      default:
        return (
          <LayerManager
            pages={pages}
            activePage={activePage}
            {...layerManagerProps}
          />
        );
    }
  };

  return (
    <div
      className={`flex min-h-0 flex-col bg-white ${
        mobile
          ? 'w-full'
          : 'h-full w-full'
      }`}
    >
      {/* PANEL HEADER */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-900">
            {panelTitle[panel] || 'Editor'}
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            {panel === 'inspector'
              ? 'Customize the selected content'
              : panel === 'theme'
                ? 'Control your storefront appearance'
                : panel === 'templates'
                  ? 'Choose a starting design'
                  : panel === 'pages'
                    ? 'Manage your storefront pages'
                    : 'Organize your storefront content'}
          </p>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor panel"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* DESKTOP PANEL NAVIGATION */}
      {!mobile && (
        <div className="grid shrink-0 grid-cols-4 gap-1 border-b border-slate-100 p-2">
          {PANEL_ITEMS.map(({ id, label, icon: Icon }) => {
            const active =
              panel === id ||
              (id === 'layers' && panel === 'inspector');

            return (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-3 text-[10px] font-semibold transition ${
                  active
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* MOBILE PANEL NAVIGATION */}
      {mobile && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 px-3 py-2">
          {PANEL_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanel(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                panel === id
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* PANEL CONTENT */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          mobile ? 'px-3 py-3' : 'p-4'
        }`}
      >
        {renderPanelContent()}
      </div>
    </div>
  );
}
