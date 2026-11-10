import { useMemo, useState } from 'react';
import {
  Search,
  Check,
  X,
  LayoutTemplate,
  ArrowUpRight,
  ShoppingBag,
  Image,
  CalendarDays,
  BriefcaseBusiness,
  Sparkles,
} from 'lucide-react';

import {
  getStorefrontTemplates,
  getTemplateCategories,
  applyStorefrontTemplate,
} from '../../lib/storefrontTemplates.js';

const getSectionLabel = (type) => {
  const labels = {
    announcement: 'Announcement',
    navigation: 'Navigation',
    hero: 'Hero',
    featured_products: 'Featured products',
    product_grid: 'Product collection',
    products: 'Products',
    about: 'About',
    image_text: 'Image & text',
    gallery: 'Gallery',
    services: 'Services',
    service_list: 'Service list',
    booking: 'Bookings',
    testimonials: 'Testimonials',
    contact: 'Contact',
    footer: 'Footer',
    rich_text: 'Text section',
    custom_content: 'Custom content',
    portfolio: 'Portfolio',
  };

  return labels[type] || type?.replaceAll('_', ' ') || 'Content';
};

const getSectionIcon = (type) => {
  if (
    type?.includes('product') ||
    type === 'featured_products'
  ) {
    return ShoppingBag;
  }

  if (
    type?.includes('service') ||
    type === 'booking'
  ) {
    return CalendarDays;
  }

  if (
    type === 'gallery' ||
    type === 'image_text' ||
    type === 'portfolio'
  ) {
    return Image;
  }

  if (type === 'contact') {
    return BriefcaseBusiness;
  }

  return Sparkles;
};

function TemplatePreview({ template }) {
  const theme = template.theme || {};
  const sections = template.pages?.[0]?.sections || [];

  const background = theme.backgroundColor || '#F8FAFC';
  const primary = theme.primaryColor || '#0B3D2E';
  const secondary = theme.secondaryColor || '#444444';
  const accent = theme.accentColor || '#C8A77B';
  const surface = theme.surfaceColor || '#EEEEEE';
  const text = theme.textColor || '#222222';

  const hero = sections.find((item) => item.type === 'hero');
  const heroTitle =
    hero?.settings?.title || template.name;

  const contentSections = sections.filter(
    (item) =>
      !['announcement', 'navigation', 'footer'].includes(item.type)
  );

  return (
    <div
      className="relative h-44 overflow-hidden p-3 sm:h-48"
      style={{ backgroundColor: background }}
    >
      <div
        className="mx-auto h-full w-[88%] overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
        style={{ color: text }}
      >
        {sections.some((item) => item.type === 'announcement') && (
          <div
            className="px-2 py-1 text-center text-[6px] font-semibold tracking-widest text-white"
            style={{ backgroundColor: primary }}
          >
            {sections.find((item) => item.type === 'announcement')
              ?.settings?.text || 'WELCOME'}
          </div>
        )}

        <div
          className="flex h-5 items-center justify-between border-b px-2"
          style={{ borderColor: `${text}15` }}
        >
          <span
            className="text-[7px] font-bold tracking-wide"
            style={{ color: text }}
          >
            {template.name.toUpperCase()}
          </span>

          <div className="flex gap-1">
            <span className="h-1 w-3 rounded-full bg-black/20" />
            <span className="h-1 w-3 rounded-full bg-black/20" />
            <span className="h-1 w-3 rounded-full bg-black/20" />
          </div>
        </div>

        {hero && (
          <div
            className="relative flex min-h-[76px] flex-col justify-center overflow-hidden px-3 py-3"
            style={{
              backgroundColor: surface,
              textAlign:
                hero.settings?.alignment === 'center'
                  ? 'center'
                  : hero.settings?.alignment === 'right'
                    ? 'right'
                    : 'left',
            }}
          >
            <div
              className="absolute right-0 top-0 h-full w-2/5 opacity-10"
              style={{ backgroundColor: accent }}
            />

            <p
              className="relative z-10 max-w-[85%] text-[10px] font-bold leading-tight"
              style={{ color: text }}
            >
              {heroTitle}
            </p>

            {hero.settings?.subtitle && (
              <p
                className="relative z-10 mt-1 max-w-[85%] text-[5px] leading-relaxed opacity-70"
                style={{ color: secondary }}
              >
                {hero.settings.subtitle}
              </p>
            )}

            {hero.settings?.buttonText && (
              <span
                className="relative z-10 mt-2 inline-flex w-fit px-2 py-1 text-[5px] font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                {hero.settings.buttonText}
              </span>
            )}
          </div>
        )}

        <div className="space-y-2 px-3 py-2">
          {contentSections
            .filter((item) => item.type !== 'hero')
            .slice(0, 3)
            .map((item, index) => {
              const Icon = getSectionIcon(item.type);

              return (
                <div
                  key={`${item.type}-${index}`}
                  className="flex items-center gap-2"
                >
                  <div
                    className="flex h-7 w-9 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: surface }}
                  >
                    <Icon
                      size={11}
                      style={{ color: primary }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="h-1.5 w-3/5 rounded"
                      style={{ backgroundColor: `${text}35` }}
                    />
                    <div
                      className="mt-1 h-1 w-full rounded"
                      style={{ backgroundColor: `${text}12` }}
                    />
                  </div>
                </div>
              );
            })}

          {!contentSections.length && (
            <div className="flex gap-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-9 flex-1 rounded"
                  style={{ backgroundColor: surface }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-slate-600 shadow-sm">
        Preview
        <ArrowUpRight size={10} />
      </div>
    </div>
  );
}

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

  // The category helper already returns the available categories.
  // Remove any existing "All" entry before adding our own.
  const categories = useMemo(
    () => [
      'All',
      ...getTemplateCategories().filter(
        (item) => item !== 'All'
      ),
    ],
    []
  );

  // Pass "All" directly so the template getter does not
  // accidentally filter out every template.
  const templates = useMemo(
    () =>
      getStorefrontTemplates({
        businessType,
        category,
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

      window.alert(
        error.message || 'Could not apply this template.'
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate
              size={19}
              className="text-emerald-700"
            />

            <h2 className="text-base font-bold text-slate-900">
              Template library
            </h2>
          </div>

          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            Choose a storefront design that fits your business.
            You can customize its sections and content afterwards.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close templates"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, style or industry..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Categories */}
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

      {/* Template results */}
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <LayoutTemplate
            size={30}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No templates found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try another category or search term.
          </p>

          <button
            type="button"
            onClick={() => {
              setCategory('All');
              setSearch('');
            }}
            className="mt-4 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template) => {
            const active = selectedId === template.id;

            const colors = [
              template.theme?.primaryColor,
              template.theme?.secondaryColor,
              template.theme?.accentColor,
              template.theme?.backgroundColor,
            ].filter(Boolean);

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                aria-pressed={active}
                className={`group overflow-hidden rounded-2xl border text-left transition duration-200 ${
                  active
                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md'
                }`}
              >
                <div className="relative">
                  <TemplatePreview template={template} />

                  {active && (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md">
                      <Check size={15} />
                    </span>
                  )}
                </div>

                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
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

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {colors.map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      {template.pages?.[0]?.sections?.length || 0} sections
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Apply */}
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

        <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
          Applying a template changes your storefront design.
          Your existing business records remain untouched.
        </p>
      </div>
    </div>
  );
}
