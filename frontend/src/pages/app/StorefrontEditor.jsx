import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Save,
  Eye,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Undo2,
  Redo2,
  Layers,
  Type,
  Image as ImageIcon,
  MousePointer,
  Columns3,
  Minus,
  Video,
  ShoppingBag,
  BriefcaseBusiness,
  CalendarDays,
  Palette,
  X,
  Settings2,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { StorefrontRenderer } from '../StorefrontHome.jsx';

import {
  createSection,
  createElement,
  createPage,
  getAvailableSectionTypes,
  normalizeStorefrontConfig,
  ELEMENT_TYPES,
} from '../../lib/storefront.js';

const SECTION_LABELS = {
  announcement: 'Announcement bar',
  navigation: 'Navigation',
  hero: 'Hero banner',
  about: 'About',
  image_text: 'Image and text',
  rich_text: 'Text section',
  gallery: 'Gallery',
  portfolio_grid: 'Portfolio projects',
  featured_projects: 'Featured projects',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking',
  featured_products: 'Featured products',
  product_grid: 'Product catalogue',
  categories: 'Categories',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'FAQs',
  contact: 'Contact',
  social_links: 'Social links',
  custom_content: 'Custom content',
  footer: 'Footer',
};

const ELEMENT_OPTIONS = [
  { type: 'heading', label: 'Heading', icon: Type },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'button', label: 'Button', icon: MousePointer },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'spacer', label: 'Spacer', icon: Minus },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'columns', label: 'Columns', icon: Columns3 },
  { type: 'grid', label: 'Grid', icon: Layers },
  { type: 'gallery', label: 'Gallery', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'product_list', label: 'Products', icon: ShoppingBag },
  { type: 'service_list', label: 'Services', icon: BriefcaseBusiness },
  { type: 'booking_button', label: 'Booking button', icon: CalendarDays },
  { type: 'contact_form', label: 'Contact block', icon: MousePointer },
];

const DEFAULT_ELEMENT_CONTENT = {
  heading: 'Add your heading',
  text: 'Write something meaningful for your visitors.',
  button: 'Get started',
  spacer: '',
  divider: '',
  columns: '',
  grid: '',
  icon: '✦',
  booking_button: 'Book an appointment',
};

const DEFAULT_SECTION_SETTINGS = {
  hero: {
    title: 'Welcome to our business',
    subtitle: 'Tell visitors what makes your business special.',
    buttonText: 'Get started',
    buttonLink: '',
    alignment: 'left',
    height: 'large',
  },
  about: {
    title: 'About us',
    description: 'Tell customers about your business.',
  },
  image_text: {
    title: 'A little about what we do',
    description: 'Add a description about your business.',
  },
  rich_text: {
    title: 'Tell your story',
    content: 'Write something meaningful for your visitors.',
  },
  custom_content: {
    title: 'Custom content',
    content: 'Add your own content here.',
  },
  gallery: {
    title: 'Our gallery',
    images: [],
  },
  product_grid: {
    title: 'Our products',
    limit: 8,
  },
  featured_products: {
    title: 'Featured products',
    limit: 4,
  },
  services: {
    title: 'Our services',
    limit: 6,
  },
  featured_services: {
    title: 'Featured services',
    limit: 3,
  },
  service_packages: {
    title: 'Our packages',
    limit: 3,
  },
  portfolio_grid: {
    title: 'Selected projects',
    limit: 6,
  },
  featured_projects: {
    title: 'Featured work',
    limit: 3,
  },
  contact: {
    title: 'Let’s work together',
    description: 'Have a question? Get in touch.',
    buttonText: 'Contact us',
  },
  booking: {
    title: 'Ready to book?',
    buttonText: 'View services',
  },
  faq: {
    title: 'Frequently asked questions',
  },
  categories: {
    title: 'Browse categories',
  },
  announcement: {
    text: 'Welcome to our business',
  },
  footer: {
    text: '',
  },
};

