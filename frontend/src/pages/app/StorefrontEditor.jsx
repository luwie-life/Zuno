import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, Save, Undo2, Redo2, Eye, Plus,
  Layers, FileText, Palette, LayoutTemplate,
  Settings2, Monitor, Tablet, Smartphone,
  Upload, Type, Paintbrush, Image as ImageIcon,
  MousePointer, Columns3, Minus, Video,
  ShoppingBag, BriefcaseBusiness, CalendarDays,
  ChevronDown, Trash2, Copy,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';

import {
  createSection,
  createElement,
  createPage,
  getAvailableSectionTypes,
  normalizeStorefrontConfig,
  ELEMENT_TYPES,
} from '../../lib/storefront.js';

import StorefrontEditorPanels from '../../components/storefront/StorefrontEditorPanels.jsx';
import StorefrontEditorCanvas from '../../components/storefront/StorefrontEditorCanvas.jsx';
import StorefrontSettingsPanel from '../../components/storefront/StorefrontSettingsPanel.jsx';

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

const NAVIGATION = [
  ['Dashboard', '/app'],
  ['Products', '/app/products'],
  ['Services', '/app/services'],
  ['Bookings', '/app/bookings'],
  ['Orders', '/app/orders'],
  ['POS', '/app/pos'],
  ['Inventory', '/app/inventory'],
  ['Customers', '/app/customers'],
  ['Reports', '/app/reports'],
  ['Billing', '/app/billing'],
  ['Settings', '/app/settings'],
];

const makeId = (prefix = 'item') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const cloneElement = (element) => ({
  ...clone(element),
  id: makeId('element'),
});

const cloneSection = (section) => ({
  ...clone(section),
  id: makeId('section'),
  elements: (section.elements || []).map(cloneElement),
});

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'page';

