/**
 * ZUNO STOREFRONT TEMPLATE LIBRARY
 * Compatible with Storefront V3.
 *
 * Templates modify storefront presentation only.
 * They do not modify products, services, bookings, orders,
 * customers, or other business records.
 */

import {
  createDefaultPage,
  createSection,
  getBusinessCapabilities,
  normalizeStorefrontConfig,
  normalizeTheme,
} from './storefront.js';

import { createEditableTemplateSection } from './storefrontTemplateElements.js';

const section = (type, settings = {}) => ({ type, settings });

const template = ({
  id,
  name,
  category,
  description,
  businessTypes,
  tags = [],
  theme,
  sections,
}) => ({
  id,
  name,
  category,
  description,
  businessTypes,
  tags,
  theme,
  pages: [
    {
      title: 'Home',
      slug: 'home',
      isHome: true,
      sections,
    },
  ],
});

export const STOREFRONT_TEMPLATES = Object.freeze([

  // FASHION

  template({
    id: 'fashion-minimal',
    name: 'Minimal Fashion',
    category: 'Fashion',
    description: 'A clean editorial storefront for modern clothing labels.',
    businessTypes: ['product', 'hybrid'],
    tags: ['minimal', 'editorial', 'clothing'],
    theme: {
      primaryColor: '#242424',
      secondaryColor: '#77716B',
      accentColor: '#C8A77B',
      backgroundColor: '#FAF9F6',
      surfaceColor: '#F0EEE9',
      textColor: '#242424',
      mutedColor: '#77716B',
      borderColor: '#E6E1D9',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: 'none',
      buttonStyle: 'square',
    },
    sections: [
      section('announcement', { text: 'NEW SEASON — DISCOVER THE COLLECTION' }),
      section('navigation', { style: 'minimal' }),
      section('hero', {
        title: 'Designed for the everyday.',
        subtitle: 'Thoughtful essentials. Exceptional details. Made to be lived in.',
        buttonText: 'Shop the collection',
        buttonLink: '/products',
        alignment: 'left',
        height: 'large',
      }),
      section('featured_products', { title: 'Selected pieces', limit: 4 }),
      section('image_text', {
        title: 'Less, but better.',
        description: 'We believe in considered design, lasting quality and pieces that earn their place in your wardrobe.',
        image: '',
        imagePosition: 'right',
      }),
      section('product_grid', { title: 'Explore everything', limit: 8 }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'fashion-luxury',
    name: 'Luxury Boutique',
    category: 'Fashion',
    description: 'A refined, premium presentation for boutique fashion brands.',
    businessTypes: ['product', 'hybrid'],
    tags: ['luxury', 'premium', 'boutique'],
    theme: {
      primaryColor: '#6E513D',
      secondaryColor: '#2B2622',
      accentColor: '#B99A72',
      backgroundColor: '#F8F5F0',
      surfaceColor: '#EEE8DF',
      textColor: '#2B2622',
      mutedColor: '#82766B',
      borderColor: '#DED4C8',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Inter',
      borderRadius: 'small',
      buttonStyle: 'square',
    },
    sections: [
      section('announcement', { text: 'COMPLIMENTARY DELIVERY ON SELECT ORDERS' }),
      section('navigation', { style: 'luxury' }),
      section('hero', {
        title: 'A signature of timeless style.',
        subtitle: 'Discover a considered collection of pieces made to stand apart.',
        buttonText: 'Explore collection',
        buttonLink: '/products',
        alignment: 'center',
        height: 'large',
      }),
      section('about', {
        title: 'The art of considered style',
        description: 'A boutique point of view, expressed through quality, craftsmanship and timeless design.',
        image: '',
      }),
      section('featured_products', { title: 'The edit', limit: 3 }),
      section('gallery', { title: 'Inside the collection', images: [] }),
      section('product_grid', { title: 'Shop all pieces', limit: 8 }),
      section('contact', {
        title: 'Personal service',
        description: 'Need help finding the right piece? We would love to assist.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'fashion-streetwear',
    name: 'Streetwear',
    category: 'Fashion',
    description: 'Bold type and high-contrast layouts for streetwear labels.',
    businessTypes: ['product', 'hybrid'],
    tags: ['bold', 'streetwear', 'urban'],
    theme: {
      primaryColor: '#D9FF36',
      secondaryColor: '#171717',
      accentColor: '#D9FF36',
      backgroundColor: '#F4F4F1',
      surfaceColor: '#E8E8E3',
      textColor: '#171717',
      mutedColor: '#656565',
      borderColor: '#D4D4CE',
      fontHeading: 'Space Grotesk',
      fontBody: 'Inter',
      borderRadius: 'none',
      buttonStyle: 'square',
    },
    sections: [
      section('announcement', { text: 'DROP 001 — LIMITED RELEASE' }),
      section('navigation', { style: 'bold' }),
      section('hero', {
        title: 'MAKE YOUR OWN RULES.',
        subtitle: 'Independent streetwear. Built around your point of view.',
        buttonText: 'Shop the drop',
        buttonLink: '/products',
        alignment: 'left',
        height: 'large',
      }),
      section('featured_products', { title: 'THE LATEST DROP', limit: 4 }),
      section('image_text', {
        title: 'NOT MADE TO BLEND IN.',
        description: 'Every piece starts with an idea. Wear yours with confidence.',
        image: '',
        imagePosition: 'left',
      }),
      section('product_grid', { title: 'SHOP ALL', limit: 8 }),
      section('footer', { text: '' }),
    ],
  }),

  // BEAUTY

  template({
    id: 'beauty-studio',
    name: 'Beauty Studio',
    category: 'Beauty',
    description: 'Soft, polished product presentation for beauty and cosmetics.',
    businessTypes: ['product', 'hybrid'],
    tags: ['beauty', 'cosmetics', 'soft'],
    theme: {
      primaryColor: '#A66D78',
      secondaryColor: '#49363B',
      accentColor: '#D9B5A9',
      backgroundColor: '#FFF9F7',
      surfaceColor: '#F7ECE9',
      textColor: '#49363B',
      mutedColor: '#927D7F',
      borderColor: '#EADAD6',
      fontHeading: 'DM Serif Display',
      fontBody: 'Inter',
      borderRadius: 'large',
      buttonStyle: 'rounded',
    },
    sections: [
      section('announcement', { text: 'A LITTLE SELF-CARE, DELIVERED TO YOU' }),
      section('navigation', { style: 'soft' }),
      section('hero', {
        title: 'Feel good in your own skin.',
        subtitle: 'Discover everyday beauty essentials made for your routine.',
        buttonText: 'Shop beauty',
        buttonLink: '/products',
        alignment: 'center',
        height: 'large',
      }),
      section('categories', { title: 'Find your routine' }),
      section('featured_products', { title: 'Customer favourites', limit: 4 }),
      section('about', {
        title: 'Beauty, made thoughtful',
        description: 'We bring together products that make your everyday routine feel a little more special.',
        image: '',
      }),
      section('product_grid', { title: 'Explore the collection', limit: 8 }),
      section('testimonials', { title: 'Kind words from our customers' }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'skincare',
    name: 'Skincare',
    category: 'Beauty',
    description: 'Calm, ingredient-led design for skincare brands.',
    businessTypes: ['product', 'hybrid'],
    tags: ['skincare', 'clean', 'natural'],
    theme: {
      primaryColor: '#667D68',
      secondaryColor: '#293A30',
      accentColor: '#C2A77D',
      backgroundColor: '#F8F8F2',
      surfaceColor: '#EEF0E8',
      textColor: '#293A30',
      mutedColor: '#788477',
      borderColor: '#DDE2D8',
      fontHeading: 'Lora',
      fontBody: 'Inter',
      borderRadius: 'large',
      buttonStyle: 'pill',
    },
    sections: [
      section('announcement', { text: 'SIMPLE ROUTINES. HEALTHIER-LOOKING SKIN.' }),
      section('navigation', { style: 'natural' }),
      section('hero', {
        title: 'Care that feels like you.',
        subtitle: 'Thoughtful skincare for the moments that make up your day.',
        buttonText: 'Find your essentials',
        buttonLink: '/products',
        alignment: 'left',
        height: 'large',
      }),
      section('image_text', {
        title: 'A gentler kind of routine',
        description: 'Make space for a skincare ritual built around care, consistency and confidence.',
        image: '',
        imagePosition: 'right',
      }),
      section('featured_products', { title: 'Your daily essentials', limit: 3 }),
      section('product_grid', { title: 'Shop skincare', limit: 8 }),
      section('faq', { title: 'Frequently asked questions' }),
      section('footer', { text: '' }),
    ],
  }),

  // FOOD

  template({
    id: 'restaurant',
    name: 'Restaurant',
    category: 'Food',
    description: 'A warm, appetite-led storefront for restaurants and food brands.',
    businessTypes: ['product', 'hybrid'],
    tags: ['restaurant', 'food', 'menu'],
    theme: {
      primaryColor: '#8A3D2B',
      secondaryColor: '#2C211C',
      accentColor: '#D7A45B',
      backgroundColor: '#FBF7F0',
      surfaceColor: '#F2EADF',
      textColor: '#2C211C',
      mutedColor: '#82746A',
      borderColor: '#E5D9C9',
      fontHeading: 'DM Serif Display',
      fontBody: 'Inter',
      borderRadius: 'medium',
      buttonStyle: 'rounded',
    },
    sections: [
      section('announcement', { text: 'FRESHLY PREPARED. MADE WITH CARE.' }),
      section('navigation', { style: 'warm' }),
      section('hero', {
        title: 'Good food brings us together.',
        subtitle: 'Discover the flavours, favourites and freshly prepared meals waiting for you.',
        buttonText: 'View menu',
        buttonLink: '/products',
        alignment: 'center',
        height: 'large',
      }),
      section('categories', { title: 'Explore the menu' }),
      section('featured_products', { title: 'House favourites', limit: 4 }),
      section('about', {
        title: 'Our kitchen, our story',
        description: 'We care about good ingredients, generous portions and food worth coming back for.',
        image: '',
      }),
      section('product_grid', { title: 'Order from our menu', limit: 8 }),
      section('contact', {
        title: 'Visit or get in touch',
        description: 'Questions about an order or planning a visit? We are happy to help.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'bakery',
    name: 'Bakery',
    category: 'Food',
    description: 'A welcoming, handcrafted look for bakeries and dessert shops.',
    businessTypes: ['product', 'hybrid'],
    tags: ['bakery', 'artisan', 'dessert'],
    theme: {
      primaryColor: '#9A6544',
      secondaryColor: '#49362A',
      accentColor: '#D7B77D',
      backgroundColor: '#FFF9F0',
      surfaceColor: '#F5EBDD',
      textColor: '#49362A',
      mutedColor: '#8A7767',
      borderColor: '#E8D9C7',
      fontHeading: 'Lora',
      fontBody: 'Nunito Sans',
      borderRadius: 'large',
      buttonStyle: 'rounded',
    },
    sections: [
      section('announcement', { text: 'BAKED FRESH. SHARED WITH LOVE.' }),
      section('navigation', { style: 'warm' }),
      section('hero', {
        title: 'A little sweetness in every day.',
        subtitle: 'Fresh bakes, handmade treats and your new favourite indulgence.',
        buttonText: 'See what is fresh',
        buttonLink: '/products',
        alignment: 'center',
        height: 'large',
      }),
      section('featured_products', { title: 'Fresh from the oven', limit: 4 }),
      section('image_text', {
        title: 'Made by hand, every day',
        description: 'From the first batch to the final finish, every detail is made with care.',
        image: '',
        imagePosition: 'left',
      }),
      section('product_grid', { title: 'Our treats', limit: 8 }),
      section('testimonials', { title: 'Sweet words from our customers' }),
      section('footer', { text: '' }),
    ],
  }),

  // PROFESSIONAL SERVICES

  template({
    id: 'professional-services',
    name: 'Professional Services',
    category: 'Services',
    description: 'A credible, conversion-focused site for consultants and specialists.',
    businessTypes: ['service', 'hybrid'],
    tags: ['consulting', 'professional', 'business'],
    theme: {
      primaryColor: '#244D68',
      secondaryColor: '#172B3A',
      accentColor: '#C59B62',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F2F6F8',
      textColor: '#172B3A',
      mutedColor: '#657987',
      borderColor: '#DCE5EA',
      fontHeading: 'DM Sans',
      fontBody: 'Inter',
      borderRadius: 'medium',
      buttonStyle: 'rounded',
    },
    sections: [
      section('navigation', { style: 'professional' }),
      section('hero', {
        title: 'Expert support. Clear results.',
        subtitle: 'Practical, professional services designed around your goals.',
        buttonText: 'Explore services',
        buttonLink: '/services',
        alignment: 'left',
        height: 'large',
      }),
      section('about', {
        title: 'A trusted partner for your next step',
        description: 'We combine experience, clear communication and a practical approach to help you move forward.',
        image: '',
      }),
      section('featured_services', { title: 'How we can help', limit: 3 }),
      section('portfolio_grid', { title: 'Selected work', limit: 6 }),
      section('testimonials', { title: 'What clients say' }),
      section('booking', { title: 'Ready to get started?', buttonText: 'Book a consultation' }),
      section('contact', {
        title: 'Let us talk',
        description: 'Tell us what you need and we will be in touch.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'freelancer',
    name: 'Freelancer',
    category: 'Services',
    description: 'A personal, portfolio-led storefront for independent professionals.',
    businessTypes: ['service', 'hybrid'],
    tags: ['freelance', 'personal brand', 'portfolio'],
    theme: {
      primaryColor: '#7057A3',
      secondaryColor: '#29243A',
      accentColor: '#E5A86B',
      backgroundColor: '#FBFAFF',
      surfaceColor: '#F0EDFA',
      textColor: '#29243A',
      mutedColor: '#77718B',
      borderColor: '#E3DFF0',
      fontHeading: 'Space Grotesk',
      fontBody: 'Inter',
      borderRadius: 'large',
      buttonStyle: 'rounded',
    },
    sections: [
      section('navigation', { style: 'minimal' }),
      section('hero', {
        title: 'Creative work. Real impact.',
        subtitle: 'I help people and businesses turn good ideas into meaningful results.',
        buttonText: 'Let’s work together',
        buttonLink: '/contact',
        alignment: 'left',
        height: 'large',
      }),
      section('about', {
        title: 'A little about me',
        description: 'Share your experience, approach and the value you bring to every project.',
        image: '',
      }),
      section('services', { title: 'What I can help with', limit: 6 }),
      section('featured_projects', { title: 'A few things I have made', limit: 3 }),
      section('testimonials', { title: 'Kind words from clients' }),
      section('booking', { title: 'Have a project in mind?', buttonText: 'Book a session' }),
      section('contact', {
        title: 'Tell me about your project',
        description: 'Share a few details and let us start a conversation.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  // BEAUTY SERVICES

  template({
    id: 'salon-barber',
    name: 'Salon & Barber',
    category: 'Beauty Services',
    description: 'A stylish booking-first storefront for salons, barbers and grooming studios.',
    businessTypes: ['service', 'hybrid'],
    tags: ['salon', 'barber', 'appointments'],
    theme: {
      primaryColor: '#8B5B45',
      secondaryColor: '#2D2521',
      accentColor: '#C7A27B',
      backgroundColor: '#FAF7F3',
      surfaceColor: '#F0E9E1',
      textColor: '#2D2521',
      mutedColor: '#82766D',
      borderColor: '#E2D8CE',
      fontHeading: 'DM Serif Display',
      fontBody: 'Inter',
      borderRadius: 'medium',
      buttonStyle: 'rounded',
    },
    sections: [
      section('announcement', { text: 'YOUR NEXT APPOINTMENT STARTS HERE' }),
      section('navigation', { style: 'warm' }),
      section('hero', {
        title: 'Look good. Feel like yourself.',
        subtitle: 'Professional care, considered style and a space made for you.',
        buttonText: 'Book an appointment',
        buttonLink: '/booking',
        alignment: 'center',
        height: 'large',
      }),
      section('services', { title: 'Our services', limit: 6 }),
      section('portfolio_grid', { title: 'The work speaks', limit: 6 }),
      section('about', {
        title: 'More than a visit',
        description: 'A welcoming space, skilled hands and attention to every detail.',
        image: '',
      }),
      section('testimonials', { title: 'Loved by our clients' }),
      section('booking', { title: 'Your chair is waiting', buttonText: 'Book now' }),
      section('contact', {
        title: 'Find us',
        description: 'Get in touch for directions, questions or appointment support.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  template({
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    category: 'Beauty Services',
    description: 'A calm, premium experience for spas and wellness professionals.',
    businessTypes: ['service', 'hybrid'],
    tags: ['spa', 'wellness', 'relaxation'],
    theme: {
      primaryColor: '#6C8070',
      secondaryColor: '#2E3D35',
      accentColor: '#BBA47D',
      backgroundColor: '#F8F8F3',
      surfaceColor: '#EEF0E8',
      textColor: '#2E3D35',
      mutedColor: '#7C887D',
      borderColor: '#DDE2D8',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Inter',
      borderRadius: 'large',
      buttonStyle: 'pill',
    },
    sections: [
      section('navigation', { style: 'natural' }),
      section('hero', {
        title: 'Make room to feel renewed.',
        subtitle: 'Thoughtful treatments and restorative experiences, centred around you.',
        buttonText: 'Explore treatments',
        buttonLink: '/services',
        alignment: 'center',
        height: 'large',
      }),
      section('about', {
        title: 'A slower kind of care',
        description: 'Step away from the everyday and give yourself time to rest, reset and recharge.',
        image: '',
      }),
      section('featured_services', { title: 'Our treatments', limit: 3 }),
      section('gallery', { title: 'The space', images: [] }),
      section('testimonials', { title: 'Experiences worth sharing' }),
      section('booking', { title: 'Your time, your moment', buttonText: 'Reserve your session' }),
      section('contact', {
        title: 'We are here to help',
        description: 'Contact us with any questions before your visit.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  // PORTFOLIO

  template({
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'Portfolio',
    description: 'A visual-first portfolio for photographers, designers and creatives.',
    businessTypes: ['service', 'hybrid'],
    tags: ['creative', 'photography', 'design'],
    theme: {
      primaryColor: '#343434',
      secondaryColor: '#171717',
      accentColor: '#B6A18A',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F5F5F3',
      textColor: '#171717',
      mutedColor: '#777777',
      borderColor: '#E7E7E4',
      fontHeading: 'Space Grotesk',
      fontBody: 'Inter',
      borderRadius: 'none',
      buttonStyle: 'square',
    },
    sections: [
      section('navigation', { style: 'minimal' }),
      section('hero', {
        title: 'Ideas made visible.',
        subtitle: 'A selection of creative work, collaborations and visual stories.',
        buttonText: 'View selected work',
        buttonLink: '/portfolio',
        alignment: 'left',
        height: 'large',
      }),
      section('featured_projects', { title: 'Selected projects', limit: 3 }),
      section('about', {
        title: 'The person behind the work',
        description: 'Introduce yourself, your creative approach and the kind of work you love doing.',
        image: '',
      }),
      section('portfolio_grid', { title: 'Explore the portfolio', limit: 8 }),
      section('services', { title: 'Ways to work together', limit: 4 }),
      section('contact', {
        title: 'Have something in mind?',
        description: 'Tell me about the project you are imagining.',
      }),
      section('footer', { text: '' }),
    ],
  }),

  // GENERAL BUSINESS

  template({
    id: 'modern-business',
    name: 'Modern Business',
    category: 'General Business',
    description: 'A flexible, polished starting point for growing businesses.',
    businessTypes: ['product', 'service', 'hybrid'],
    tags: ['modern', 'business', 'versatile'],
    theme: {
      primaryColor: '#0B6B4F',
      secondaryColor: '#172B27',
      accentColor: '#D6A85F',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F7F5',
      textColor: '#172B27',
      mutedColor: '#6B7C75',
      borderColor: '#E0E9E4',
      fontHeading: 'DM Sans',
      fontBody: 'Inter',
      borderRadius: 'medium',
      buttonStyle: 'rounded',
    },
    sections: [
      section('navigation', { style: 'modern' }),
      section('hero', {
        title: 'A better way to move forward.',
        subtitle: 'Introduce your business, explain what you offer and make it easy for customers to take the next step.',
        buttonText: 'Get started',
        buttonLink: '/contact',
        alignment: 'left',
        height: 'large',
      }),
      section('about', {
        title: 'Built around what matters',
        description: 'Tell visitors who you are, what you do and why customers choose your business.',
        image: '',
      }),
      section('featured_products', { title: 'Popular products', limit: 4 }),
      section('featured_services', { title: 'What we offer', limit: 3 }),
      section('testimonials', { title: 'Customer stories' }),
      section('faq', { title: 'Frequently asked questions' }),
      section('contact', {
        title: 'Let’s work together',
        description: 'Have a question? Our team is ready to help.',
      }),
      section('footer', { text: '' }),
    ],
  }),
]);

const CATEGORY_ORDER = [
  'All',
  'Fashion',
  'Beauty',
  'Food',
  'Services',
  'Beauty Services',
  'Portfolio',
  'General Business',
];

function normalizeBusinessType(value = 'product') {
  const type = String(value).toLowerCase();

  if (['service', 'services', 'freelancer', 'freelance'].includes(type)) {
    return 'service';
  }

  if (['hybrid', 'both', 'product_service', 'product-and-service'].includes(type)) {
    return 'hybrid';
  }

  return 'product';
}

function canUseSection(type, businessType) {
  const capabilities = getBusinessCapabilities(businessType);

  if (
    ['services', 'featured_services', 'service_packages', 'booking'].includes(type)
  ) {
    return capabilities.services;
  }

  if (
    ['featured_products', 'product_grid', 'categories'].includes(type)
  ) {
    return capabilities.products;
  }

  if (
    ['portfolio_grid', 'featured_projects'].includes(type)
  ) {
    return capabilities.portfolio;
  }

  return true;
}

export function getTemplateCategories() {
  return [...CATEGORY_ORDER];
}

export function getStorefrontTemplates({
  businessType = 'product',
  category = 'All',
  search = '',
} = {}) {
  const type = normalizeBusinessType(businessType);
  const query = String(search || '').trim().toLowerCase();

  return STOREFRONT_TEMPLATES.filter((item) => {
    if (!item.businessTypes.includes(type)) return false;

    if (category !== 'All' && item.category !== category) {
      return false;
    }

    if (!query) return true;

    const searchable = [
      item.name,
      item.category,
      item.description,
      ...item.tags,
    ].join(' ').toLowerCase();

    return searchable.includes(query);
  });
}

export function getStorefrontTemplateById(id) {
  return STOREFRONT_TEMPLATES.find((item) => item.id === id) || null;
}

/**
 * Applies a template's visual layout and theme.
 *
 * The merchant's extra pages are retained.
 * Business records are stored separately and are untouched.
 */
export function applyStorefrontTemplate(
  currentConfig,
  templateId,
  {
    businessType = 'product',
    businessName = '',
    preserveExtraPages = true,
  } = {}
) {
  const selected = getStorefrontTemplateById(templateId);

  if (!selected) {
    throw new Error('The selected storefront template could not be found.');
  }

  const type = normalizeBusinessType(businessType);

  if (!selected.businessTypes.includes(type)) {
    throw new Error('This template is not available for this business type.');
  }

  const current = normalizeStorefrontConfig(
    currentConfig || {},
    businessName
  );

  const templatePages = selected.pages.map((page) => {
    const sections = page.sections
  .filter((item) => canUseSection(item.type, type))
  .map((item) => {
    const editableSection = createEditableTemplateSection(item);

    return {
      ...createSection(
        editableSection.type,
        editableSection.settings
      ),
      elements: editableSection.elements || [],
    };
  });
    return createDefaultPage({
      title: page.title,
      slug: page.slug,
      isHome: page.isHome,
      sections,
    });
  });

  const templateSlugs = new Set(
    templatePages.map((page) => page.slug)
  );

  const extraPages = preserveExtraPages
    ? current.pages.filter((page) => !templateSlugs.has(page.slug))
    : [];

  const theme = normalizeTheme({
    ...selected.theme,
    palette: current.theme?.palette || [],
    recentColors: current.theme?.recentColors || [],
  });

  return normalizeStorefrontConfig(
    {
      ...current,
      theme,
      primaryColor: theme.primaryColor,
      pages: [...templatePages, ...extraPages],
      activePage: 'home',
      templateId: selected.id,
      templateName: selected.name,
    },
    businessName
  );
}

export default STOREFRONT_TEMPLATES;
