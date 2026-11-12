/** Storefront normalization: preserves existing page, section and element contracts. */
import { normalizeStorefrontMetadata } from './storefrontMetadata.js';

export const STOREFRONT_VERSION = 3;
export const ELEMENT_TYPES = Object.freeze(['heading', 'text', 'button', 'image', 'spacer', 'divider', 'columns', 'grid', 'gallery', 'icon', 'video', 'product_list', 'service_list', 'booking_button', 'contact_form']);
export const SECTION_TYPES = Object.freeze(['announcement', 'navigation', 'hero', 'about', 'image_text', 'rich_text', 'gallery', 'portfolio_grid', 'featured_projects', 'services', 'featured_services', 'service_packages', 'booking', 'featured_products', 'product_grid', 'categories', 'testimonials', 'pricing', 'faq', 'contact', 'social_links', 'custom_content', 'footer']);
export const ACTION_TYPES = Object.freeze(['none', 'page', 'external', 'whatsapp', 'phone', 'email', 'products', 'services', 'booking', 'contact']);
export const ANIMATION_PRESETS = Object.freeze(['none', 'fade', 'fade_up', 'fade_down', 'slide_left', 'slide_right', 'zoom']);
export const COLOR_DEFAULTS = Object.freeze({ primary: '#0B6B4F', secondary: '#111827', accent: '#D6A85F', background: '#FFFFFF', surface: '#F9FAFB', text: '#111827', muted: '#6B7280', border: '#E5E7EB' });
export const STOREFRONT_THEME_DEFAULTS = Object.freeze({ ...COLOR_DEFAULTS, fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 'medium', buttonStyle: 'rounded' });
export const storefrontDefaults = Object.freeze({
  heroTitle: '', heroSubtitle: '', ctaText: 'Get started', ctaLink: '',
  primaryColor: COLOR_DEFAULTS.primary, backgroundImage: '', bannerImage: '',
  published: false, version: STOREFRONT_VERSION,
  theme: { primaryColor: COLOR_DEFAULTS.primary, secondaryColor: COLOR_DEFAULTS.secondary, accentColor: COLOR_DEFAULTS.accent, backgroundColor: COLOR_DEFAULTS.background, surfaceColor: COLOR_DEFAULTS.surface, textColor: COLOR_DEFAULTS.text, mutedColor: COLOR_DEFAULTS.muted, borderColor: COLOR_DEFAULTS.border, fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 'medium', buttonStyle: 'rounded', palette: [], recentColors: [] },
  pages: [], activePage: 'home',
});
const MAX_PAGES = 30;
const MAX_SECTIONS_PER_PAGE = 50;
const MAX_ELEMENTS_PER_SECTION = 100;
const MAX_CHILDREN_PER_ELEMENT = 30;
const MAX_SETTINGS_KEYS = 100;
const MAX_TEXT_LENGTH = 5000;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const cleanText = (value, max = MAX_TEXT_LENGTH) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const createId = (prefix = 'item') => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
const cleanSlug = (value, fallback = 'home') => cleanText(value, 100).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;

export function normalizeHexColor(value, fallback = '#000000') {
  if (typeof value !== 'string') return fallback;
  let color = value.trim();
  if (!color.startsWith('#')) color = `#${color}`;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : fallback;
}
const cleanImage = value => {
  const image = cleanText(value, 3000);
  if (!image) return '';
  if (image.startsWith('/')) return image;
  try { return ['http:', 'https:'].includes(new URL(image).protocol) ? image : ''; } catch { return ''; }
};
const cleanValue = (value, depth = 0) => {
  if (depth > 4) return undefined;
  if (typeof value === 'string') return cleanText(value, MAX_TEXT_LENGTH);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => cleanValue(item, depth + 1)).filter(item => item !== undefined);
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
const cleanSettings = (input = {}) => isObject(input) ? cleanValue(input) || {} : {};

