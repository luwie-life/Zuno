export const STOREFRONT_VERSION = 2;

export const storefrontDefaults = Object.freeze({
  heroTitle: '',
  heroSubtitle: '',
  ctaText: 'Get started',
  ctaLink: '',
  primaryColor: '#0B6B4F',
  backgroundImage: '',
  bannerImage: '',
  published: false,

  version: STOREFRONT_VERSION,

  theme: {
    primaryColor: '#0B6B4F',
    secondaryColor: '#111827',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    mutedColor: '#6B7280',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 'medium',
    buttonStyle: 'rounded',
  },

  pages: [],
  activePage: 'home',
});

export const SECTION_TYPES = Object.freeze([
  'announcement',
  'navigation',
  'hero',
  'about',
  'image_text',
  'rich_text',
  'gallery',
  'portfolio_grid',
  'featured_projects',
  'services',
  'featured_services',
  'service_packages',
  'booking',
  'featured_products',
  'product_grid',
  'categories',
  'testimonials',
  'pricing',
  'faq',
  'contact',
  'social_links',
  'custom_content',
  'footer',
]);

export const SECTION_CATEGORIES = Object.freeze({
  general: [
    'announcement',
    'navigation',
    'hero',
    'about',
    'image_text',
    'rich_text',
    'gallery',
    'testimonials',
    'faq',
    'contact',
    'social_links',
    'custom_content',
    'footer',
  ],

  portfolio: [
    'portfolio_grid',
    'featured_projects',
  ],

  services: [
    'services',
    'featured_services',
    'service_packages',
    'booking',
  ],

  commerce: [
    'featured_products',
    'product_grid',
    'categories',
  ],

  conversion: [
    'pricing',
    'contact',
    'booking',
  ],
});

const MAX_PAGES = 20;
const MAX_SECTIONS_PER_PAGE = 40;
const MAX_TEXT_LENGTH = 5000;
const MAX_SETTINGS_KEYS = 50;

const isObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const cleanText = (value, max = MAX_TEXT_LENGTH) =>
  typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';

const cleanSlug = (value, fallback = 'home') => {
  const slug = cleanText(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

const cleanColor = (value, fallback) =>
  typeof value === 'string' &&
  /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;

const cleanImage = (value) => {
  const image = cleanText(value, 2000);

  if (!image) return '';

  try {
    const parsed = new URL(image);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return image;
  } catch {
    return '';
  }
};

const cleanSettings = (input = {}) => {
  if (!isObject(input)) return {};

  const output = {};

  for (const [key, value] of Object.entries(input).slice(0, MAX_SETTINGS_KEYS)) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) continue;

    if (typeof value === 'string') {
      output[key] = cleanText(value, MAX_TEXT_LENGTH);
      continue;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      output[key] = value;
      continue;
    }

    if (typeof value === 'boolean' || value === null) {
      output[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      output[key] = value
        .slice(0, 50)
        .filter((item) =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'
        )
        .map((item) =>
          typeof item === 'string'
            ? cleanText(item, 500)
            : item
        );
    }
  }

  return output;
};

const createId = () =>
  `section-${Math.random().toString(36).slice(2, 10)}`;

export function createSection(type, settings = {}) {
  const sectionType = SECTION_TYPES.includes(type)
    ? type
    : 'rich_text';

  return {
    id: createId(),
    type: sectionType,
    visible: true,
    settings: cleanSettings(settings),
  };
}

export function createDefaultPage({
  title = 'Home',
  slug = 'home',
  isHome = false,
  sections = [],
} = {}) {
  return {
    id: `page-${cleanSlug(slug)}`,
    title: cleanText(title, 120) || 'Untitled page',
    slug: cleanSlug(slug),
    isHome: Boolean(isHome),
    visible: true,
    sections: normalizeSections(sections),
  };
}

export function normalizeSections(input = []) {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, MAX_SECTIONS_PER_PAGE)
    .filter(isObject)
    .map((section) => {
      const type = SECTION_TYPES.includes(section.type)
        ? section.type
        : 'rich_text';

      return {
        id:
          typeof section.id === 'string' &&
          /^[a-zA-Z0-9_-]{1,100}$/.test(section.id)
            ? section.id
            : createId(),

        type,
        visible: section.visible !== false,
        settings: cleanSettings(section.settings),
      };
    });
}

export function normalizePages(input = []) {
  if (!Array.isArray(input)) return [];

  const usedSlugs = new Set();

  return input
    .slice(0, MAX_PAGES)
    .filter(isObject)
    .map((page, index) => {
      let slug = cleanSlug(
        page.slug,
        index === 0 ? 'home' : `page-${index + 1}`
      );

      if (usedSlugs.has(slug)) {
        slug = `${slug}-${index + 1}`;
      }

      usedSlugs.add(slug);

      return {
        id:
          typeof page.id === 'string' &&
          /^[a-zA-Z0-9_-]{1,100}$/.test(page.id)
            ? page.id
            : `page-${slug}`,

        title: cleanText(page.title, 120) || 'Untitled page',
        slug,
        isHome: Boolean(page.isHome) || slug === 'home',
        visible: page.visible !== false,
        sections: normalizeSections(page.sections),
      };
    });
}

