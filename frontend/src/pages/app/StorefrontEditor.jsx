import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Monitor, Tablet, Smartphone, Plus, Save, Eye,
  Trash2, Copy, ChevronUp, ChevronDown, Undo2, Redo2,
  Layers, Type, Image as ImageIcon, MousePointer, Columns3,
  Minus, Video, ShoppingBag, BriefcaseBusiness, CalendarDays,
  Palette, X, Settings2, LayoutTemplate, Upload, ZoomIn,
  ZoomOut, Maximize2, FileText, Paintbrush, Menu,
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
  { type: 'text', label: 'Text', icon: FileText },
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
  gallery: { title: 'Our gallery', images: [] },
  product_grid: { title: 'Our products', limit: 8 },
  featured_products: { title: 'Featured products', limit: 4 },
  services: { title: 'Our services', limit: 6 },
  featured_services: { title: 'Featured services', limit: 3 },
  service_packages: { title: 'Our packages', limit: 3 },
  portfolio_grid: { title: 'Selected projects', limit: 6 },
  featured_projects: { title: 'Featured work', limit: 3 },
  contact: {
    title: 'Let’s work together',
    description: 'Have a question? Get in touch.',
    buttonText: 'Contact us',
  },
  booking: { title: 'Ready to book?', buttonText: 'View services' },
  faq: { title: 'Frequently asked questions' },
  categories: { title: 'Browse categories' },
  announcement: { text: 'Welcome to our business' },
  footer: { text: '' },
};

const TOOL_ITEMS = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Layers },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'background', label: 'Background', icon: Paintbrush },
  { id: 'pages', label: 'Pages', icon: FileText },
];

/*
 * These are the app navigation destinations shown by the editor menu.
 * Keep these paths aligned with the routes registered in your app router.
 */
const APP_NAVIGATION = [
  { label: 'Dashboard', path: '/app' },
  { label: 'Products', path: '/app/products' },
  { label: 'Services', path: '/app/services' },
  { label: 'Bookings', path: '/app/bookings' },
  { label: 'Orders', path: '/app/orders' },
  { label: 'POS', path: '/app/pos' },
  { label: 'Inventory', path: '/app/inventory' },
  { label: 'Customers', path: '/app/customers' },
  { label: 'Reports', path: '/app/reports' },
  { label: 'Billing', path: '/app/billing' },
  { label: 'Settings', path: '/app/settings' },
];

