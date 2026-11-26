
import { useMemo, useState } from 'react';
import {
  Plus,
  UtensilsCrossed,
  FolderPlus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { fromKobo, naira, toKobo } from '../../lib/format.js';
import {
  Badge,
  Card,
  Empty,
  ErrorNote,
  Input,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Select,
  Table,
  Textarea,
  useApi,
  useToast,
} from '../../components/ui.jsx';

const blankCategory = () => ({
  name: '',
  description: '',
  sortOrder: '0',
  published: true,
});

const blankItem = () => ({
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  available: true,
  published: true,
  sortOrder: '0',
});

function CategoryEditor({ category, onClose, onSaved }) {
  const [form, setForm] = useState(
    category
      ? {
          name: category.name || '',
          description: category.description || '',
          sortOrder: String(category.sortOrder || 0),
          published: category.published !== false,
        }
      : blankCategory()
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]:
        event.target.type === 'checkbox'
          ? event.target.checked
          : event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const body = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };

      await api(
        category
          ? `/menu/categories/${category._id}`
          : '/menu/categories',
        {
          method: category ? 'PATCH' : 'POST',
          biz: true,
          body,
        }
      );

      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Edit category' : 'Create menu category'}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />

        <Input
          id="menu-category-name"
          label="Category name"
          placeholder="e.g. Main dishes"
          required
          value={form.name}
          onChange={set('name')}
        />

        <Textarea
          id="menu-category-description"
          label="Description"
          rows={3}
          placeholder="A short description of this menu category"
          value={form.description}
          onChange={set('description')}
        />

        <Input
          id="menu-category-order"
          label="Display order"
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={set('sortOrder')}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={form.published}
            onChange={set('published')}
          />
          Show this category on the public menu
        </label>

        <button className="btn-primary w-full" disabled={busy}>
          {busy
            ? 'Saving…'
            : category
              ? 'Save category'
              : 'Create category'}
        </button>
      </form>
    </Modal>
  );
}

function MenuItemEditor({
  item,
  categories,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(
    item
      ? {
          name: item.name || '',
          description: item.description || '',
          price: String(fromKobo(item.price)),
          category: item.category?._id || item.category || '',
          imageUrl: item.imageUrl || '',
          available: item.available !== false,
          published: item.published !== false,
          sortOrder: String(item.sortOrder || 0),
        }
      : {
          ...blankItem(),
          category: categories[0]?._id || '',
        }
  );

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]:
        event.target.type === 'checkbox'
          ? event.target.checked
          : event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const body = {
        ...form,
        price: toKobo(form.price),
        sortOrder: Number(form.sortOrder) || 0,
      };

      await api(
        item ? `/menu/items/${item._id}` : '/menu/items',
        {
          method: item ? 'PATCH' : 'POST',
          biz: true,
          body,
        }
      );

      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Edit menu item' : 'Add menu item'}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />

        <Input
          id="menu-item-name"
          label="Item name"
          placeholder="e.g. Jollof rice and chicken"
          required
          value={form.name}
          onChange={set('name')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="menu-item-price"
            label="Price (₦)"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={set('price')}
          />

          <Select
            id="menu-item-category"
            label="Category"
            required
            value={form.category}
            onChange={set('category')}
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          id="menu-item-description"
          label="Description"
          rows={3}
          placeholder="Describe the item for your customers"
          value={form.description}
          onChange={set('description')}
        />

        <Input
          id="menu-item-image"
          label="Image URL (HTTPS)"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={set('imageUrl')}
        />

        {form.imageUrl && (
          <div className="overflow-hidden rounded-xl border border-line bg-paper">
            <img
              src={form.imageUrl}
              alt="Menu item preview"
              className="h-40 w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <Input
          id="menu-item-order"
          label="Display order"
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={set('sortOrder')}
        />

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.available}
              onChange={set('available')}
            />
            Available to order
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.published}
              onChange={set('published')}
            />
            Show on public menu
          </label>
        </div>

        <button
          className="btn-primary w-full"
          disabled={busy || !categories.length}
        >
          {busy
            ? 'Saving…'
            : item
              ? 'Save menu item'
              : 'Add menu item'}
        </button>
      </form>
    </Modal>
  );
}

