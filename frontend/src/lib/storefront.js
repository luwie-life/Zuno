It's not/**
 * ZUNO STOREFRONT FOUNDATION
 * Version 4
 *
 * Core storefront data model:
 * - Pages, sections and independent elements
 * - Theme and colour tokens
 * - Element actions and animations
 * - Business capability restrictions
 * - Store identity and contact information
 * - SEO metadata
 * - Social links
 * - Custom domain settings
 */

export const STOREFRONT_VERSION = 4;

export const ELEMENT_TYPES = Object.freeze([
  'heading', 'text', 'button', 'image', 'spacer', 'divider',
  'columns', 'grid', 'gallery', 'icon', 'video',
  'product_list', 'service_list', 'booking_button', 'contact_form',
]);

export const SECTION_TYPES = Object.freeze([
  'announcement', 'navigation', 'hero', 'about', 'image_text',
  'rich_text', 'gallery', 'portfolio_grid', 'featured_projects',
  'services', 'featured_services', 'service_packages', 'booking',
  'featured_products', 'product_grid', 'categories', 'testimonials',
  'pricing', 'faq', 'contact', 'social_links', 'custom_content', 'footer',
]);

export const ACTION_TYPES = Object.freeze([
  'none', 'page', 'external', 'whatsapp', 'phone', 'email',
  'products', 'services', 'booking', 'contact',
]);

export const ANIMATION_PRESETS = Object.freeze([
  'none', 'fade', 'fade_up', 'fade_down',
  'slide_left', 'slide_right', 'zoom',
]);

export const SECTION_CATEGORIES = Object.freeze({
  general: [
    'announcement', 'navigation', 'hero', 'about', 'image_text',
    'rich_text', 'gallery', 'testimonials', 'faq', 'contact',
    'social_links', 'custom_content', 'footer',
  ],
  portfolio: ['portfolio_grid', 'featured_projects'],
  services: ['services', 'featured_services', 'service_packages', 'booking'],
  commerce: ['featured_products', 'product_grid', 'categories'],
  conversion: ['pricing'],
});

export const COLOR_DEFAULTS = Object.freeze({
  primary: '#0B6B4F',
  secondary: '#111827',
  accent: '#D6A85F',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
});

export const STOREFRONT_THEME_DEFAULTS = Object.freeze({
  ...COLOR_DEFAULTS,
  fontHeading: 'Inter',
  fontBody: 'Inter',
  borderRadius: 'medium',
  buttonStyle: 'rounded',
});

export const STOREFRONT_IDENTITY_DEFAULTS = Object.freeze({
  displayName: '',
  tagline: '',
  description: '',
  logo: '',
  favicon: '',
  announcement: '',
});

export const STOREFRONT_CONTACT_DEFAULTS = Object.freeze({
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  country: '',
});

export const STOREFRONT_SEO_DEFAULTS = Object.freeze({
  title: '',
  description: '',
  keywords: [],
  ogImage: '',
  noIndex: false,
});

export const STOREFRONT_DOMAIN_DEFAULTS = Object.freeze({
  type: 'zuno',
  hostname: '',
  status: 'not_connected',
  verified: false,
});

export const storefrontDefaults = Object.freeze({
  heroTitle: '',
  heroSubtitle: '',
  ctaText: 'Get started',
  ctaLink: '',

  primaryColor: COLOR_DEFAULTS.primary,
  backgroundImage: '',
  bannerImage: '',

  published: false,
  version: STOREFRONT_VERSION,

  identity: STOREFRONT_IDENTITY_DEFAULTS,
  contact: STOREFRONT_CONTACT_DEFAULTS,
  seo: STOREFRONT_SEO_DEFAULTS,
  socialLinks: [],
  domain: STOREFRONT_DOMAIN_DEFAULTS,

  theme: {
    primaryColor: COLOR_DEFAULTS.primary,
    secondaryColor: COLOR_DEFAULTS.secondary,
    accentColor: COLOR_DEFAULTS.accent,
    backgroundColor: COLOR_DEFAULTS.background,
    surfaceColor: COLOR_DEFAULTS.surface,
    textColor: COLOR_DEFAULTS.text,
    mutedColor: COLOR_DEFAULTS.muted,
    borderColor: COLOR_DEFAULTS.border,
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 'medium',
    buttonStyle: 'rounded',
    palette: [],
    recentColors: [],
  },

  pages: [],
  activePage: 'home',
});

