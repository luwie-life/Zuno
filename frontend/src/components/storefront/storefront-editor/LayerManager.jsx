import { useMemo, useState } from 'react';
import {
  Layers,
  FileText,
  Home,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Image as ImageIcon,
  MousePointer,
  Columns3,
  Video,
  ShoppingBag,
  BriefcaseBusiness,
  CalendarDays,
  Minus,
  LayoutGrid,
  Search,
  X,
  MoreHorizontal,
} from 'lucide-react';

const SECTION_LABELS = {
  announcement: 'Announcement bar',
  navigation: 'Navigation',
  hero: 'Hero banner',
  about: 'About',
  image_text: 'Image and text',
  rich_text: 'Text section',
  gallery: 'Gallery',
  portfolio_grid: 'Portfolio projects',
  featured_projects: 'Featured projects',
  services: 'Services',
  featured_services: 'Featured services',
  service_packages: 'Service packages',
  booking: 'Booking',
  featured_products: 'Featured products',
  product_grid: 'Product catalogue',
  categories: 'Categories',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'FAQs',
  contact: 'Contact',
  social_links: 'Social links',
  custom_content: 'Custom content',
  footer: 'Footer',
};

const ELEMENT_ICONS = {
  heading: Type,
  text: FileText,
  button: MousePointer,
  image: ImageIcon,
  spacer: Minus,
  divider: Minus,
  columns: Columns3,
  grid: LayoutGrid,
  gallery: ImageIcon,
  video: Video,
  product_list: ShoppingBag,
  service_list: BriefcaseBusiness,
  booking_button: CalendarDays,
  contact_form: MousePointer,
};

const getSectionTitle = (section) =>
  section?.settings?.title ||
  SECTION_LABELS[section?.type] ||
  section?.type ||
  'Untitled section';

const getElementTitle = (element) => {
  if (element?.content?.trim()) {
    return element.content.trim().slice(0, 45);
  }

  const labels = {
    heading: 'Heading',
    text: 'Text block',
    button: 'Button',
    image: 'Image',
    spacer: 'Spacer',
    divider: 'Divider',
    columns: 'Columns',
    grid: 'Grid',
    gallery: 'Gallery',
    video: 'Video',
    product_list: 'Product list',
    service_list: 'Service list',
    booking_button: 'Booking button',
    contact_form: 'Contact form',
  };

  return labels[element?.type] || 'Element';
};

function IconButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <Icon size={14} />
    </button>
  );
}

