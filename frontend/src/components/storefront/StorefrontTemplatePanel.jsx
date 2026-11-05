import { useMemo, useState } from 'react';
import { Search, Check, X, LayoutTemplate } from 'lucide-react';

import {
  getStorefrontTemplates,
  getTemplateCategories,
  applyStorefrontTemplate,
} from '../../lib/storefrontTemplates.js';

export default function StorefrontTemplatePanel({
  businessType = 'product',
  businessName = '',
  currentConfig,
  onApply,
  onClose,
}) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [applying, setApplying] = useState(false);

  const categories = useMemo(
    () => ['All', ...getTemplateCategories()],
    []
  );

  const templates = useMemo(
    () =>
      getStorefrontTemplates({
        businessType,
        category: category === 'All' ? '' : category,
        search,
      }),
    [businessType, category, search]
  );

  const selectedTemplate = templates.find(
    (item) => item.id === selectedId
  );

  const apply = () => {
    if (!selectedTemplate || applying) return;

    try {
      setApplying(true);

      const next = applyStorefrontTemplate(
        currentConfig,
        selectedTemplate.id,
        {
          businessType,
          businessName,
          preserveExtraPages: true,
        }
      );

      onApply?.(next);
    } catch (error) {
      console.error('Template application failed:', error);
      window.alert(error.message || 'Could not apply this template.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate size={19} className="text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              Template library
            </h2>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Choose a complete storefront design. Your products,
            services and business records will remain untouched.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close templates"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              category === item
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <LayoutTemplate
            size={28}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No templates found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try another category or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((template) => {
            const active = selectedId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={`overflow-hidden rounded-2xl border text-left transition ${
                  active
                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div
                  className="relative flex h-32 items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor:
                      template.theme?.backgroundColor || '#F8FAFC',
                  }}
                >
                  <div
                    className="w-[76%] overflow-hidden rounded-lg border border-black/5 bg-white shadow-md"
                    style={{
                      color: template.theme?.textColor || '#222222',
                    }}
                  >
                    <div
                      className="h-2"
                      style={{
                        backgroundColor:
                          template.theme?.primaryColor || '#0B3D2E',
                      }}
                    />

                    <div className="space-y-2 p-3">
                      <div
                        className="h-2 w-1/3 rounded"
                        style={{
                          backgroundColor:
                            template.theme?.secondaryColor || '#444444',
                          opacity: 0.8,
                        }}
                      />

                      <div
                        className="h-5 w-4/5 rounded-sm"
                        style={{
                          backgroundColor:
                            template.theme?.textColor || '#222222',
                          opacity: 0.12,
                        }}
                      />

                      <div className="flex gap-2">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="h-8 flex-1 rounded"
                            style={{
                              backgroundColor:
                                template.theme?.surfaceColor || '#EEEEEE',
                            }}
                          />
                        ))}
                      </div>

                      <div
                        className="h-3 w-1/4 rounded"
                        style={{
                          backgroundColor:
                            template.theme?.accentColor || '#C8A77B',
                        }}
                      />
                    </div>
                  </div>

                  {active && (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <Check size={15} />
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {template.name}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {template.category}
                      </p>
                    </div>

                    {active && (
                      <Check
                        size={17}
                        className="shrink-0 text-emerald-700"
                      />
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                    {template.description}
                  </p>

                  <div className="mt-3 flex gap-1.5">
                    {[
                      template.theme?.primaryColor,
                      template.theme?.secondaryColor,
                      template.theme?.accentColor,
                      template.theme?.backgroundColor,
                    ]
                      .filter(Boolean)
                      .map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="h-5 w-5 rounded-full border border-black/5"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 border-t border-slate-100 bg-white pt-4">
        <button
          type="button"
          onClick={apply}
          disabled={!selectedTemplate || applying}
          className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {applying
            ? 'Applying template...'
            : selectedTemplate
              ? `Apply ${selectedTemplate.name}`
              : 'Select a template'}
        </button>

        <p className="mt-2 text-center text-[10px] text-slate-400">
          Applying a template changes the storefront design, not your business data.
        </p>
      </div>
    </div>
  );
}