const MAX_PAGES = 30;
const MAX_SECTIONS_PER_PAGE = 50;
const MAX_ELEMENTS_PER_SECTION = 100;
const MAX_SETTINGS_KEYS = 100;
const MAX_TEXT_LENGTH = 5000;

/* =========================================================
   BASIC HELPERS
========================================================= */

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const cleanText = (value, max = MAX_TEXT_LENGTH) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const createId = (prefix = 'item') =>
  `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

const cleanSlug = (value, fallback = 'home') => {
  const slug = cleanText(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

const cleanImage = (value) => {
  const image = cleanText(value, 3000);
  if (!image) return '';
  if (image.startsWith('/')) return image;

  try {
    const parsed = new URL(image);
    return ['http:', 'https:'].includes(parsed.protocol) ? image : '';
  } catch {
    return '';
  }
};

const cleanUrl = (value) => {
  const url = cleanText(value, 2000);
  if (!url) return '';

  try {
    const parsed = new URL(
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`
    );

    return ['http:', 'https:'].includes(parsed.protocol)
      ? parsed.href
      : '';
  } catch {
    return '';
  }
};

/* =========================================================
   SETTINGS SANITIZER
========================================================= */

const cleanValue = (value, depth = 0) => {
  if (depth > 4) return undefined;

  if (typeof value === 'string') return cleanText(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean' || value === null) return value;

  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) => cleanValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const output = {};

    for (const [key, item] of Object.entries(value).slice(0, MAX_SETTINGS_KEYS)) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(key)) continue;

      const cleaned = cleanValue(item, depth + 1);
      if (cleaned !== undefined) output[key] = cleaned;
    }

    return output;
  }

  return undefined;
};

const cleanSettings = (input = {}) =>
  isObject(input) ? cleanValue(input) || {} : {};

/* =========================================================
   COLOUR UTILITIES
========================================================= */

export function normalizeHexColor(value, fallback = '#000000') {
  if (typeof value !== 'string') return fallback;

  let color = value.trim();
  if (!color.startsWith('#')) color = `#${color}`;

  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  return /^#[0-9a-fA-F]{6}$/.test(color)
    ? color.toUpperCase()
    : fallback;
}

export function hexToRgb(hex) {
  const color = normalizeHexColor(hex);

  return {
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
  };
}

export function rgbToHex(r, g, b) {
  const toHex = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;

    s = l > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

    switch (max) {
      case red:
        h = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h, s, l) {
  h = ((Number(h) % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, Number(s))) / 100;
  l = Math.max(0, Math.min(100, Number(l))) / 100;

  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h / 360 + 1 / 3);
    g = hueToRgb(p, q, h / 360);
    b = hueToRgb(p, q, h / 360 - 1 / 3);
  }

  return rgbToHex(r * 255, g * 255, b * 255);
}