function LayerRow({
  icon: Icon,
  title,
  subtitle,
  selected,
  visible = true,
  depth = 0,
  onSelect,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative flex min-w-0 items-center gap-1 rounded-xl border px-2 py-2 transition ${
        selected
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
      }`}
      style={{ marginLeft: depth ? `${depth * 12}px` : undefined }}
    >
      {draggable && (
        <span
          className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={15} />
        </span>
      )}

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={`shrink-0 ${
            selected ? 'text-emerald-700' : 'text-slate-400'
          }`}
        >
          <Icon size={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-xs font-semibold ${
              selected ? 'text-emerald-900' : 'text-slate-700'
            }`}
          >
            {title}
          </span>

          {subtitle && (
            <span className="mt-0.5 block truncate text-[10px] text-slate-400">
              {subtitle}
            </span>
          )}
        </span>
      </button>

      {!visible && (
        <span title="Hidden" className="shrink-0 text-slate-300">
          <EyeOff size={13} />
        </span>
      )}

      <div className="relative flex shrink-0 items-center">
        <IconButton
          icon={menuOpen ? X : MoreHorizontal}
          label="Layer options"
          onClick={() => setMenuOpen((open) => !open)}
        />

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close layer menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[80] cursor-default"
            />

            <div className="absolute right-0 top-full z-[85] mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  onToggleVisibility?.();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                {visible ? 'Hide layer' : 'Show layer'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onMoveUp?.();
                  setMenuOpen(false);
                }}
                disabled={!canMoveUp}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ArrowUp size={14} />
                Move up
              </button>

              <button
                type="button"
                onClick={() => {
                  onMoveDown?.();
                  setMenuOpen(false);
                }}
                disabled={!canMoveDown}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ArrowDown size={14} />
                Move down
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  onDuplicate?.();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Copy size={14} />
                Duplicate
              </button>

              <button
                type="button"
                onClick={() => {
                  onDelete?.();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLayer({
  section,
  index,
  total,
  selectedSectionId,
  selectedElementId,
  onSelectSection,
  onSelectElement,
  onToggleSection,
  onToggleElement,
  onMoveSection,
  onMoveElement,
  onDuplicateSection,
  onDuplicateElement,
  onRemoveSection,
  onRemoveElement,
  expanded,
  onToggleExpanded,
  dragHandlers,
}) {
  const elements = section.elements || [];
  const isSelected = selectedSectionId === section.id;

  return (
    <div className="space-y-1">
      <div
        className={`rounded-2xl border p-1 ${
          isSelected
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-slate-100 bg-white'
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            {expanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <LayerRow
              icon={Layers}
              title={getSectionTitle(section)}
              subtitle={`${section.type} · ${elements.length} elements`}
              selected={isSelected && !selectedElementId}
              visible={section.visible !== false}
              onSelect={() => onSelectSection(section.id)}
              onToggleVisibility={() => onToggleSection(section)}
              onMoveUp={() => onMoveSection(section.id, -1)}
              onMoveDown={() => onMoveSection(section.id, 1)}
              onDuplicate={() => onDuplicateSection(section)}
              onDelete={() => onRemoveSection(section.id)}
              canMoveUp={index > 0}
              canMoveDown={index < total - 1}
              draggable
              onDragStart={(event) =>
                dragHandlers?.onDragStart(event, section.id)
              }
              onDragOver={(event) =>
                dragHandlers?.onDragOver(event)
              }
              onDrop={(event) =>
                dragHandlers?.onDrop(event, section.id)
              }
              onDragEnd={() =>
                dragHandlers?.onDragEnd()
              }
            />
          </div>
        </div>

        {expanded && (
          <div className="ml-5 space-y-1 border-l border-slate-200 py-2 pl-2">
            {elements.length > 0 ? (
              elements.map((element, elementIndex) => {
                const Icon =
                  ELEMENT_ICONS[element.type] || FileText;

                return (
                  <LayerRow
                    key={element.id}
                    icon={Icon}
                    title={getElementTitle(element)}
                    subtitle={element.type}
                    selected={selectedElementId === element.id}
                    visible={element.visible !== false}
                    onSelect={() =>
                      onSelectElement(section.id, element.id)
                    }
                    onToggleVisibility={() =>
                      onToggleElement(section.id, element)
                    }
                    onMoveUp={() =>
                      onMoveElement?.(element.id, -1, section.id)
                    }
                    onMoveDown={() =>
                      onMoveElement?.(element.id, 1, section.id)
                    }
                    onDuplicate={() =>
                      onDuplicateElement?.(section.id, element)
                    }
                    onDelete={() =>
                      onRemoveElement?.(section.id, element.id)
                    }
                    canMoveUp={elementIndex > 0}
                    canMoveDown={elementIndex < elements.length - 1}
                  />
                );
              })
            ) : (
              <p className="px-3 py-3 text-[11px] text-slate-400">
                No elements in this section yet.
              </p>
            )}

            <button
              type="button"
              onClick={() => onSelectSection(section.id)}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <Plus size={13} />
              Add or edit section content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LayerManager({
  pages = [],
  activePage,
  selectedSectionId = '',
  selectedElementId = '',
  onPage = () => {},
  onAddPage = () => {},
  onRenamePage = () => {},
  onDuplicatePage = () => {},
  onDeletePage = () => {},
  onAddSection = () => {},
  onAddElement = () => {},
  onSelectSection = () => {},
  onSelectElement = () => {},
  onMoveSection = () => {},
  onMoveElement = () => {},
  onDuplicateSection = () => {},
  onDuplicateElement = () => {},
  onRemoveSection = () => {},
  onRemoveElement = () => {},
  onToggleSection = () => {},
  onToggleElement = () => {},
  onReorderSections = () => {},
  onReorderElements = () => {},
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const [search, setSearch] = useState('');
  const [draggedSectionId, setDraggedSectionId] = useState('');

  const currentPage = activePage ||
    pages.find((page) => page.isHome) ||
    pages[0];

  const sections = currentPage?.sections || [];

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sections;

    return sections.filter((section) => {
      const sectionText = [
        getSectionTitle(section),
        section.type,
        ...(section.elements || []).map(getElementTitle),
      ]
        .join(' ')
        .toLowerCase();

      return sectionText.includes(query);
    });
  }, [sections, search]);

  const toggleExpanded = (id) => {
    setExpandedSections((current) => ({
      ...current,
      [id]: !(current[id] ?? true),
    }));
  };

  const handleSectionDragStart = (event, id) => {
    setDraggedSectionId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleSectionDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleSectionDrop = (event, targetId) => {
    event.preventDefault();

    const sourceId =
      event.dataTransfer.getData('text/plain') ||
      draggedSectionId;

    if (!sourceId || sourceId === targetId) return;

    const reordered = [...sections];
    const from = reordered.findIndex((item) => item.id === sourceId);
    const to = reordered.findIndex((item) => item.id === targetId);

    if (from < 0 || to < 0) return;

    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    onReorderSections(reordered);
    setDraggedSectionId('');
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionId('');
  };

  const dragHandlers = {
    onDragStart: handleSectionDragStart,
    onDragOver: handleSectionDragOver,
    onDrop: handleSectionDrop,
    onDragEnd: handleSectionDragEnd,
  };

  const togglePageSection = (pageId) => {
    onPage(pageId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* PAGE SELECTOR */}
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Layers
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Manage your page structure.
            </p>
          </div>

          <button
            type="button"
            onClick={onAddPage}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-800"
          >
            <Plus size={14} />
            Page
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {pages.map((page) => {
            const selected = page.id === currentPage?.id;

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => togglePageSection(page.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  selected
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page.isHome ? (
                  <Home size={13} />
                ) : (
                  <FileText size={13} />
                )}

                <span className="max-w-[110px] truncate text-[11px] font-semibold">
                  {page.title}
                </span>
              </button>
            );
          })}
        </div>

        {currentPage && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {currentPage.title}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                /{currentPage.slug}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={Copy}
                label="Duplicate page"
                onClick={() => onDuplicatePage(currentPage)}
              />
              <IconButton
                icon={PencilIcon}
                label="Rename page"
                onClick={() => onRenamePage(currentPage)}
              />
              {!currentPage.isHome && (
                <IconButton
                  icon={Trash2}
                  label="Delete page"
                  danger
                  onClick={() => onDeletePage(currentPage)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div className="shrink-0 px-4 pt-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a section or element..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-9 text-xs outline-none focus:border-emerald-600"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* SECTION TREE */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {filteredSections.length > 0 ? (
          <div className="space-y-2">
            {filteredSections.map((section, index) => {
              const originalIndex = sections.findIndex(
                (item) => item.id === section.id
              );

              return (
                <SectionLayer
                  key={section.id}
                  section={section}
                  index={originalIndex}
                  total={sections.length}
                  selectedSectionId={selectedSectionId}
                  selectedElementId={selectedElementId}
                  expanded={expandedSections[section.id] ?? true}
                  onToggleExpanded={() =>
                    toggleExpanded(section.id)
                  }
                  onSelectSection={onSelectSection}
                  onSelectElement={onSelectElement}
                  onToggleSection={onToggleSection}
                  onToggleElement={onToggleElement}
                  onMoveSection={onMoveSection}
                  onMoveElement={onMoveElement}
                  onDuplicateSection={onDuplicateSection}
                  onDuplicateElement={onDuplicateElement}
                  onRemoveSection={onRemoveSection}
                  onRemoveElement={onRemoveElement}
                  dragHandlers={dragHandlers}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
            <Layers
              size={25}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              {search ? 'No matching layers' : 'This page is empty'}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {search
                ? 'Try another search term.'
                : 'Add a section to start building this page.'}
            </p>

            {!search && (
              <button
                type="button"
                onClick={onAddSection}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white"
              >
                <Plus size={14} />
                Add section
              </button>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddSection}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Plus size={14} />
            Add section
          </button>

          <button
            type="button"
            onClick={onAddElement}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-3 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={14} />
            Add element
          </button>
        </div>
      </div>
    </div>
  );
}

function PencilIcon({ size = 14 }) {
  return <FileText size={size} />;
}
