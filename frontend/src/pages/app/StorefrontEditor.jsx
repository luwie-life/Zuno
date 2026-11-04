import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Monitor, Smartphone, Tablet, Undo2, Redo2, Plus,
  Eye, EyeOff, Trash2, Save, Layout, Type, Image as ImageIcon,
  Palette, Settings2, X, Check, GripVertical, ChevronDown,
  ExternalLink, Layers, Sparkles,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  createDefaultPage,
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

const SECTION_GROUPS = [
  {
    title: 'Essentials',
    types: ['hero', 'about', 'image_text', 'rich_text', 'gallery', 'contact'],
  },
  {
    title: 'Business',
    types: [
      'services', 'featured_services', 'service_packages', 'booking',
      'portfolio_grid', 'featured_projects', 'product_grid',
      'featured_products', 'categories',
    ],
  },
  {
    title: 'More sections',
    types: [
      'announcement', 'testimonials', 'pricing', 'faq',
      'social_links', 'custom_content', 'navigation', 'footer',
    ],
  },
];

const DEFAULT_SETTINGS = {
  hero: {
    title: 'Welcome to our business',
    subtitle: 'Tell visitors what makes your business special.',
    eyebrow: '',
    buttonText: 'Get started',
    buttonLink: '/services',
    backgroundImage: '',
    alignment: 'left',
    height: 'large',
  },
  about: {
    title: 'About us',
    subtitle: '',
    description: 'Tell customers about your business, your story and what makes you different.',
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
    description: 'Have a question or ready to get started? Get in touch with us.',
    buttonText: 'Contact us',
  },
  announcement: { text: 'Welcome to our store' },
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

function makeSettings(type, businessName) {
  return {
    ...(DEFAULT_SETTINGS[type] || { title: LABELS[type] || 'New section' }),
    ...(type === 'hero' && businessName ? { title: businessName } : {}),
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = 'text',
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      {multiline ? (
        <textarea
          rows={4}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"
        />
      )}
    </label>
  );
}

function Choice({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <select
        value={value || options[0]?.value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-700"
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
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        type="color"
        value={value || '#111827'}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'bg-emerald-50 text-emerald-800'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Editable canvas text.
 * Click the text to edit it directly on the preview.
 * Changes are committed when the element loses focus.
 */
function EditableText({
  value,
  onChange,
  onActivate,
  className = '',
  style = {},
  tag: Tag = 'div',
  placeholder = 'Click to edit',
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (
      elementRef.current &&
      document.activeElement !== elementRef.current &&
      elementRef.current.innerText !== (value || '')
    ) {
      elementRef.current.innerText = value || '';
    }
  }, [value]);

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label="Edit text"
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.();
      }}
      onFocus={() => onActivate?.()}
      onBlur={(event) => {
        const nextValue = event.currentTarget.innerText;
        if (nextValue !== (value || '')) onChange(nextValue);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.currentTarget.blur();
      }}
      className={`cursor-text rounded-sm outline-none transition hover:outline hover:outline-1 hover:outline-dashed hover:outline-emerald-400 focus:outline focus:outline-2 focus:outline-emerald-500 ${className}`}
      style={style}
      data-placeholder={placeholder}
    >
      {value || placeholder}
    </Tag>
  );
}

