import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Monitor, Tablet, Smartphone, Plus, Save, Eye,
  Trash2, Copy, ChevronUp, ChevronDown, X, Palette,
  Settings2, Layers, Check, ExternalLink, Undo2, Redo2,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  createSection,
  getAvailableSectionTypes,
  normalizeStorefrontConfig,
} from '../../lib/storefront.js';

const LABELS = {
  announcement: 'Announcement bar',
  navigation: 'Navigation',
  hero: 'Hero banner',
  about: 'About section',
  image_text: 'Image and text',
  rich_text: 'Text section',
  gallery: 'Image gallery',
  portfolio_grid: 'Portfolio projects',
  featured_projects: 'Featured projects',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking section',
  featured_products: 'Featured products',
  product_grid: 'Product catalogue',
  categories: 'Categories',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'Frequently asked questions',
  contact: 'Contact section',
  social_links: 'Social links',
  custom_content: 'Custom content',
  footer: 'Footer',
};

const DEFAULT_SETTINGS = {
  hero: {
    eyebrow: 'WELCOME',
    title: 'Welcome to our business',
    subtitle: 'Tell visitors what makes your business special.',
    buttonText: 'Get started',
    buttonLink: '/services',
    backgroundImage: '',
    alignment: 'left',
    height: 'large',
  },
  about: {
    title: 'About us',
    subtitle: '',
    description: 'Tell customers about your business and what makes you different.',
    image: '',
  },
  image_text: {
    title: 'A little about what we do',
    subtitle: '',
    description: 'Add a description about your business.',
    image: '',
    layout: 'image_left',
  },
  rich_text: {
    title: 'Tell your story',
    subtitle: '',
    content: 'Write something meaningful for your visitors.',
  },
  custom_content: {
    title: 'Custom content',
    content: 'Add your own content here.',
  },
  gallery: {
    title: 'Our gallery',
    subtitle: 'A look at what we do.',
    images: [],
  },
  contact: {
    title: 'Let’s work together',
    description: 'Have a question or ready to get started? Get in touch.',
    buttonText: 'Contact us',
  },
  announcement: { text: 'Welcome to our business' },
  navigation: {},
  footer: { text: '' },
  services: {
    title: 'Our services',
    subtitle: 'Explore what we can do for you.',
    limit: 6,
  },
  featured_services: { title: 'Featured services', subtitle: '', limit: 3 },
  service_packages: { title: 'Our packages', subtitle: '', limit: 3 },
  booking: {
    title: 'Ready to book?',
    description: 'Choose a service and book a time that works for you.',
    buttonText: 'View services',
  },
  portfolio_grid: {
    title: 'Selected projects',
    subtitle: 'A few examples of our work.',
    limit: 6,
  },
  featured_projects: { title: 'Featured work', subtitle: '', limit: 3 },
  product_grid: {
    title: 'Our products',
    subtitle: 'Explore our collection.',
    limit: 8,
  },
  featured_products: { title: 'Featured products', subtitle: '', limit: 4 },
  categories: { title: 'Shop by category' },
  testimonials: { title: 'What customers say' },
  pricing: { title: 'Our pricing', subtitle: '' },
  faq: { title: 'Frequently asked questions' },
  social_links: {},
};

const makeSettings = (type, businessName) => ({
  ...(DEFAULT_SETTINGS[type] || { title: LABELS[type] || 'New section' }),
  ...(type === 'hero' && businessName ? { title: businessName } : {}),
});