export function parseColorInput(value) {
  if (typeof value !== 'string') return null;

  const input = value.trim();

  if (/^#?[0-9a-fA-F]{3,6}$/.test(input)) {
    return normalizeHexColor(input);
  }

  const rgb = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);

  if (rgb) {
    return rgbToHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  }

  const hsl = input.match(/^hsla?\(\s*(-?\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);

  if (hsl) {
    return hslToHex(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  }

  return null;
}

const linearizeColor = (value) => {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

export function getContrastRatio(foreground, background) {
  const luminance = (color) => {
    const { r, g, b } = hexToRgb(color);

    return (
      0.2126 * linearizeColor(r) +
      0.7152 * linearizeColor(g) +
      0.0722 * linearizeColor(b)
    );
  };

  const first = luminance(foreground);
  const second = luminance(background);

  return Number(
    ((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toFixed(2)
  );
}

export function getContrastLabel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Poor';
}

export function normalizePalette(input = []) {
  if (!Array.isArray(input)) return [];

  return input.slice(0, 30).map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: createId('color'),
        name: `Color ${index + 1}`,
        color: normalizeHexColor(item),
      };
    }

    if (!isObject(item)) return null;

    return {
      id: cleanText(item.id, 100) || createId('color'),
      name: cleanText(item.name, 80) || `Color ${index + 1}`,
      color: normalizeHexColor(item.color),
    };
  }).filter(Boolean);
}

/* =========================================================
   THEME
========================================================= */

export function normalizeTheme(input = {}) {
  const source = isObject(input) ? input : {};

  const radius = ['none', 'small', 'medium', 'large', 'full'];
  const buttons = ['square', 'rounded', 'pill'];

  return {
    primaryColor: normalizeHexColor(source.primaryColor || source.primary, COLOR_DEFAULTS.primary),
    secondaryColor: normalizeHexColor(source.secondaryColor || source.secondary, COLOR_DEFAULTS.secondary),
    accentColor: normalizeHexColor(source.accentColor || source.accent, COLOR_DEFAULTS.accent),
    backgroundColor: normalizeHexColor(source.backgroundColor || source.background, COLOR_DEFAULTS.background),
    surfaceColor: normalizeHexColor(source.surfaceColor || source.surface, COLOR_DEFAULTS.surface),
    textColor: normalizeHexColor(source.textColor || source.text, COLOR_DEFAULTS.text),
    mutedColor: normalizeHexColor(source.mutedColor || source.muted, COLOR_DEFAULTS.muted),
    borderColor: normalizeHexColor(source.borderColor || source.border, COLOR_DEFAULTS.border),
    fontHeading: cleanText(source.fontHeading, 100) || 'Inter',
    fontBody: cleanText(source.fontBody, 100) || 'Inter',
    borderRadius: radius.includes(source.borderRadius) ? source.borderRadius : 'medium',
    buttonStyle: buttons.includes(source.buttonStyle) ? source.buttonStyle : 'rounded',
    palette: normalizePalette(source.palette),
    recentColors: normalizePalette(source.recentColors),
  };
}

/* =========================================================
   STORE SETTINGS NORMALIZERS
========================================================= */

export function normalizeStoreIdentity(input = {}) {
  const source = isObject(input) ? input : {};

  return {
    displayName: cleanText(source.displayName, 120),
    tagline: cleanText(source.tagline, 180),
    description: cleanText(source.description, 1000),
    logo: cleanImage(source.logo),
    favicon: cleanImage(source.favicon),
    announcement: cleanText(source.announcement, 300),
  };
}

export function normalizeStoreContact(input = {}) {
  const source = isObject(input) ? input : {};

  return {
    email: cleanText(source.email, 180),
    phone: cleanText(source.phone, 50),
    whatsapp: cleanText(source.whatsapp, 50),
    address: cleanText(source.address, 300),
    city: cleanText(source.city, 100),
    country: cleanText(source.country, 100),
  };
}

export function normalizeStoreSEO(input = {}) {
  const source = isObject(input) ? input : {};

  return {
    title: cleanText(source.title, 70),
    description: cleanText(source.description, 180),
    keywords: Array.isArray(source.keywords)
      ? source.keywords.slice(0, 20).map((item) => cleanText(item, 50)).filter(Boolean)
      : [],
    ogImage: cleanImage(source.ogImage),
    noIndex: Boolean(source.noIndex),
  };
}