function CanvasSection({
  section,
  index,
  selected,
  onSelect,
  onEditField,
  onUpdateField,
  business,
  theme,
}) {
  const settings = section.settings || {};

  const muted = theme.mutedColor || '#6B7280';
  const primary = theme.primaryColor || '#0B6B4F';
  const background = theme.backgroundColor || '#FFFFFF';
  const text = theme.textColor || '#111827';

  const heading = settings.title || LABELS[section.type] || 'Your section';
  const subtitle = settings.subtitle || settings.description || '';
  const image = settings.backgroundImage || settings.image || '';

  const edit = (key) => () => onEditField(section.id, key);
  const update = (key) => (value) => onUpdateField(section.id, key, value);

  const titleStyle = {
    color: settings.titleColor || text,
    fontSize: settings.titleSize || undefined,
    textAlign: settings.textAlign || undefined,
  };

  const bodyStyle = {
    color: settings.bodyColor || muted,
    textAlign: settings.textAlign || undefined,
  };

  const buttonStyle = {
    background: settings.buttonColor || primary,
    color: settings.buttonTextColor || '#FFFFFF',
    borderRadius: theme.buttonStyle === 'pill'
      ? '999px'
      : theme.buttonStyle === 'square'
        ? '4px'
        : '12px',
  };

  const placeholder = (title, description = '') => (
    <div className="mx-auto max-w-lg py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ImageIcon size={20} />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );

  let content;

  switch (section.type) {
    case 'announcement':
      content = (
        <div
          className="px-4 py-3 text-center text-xs font-semibold text-white"
          style={{ background: primary }}
        >
          <EditableText
            value={settings.text || 'Your announcement will appear here'}
            onChange={update('text')}
            onActivate={edit('text')}
          />
        </div>
      );
      break;

    case 'navigation':
      content = (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <span className="font-bold" style={{ color: text }}>
            {business.name || 'Your business'}
          </span>
          <div className="flex gap-4 text-xs" style={{ color: muted }}>
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </div>
      );
      break;

    case 'hero':
      content = (
        <div
          className="relative flex min-h-[300px] flex-col justify-center overflow-hidden px-7 py-12 text-white md:min-h-[390px] md:px-12"
          style={{
            background: image
              ? `linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.2)),url("${image}") center/cover`
              : 'linear-gradient(125deg,#123d31,#152c27)',
            textAlign: settings.alignment === 'center' ? 'center' : 'left',
            alignItems: settings.alignment === 'center' ? 'center' : 'flex-start',
          }}
        >
          {settings.eyebrow && (
            <EditableText
              value={settings.eyebrow}
              onChange={update('eyebrow')}
              onActivate={edit('eyebrow')}
              className="text-xs font-semibold uppercase tracking-[.2em] text-white/70"
            />
          )}

          <EditableText
            tag="h1"
            value={settings.title || business.name || 'Your headline goes here'}
            onChange={update('title')}
            onActivate={edit('title')}
            className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-5xl"
            style={titleStyle}
          />

          <EditableText
            value={settings.subtitle || 'Add a short description to introduce your business.'}
            onChange={update('subtitle')}
            onActivate={edit('subtitle')}
            className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-base"
            style={bodyStyle}
          />

          {settings.buttonText && (
            <EditableText
              value={settings.buttonText}
              onChange={update('buttonText')}
              onActivate={edit('buttonText')}
              className="mt-7 inline-flex px-6 py-3 text-xs font-bold"
              style={buttonStyle}
            />
          )}
        </div>
      );
      break;

    case 'about':
    case 'image_text':
      content = (
        <div className={`grid items-center gap-7 px-6 py-12 md:grid-cols-2 md:px-10 ${settings.layout === 'image_right' ? 'md:[&>div:first-child]:order-2' : ''}`}>
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            {image ? (
              <img
                src={image}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-slate-400">
                <ImageIcon size={32} />
              </div>
            )}
          </div>

          <div>
            <EditableText
              tag="h2"
              value={heading}
              onChange={update('title')}
              onActivate={edit('title')}
              className="text-2xl font-bold"
              style={titleStyle}
            />

            {settings.subtitle && (
              <EditableText
                value={settings.subtitle}
                onChange={update('subtitle')}
                onActivate={edit('subtitle')}
                className="mt-2 text-sm font-medium"
                style={{ color: primary }}
              />
            )}

            <EditableText
              value={settings.description || 'Your business description will appear here. Tell visitors about your story and what you offer.'}
              onChange={update('description')}
              onActivate={edit('description')}
              className="mt-4 whitespace-pre-line text-sm leading-7"
              style={bodyStyle}
            />
          </div>
        </div>
      );
      break;

    case 'rich_text':
    case 'custom_content':
      content = (
        <div className="px-7 py-12 md:px-12">
          <EditableText
            tag="h2"
            value={heading}
            onChange={update('title')}
            onActivate={edit('title')}
            className="text-2xl font-bold"
            style={titleStyle}
          />

          <EditableText
            value={settings.content || settings.description || 'Your text content will appear here.'}
            onChange={update('content')}
            onActivate={edit('content')}
            className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7"
            style={bodyStyle}
          />
        </div>
      );
      break;

    case 'gallery':
      content = (
        <div className="px-6 py-10 md:px-10">
          <EditableText
            tag="h2"
            value={heading}
            onChange={update('title')}
            onActivate={edit('title')}
            className="text-2xl font-bold"
            style={titleStyle}
          />

          <EditableText
            value={subtitle}
            onChange={update('subtitle')}
            onActivate={edit('subtitle')}
            className="mt-2 text-sm"
            style={bodyStyle}
          />

          {Array.isArray(settings.images) && settings.images.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {settings.images.map((src, i) => (
                <img
                  key={i}
                  src={typeof src === 'string' ? src : src.url}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          ) : (
            placeholder('Your images will appear here', 'Add images in the section settings.')
          )}
        </div>
      );
      break;

    case 'contact':
    case 'booking':
      content = (
        <div
          className="mx-5 my-8 rounded-3xl px-7 py-10 text-white md:mx-10"
          style={{ background: '#111827' }}
        >
          <EditableText
            tag="h2"
            value={heading}
            onChange={update('title')}
            onActivate={edit('title')}
            className="text-2xl font-bold"
          />

          <EditableText
            value={settings.description || 'Give visitors a clear next step.'}
            onChange={update('description')}
            onActivate={edit('description')}
            className="mt-3 max-w-xl text-sm leading-6 text-white/70"
          />

          <EditableText
            value={settings.buttonText || 'Get in touch'}
            onChange={update('buttonText')}
            onActivate={edit('buttonText')}
            className="mt-6 inline-flex px-5 py-3 text-xs font-bold"
            style={buttonStyle}
          />
        </div>
      );
      break;

    case 'services':
    case 'featured_services':
    case 'service_packages':
    case 'portfolio_grid':
    case 'featured_projects':
    case 'product_grid':
    case 'featured_products':
    case 'categories':
    case 'testimonials':
    case 'pricing':
      content = (
        <div className="px-6 py-12 md:px-10">
          <EditableText
            tag="h2"
            value={heading}
            onChange={update('title')}
            onActivate={edit('title')}
            className="text-2xl font-bold"
            style={titleStyle}
          />

          <EditableText
            value={subtitle || 'Your published business content will appear here.'}
            onChange={update('subtitle')}
            onActivate={edit('subtitle')}
            className="mt-2 text-sm"
            style={bodyStyle}
          />

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-3">
                  <div className="h-3 w-3/4 rounded bg-slate-100" />
                  <div className="mt-2 h-2 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[11px]" style={{ color: muted }}>
            Live items will appear when you publish this section.
          </p>
        </div>
      );
      break;

    case 'faq':
      content = (
        <div className="px-6 py-10 md:px-10">
          <EditableText
            tag="h2"
            value={heading}
            onChange={update('title')}
            onActivate={edit('title')}
            className="text-2xl font-bold"
            style={titleStyle}
          />

          {[
            'How does it work?',
            'How can customers contact us?',
            'Where are you located?',
          ].map((question) => (
            <div
              key={question}
              className="mt-3 border-b border-slate-100 py-4 text-sm font-medium"
              style={{ color: text }}
            >
              {question}
            </div>
          ))}
        </div>
      );
      break;

    case 'social_links':
      content = (
        <div className="px-6 py-8 text-center text-sm" style={{ color: muted }}>
          Your social media links will appear here.
        </div>
      );
      break;

    case 'footer':
      content = (
        <div className="bg-slate-950 px-6 py-8 text-center text-sm text-white/70">
          <EditableText
            value={settings.text || business.name || 'Your business'}
            onChange={update('text')}
            onActivate={edit('text')}
          />
        </div>
      );
      break;

    default:
      content = placeholder(heading, 'This section will appear on your published storefront.');
  }

  return (
    <div
      data-section-index={index}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(section.id);
      }}
      className={`group relative cursor-pointer transition ${
        selected
          ? 'z-10 outline outline-2 outline-emerald-600 outline-offset-[-2px]'
          : 'hover:outline hover:outline-1 hover:outline-emerald-400'
      } ${section.visible === false ? 'opacity-35' : ''}`}
      style={{ background: background || '#fff' }}
    >
      {content}

      {selected && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg bg-emerald-800 p-1 text-white shadow-lg">
          <span className="px-2 text-[10px] font-bold">
            {LABELS[section.type] || section.type}
          </span>
          <span className="rounded bg-white/15 p-1">
            <Check size={12} />
          </span>
        </div>
      )}
    </div>
  );
}

