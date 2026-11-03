export const storefrontDefaults = Object.freeze({
  heroTitle: '',
  heroSubtitle: '',
  ctaText: 'Shop now',
  ctaLink: '',
  primaryColor: '#0B6B4F',
  backgroundImage: '',
  bannerImage: '',
  published: false,
});

export function normalizeStorefrontConfig(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const heroTitle = typeof source.heroTitle === 'string' ? source.heroTitle.trim() : '';
  const heroSubtitle = typeof source.heroSubtitle === 'string' ? source.heroSubtitle.trim() : '';
  const ctaText = typeof source.ctaText === 'string' && source.ctaText.trim() ? source.ctaText.trim() : storefrontDefaults.ctaText;
  const ctaLink = typeof source.ctaLink === 'string' ? source.ctaLink.trim() : '';
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(source.primaryColor || '') ? source.primaryColor : storefrontDefaults.primaryColor;
  const backgroundImage = typeof source.backgroundImage === 'string' ? source.backgroundImage.trim() : (typeof source.bannerImage === 'string' ? source.bannerImage.trim() : '');
  const bannerImage = backgroundImage;
  const published = !!source.published;

  return {
    ...storefrontDefaults,
    heroTitle,
    heroSubtitle,
    ctaText,
    ctaLink,
    primaryColor,
    backgroundImage,
    bannerImage,
    published,
  };
}