export default function Menu() {
  const [tab, setTab] = useState('items');
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [itemEditor, setItemEditor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toast = useToast();

  const {
    data: categoryData,
    loading: categoriesLoading,
    error: categoryError,
    reload: reloadCategories,
  } = useApi(
    () => api('/menu/categories', { biz: true }),
    []
  );

  const {
    data: itemData,
    loading: itemsLoading,
    error: itemError,
    reload: reloadItems,
  } = useApi(
    () => api('/menu/items?limit=100', { biz: true }),
    []
  );

  const categories = categoryData?.categories || [];
  const items = itemData?.items || [];

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'all') return items;

    return items.filter((item) => {
      const categoryId =
        item.category?._id || item.category;

      return String(categoryId) === String(selectedCategory);
    });
  }, [items, selectedCategory]);

  const refresh = async () => {
    await Promise.all([
      reloadCategories(),
      reloadItems(),
    ]);
  };

  const removeCategory = async (category) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Categories with menu items cannot be deleted.`
      )
    ) {
      return;
    }

    try {
      await api(`/menu/categories/${category._id}`, {
        method: 'DELETE',
        biz: true,
      });

      await refresh();
      toast('Category deleted');
    } catch (failure) {
      toast(failure.message || 'Could not delete category', 'bad');
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from your menu?`)) {
      return;
    }

    try {
      await api(`/menu/items/${item._id}`, {
        method: 'DELETE',
        biz: true,
      });

      await reloadItems();
      toast('Menu item deleted');
    } catch (failure) {
      toast(failure.message || 'Could not delete menu item', 'bad');
    }
  };

  const saveComplete = async () => {
    setCategoryEditor(null);
    setItemEditor(null);
    await refresh();
    toast('Menu updated');
  };

  return (
    <>
      <PageHeader
        title="Restaurant menu"
        sub="Organise your food categories, manage menu items and control what customers can see."
        actions={
          <div className="flex flex-wrap gap-2">
            {tab === 'categories' ? (
              <button
                className="btn-primary"
                onClick={() => setCategoryEditor({})}
              >
                <FolderPlus className="h-4 w-4" />
                Add category
              </button>
            ) : (
              <button
                className="btn-primary"
                disabled={!categories.length}
                onClick={() => setItemEditor({})}
              >
                <Plus className="h-4 w-4" />
                Add menu item
              </button>
            )}
          </div>
        }
      />

      <Notice>
        Only published categories and available, published items appear on
        your public restaurant menu. Menu items are managed separately from
        your regular product catalogue.
      </Notice>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-5">
          <button
            onClick={() => setTab('items')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              tab === 'items'
                ? 'border-forest text-forest'
                : 'border-transparent text-muted'
            }`}
          >
            Menu items
            <span className="ml-2 text-xs text-muted">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setTab('categories')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              tab === 'categories'
                ? 'border-forest text-forest'
                : 'border-transparent text-muted'
            }`}
          >
            Categories
            <span className="ml-2 text-xs text-muted">
              {categories.length}
            </span>
          </button>
        </div>

        {tab === 'items' && categories.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              id="menu-category-filter"
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {tab === 'categories' ? (
        <div className="mt-5">
          {categoriesLoading ? (
            <Loading />
          ) : categoryError ? (
            <ErrorNote error={categoryError} retry={reloadCategories} />
          ) : categories.length === 0 ? (
            <Empty
              icon={FolderPlus}
              title="Create your first menu category"
              hint="Start with categories such as Main dishes, Small chops, Drinks or Desserts."
              action={
                <button
                  className="btn-primary"
                  onClick={() => setCategoryEditor({})}
                >
                  <Plus className="h-4 w-4" />
                  Create category
                </button>
              }
            />
          ) : (
            <Card>
              <Table head={['Category', 'Items', 'Visibility', 'Order', '']}>
                {categories.map((category) => {
                  const count = items.filter((item) => {
                    const id =
                      item.category?._id || item.category;

                    return String(id) === String(category._id);
                  }).length;

                  return (
                    <tr key={category._id}>
                      <td className="px-4 py-4">
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="mt-1 text-xs text-muted">
                            {category.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm">{count}</td>

                      <td className="px-4 py-4">
                        {category.published ? (
                          <Badge>Published</Badge>
                        ) : (
                          <Badge>Hidden</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {category.sortOrder || 0}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          className="btn-ghost !min-h-9 !py-1"
                          onClick={() => setCategoryEditor(category)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          className="btn-ghost !min-h-9 !py-1 text-danger"
                          onClick={() => removeCategory(category)}
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}
        </div>
      ) : (
        <div className="mt-5">
          {itemsLoading || categoriesLoading ? (
            <Loading />
          ) : itemError ? (
            <ErrorNote error={itemError} retry={reloadItems} />
          ) : !categories.length ? (
            <Empty
              icon={FolderPlus}
              title="Create categories before adding items"
              hint="Your menu needs at least one category. Create one to start organising your dishes."
              action={
                <button
                  className="btn-primary"
                  onClick={() => {
                    setTab('categories');
                    setCategoryEditor({});
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create category
                </button>
              }
            />
          ) : visibleItems.length === 0 ? (
            <Empty
              icon={UtensilsCrossed}
              title="Your menu is ready for its first item"
              hint="Add dishes, drinks and other items customers can browse on your public menu."
              action={
                <button
                  className="btn-primary"
                  onClick={() => setItemEditor({})}
                >
                  <Plus className="h-4 w-4" />
                  Add menu item
                </button>
              }
            />
          ) : (
            <Card>
              <Table head={['Menu item', 'Category', 'Price', 'Status', '']}>
                {visibleItems.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name}</p>
                          {item.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {item.category?.name ||
                        categories.find(
                          (category) =>
                            category._id === item.category
                        )?.name ||
                        '—'}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium">
                      {naira(item.price)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.available ? (
                          <Badge>Available</Badge>
                        ) : (
                          <Badge>Unavailable</Badge>
                        )}

                        {item.published ? (
                          <Badge>Published</Badge>
                        ) : (
                          <Badge>Hidden</Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        className="btn-ghost !min-h-9 !py-1"
                        onClick={() => setItemEditor(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        className="btn-ghost !min-h-9 !py-1 text-danger"
                        onClick={() => removeItem(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>
      )}

      {categoryEditor && (
        <CategoryEditor
          category={categoryEditor._id ? categoryEditor : null}
          onClose={() => setCategoryEditor(null)}
          onSaved={saveComplete}
        />
      )}

      {itemEditor && (
        <MenuItemEditor
          item={itemEditor._id ? itemEditor : null}
          categories={categories}
          onClose={() => setItemEditor(null)}
          onSaved={saveComplete}
        />
      )}
    </>
  );
}
