import React from 'react';
import ImageUploader from './ImageUploader.jsx';

const SECTION_LABELS = {
  announcement: 'Announcement bar',
  hero: 'Hero section',
  about: 'About your business',
  image_text: 'Image and text',
  rich_text: 'Text section',
  custom_content: 'Custom content',
  gallery: 'Image gallery',
  featured_products: 'Featured products',
  product_grid: 'Product catalogue',
  categories: 'Product categories',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking section',
  portfolio_grid: 'Portfolio',
  featured_projects: 'Featured projects',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'FAQs',
  contact: 'Contact section',
  footer: 'Footer',
};

export function getGuidedSectionKey(section, counts = {}) {
  const type = section?.type || 'section';
  counts[type] = (counts[type] || 0) + 1;
  return `${type}:${counts[type]}`;
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || ''}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || ''}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
      />
    </label>
  );
}

function getFields(type) {
  switch (type) {
    case 'hero':
      return [
        ['eyebrow', 'Small introductory text', 'e.g. NEW COLLECTION'],
        ['title', 'Main heading', 'Your main headline'],
        ['subtitle', 'Supporting text', 'A short description'],
        ['buttonText', 'Button label', 'Shop now'],
        ['buttonLink', 'Button destination', '/products'],
      ];

    case 'about':
    case 'image_text':
      return [
        ['title', 'Section heading', 'About our business'],
        ['subtitle', 'Supporting text', 'A short introduction'],
        ['description', 'Description', 'Tell customers about your business'],
      ];

    case 'rich_text':
    case 'custom_content':
      return [
        ['title', 'Section heading', 'Enter a heading'],
        ['subtitle', 'Supporting text', 'Add a short introduction'],
        ['content', 'Main content', 'Write your content here'],
      ];

    case 'announcement':
      return [
        ['text', 'Announcement message', 'Write your announcement'],
      ];

    case 'footer':
      return [
        ['text', 'Footer message', 'A short message about your business'],
      ];

    case 'gallery':
      return [
        ['title', 'Gallery heading', 'Our work'],
        ['subtitle', 'Supporting text', 'A short introduction'],
      ];

    default:
      return [
        ['title', 'Section heading', 'Enter a heading'],
        ['subtitle', 'Supporting text', 'Add a short introduction'],
      ];
  }
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .map((item) => (typeof item === 'string' ? item : item?.url || ''))
    .filter(Boolean);
}

export default function GuidedSectionContent({
  template,
  values = {},
  onChange,
}) {
  const sections = template?.pages?.[0]?.sections || [];
  const counts = {};

  const editableSections = sections
    .map((section) => ({
      section,
      key: getGuidedSectionKey(section, counts),
    }))
    .filter(({ section }) => section.type !== 'navigation');

  const updateField = (key, field, value) => {
    onChange({
      ...values,
      [key]: {
        ...(values[key] || {}),
        [field]: value,
      },
    });
  };

  if (!editableSections.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        This design has no editable content sections.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Make the design yours
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Edit your section content and upload your own images.
          Your products, services and other business records remain separate.
        </p>
      </div>

      {editableSections.map(({ section, key }, index) => {
        const settings = {
          ...(section.settings || {}),
          ...(values[key] || {}),
        };

        const fields = getFields(section.type);
        const imageField =
          section.type === 'hero'
            ? 'backgroundImage'
            : ['about', 'image_text'].includes(section.type)
              ? 'image'
              : null;

        return (
          <section
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Section {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  {SECTION_LABELS[section.type] || 'Content section'}
                </h3>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                {section.type.replaceAll('_', ' ')}
              </span>
            </div>

            <div className="space-y-4">
              {fields.map(([field, label, placeholder]) => {
                const isLongText = [
                  'description',
                  'content',
                  'text',
                ].includes(field);

                return isLongText ? (
                  <TextAreaField
                    key={field}
                    label={label}
                    value={settings[field]}
                    placeholder={placeholder}
                    rows={field === 'content' ? 5 : 3}
                    onChange={(value) => updateField(key, field, value)}
                  />
                ) : (
                  <TextField
                    key={field}
                    label={label}
                    value={settings[field]}
                    placeholder={placeholder}
                    onChange={(value) => updateField(key, field, value)}
                  />
                );
              })}

              {imageField && (
                <ImageUploader
                  label={
                    imageField === 'backgroundImage'
                      ? 'Hero background image'
                      : 'Section image'
                  }
                  value={settings[imageField] ? [settings[imageField]] : []}
                  onChange={(images) =>
                    updateField(key, imageField, images[0] || '')
                  }
                  maxFiles={1}
                  helperText="Upload one image. JPG, PNG or WebP, maximum 5 MB."
                />
              )}

              {section.type === 'gallery' && (
                <ImageUploader
                  label="Gallery images"
                  value={normalizeImages(settings.images)}
                  onChange={(images) => updateField(key, 'images', images)}
                  maxFiles={8}
                  helperText="Upload up to 8 gallery images. JPG, PNG or WebP, maximum 5 MB each."
                />
              )}
            </div>
          </section>
        );
      })}

      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        Uploaded images are stored in your media account and their permanent
        URLs are saved with your storefront. You can remove an image here
        before saving your setup.
      </p>
    </div>
  );
}