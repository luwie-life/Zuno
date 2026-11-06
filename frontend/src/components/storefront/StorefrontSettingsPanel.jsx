import { useMemo, useState } from 'react';
import {
  Store,
  Contact,
  Search,
  Share2,
  Globe,
  Save,
  Image as ImageIcon,
  ExternalLink,
  Check,
} from 'lucide-react';

const TABS = [
  { id: 'identity', label: 'Identity', icon: Store },
  { id: 'contact', label: 'Contact', icon: Contact },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'domain', label: 'Domain', icon: Globe },
];

const SOCIAL_PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  'pinterest',
  'threads',
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  type = 'text',
  hint,
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>

      {multiline ? (
        <textarea
          rows={4}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}

      {hint && (
        <span className="mt-1.5 block text-xs text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function StorefrontSettingsPanel({
  storefront,
  onUpdate,
  business = {},
  onClose,
  mobile = false,
}) {
  const [activeTab, setActiveTab] = useState('identity');

  const config = storefront || {};
  const identity = config.identity || {};
  const contact = config.contact || {};
  const seo = config.seo || {};
  const socialLinks = config.socialLinks || {};
  const domain = config.domain || {};

  const displayName =
    identity.displayName || business.name || 'Your business';

  const hostname = useMemo(() => {
    return domain.hostname || '';
  }, [domain.hostname]);

  const updateGroup = (group, key, value) => {
    if (!onUpdate) return;

    onUpdate({
      ...config,
      [group]: {
        ...(config[group] || {}),
        [key]: value,
      },
    });
  };

  const updateIdentity = (key, value) =>
    updateGroup('identity', key, value);

  const updateContact = (key, value) =>
    updateGroup('contact', key, value);

  const updateSEO = (key, value) =>
    updateGroup('seo', key, value);

  const updateSocial = (key, value) =>
    updateGroup('socialLinks', key, value);

  const updateDomain = (key, value) =>
    updateGroup('domain', key, value);

  const handleKeywords = (value) => {
    updateSEO(
      'keywords',
      value.split(',').map((item) => item.trim()).filter(Boolean)
    );
  };

  const renderIdentity = () => (
    <div className="space-y-5">
      <SectionHeading
        title="Store identity"
        description="Control how your business appears across your storefront."
      />

      <TextField
        label="Store name"
        value={identity.displayName || ''}
        placeholder={business.name || 'Your store name'}
        onChange={(value) => updateIdentity('displayName', value)}
      />

      <TextField
        label="Tagline"
        value={identity.tagline || ''}
        placeholder="A short statement about your business"
        onChange={(value) => updateIdentity('tagline', value)}
      />

      <TextField
        label="Store description"
        value={identity.description || ''}
        placeholder="Tell customers what your business offers."
        multiline
        onChange={(value) => updateIdentity('description', value)}
      />

      <TextField
        label="Logo URL"
        value={identity.logo || ''}
        placeholder="https://..."
        onChange={(value) => updateIdentity('logo', value)}
        hint="Media uploads will be connected through the media library phase."
      />

      {identity.logo && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <img
            src={identity.logo}
            alt="Store logo preview"
            className="h-14 w-14 rounded-lg border border-slate-100 object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">
              Logo preview
            </p>
            <p className="truncate text-xs text-slate-400">
              {identity.logo}
            </p>
          </div>
        </div>
      )}

      <TextField
        label="Favicon URL"
        value={identity.favicon || ''}
        placeholder="https://..."
        onChange={(value) => updateIdentity('favicon', value)}
      />

      <TextField
        label="Announcement bar"
        value={identity.announcement || ''}
        placeholder="Add a message for your visitors"
        onChange={(value) => updateIdentity('announcement', value)}
      />
    </div>
  );

  const renderContact = () => (
    <div className="space-y-5">
      <SectionHeading
        title="Contact information"
        description="Help customers reach your business."
      />

      <TextField
        label="Business email"
        type="email"
        value={contact.email || ''}
        placeholder="hello@example.com"
        onChange={(value) => updateContact('email', value)}
      />

      <TextField
        label="Phone number"
        value={contact.phone || ''}
        placeholder="+234..."
        onChange={(value) => updateContact('phone', value)}
      />

      <TextField
        label="WhatsApp number"
        value={contact.whatsapp || ''}
        placeholder="234..."
        onChange={(value) => updateContact('whatsapp', value)}
      />

      <TextField
        label="Business address"
        value={contact.address || ''}
        placeholder="Street address"
        onChange={(value) => updateContact('address', value)}
      />

      <TextField
        label="City"
        value={contact.city || ''}
        placeholder="Lagos"
        onChange={(value) => updateContact('city', value)}
      />

      <TextField
        label="Country"
        value={contact.country || ''}
        placeholder="Nigeria"
        onChange={(value) => updateContact('country', value)}
      />
    </div>
  );

  const renderSEO = () => {
    const keywords = Array.isArray(seo.keywords)
      ? seo.keywords.join(', ')
      : seo.keywords || '';

    return (
      <div className="space-y-5">
        <SectionHeading
          title="Search engine optimization"
          description="Control how your storefront appears in search results and social previews."
        />

        <TextField
          label="SEO page title"
          value={seo.title || ''}
          placeholder={displayName}
          onChange={(value) => updateSEO('title', value)}
        />

        <TextField
          label="Meta description"
          value={seo.description || ''}
          placeholder="Describe your business in a few sentences."
          multiline
          onChange={(value) => updateSEO('description', value)}
        />

        <TextField
          label="Keywords"
          value={keywords}
          placeholder="fashion, clothing, accessories"
          onChange={handleKeywords}
          hint="Separate keywords with commas."
        />

        <TextField
          label="Social sharing image URL"
          value={seo.ogImage || ''}
          placeholder="https://..."
          onChange={(value) => updateSEO('ogImage', value)}
        />

        <Toggle
          label="Hide from search engines"
          description="Adds a no-index preference to this storefront's SEO settings."
          checked={Boolean(seo.noIndex)}
          onChange={(value) => updateSEO('noIndex', value)}
        />

        <div className="rounded-xl bg-amber-50 p-3.5 text-xs leading-5 text-amber-800">
          These are editor settings. Search engine metadata will only take
          effect once the public storefront renderer outputs the corresponding
          metadata.
        </div>
      </div>
    );
  };

  const renderSocial = () => (
    <div className="space-y-5">
      <SectionHeading
        title="Social media"
        description="Connect your business profiles to your storefront."
      />

      {SOCIAL_PLATFORMS.map((platform) => (
        <TextField
          key={platform}
          label={platform === 'x' ? 'X profile URL' : `${platform[0].toUpperCase()}${platform.slice(1)} URL`}
          value={socialLinks[platform] || ''}
          placeholder={`https://${platform}.com/yourbusiness`}
          onChange={(value) => updateSocial(platform, value)}
        />
      ))}
    </div>
  );

  const renderDomain = () => (
    <div className="space-y-5">
      <SectionHeading
        title="Store domain"
        description="Manage the address customers use to visit your storefront."
      />

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-emerald-700" />
          <p className="text-sm font-bold text-emerald-900">
            Zuno storefront address
          </p>
        </div>

        <p className="mt-2 break-all text-sm text-emerald-800">
          {domain.zunoUrl || business.storefrontUrl || 'Your Zuno store URL will appear here.'}
        </p>
      </div>

      <TextField
        label="Custom domain"
        value={hostname}
        placeholder="www.yourbusiness.com"
        onChange={(value) => updateDomain('hostname', value)}
        hint="Saving a hostname here does not connect or verify the domain."
      />

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-800">
          Domain connection
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Custom-domain connection, DNS instructions, SSL verification and
          domain status will be implemented in the backend domain phase.
        </p>

        <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Connection not verified
        </span>
      </div>
    </div>
  );

  const content = {
    identity: renderIdentity,
    contact: renderContact,
    seo: renderSEO,
    social: renderSocial,
    domain: renderDomain,
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Store settings
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Manage your business presence
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close settings"
          >
            <ExternalLink size={17} />
          </button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mx-auto max-w-2xl">
          {content[activeTab]()}
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Changes are applied to the editor state.
          </p>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <Check size={14} />
            Auto-updated
          </span>
        </div>
      </div>
    </div>
  );
}
