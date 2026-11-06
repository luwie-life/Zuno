import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import {
  normalizeHexColor,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  getContrastRatio,
  getContrastLabel,
} from '../../lib/storefront.js';

const COLOR_ROLES = [
  { key: 'primaryColor', label: 'Primary', description: 'Main brand colour' },
  { key: 'secondaryColor', label: 'Secondary', description: 'Supporting colour' },
  { key: 'accentColor', label: 'Accent', description: 'Highlights and emphasis' },
  { key: 'backgroundColor', label: 'Background', description: 'Main page background' },
  { key: 'surfaceColor', label: 'Surface', description: 'Cards and containers' },
  { key: 'textColor', label: 'Text', description: 'Main text colour' },
  { key: 'mutedColor', label: 'Muted', description: 'Secondary text' },
  { key: 'borderColor', label: 'Border', description: 'Dividers and outlines' },
];

const PRESET_PALETTES = [
  {
    name: 'Zuno Green',
    colors: [
      '#0B3D2E', '#DCEBE4', '#C58B55', '#FFFFFF',
      '#F5F8F6', '#17211D', '#718078', '#E3EAE5',
    ],
  },
  {
    name: 'Warm Minimal',
    colors: [
      '#76513B', '#E9DCCF', '#C58B55', '#FFFCF8',
      '#F7F0E8', '#302820', '#8A796B', '#E9DED3',
    ],
  },
  {
    name: 'Modern Blue',
    colors: [
      '#2457A6', '#DCE8FA', '#42A5C5', '#FFFFFF',
      '#F3F7FD', '#17243A', '#71819A', '#DFE6F0',
    ],
  },
  {
    name: 'Soft Lavender',
    colors: [
      '#7056A8', '#E8E0F5', '#C49BCF', '#FFFFFF',
      '#F8F5FC', '#292334', '#81778E', '#E9E3EF',
    ],
  },
  {
    name: 'Earth & Olive',
    colors: [
      '#59633B', '#E4E5D5', '#B77B4B', '#FBFAF5',
      '#F1F0E7', '#292D22', '#777B68', '#E3E2D8',
    ],
  },
  {
    name: 'Monochrome',
    colors: [
      '#171717', '#E5E5E5', '#737373', '#FFFFFF',
      '#F5F5F5', '#171717', '#737373', '#E5E5E5',
    ],
  },
];

const DEFAULT_THEME = {
  primaryColor: '#0B3D2E',
  secondaryColor: '#DCEBE4',
  accentColor: '#C58B55',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F5F8F6',
  textColor: '#17211D',
  mutedColor: '#718078',
  borderColor: '#E3EAE5',
  borderRadius: 'medium',
  buttonStyle: 'rounded',
};

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ColorSwatch({ color, onClick, selected = false, title }) {
  return (
    <button
      type="button"
      title={title || color}
      onClick={onClick}
      className={`group relative h-9 w-9 shrink-0 rounded-xl border transition hover:scale-105 ${
        selected
          ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
          : 'border-slate-200'
      }`}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          size={15}
          className="absolute inset-0 m-auto text-white drop-shadow"
        />
      )}
    </button>
  );
}

