
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LayoutTemplate,
  LoaderCircle,
  Palette,
  Store,
  Sparkles,
  X,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  getStorefrontTemplates,
  getTemplateCategories,
  applyStorefrontTemplate,
} from '../../lib/storefrontTemplates.js';
import GuidedSectionContent from '../../components/storefront/GuidedSectionContent.jsx';
import {
  createEditableTemplateSection,
} from '../../lib/storefrontTemplateElements.js';

import {
  getGuidedSectionKey,
} from '../../components/storefront/GuidedSectionContent.jsx';
import { StorefrontRenderer } from '../StorefrontHome.jsx';

const palettes = [
  { name: 'Zuno Forest', colors: ['#0B3D2E', '#1C6F52', '#D7F36A'] },
  { name: 'Warm Luxury', colors: ['#6E513D', '#2B2622', '#B99A72'] },
  { name: 'Clean Minimal', colors: ['#242424', '#77716B', '#C8A77B'] },
  { name: 'Soft Beauty', colors: ['#A66D78', '#49363B', '#D9B5A9'] },
  { name: 'Natural', colors: ['#667D68', '#293A30', '#C2A77D'] },
  { name: 'Modern Blue', colors: ['#244D68', '#172B3A', '#C59B62'] },
];

const steps = [
  { label: 'Business details', icon: Store },
  { label: 'Brand identity', icon: Palette },
  { label: 'Choose a design', icon: LayoutTemplate },
  { label: 'Your content', icon: Sparkles },
  { label: 'Review', icon: CheckCircle2 },
];

const fieldClass =
  'w-full rounded-xl border border-[#DCE2DD] bg-white px-4 py-3 text-sm text-[#12201A] outline-none transition focus:border-[#1C6F52] focus:ring-2 focus:ring-[#1C6F52]/10';

