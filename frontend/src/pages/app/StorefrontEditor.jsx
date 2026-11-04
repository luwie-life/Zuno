import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  Layout,
  FileText,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  createDefaultPage,
  createSection,
  getAvailableSectionTypes,
  normalizeStorefrontConfig,
} from '../../lib/storefront.js';

const SECTION_LABELS = {
  announcement: 'Announcement bar',
  navigation: 'Navigation',
  hero: 'Hero banner',
  about: 'About business',
  image_text: 'Image and text',
  rich_text: 'Text content',
  gallery: 'Image gallery',
  portfolio_grid: 'Portfolio projects',
  featured_projects: 'Featured projects',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking call-to-action',
  featured_products: 'Featured products',
  product_grid: 'Product catalogue',
  categories: 'Product categories',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'Frequently asked questions',
  contact: 'Contact section',
  social_links: 'Social links',
  custom_content: 'Custom content',
  footer: 'Footer',
};

function SectionSettingsEditor({ section, onChange }) {
  const [value, setValue] = useState(
    JSON.stringify(section.settings || {}, null, 2)
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(JSON.stringify(section.settings || {}, null, 2));
    setError('');
  }, [section.id]);

  const apply = () => {
    try {
      const parsed = JSON.parse(value);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Settings must be a JSON object.');
      }

      onChange(parsed);
      setError('');
    } catch (err) {
      setError(err.message || 'Invalid JSON settings.');
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Section settings</p>
          <p className="mt-1 text-xs text-muted">
            Edit the content and appearance of this section.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={apply}
        >
          Apply changes
        </button>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        rows={9}
        className="mt-3 w-full rounded-xl border border-line bg-white p-3 font-mono text-xs leading-6 text-ink outline-none focus:border-forest"
      />

      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}

      <p className="mt-2 text-xs text-muted">
        Changes are applied to this section. Remember to save the storefront.
      </p>
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
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showPageForm, setShowPageForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const availableSections = useMemo(
    () => getAvailableSectionTypes(businessType),
    [businessType]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

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
        setActivePageId(config.pages[0]?.id || '');
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load storefront settings.');
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

  const pages = storefront.pages || [];

  const activePage =
    pages.find((page) => page.id === activePageId) ||
    pages.find((page) => page.isHome) ||
    pages[0];

  const activeSection = activePage?.sections?.find(
    (section) => section.id === activeSectionId
  );

  const updatePage = (pageId, changes) => {
    setStorefront((current) => ({
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

  const addPage = () => {
    const title = newPageTitle.trim();

    if (!title) {
      setError('Enter a page name first.');
      return;
    }

    if (pages.length >= 20) {
      setError('A storefront can have a maximum of 20 pages.');
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug || slug === 'home' || pages.some((page) => page.slug === slug)) {
      setError('This page name is unavailable. Choose another name.');
      return;
    }

    const page = createDefaultPage({
      title,
      slug,
      isHome: false,
      sections: [],
    });

    setStorefront((current) => ({
      ...current,
      pages: [...current.pages, page],
      activePage: page.slug,
    }));

    setActivePageId(page.id);
    setActiveSectionId('');
    setNewPageTitle('');
    setShowPageForm(false);
    setError('');
    setNotice('Page added. Save your storefront to publish the change.');
  };

  const deletePage = (page) => {
    if (page.isHome) {
      setError('The homepage cannot be deleted.');
      return;
    }

    if (!window.confirm(`Delete the "${page.title}" page?`)) return;

    const nextPages = pages.filter((item) => item.id !== page.id);

    setStorefront((current) => ({
      ...current,
      pages: nextPages,
      activePage: nextPages[0]?.slug || 'home',
    }));

    setActivePageId(nextPages[0]?.id || '');
    setActiveSectionId('');
    setError('');
    setNotice('Page removed. Save your storefront to apply the change.');
  };

  const addSection = (type) => {
    if (!activePage) return;

    const section = createSection(type, {
      title: SECTION_LABELS[type] || 'New section',
    });

    updatePage(activePage.id, {
      sections: [...activePage.sections, section],
    });

    setActiveSectionId(section.id);
    setError('');
    setNotice('Section added. Configure it and save your storefront.');
  };

  const moveSection = (index, direction) => {
    if (!activePage) return;

    const next = [...activePage.sections];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    updatePage(activePage.id, { sections: next });
  };

  const removeSection = (sectionId) => {
    if (!activePage) return;

    updatePage(activePage.id, {
      sections: activePage.sections.filter(
        (section) => section.id !== sectionId
      ),
    });

    if (activeSectionId === sectionId) {
      setActiveSectionId('');
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');

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
      setActivePageId(
        saved.pages.find((page) => page.slug === activePage?.slug)?.id ||
        saved.pages[0]?.id ||
        ''
      );

      await refresh();
      setNotice('Your storefront changes have been saved.');
    } catch (err) {
      setError(err.message || 'Could not save your storefront.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted">Loading storefront editor…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </Link>

          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Storefront editor
          </h1>

          <p className="mt-2 text-sm text-muted">
            Build and organize the pages visitors see when they open your business.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {business.slug && business.storePublished && (
            <a
              href={`${window.location.origin}/store/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <Eye className="mr-2 inline h-4 w-4" />
              Preview store
            </a>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={saving}
          >
            <Save className="mr-2 inline h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-forest/20 bg-forest-50 p-3 text-sm text-forest">
          {notice}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pages</h2>
              <button
                type="button"
                onClick={() => setShowPageForm((value) => !value)}
                className="rounded-lg border border-line p-2 hover:bg-paper"
                aria-label="Add page"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showPageForm && (
              <div className="mt-4 space-y-2">
                <input
                  value={newPageTitle}
                  onChange={(event) => setNewPageTitle(event.target.value)}
                  placeholder="e.g. About us"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-forest"
                />
                <button
                  type="button"
                  onClick={addPage}
                  className="btn-primary w-full"
                >
                  Create page
                </button>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setActivePageId(page.id);
                    setActiveSectionId('');
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    activePage?.id === page.id
                      ? 'border-forest bg-forest-50'
                      : 'border-line hover:bg-paper'
                  }`}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {page.title}
                  </span>
                  {page.isHome && (
                    <span className="text-[10px] font-semibold uppercase text-forest">
                      Home
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activePage && !activePage.isHome && (
            <button
              type="button"
              onClick={() => deletePage(activePage)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 px-4 py-3 text-sm font-medium text-danger hover:bg-danger-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete this page
            </button>
          )}
        </aside>

        <main className="min-w-0 space-y-5">
          {activePage ? (
            <>
              <section className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center gap-3">
                  <Layout className="h-5 w-5 text-forest" />
                  <div>
                    <h2 className="font-semibold">{activePage.title}</h2>
                    <p className="text-xs text-muted">
                      {activePage.isHome
                        ? 'Your main storefront page'
                        : `/${activePage.slug}`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Page title
                    </span>
                    <input
                      value={activePage.title}
                      onChange={(event) =>
                        updatePage(activePage.id, { title: event.target.value })
                      }
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-forest"
                    />
                  </label>

                  <label className="flex items-center gap-2 self-end pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={activePage.visible !== false}
                      onChange={(event) =>
                        updatePage(activePage.id, { visible: event.target.checked })
                      }
                    />
                    Show in navigation
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Page sections</h2>
                    <p className="mt-1 text-xs text-muted">
                      Add sections and arrange them in the order visitors see them.
                    </p>
                  </div>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">
                    {activePage.sections.length} sections
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {activePage.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`rounded-xl border p-4 ${
                        activeSectionId === section.id
                          ? 'border-forest bg-forest-50/40'
                          : 'border-line'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveSectionId(
                            activeSectionId === section.id ? '' : section.id
                          )}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-medium">
                            {SECTION_LABELS[section.type] || section.type}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {section.settings?.title || 'No section title'}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSection(section.id, {
                            visible: section.visible === false,
                          })}
                          className="rounded-lg border border-line p-2"
                          title={section.visible === false ? 'Show section' : 'Hide section'}
                        >
                          {section.visible === false
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />}
                        </button>

                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveSection(index, -1)}
                          className="rounded-lg border border-line p-2 disabled:opacity-30"
                          aria-label="Move section up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={index === activePage.sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                          className="rounded-lg border border-line p-2 disabled:opacity-30"
                          aria-label="Move section down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="rounded-lg border border-danger/20 p-2 text-danger"
                          aria-label="Delete section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {activeSectionId === section.id && (
                        <SectionSettingsEditor
                          section={section}
                          onChange={(settings) =>
                            updateSection(section.id, { settings })
                          }
                        />
                      )}
                    </div>
                  ))}

                  {activePage.sections.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line p-8 text-center">
                      <p className="font-medium">This page is empty</p>
                      <p className="mt-2 text-sm text-muted">
                        Add your first section below.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="font-semibold">Add a section</h2>
                <p className="mt-1 text-xs text-muted">
                  Choose a section that fits this page.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {availableSections.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addSection(type)}
                      className="flex items-center gap-2 rounded-xl border border-line p-3 text-left text-sm transition hover:border-forest hover:bg-forest-50"
                    >
                      <Plus className="h-4 w-4 shrink-0 text-forest" />
                      {SECTION_LABELS[type] || type}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-10 text-center">
              <p className="font-semibold">No page selected</p>
              <p className="mt-2 text-sm text-muted">
                Create a page to start building your storefront.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
