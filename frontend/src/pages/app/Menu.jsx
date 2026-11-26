
import { useState } from 'react';
import { Plus, UtensilsCrossed, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, toKobo, fromKobo, label } from '../../lib/format.js';
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
  Pager,
  Select,
  Table,
  Textarea,
  useApi,
  useAction,
} from '../../components/ui.jsx';

function CategoryForm({ category, onDone }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    published: category?.published ?? true,
  });
  const [error, setError] = useState(null);
  const [run, busy] = useAction();

  const update = (key) => (e) => setForm((current) => ({
    ...current,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    await run(async () => {
      await api(
        category ? `/menu/categories/${category._id}` : '/menu/categories',
        {
          method: category ? 'PATCH' : 'POST',
          biz: true,
          body: form,
        }
      );
      onDone();
    }, category ? 'Category updated' : 'Category created');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote error={error} />
      <Input
        id="menu-category-name"
        label="Category name"
        value={form.name}
        onChange={update('name')}
        required
        maxLength={80}
        placeholder="e.g. Main dishes"
      />
      <Textarea
        id="menu-category-description"
        label="Description"
        value={form.description}
        onChange={update('description')}
        maxLength={500}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={update('published')}
          className="h-4 w-4"
        />
        Show this category on my online menu
      </label>
      <button className="btn-primary w-full" disabled={busy}>
        {category ? 'Save category' : 'Create category'}
      </button>
    </form>
  );
}

function ItemForm({ item, categories, onDone }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item ? fromKobo(item.price) : '',
    category: item?.category?._id || item?.category || '',
    imageUrl: item?.imageUrl || '',
    available: item?.available ?? true,
    published: item?.published ?? true,
  });
  const [error, setError] = useState(null);
  const [run, busy] = useAction();

  const update = (key) => (e) => setForm((current) => ({
    ...current,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.category) {
      setError(new Error('Choose a menu category.'));
      return;
    }

    const price = toKobo(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError(new Error('Enter a valid price.'));
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description,
      price,
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      available: form.available,
      published: form.published,
    };

    await run(async () => {
      await api(
        item ? `/menu/items/${item._id}` : '/menu/items',
        {
          method: item ? 'PATCH' : 'POST',
          biz: true,
          body,
        }
      );
      onDone();
    }, item ? 'Menu item updated' : 'Menu item added');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote error={error} />

      <Input
        id="menu-item-name"
        label="Item name"
        value={form.name}
        onChange={update('name')}
        required
        maxLength={160}
        placeholder="e.g. Jollof rice"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="menu-item-price"
          label="Price (₦)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={form.price}
          onChange={update('price')}
          required
        />
        <Select
          id="menu-item-category"
          label="Category"
          value={form.category}
          onChange={update('category')}
          required
        >
          <option value="">Choose category</option>
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
        value={form.description}
        onChange={update('description')}
        maxLength={2000}
        placeholder="Describe this dish or item..."
      />

      <Input
        id="menu-item-image"
        label="Image URL (optional)"
        type="url"
        value={form.imageUrl}
        onChange={update('imageUrl')}
        placeholder="https://..."
        hint="Use a secure HTTPS image link."
      />

      {form.imageUrl && (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <img
            src={form.imageUrl}
            alt={form.name || 'Menu item preview'}
            className="h-40 w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="space-y-3 rounded-xl bg-paper p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.available}
            onChange={update('available')}
            className="h-4 w-4"
          />
          Available for ordering
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={update('published')}
            className="h-4 w-4"
          />
          Published on online menu
        </label>
      </div>

      <button className="btn-primary w-full" disabled={busy}>
        {item ? 'Save changes' : 'Add menu item'}
      </button>
    </form>
  );
}

export default function MenuPage() {
  const { can } = useAuth();
  const write = can('menu.write');

  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [itemEditor, setItemEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [showCategories, setShowCategories] = useState(false);

  const categories = useApi(
    () => api('/menu/categories', { biz: true }),
    []
  );

  const { data, loading, error, reload } = useApi(
    () => api(`/menu/items${qs({
      page,
      limit: 20,
      category: categoryFilter,
    })}`, { biz: true }),
    [page, categoryFilter]
  );

  const [run, busy] = useAction();

  const items = data?.items || [];
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const allItems = items.length;
  const availableCount = items.filter((item) => item.available).length;
  const publishedCount = items.filter((item) => item.published).length;
  const categoryList = categories.data?.categories || [];

  const refresh = () => {
    reload();
    categories.reload();
  };

  const removeItem = (item) => {
    if (!window.confirm(`Delete "${item.name}" from your menu?`)) return;

    run(async () => {
      await api(`/menu/items/${item._id}`, {
        method: 'DELETE',
        biz: true,
      });
      refresh();
    }, 'Menu item deleted');
  };

  const toggleItem = (item, key) => {
    run(async () => {
      await api(`/menu/items/${item._id}`, {
        method: 'PATCH',
        biz: true,
        body: { [key]: !item[key] },
      });
      refresh();
    }, `${label(key)} updated`);
  };

  const removeCategory = (category) => {
    if (!window.confirm(`Delete "${category.name}"? Its menu items must be moved or removed first.`)) return;

    run(async () => {
      await api(`/menu/categories/${category._id}`, {
        method: 'DELETE',
        biz: true,
      });
      refresh();
    }, 'Category deleted');
  };

  return (
    <>
      <PageHeader
        title="Menu"
        sub="Manage your restaurant menu, prices and item availability."
        actions={write ? (
          <>
            <button
              className="btn-secondary"
              onClick={() => setShowCategories(true)}
            >
              Manage categories
            </button>
            <button
              className="btn-primary"
              onClick={() => setItemEditor({})}
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </>
        ) : null}
      />

      {!write && (
        <Notice tone="warn">
          You have view-only access to this menu. Contact your business owner
          or an administrator if you need editing permissions.
        </Notice>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted">Menu items</p>
          <p className="mt-2 font-display text-2xl font-bold">{data?.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Available on this page</p>
          <p className="mt-2 font-display text-2xl font-bold">{availableCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Published on this page</p>
          <p className="mt-2 font-display text-2xl font-bold">{publishedCount}</p>
        </Card>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search menu items"
            aria-label="Search menu items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categoryList.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {loading ? (
          <Loading text="Loading your menu..." />
        ) : error ? (
          <div className="p-4">
            <ErrorNote error={error} retry={reload} />
          </div>
        ) : filteredItems.length === 0 ? (
          <Empty
            icon={UtensilsCrossed}
            title={search ? 'No matching menu items' : 'Your menu is empty'}
            hint={
              search
                ? 'Try another search term.'
                : 'Create categories and add your first menu items to get started.'
            }
            action={write && !search ? (
              <button
                className="btn-primary"
                onClick={() => setItemEditor({})}
              >
                <Plus className="h-4 w-4" />
                Add your first item
              </button>
            ) : null}
          />
        ) : (
          <>
            <Table head={['Menu item', 'Price', 'Category', 'Availability', 'Published', '']}>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper text-muted">
                          <UtensilsCrossed className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-muted">
                          {item.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{naira(item.price)}</td>
                  <td className="px-4 py-3">
                    {item.category?.name || 'Uncategorised'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={item.available ? 'ok' : 'bad'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={item.published ? 'ok' : 'neutral'}>
                      {item.published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {write && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost !min-h-[36px] !px-2 !py-1"
                          title={item.available ? 'Mark unavailable' : 'Mark available'}
                          disabled={busy}
                          onClick={() => toggleItem(item, 'available')}
                        >
                          {item.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          className="btn-ghost !min-h-[36px] !px-2 !py-1"
                          title="Edit item"
                          onClick={() => setItemEditor(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost !min-h-[36px] !px-2 !py-1 text-danger"
                          title="Delete item"
                          disabled={busy}
                          onClick={() => removeItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            <Pager
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={!!itemEditor}
        onClose={() => setItemEditor(null)}
        title={itemEditor?._id ? 'Edit menu item' : 'Add menu item'}
        wide
      >
        {itemEditor && (
          <ItemForm
            item={itemEditor._id ? itemEditor : null}
            categories={categoryList}
            onDone={() => {
              setItemEditor(null);
              refresh();
            }}
          />
        )}
      </Modal>

      <Modal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        title="Menu categories"
        wide
      >
        {write && (
          <div className="mb-5">
            <button
              className="btn-primary"
              onClick={() => setCategoryEditor({})}
            >
              <Plus className="h-4 w-4" />
              Add category
            </button>
          </div>
        )}

        {categories.loading ? (
          <Loading text="Loading categories..." />
        ) : categories.error ? (
          <ErrorNote error={categories.error} retry={categories.reload} />
        ) : categoryList.length === 0 ? (
          <Empty
            icon={UtensilsCrossed}
            title="No categories yet"
            hint="Create categories such as Starters, Main dishes, Drinks and Desserts."
          />
        ) : (
          <div className="divide-y divide-line">
            {categoryList.map((category) => (
              <div
                key={category._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted">
                    {category.description || 'No description'} ·{' '}
                    {category.published ? 'Published' : 'Hidden'}
                  </p>
                </div>
                {write && (
                  <div className="flex gap-2">
                    <button
                      className="btn-ghost !min-h-[36px] !py-1"
                      onClick={() => setCategoryEditor(category)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost !min-h-[36px] !py-1 text-danger"
                      disabled={busy}
                      onClick={() => removeCategory(category)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={!!categoryEditor}
        onClose={() => setCategoryEditor(null)}
        title={categoryEditor?._id ? 'Edit category' : 'Add category'}
      >
        {categoryEditor && (
          <CategoryForm
            category={categoryEditor._id ? categoryEditor : null}
            onDone={() => {
              setCategoryEditor(null);
              refresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}