const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wide text-[#68756D]';

function guessCategory(value = '') {
  const text = value.toLowerCase();

  if (/fashion|cloth|wear|boutique|apparel|shoe/.test(text)) return 'Fashion';
  if (/beauty|cosmetic|makeup|skincare/.test(text)) return 'Beauty';
  if (/food|restaurant|cafe|catering|bakery|kitchen/.test(text)) return 'Food';
  if (/salon|barber|hair|spa|wellness/.test(text)) return 'Beauty Services';
  if (/portfolio|photograph|creative|design|artist/.test(text)) return 'Portfolio';
  if (/fitness|gym|coach|training/.test(text)) return 'Fitness & Coaching';
  if (/property|real estate|estate|housing/.test(text)) return 'Property';
  if (/cleaning|plumbing|electric|home service/.test(text)) return 'Home Services';
  if (/service|consult|professional|legal|account/.test(text)) return 'Services';

  return 'All';
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-3 rounded-xl border border-[#DCE2DD] bg-white p-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
          aria-label={`${label} color`}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold uppercase text-[#12201A] outline-none"
          maxLength={7}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

function TemplateCard({ item, selected, onClick }) {
  const theme = item.theme || {};
  const sections = item.pages?.[0]?.sections || [];
  const hero = sections.find((section) => section.type === 'hero');
  const content = sections.filter(
    (section) => !['announcement', 'navigation', 'footer'].includes(section.type)
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group overflow-hidden rounded-2xl border bg-white text-left transition ${
        selected
          ? 'border-[#1C6F52] ring-2 ring-[#1C6F52]/15'
          : 'border-[#DCE2DD] hover:-translate-y-0.5 hover:border-[#9BA99F] hover:shadow-lg'
      }`}
    >
      <div
        className="relative h-44 overflow-hidden p-3"
        style={{ background: theme.backgroundColor || '#F6F7F5' }}
      >
        <div
          className="mx-auto h-full max-w-[250px] overflow-hidden rounded-lg border border-black/10 shadow-lg"
          style={{
            background: theme.backgroundColor || '#FFFFFF',
            color: theme.textColor || '#222222',
          }}
        >
          <div
            className="flex h-7 items-center justify-between border-b px-3"
            style={{ borderColor: theme.borderColor || '#E5E7EB' }}
          >
            <span className="text-[8px] font-bold tracking-wide">YOUR BRAND</span>
            <span className="text-[7px]">MENU　☰</span>
          </div>

          <div
            className="flex h-[82px] flex-col justify-center px-4"
            style={{
              background: theme.surfaceColor || '#F0F0F0',
            }}
          >
            <span
              className="mb-1 text-[6px] font-bold uppercase tracking-widest"
              style={{ color: theme.primaryColor }}
            >
              {item.category}
            </span>
            <span className="max-w-[170px] text-[12px] font-bold leading-tight">
              {hero?.settings?.title || item.name}
            </span>
            <span
              className="mt-2 w-fit rounded px-2 py-1 text-[6px] font-semibold text-white"
              style={{ background: theme.primaryColor }}
            >
              EXPLORE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            {content.slice(0, 3).map((section, index) => (
              <div key={`${section.type}-${index}`}>
                <div
                  className="h-8 rounded-sm"
                  style={{
                    background:
                      index === 1
                        ? theme.accentColor
                        : theme.surfaceColor || '#EEEEEE',
                  }}
                />
                <div
                  className="mt-1 h-1 w-4/5 rounded"
                  style={{ background: theme.textColor, opacity: 0.45 }}
                />
                <div
                  className="mt-1 h-1 w-1/2 rounded"
                  style={{ background: theme.textColor, opacity: 0.2 }}
                />
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#1C6F52] text-white shadow">
            <Check size={15} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#12201A]">{item.name}</p>
            <p className="mt-1 text-xs leading-5 text-[#68756D]">
              {item.description}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {[theme.primaryColor, theme.secondaryColor, theme.accentColor].map(
              (color, index) => (
                <span
                  key={index}
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ background: color }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function GuidedStorefrontSetup() {
  const { ctx, refresh } = useAuth();
  const business = ctx?.business || {};
  const businessType = business.businessType || 'product';

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedTemplateId, setSavedTemplateId] = useState('');
  const [sectionOverrides, setSectionOverrides] = useState({});
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const categories = useMemo(() => getTemplateCategories(), []);
  const [category, setCategory] = useState(
    () => guessCategory(business.category || '')
  );

  const [details, setDetails] = useState({
    name: business.name || '',
    category: business.category || '',
    tagline: business.tagline || '',
    description: business.about || '',
    phone: business.phone || '',
    whatsapp: business.whatsapp || '',
    address: business.address || '',
  });

  const [colors, setColors] = useState({
    primary: '#0B3D2E',
    secondary: '#12201A',
    accent: '#D7F36A',
  });

  const [announcement, setAnnouncement] = useState('');
  const [templateId, setTemplateId] = useState('');

  const templates = useMemo(
    () =>
      getStorefrontTemplates({
        businessType,
        category,
      }),
    [businessType, category]
  );

  const selectedTemplate = templates.find((item) => item.id === templateId);

    const previewConfig = useMemo(() => {
    if (!selectedTemplate) return null;

    const config = applyStorefrontTemplate({}, selectedTemplate.id, {
      businessType,
      businessName: details.name,
    });

    config.pages = (config.pages || []).map((page, pageIndex) => {
      if (pageIndex !== 0) return page;

      const counts = {};

      return {
        ...page,
        sections: (page.sections || []).map((section) => {
          const sectionKey = getGuidedSectionKey(section, counts);
          const overrides = sectionOverrides[sectionKey] || {};

          return createEditableTemplateSection({
            ...section,
            settings: {
              ...(section.settings || {}),
              ...overrides,
            },
          });
        }),
      };
    });

    config.identity = {
      ...(config.identity || {}),
      displayName: details.name.trim(),
      tagline: details.tagline.trim(),
      description: details.description.trim(),
      announcement: announcement.trim(),
    };

    config.contact = {
      ...(config.contact || {}),
      phone: details.phone.trim(),
      whatsapp: details.whatsapp.trim(),
      address: details.address.trim(),
    };

    config.theme = {
      ...config.theme,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
    };

    config.primaryColor = colors.primary;
    config.templateId = selectedTemplate.id;
    config.templateName = selectedTemplate.name;

    return config;
  }, [
    selectedTemplate,
    businessType,
    details,
    colors,
    announcement,
    sectionOverrides,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await api('/businesses/current/storefront', {
          biz: true,
        });

        if (cancelled) return;

        const saved = result.storefront || {};
        const config = saved.config || {};

        setSavedTemplateId(saved.templateId || config.templateId || '');
        setTemplateId(saved.templateId || config.templateId || '');

        if (saved.guided) {
          const guided = saved.guided;

          setDetails((current) => ({ ...current, ...(guided.details || {}) }));
          setCategory(guided.category || category);
          setAnnouncement(guided.announcement || '');

          if (guided.colors) setColors(guided.colors);
        } else if (config.theme) {
          setColors({
            primary: config.theme.primaryColor || '#0B3D2E',
            secondary: config.theme.secondaryColor || '#12201A',
            accent: config.theme.accentColor || '#D7F36A',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load storefront settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [business._id]);

  useEffect(() => {
    if (templateId && !templates.some((item) => item.id === templateId)) {
      setTemplateId('');
    }
  }, [category, businessType]);

  const updateDetails = (key, value) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  const updateColor = (key, value) => {
    if (/^#[0-9A-F]{6}$/.test(value)) {
      setColors((current) => ({ ...current, [key]: value }));
    } else {
      setColors((current) => ({ ...current, [key]: value }));
    }
  };

  const choosePalette = (palette) => {
    setColors({
      primary: palette.colors[0],
      secondary: palette.colors[1],
      accent: palette.colors[2],
    });
  };

  const canContinue = () => {
    if (step === 0 && !details.name.trim()) {
      setError('Enter your business name to continue.');
      return false;
    }

    if (step === 2 && !templateId) {
      setError('Choose a storefront design to continue.');
      return false;
    }

    setError('');
    return true;
  };

  const save = async () => {
    if (!selectedTemplate) {
      setError('Choose a valid template before saving.');
      setStep(2);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const config = applyStorefrontTemplate(
        {},
        selectedTemplate.id,
        {
          businessType,
          businessName: details.name,
        }
      );

      config.pages = (config.pages || []).map((page, pageIndex) => {
        if (pageIndex !== 0) return page;

const sections = page.sections || [];
const counts = {};

return {
  ...page,
  sections: sections.map((section) => {
    const sectionKey = getGuidedSectionKey(section, counts);
            const overrides = sectionOverrides[sectionKey] || {};

            const updatedSection = {
              ...section,
              settings: {
                ...(section.settings || {}),
                ...overrides,
              },
            };

            return createEditableTemplateSection(updatedSection);
          }),
        };
      });

      config.identity = {
        ...(config.identity || {}),
        displayName: details.name.trim(),
        tagline: details.tagline.trim(),
        description: details.description.trim(),
        announcement: announcement.trim(),
      };

      config.contact = {
        ...(config.contact || {}),
        phone: details.phone.trim(),
        whatsapp: details.whatsapp.trim(),
        address: details.address.trim(),
      };

      config.theme = {
        ...config.theme,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        accentColor: colors.accent,
      };

      config.primaryColor = colors.primary;
      config.templateId = selectedTemplate.id;
      config.templateName = selectedTemplate.name;

      const guided = {
        version: 1,
        category,
        details: {
          ...details,
          name: details.name.trim(),
          tagline: details.tagline.trim(),
          description: details.description.trim(),
        },
        colors,
        announcement: announcement.trim(),
        completedAt: new Date().toISOString(),
      };

      await api('/businesses/current/storefront', {
        method: 'PUT',
        biz: true,
        body: {
          templateId: selectedTemplate.id,
          config,
          guided,
        },
      });

      setSavedTemplateId(selectedTemplate.id);
      setNotice('Your storefront setup has been saved.');
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not save your storefront.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-[#68756D]">
        <LoaderCircle className="animate-spin" size={18} />
        Loading your storefront setup…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F5] px-4 py-7 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B3D2E]">
              <Store size={18} />
              Zuno storefront
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#12201A] sm:text-3xl">
              Set up your online presence.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68756D]">
              Add your business details, choose your brand look and select a
              design that fits what you do.
            </p>
          </div>

          <div className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#68756D]">
              Setup progress
            </p>
            <p className="mt-1 text-sm font-bold text-[#12201A]">
              Step {step + 1} of {steps.length}
            </p>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-4 gap-2">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const complete = index < step;

            return (
              <button
                type="button"
                key={item.label}
                onClick={() => index < step && setStep(index)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                    : complete
                      ? 'border-[#C8D8CE] bg-[#EAF1EC] text-[#0B3D2E]'
                      : 'border-[#DCE2DD] bg-white text-[#87928A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {complete ? <Check size={16} /> : <Icon size={16} />}
                  <span className="hidden text-xs font-semibold sm:inline">
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold sm:hidden">
                    {index + 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <main className="rounded-3xl border border-[#E0E5E1] bg-white p-5 shadow-sm sm:p-8">
          {step === 0 && (
            <section>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1C6F52]">
                  Step 01 — Your business
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#12201A]">
                  Let's introduce your business.
                </h2>
                <p className="mt-2 text-sm text-[#68756D]">
                  These details help customers understand who you are and what
                  you offer.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Business name *</label>
                  <input
                    className={fieldClass}
                    value={details.name}
                    onChange={(e) => updateDetails('name', e.target.value)}
                    placeholder="e.g. The Style House"
                  />
                </div>

                <div>
                  <label className={labelClass}>Business category</label>
                  <input
                    className={fieldClass}
                    value={details.category}
                    onChange={(e) => {
                      updateDetails('category', e.target.value);
                      setCategory(guessCategory(e.target.value));
                    }}
                    placeholder="e.g. Fashion, catering, consulting"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Short tagline</label>
                  <input
                    className={fieldClass}
                    value={details.tagline}
                    onChange={(e) => updateDetails('tagline', e.target.value)}
                    placeholder="A short line that captures your business"
                    maxLength={140}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>About your business</label>
                  <textarea
                    className={`${fieldClass} min-h-32 resize-y`}
                    value={details.description}
                    onChange={(e) => updateDetails('description', e.target.value)}
                    placeholder="Tell customers what you do, who you serve and what makes your business different."
                    maxLength={2000}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone number</label>
                  <input
                    className={fieldClass}
                    value={details.phone}
                    onChange={(e) => updateDetails('phone', e.target.value)}
                    placeholder="+234..."
                  />
                </div>

                <div>
                  <label className={labelClass}>WhatsApp number</label>
                  <input
                    className={fieldClass}
                    value={details.whatsapp}
                    onChange={(e) => updateDetails('whatsapp', e.target.value)}
                    placeholder="+234..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Business address or location</label>
                  <input
                    className={fieldClass}
                    value={details.address}
                    onChange={(e) => updateDetails('address', e.target.value)}
                    placeholder="City, state or full business address"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1C6F52]">
                  Step 02 — Brand identity
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#12201A]">
                  Give your storefront its look.
                </h2>
                <p className="mt-2 text-sm text-[#68756D]">
                  Pick a palette or enter your own brand colours.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {palettes.map((palette) => (
                  <button
                    type="button"
                    key={palette.name}
                    onClick={() => choosePalette(palette)}
                    className="rounded-2xl border border-[#DCE2DD] p-4 text-left transition hover:border-[#1C6F52]"
                  >
                    <div className="mb-3 flex h-10 overflow-hidden rounded-lg">
                      {palette.colors.map((color) => (
                        <span
                          key={color}
                          className="flex-1"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-[#12201A]">
                      {palette.name}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <ColorField
                  label="Primary colour"
                  value={colors.primary}
                  onChange={(value) => updateColor('primary', value)}
                />
                <ColorField
                  label="Secondary colour"
                  value={colors.secondary}
                  onChange={(value) => updateColor('secondary', value)}
                />
                <ColorField
                  label="Accent colour"
                  value={colors.accent}
                  onChange={(value) => updateColor('accent', value)}
                />
              </div>

              <div
                className="mt-7 overflow-hidden rounded-2xl p-6"
                style={{ background: colors.secondary, color: '#FFFFFF' }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                  Brand preview
                </p>
                <h3 className="mt-3 text-2xl font-bold">
                  {details.name || 'Your business'}
                </h3>
                <p className="mt-2 text-sm opacity-75">
                  {details.tagline || 'Your brand message will appear here.'}
                </p>
                <span
                  className="mt-5 inline-flex rounded-lg px-4 py-2 text-xs font-bold"
                  style={{ background: colors.accent, color: colors.secondary }}
                >
                  Explore
                </span>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1C6F52]">
                  Step 03 — Storefront design
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#12201A]">
                  Choose a design that fits your business.
                </h2>
                <p className="mt-2 text-sm text-[#68756D]">
                  Your template controls the layout and presentation. Your
                  business information and records stay yours.
                </p>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-[#68756D]">
                  Browse category
                </label>
                <select
                  className={`${fieldClass} max-w-xs`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setTemplateId('');
                  }}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === 'All' ? 'All categories' : item}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#87928A]">
                  {templates.length} designs available
                </span>
              </div>

              {templates.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {templates.map((item) => (
                    <TemplateCard
                      key={item.id}
                      item={item}
                      selected={templateId === item.id}
                      onClick={() => setTemplateId(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DCE2DD] p-10 text-center">
                  <LayoutTemplate
                    className="mx-auto text-[#87928A]"
                    size={28}
                  />
                  <p className="mt-3 text-sm font-semibold text-[#12201A]">
                    No designs in this category yet
                  </p>
                  <button
                    type="button"
                    onClick={() => setCategory('All')}
                    className="mt-3 text-sm font-semibold text-[#1C6F52]"
                  >
                    Browse all designs
                  </button>
                </div>
              )}

              <div className="mt-8">
                <label className={labelClass}>Announcement bar (optional)</label>
                <input
                  className={fieldClass}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="e.g. Free delivery on orders over ₦50,000"
                  maxLength={160}
                />
              </div>
            </section>
          )}

          {step === 3 && (
  <section>
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1C6F52]">
        Step 04 — Your content
      </p>
      <h2 className="mt-2 text-xl font-bold text-[#12201A]">
        Make the design yours.
      </h2>
      <p className="mt-2 text-sm text-[#68756D]">
        Edit the text and image links in the sections your chosen design uses.
        Your existing catalogue and service records remain separate.
      </p>
    </div>

    <GuidedSectionContent
      template={selectedTemplate}
      values={sectionOverrides}
      onChange={setSectionOverrides}
    />
  </section>
)}

          {step === 4 && (
            <section>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1C6F52]">
                  Step 05 — Review
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#12201A]">
                  Your storefront is taking shape.
                </h2>
                <p className="mt-2 text-sm text-[#68756D]">
                  Check your details before saving your setup.
                </p>
              </div>
                              <div className="mt-8 overflow-hidden rounded-2xl border border-[#DCE2DD]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE2DD] bg-[#F6F7F5] px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#12201A]">
                      Live storefront preview
                    </p>
                    <p className="mt-1 text-xs text-[#68756D]">
                      This is how your selected design will appear to customers.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF1EC] px-3 py-1 text-xs font-semibold text-[#0B3D2E]">
                    Preview
                  </span>
                </div>

                <div className="max-h-[850px] overflow-auto bg-[#E9EDE9] p-3 sm:p-5">
                  <div className="bg-[#E9EDE9] p-3 sm:p-5">
  <div className="mb-4 flex items-center justify-center gap-2">
    <button
      type="button"
      onClick={() => setPreviewDevice('desktop')}
      className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
        previewDevice === 'desktop'
          ? 'bg-[#0B3D2E] text-white'
          : 'border border-[#DCE2DD] bg-white text-[#68756D]'
      }`}
    >
      Desktop
    </button>

    <button
      type="button"
      onClick={() => setPreviewDevice('mobile')}
      className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
        previewDevice === 'mobile'
          ? 'bg-[#0B3D2E] text-white'
          : 'border border-[#DCE2DD] bg-white text-[#68756D]'
      }`}
    >
      Mobile
    </button>
  </div>

  <div
    className={`mx-auto overflow-hidden bg-white shadow-xl transition-all duration-300 ${
      previewDevice === 'mobile'
        ? 'max-w-[390px] rounded-[2rem] border-[6px] border-[#202923]'
        : 'max-w-[1100px] rounded-xl'
    }`}
  >
    {previewConfig && (
      <StorefrontRenderer
        pageSlug="home"
        biz={{
          ...business,
          name: details.name,
          category: details.category,
          about: details.description,
          description: details.description,
          tagline: details.tagline,
          phone: details.phone,
          whatsapp: details.whatsapp,
          address: details.address,
          brandColor: colors.primary,
        }}
        categories={[]}
        cart={null}
        slug={business.slug || 'preview'}
        color={colors.primary}
        storeBase="/store/preview"
        storefront={previewConfig}
      />
    )}
  </div>
</div>

                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#DCE2DD] p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#12201A]">
                    <Store size={17} />
                    Business information
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[#12201A]">
                    {details.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#68756D]">
                    {details.tagline || 'No tagline added'}
                  </p>
                  <p className="mt-4 text-xs leading-5 text-[#68756D]">
                    {details.description || 'No business description added.'}
                  </p>
                  <p className="mt-4 text-xs text-[#68756D]">
                    {details.phone || 'No phone number'} ·{' '}
                    {details.address || 'No address'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#DCE2DD] p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#12201A]">
                    <Palette size={17} />
                    Brand colours
                  </div>
                  <div className="mt-5 flex h-16 overflow-hidden rounded-xl">
                    {Object.values(colors).map((color) => (
                      <span
                        key={color}
                        className="flex-1"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase text-[#68756D]">
                    <span>Primary</span>
                    <span>Secondary</span>
                    <span>Accent</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DCE2DD] p-5 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#12201A]">
                    <LayoutTemplate size={17} />
                    Selected design
                  </div>
                  {selectedTemplate ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#12201A]">
                          {selectedTemplate.name}
                        </p>
                        <p className="mt-1 text-xs text-[#68756D]">
                          {selectedTemplate.category} · {selectedTemplate.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-sm font-semibold text-[#1C6F52]"
                      >
                        Change design
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-red-600">
                      No design selected.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#F1F5F2] p-4 text-sm text-[#385447]">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0" />
                  <p className="leading-6">
                    Saving creates your storefront layout and brand settings.
                    You can continue refining your content and images after
                    this setup.
                  </p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          {notice && (
            <div className="mt-6 rounded-xl border border-[#C8D8CE] bg-[#EAF1EC] px-4 py-3 text-sm text-[#0B3D2E]">
              {notice}
            </div>
          )}

          <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8ECE9] pt-6">
            <button
              type="button"
              onClick={() => {
                setError('');
                setNotice('');
                setStep((current) => Math.max(0, current - 1));
              }}
              disabled={step === 0 || saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#68756D] transition hover:bg-[#F6F7F5] disabled:opacity-30"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (canContinue()) {
                    setNotice('');
                    setStep((current) => Math.min(4, current + 1));
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1C6F52]"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={saving || !selectedTemplate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1C6F52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle className="animate-spin" size={16} />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save storefront setup
                  </>
                )}
              </button>
            )}
          </div>
        </main>

        <p className="mt-5 text-center text-xs text-[#87928A]">
          Your products, services, bookings and business records are not changed
          when you switch designs.
        </p>
      </div>
    </div>
  );
}