function PanelInput({ label, value, onChange, multiline = false, placeholder = '' }) {
  const common = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600';

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={common}
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

function PanelSelect({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Inspector({ element, section, onUpdateElement, onUpdateSection }) {
  if (element) {
    const update = (key, value) => onUpdateElement(element.id, { [key]: value });
    const updateStyle = (key, value) => {
      onUpdateElement(element.id, {
        style: { ...(element.style || {}), [key]: value },
      });
    };
    const updateAction = (key, value) => {
      onUpdateElement(element.id, {
        action: { ...(element.action || {}), [key]: value },
      });
    };
    const updateAnimation = (key, value) => {
      onUpdateElement(element.id, {
        animation: { ...(element.animation || {}), [key]: value },
      });
    };

    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-slate-900">Element settings</p>
          <p className="mt-1 text-xs text-slate-500">{element.type.replaceAll('_', ' ')}</p>
        </div>

        {['heading', 'text', 'button', 'icon', 'booking_button'].includes(element.type) && (
          <PanelInput
            label="Content"
            value={element.content}
            multiline={element.type === 'text'}
            onChange={(value) => update('content', value)}
          />
        )}

        {['image', 'video'].includes(element.type) && (
          <>
            <PanelInput
              label={element.type === 'image' ? 'Image URL' : 'Video URL'}
              value={element.src}
              onChange={(value) => update('src', value)}
              placeholder="https://..."
            />
            <p className="text-xs text-slate-400">
              Device uploads and media management are the next editor integration.
            </p>
          </>
        )}

        {['columns', 'grid'].includes(element.type) && (
          <PanelSelect
            label="Columns"
            value={element.settings?.columns || 2}
            onChange={(value) => onUpdateElement(element.id, {
              settings: { ...(element.settings || {}), columns: Number(value) },
            })}
            options={[
              { value: 1, label: '1 column' },
              { value: 2, label: '2 columns' },
              { value: 3, label: '3 columns' },
              { value: 4, label: '4 columns' },
            ]}
          />
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Appearance</p>

          <PanelInput
            label="Text colour"
            value={element.style?.color || ''}
            onChange={(value) => updateStyle('color', value)}
            placeholder="#111827"
          />

          <PanelInput
            label="Background colour"
            value={element.style?.backgroundColor || ''}
            onChange={(value) => updateStyle('backgroundColor', value)}
            placeholder="#FFFFFF"
          />

          <PanelInput
            label="Font size (px)"
            value={element.style?.fontSize || 16}
            onChange={(value) => updateStyle('fontSize', Number(value))}
          />

          <PanelSelect
            label="Font weight"
            value={element.style?.fontWeight || 'normal'}
            onChange={(value) => updateStyle('fontWeight', value)}
            options={[
              { value: 'normal', label: 'Regular' },
              { value: 'medium', label: 'Medium' },
              { value: 'semibold', label: 'Semibold' },
              { value: 'bold', label: 'Bold' },
            ]}
          />

          <PanelSelect
            label="Alignment"
            value={element.style?.textAlign || 'left'}
            onChange={(value) => updateStyle('textAlign', value)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
              { value: 'right', label: 'Right' },
            ]}
          />

          <PanelInput
            label="Border radius"
            value={element.style?.borderRadius || '0'}
            onChange={(value) => updateStyle('borderRadius', value)}
            placeholder="12px"
          />

          <PanelInput
            label="Padding"
            value={element.style?.padding || '0'}
            onChange={(value) => updateStyle('padding', value)}
            placeholder="12px"
          />
        </div>

        {['button', 'booking_button'].includes(element.type) && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Button action</p>

            <PanelSelect
              label="Action"
              value={element.action?.type || 'none'}
              onChange={(value) => updateAction('type', value)}
              options={[
                { value: 'none', label: 'No action' },
                { value: 'page', label: 'Storefront page' },
                { value: 'external', label: 'External URL' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'phone', label: 'Phone call' },
                { value: 'email', label: 'Email' },
                { value: 'products', label: 'Products' },
                { value: 'services', label: 'Services' },
                { value: 'booking', label: 'Booking' },
                { value: 'contact', label: 'Contact' },
              ]}
            />

            {['page', 'external', 'whatsapp', 'phone', 'email'].includes(element.action?.type) && (
              <PanelInput
                label="Destination"
                value={element.action?.value || ''}
                onChange={(value) => updateAction('value', value)}
                placeholder="Enter destination"
              />
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Animation</p>

          <PanelSelect
            label="Preset"
            value={element.animation?.preset || 'none'}
            onChange={(value) => updateAnimation('preset', value)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'fade', label: 'Fade' },
              { value: 'fade_up', label: 'Fade up' },
              { value: 'fade_down', label: 'Fade down' },
              { value: 'slide_left', label: 'Slide left' },
              { value: 'slide_right', label: 'Slide right' },
              { value: 'zoom', label: 'Zoom' },
            ]}
          />

          <PanelSelect
            label="Trigger"
            value={element.animation?.trigger || 'scroll'}
            onChange={(value) => updateAnimation('trigger', value)}
            options={[
              { value: 'load', label: 'On page load' },
              { value: 'scroll', label: 'On scroll' },
              { value: 'hover', label: 'On hover' },
            ]}
          />

          <PanelInput
            label="Duration (ms)"
            value={element.animation?.duration || 500}
            onChange={(value) => updateAnimation('duration', Number(value))}
          />

          <PanelInput
            label="Delay (ms)"
            value={element.animation?.delay || 0}
            onChange={(value) => updateAnimation('delay', Number(value))}
          />
        </div>
      </div>
    );
  }

  if (section) {
    const settings = section.settings || {};

    const set = (key, value) => onUpdateSection(section.id, key, value);

    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-slate-900">Section settings</p>
          <p className="mt-1 text-xs text-slate-500">
            {SECTION_LABELS[section.type] || section.type}
          </p>
        </div>

        {settings.title !== undefined && (
          <PanelInput label="Title" value={settings.title} onChange={(value) => set('title', value)} />
        )}

        {settings.subtitle !== undefined && (
          <PanelInput label="Subtitle" value={settings.subtitle} onChange={(value) => set('subtitle', value)} multiline />
        )}

        {settings.description !== undefined && (
          <PanelInput label="Description" value={settings.description} onChange={(value) => set('description', value)} multiline />
        )}

        {settings.content !== undefined && (
          <PanelInput label="Content" value={settings.content} onChange={(value) => set('content', value)} multiline />
        )}

        {settings.buttonText !== undefined && (
          <PanelInput label="Button text" value={settings.buttonText} onChange={(value) => set('buttonText', value)} />
        )}

        {settings.buttonLink !== undefined && (
          <PanelInput label="Button link" value={settings.buttonLink} onChange={(value) => set('buttonLink', value)} />
        )}

        {settings.backgroundImage !== undefined && (
          <PanelInput label="Background image URL" value={settings.backgroundImage} onChange={(value) => set('backgroundImage', value)} />
        )}

        {settings.image !== undefined && (
          <PanelInput label="Image URL" value={settings.image} onChange={(value) => set('image', value)} />
        )}

        {settings.limit !== undefined && (
          <PanelInput label="Items to display" value={settings.limit} onChange={(value) => set('limit', Number(value))} />
        )}

        {settings.alignment !== undefined && (
          <PanelSelect
            label="Alignment"
            value={settings.alignment}
            onChange={(value) => set('alignment', value)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
            ]}
          />
        )}

        {settings.height !== undefined && (
          <PanelSelect
            label="Hero height"
            value={settings.height}
            onChange={(value) => set('height', value)}
            options={[
              { value: 'small', label: 'Short' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Tall' },
            ]}
          />
        )}

        <p className="text-xs leading-5 text-slate-400">
          Add independent text, buttons, images and other elements to this section using the Add element control.
        </p>
      </div>
    );
  }

  return (
    <div className="py-10 text-center">
      <Settings2 className="mx-auto text-slate-300" size={28} />
      <p className="mt-3 text-sm font-semibold text-slate-700">Nothing selected</p>
      <p className="mt-1 text-xs text-slate-400">Select a section or element to edit it.</p>
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
  const [selectedElementId, setSelectedElementId] = useState('');
  const [device, setDevice] = useState('desktop');
  const [panel, setPanel] = useState('layers');
  const [showSections, setShowSections] = useState(false);
  const [showElements, setShowElements] = useState(false);
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

  const selectedElement = selectedSection?.elements?.find(
    (element) => element.id === selectedElementId
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
        const result = await api('/businesses/current/storefront', { biz: true });

        if (cancelled) return;

        const config = normalizeStorefrontConfig(
          result.storefront || business.storefront || {},
          business.name
        );

        setStorefront(config);
        currentRef.current = config;
        setSavedSnapshot(JSON.stringify(config));

        setActivePageId(
          config.pages.find((page) => page.isHome)?.id ||
          config.pages[0]?.id ||
          ''
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load your storefront.');
        }
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

      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current) return current;

      setHistory((items) => [...items.slice(-39), current]);
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

  const updateElement = (elementId, changes) => {
    if (!activePage || !selectedSection) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) => {
        if (page.id !== activePage.id) return page;

        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id !== selectedSection.id) return section;

            return {
              ...section,
              elements: section.elements.map((element) =>
                element.id === elementId
                  ? { ...element, ...changes }
                  : element
              ),
            };
          }),
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
          : 'Saved. You have newer unsaved changes.'
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

    const settings = {
      ...(DEFAULT_SECTION_SETTINGS[type] || {}),
    };

    if (type === 'hero') {
      settings.title = business.name || 'Welcome to our business';
      if (businessType === 'product') {
        settings.buttonLink = '/products';
      } else {
        settings.buttonLink = '/services';
      }
    }

    const section = createSection(type, settings);

    updatePage(activePage.id, {
      sections: [...activePage.sections, section],
    });

    setSelectedSectionId(section.id);
    setSelectedElementId('');
    setShowSections(false);
    setPanel('inspector');
  };

  const addElement = (type) => {
    if (!activePage || !selectedSection) return;

    if (!ELEMENT_TYPES.includes(type)) return;

    const element = createElement(type, {
      content: DEFAULT_ELEMENT_CONTENT[type] || '',
      settings: type === 'spacer'
        ? { height: 40 }
        : type === 'columns' || type === 'grid'
          ? { columns: 2 }
          : {},
      style: {
        fontSize: type === 'heading' ? 32 : 16,
        fontWeight: type === 'heading' ? 'bold' : 'normal',
      },
    });

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id !== selectedSection.id
                  ? section
                  : {
                      ...section,
                      elements: [...(section.elements || []), element],
                    }
              ),
            }
      ),
    }));

    setSelectedElementId(element.id);
    setShowElements(false);
    setPanel('inspector');
  };

  const removeElement = (elementId) => {
    if (!activePage || !selectedSection) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id !== selectedSection.id
                  ? section
                  : {
                      ...section,
                      elements: section.elements.filter((item) => item.id !== elementId),
                    }
              ),
            }
      ),
    }));

    setSelectedElementId('');
  };

  const moveElement = (elementId, direction) => {
    if (!selectedSection) return;

    const elements = [...selectedSection.elements];
    const index = elements.findIndex((item) => item.id === elementId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= elements.length) return;

    [elements[index], elements[target]] = [elements[target], elements[index]];

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id === selectedSection.id
                  ? { ...section, elements }
                  : section
              ),
            }
      ),
    }));
  };

  const removeSection = (sectionId) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.filter((section) => section.id !== sectionId),
    });

    setSelectedSectionId('');
    setSelectedElementId('');
    setPanel('layers');
  };

  const moveSection = (sectionId, direction) => {
    if (!activePage) return;

    const sections = [...activePage.sections];
    const index = sections.findIndex((section) => section.id === sectionId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= sections.length) return;

    [sections[index], sections[target]] = [sections[target], sections[index]];

    updatePage(activePage.id, { sections });
  };

  const duplicateSection = (section) => {
    if (!activePage) return;

    const copy = createSection(section.type, {
      ...(section.settings || {}),
    });

    copy.elements = (section.elements || []).map((element) => ({
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      children: (element.children || []).map((child) => ({
        ...child,
        id: `${child.id}-copy-${Date.now()}`,
      })),
    }));

    const index = activePage.sections.findIndex((item) => item.id === section.id);
    const next = [...activePage.sections];
    next.splice(index + 1, 0, copy);

    updatePage(activePage.id, { sections: next });
    setSelectedSectionId(copy.id);
    setSelectedElementId('');
  };

  const addPage = () => {
    if (!storefront) return;

    const number = storefront.pages.length + 1;
    const page = createPage({
      title: `Page ${number}`,
      slug: `page-${number}`,
      sections: [
        createSection('hero', {
          title: `Page ${number}`,
          subtitle: 'Add content to this page.',
        }),
      ],
    });

    commit((current) => ({
      ...current,
      pages: [...current.pages, page],
      activePage: page.slug,
    }));

    setActivePageId(page.id);
    setSelectedSectionId('');
    setSelectedElementId('');
    setPanel('layers');
  };

  const updateTheme = (key, value) => {
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

  const storeUrl = business.slug ? `/store/${business.slug}` : '/';

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
      <header className="z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/app" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
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

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {[
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ].map(([value, Icon]) => (
              <button
                key={value}
                onClick={() => setDevice(value)}
                className={`rounded-lg p-2 ${device === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                title={`${value} preview`}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>

          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 sm:flex"
          >
            <Eye size={15} /> Preview
          </a>

          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className={`flex items-center justify-between px-4 py-2 text-xs ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
          <span>{error || notice}</span>
          <button onClick={() => { setError(''); setNotice(''); }}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* LEFT TOOL PANEL */}
        <aside className="z-20 flex w-[68px] shrink-0 flex-col border-r border-slate-200 bg-white md:w-[250px]">
          <div className="grid grid-cols-2 border-b border-slate-100 p-2">
            <button
              onClick={() => setPanel('layers')}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold md:flex-row md:justify-center md:text-xs ${panel === 'layers' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}
            >
              <Layers size={17} /> <span>Layers</span>
            </button>
            <button
              onClick={() => setPanel('theme')}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold md:flex-row md:justify-center md:text-xs ${panel === 'theme' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}
            >
              <Palette size={17} /> <span>Theme</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 md:p-4">
            {panel === 'layers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pages</p>
                  <button onClick={addPage} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50" title="Add page">
                    <Plus size={17} />
                  </button>
                </div>

                <div className="space-y-1">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setActivePageId(page.id);
                        setSelectedSectionId('');
                        setSelectedElementId('');
                      }}
                      className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs font-medium ${activePage?.id === page.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {page.title} {page.isHome ? '(Home)' : ''}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sections</p>
                    <button onClick={() => setShowSections(true)} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50">
                      <Plus size={17} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {(activePage?.sections || []).map((section, index) => (
                      <div key={section.id}>
                        <button
                          onClick={() => {
                            setSelectedSectionId(section.id);
                            setSelectedElementId('');
                            setPanel('layers');
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selectedSectionId === section.id ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {SECTION_LABELS[section.type] || section.type}
                        </button>

                        {selectedSectionId === section.id && (
                          <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-2">
                            {(section.elements || []).map((element) => (
                              <button
                                key={element.id}
                                onClick={() => {
                                  setSelectedElementId(element.id);
                                  setPanel('inspector');
                                }}
                                className={`w-full truncate rounded-lg px-2 py-2 text-left text-[11px] ${selectedElementId === element.id ? 'bg-emerald-100 font-bold text-emerald-900' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                {element.type.replaceAll('_', ' ')} — {element.content || 'Element'}
                              </button>
                            ))}

                            <button
                              onClick={() => setShowElements(true)}
                              className="flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <Plus size={13} /> Add element
                            </button>
                          </div>
                        )}

                        {selectedSectionId === section.id && (
                          <div className="mt-1 flex items-center gap-1 px-2">
                            <button onClick={() => moveSection(section.id, -1)} disabled={index === 0} className="rounded p-1 text-slate-400 disabled:opacity-20" title="Move up">
                              <ChevronUp size={14} />
                            </button>
                            <button onClick={() => moveSection(section.id, 1)} disabled={index === activePage.sections.length - 1} className="rounded p-1 text-slate-400 disabled:opacity-20" title="Move down">
                              <ChevronDown size={14} />
                            </button>
                            <button onClick={() => duplicateSection(section)} className="rounded p-1 text-slate-400 hover:text-emerald-700" title="Duplicate section">
                              <Copy size={14} />
                            </button>
                            <button onClick={() => removeSection(section.id)} className="rounded p-1 text-slate-400 hover:text-red-600" title="Delete section">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {panel === 'theme' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">Theme</p>
                  <p className="mt-1 text-xs text-slate-500">Set the global storefront appearance.</p>
                </div>

                {[
                  ['primaryColor', 'Primary colour'],
                  ['secondaryColor', 'Secondary colour'],
                  ['accentColor', 'Accent colour'],
                  ['backgroundColor', 'Background'],
                  ['surfaceColor', 'Surface'],
                  ['textColor', 'Text'],
                  ['mutedColor', 'Muted text'],
                  ['borderColor', 'Borders'],
                ].map(([key, label]) => (
                  <label key={key} className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={storefront.theme?.[key] || '#FFFFFF'}
                        onChange={(event) => updateTheme(key, event.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                      <input
                        value={storefront.theme?.[key] || ''}
                        onChange={(event) => updateTheme(key, event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs uppercase"
                      />
                    </div>
                  </label>
                ))}

                <PanelSelect
                  label="Border radius"
                  value={storefront.theme?.borderRadius || 'medium'}
                  onChange={(value) => updateTheme('borderRadius', value)}
                  options={[
                    { value: 'none', label: 'Square' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                    { value: 'full', label: 'Pill' },
                  ]}
                />
              </div>
            )}

            {panel === 'inspector' && (
              <Inspector
                element={selectedElement}
                section={selectedSection}
                onUpdateElement={updateElement}
                onUpdateSection={updateSection}
              />
            )}
          </div>
        </aside>

        {/* CANVAS */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-12 items-center justify-between border-b border-slate-200 bg-white px-3 md:px-5">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-700">
                {activePage?.title || 'Your page'}
              </p>
            </div>

            <div className="flex items-center gap-1 sm:hidden">
              {[
                ['desktop', Monitor],
                ['tablet', Tablet],
                ['mobile', Smartphone],
              ].map(([value, Icon]) => (
                <button
                  key={value}
                  onClick={() => setDevice(value)}
                  className={`rounded-lg p-2 ${device === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSections(true)}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
            >
              <Plus size={14} /> Add section
            </button>
          </div>

          <div className="flex-1 overflow-auto p-3 md:p-6">
            <div
              className="mx-auto min-h-full overflow-hidden bg-white shadow-xl transition-all duration-200"
              style={{ width: previewWidth, maxWidth: '100%' }}
            >
              <StorefrontRenderer
                pageSlug={activePage?.isHome ? 'home' : activePage?.slug || 'home'}
                biz={business}
                storefront={storefront}
                slug={business.slug || ''}
                storeBase={business.slug ? `/store/${business.slug}` : ''}
                color={storefront.theme?.primaryColor || business.brandColor || '#0B3D2E'}
                editorMode
                selectedSectionId={selectedSectionId}
                onSelectSection={(id) => {
                  setSelectedSectionId(id);
                  setSelectedElementId('');
                  setPanel('inspector');
                }}
              />

              {!activePage?.sections?.length && (
                <div className="px-8 py-24 text-center">
                  <h2 className="text-xl font-bold">Start building your page</h2>
                  <p className="mt-2 text-sm text-slate-500">Add a section to begin designing your storefront.</p>
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
        </main>

        {/* RIGHT INSPECTOR */}
        <aside className="hidden w-[290px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 xl:block">
          <Inspector
            element={selectedElement}
            section={selectedSection}
            onUpdateElement={updateElement}
            onUpdateSection={updateSection}
          />

          {selectedElement && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Element order</p>
                <button onClick={() => removeElement(selectedElement.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => moveElement(selectedElement.id, -1)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold">
                  Move up
                </button>
                <button onClick={() => moveElement(selectedElement.id, 1)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold">
                  Move down
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ADD SECTION DIALOG */}
      {showSections && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add a section</h2>
                <p className="mt-1 text-xs text-slate-500">Choose a section for this page.</p>
              </div>
              <button onClick={() => setShowSections(false)} className="rounded-xl p-2 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableSections.map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {SECTION_LABELS[type] || type}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">Add to page</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD ELEMENT DIALOG */}
      {showElements && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add an element</h2>
                <p className="mt-1 text-xs text-slate-500">Add an independent element to the selected section.</p>
              </div>
              <button onClick={() => setShowElements(false)} className="rounded-xl p-2 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ELEMENT_OPTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addElement(type)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <Icon size={18} className="text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