export default function StorefrontEditor() {
  const { ctx } = useAuth();

  const business = ctx?.business || {};
  const businessType = business.businessType || 'product';

  const [storefront, setStorefront] = useState(null);
  const [activePageId, setActivePageId] = useState('');

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');

  const [panel, setPanel] = useState('layers');
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  const [showSections, setShowSections] = useState(false);
  const [showElements, setShowElements] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [clipboardElement, setClipboardElement] = useState(null);

  const [activeTool, setActiveTool] = useState('elements');

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

  const dirty =
    !!storefront &&
    JSON.stringify(storefront) !== savedSnapshot;

  const availableSections = useMemo(
    () => getAvailableSectionTypes(businessType),
    [businessType]
  );

  useEffect(() => {
    currentRef.current = storefront;
  }, [storefront]);

  // LOAD STOREFRONT
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
          business.name
        );

        setStorefront(config);
        currentRef.current = config;

        setSavedSnapshot(JSON.stringify(config));

        setHistory([]);
        setFuture([]);

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

  // HISTORY
  const commit = useCallback((updater) => {
    setStorefront((current) => {
      if (!current) return current;

      const next =
        typeof updater === 'function'
          ? updater(current)
          : updater;

      if (!next || next === current) return current;

      setHistory((items) => [...items.slice(-49), current]);
      setFuture([]);

      currentRef.current = next;

      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const current = currentRef.current;

    if (!history.length || !current) return;

    const previous = history[history.length - 1];

    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [...items, current]);

    currentRef.current = previous;
    setStorefront(previous);

    setSelectedElementId('');
    setSelectedSectionId('');

    setNotice('Change undone.');
  }, [history]);

  const redo = useCallback(() => {
    const current = currentRef.current;

    if (!future.length || !current) return;

    const next = future[future.length - 1];

    setFuture((items) => items.slice(0, -1));
    setHistory((items) => [...items, current]);

    currentRef.current = next;
    setStorefront(next);

    setSelectedElementId('');
    setSelectedSectionId('');

    setNotice('Change restored.');
  }, [future]);

  // PAGE OPERATIONS
  const updatePage = (pageId, changes) => {
    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === pageId
          ? { ...page, ...changes }
          : page
      ),
    }));
  };

  const addPage = (values = {}) => {
    if (!storefront) return;

    const number = storefront.pages.length + 1;

    const title = values.title || `Page ${number}`;
    const baseSlug = slugify(values.slug || title);

    let slug = baseSlug;
    let suffix = 2;

    while (storefront.pages.some((page) => page.slug === slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const page = createPage({
      title,
      slug,
      visible: values.visible !== false,
      sections: [
        createSection('hero', {
          title,
          subtitle: 'Add content to this page.',
        }),
      ],
    });

    commit((current) => ({
      ...current,
      pages: [...current.pages, page],
    }));

    setActivePageId(page.id);
    setSelectedSectionId('');
    setSelectedElementId('');
    setPanel('layers');
    setDrawerOpen(true);

    setNotice('Page created.');
  };

  const renamePage = (pageId, values) => {
    updatePage(pageId, values);
    setNotice('Page updated.');
  };

  const duplicatePage = (page) => {
    if (!page || !storefront) return;

    const title = `${page.title || 'Page'} copy`;
    const baseSlug = slugify(title);

    let slug = baseSlug;
    let suffix = 2;

    while (storefront.pages.some((item) => item.slug === slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const duplicate = createPage({
      title,
      slug,
      visible: page.visible !== false,
      sections: (page.sections || []).map(cloneSection),
    });

    duplicate.isHome = false;

    commit((current) => ({
      ...current,
      pages: [...current.pages, duplicate],
    }));

    setActivePageId(duplicate.id);
    setSelectedSectionId('');
    setSelectedElementId('');

    setNotice('Page duplicated.');
  };

  const deletePage = (page) => {
    if (!page || page.isHome || pages.length <= 1) return;

    commit((current) => ({
      ...current,
      pages: current.pages.filter((item) => item.id !== page.id),
    }));

    if (activePageId === page.id) {
      const remaining = pages.filter((item) => item.id !== page.id);
      const next = remaining.find((item) => item.isHome) || remaining[0];

      setActivePageId(next?.id || '');
    }

    setSelectedSectionId('');
    setSelectedElementId('');

    setNotice('Page deleted. Save to publish the change.');
  };

  const setHomePage = (page) => {
    if (!page) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((item) => ({
        ...item,
        isHome: item.id === page.id,
      })),
    }));

    setNotice('Homepage updated.');
  };

  // SECTION OPERATIONS
  const addSection = (type) => {
    if (!activePage) return;

    const settings = {
      ...(DEFAULT_SECTION_SETTINGS[type] || {}),
    };

    if (type === 'hero') {
      settings.title = business.name || 'Welcome to our business';
      settings.buttonLink =
        businessType === 'product' ? '/products' : '/services';
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

  const removeSection = (sectionId) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.filter(
        (section) => section.id !== sectionId
      ),
    });

    setSelectedSectionId('');
    setSelectedElementId('');
  };

  const duplicateSection = (section) => {
    if (!activePage || !section) return;

    const duplicate = cloneSection(section);
    const sections = [...activePage.sections];

    const index = sections.findIndex(
      (item) => item.id === section.id
    );

    sections.splice(index + 1, 0, duplicate);

    updatePage(activePage.id, { sections });

    setSelectedSectionId(duplicate.id);
    setSelectedElementId('');

    setNotice('Section duplicated.');
  };

  const moveSection = (sectionId, direction) => {
    if (!activePage) return;

    const sections = [...activePage.sections];

    const index = sections.findIndex(
      (section) => section.id === sectionId
    );

    const target = index + direction;

    if (index < 0 || target < 0 || target >= sections.length) return;

    [sections[index], sections[target]] = [
      sections[target],
      sections[index],
    ];

    updatePage(activePage.id, { sections });
  };

  const reorderSections = (sections) => {
    if (!activePage) return;

    updatePage(activePage.id, { sections });
    setNotice('Section order updated.');
  };

  // ELEMENT OPERATIONS
  const addElement = (type) => {
    if (!activePage || !selectedSection) {
      setError('Select a section before adding an element.');
      return;
    }

    if (!ELEMENT_TYPES.includes(type)) return;

    const element = createElement(type, {
      content: DEFAULT_ELEMENT_CONTENT[type] || '',
      settings:
        type === 'spacer'
          ? { height: 40 }
          : ['columns', 'grid'].includes(type)
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
                      elements: [
                        ...(section.elements || []),
                        element,
                      ],
                    }
              ),
            }
      ),
    }));

    setSelectedElementId(element.id);
    setShowElements(false);
    setPanel('inspector');
    setDrawerOpen(true);
  };

  const updateElement = (elementId, changes) => {
    if (!activePage) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id !== selectedSectionId
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

  const removeElement = (sectionId, elementId) => {
    if (!activePage) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id !== sectionId
                  ? section
                  : {
                      ...section,
                      elements: (section.elements || []).filter(
                        (element) => element.id !== elementId
                      ),
                    }
              ),
            }
      ),
    }));

    setSelectedElementId('');
  };

  const duplicateElement = (sectionId, element) => {
    if (!activePage || !element) return;

    const duplicate = cloneElement(element);

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) => {
                if (section.id !== sectionId) return section;

                const elements = [...(section.elements || [])];
                const index = elements.findIndex(
                  (item) => item.id === element.id
                );

                elements.splice(index + 1, 0, duplicate);

                return { ...section, elements };
              }),
            }
      ),
    }));

    setSelectedSectionId(sectionId);
    setSelectedElementId(duplicate.id);
  };

  const moveElement = (elementId, direction, sectionId = selectedSectionId) => {
    if (!activePage) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) => {
                if (section.id !== sectionId) return section;

                const elements = [...(section.elements || [])];

                const index = elements.findIndex(
                  (element) => element.id === elementId
                );

                const target = index + direction;

                if (
                  index < 0 ||
                  target < 0 ||
                  target >= elements.length
                ) {
                  return section;
                }

                [elements[index], elements[target]] = [
                  elements[target],
                  elements[index],
                ];

                return { ...section, elements };
              }),
            }
      ),
    }));
  };

  const reorderElements = (sectionId, elements) => {
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
                  ? { ...section, elements }
                  : section
              ),
            }
      ),
    }));
  };

  const moveElementAcrossSections = (
  sourceSectionId,
  elementId,
  targetSectionId,
  destinationIndex
) => {
  if (
    !activePage ||
    !sourceSectionId ||
    !targetSectionId ||
    !elementId ||
    sourceSectionId === targetSectionId
  ) {
    return;
  }

  commit((current) => ({
    ...current,
    pages: current.pages.map((page) => {
      if (page.id !== activePage.id) return page;

      const sections = page.sections.map((section) => ({
        ...section,
        elements: [...(section.elements || [])],
      }));

      const source = sections.find(
        (section) => section.id === sourceSectionId
      );

      const target = sections.find(
        (section) => section.id === targetSectionId
      );

      if (!source || !target) return page;

      const sourceIndex = source.elements.findIndex(
        (element) => element.id === elementId
      );

      if (sourceIndex === -1) return page;

      const [movedElement] = source.elements.splice(
        sourceIndex,
        1
      );

      const requestedIndex = Number.isFinite(
        Number(destinationIndex)
      )
        ? Math.floor(Number(destinationIndex))
        : target.elements.length;

      const safeIndex = Math.max(
        0,
        Math.min(requestedIndex, target.elements.length)
      );

      target.elements.splice(
        safeIndex,
        0,
        movedElement
      );

      return {
        ...page,
        sections,
      };
    }),
  }));

  setSelectedSectionId(targetSectionId);
  setSelectedElementId(elementId);
};
  
  const toggleSection = (section) => {
    updatePage(activePage.id, {
      sections: activePage.sections.map((item) =>
        item.id === section.id
          ? { ...item, visible: item.visible === false }
          : item
      ),
    });
  };

  const toggleElement = (sectionId, element) => {
    if (!activePage) return;

    commit((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) =>
                section.id !== sectionId
                  ? section
                  : {
                      ...section,
                      elements: section.elements.map((item) =>
                        item.id === element.id
                          ? { ...item, visible: item.visible === false }
                          : item
                      ),
                    }
              ),
            }
      ),
    }));
  };

  // COPY / PASTE
  const copyElement = (element) => {
    if (!element) return;

    setClipboardElement(clone(element));
    setNotice('Element copied.');
  };

  const pasteElement = () => {
    if (!clipboardElement || !selectedSection) return;

    const pasted = cloneElement(clipboardElement);

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
                      elements: [
                        ...(section.elements || []),
                        pasted,
                      ],
                    }
              ),
            }
      ),
    }));

    setSelectedElementId(pasted.id);
    setNotice('Element pasted.');
  };

  // THEME
  const updateTheme = (key, value) => {
    commit((current) => ({
      ...current,
      theme: {
        ...(current.theme || {}),
        [key]: value,
      },
    }));
  };

  // SETTINGS
  const updateStorefrontSettings = (next) => {
    commit(next);
    setNotice('Store settings updated. Save to publish.');
  };

  // TEMPLATE
  const applyTemplate = (next) => {
    if (!next) return;

    commit(next);

    const home = next.pages?.find((page) => page.isHome);

    setActivePageId(home?.id || next.pages?.[0]?.id || '');
    setSelectedSectionId('');
    setSelectedElementId('');

    setPanel('layers');
    setDrawerOpen(false);

    setNotice('Template applied. Save to publish your design.');
  };

  // SAVE
  const save = async () => {
    const data = currentRef.current;

    if (!data || saveLock.current) return;

    saveLock.current = true;
    setSaving(true);
    setError('');
    setNotice('');

    const snapshot = JSON.stringify(data);

    try {
      await api('/businesses/current/storefront', {
        method: 'PUT',
        biz: true,
        body: data,
      });

      setSavedSnapshot(snapshot);

      setNotice(
        JSON.stringify(currentRef.current) === snapshot
          ? 'All changes saved.'
          : 'Saved. You have newer unsaved changes.'
      );
    } catch (err) {
      setError(err.message || 'Could not save your storefront.');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyboard = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();

      const typing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable;

      if (typing) return;

      const modifier = event.ctrlKey || event.metaKey;

      if (!modifier) return;

      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
      } else if (key === 'c' && selectedElement) {
        event.preventDefault();
        copyElement(selectedElement);
      } else if (key === 'v' && clipboardElement) {
        event.preventDefault();
        pasteElement();
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo, selectedElement, clipboardElement]);

  // TOOLBAR
  const handleTool = (tool) => {
    setActiveTool(tool);
    setDrawerOpen(true);

    if (tool === 'pages') setPanel('pages');
    if (tool === 'brand') setPanel('theme');
    if (tool === 'templates') setPanel('templates');

    if (tool === 'elements' || tool === 'text') {
      setPanel('layers');
      setShowElements(true);
    }

    if (tool === 'uploads') uploadRef.current?.click();
    if (tool === 'settings') setPanel('settings');
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      event.target.value = '';
      return;
    }

    setNotice(
      'Image selected. Cloudinary upload integration is the next media phase.'
    );

    event.target.value = '';
  };

  // PANEL PROPS
  const pageManagerProps = {
    onSelectPage: (id) => {
      setActivePageId(id);
      setSelectedSectionId('');
      setSelectedElementId('');
    },
    onCreatePage: addPage,
    onUpdatePage: renamePage,
    onDuplicatePage: duplicatePage,
    onDeletePage: deletePage,
    onSetHomePage: setHomePage,
  };

  const layerManagerProps = {
    onPage: (id) => {
      setActivePageId(id);
      setSelectedSectionId('');
      setSelectedElementId('');
    },
    onAddPage: () => addPage(),
    onRenamePage: (page) => {
      const title = window.prompt('New page name:', page.title);

      if (title?.trim()) {
        renamePage(page.id, {
          title: title.trim(),
          slug: slugify(title),
        });
      }
    },
    onDuplicatePage: duplicatePage,
    onDeletePage: deletePage,
    onAddSection: () => setShowSections(true),
    onAddElement: () => setShowElements(true),
    onSelectSection: (id) => {
      setSelectedSectionId(id);
      setSelectedElementId('');
      setPanel('inspector');
      setDrawerOpen(true);
    },
    onSelectElement: (sectionId, elementId) => {
      setSelectedSectionId(sectionId);
      setSelectedElementId(elementId);
      setPanel('inspector');
      setDrawerOpen(true);
    },
    onMoveSection: moveSection,
    onMoveElement: moveElement,
    onDuplicateSection: duplicateSection,
    onDuplicateElement: duplicateElement,
    onRemoveSection: removeSection,
    onRemoveElement: removeElement,
    onToggleSection: toggleSection,
    onToggleElement: toggleElement,
    onReorderSections: reorderSections,
    onReorderElements: reorderElements,
  };

  const elementInspectorProps = {
    onUpdateElement: updateElement,
    onRemoveElement: (id) => removeElement(selectedSectionId, id),
    onDuplicateElement: (element) =>
      duplicateElement(selectedSectionId, element),
    onCopyElement: copyElement,
  };

  const sectionInspectorProps = {
    onUpdateSection: updateSection,
    onRemoveSection: removeSection,
    onDuplicateSection: duplicateSection,
  };

  const templateProps = {
    businessType,
    businessName: business.name || '',
    currentConfig: storefront,
    onApply: applyTemplate,
    onClose: () => setPanel('layers'),
  };

  const settingsPanel = panel === 'settings';

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
          {error || 'Could not load your storefront.'}
        </p>
      </div>
    );
  }

  const tools = [
    ['layers', 'Layers', Layers],
    ['pages', 'Pages', FileText],
    ['theme', 'Brand', Palette],
    ['templates', 'Templates', LayoutTemplate],
    ['settings', 'Settings', Settings2],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#f1f2f5]">

      {/* TOP BAR */}
      <header className="z-[90] flex min-h-[60px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-5">

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setNavigationOpen((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {navigationOpen ? <X size={20} /> : <Menu size={20} />}
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
            type="button"
            onClick={undo}
            disabled={!history.length}
            title="Undo"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <Undo2 size={17} />
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            title="Redo"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <Redo2 size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={business.slug ? `/store/${business.slug}` : '/'}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl border border-slate-200 p-2 text-slate-600 sm:block"
            title="Preview storefront"
          >
            <Eye size={17} />
          </a>

          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* MAIN NAVIGATION */}
      {navigationOpen && (
        <>
          <button
            type="button"
            onClick={() => setNavigationOpen(false)}
            className="fixed inset-0 z-[95] bg-slate-950/30"
            aria-label="Close navigation"
          />

          <nav className="fixed left-3 top-[68px] z-[100] max-h-[80svh] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
            <p className="border-b border-slate-100 px-3 pb-3 text-sm font-bold text-slate-900">
              {business.name || 'Zuno'}
            </p>

            {NAVIGATION.map(([label, path]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setNavigationOpen(false)}
                className="mt-1 block rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}

      {/* FEEDBACK */}
      {(error || notice) && (
        <div
          className={`z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-2 text-xs ${
            error
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{error || notice}</span>

          <button
            type="button"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* WORKSPACE */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* DESKTOP LEFT PANEL */}
        <aside className="hidden w-[310px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">

          <div className="grid grid-cols-5 gap-1 border-b border-slate-100 p-2">
            {tools.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-3 text-[9px] font-semibold ${
                  panel === id || (id === 'layers' && panel === 'inspector')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {settingsPanel ? (
              <StorefrontSettingsPanel
                storefront={storefront}
                business={business}
                onUpdate={updateStorefrontSettings}
              />
            ) : (
              <StorefrontEditorPanels
                panel={panel}
                setPanel={setPanel}
                pages={pages}
                activePage={activePage}
                activePageId={activePage?.id || ''}
                selectedElement={selectedElement}
                selectedSection={selectedSection}
                theme={storefront.theme || {}}
                onUpdateTheme={updateTheme}
                pageManagerProps={pageManagerProps}
                layerManagerProps={layerManagerProps}
                elementInspectorProps={elementInspectorProps}
                sectionInspectorProps={sectionInspectorProps}
                templateProps={templateProps}
                businessType={businessType}
                businessName={business.name || ''}
                currentConfig={storefront}
                onApplyTemplate={applyTemplate}
                onCloseTemplates={() => setPanel('layers')}
              />
            )}
          </div>
        </aside>

        {/* CANVAS */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
<StorefrontEditorCanvas
  business={business}
  storefront={storefront}
  activePage={activePage}
  device={device}
  setDevice={setDevice}
  zoom={zoom}
  setZoom={setZoom}
  selectedSectionId={selectedSectionId}
  selectedElementId={selectedElementId}
  onReorderSections={reorderSections}
  onReorderElements={reorderElements}
  onMoveElement={moveElementAcrossSections}
  onResizeElement={(elementId, dimensions) => {
  const element = activePage?.sections
    ?.find((section) => section.id === selectedSectionId)
    ?.elements?.find((item) => item.id === elementId);

  if (!element) return;

  updateElement(elementId, {
    style: {
      ...(element.style || {}),
      ...dimensions,
    },
  });
}}
            onSelectSection={(id) => {
              setSelectedSectionId(id);
              setSelectedElementId('');
              setPanel('inspector');
              setDrawerOpen(true);
            }}
            onSelectElement={(elementId, sectionId) => {
              const parent =
                sectionId ||
                activePage?.sections?.find((section) =>
                  section.elements?.some(
                    (element) => element.id === elementId
                  )
                )?.id ||
                '';

              setSelectedSectionId(parent);
              setSelectedElementId(elementId);
              setPanel('inspector');
              setDrawerOpen(true);
            }}
            onAddSection={() => setShowSections(true)}
            onPreview={() => {
              window.open(
                business.slug ? `/store/${business.slug}` : '/',
                '_blank',
                'noopener,noreferrer'
              );
            }}
          />
        </main>
      </div>

      {/* MOBILE EDITOR */}
      <div className="z-40 shrink-0 border-t border-slate-200 bg-white md:hidden">

        {drawerOpen && (
          <div className="max-h-[42svh] overflow-y-auto border-b border-slate-100 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold capitalize text-slate-900">
                  {panel === 'inspector'
                    ? selectedElement
                      ? 'Edit element'
                      : 'Edit section'
                    : panel === 'settings'
                      ? 'Store settings'
                      : panel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {settingsPanel ? (
              <StorefrontSettingsPanel
                storefront={storefront}
                business={business}
                onUpdate={updateStorefrontSettings}
                mobile
              />
            ) : (
              <StorefrontEditorPanels
                panel={panel}
                setPanel={setPanel}
                pages={pages}
                activePage={activePage}
                activePageId={activePage?.id || ''}
                selectedElement={selectedElement}
                selectedSection={selectedSection}
                theme={storefront.theme || {}}
                onUpdateTheme={updateTheme}
                pageManagerProps={pageManagerProps}
                layerManagerProps={layerManagerProps}
                elementInspectorProps={elementInspectorProps}
                sectionInspectorProps={sectionInspectorProps}
                templateProps={templateProps}
                businessType={businessType}
                businessName={business.name || ''}
                currentConfig={storefront}
                onApplyTemplate={applyTemplate}
                onClose={() => setDrawerOpen(false)}
                onCloseTemplates={() => setPanel('layers')}
                mobile
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-1 overflow-x-auto px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {[
            ['layers', 'Layers', Layers],
            ['pages', 'Pages', FileText],
            ['theme', 'Brand', Palette],
            ['templates', 'Templates', LayoutTemplate],
            ['settings', 'Settings', Settings2],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPanel(id);
                setDrawerOpen(true);
              }}
              className={`flex min-w-[70px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                panel === id
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-500'
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setPanel('inspector');
              setDrawerOpen(true);
            }}
            className={`flex min-w-[70px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${
              panel === 'inspector'
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-500'
            }`}
          >
            <Paintbrush size={19} />
            Inspect
          </button>
        </div>
      </div>

      {/* HIDDEN IMAGE INPUT */}
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
                <h2 className="text-lg font-bold text-slate-900">
                  Add a section
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a section for this page.
                </p>
              </div>

              <button
                type="button"
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
                  type="button"
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
                <h2 className="text-lg font-bold text-slate-900">
                  Add an element
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose what you want to add.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowElements(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ELEMENT_OPTIONS
                .filter(({ type }) =>
                  activeTool !== 'text' ||
                  ['heading', 'text', 'button'].includes(type)
                )
                .map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addElement(type)}
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