function Field({ label, value, onChange, multiline = false, placeholder = '' }) {
  const className =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-emerald-600';

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
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

function ColorField({ label, value, onChange }) {
  return (
    <Field
      label={label}
      value={value || ''}
      onChange={onChange}
      placeholder="#FFFFFF"
    />
  );
}

function Inspector({
  element,
  section,
  onUpdateElement,
  onUpdateSection,
  onRemoveElement,
}) {
  if (element) {
    const update = (key, value) =>
      onUpdateElement(element.id, { [key]: value });

    const updateStyle = (key, value) =>
      onUpdateElement(element.id, {
        style: { ...(element.style || {}), [key]: value },
      });

    const updateAction = (key, value) =>
      onUpdateElement(element.id, {
        action: { ...(element.action || {}), [key]: value },
      });

    const updateAnimation = (key, value) =>
      onUpdateElement(element.id, {
        animation: { ...(element.animation || {}), [key]: value },
      });

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Edit element</p>
            <p className="text-xs capitalize text-slate-400">
              {element.type.replaceAll('_', ' ')}
            </p>
          </div>
          <button
            onClick={() => onRemoveElement(element.id)}
            className="rounded-xl p-2 text-red-500 hover:bg-red-50"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {['heading', 'text', 'button', 'icon', 'booking_button'].includes(element.type) && (
          <Field
            label="Content"
            value={element.content}
            multiline={element.type === 'text'}
            onChange={(value) => update('content', value)}
          />
        )}

        {['image', 'video'].includes(element.type) && (
          <Field
            label={element.type === 'image' ? 'Image URL' : 'Video URL'}
            value={element.src}
            onChange={(value) => update('src', value)}
            placeholder="https://..."
          />
        )}

        {['columns', 'grid'].includes(element.type) && (
          <SelectField
            label="Columns"
            value={element.settings?.columns || 2}
            onChange={(value) =>
              onUpdateElement(element.id, {
                settings: {
                  ...(element.settings || {}),
                  columns: Number(value),
                },
              })
            }
            options={[1, 2, 3, 4].map((n) => ({
              value: n,
              label: `${n} columns`,
            }))}
          />
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Appearance
          </p>

          <ColorField
            label="Text colour"
            value={element.style?.color}
            onChange={(value) => updateStyle('color', value)}
          />

          <ColorField
            label="Background colour"
            value={element.style?.backgroundColor}
            onChange={(value) => updateStyle('backgroundColor', value)}
          />

          <Field
            label="Font size (px)"
            value={element.style?.fontSize || 16}
            onChange={(value) => updateStyle('fontSize', Number(value))}
          />

          <SelectField
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

          <SelectField
            label="Text alignment"
            value={element.style?.textAlign || 'left'}
            onChange={(value) => updateStyle('textAlign', value)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
              { value: 'right', label: 'Right' },
            ]}
          />

          <Field
            label="Border radius"
            value={element.style?.borderRadius || '0'}
            onChange={(value) => updateStyle('borderRadius', value)}
          />

          <Field
            label="Padding"
            value={element.style?.padding || '0'}
            onChange={(value) => updateStyle('padding', value)}
          />
        </div>

        {['button', 'booking_button'].includes(element.type) && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Button action
            </p>

            <SelectField
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
              <Field
                label="Destination"
                value={element.action?.value || ''}
                onChange={(value) => updateAction('value', value)}
              />
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Animation
          </p>

          <SelectField
            label="Animation"
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

          <Field
            label="Duration (ms)"
            value={element.animation?.duration || 500}
            onChange={(value) => updateAnimation('duration', Number(value))}
          />

          <Field
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
          <p className="text-xs text-slate-400">
            {SECTION_LABELS[section.type] || section.type}
          </p>
        </div>

        {settings.title !== undefined && (
          <Field label="Title" value={settings.title} onChange={(v) => set('title', v)} />
        )}

        {settings.subtitle !== undefined && (
          <Field label="Subtitle" value={settings.subtitle} multiline onChange={(v) => set('subtitle', v)} />
        )}

        {settings.description !== undefined && (
          <Field label="Description" value={settings.description} multiline onChange={(v) => set('description', v)} />
        )}

        {settings.content !== undefined && (
          <Field label="Content" value={settings.content} multiline onChange={(v) => set('content', v)} />
        )}

        {settings.buttonText !== undefined && (
          <Field label="Button text" value={settings.buttonText} onChange={(v) => set('buttonText', v)} />
        )}

        {settings.buttonLink !== undefined && (
          <Field label="Button link" value={settings.buttonLink} onChange={(v) => set('buttonLink', v)} />
        )}

        {settings.backgroundImage !== undefined && (
          <Field label="Background image URL" value={settings.backgroundImage} onChange={(v) => set('backgroundImage', v)} />
        )}

        {settings.image !== undefined && (
          <Field label="Image URL" value={settings.image} onChange={(v) => set('image', v)} />
        )}

        {settings.limit !== undefined && (
          <Field label="Items to display" value={settings.limit} onChange={(v) => set('limit', Number(v))} />
        )}

        {settings.alignment !== undefined && (
          <SelectField
            label="Alignment"
            value={settings.alignment}
            onChange={(v) => set('alignment', v)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
            ]}
          />
        )}

        {settings.height !== undefined && (
          <SelectField
            label="Section height"
            value={settings.height}
            onChange={(v) => set('height', v)}
            options={[
              { value: 'small', label: 'Short' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Tall' },
            ]}
          />
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Section background
          </p>
          <Field
            label="Background colour"
            value={settings.backgroundColor || ''}
            onChange={(v) => set('backgroundColor', v)}
            placeholder="#FFFFFF"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 text-center">
      <Settings2 className="mx-auto text-slate-300" size={28} />
      <p className="mt-3 text-sm font-semibold text-slate-700">Nothing selected</p>
      <p className="mt-1 text-xs text-slate-400">
        Select an element or section to customize it.
      </p>
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
  const [zoom, setZoom] = useState(100);

  const [panel, setPanel] = useState('layers');
  const [activeTool, setActiveTool] = useState('elements');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [appMenuOpen, setAppMenuOpen] = useState(false);

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
  const uploadRef = useRef(null);

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

  const dirty = !!storefront && JSON.stringify(storefront) !== savedSnapshot;

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

  useEffect(() => {
    if (!appMenuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAppMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [appMenuOpen]);

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
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
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
            }
      ),
    }));
  };

  const updateElement = (elementId, changes) => {
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
                      elements: (section.elements || []).map((element) =>
                        element.id === elementId
                          ? { ...element, ...changes }
                          : element
                      ),
                    }
              ),
            }
      ),
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

    const settings = { ...(DEFAULT_SECTION_SETTINGS[type] || {}) };

    if (type === 'hero') {
      settings.title = business.name || 'Welcome to our business';
      settings.buttonLink = businessType === 'product' ? '/products' : '/services';
    }

    const section = createSection(type, settings);

    updatePage(activePage.id, {
      sections: [...(activePage.sections || []), section],
    });

    setSelectedSectionId(section.id);
    setSelectedElementId('');
    setShowSections(false);
    setPanel('inspector');
    setDrawerOpen(true);
  };

  const addElement = (type) => {
    if (!activePage || !selectedSection || !ELEMENT_TYPES.includes(type)) return;

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
    setActiveTool('elements');
    setDrawerOpen(true);
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
                      elements: (section.elements || []).filter(
                        (item) => item.id !== elementId
                      ),
                    }
              ),
            }
      ),
    }));

    setSelectedElementId('');
  };

  const moveElement = (elementId, direction) => {
    if (!selectedSection) return;

    const elements = [...(selectedSection.elements || [])];
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

    const copy = createSection(section.type, { ...(section.settings || {}) });

    copy.elements = (section.elements || []).map((element) => ({
      ...element,
      id: `${element.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));

    const next = [...activePage.sections];
    const index = next.findIndex((item) => item.id === section.id);
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
    setActiveTool('pages');
    setDrawerOpen(true);
  };

  const updateTheme = (key, value) => {
    commit((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
    }));
  };

  const updatePageBackground = (value) => {
    if (!activePage) return;
    updatePage(activePage.id, {
      backgroundColor: value,
    });
  };

  const updateSelectedBackground = (value) => {
    if (selectedElement) {
      updateElement(selectedElement.id, {
        style: {
          ...(selectedElement.style || {}),
          backgroundColor: value,
        },
      });
    } else if (selectedSection) {
      updateSection(selectedSection.id, 'backgroundColor', value);
    } else {
      updatePageBackground(value);
    }
  };

  const handleTool = (id) => {
    setActiveTool(id);
    setDrawerOpen(true);

    if (id === 'elements') {
      setPanel('layers');
      setShowElements(true);
    } else if (id === 'text') {
      setPanel('layers');
      setShowElements(true);
    } else if (id === 'brand') {
      setPanel('theme');
    } else if (id === 'background') {
      setPanel('background');
    } else if (id === 'pages') {
      setPanel('pages');
    } else if (id === 'templates') {
      setPanel('templates');
    } else if (id === 'uploads') {
      uploadRef.current?.click();
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setNotice('Image selected. Upload integration will be connected in the media phase.');
    event.target.value = '';
  };

  const storeUrl = business.slug ? `/store/${business.slug}` : '/';

  const previewWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
  }[device];

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
        <p className="text-sm text-red-600">
          {error || 'Could not load editor.'}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#f1f2f5]">
      {/* TOP BAR */}
      <header className="relative z-[90] flex min-h-[58px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setAppMenuOpen((open) => !open)}
            aria-label="Open main navigation"
            aria-expanded={appMenuOpen}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              appMenuOpen
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {appMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {business.name || 'Your storefront'}
            </p>
            <p className="text-[10px] text-slate-400">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={undo}
            disabled={!history.length}
            className="rounded-lg p-2 text-slate-600 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 size={17} />
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            className="rounded-lg p-2 text-slate-600 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl border border-slate-200 p-2 text-slate-600 sm:block"
            title="Preview storefront"
          >
            <Eye size={17} />
          </a>

          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            <Save size={15} />
            <span>{saving ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* MAIN APP NAVIGATION */}
      {appMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setAppMenuOpen(false)}
            className="fixed inset-0 z-[95] bg-slate-950/30"
          />

          <nav className="fixed left-3 top-[66px] z-[100] max-h-[calc(100svh-90px)] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
            <div className="border-b border-slate-100 px-3 pb-3">
              <p className="text-sm font-bold text-slate-900">
                {business.name || 'Zuno'}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Main navigation
              </p>
            </div>

            <div className="mt-2 space-y-1">
              {APP_NAVIGATION.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setAppMenuOpen(false)}
                  className={`block rounded-xl px-3 py-3 text-sm font-medium transition ${
                    item.path === '/app'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setAppMenuOpen(false)}
                className="w-full rounded-xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-600"
              >
                Return to editor
              </button>
            </div>
          </nav>
        </>
      )}

      {(error || notice) && (
        <div className={`z-30 flex shrink-0 items-center justify-between px-4 py-2 text-xs ${
          error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
        }`}>
          <span>{error || notice}</span>
          <button onClick={() => { setError(''); setNotice(''); }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* WORKSPACE */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* DESKTOP LEFT SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="grid grid-cols-2 border-b border-slate-100 p-2">
            <button
              onClick={() => setPanel('layers')}
              className={`rounded-xl py-3 text-xs font-semibold ${
                panel === 'layers' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Layers size={16} className="mr-2 inline" />
              Layers
            </button>
            <button
              onClick={() => setPanel('theme')}
              className={`rounded-xl py-3 text-xs font-semibold ${
                panel === 'theme' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Palette size={16} className="mr-2 inline" />
              Brand
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === 'layers' && (
              <LayersPanel
                pages={pages}
                activePage={activePage}
                selectedSectionId={selectedSectionId}
                selectedElementId={selectedElementId}
                onPage={setActivePageId}
                onAddPage={addPage}
                onAddSection={() => setShowSections(true)}
                onAddElement={() => setShowElements(true)}
                onSelectSection={(id) => {
                  setSelectedSectionId(id);
                  setSelectedElementId('');
                  setPanel('inspector');
                }}
                onSelectElement={(sectionId, elementId) => {
                  setSelectedSectionId(sectionId);
                  setSelectedElementId(elementId);
                  setPanel('inspector');
                }}
                onMoveSection={moveSection}
                onDuplicateSection={duplicateSection}
                onRemoveSection={removeSection}
              />
            )}

            {panel === 'theme' && (
              <ThemePanel theme={storefront.theme} onUpdate={updateTheme} />
            )}

            {panel === 'inspector' && (
              <Inspector
                element={selectedElement}
                section={selectedSection}
                onUpdateElement={updateElement}
                onUpdateSection={updateSection}
                onRemoveElement={removeElement}
              />
            )}
          </div>
        </aside>

        {/* CANVAS AREA */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="z-10 flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3">
            <p className="min-w-0 truncate text-xs font-bold text-slate-700">
              {activePage?.title || 'Your page'}
            </p>

            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-1 sm:flex">
                {[
                  ['desktop', Monitor],
                  ['tablet', Tablet],
                  ['mobile', Smartphone],
                ].map(([value, Icon]) => (
                  <button
                    key={value}
                    onClick={() => setDevice(value)}
                    className={`rounded-lg p-2 ${
                      device === value
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-lg bg-slate-100">
                <button
                  onClick={() => setZoom((v) => Math.max(40, v - 10))}
                  className="rounded-lg p-2 text-slate-600"
                  title="Zoom out"
                >
                  <ZoomOut size={15} />
                </button>

                <span className="min-w-10 text-center text-[10px] font-semibold text-slate-600">
                  {zoom}%
                </span>

                <button
                  onClick={() => setZoom((v) => Math.min(150, v + 10))}
                  className="rounded-lg p-2 text-slate-600"
                  title="Zoom in"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              <button
                onClick={() => setZoom(100)}
                className="rounded-lg p-2 text-slate-500"
                title="Reset zoom"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          {/* CANVAS */}
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-5">
            <div
              className="mx-auto bg-white shadow-xl transition-all duration-200"
              style={{
                width: previewWidth,
                maxWidth: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: `${Math.max(0, (zoom - 100) * 4)}px`,
              }}
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
                  setDrawerOpen(true);
                }}
              />

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
        </main>

        {/* DESKTOP RIGHT INSPECTOR */}
        <aside className="hidden w-[290px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 xl:block">
          <Inspector
            element={selectedElement}
            section={selectedSection}
            onUpdateElement={updateElement}
            onUpdateSection={updateSection}
            onRemoveElement={removeElement}
          />

          {selectedElement && (
            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => moveElement(selectedElement.id, -1)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold"
              >
                Move up
              </button>
              <button
                onClick={() => moveElement(selectedElement.id, 1)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold"
              >
                Move down
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* MOBILE EDITING DRAWER */}
      <div className="relative z-40 shrink-0 border-t border-slate-200 bg-white md:hidden">
        {drawerOpen && (
          <div className="max-h-[38svh] overflow-y-auto overscroll-contain border-b border-slate-100 px-4 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold capitalize text-slate-900">
                  {selectedElement
                    ? 'Edit element'
                    : selectedSection
                      ? 'Edit section'
                      : activeTool}
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedElement?.type?.replaceAll('_', ' ') ||
                    (selectedSection && SECTION_LABELS[selectedSection.type]) ||
                    'Choose a tool to get started'}
                </p>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {panel === 'inspector' && (
              <Inspector
                element={selectedElement}
                section={selectedSection}
                onUpdateElement={updateElement}
                onUpdateSection={updateSection}
                onRemoveElement={removeElement}
              />
            )}

            {panel === 'theme' && (
              <ThemePanel theme={storefront.theme} onUpdate={updateTheme} />
            )}

            {panel === 'background' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Apply a background to the selected element, section or page.
                </p>

                <Field
                  label="Background colour"
                  value={
                    selectedElement?.style?.backgroundColor ||
                    selectedSection?.settings?.backgroundColor ||
                    activePage?.backgroundColor ||
                    ''
                  }
                  onChange={updateSelectedBackground}
                  placeholder="#FFFFFF"
                />

                <div className="flex flex-wrap gap-2">
                  {['#FFFFFF', '#F8FAFC', '#111827', '#0B3D2E', '#E8D8C8'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSelectedBackground(color)}
                      className="h-9 w-9 rounded-full border border-slate-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {panel === 'pages' && (
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setActivePageId(page.id);
                      setSelectedSectionId('');
                      setSelectedElementId('');
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left text-sm ${
                      activePage?.id === page.id
                        ? 'bg-emerald-50 font-bold text-emerald-800'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page.title} {page.isHome ? '(Home)' : ''}
                  </button>
                ))}

                <button
                  onClick={addPage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-sm font-semibold text-emerald-700"
                >
                  <Plus size={16} /> Add page
                </button>
              </div>
            )}

            {panel === 'templates' && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Template selection will be connected to the storefront template library.
              </div>
            )}

            {panel === 'layers' && (
              <LayersPanel
                pages={pages}
                activePage={activePage}
                selectedSectionId={selectedSectionId}
                selectedElementId={selectedElementId}
                onPage={setActivePageId}
                onAddPage={addPage}
                onAddSection={() => setShowSections(true)}
                onAddElement={() => setShowElements(true)}
                onSelectSection={(id) => {
                  setSelectedSectionId(id);
                  setSelectedElementId('');
                  setPanel('inspector');
                }}
                onSelectElement={(sectionId, elementId) => {
                  setSelectedSectionId(sectionId);
                  setSelectedElementId(elementId);
                  setPanel('inspector');
                }}
                onMoveSection={moveSection}
                onDuplicateSection={duplicateSection}
                onRemoveSection={removeSection}
              />
            )}
          </div>
        )}

        {/* CANVA-STYLE TOOLBAR */}
        <div className="flex items-center gap-1 overflow-x-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {TOOL_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTool(id)}
              className={`flex min-w-[76px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                activeTool === id
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-500'
              }`}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HIDDEN UPLOAD INPUT */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {/* ADD SECTION DIALOG */}
      {showSections && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
          <div className="max-h-[82svh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add a section</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a section for this page.
                </p>
              </div>
              <button
                onClick={() => setShowSections(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableSections.map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="rounded-2xl border border-slate-200 p-4 text-left hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {SECTION_LABELS[type] || type}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Add to page
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD ELEMENT DIALOG */}
      {showElements && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
          <div className="max-h-[82svh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add an element</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose what you want to add.
                </p>
              </div>
              <button
                onClick={() => setShowElements(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ELEMENT_OPTIONS
                .filter(({ type }) => activeTool !== 'text' || ['heading', 'text', 'button'].includes(type))
                .map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (!selectedSection) {
                        setError('Select a section first, then add an element.');
                        setShowElements(false);
                        return;
                      }
                      addElement(type);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-emerald-500 hover:bg-emerald-50"
                  >
                    <Icon size={18} className="text-emerald-700" />
                    <span className="text-xs font-semibold text-slate-700">
                      {label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LayersPanel({
  pages,
  activePage,
  selectedSectionId,
  selectedElementId,
  onPage,
  onAddPage,
  onAddSection,
  onAddElement,
  onSelectSection,
  onSelectElement,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pages
          </p>
          <button
            onClick={onAddPage}
            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-1">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPage(page.id)}
              className={`w-full truncate rounded-xl px-3 py-3 text-left text-xs ${
                activePage?.id === page.id
                  ? 'bg-emerald-50 font-bold text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page.title} {page.isHome ? '(Home)' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sections
          </p>
          <button
            onClick={onAddSection}
            className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {(activePage?.sections || []).map((section, index) => (
            <div key={section.id} className="rounded-xl">
              <button
                onClick={() => onSelectSection(section.id)}
                className={`w-full rounded-xl px-3 py-3 text-left text-xs ${
                  selectedSectionId === section.id
                    ? 'bg-emerald-50 font-bold text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {SECTION_LABELS[section.type] || section.type}
              </button>

              {selectedSectionId === section.id && (
                <div className="ml-3 mt-2 space-y-1 border-l border-slate-200 pl-2">
                  {(section.elements || []).map((element) => (
                    <button
                      key={element.id}
                      onClick={() => onSelectElement(section.id, element.id)}
                      className={`w-full truncate rounded-lg px-2 py-2 text-left text-[11px] ${
                        selectedElementId === element.id
                          ? 'bg-emerald-100 font-bold text-emerald-900'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {element.type.replaceAll('_', ' ')} — {element.content || 'Element'}
                    </button>
                  ))}

                  <button
                    onClick={onAddElement}
                    className="flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-[11px] font-semibold text-emerald-700"
                  >
                    <Plus size={13} /> Add element
                  </button>
                </div>
              )}

              {selectedSectionId === section.id && (
                <div className="mt-2 flex items-center gap-1 px-2">
                  <button
                    onClick={() => onMoveSection(section.id, -1)}
                    disabled={index === 0}
                    className="rounded p-2 text-slate-400 disabled:opacity-20"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveSection(section.id, 1)}
                    disabled={index === activePage.sections.length - 1}
                    className="rounded p-2 text-slate-400 disabled:opacity-20"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => onDuplicateSection(section)}
                    className="rounded p-2 text-slate-400 hover:text-emerald-700"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveSection(section.id)}
                    className="rounded p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemePanel({ theme = {}, onUpdate }) {
  const colors = [
    ['primaryColor', 'Primary colour'],
    ['secondaryColor', 'Secondary colour'],
    ['accentColor', 'Accent colour'],
    ['backgroundColor', 'Background'],
    ['surfaceColor', 'Surface'],
    ['textColor', 'Text'],
    ['mutedColor', 'Muted text'],
    ['borderColor', 'Borders'],
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-900">Brand colours</p>
        <p className="mt-1 text-xs text-slate-500">
          Manage the appearance of your storefront.
        </p>
      </div>

      {colors.map(([key, label]) => (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <div
              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200"
              style={{ backgroundColor: theme[key] || '#FFFFFF' }}
            />
            <input
              value={theme[key] || ''}
              onChange={(e) => onUpdate(key, e.target.value)}
              placeholder="#FFFFFF"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-xs uppercase"
            />
          </div>
        </div>
      ))}

      <SelectField
        label="Border radius"
        value={theme.borderRadius || 'medium'}
        onChange={(value) => onUpdate('borderRadius', value)}
        options={[
          { value: 'none', label: 'Square' },
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'full', label: 'Pill' },
        ]}
      />

      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        The advanced Zuno Color Studio with spectrum selection, RGB, HSL,
        opacity and saved palettes is part of the next colour-system phase.
      </p>
    </div>
  );
}