function SectionFields({ section, onChange }) {
  const type = section.type;
  const settings = section.settings || {};

  const set = (key, value) => onChange({ ...settings, [key]: value });

  const showTitle = ![
    'announcement',
    'navigation',
    'social_links',
    'footer',
  ].includes(type);

  const showDescription = [
    'hero', 'about', 'image_text', 'contact', 'booking',
    'services', 'featured_services', 'service_packages',
    'portfolio_grid', 'featured_projects', 'product_grid',
    'featured_products', 'rich_text', 'custom_content',
  ].includes(type);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-900">
          {LABELS[type] || 'Section settings'}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Edit your content and see the changes on the canvas.
        </p>
      </div>

      {showTitle && (
        <Field
          label="Heading"
          value={settings.title}
          onChange={(value) => set('title', value)}
          placeholder="Enter a heading"
        />
      )}

      {type === 'announcement' && (
        <Field
          label="Announcement message"
          value={settings.text}
          onChange={(value) => set('text', value)}
        />
      )}

      {type === 'hero' && (
        <>
          <Field
            label="Small label"
            value={settings.eyebrow}
            onChange={(value) => set('eyebrow', value)}
          />

          <Field
            label="Description"
            value={settings.subtitle}
            onChange={(value) => set('subtitle', value)}
            multiline
          />

          <Field
            label="Button text"
            value={settings.buttonText}
            onChange={(value) => set('buttonText', value)}
          />

          <Field
            label="Button destination"
            value={settings.buttonLink}
            onChange={(value) => set('buttonLink', value)}
            placeholder="/services or https://..."
          />

          <Field
            label="Background image URL"
            value={settings.backgroundImage}
            onChange={(value) => set('backgroundImage', value)}
            placeholder="https://..."
          />

          <Choice
            label="Text alignment"
            value={settings.alignment}
            onChange={(value) => set('alignment', value)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centered' },
            ]}
          />

          <Choice
            label="Banner height"
            value={settings.height}
            onChange={(value) => set('height', value)}
            options={[
              { value: 'small', label: 'Short' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Tall' },
            ]}
          />
        </>
      )}

      {['about', 'image_text'].includes(type) && (
        <>
          <Field
            label="Short introduction"
            value={settings.subtitle}
            onChange={(value) => set('subtitle', value)}
          />

          <Field
            label="Description"
            value={settings.description}
            onChange={(value) => set('description', value)}
            multiline
          />

          <Field
            label="Image URL"
            value={settings.image}
            onChange={(value) => set('image', value)}
            placeholder="Paste an image URL"
          />

          {type === 'image_text' && (
            <Choice
              label="Image position"
              value={settings.layout}
              onChange={(value) => set('layout', value)}
              options={[
                { value: 'image_left', label: 'Image on the left' },
                { value: 'image_right', label: 'Image on the right' },
              ]}
            />
          )}
        </>
      )}

      {['rich_text', 'custom_content'].includes(type) && (
        <Field
          label="Your content"
          value={settings.content}
          onChange={(value) => set('content', value)}
          multiline
        />
      )}

      {type === 'gallery' && (
        <Field
          label="Image URLs (one per line)"
          value={(settings.images || [])
            .map((item) => typeof item === 'string' ? item : item.url)
            .join('\n')}
          onChange={(value) => set(
            'images',
            value.split('\n').map((item) => item.trim()).filter(Boolean),
          )}
          multiline
        />
      )}

      {['contact', 'booking'].includes(type) && (
        <>
          <Field
            label="Description"
            value={settings.description}
            onChange={(value) => set('description', value)}
            multiline
          />

          <Field
            label="Button text"
            value={settings.buttonText}
            onChange={(value) => set('buttonText', value)}
          />
        </>
      )}

      {showDescription && ![
        'hero', 'about', 'image_text', 'contact',
        'booking', 'rich_text', 'custom_content',
      ].includes(type) && (
        <Field
          label="Short description"
          value={settings.subtitle}
          onChange={(value) => set('subtitle', value)}
          multiline
        />
      )}

      {[
        'services', 'featured_services', 'service_packages',
        'portfolio_grid', 'featured_projects', 'product_grid',
        'featured_products',
      ].includes(type) && (
        <Choice
          label="Items to display"
          value={String(settings.limit || 6)}
          onChange={(value) => set('limit', Number(value))}
          options={[3, 4, 6, 8, 12].map((value) => ({
            value: String(value),
            label: `${value} items`,
          }))}
        />
      )}

      {type === 'footer' && (
        <Field
          label="Footer text"
          value={settings.text}
          onChange={(value) => set('text', value)}
        />
      )}

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Text styling
        </p>

        <div className="space-y-4">
          <ColorField
            label="Heading color"
            value={settings.titleColor || '#111827'}
            onChange={(value) => set('titleColor', value)}
          />

          <ColorField
            label="Body text color"
            value={settings.bodyColor || '#6B7280'}
            onChange={(value) => set('bodyColor', value)}
          />

          <Choice
            label="Heading size"
            value={settings.titleSize || '32px'}
            onChange={(value) => set('titleSize', value)}
            options={[
              { value: '24px', label: 'Small' },
              { value: '32px', label: 'Medium' },
              { value: '40px', label: 'Large' },
              { value: '48px', label: 'Extra large' },
            ]}
          />

          <Choice
            label="Text alignment"
            value={settings.textAlign || 'left'}
            onChange={(value) => set('textAlign', value)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />

          <ColorField
            label="Button background"
            value={settings.buttonColor || '#0B6B4F'}
            onChange={(value) => set('buttonColor', value)}
          />

          <ColorField
            label="Button text"
            value={settings.buttonTextColor || '#FFFFFF'}
            onChange={(value) => set('buttonTextColor', value)}
          />
        </div>
      </div>
    </div>
  );
}

