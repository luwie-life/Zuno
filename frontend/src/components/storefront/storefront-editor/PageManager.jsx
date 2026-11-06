import { useMemo, useState } from 'react';
import {
  Plus,
  FileText,
  Home,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Check,
  Pencil,
  ExternalLink,
  Search,
  X,
  Globe,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const uniqueSlug = (value, pages, currentId = null) => {
  const base = slugify(value) || 'new-page';
  let slug = base;
  let suffix = 2;

  while (
    pages.some(
      (page) => page.id !== currentId && page.slug === slug
    )
  ) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
};

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function PageForm({
  initialPage,
  pages,
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState(initialPage?.title || '');
  const [slug, setSlug] = useState(initialPage?.slug || '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [visible, setVisible] = useState(
    initialPage?.visible !== false
  );

  const [error, setError] = useState('');

  const handleTitleChange = (value) => {
    setTitle(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Enter a page title.');
      return;
    }

    const cleanPageSlug = uniqueSlug(
      slug,
      pages,
      initialPage?.id
    );

    if (!cleanPageSlug) {
      setError('Enter a valid page URL.');
      return;
    }

    onSave({
      title: cleanTitle,
      slug: cleanPageSlug,
      visible,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {initialPage ? 'Edit page' : 'Create a page'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Configure your storefront page and its URL.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={19} />
        </button>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          Page title
        </label>

        <input
          autoFocus
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="e.g. About Us"
          maxLength={120}
          className={inputClass}
        />

        <p className="mt-1 text-right text-[10px] text-slate-400">
          {title.length}/120
        </p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          Page URL
        </label>

        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-emerald-600">
          <span className="whitespace-nowrap border-r border-slate-200 px-3 py-3 text-xs text-slate-400">
            /
          </span>

          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="about-us"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none"
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Use lowercase letters, numbers and hyphens.
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
            {visible ? <Eye size={17} /> : <EyeOff size={17} />}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Show this page
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Allow visitors to access this page.
            </p>
          </div>
        </div>

        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          {initialPage ? 'Save changes' : 'Create page'}
        </button>
      </div>
    </form>
  );
}

function PageCard({
  page,
  active,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onSetHome,
  canDelete,
}) {
  return (
    <div
      className={`group rounded-2xl border p-4 transition ${
        active
          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div
            className={`mt-0.5 rounded-xl p-2.5 ${
              active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {page.isHome ? (
              <Home size={18} />
            ) : (
              <FileText size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-slate-900">
                {page.title || 'Untitled page'}
              </p>

              {page.isHome && (
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  Homepage
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-xs text-slate-400">
              /{page.slug}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  page.visible === false
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {page.visible === false ? (
                  <EyeOff size={11} />
                ) : (
                  <Eye size={11} />
                )}

                {page.visible === false ? 'Hidden' : 'Visible'}
              </span>

              <span className="text-[10px] text-slate-400">
                {(page.sections || []).length} sections
              </span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit page"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate page"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Copy size={15} />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete page"
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {!page.isHome && (
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onSetHome}
            className="text-[11px] font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            Set as homepage
          </button>
        </div>
      )}
    </div>
  );
}

export default function PageManager({
  pages = [],
  activePageId = '',
  onSelectPage = () => {},
  onCreatePage = () => {},
  onUpdatePage = () => {},
  onDuplicatePage = () => {},
  onDeletePage = () => {},
  onSetHomePage = () => {},
}) {
  const [search, setSearch] = useState('');
  const [editingPage, setEditingPage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const safePages = Array.isArray(pages) ? pages : [];

  const visiblePages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return safePages;

    return safePages.filter((page) =>
      `${page.title || ''} ${page.slug || ''}`
        .toLowerCase()
        .includes(query)
    );
  }, [safePages, search]);

  const homePage = safePages.find((page) => page.isHome);

  const handleSave = (values) => {
    if (editingPage) {
      onUpdatePage(editingPage.id, values);
      setEditingPage(null);
      return;
    }

    onCreatePage(values);
    setCreating(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;

    onDeletePage(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Pages
            </h2>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {safePages.length}/30
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Organize your storefront pages and manage their URLs.
          </p>
        </div>

        <button
          type="button"
          disabled={safePages.length >= 30}
          onClick={() => setCreating(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={15} />
          Add page
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xl font-bold text-slate-900">
            {safePages.length}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            Total pages
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xl font-bold text-emerald-700">
            {safePages.filter((page) => page.visible !== false).length}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            Visible
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xl font-bold text-slate-400">
            {safePages.filter((page) => page.visible === false).length}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            Hidden
          </p>
        </div>
      </div>

      {/* HOMEPAGE */}
      {homePage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="rounded-xl bg-white p-2.5 text-emerald-700">
            <Globe size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-900">
              Your homepage
            </p>
            <p className="mt-1 truncate text-xs text-emerald-700">
              {homePage.title} · /{homePage.slug}
            </p>
          </div>

          <Check size={18} className="shrink-0 text-emerald-700" />
        </div>
      )}

      {/* SEARCH */}
      {safePages.length > 4 && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pages..."
            className={`${inputClass} pl-9`}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* PAGE LIST */}
      <div className="space-y-3">
        {visiblePages.length > 0 ? (
          visiblePages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              active={page.id === activePageId}
              onSelect={() => onSelectPage(page.id)}
              onEdit={() => setEditingPage(page)}
              onDuplicate={() => onDuplicatePage(page)}
              onDelete={() => setConfirmDelete(page)}
              onSetHome={() => onSetHomePage(page)}
              canDelete={!page.isHome && safePages.length > 1}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <FileText
              size={26}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No pages found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try another search term.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
        <AlertCircle
          size={15}
          className="mt-0.5 shrink-0 text-slate-400"
        />

        <p className="text-[11px] leading-relaxed text-slate-500">
          Hidden pages are excluded from normal visitor navigation.
          They remain available in your editor until you make them
          visible again.
        </p>
      </div>

      {/* CREATE */}
      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <PageForm
            pages={safePages}
            onClose={() => setCreating(false)}
            onSave={handleSave}
          />
        </Modal>
      )}

      {/* EDIT */}
      {editingPage && (
        <Modal onClose={() => setEditingPage(null)}>
          <PageForm
            initialPage={editingPage}
            pages={safePages}
            onClose={() => setEditingPage(null)}
            onSave={handleSave}
          />
        </Modal>
      )}

      {/* DELETE CONFIRMATION */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Trash2 size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete this page?
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  You are about to delete{' '}
                  <strong className="text-slate-800">
                    {confirmDelete.title}
                  </strong>
                  . Its sections and content will also be removed.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Keep page
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete page
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