export function normalizeSocialLinks(input = []) {
  if (!Array.isArray(input)) return [];

  const allowed = [
    'instagram', 'facebook', 'tiktok', 'youtube',
    'x', 'linkedin', 'pinterest', 'threads',
  ];

  return input.slice(0, 12).map((item) => {
    if (!isObject(item)) return null;

    const platform = cleanText(item.platform, 30).toLowerCase();
    if (!allowed.includes(platform)) return null;

    return {
      id: cleanText(item.id, 100) || createId('social'),
      platform,
      url: cleanUrl(item.url),
      visible: item.visible !== false,
    };
  }).filter((item) => item && item.url);
}

export function normalizeStoreDomain(input = {}) {
  const source = isObject(input) ? input : {};
  const type = ['zuno', 'custom'].includes(source.type) ? source.type : 'zuno';
  const status = [
    'not_connected', 'pending', 'connected', 'failed',
  ].includes(source.status) ? source.status : 'not_connected';

  return {
    type,
    hostname: cleanText(source.hostname, 253).toLowerCase(),
    status,
    verified: Boolean(source.verified),
  };
}

/* =========================================================
   ELEMENT ACTIONS AND ANIMATIONS
========================================================= */

export function createElementAction(type = 'none', value = '') {
  const actionType = ACTION_TYPES.includes(type) ? type : 'none';

  return {
    type: actionType,
    value: cleanText(value, 1000),
    target: actionType === 'external' ? '_blank' : '_self',
  };
}

export function normalizeElementAction(input = {}) {
  if (!isObject(input)) return createElementAction();

  const type = ACTION_TYPES.includes(input.type) ? input.type : 'none';

  return {
    type,
    value: cleanText(input.value, 1000),
    target: input.target === '_blank' ? '_blank' : '_self',
  };
}

export function createElementAnimation(preset = 'none', options = {}) {
  return {
    preset: ANIMATION_PRESETS.includes(preset) ? preset : 'none',
    trigger: ['load', 'scroll', 'hover'].includes(options.trigger)
      ? options.trigger
      : 'scroll',
    duration: Math.max(100, Math.min(3000, Number(options.duration) || 500)),
    delay: Math.max(0, Math.min(5000, Number(options.delay) || 0)),
  };
}

export function normalizeElementAnimation(input = {}) {
  if (!isObject(input)) return createElementAnimation();
  return createElementAnimation(input.preset, input);
}

/* =========================================================
   ELEMENT STYLES
========================================================= */

export function normalizeElementStyle(input = {}) {
  const source = isObject(input) ? input : {};

  const alignments = ['left', 'center', 'right'];
  const weights = ['normal', 'medium', 'semibold', 'bold'];

  return {
    color: source.color ? normalizeHexColor(source.color, '') : '',
    backgroundColor: source.backgroundColor ? normalizeHexColor(source.backgroundColor, '') : '',
    fontSize: Math.max(8, Math.min(120, Number(source.fontSize) || 16)),
    fontWeight: weights.includes(source.fontWeight) ? source.fontWeight : 'normal',
    textAlign: alignments.includes(source.textAlign) ? source.textAlign : 'left',
    width: cleanText(source.width, 30) || 'auto',
    height: cleanText(source.height, 30) || 'auto',
    padding: cleanText(source.padding, 50) || '0',
    margin: cleanText(source.margin, 50) || '0',
    borderRadius: cleanText(source.borderRadius, 30) || '0',
    opacity: Math.max(0, Math.min(1, Number(source.opacity ?? 1))),
    objectFit: ['cover', 'contain', 'fill'].includes(source.objectFit) ? source.objectFit : 'cover',
  };
}

/* =========================================================
   ELEMENTS
========================================================= */