export default function ColorStudio({
  theme = {},
  onUpdate = () => {},
}) {
  const [activeRole, setActiveRole] = useState('primaryColor');
  const [hexDraft, setHexDraft] = useState('');
  const [rgbDraft, setRgbDraft] = useState(null);
  const [hslDraft, setHslDraft] = useState(null);
  const [paletteName, setPaletteName] = useState('');

  const currentTheme = useMemo(
    () => ({ ...DEFAULT_THEME, ...theme }),
    [theme]
  );

  const activeColor = normalizeHexColor(
    currentTheme[activeRole],
    '#0B3D2E'
  );

  const rgb = hexToRgb(activeColor);
  const hsl = hexToHsl(activeColor);

  const recentColors = Array.isArray(theme.recentColors)
    ? theme.recentColors
    : [];

  const savedColors = Array.isArray(theme.palette)
    ? theme.palette
    : [];

  const updateColor = (key, value) => {
    const normalized = normalizeHexColor(value, '');

    if (!normalized) return;

    onUpdate(key, normalized);

    const nextRecent = [
      {
        id: `color-${normalized.replace('#', '')}`,
        name: normalized,
        color: normalized,
      },
      ...recentColors.filter(
        (item) => normalizeHexColor(item.color, '') !== normalized
      ),
    ].slice(0, 20);

    onUpdate('recentColors', nextRecent);
  };

  const updateActiveColor = (value) => {
    updateColor(activeRole, value);
  };

  const applyPalette = (palette) => {
    COLOR_ROLES.forEach((role, index) => {
      onUpdate(role.key, palette.colors[index]);
    });
  };

  const addSavedColor = () => {
    const exists = savedColors.some(
      (item) =>
        normalizeHexColor(item.color, '') === activeColor
    );

    if (exists) return;

    onUpdate('palette', [
      ...savedColors,
      {
        id: `saved-${Date.now()}`,
        name: paletteName.trim() || activeColor,
        color: activeColor,
      },
    ]);

    setPaletteName('');
  };

  const removeSavedColor = (id) => {
    onUpdate(
      'palette',
      savedColors.filter((item) => item.id !== id)
    );
  };

  const updateRgb = (key, value) => {
    const next = {
      ...rgb,
      [key]: Math.max(0, Math.min(255, Number(value) || 0)),
    };

    setRgbDraft(next);
    updateActiveColor(rgbToHex(next.r, next.g, next.b));
  };

  const updateHsl = (key, value) => {
    const next = {
      ...hsl,
      [key]: Number(value),
    };

    setHslDraft(next);
    updateActiveColor(hslToHex(next.h, next.s, next.l));
  };

  const contrast = getContrastRatio(
    currentTheme.textColor,
    currentTheme.backgroundColor
  );

  const contrastLabel = getContrastLabel(contrast);

  const radiusOptions = [
    { value: 'none', label: 'None' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'full', label: 'Full' },
  ];

  const buttonOptions = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'pill', label: 'Pill' },
  ];

  const radiusMap = {
    none: '0px',
    small: '6px',
    medium: '12px',
    large: '20px',
    full: '999px',
  };

  const buttonRadiusMap = {
    square: '4px',
    rounded: '12px',
    pill: '999px',
  };

  return (
    <div className="space-y-7 pb-8">

      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
            <Palette size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Color Studio
            </h2>
            <p className="text-xs text-slate-500">
              Build and manage your brand identity.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {COLOR_ROLES.map((role) => (
            <ColorSwatch
              key={role.key}
              color={currentTheme[role.key]}
              selected={activeRole === role.key}
              title={role.label}
              onClick={() => {
                setActiveRole(role.key);
                setHexDraft('');
                setRgbDraft(null);
                setHslDraft(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* ACTIVE COLOR EDITOR */}
      <section className="space-y-4">
        <SectionHeading
          title="Edit colour"
          description="Choose a brand colour and fine-tune its values."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeColor}
              onChange={(event) => {
                updateActiveColor(event.target.value);
                setHexDraft(event.target.value.toUpperCase());
              }}
              className="h-16 w-16 cursor-pointer rounded-xl border-0 bg-transparent p-0"
              aria-label="Choose colour"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">
                {COLOR_ROLES.find((role) => role.key === activeRole)?.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {COLOR_ROLES.find((role) => role.key === activeRole)?.description}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <input
                  value={hexDraft || activeColor}
                  onChange={(event) => setHexDraft(event.target.value)}
                  onBlur={() => {
                    const parsed = normalizeHexColor(hexDraft, '');

                    if (parsed) {
                      updateActiveColor(parsed);
                      setHexDraft(parsed);
                    } else {
                      setHexDraft(activeColor);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-700"
                  maxLength={7}
                  aria-label="HEX colour value"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(activeColor);
                    }
                  }}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                  title="Copy HEX"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold text-slate-700">
              RGB values
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['r', 'g', 'b'].map((key) => (
                <label key={key} className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {key}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgbDraft?.[key] ?? rgb[key]}
                    onChange={(event) => updateRgb(key, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold text-slate-700">
              HSL values
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['h', 'Hue', 360],
                ['s', 'Saturation', 100],
                ['l', 'Lightness', 100],
              ].map(([key, label, max]) => (
                <label key={key} className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={max}
                    value={hslDraft?.[key] ?? hsl[key]}
                    onChange={(event) => updateHsl(key, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRAND PALETTES */}
      <section className="space-y-3">
        <SectionHeading
          title="Brand palettes"
          description="Apply a coordinated colour system to your storefront."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRESET_PALETTES.map((palette) => (
            <button
              key={palette.name}
              type="button"
              onClick={() => applyPalette(palette)}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-700 hover:shadow-sm"
            >
              <div className="flex gap-1.5">
                {palette.colors.map((color, index) => (
                  <span
                    key={`${palette.name}-${index}`}
                    className="h-7 min-w-0 flex-1 rounded-md border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {palette.name}
                </span>
                <span className="text-[10px] font-semibold text-emerald-800">
                  Apply
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* SAVED COLOURS */}
      <section className="space-y-3">
        <SectionHeading
          title="Saved colours"
          description="Keep your frequently used colours within reach."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            {savedColors.map((item) => (
              <div key={item.id} className="group relative">
                <ColorSwatch
                  color={item.color}
                  title={item.name}
                  onClick={() => updateActiveColor(item.color)}
                />

                <button
                  type="button"
                  onClick={() => removeSavedColor(item.id)}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white group-hover:flex"
                  title="Remove saved colour"
                >
                  ×
                </button>
              </div>
            ))}

            {savedColors.length === 0 && (
              <p className="text-xs text-slate-400">
                Your saved colours will appear here.
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={paletteName}
              onChange={(event) => setPaletteName(event.target.value)}
              placeholder="Name this colour (optional)"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-emerald-700"
            />

            <button
              type="button"
              onClick={addSavedColor}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
            >
              <Plus size={14} />
              Save
            </button>
          </div>
        </div>
      </section>

      {/* RECENT COLOURS */}
      <section className="space-y-3">
        <SectionHeading
          title="Recently used"
          description="Your latest colour selections."
        />

        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          {recentColors.length > 0 ? (
            recentColors.map((item) => (
              <ColorSwatch
                key={item.id}
                color={item.color}
                title={item.color}
                onClick={() => updateActiveColor(item.color)}
              />
            ))
          ) : (
            <p className="text-xs text-slate-400">
              Colours you use will appear here.
            </p>
          )}
        </div>
      </section>

      {/* THEME SHAPE */}
      <section className="space-y-3">
        <SectionHeading
          title="Shape and buttons"
          description="Set the visual character of your storefront."
        />

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <p className="mb-3 text-xs font-bold text-slate-700">
              General border radius
            </p>

            <div className="grid grid-cols-5 gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdate('borderRadius', option.value)}
                  className={`rounded-xl border px-1 py-2 text-[10px] font-semibold ${
                    currentTheme.borderRadius === option.value
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold text-slate-700">
              Button style
            </p>

            <div className="grid grid-cols-3 gap-2">
              {buttonOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdate('buttonStyle', option.value)}
                  className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
                    currentTheme.buttonStyle === option.value
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: currentTheme.surfaceColor,
              borderColor: currentTheme.borderColor,
              borderRadius: radiusMap[currentTheme.borderRadius] || '12px',
            }}
          >
            <p
              className="text-sm font-bold"
              style={{ color: currentTheme.textColor }}
            >
              Preview your brand
            </p>

            <p
              className="mt-1 text-xs"
              style={{ color: currentTheme.mutedColor }}
            >
              This is how your theme colours work together.
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2.5 text-xs font-bold text-white"
              style={{
                backgroundColor: currentTheme.primaryColor,
                borderRadius:
                  buttonRadiusMap[currentTheme.buttonStyle] || '12px',
              }}
            >
              Example button
            </button>
          </div>
        </div>
      </section>

      {/* CONTRAST */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-800" />
          <h3 className="text-sm font-bold text-slate-900">
            Accessibility check
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-700">
              Text/background contrast
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on your current text and background colours.
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              {contrast}:1
            </p>
            <span
              className={`text-[10px] font-bold ${
                contrast >= 4.5 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {contrastLabel}
            </span>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border p-4"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            borderColor: currentTheme.borderColor,
            color: currentTheme.textColor,
          }}
        >
          <p className="text-sm font-bold">Sample storefront text</p>
          <p
            className="mt-1 text-xs"
            style={{ color: currentTheme.mutedColor }}
          >
            Check how readable your selected colours are.
          </p>
        </div>
      </section>

      {/* RESET */}
      <button
        type="button"
        onClick={() => {
          Object.entries(DEFAULT_THEME).forEach(([key, value]) => {
            if (COLOR_ROLES.some((role) => role.key === key)) {
              onUpdate(key, value);
            }
          });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        <RotateCcw size={14} />
        Reset brand colours
      </button>
    </div>
  );
}