export default function StorefrontEditor() {
  const { ctx, refresh } = useAuth();
  const business = ctx?.business || {};
  const businessType = business.businessType || 'product';

  const [storefront, setStorefront] = useState(() =>
    normalizeStorefrontConfig(business.storefront || {}, business.name)
  );

  const [activePageId, setActivePageId] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');
  const [panel, setPanel] = useState('sections');
  const [device, setDevice] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [pageName, setPageName] = useState('');
  const [showPages, setShowPages] = useState(false);
  const [showAddSections, setShowAddSections] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [lastSaved, setLastSaved] = useState('');

  const dragRef = useRef(null);
  const saveTimer = useRef(null);
  const historyRef = useRef(null);

  const pages = storefront.pages || [];

  const activePage =
    pages.find((page) => page.id === activePageId) ||
    pages.find((page) => page.isHome) ||
    pages[0];

  const activeSection = activePage?.sections?.find(
    (section) => section.id === activeSectionId
  );

  const availableSections = useMemo(
    () => getAvailableSectionTypes(businessType),
    [businessType]
  );

  const updateStorefront = useCallback((updater) => {
    setStorefront((current) => {
      const next = typeof updater === 'function'
        ? updater(current)
        : updater;

      if (next === current) return current;

      historyRef.current = current;
      setHistory((items) => [...items.slice(-29), current]);
      setFuture([]);
      setDirty(true);

      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
        setActivePageId(
          config.pages.find((page) => page.isHome)?.id ||
          config.pages[0]?.id ||
          ''
        );
        setDirty(false);
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

  const updatePage = (pageId, changes) => {
    updateStorefront((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === pageId ? { ...page, ...changes } : page
      ),
    }));
  };

  const updateSection = (sectionId, changes) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.map((section) =>
        section.id === sectionId
          ? { ...section, ...changes }
          : section
      ),
    });
  };

  const updateSectionSettings = (settings) => {
    if (activeSection) {
      updateSection(activeSection.id, { settings });
    }
  };

  const updateField = (sectionId, key, value) => {
    if (!activePage) return;

    const section = activePage.sections.find(
      (item) => item.id === sectionId
    );

    if (!section) return;

    updateSection(sectionId, {
      settings: {
        ...(section.settings || {}),
        [key]: value,
      },
    });
  };

  const selectCanvasField = (sectionId) => {
    setActiveSectionId(sectionId);
    setPanel('edit');
  };

  const addSection = (type) => {
    if (!activePage) return;

    const section = createSection(
      type,
      makeSettings(type, business.name)
    );

    updatePage(activePage.id, {
      sections: [...activePage.sections, section],
    });

    setActiveSectionId(section.id);
    setPanel('edit');
    setShowAddSections(false);
  };

  const removeSection = (id) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.filter(
        (section) => section.id !== id
      ),
    });

    if (activeSectionId === id) {
      setActiveSectionId('');
    }
  };

  const moveSection = (from, to) => {
    if (
      !activePage ||
      from === to ||
      to < 0 ||
      to >= activePage.sections.length
    ) {
      return;
    }

    const next = [...activePage.sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    updatePage(activePage.id, { sections: next });
  };

  const addPage = () => {
    const title = pageName.trim();
    if (!title) return;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (
      !slug ||
      slug === 'home' ||
      pages.some((page) => page.slug === slug)
    ) {
      setError('That page name is already in use. Try another one.');
      return;
    }

    const page = createDefaultPage({
      title,
      slug,
      isHome: false,
      sections: [],
    });

    updateStorefront((current) => ({
      ...current,
      pages: [...current.pages, page],
      activePage: slug,
    }));

    setActivePageId(page.id);
    setActiveSectionId('');
    setPageName('');
    setShowPages(false);
  };

  const save = useCallback(async () => {
    if (!dirty || saving) return;

    setSaving(true);
    setError('');

    try {
      const result = await api('/businesses/current/storefront', {
        method: 'PUT',
        biz: true,
        body: storefront,
      });

      const saved = normalizeStorefrontConfig(
        result.storefront || storefront,
        business.name
      );

      setStorefront(saved);
      setDirty(false);

      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );

      await refresh();
    } catch (err) {
      setError(err.message || 'Your changes could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [dirty, saving, storefront, business.name, refresh]);

  useEffect(() => {
    if (!dirty || loading) return;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 1400);

    return () => clearTimeout(saveTimer.current);
  }, [storefront, dirty, loading, save]);

  const undo = () => {
    if (!history.length) return;

    const previous = history[history.length - 1];

    setFuture((items) => [storefront, ...items]);
    setHistory((items) => items.slice(0, -1));
    setStorefront(previous);
    setDirty(true);
  };

  const redo = () => {
    if (!future.length) return;

    const next = future[0];

    setHistory((items) => [...items, storefront]);
    setFuture((items) => items.slice(1));
    setStorefront(next);
    setDirty(true);
  };

  const onDragStart = (event, index) => {
    event.preventDefault();
    dragRef.current = { index };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onDragEnd = (event) => {
    if (!dragRef.current) return;

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-section-index]');

    if (target) {
      const index = Number(
        target.getAttribute('data-section-index')
      );

      moveSection(dragRef.current.index, index);
    }

    dragRef.current = null;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white text-sm text-slate-500">
        Preparing your design workspace…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#f4f5f7] text-slate-900">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/app"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {business.name || 'Your storefront'}
            </p>
            <p className="text-[10px] text-slate-500">
              Storefront editor
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
          <ActionButton
            onClick={undo}
            disabled={!history.length}
            title="Undo"
          >
            <Undo2 size={16} />
          </ActionButton>

          <ActionButton
            onClick={redo}
            disabled={!future.length}
            title="Redo"
          >
            <Redo2 size={16} />
          </ActionButton>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            {saving
              ? 'Saving…'
              : dirty
                ? 'Unsaved changes'
                : lastSaved
                  ? `Saved ${lastSaved}`
                  : 'All changes saved'}
          </span>

          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-800 px-3 text-xs font-bold text-white transition hover:bg-emerald-900 disabled:opacity-40"
          >
            <Save size={14} />
            <span className="hidden sm:inline">
              {saving ? 'Saving' : 'Save'}
            </span>
            <span className="sm:hidden">
              {saving ? '…' : 'Save'}
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="z-40 flex items-center justify-between bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
          <button type="button" onClick={() => setError('')}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="z-20 hidden w-[68px] shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-white py-4 md:flex">
          {[
            { id: 'sections', icon: Layers, label: 'Sections' },
            { id: 'pages', icon: Layout, label: 'Pages' },
            { id: 'design', icon: Palette, label: 'Design' },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                className={`flex w-14 flex-col items-center gap-1 rounded-xl py-3 text-[10px] font-semibold ${
                  panel === item.id ||
                  (panel === 'edit' && item.id === 'sections')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </aside>

        <aside
          className={`${
            ['edit', 'sections', 'pages', 'design'].includes(panel)
              ? 'flex'
              : 'hidden'
          } absolute bottom-0 left-0 top-14 z-20 w-[min(88vw,330px)] flex-col border-r border-slate-200 bg-white shadow-xl md:static md:w-[300px] md:shadow-none`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <div>
              <p className="text-sm font-bold">
                {panel === 'edit'
                  ? 'Edit element'
                  : panel === 'pages'
                    ? 'Your pages'
                    : panel === 'design'
                      ? 'Design'
                      : 'Add to your page'}
              </p>

              <p className="text-[10px] text-slate-500">
                Customize your storefront
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPanel('canvas')}
              className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
            >
              <X size={17} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === 'edit' && activeSection && (
              <SectionFields
                section={activeSection}
                onChange={updateSectionSettings}
              />
            )}

            {panel === 'edit' && !activeSection && (
              <div className="py-10 text-center">
                <Settings2
                  className="mx-auto text-slate-300"
                  size={30}
                />
                <p className="mt-3 text-sm font-semibold">
                  Select something to edit
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Click text directly on the canvas or select a section.
                </p>
              </div>
            )}

            {panel === 'sections' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setShowAddSections((value) => !value)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900"
                >
                  <Plus size={16} />
                  Add a section
                </button>

                {showAddSections && SECTION_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {group.types
                        .filter((type) => availableSections.includes(type))
                        .map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addSection(type)}
                            className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-emerald-600 hover:bg-emerald-50"
                          >
                            <span className="block text-xs font-semibold">
                              {LABELS[type]}
                            </span>
                            <span className="mt-1 block text-[10px] text-slate-400">
                              Add section
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">
                      Page structure
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {activePage?.sections?.length || 0} sections
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(activePage?.sections || []).map((section, index) => (
                      <div
                        key={section.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 ${
                          activeSectionId === section.id
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onPointerDown={(event) => onDragStart(event, index)}
                          onPointerUp={onDragEnd}
                          className="cursor-grab touch-none rounded-lg p-1 text-slate-400 active:cursor-grabbing"
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionId(section.id);
                            setPanel('edit');
                          }}
                          className="min-w-0 flex-1 truncate text-left text-xs font-semibold"
                        >
                          {LABELS[section.type] || section.type}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSection(section.id, {
                            visible: section.visible === false,
                          })}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                          title="Show or hide"
                        >
                          {section.visible === false
                            ? <EyeOff size={14} />
                            : <Eye size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {panel === 'pages' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        setActivePageId(page.id);
                        setActiveSectionId('');
                        setPanel('sections');
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                        activePage?.id === page.id
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <Layout size={16} className="text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {page.title}
                      </span>
                      {page.isHome && (
                        <span className="text-[9px] font-bold uppercase text-emerald-800">
                          Home
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <Field
                    label="New page name"
                    value={pageName}
                    onChange={setPageName}
                    placeholder="e.g. About us"
                  />

                  <button
                    type="button"
                    onClick={addPage}
                    className="mt-3 w-full rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold text-white"
                  >
                    Create page
                  </button>
                </div>
              </div>
            )}

            {panel === 'design' && (
              <div className="space-y-5">
                <p className="text-xs leading-5 text-slate-500">
                  Set the overall look of your storefront. These styles apply across your pages.
                </p>

                {[
                  ['Primary color', 'primaryColor'],
                  ['Secondary color', 'secondaryColor'],
                  ['Page background', 'backgroundColor'],
                  ['Text color', 'textColor'],
                ].map(([label, key]) => (
                  <ColorField
                    key={key}
                    label={label}
                    value={storefront.theme?.[key] || '#ffffff'}
                    onChange={(value) => updateStorefront((current) => ({
                      ...current,
                      theme: {
                        ...current.theme,
                        [key]: value,
                      },
                    }))}
                  />
                ))}

                <Choice
                  label="Button shape"
                  value={storefront.theme?.buttonStyle}
                  onChange={(value) => updateStorefront((current) => ({
                    ...current,
                    theme: {
                      ...current.theme,
                      buttonStyle: value,
                    },
                  }))}
                  options={[
                    { value: 'square', label: 'Square' },
                    { value: 'rounded', label: 'Rounded' },
                    { value: 'pill', label: 'Pill' },
                  ]}
                />

                <Choice
                  label="Corner style"
                  value={storefront.theme?.borderRadius}
                  onChange={(value) => updateStorefront((current) => ({
                    ...current,
                    theme: {
                      ...current.theme,
                      borderRadius: value,
                    },
                  }))}
                  options={[
                    { value: 'none', label: 'Sharp' },
                    { value: 'small', label: 'Slightly rounded' },
                    { value: 'medium', label: 'Rounded' },
                    { value: 'large', label: 'Very rounded' },
                    { value: 'full', label: 'Pill shaped' },
                  ]}
                />
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 md:px-5">
            <button
              type="button"
              onClick={() => setShowPages((value) => !value)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-slate-100"
            >
              <span>{activePage?.title || 'Home'}</span>
              <ChevronDown size={14} />
            </button>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <ActionButton
                active={device === 'desktop'}
                onClick={() => setDevice('desktop')}
                title="Desktop preview"
              >
                <Monitor size={15} />
              </ActionButton>

              <ActionButton
                active={device === 'tablet'}
                onClick={() => setDevice('tablet')}
                title="Tablet preview"
              >
                <Tablet size={15} />
              </ActionButton>

              <ActionButton
                active={device === 'mobile'}
                onClick={() => setDevice('mobile')}
                title="Mobile preview"
              >
                <Smartphone size={15} />
              </ActionButton>
            </div>

            <a
              href={business.slug ? `/store/${business.slug}` : '/app'}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:flex"
            >
              Preview
              <ExternalLink size={13} />
            </a>
          </div>

          {showPages && (
            <div className="absolute left-4 right-4 top-28 z-40 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-xs font-bold">Switch page</p>
                <button
                  type="button"
                  onClick={() => setShowPages(false)}
                >
                  <X size={15} />
                </button>
              </div>

              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setActivePageId(page.id);
                    setActiveSectionId('');
                    setShowPages(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm hover:bg-slate-50"
                >
                  {page.title}
                  {page.isHome && (
                    <span className="text-[10px] text-emerald-700">
                      HOME
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto px-3 py-5 md:px-8 md:py-8">
            <div
              className={`mx-auto min-h-[600px] overflow-hidden bg-white shadow-xl transition-all duration-200 ${
                device === 'mobile'
                  ? 'max-w-[390px] rounded-[28px] border-[7px] border-slate-800'
                  : device === 'tablet'
                    ? 'max-w-[800px] rounded-2xl border-[5px] border-slate-700'
                    : 'max-w-[1200px] rounded-xl'
              }`}
            >
              <div
                className="min-h-[600px]"
                style={{
                  background: storefront.theme?.backgroundColor || '#fff',
                  color: storefront.theme?.textColor || '#111827',
                }}
                onClick={() => setActiveSectionId('')}
              >
                {(activePage?.sections || []).length === 0 ? (
                  <div className="flex min-h-[600px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                      <Sparkles size={28} />
                    </div>

                    <h2 className="mt-5 text-xl font-bold">
                      Start building your page
                    </h2>

                    <p className="mt-2 max-w-xs text-sm text-slate-500">
                      Add a hero, introduce your business, showcase your work or display your products.
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPanel('sections');
                        setShowAddSections(true);
                      }}
                      className="mt-6 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
                    >
                      <Plus size={16} className="mr-2 inline" />
                      Add your first section
                    </button>
                  </div>
                ) : (
                  (activePage?.sections || []).map((section, index) => (
                    <CanvasSection
                      key={section.id}
                      section={section}
                      index={index}
                      selected={activeSectionId === section.id}
                      onSelect={selectCanvasField}
                      onEditField={selectCanvasField}
                      onUpdateField={updateField}
                      business={business}
                      theme={storefront.theme || {}}
                    />
                  ))
                )}
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-[1200px] text-center text-[10px] text-slate-400">
              Click any text on your design to edit it directly. Your changes appear instantly in the preview.
            </p>
          </div>

          <div className="flex h-14 shrink-0 items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden">
            <button
              type="button"
              onClick={() => setPanel('sections')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                panel === 'sections' ? 'text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Layers size={18} />
              Sections
            </button>

            <button
              type="button"
              onClick={() => setPanel('pages')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                panel === 'pages' ? 'text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Layout size={18} />
              Pages
            </button>

            <button
              type="button"
              onClick={() => setPanel('design')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                panel === 'design' ? 'text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Palette size={18} />
              Design
            </button>

            <button
              type="button"
              onClick={() => setPanel('edit')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                panel === 'edit' ? 'text-emerald-800' : 'text-slate-500'
              }`}
            >
              <Type size={18} />
              Edit
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