export function createElement(type, properties = {}) {
  const elementType = ELEMENT_TYPES.includes(type) ? type : 'text';
  const source = isObject(properties) ? properties : {};

  return {
    id: createId('element'),
    type: elementType,
    visible: true,
    content: cleanText(source.content),
    src: cleanImage(source.src),
    settings: cleanSettings(source.settings),
    style: normalizeElementStyle(source.style),
    action: normalizeElementAction(source.action),
    animation: normalizeElementAnimation(source.animation),
    children: Array.isArray(source.children)
      ? source.children.slice(0, 30).map(normalizeElement)
      : [],
  };
}

export function normalizeElement(input = {}) {
  const source = isObject(input) ? input : {};
  const type = ELEMENT_TYPES.includes(source.type) ? source.type : 'text';

  return {
    id: typeof source.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(source.id)
      ? source.id
      : createId('element'),
    type,
    visible: source.visible !== false,
    content: cleanText(source.content),
    src: cleanImage(source.src),
    settings: cleanSettings(source.settings),
    style: normalizeElementStyle(source.style),
    action: normalizeElementAction(source.action),
    animation: normalizeElementAnimation(source.animation),
    children: Array.isArray(source.children)
      ? source.children.slice(0, 30).filter(isObject).map(normalizeElement)
      : [],
  };
}

/* =========================================================
   SECTIONS
========================================================= */

export function createSection(type, settings = {}) {
  return {
    id: createId('section'),
    type: SECTION_TYPES.includes(type) ? type : 'rich_text',
    visible: true,
    settings: cleanSettings(settings),
    elements: [],
  };
}

export function normalizeSection(input = {}) {
  const source = isObject(input) ? input : {};

  return {
    id: typeof source.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(source.id)
      ? source.id
      : createId('section'),
    type: SECTION_TYPES.includes(source.type) ? source.type : 'rich_text',
    visible: source.visible !== false,
    settings: cleanSettings(source.settings),
    elements: Array.isArray(source.elements)
      ? source.elements.slice(0, 100).filter(isObject).map(normalizeElement)
      : [],
  };
}

export function normalizeSections(input = []) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_SECTIONS_PER_PAGE).filter(isObject).map(normalizeSection);
}

/* =========================================================
   PAGES
========================================================= */

export function createDefaultPage({
  title = 'Home',
  slug = 'home',
  isHome = false,
  sections = [],
} = {}) {
  return {
    id: createId('page'),
    title: cleanText(title, 120) || 'Untitled page',
    slug: cleanSlug(slug),
    isHome: Boolean(isHome),
    visible: true,
    sections: normalizeSections(sections),
  };
}

export function createPage({ title = 'New page', slug = '', sections = [] } = {}) {
  const safeTitle = cleanText(title, 120) || 'New page';

  return createDefaultPage({
    title: safeTitle,
    slug: cleanSlug(slug || safeTitle, 'new-page'),
    sections,
    isHome: false,
  });
}

export function normalizePages(input = []) {
  if (!Array.isArray(input)) return [];

  const usedSlugs = new Set();

  return input.slice(0, MAX_PAGES).filter(isObject).map((page, index) => {
    const baseSlug = cleanSlug(page.slug, index === 0 ? 'home' : `page-${index + 1}`);
    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    usedSlugs.add(slug);

    return {
      id: typeof page.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(page.id)
        ? page.id
        : createId('page'),
      title: cleanText(page.title, 120) || 'Untitled page',
      slug,
      isHome: Boolean(page.isHome),
      visible: page.visible !== false,
      sections: normalizeSections(page.sections),
    };
  });
}

/* =========================================================
   BUSINESS CAPABILITIES
========================================================= */

export function getBusinessCapabilities(businessType = 'product') {
  const type = cleanText(businessType, 50).toLowerCase();

  const isHybrid = [
    'both', 'hybrid', 'product_service', 'product-and-service',
  ].includes(type);

  const isService = [
    'service', 'services', 'freelancer', 'freelance',
  ].includes(type);

  if (isHybrid) {
    return {
      products: true,
      services: true,
      bookings: true,
      portfolio: true,
      commerce: true,
    };
  }

  if (isService) {
    return {
      products: false,
      services: true,
      bookings: true,
      portfolio: true,
      commerce: false,
    };
  }

  return {
    products: true,
    services: false,
    bookings: false,
    portfolio: false,
    commerce: true,
  };
}

