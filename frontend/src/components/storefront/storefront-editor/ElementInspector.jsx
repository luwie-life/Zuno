import { useMemo, useState } from 'react';
import {
  Copy,
  Files,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings2,
  Palette,
  MousePointer2,
  Sparkles,
  Image as ImageIcon,
  Type,
  LayoutGrid,
  Link2,
  RotateCcw,
} from 'lucide-react';

import {
  ACTION_TYPES,
  ANIMATION_PRESETS,
} from '../../../lib/storefront';

const ACTION_LABELS = {
  none: 'No action',
  page: 'Storefront page',
  external: 'External URL',
  whatsapp: 'WhatsApp',
  phone: 'Phone call',
  email: 'Email',
  products: 'Products',
  services: 'Services',
  booking: 'Booking',
  contact: 'Contact',
};

const ANIMATION_LABELS = {
  none: 'None',
  fade: 'Fade',
  fade_up: 'Fade up',
  fade_down: 'Fade down',
  slide_left: 'Slide left',
  slide_right: 'Slide right',
  zoom: 'Zoom',
};

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
];

const OBJECT_FITS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
];

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  min,
  max,
  step,
  suffix,
  hint,
  disabled = false,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <div className="relative">
        <input
          type={type}
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
            suffix ? 'pr-12' : ''
          } ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : ''}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>

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
  hint,
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <textarea
        value={value ?? ''}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />

      {hint && (
        <span className="block text-[11px] leading-4 text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  hint,
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

      {hint && (
        <span className="block text-[11px] leading-4 text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value || '')
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
          value={safeValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={label}
        />

        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Theme default"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs uppercase text-slate-700 outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Use theme default"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
    >
      <span className="min-w-0">
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

function ActionFields({ action, onChange }) {
  const type = action?.type || 'none';

  const destinationActions = [
    'page',
    'external',
    'whatsapp',
    'phone',
    'email',
  ];

  const destinationLabels = {
    page: 'Page slug',
    external: 'Destination URL',
    whatsapp: 'WhatsApp number',
    phone: 'Phone number',
    email: 'Email address',
  };

  const destinationPlaceholders = {
    page: 'about',
    external: 'https://example.com',
    whatsapp: '2348012345678',
    phone: '+2348012345678',
    email: 'hello@example.com',
  };

  return (
    <div className="space-y-4">
      <Select
        label="Action type"
        value={type}
        onChange={(value) => onChange('type', value)}
        options={ACTION_TYPES.map((item) => ({
          value: item,
          label: ACTION_LABELS[item] || item,
        }))}
      />

      {destinationActions.includes(type) && (
        <>
          <Field
            label={destinationLabels[type]}
            value={action?.value || ''}
            placeholder={destinationPlaceholders[type]}
            onChange={(value) => onChange('value', value)}
          />

          {type === 'external' && (
            <Select
              label="Open link in"
              value={action?.target || '_blank'}
              onChange={(value) => onChange('target', value)}
              options={[
                { value: '_blank', label: 'New tab' },
                { value: '_self', label: 'Same tab' },
              ]}
            />
          )}
        </>
      )}

      {['products', 'services', 'booking', 'contact'].includes(type) && (
        <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
          This action will use the corresponding Zuno storefront feature.
          Its final behaviour depends on the renderer and connected business data.
        </div>
      )}
    </div>
  );
}

export default function ElementInspector({
  element,
  onUpdateElement = () => {},
  onRemoveElement = () => {},
  onDuplicateElement = () => {},
  onCopyElement = () => {},
}) {
  const [activeTab, setActiveTab] = useState('content');

  const style = element?.style || {};
  const settings = element?.settings || {};
  const action = element?.action || {};
  const animation = element?.animation || {};

  const elementLabel = useMemo(() => {
    if (!element?.type) return 'Element';

    return element.type
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [element?.type]);

  if (!element) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <MousePointer2 size={24} />
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-800">
          Select an element
        </h3>

        <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-400">
          Select an element on your storefront canvas or from the layers panel to edit its properties.
        </p>
      </div>
    );
  }

  const update = (key, value) => {
    onUpdateElement(element.id, {
      [key]: value,
    });
  };

  const updateStyle = (key, value) => {
    onUpdateElement(element.id, {
      style: {
        ...style,
        [key]: value,
      },
    });
  };

  const updateSettings = (key, value) => {
    onUpdateElement(element.id, {
      settings: {
        ...settings,
        [key]: value,
      },
    });
  };

  const updateAction = (key, value) => {
    onUpdateElement(element.id, {
      action: {
        ...action,
        [key]: value,
      },
    });
  };

  const updateAnimation = (key, value) => {
    onUpdateElement(element.id, {
      animation: {
        ...animation,
        [key]: value,
      },
    });
  };

  const tabs = [
    { id: 'content', label: 'Content', icon: Type },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Settings2 },
  ];

  const hasTextContent = [
    'heading',
    'text',
    'button',
    'icon',
    'booking_button',
  ].includes(element.type);

  const hasMedia = ['image', 'video'].includes(element.type);

  const hasAction = [
    'button',
    'booking_button',
  ].includes(element.type);

  const hasLayoutSettings = [
    'columns',
    'grid',
  ].includes(element.type);

  const hasCollectionSettings = [
    'product_list',
    'service_list',
    'gallery',
  ].includes(element.type);

  return (
    <div className="space-y-5 pb-6">
      {/* ELEMENT HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {hasMedia ? (
              <ImageIcon size={18} />
            ) : (
              <Type size={18} />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-900">
              {elementLabel}
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Element properties
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => update('visible', element.visible === false)}
          className={`rounded-xl p-2 transition ${
            element.visible === false
              ? 'bg-slate-100 text-slate-400'
              : 'bg-emerald-50 text-emerald-700'
          }`}
          title={element.visible === false ? 'Show element' : 'Hide element'}
        >
          {element.visible === false ? (
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
          onClick={() => onCopyElement(element)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Copy size={16} />
          <span className="text-[10px] font-semibold">Copy</span>
        </button>

        <button
          type="button"
          onClick={() => onDuplicateElement(element)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Files size={16} />
          <span className="text-[10px] font-semibold">Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => onRemoveElement(element.id)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-red-100 px-2 py-3 text-red-500 transition hover:border-red-200 hover:bg-red-50"
        >
          <Trash2 size={16} />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* TABS */}

      <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT TAB */}

      {activeTab === 'content' && (
        <div className="space-y-5">
          <SectionHeading
            icon={Type}
            title="Element content"
            description="Edit the information displayed in this element."
          />

          {hasTextContent && (
            <TextArea
              label={
                element.type === 'button' ||
                element.type === 'booking_button'
                  ? 'Button label'
                  : 'Text content'
              }
              value={element.content}
              rows={element.type === 'text' ? 5 : 3}
              placeholder="Enter your content..."
              onChange={(value) => update('content', value)}
            />
          )}

          {hasMedia && (
            <>
              <Field
                label={element.type === 'image' ? 'Image URL' : 'Video URL'}
                value={element.src}
                placeholder="https://..."
                onChange={(value) => update('src', value)}
                hint="Use a publicly accessible HTTPS media URL. Permanent media uploads will be connected separately."
              />

              {element.type === 'image' && (
                <Select
                  label="Image fit"
                  value={style.objectFit || 'cover'}
                  onChange={(value) => updateStyle('objectFit', value)}
                  options={OBJECT_FITS}
                />
              )}
            </>
          )}

          {hasLayoutSettings && (
            <>
              <SectionHeading
                icon={LayoutGrid}
                title="Layout"
                description="Configure the element's internal layout."
              />

              <Select
                label="Number of columns"
                value={String(settings.columns || 2)}
                onChange={(value) => updateSettings('columns', Number(value))}
                options={[1, 2, 3, 4].map((number) => ({
                  value: String(number),
                  label: `${number} ${number === 1 ? 'column' : 'columns'}`,
                }))}
              />
            </>
          )}

          {hasCollectionSettings && (
            <>
              <SectionHeading
                icon={LayoutGrid}
                title="Collection settings"
                description="Control how many items this element displays."
              />

              <Field
                label="Items to display"
                type="number"
                min="1"
                max="100"
                value={settings.limit ?? 6}
                onChange={(value) =>
                  updateSettings('limit', Math.max(1, Math.min(100, Number(value) || 1)))
                }
              />
            </>
          )}

          {!hasTextContent && !hasMedia && !hasLayoutSettings && !hasCollectionSettings && (
            <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              This element does not currently have additional content fields. Its appearance and advanced settings can still be configured.
            </div>
          )}

          {hasAction && (
            <Accordion
              title="Button action"
              icon={Link2}
            >
              <ActionFields
                action={action}
                onChange={updateAction}
              />
            </Accordion>
          )}
        </div>
      )}

      {/* STYLE TAB */}

      {activeTab === 'style' && (
        <div className="space-y-5">
          <SectionHeading
            icon={Palette}
            title="Appearance"
            description="Control colours, typography and element dimensions."
          />

          <Accordion
            title="Colours"
            icon={Palette}
          >
            <ColorField
              label="Text colour"
              value={style.color}
              onChange={(value) => updateStyle('color', value)}
            />

            <ColorField
              label="Background colour"
              value={style.backgroundColor}
              onChange={(value) => updateStyle('backgroundColor', value)}
            />
          </Accordion>

          <Accordion
            title="Typography"
            icon={Type}
          >
            <Field
              label="Font size"
              type="number"
              min="8"
              max="120"
              value={style.fontSize ?? 16}
              suffix="px"
              onChange={(value) =>
                updateStyle(
                  'fontSize',
                  Math.max(8, Math.min(120, Number(value) || 16))
                )
              }
            />

            <Select
              label="Font weight"
              value={style.fontWeight || 'normal'}
              onChange={(value) => updateStyle('fontWeight', value)}
              options={FONT_WEIGHTS}
            />

            <Select
              label="Text alignment"
              value={style.textAlign || 'left'}
              onChange={(value) => updateStyle('textAlign', value)}
              options={ALIGNMENTS}
            />
          </Accordion>

          <Accordion
            title="Dimensions and spacing"
            icon={LayoutGrid}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Width"
                value={style.width || 'auto'}
                placeholder="auto"
                onChange={(value) => updateStyle('width', value)}
                hint="Examples: 100%, 320px"
              />

              <Field
                label="Height"
                value={style.height || 'auto'}
                placeholder="auto"
                onChange={(value) => updateStyle('height', value)}
                hint="Examples: auto, 200px"
              />
            </div>

            <Field
              label="Padding"
              value={style.padding || '0'}
              placeholder="16px"
              onChange={(value) => updateStyle('padding', value)}
              hint="CSS spacing value, e.g. 16px or 12px 20px"
            />

            <Field
              label="Margin"
              value={style.margin || '0'}
              placeholder="0"
              onChange={(value) => updateStyle('margin', value)}
              hint="CSS spacing value, e.g. 12px 0"
            />

            <Field
              label="Border radius"
              value={style.borderRadius || '0'}
              placeholder="12px"
              onChange={(value) => updateStyle('borderRadius', value)}
            />
          </Accordion>

          <Accordion
            title="Image and opacity"
            icon={ImageIcon}
            defaultOpen={false}
          >
            {element.type === 'image' && (
              <Select
                label="Image fit"
                value={style.objectFit || 'cover'}
                onChange={(value) => updateStyle('objectFit', value)}
                options={OBJECT_FITS}
              />
            )}

            <Field
              label="Opacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={style.opacity ?? 1}
              onChange={(value) =>
                updateStyle(
                  'opacity',
                  Math.max(0, Math.min(1, Number(value) || 0))
                )
              }
              hint="0 is transparent; 1 is fully visible."
            />
          </Accordion>
        </div>
      )}

      {/* ADVANCED TAB */}

      {activeTab === 'advanced' && (
        <div className="space-y-5">
          <SectionHeading
            icon={Sparkles}
            title="Advanced settings"
            description="Configure element behaviour and animation."
          />

          <Accordion
            title="Visibility"
            icon={Eye}
          >
            <Toggle
              label="Show element"
              description="Control whether this element appears on the published storefront."
              checked={element.visible !== false}
              onChange={(value) => update('visible', value)}
            />
          </Accordion>

          <Accordion
            title="Interaction"
            icon={MousePointer2}
          >
            <ActionFields
              action={action}
              onChange={updateAction}
            />
          </Accordion>

          <Accordion
            title="Animation"
            icon={Sparkles}
          >
            <Select
              label="Animation preset"
              value={animation.preset || 'none'}
              onChange={(value) => updateAnimation('preset', value)}
              options={ANIMATION_PRESETS.map((preset) => ({
                value: preset,
                label: ANIMATION_LABELS[preset] || preset,
              }))}
            />

            <Select
              label="Animation trigger"
              value={animation.trigger || 'scroll'}
              onChange={(value) => updateAnimation('trigger', value)}
              options={[
                { value: 'load', label: 'On page load' },
                { value: 'scroll', label: 'On scroll' },
                { value: 'hover', label: 'On hover' },
              ]}
            />

            <Field
              label="Duration"
              type="number"
              min="100"
              max="3000"
              step="50"
              value={animation.duration ?? 500}
              suffix="ms"
              onChange={(value) =>
                updateAnimation(
                  'duration',
                  Math.max(100, Math.min(3000, Number(value) || 500))
                )
              }
            />

            <Field
              label="Delay"
              type="number"
              min="0"
              max="5000"
              step="50"
              value={animation.delay ?? 0}
              suffix="ms"
              onChange={(value) =>
                updateAnimation(
                  'delay',
                  Math.max(0, Math.min(5000, Number(value) || 0))
                )
              }
            />
          </Accordion>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-bold text-amber-800">
              Rendering note
            </p>

            <p className="mt-1 text-[11px] leading-5 text-amber-700">
              These controls save values into the storefront element model. The storefront renderer must support each property for it to appear on the live page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