export function createDefaultStorefront(input = {}) {
  const businessName = cleanText(input.businessName, 120);

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

    theme: {
      ...storefrontDefaults.theme,
      primaryColor: cleanColor(
        input.primaryColor,
        storefrontDefaults.theme.primaryColor
      ),
    },

    pages: [page],
    activePage: 'home',
  };
}

export function normalizeTheme(input = {}) {
  const source = isObject(input) ? input : {};

  const allowedRadius = ['none', 'small', 'medium', 'large', 'full'];
  const allowedButtons = ['square', 'rounded', 'pill'];

  return {
    primaryColor: cleanColor(
      source.primaryColor,
      storefrontDefaults.theme.primaryColor
    ),

    secondaryColor: cleanColor(
      source.secondaryColor,
      storefrontDefaults.theme.secondaryColor
    ),

    backgroundColor: cleanColor(
      source.backgroundColor,
      storefrontDefaults.theme.backgroundColor
    ),

    textColor: cleanColor(
      source.textColor,
      storefrontDefaults.theme.textColor
    ),

    mutedColor: cleanColor(
      source.mutedColor,
      storefrontDefaults.theme.mutedColor
    ),

    fontHeading: cleanText(source.fontHeading, 80) || 'Inter',
    fontBody: cleanText(source.fontBody, 80) || 'Inter',

    borderRadius: allowedRadius.includes(source.borderRadius)
      ? source.borderRadius
      : 'medium',

    buttonStyle: allowedButtons.includes(source.buttonStyle)
      ? source.buttonStyle
      : 'rounded',
  };
}

export function normalizeStorefrontConfig(input = {}, businessName = '') {
  const source = isObject(input) ? input : {};

  const heroTitle = cleanText(source.heroTitle, 200);
  const heroSubtitle = cleanText(source.heroSubtitle, 500);

  const ctaText =
    cleanText(source.ctaText, 80) ||
    storefrontDefaults.ctaText;

  const ctaLink = cleanText(source.ctaLink, 500);

  const primaryColor = cleanColor(
    source.primaryColor,
    storefrontDefaults.primaryColor
  );

  const backgroundImage = cleanImage(
    source.backgroundImage || source.bannerImage
  );

  const published = Boolean(source.published);

  let pages = normalizePages(source.pages);

  // Convert legacy storefront settings into a real home page.
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

  // Ensure exactly one home page and reserve the "home" slug.
  const preferredHomeIndex = Math.max(
    0,
    pages.findIndex((page) => page.isHome)
  );

  const homePage = pages[preferredHomeIndex];

  const usedSlugs = new Set(['home']);

  pages = pages.map((page, index) => {
    if (index === preferredHomeIndex) {
      return {
        ...page,
        slug: 'home',
        isHome: true,
      };
    }

    let slug = page.slug;

    if (slug === 'home' || usedSlugs.has(slug)) {
      slug = `${slug}-${index + 1}`;
    }

    while (usedSlugs.has(slug)) {
      slug = `${slug}-${index + 1}`;
    }

    usedSlugs.add(slug);

    return {
      ...page,
      slug,
      isHome: false,
    };
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

    version: STOREFRONT_VERSION,

    theme: normalizeTheme({
      ...source.theme,
      primaryColor: source.theme?.primaryColor || primaryColor,
    }),

    pages,

    activePage: cleanSlug(source.activePage, 'home'),
  };
}

export function getStorefrontPage(storefront, slug = 'home') {
  const config = normalizeStorefrontConfig(storefront);
  const target = cleanSlug(slug);

  return (
    config.pages.find(
      (page) => page.slug === target && page.visible
    ) ||
    config.pages.find((page) => page.isHome) ||
    config.pages[0] ||
    null
  );
}

export function getAvailableSectionTypes(businessType = 'product') {
  const general = SECTION_CATEGORIES.general;

  if (businessType === 'service') {
    return [
      ...general,
      ...SECTION_CATEGORIES.portfolio,
      ...SECTION_CATEGORIES.services,
      ...SECTION_CATEGORIES.conversion,
    ];
  }

  if (businessType === 'both') {
    return [
      ...general,
      ...SECTION_CATEGORIES.portfolio,
      ...SECTION_CATEGORIES.services,
      ...SECTION_CATEGORIES.commerce,
      ...SECTION_CATEGORIES.conversion,
    ];
  }

  return [
    ...general,
    ...SECTION_CATEGORIES.commerce,
    ...SECTION_CATEGORIES.conversion,
  ];
}