export function isSectionAllowedForBusiness(sectionType, businessType = 'product') {
  const capabilities = getBusinessCapabilities(businessType);

  if (['services', 'featured_services', 'service_packages', 'booking'].includes(sectionType)) {
    return capabilities.services;
  }

  if (['featured_products', 'product_grid', 'categories'].includes(sectionType)) {
    return capabilities.products;
  }

  if (['portfolio_grid', 'featured_projects'].includes(sectionType)) {
    return capabilities.portfolio;
  }

  return SECTION_TYPES.includes(sectionType);
}

export function isElementAllowedForBusiness(elementType, businessType = 'product') {
  const capabilities = getBusinessCapabilities(businessType);

  if (elementType === 'product_list') return capabilities.products;

  if (['service_list', 'booking_button'].includes(elementType)) {
    return capabilities.services;
  }

  return ELEMENT_TYPES.includes(elementType);
}

export function getAvailableSectionTypes(businessType = 'product') {
  return SECTION_TYPES.filter((type) => isSectionAllowedForBusiness(type, businessType));
}

/* =========================================================
   DEFAULT STOREFRONT
========================================================= */

export function createDefaultStorefront(input = {}) {
  const businessName = cleanText(input.businessName, 120);
  const primaryColor = normalizeHexColor(input.primaryColor, COLOR_DEFAULTS.primary);

  const page = createDefaultPage({
    title: 'Home',
    slug: 'home',
    isHome: true,
    sections: [
      createSection('hero', {
        title: businessName || 'Welcome to our business',
        subtitle: 'Discover what we have to offer.',
        buttonText: 'Get started',
        buttonLink: '',
        backgroundImage: '',
        alignment: 'center',
        height: 'large',
      }),
      createSection('about', {
        title: 'About us',
        description: '',
        image: '',
      }),
      createSection('contact', {
        title: 'Get in touch',
        description: 'We would love to hear from you.',
      }),
    ],
  });

  return {
    ...storefrontDefaults,
    identity: normalizeStoreIdentity({ displayName: businessName }),
    primaryColor,
    theme: normalizeTheme({
      ...STOREFRONT_THEME_DEFAULTS,
      primaryColor,
    }),
    pages: [page],
    activePage: 'home',
    version: STOREFRONT_VERSION,
  };
}

/* =========================================================
   STOREFRONT CONFIG NORMALIZATION
========================================================= */

