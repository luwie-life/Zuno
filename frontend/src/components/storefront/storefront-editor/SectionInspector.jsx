import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Settings2,
  Palette,
  Image as ImageIcon,
  Type,
  LayoutGrid,
  Plus,
  X,
  GripVertical,
  RotateCcw,
} from 'lucide-react';

const SECTION_LABELS = {
  announcement: 'Announcement bar',
  navigation: 'Navigation',
  hero: 'Hero section',
  about: 'About',
  image_text: 'Image and text',
  rich_text: 'Rich text',
  gallery: 'Gallery',
  portfolio_grid: 'Portfolio grid',
  featured_projects: 'Featured projects',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking',
  featured_products: 'Featured products',
  product_grid: 'Product grid',
  categories: 'Categories',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'Frequently asked questions',
  contact: 'Contact',
  social_links: 'Social links',
  custom_content: 'Custom content',
  footer: 'Footer',
};

const HEIGHT_OPTIONS = [
  { value: 'small', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Tall' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
];

const NAVIGATION_STYLE_OPTIONS = [
  { value: 'plain', label: 'Plain links' },
  { value: 'underline', label: 'Underlined links' },
  { value: 'pill', label: 'Pill buttons' },
];

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  min,
  max,
  hint,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        min={min}
        max={max}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />

      {hint && (
        <span className="block text-[11px] leading-4 text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  const validColor = /^#[0-9a-fA-F]{6}$/.test(value || '')
    ? value
    : '#FFFFFF';

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <input
          type="color"
          value={validColor}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />

        <input
          value={value || ''}
          placeholder="Theme default"
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs uppercase text-slate-700 outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Use theme default"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left"
    >
      <span>
        <span className="block text-xs font-semibold text-slate-700">
          {label}
        </span>

        {description && (
          <span className="mt-1 block text-[11px] leading-4 text-slate-400">
            {description}
          </span>
        )}
      </span>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

function Accordion({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 py-1 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          {Icon && <Icon size={15} />}
          {title}
        </span>

        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function ListEditor({
  title,
  items = [],
  onChange,
  createItem,
  renderItem,
  addLabel = 'Add item',
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const updateItem = (index, changes) => {
    onChange(
      safeItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...changes }
          : item
      )
    );
  };

  const removeItem = (index) => {
    onChange(
      safeItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addItem = () => {
    onChange([
      ...safeItems,
      createItem(),
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">
          {title}
        </p>

        <span className="text-[10px] text-slate-400">
          {safeItems.length} items
        </span>
      </div>

      {safeItems.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <GripVertical size={14} />
              Item {index + 1}
            </span>

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              title="Remove item"
            >
              <X size={15} />
            </button>
          </div>

          {renderItem(item, (changes) => updateItem(index, changes))}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    </div>
  );
}

export default function SectionInspector({
  section,
  onUpdateSection = () => {},
  onRemoveSection = () => {},
  onDuplicateSection = () => {},
}) {
  const settings = section?.settings || {};

  if (!section) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Settings2 size={24} />
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-800">
          Select a section
        </h3>

        <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-400">
          Select a section on your storefront canvas or from the layers panel to edit its settings.
        </p>
      </div>
    );
  }

  const type = section.type;

  const label = SECTION_LABELS[type] || type;

  const update = (key, value) => {
    onUpdateSection(section.id, key, value);
  };

  const hasTitle = [
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
  ].includes(type);

  const hasSubtitle = [
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
    'contact',
  ].includes(type);

  const hasDescription = [
    'about',
    'image_text',
    'contact',
  ].includes(type);

  const hasButton = [
    'hero',
    'booking',
    'contact',
  ].includes(type);

  const hasImage = [
    'hero',
    'about',
    'image_text',
  ].includes(type);

  const hasLimit = [
    'portfolio_grid',
    'featured_projects',
    'services',
    'featured_services',
    'service_packages',
    'featured_products',
    'product_grid',
  ].includes(type);

  const showAlignment = [
    'hero',
  ].includes(type);

  return (
    <div className="space-y-5 pb-6">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <LayoutGrid size={18} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-900">
              {label}
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Section settings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => update('visible', section.visible === false)}
          title={section.visible === false ? 'Show section' : 'Hide section'}
          className={`rounded-xl p-2 transition ${
            section.visible === false
              ? 'bg-slate-100 text-slate-400'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {section.visible === false ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>

      {/* QUICK ACTIONS */}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onDuplicateSection(section)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-slate-600 transition hover:bg-slate-50"
        >
          <Copy size={16} />
          <span className="text-[10px] font-semibold">
            Duplicate
          </span>
        </button>

        <button
          type="button"
          onClick={() => update('visible', section.visible === false)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-slate-600 transition hover:bg-slate-50"
        >
          {section.visible === false ? (
            <Eye size={16} />
          ) : (
            <EyeOff size={16} />
          )}

          <span className="text-[10px] font-semibold">
            {section.visible === false ? 'Show' : 'Hide'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onRemoveSection(section.id)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-red-100 px-2 py-3 text-red-500 transition hover:bg-red-50"
        >
          <Trash2 size={16} />
          <span className="text-[10px] font-semibold">
            Delete
          </span>
        </button>
      </div>

      {/* CONTENT */}

      <Accordion
        title="Content"
        icon={Type}
      >
        {hasTitle && (
          <Field
            label="Section title"
            value={settings.title}
            placeholder="Enter a title"
            onChange={(value) => update('title', value)}
          />
        )}

        {type === 'hero' && (
          <Field
            label="Eyebrow text"
            value={settings.eyebrow}
            placeholder="A short introductory label"
            onChange={(value) => update('eyebrow', value)}
          />
        )}

        {hasSubtitle && (
          <TextArea
            label="Subtitle"
            value={settings.subtitle}
            placeholder="Add a short supporting message..."
            rows={3}
            onChange={(value) => update('subtitle', value)}
          />
        )}

        {hasDescription && (
          <TextArea
            label="Description"
            value={settings.description}
            placeholder="Describe your business..."
            rows={5}
            onChange={(value) => update('description', value)}
          />
        )}

        {['rich_text', 'custom_content'].includes(type) && (
          <TextArea
            label="Main content"
            value={settings.content}
            placeholder="Write your section content..."
            rows={7}
            onChange={(value) => update('content', value)}
          />
        )}

        {type === 'announcement' && (
          <TextArea
            label="Announcement text"
            value={settings.text}
            placeholder="Write your announcement..."
            rows={3}
            onChange={(value) => update('text', value)}
          />
        )}

        {type === 'footer' && (
          <TextArea
            label="Footer text"
            value={settings.text}
            placeholder="Your business name or footer message"
            rows={3}
            onChange={(value) => update('text', value)}
          />
        )}

        {hasButton && (
          <>
            <Field
              label="Button text"
              value={settings.buttonText}
              placeholder="Get started"
              onChange={(value) => update('buttonText', value)}
            />

            {type === 'hero' && (
              <Field
                label="Button destination"
                value={settings.buttonLink}
                placeholder="/contact or https://example.com"
                onChange={(value) => update('buttonLink', value)}
                hint="Use a page path or a complete external URL."
              />
            )}
          </>
        )}

        {type === 'contact' && (
          <Field
            label="Button destination"
            value={settings.buttonLink}
            placeholder="https://wa.me/..."
            onChange={(value) => update('buttonLink', value)}
            hint="This is stored as a section setting; the current contact renderer may not use it yet."
          />
        )}
      </Accordion>

      {/* MEDIA */}

      {hasImage && (
        <Accordion
          title="Images"
          icon={ImageIcon}
        >
          {type === 'hero' && (
            <Field
              label="Hero background image URL"
              value={settings.backgroundImage}
              placeholder="https://..."
              onChange={(value) => update('backgroundImage', value)}
              hint="The renderer uses this as the hero background."
            />
          )}

          {type !== 'hero' && (
            <Field
              label="Image URL"
              value={settings.image}
              placeholder="https://..."
              onChange={(value) => update('image', value)}
            />
          )}

          {type === 'hero' && (
            <Field
              label="Fallback image URL"
              value={settings.image}
              placeholder="https://..."
              onChange={(value) => update('image', value)}
            />
          )}

          <div className="rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">
            Permanent image uploads and media-library selection will be connected separately. These fields currently accept image URLs.
          </div>
        </Accordion>
      )}

      {type === 'gallery' && (
        <Accordion
          title="Gallery images"
          icon={ImageIcon}
        >
          <ListEditor
            title="Images"
            items={settings.images || []}
            onChange={(value) => update('images', value)}
            createItem={() => ({
              url: '',
              alt: '',
            })}
            addLabel="Add gallery image"
            renderItem={(item, setItem) => {
              const image = typeof item === 'string'
                ? { url: item, alt: '' }
                : item || {};

              return (
                <div className="space-y-3">
                  <Field
                    label="Image URL"
                    value={image.url}
                    placeholder="https://..."
                    onChange={(value) => setItem({ url: value })}
                  />

                  <Field
                    label="Alt text"
                    value={image.alt}
                    placeholder="Describe the image"
                    onChange={(value) => setItem({ alt: value })}
                  />
                </div>
              );
            }}
          />
        </Accordion>
      )}

      {/* LAYOUT */}

      <Accordion
        title="Layout"
        icon={LayoutGrid}
      >
        {type === 'navigation' && (
  <>
    <Select
      label="Navigation alignment"
      value={settings.alignment || 'left'}
      onChange={(value) => update('alignment', value)}
      options={ALIGNMENT_OPTIONS}
    />

    <Select
      label="Link style"
      value={settings.linkStyle || 'plain'}
      onChange={(value) => update('linkStyle', value)}
      options={NAVIGATION_STYLE_OPTIONS}
    />
  </>
)}
        {showAlignment && (
          <Select
            label="Content alignment"
            value={settings.alignment || 'center'}
            onChange={(value) => update('alignment', value)}
            options={ALIGNMENT_OPTIONS}
          />
        )}

        {type === 'hero' && (
          <Select
            label="Hero height"
            value={settings.height || 'large'}
            onChange={(value) => update('height', value)}
            options={HEIGHT_OPTIONS}
          />
        )}

        {hasLimit && (
          <Field
            label="Items to display"
            type="number"
            min="1"
            max="100"
            value={settings.limit ?? 6}
            onChange={(value) =>
              update(
                'limit',
                Math.max(1, Math.min(100, Number(value) || 1))
              )
            }
          />
        )}

        {type === 'faq' && (
          <p className="text-[11px] leading-5 text-slate-400">
            Add questions and answers below. The storefront displays them as expandable items.
          </p>
        )}
      </Accordion>

      {/* FAQ */}

      {type === 'faq' && (
        <Accordion
          title="Questions and answers"
          icon={Type}
        >
          <ListEditor
            title="FAQ items"
            items={settings.items || []}
            onChange={(value) => update('items', value)}
            createItem={() => ({
              question: '',
              answer: '',
            })}
            addLabel="Add question"
            renderItem={(item, setItem) => (
              <div className="space-y-3">
                <Field
                  label="Question"
                  value={item.question || item.title || ''}
                  placeholder="Enter a question"
                  onChange={(value) => setItem({ question: value })}
                />

                <TextArea
                  label="Answer"
                  value={item.answer || item.description || ''}
                  placeholder="Write the answer..."
                  rows={3}
                  onChange={(value) => setItem({ answer: value })}
                />
              </div>
            )}
          />
        </Accordion>
      )}

      {/* SOCIAL LINKS */}

      {type === 'social_links' && (
        <Accordion
          title="Social links"
          icon={Type}
        >
          <ListEditor
            title="Links"
            items={settings.links || []}
            onChange={(value) => update('links', value)}
            createItem={() => ({
              label: '',
              platform: '',
              url: '',
            })}
            addLabel="Add social link"
            renderItem={(item, setItem) => (
              <div className="space-y-3">
                <Field
                  label="Platform"
                  value={item.platform}
                  placeholder="Instagram"
                  onChange={(value) => setItem({ platform: value })}
                />

                <Field
                  label="Display label"
                  value={item.label}
                  placeholder="Follow us"
                  onChange={(value) => setItem({ label: value })}
                />

                <Field
                  label="URL"
                  value={item.url}
                  placeholder="https://..."
                  onChange={(value) => setItem({ url: value })}
                />
              </div>
            )}
          />
        </Accordion>
      )}

      {/* BACKGROUND */}

      <Accordion
        title="Section appearance"
        icon={Palette}
      >
        <ColorField
          label="Background colour"
          value={settings.backgroundColor}
          onChange={(value) => update('backgroundColor', value)}
        />

         {type === 'navigation' && (
  <ColorField
    label="Link text colour"
    value={settings.textColor}
    onChange={(value) => update('textColor', value)}
  />
)}


        <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
          Background colour is stored in section settings. The current storefront renderer does not yet apply this property to every section type.
        </div>
      </Accordion>

     
      {/* VISIBILITY */}

      <Accordion
        title="Visibility"
        icon={Eye}
      >
        <Toggle
          label="Show this section"
          description="Hidden sections remain saved in your editor."
          checked={section.visible !== false}
          onChange={(value) => update('visible', value)}
        />
      </Accordion>
    </div>
  );
}