function TextInput({ label, value, onChange, multiline = false, placeholder = '' }) {
  const common =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-700';

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={4}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${common} resize-y`}
        />
      ) : (
        <input
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={common}
        />
      )}
    </label>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type="color"
        value={value || '#111827'}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
      />
    </label>
  );
}

function InlineText({
  value,
  onChange,
  tag: Tag = 'div',
  className = '',
  style = {},
  placeholder = 'Click to edit',
}) {
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={(event) => onChange(event.currentTarget.innerText)}
      onBlur={(event) => onChange(event.currentTarget.innerText)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.currentTarget.blur();
      }}
      data-placeholder={placeholder}
      className={`cursor-text rounded-sm outline-none hover:outline hover:outline-1 hover:outline-dashed hover:outline-emerald-400 focus:outline-2 focus:outline-emerald-500 ${className}`}
      style={style}
    >
      {value || ''}
    </Tag>
  );
}

function PreviewSection({
  section,
  selected,
  onSelect,
  onChange,
  business,
  theme,
}) {
  const settings = section.settings || {};
  const primary = theme.primaryColor || '#0B6B4F';
  const text = theme.textColor || '#111827';
  const muted = theme.mutedColor || '#6B7280';

  const update = (key, value) => onChange(section.id, key, value);

  const heading = (
    <InlineText
      tag="h2"
      value={settings.title || LABELS[section.type] || 'Your section'}
      onChange={(value) => update('title', value)}
      className="text-2xl font-bold tracking-tight md:text-3xl"
      style={{ color: settings.titleColor || text }}
    />
  );

  const description = (
    <InlineText
      value={settings.description || settings.subtitle || ''}
      onChange={(value) => update(
        'description',
        value,
      )}
      className="mt-3 block whitespace-pre-line text-sm leading-7 md:text-base"
      style={{ color: settings.bodyColor || muted }}
    />
  );

  let content;

  switch (section.type) {
    case 'announcement':
      content = (
        <div className="px-4 py-3 text-center text-sm text-white" style={{ background: primary }}>
          <InlineText
            value={settings.text || 'Your announcement'}
            onChange={(value) => update('text', value)}
            className="inline-block"
          />
        </div>
      );
      break;

    case 'navigation':
      content = (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <strong>{business.name || 'Your business'}</strong>
          <span className="text-xs text-slate-500">Home　 About　 Contact</span>
        </div>
      );
      break;

    case 'hero':
      content = (
        <div
          className="relative flex min-h-[340px] flex-col justify-center overflow-hidden px-7 py-12 text-white md:min-h-[440px] md:px-14"
          style={{
            background: settings.backgroundImage
              ? `linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.25)),url("${settings.backgroundImage}") center/cover`
              : 'linear-gradient(125deg,#123d31,#152c27)',
            textAlign: settings.alignment === 'center' ? 'center' : 'left',
            alignItems: settings.alignment === 'center' ? 'center' : 'flex-start',
          }}
        >
          {settings.eyebrow && (
            <InlineText
              value={settings.eyebrow}
              onChange={(value) => update('eyebrow', value)}
              className="text-xs font-semibold uppercase tracking-[.2em] text-white/70"
            />
          )}
          <InlineText
            tag="h1"
            value={settings.title || business.name || 'Your headline'}
            onChange={(value) => update('title', value)}
            className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-5xl"
          />
          <InlineText
            value={settings.subtitle || 'Add a short introduction to your business.'}
            onChange={(value) => update('subtitle', value)}
            className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base"
          />
          {settings.buttonText !== '' && (
            <InlineText
              value={settings.buttonText || 'Get started'}
              onChange={(value) => update('buttonText', value)}
              className="mt-7 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: settings.buttonColor || primary }}
            />
          )}
        </div>
      );
      break;

    case 'about':
    case 'image_text':
      content = (
        <div className="grid items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-12">
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            {settings.image ? (
              <img src={settings.image} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">
                Add an image in section settings
              </div>
            )}
          </div>
          <div>
            {heading}
            {settings.subtitle && (
              <InlineText
                value={settings.subtitle}
                onChange={(value) => update('subtitle', value)}
                className="mt-2 block text-sm font-medium"
                style={{ color: primary }}
              />
            )}
            {description}
          </div>
        </div>
      );
      break;

    case 'rich_text':
    case 'custom_content':
      content = (
        <div className="px-7 py-12 md:px-12">
          {heading}
          <InlineText
            value={settings.content || 'Write your content here.'}
            onChange={(value) => update('content', value)}
            className="mt-4 block max-w-3xl whitespace-pre-line text-sm leading-7"
            style={{ color: settings.bodyColor || muted }}
          />
        </div>
      );
      break;

    case 'gallery':
      content = (
        <div className="px-6 py-12 md:px-10">
          {heading}
          <p className="mt-2 text-sm text-slate-500">
            {settings.subtitle || 'Your images will appear here.'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {(settings.images || []).map((item, index) => {
              const src = typeof item === 'string' ? item : item?.url;
              return src ? (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : null;
            })}
          </div>
        </div>
      );
      break;

    case 'contact':
    case 'booking':
      content = (
        <div className="mx-5 my-8 rounded-3xl bg-slate-950 px-7 py-10 text-white md:px-12">
          <InlineText
            tag="h2"
            value={settings.title || 'Let’s work together'}
            onChange={(value) => update('title', value)}
            className="text-2xl font-bold"
          />
          <InlineText
            value={settings.description || 'Tell visitors how they can reach you.'}
            onChange={(value) => update('description', value)}
            className="mt-3 block text-sm leading-7 text-white/70"
          />
          <InlineText
            value={settings.buttonText || 'Contact us'}
            onChange={(value) => update('buttonText', value)}
            className="mt-6 inline-block rounded-full px-5 py-3 text-sm font-semibold text-white"
            style={{ background: primary }}
          />
        </div>
      );
      break;

    case 'footer':
      content = (
        <div className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
          <InlineText
            value={settings.text || business.name || 'Your business'}
            onChange={(value) => update('text', value)}
            className="inline-block"
          />
        </div>
      );
      break;

    default:
      content = (
        <div className="px-7 py-12">
          {heading}
          <p className="mt-3 text-sm text-slate-500">
            This section will display your {LABELS[section.type]?.toLowerCase() || 'business content'}.
          </p>
        </div>
      );
  }

  return (
    <div
      onClick={() => onSelect(section.id)}
      className={`group relative cursor-pointer border-2 transition ${
        selected
          ? 'border-emerald-600'
          : 'border-transparent hover:border-emerald-300'
      }`}
    >
      {selected && (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white shadow">
          {LABELS[section.type] || section.type}
        </div>
      )}
      {content}
    </div>
  );
}

function SectionSettings({ section, update, close }) {
  if (!section) return null;

  const settings = section.settings || {};
  const set = (key, value) => update(section.id, key, value);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs text-slate-400">SECTION SETTINGS</p>
          <h3 className="mt-1 font-semibold text-slate-900">
            {LABELS[section.type] || section.type}
          </h3>
        </div>
        <button onClick={close} className="rounded-lg p-2 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {Object.prototype.hasOwnProperty.call(settings, 'title') && (
          <TextInput
            label="Heading"
            value={settings.title}
            onChange={(value) => set('title', value)}
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'eyebrow') && (
          <TextInput
            label="Small heading"
            value={settings.eyebrow}
            onChange={(value) => set('eyebrow', value)}
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'subtitle') && (
          <TextInput
            label="Subtitle"
            value={settings.subtitle}
            onChange={(value) => set('subtitle', value)}
            multiline
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'description') && (
          <TextInput
            label="Description"
            value={settings.description}
            onChange={(value) => set('description', value)}
            multiline
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'content') && (
          <TextInput
            label="Content"
            value={settings.content}
            onChange={(value) => set('content', value)}
            multiline
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'text') && (
          <TextInput
            label="Text"
            value={settings.text}
            onChange={(value) => set('text', value)}
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'buttonText') && (
          <TextInput
            label="Button label"
            value={settings.buttonText}
            onChange={(value) => set('buttonText', value)}
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'buttonLink') && (
          <TextInput
            label="Button link"
            value={settings.buttonLink}
            onChange={(value) => set('buttonLink', value)}
            placeholder="/services"
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'backgroundImage') && (
          <TextInput
            label="Background image URL"
            value={settings.backgroundImage}
            onChange={(value) => set('backgroundImage', value)}
            placeholder="Image upload will be added next"
          />
        )}

        {Object.prototype.hasOwnProperty.call(settings, 'image') && (
          <TextInput
            label="Image URL"
            value={settings.image}
            onChange={(value) => set('image', value)}
            placeholder="Paste an image URL"
          />
        )}

        {section.type === 'gallery' && (
          <TextInput
            label="Image URLs (one per line)"
            value={(settings.images || [])
              .map((item) => typeof item === 'string' ? item : item?.url || '')
              .join('\n')}
            onChange={(value) => set(
              'images',
              value.split('\n').map((item) => item.trim()).filter(Boolean),
            )}
            multiline
          />
        )}

        {section.type === 'hero' && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Text alignment
              </span>
              <select
                value={settings.alignment || 'left'}
                onChange={(event) => set('alignment', event.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Banner height
              </span>
              <select
                value={settings.height || 'large'}
                onChange={(event) => set('height', event.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              >
                <option value="small">Short</option>
                <option value="medium">Medium</option>
                <option value="large">Tall</option>
              </select>
            </label>
          </>
        )}

        <div className="border-t border-slate-100 pt-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
            Section styling
          </p>
          <div className="space-y-4">
            <ColorInput
              label="Heading colour"
              value={settings.titleColor}
              onChange={(value) => set('titleColor', value)}
            />
            <ColorInput
              label="Body colour"
              value={settings.bodyColor}
              onChange={(value) => set('bodyColor', value)}
            />
            <ColorInput
              label="Button colour"
              value={settings.buttonColor}
              onChange={(value) => set('buttonColor', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorefrontEditor() {
  const { ctx } = useAuth();
  const business = ctx?.business || {};
  const businessType = business.businessType || 'product';

  const [storefront, setStorefront] = useState(null);
  const [activePageId, setActivePageId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [device, setDevice] = useState('desktop');
  const [panel, setPanel] = useState('');
  const [showSections, setShowSections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const currentRef = useRef(null);
  const saveLock = useRef(false);

  const pages = storefront?.pages || [];
  const activePage =
    pages.find((page) => page.id === activePageId) ||
    pages.find((page) => page.isHome) ||
    pages[0];

  const selectedSection = activePage?.sections?.find(
    (section) => section.id === selectedSectionId
  );

  const availableSections = useMemo(
    () => getAvailableSectionTypes(businessType),
    [businessType]
  );

  const snapshot = storefront ? JSON.stringify(storefront) : '';
  const dirty = !!snapshot && snapshot !== savedSnapshot;

  useEffect(() => {
    currentRef.current = storefront;
  }, [storefront]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await api('/businesses/current/storefront', {
          biz: true,
        });

        if (cancelled) return;

        const config = normalizeStorefrontConfig(
          result.storefront || business.storefront || {},
          business.name,
        );

        setStorefront(config);
        currentRef.current = config;
        setSavedSnapshot(JSON.stringify(config));
        setActivePageId(
          config.pages.find((page) => page.isHome)?.id ||
          config.pages[0]?.id ||
          '',
        );
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load your storefront.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [business._id]);

  const commit = useCallback((updater) => {
    setStorefront((current) => {
      if (!current) return current;

      const next = typeof updater === 'function'
        ? updater(current)
        : updater;

      if (next === current) return current;

      setHistory((items) => [...items.slice(-29), current]);
      setFuture([]);
      currentRef.current = next;

      return next;
    });
  }, []);

  const updatePage = (pageId, changes) => {
    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === pageId ? { ...page, ...changes } : page
      ),
    }));
  };

  const updateSection = (sectionId, key, value) => {
    if (!activePage) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) => {
        if (page.id !== activePage.id) return page;

        return {
          ...page,
          sections: page.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  settings: {
                    ...(section.settings || {}),
                    [key]: value,
                  },
                }
              : section
          ),
        };
      }),
    }));
  };

  const save = async () => {
    const data = currentRef.current;
    if (!data || saveLock.current) return;

    saveLock.current = true;
    setSaving(true);
    setError('');
    setNotice('');

    const savingSnapshot = JSON.stringify(data);

    try {
      await api('/businesses/current/storefront', {
        method: 'PUT',
        biz: true,
        body: data,
      });

      setSavedSnapshot(savingSnapshot);
      setNotice(
        JSON.stringify(currentRef.current) === savingSnapshot
          ? 'All changes saved'
          : 'Saved. You still have newer unsaved changes.',
      );
    } catch (err) {
      setError(err.message || 'Could not save your changes.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const undo = () => {
    if (!history.length || !storefront) return;

    const previous = history[history.length - 1];

    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [...items, storefront]);
    currentRef.current = previous;
    setStorefront(previous);
  };

  const redo = () => {
    if (!future.length || !storefront) return;

    const next = future[future.length - 1];

    setFuture((items) => items.slice(0, -1));
    setHistory((items) => [...items, storefront]);
    currentRef.current = next;
    setStorefront(next);
  };

  const addSection = (type) => {
    if (!activePage) return;

    const section = createSection(type, makeSettings(type, business.name));

    updatePage(activePage.id, {
      sections: [...activePage.sections, section],
    });

    setSelectedSectionId(section.id);
    setShowSections(false);
    setPanel('settings');
  };

  const removeSection = (id) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.filter((section) => section.id !== id),
    });

    setSelectedSectionId('');
    setPanel('');
  };

  const moveSection = (id, direction) => {
    if (!activePage) return;

    const index = activePage.sections.findIndex((section) => section.id === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= activePage.sections.length) return;

    const next = [...activePage.sections];
    [next[index], next[target]] = [next[target], next[index]];

    updatePage(activePage.id, { sections: next });
  };

  const duplicateSection = (section) => {
    if (!activePage) return;

    const copy = createSection(section.type, { ...section.settings });

    const index = activePage.sections.findIndex((item) => item.id === section.id);
    const next = [...activePage.sections];
    next.splice(index + 1, 0, copy);

    updatePage(activePage.id, { sections: next });
    setSelectedSectionId(copy.id);
  };

  const addPage = () => {
    if (!storefront) return;

    const number = storefront.pages.length + 1;
    const title = `Page ${number}`;
    const slug = `page-${number}`;

    const page = {
      id: `page-${slug}-${Date.now()}`,
      title,
      slug,
      isHome: false,
      visible: true,
      sections: [
        createSection('hero', makeSettings('hero', business.name)),
      ],
    };

    commit((current) => ({
      ...current,
      pages: [...current.pages, page],
      activePage: slug,
    }));

    setActivePageId(page.id);
    setSelectedSectionId('');
    setPanel('');
  };

  const changeTheme = (key, value) => {
    commit((current) => ({
      ...current,
      theme: {
        ...current.theme,
        [key]: value,
      },
    }));
  };

  const previewWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
  }[device];

  const storeUrl = business.slug
    ? `/store/${business.slug}`
    : '/';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Loading your editor…
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600">{error || 'Could not load editor.'}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100">
      {/* TOP BAR */}
      <header className="z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/app"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            title="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {business.name || 'Your storefront'}
            </p>
            <p className="text-[10px] text-slate-400">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
          <button onClick={undo} disabled={!history.length} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" title="Undo">
            <Undo2 size={17} />
          </button>
          <button onClick={redo} disabled={!future.length} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" title="Redo">
            <Redo2 size={17} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:flex"
          >
            <Eye size={15} /> Preview <ExternalLink size={12} />
          </a>

          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? (
              <span className="animate-pulse">Saving…</span>
            ) : (
              <>
                <Save size={15} />
                Save
              </>
            )}
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT TOOLBAR */}
        <aside className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-200 bg-white py-4 md:flex">
          <button
            onClick={() => setShowSections(true)}
            className="flex w-full flex-col items-center gap-1 py-2 text-slate-600 hover:text-emerald-700"
          >
            <Plus size={21} />
            <span className="text-[10px]">Add</span>
          </button>

          <button
            onClick={() => setPanel(panel === 'pages' ? '' : 'pages')}
            className={`flex w-full flex-col items-center gap-1 py-2 ${panel === 'pages' ? 'text-emerald-700' : 'text-slate-600'}`}
          >
            <Layers size={21} />
            <span className="text-[10px]">Pages</span>
          </button>

          <button
            onClick={() => setPanel(panel === 'design' ? '' : 'design')}
            className={`flex w-full flex-col items-center gap-1 py-2 ${panel === 'design' ? 'text-emerald-700' : 'text-slate-600'}`}
          >
            <Palette size={21} />
            <span className="text-[10px]">Design</span>
          </button>
        </aside>

        {/* MAIN CANVAS */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3">
            <div className="flex min-w-0 items-center gap-2">
              <select
                value={activePage?.id || ''}
                onChange={(event) => {
                  setActivePageId(event.target.value);
                  setSelectedSectionId('');
                  setPanel('');
                }}
                className="max-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>{page.title}</option>
                ))}
              </select>

              <button
                onClick={addPage}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title="Add page"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[
                ['desktop', Monitor],
                ['tablet', Tablet],
                ['mobile', Smartphone],
              ].map(([name, Icon]) => (
                <button
                  key={name}
                  onClick={() => setDevice(name)}
                  className={`rounded-lg p-2 ${device === name ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  title={`${name} preview`}
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="z-20 flex items-center justify-between bg-red-50 px-4 py-2 text-xs text-red-700">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={15} /></button>
            </div>
          )}

          {notice && (
            <div className="z-20 flex items-center justify-between bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
              <span>{notice}</span>
              <button onClick={() => setNotice('')}><X size={15} /></button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-3 md:p-6">
            <div
              className="mx-auto min-h-full overflow-hidden bg-white shadow-xl transition-all duration-200"
              style={{
                width: previewWidth,
                maxWidth: '100%',
                background: storefront.theme?.backgroundColor || '#fff',
                color: storefront.theme?.textColor || '#111827',
                fontFamily: storefront.theme?.fontBody || 'Inter, sans-serif',
              }}
            >
              {(activePage?.sections || []).filter((section) => section.visible !== false).map((section) => (
                <PreviewSection
                  key={section.id}
                  section={section}
                  selected={selectedSectionId === section.id}
                  onSelect={(id) => {
                    setSelectedSectionId(id);
                    setPanel('');
                  }}
                  onChange={updateSection}
                  business={business}
                  theme={storefront.theme || {}}
                />
              ))}

              {!activePage?.sections?.length && (
                <div className="px-8 py-24 text-center">
                  <h2 className="text-xl font-bold">Start building your page</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Add a section to begin designing your storefront.
                  </p>
                  <button
                    onClick={() => setShowSections(true)}
                    className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Add your first section
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SELECTED SECTION TOOLBAR */}
          {selectedSection && (
            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[95%] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <span className="hidden px-2 text-xs font-semibold text-slate-600 sm:block">
                {LABELS[selectedSection.type]}
              </span>
              <button
                onClick={() => setPanel('settings')}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                <Settings2 size={15} /> Edit
              </button>
              <button
                onClick={() => moveSection(selectedSection.id, -1)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Move up"
              >
                <ChevronUp size={17} />
              </button>
              <button
                onClick={() => moveSection(selectedSection.id, 1)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Move down"
              >
                <ChevronDown size={17} />
              </button>
              <button
                onClick={() => duplicateSection(selectedSection)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => removeSection(selectedSection.id)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setSelectedSectionId('')}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title="Deselect"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </main>

        {/* OPTIONAL INSPECTOR */}
        {panel && (
          <aside className="absolute inset-0 z-40 flex justify-end bg-black/20 md:static md:inset-auto md:z-20 md:w-80 md:shrink-0 md:bg-transparent">
            <div className="flex h-full w-[min(88vw,360px)] flex-col border-l border-slate-200 bg-white shadow-2xl md:w-full md:shadow-none">
              {panel === 'settings' && selectedSection && (
                <SectionSettings
                  section={selectedSection}
                  update={updateSection}
                  close={() => setPanel('')}
                />
              )}

              {panel === 'design' && (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold">Design</h3>
                    <button onClick={() => setPanel('')}><X size={18} /></button>
                  </div>
                  <div className="space-y-5 p-5">
                    <ColorInput
                      label="Primary colour"
                      value={storefront.theme?.primaryColor}
                      onChange={(value) => changeTheme('primaryColor', value)}
                    />
                    <ColorInput
                      label="Page background"
                      value={storefront.theme?.backgroundColor}
                      onChange={(value) => changeTheme('backgroundColor', value)}
                    />
                    <ColorInput
                      label="Text colour"
                      value={storefront.theme?.textColor}
                      onChange={(value) => changeTheme('textColor', value)}
                    />
                    <ColorInput
                      label="Muted text"
                      value={storefront.theme?.mutedColor}
                      onChange={(value) => changeTheme('mutedColor', value)}
                    />
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">
                        Button shape
                      </span>
                      <select
                        value={storefront.theme?.buttonStyle || 'rounded'}
                        onChange={(event) => changeTheme('buttonStyle', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="pill">Pill</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {panel === 'pages' && (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold">Pages</h3>
                    <button onClick={() => setPanel('')}><X size={18} /></button>
                  </div>
                  <div className="space-y-2 p-4">
                    {pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => {
                          setActivePageId(page.id);
                          setSelectedSectionId('');
                          setPanel('');
                        }}
                        className={`w-full rounded-xl border p-3 text-left text-sm ${activePage?.id === page.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                      >
                        {page.title}
                        {page.isHome && <span className="ml-2 text-xs text-slate-400">Home</span>}
                      </button>
                    ))}
                    <button
                      onClick={addPage}
                      className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
                    >
                      + Add page
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ADD SECTION DRAWER */}
      {showSections && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Add a section</h3>
                <p className="mt-1 text-xs text-slate-500">Choose what you want to add to your page.</p>
              </div>
              <button
                onClick={() => setShowSections(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
              {availableSections.map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-600 hover:bg-emerald-50"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <Plus size={18} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {LABELS[type] || type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TOOLBAR */}
      <div className="z-30 flex h-14 shrink-0 items-center justify-around border-t border-slate-200 bg-white md:hidden">
        <button
          onClick={() => setShowSections(true)}
          className="flex flex-col items-center gap-1 text-slate-600"
        >
          <Plus size={19} />
          <span className="text-[10px]">Add</span>
        </button>
        <button
          onClick={() => setPanel(panel === 'pages' ? '' : 'pages')}
          className="flex flex-col items-center gap-1 text-slate-600"
        >
          <Layers size={19} />
          <span className="text-[10px]">Pages</span>
        </button>
        <button
          onClick={() => setPanel(panel === 'design' ? '' : 'design')}
          className="flex flex-col items-center gap-1 text-slate-600"
        >
          <Palette size={19} />
          <span className="text-[10px]">Design</span>
        </button>
        <button
          onClick={() => setPanel('settings')}
          disabled={!selectedSection}
          className="flex flex-col items-center gap-1 text-slate-600 disabled:opacity-30"
        >
          <Settings2 size={19} />
          <span className="text-[10px]">Edit</span>
        </button>
      </div>
    </div>
  );
}