export function normalizeStorefrontConfig(input = {}, businessName = '') {
  const source = isObject(input) ? input : {};

  const heroTitle = cleanText(source.heroTitle, 200);
  const heroSubtitle = cleanText(source.heroSubtitle, 500);
  const ctaText = cleanText(source.ctaText, 100) || storefrontDefaults.ctaText;
  const ctaLink = cleanText(source.ctaLink, 1000);

  const primaryColor = normalizeHexColor(source.primaryColor, COLOR_DEFAULTS.primary);
  const backgroundImage = cleanImage(source.backgroundImage || source.bannerImage);
  const published = Boolean(source.published);

  let pages = normalizePages(source.pages);

  if (pages.length === 0) {
    pages = [
      createDefaultPage({
        title: 'Home',
        slug: 'home',
        isHome: true,
        sections: [
          createSection('hero', {
            title: heroTitle || cleanText(businessName, 120) || 'Welcome',
            subtitle: heroSubtitle,
            buttonText: ctaText,
            buttonLink: ctaLink,
            backgroundImage,
            alignment: 'center',
            height: 'large',
          }),
          createSection('about', {
            title: 'About us',
            description: '',
            image: '',
          }),
          createSection('contact', {
            title: 'Get in touch',
            description: 'We would love to hear from you.',
          }),
        ],
      }),
    ];
  }

  const preferredHomeIndex = Math.max(
    0,
    pages.findIndex((page) => page.isHome || page.slug === 'home')
  );

  const normalizedPages = [];
  const usedSlugs = new Set(['home']);

  pages.forEach((page, index) => {
    if (index === preferredHomeIndex) {
      normalizedPages.push({
        ...page,
        slug: 'home',
        isHome: true,
      });
      return;
    }

    const baseSlug = cleanSlug(page.slug, `page-${index + 1}`);
    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    usedSlugs.add(slug);

    normalizedPages.push({
      ...page,
      slug,
      isHome: false,
    });
  });

  const theme = normalizeTheme({
    ...source.theme,
    primaryColor:
      source.theme?.primaryColor ||
      source.theme?.primary ||
      primaryColor,
  });

  return {
    ...storefrontDefaults,

    heroTitle,
    heroSubtitle,
    ctaText,
    ctaLink,

    primaryColor,
    backgroundImage,
    bannerImage: backgroundImage,
    published,

    identity: normalizeStoreIdentity({
      ...source.identity,
      displayName:
        source.identity?.displayName ||
        businessName,
    }),

    contact: normalizeStoreContact(source.contact),
    seo: normalizeStoreSEO(source.seo),
    socialLinks: normalizeSocialLinks(source.socialLinks),
    domain: normalizeStoreDomain(source.domain),

    version: STOREFRONT_VERSION,
    theme,
    pages: normalizedPages,

    activePage: cleanSlug(source.activePage, 'home'),
  };
}

/* =========================================================
   PAGE LOOKUP
========================================================= */

export function getStorefrontPage(storefront, slug = 'home') {
  const config = normalizeStorefrontConfig(storefront);
  const target = cleanSlug(slug);

  return (
    config.pages.find((page) => page.slug === target && page.visible) ||
    config.pages.find((page) => page.isHome) ||
    config.pages[0] ||
    null
  );
}

/* =========================================================
   STOREFRONT MUTATION HELPERS
========================================================= */

export function addSectionToPage(page, sectionType, settings = {}) {
  if (!isObject(page)) return page;

  return {
    ...page,
    sections: [
      ...normalizeSections(page.sections),
      createSection(sectionType, settings),
    ],
  };
}

export function addElementToSection(section, elementType, properties = {}) {
  if (!isObject(section)) return section;

  const currentElements = Array.isArray(section.elements)
    ? section.elements.map(normalizeElement)
    : [];

  return {
    ...normalizeSection(section),
    elements: [
      ...currentElements,
      createElement(elementType, properties),
    ],
  };
}

export function updateElement(section, elementId, updates = {}) {
  if (!isObject(section) || !isObject(updates)) return section;

  return {
    ...normalizeSection(section),
    elements: (section.elements || []).map((element) => {
      if (element.id !== elementId) return element;

      return normalizeElement({
        ...element,
        ...updates,
        id: element.id,
      });
    }),
  };
}

export function removeElement(section, elementId) {
  if (!isObject(section)) return section;

  return {
    ...normalizeSection(section),
    elements: (section.elements || []).filter((element) => element.id !== elementId),
  };
}

export function removeSection(page, sectionId) {
  if (!isObject(page)) return page;

  return {
    ...page,
    sections: normalizeSections(page.sections).filter((section) => section.id !== sectionId),
  };
}

export function moveArrayItem(items, fromIndex, toIndex) {
  if (!Array.isArray(items)) return [];

  const result = [...items];

  if (
    fromIndex < 0 ||
    fromIndex >= result.length ||
    toIndex < 0 ||
    toIndex >= result.length
  ) {
    return result;
  }

  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);

  return result;
}