export function normalizePalette(input = []) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 30).map((item, index) => {
    if (typeof item === 'string') return { id: createId('color'), name: `Color ${index + 1}`, color: normalizeHexColor(item) };
    if (!isObject(item)) return null;
    return { id: cleanText(item.id, 100) || createId('color'), name: cleanText(item.name, 80) || `Color ${index + 1}`, color: normalizeHexColor(item.color) };
  }).filter(Boolean);
}
export function normalizeTheme(input = {}) {
  const source = isObject(input) ? input : {};
  const allowedRadius = ['none', 'small', 'medium', 'large', 'full'];
  const allowedButtons = ['square', 'rounded', 'pill'];
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
    borderRadius: allowedRadius.includes(source.borderRadius) ? source.borderRadius : 'medium',
    buttonStyle: allowedButtons.includes(source.buttonStyle) ? source.buttonStyle : 'rounded',
    palette: normalizePalette(source.palette), recentColors: normalizePalette(source.recentColors),
  };
}
export function createElementAction(type = 'none', value = '') {
  const actionType = ACTION_TYPES.includes(type) ? type : 'none';
  return { type: actionType, value: cleanText(value, 1000), target: actionType === 'external' ? '_blank' : '_self' };
}
export function normalizeElementAction(input = {}) {
  if (!isObject(input)) return createElementAction();
  const type = ACTION_TYPES.includes(input.type) ? input.type : 'none';
  return { type, value: cleanText(input.value, 1000), target: input.target === '_blank' ? '_blank' : '_self' };
}
export function createElementAnimation(preset = 'none', options = {}) {
  return { preset: ANIMATION_PRESETS.includes(preset) ? preset : 'none', trigger: ['load', 'scroll', 'hover'].includes(options.trigger) ? options.trigger : 'scroll', duration: Math.max(100, Math.min(3000, Number(options.duration) || 500)), delay: Math.max(0, Math.min(5000, Number(options.delay) || 0)) };
}
export function normalizeElementAnimation(input = {}) {
  return isObject(input) ? createElementAnimation(input.preset, input) : createElementAnimation();
}
export function normalizeElementStyle(input = {}) {
  const source = isObject(input) ? input : {};
  const allowedAlignments = ['left', 'center', 'right'];
  const allowedWeights = ['normal', 'medium', 'semibold', 'bold'];
  const normalizeCoordinate = value => {
    if (value === undefined || value === null || value === '') return 0;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(-100000, Math.min(100000, number)) : 0;
  };
  return {
    color: source.color ? normalizeHexColor(source.color, '') : '',
    backgroundColor: source.backgroundColor ? normalizeHexColor(source.backgroundColor, '') : '',
    fontSize: Math.max(8, Math.min(120, Number(source.fontSize) || 16)),
    fontWeight: allowedWeights.includes(source.fontWeight) ? source.fontWeight : 'normal',
    textAlign: allowedAlignments.includes(source.textAlign) ? source.textAlign : 'left',
    width: cleanText(source.width, 30) || 'auto', height: cleanText(source.height, 30) || 'auto',
    padding: cleanText(source.padding, 50) || '0', margin: cleanText(source.margin, 50) || '0',
    borderRadius: cleanText(source.borderRadius, 30) || '0',
    opacity: Math.max(0, Math.min(1, Number(source.opacity ?? 1))),
    objectFit: ['cover', 'contain', 'fill'].includes(source.objectFit) ? source.objectFit : 'cover',
    x: normalizeCoordinate(source.x), y: normalizeCoordinate(source.y), positioned: source.positioned === true,
  };
}
export function createElement(type, properties = {}) {
  const elementType = ELEMENT_TYPES.includes(type) ? type : 'text';
  const source = isObject(properties) ? properties : {};
  return { id: createId('element'), type: elementType, visible: true, content: cleanText(source.content), src: cleanImage(source.src), settings: cleanSettings(source.settings), style: normalizeElementStyle(source.style), action: normalizeElementAction(source.action), animation: normalizeElementAnimation(source.animation), children: Array.isArray(source.children) ? source.children.slice(0, MAX_CHILDREN_PER_ELEMENT).filter(isObject).map(normalizeElement) : [] };
}
export function normalizeElement(input = {}) {
  const source = isObject(input) ? input : {};
  const type = ELEMENT_TYPES.includes(source.type) ? source.type : 'text';
  return { id: typeof source.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(source.id) ? source.id : createId('element'), type, visible: source.visible !== false, content: cleanText(source.content), src: cleanImage(source.src), settings: cleanSettings(source.settings), style: normalizeElementStyle(source.style), action: normalizeElementAction(source.action), animation: normalizeElementAnimation(source.animation), children: Array.isArray(source.children) ? source.children.slice(0, MAX_CHILDREN_PER_ELEMENT).filter(isObject).map(normalizeElement) : [] };
}
export function createSection(type, settings = {}) {
  return { id: createId('section'), type: SECTION_TYPES.includes(type) ? type : 'rich_text', visible: true, settings: cleanSettings(settings), elements: [] };
}
export function normalizeSection(input = {}) {
  const source = isObject(input) ? input : {};
  const type = SECTION_TYPES.includes(source.type) ? source.type : 'rich_text';
  const elements = Array.isArray(source.elements) ? source.elements.slice(0, MAX_ELEMENTS_PER_SECTION).filter(isObject).map(normalizeElement) : [];
  return { id: typeof source.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(source.id) ? source.id : createId('section'), type, visible: source.visible !== false, settings: cleanSettings(source.settings), elements };
}
export function normalizeSections(input = []) {
  return Array.isArray(input) ? input.slice(0, MAX_SECTIONS_PER_PAGE).filter(isObject).map(normalizeSection) : [];
}
export function createDefaultPage({ title = 'Home', slug = 'home', isHome = false, sections = [] } = {}) {
  return { id: createId('page'), title: cleanText(title, 120) || 'Untitled page', slug: cleanSlug(slug), isHome: Boolean(isHome), visible: true, sections: normalizeSections(sections) };
}
export function createPage({ title = 'New page', slug = '', sections = [] } = {}) {
  const safeTitle = cleanText(title, 120) || 'New page';
  return createDefaultPage({ title: safeTitle, slug: cleanSlug(slug || safeTitle, 'new-page'), sections, isHome: false });
}
export function normalizePages(input = []) {
  if (!Array.isArray(input)) return [];
  const usedSlugs = new Set();
  return input.slice(0, MAX_PAGES).filter(isObject).map((page, index) => {
    const baseSlug = cleanSlug(page.slug, index === 0 ? 'home' : `page-${index + 1}`);
    let slug = baseSlug, suffix = 2;
    while (usedSlugs.has(slug)) { slug = `${baseSlug}-${suffix}`; suffix += 1; }
    usedSlugs.add(slug);
    return { id: typeof page.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(page.id) ? page.id : createId('page'), title: cleanText(page.title, 120) || 'Untitled page', slug, isHome: Boolean(page.isHome), visible: page.visible !== false, sections: normalizeSections(page.sections) };
  });
}
export function createDefaultStorefront(input = {}) {
  const businessName = cleanText(input.businessName, 120);
  const primaryColor = normalizeHexColor(input.primaryColor, COLOR_DEFAULTS.primary);
  const page = createDefaultPage({ title: 'Home', slug: 'home', isHome: true, sections: [createSection('hero', { title: businessName || 'Welcome to our business', subtitle: 'Discover what we have to offer.', buttonText: 'Get started', buttonLink: '', backgroundImage: '', alignment: 'center', height: 'large' }), createSection('about', { title: 'About us', description: '', image: '' }), createSection('contact', { title: 'Get in touch', description: 'We would love to hear from you.' })] });
  return { ...storefrontDefaults, primaryColor, theme: normalizeTheme({ ...STOREFRONT_THEME_DEFAULTS, primaryColor }), pages: [page], activePage: 'home', version: STOREFRONT_VERSION };
}
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
    pages = [createDefaultPage({ title: 'Home', slug: 'home', isHome: true, sections: [createSection('hero', { title: heroTitle || cleanText(businessName, 120) || 'Welcome', subtitle: heroSubtitle, buttonText: ctaText, buttonLink: ctaLink, backgroundImage, alignment: 'center', height: 'large' }), createSection('about', { title: 'About us', description: '', image: '' }), createSection('contact', { title: 'Get in touch', description: 'We would love to hear from you.' })] })];
  }
  const preferredHomeIndex = Math.max(0, pages.findIndex(page => page.isHome || page.slug === 'home'));
  const normalizedPages = [], usedSlugs = new Set(['home']);
  pages.forEach((page, index) => {
    if (index === preferredHomeIndex) { normalizedPages.push({ ...page, slug: 'home', isHome: true }); return; }
    const baseSlug = cleanSlug(page.slug, `page-${index + 1}`);
    let slug = baseSlug, suffix = 2;
    while (usedSlugs.has(slug)) { slug = `${baseSlug}-${suffix}`; suffix += 1; }
    usedSlugs.add(slug); normalizedPages.push({ ...page, slug, isHome: false });
  });
  const theme = normalizeTheme({ ...source.theme, primaryColor: source.theme?.primaryColor || source.theme?.primary || primaryColor });
  return { ...storefrontDefaults, heroTitle, heroSubtitle, ctaText, ctaLink, primaryColor, backgroundImage, bannerImage: backgroundImage, published, version: STOREFRONT_VERSION, theme, pages: normalizedPages, activePage: cleanSlug(source.activePage, 'home'), ...normalizeStorefrontMetadata(source) };
}
export function getStorefrontPage(storefront, slug = 'home') {
  const config = normalizeStorefrontConfig(storefront);
  const target = cleanSlug(slug);
  return config.pages.find(page => page.slug === target && page.visible) || config.pages.find(page => page.isHome) || config.pages[0] || null;
}
