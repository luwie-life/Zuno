import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Lock } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, toKobo, fromKobo } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, Notice, PageHeader, Pager, Select, Table, Textarea, useApi, useAction } from '../../components/ui.jsx';

function ProductForm({ product, categories, onDone }) {
  const [f, setF] = useState(product ? { name: product.name, description: product.description || '', price: fromKobo(product.price), cost: fromKobo(product.cost), sku: product.sku || '', category: product.category?._id || product.category || '', images: (product.images || []).join('\n'), trackStock: product.trackStock, lowStockThreshold: product.lowStockThreshold, published: product.published, initialStock: 0 } : { name: '', description: '', price: '', cost: '', sku: '', category: '', images: '', trackStock: true, lowStockThreshold: 5, published: true, initialStock: 0 });
  const [err, setErr] = useState(null); const [run, busy] = useAction();
  const on = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    const body = { name: f.name, description: f.description, price: toKobo(f.price), cost: f.cost ? toKobo(f.cost) : 0, sku: f.sku, category: f.category || null, images: f.images.split('\n').map((s) => s.trim()).filter(Boolean), trackStock: f.trackStock, lowStockThreshold: Number(f.lowStockThreshold), published: f.published };
    if (!product) body.initialStock = Number(f.initialStock) || 0;
    try { setErr(null); await api(product ? `/catalog/products/${product._id}` : '/catalog/products', { method: product ? 'PATCH' : 'POST', biz: true, body }); onDone(); } catch (x) { setErr(x); }
  };
  return (
    <form onSubmit={submit} className="space-y-4"><ErrorNote error={err} />
      <Input id="pn" label="Name" required value={f.name} onChange={on('name')} />
      <div className="grid grid-cols-2 gap-4"><Input id="pp" label="Price (₦)" required inputMode="decimal" value={f.price} onChange={on('price')} /><Input id="pc" label="Cost (₦, optional)" inputMode="decimal" value={f.cost} onChange={on('cost')} /></div>
      <div className="grid grid-cols-2 gap-4"><Input id="sk" label="SKU (optional)" value={f.sku} onChange={on('sku')} /><Select id="ct" label="Category" value={f.category} onChange={on('category')}><option value="">None</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></div>
      <Textarea id="pd" label="Description" value={f.description} onChange={on('description')} />
      <Textarea id="pi" label="Image links (https, one per line, up to 5)" rows={3} value={f.images} onChange={on('images')} hint="Paste links to images hosted online. File upload is not built in yet." />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.trackStock} onChange={on('trackStock')} className="h-4 w-4" />Track stock for this product</label>
      {f.trackStock && <div className="grid grid-cols-2 gap-4">{!product && <Input id="is" label="Starting stock" type="number" min="0" value={f.initialStock} onChange={on('initialStock')} />}<Input id="lt" label="Low-stock alert at" type="number" min="0" value={f.lowStockThreshold} onChange={on('lowStockThreshold')} /></div>}
      {product && f.trackStock && <p className="text-xs text-muted">To change stock, use Inventory → Adjust so the change is recorded.</p>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={on('published')} className="h-4 w-4" />Visible in the online store</label>
      <button className="btn-primary w-full" disabled={busy}>{product ? 'Save changes' : 'Add product'}</button>
    </form>
  );
}

export default function Products() {
  const { can, hasFeature, ctx } = useAuth();
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [archived, setArchived] = useState(false); const [edit, setEdit] = useState(null); const [catOpen, setCatOpen] = useState(false); const [catName, setCatName] = useState('');
  const { data, loading, error, reload } = useApi(() => api(`/catalog/products${qs({ search, page, archived })}`, { biz: true }), [search, page, archived]);
  const cats = useApi(() => api('/catalog/categories', { biz: true }), []);
  const [run] = useAction(); const write = can('products.write'); const productAccess = hasFeature('products');
  const subscriptionActive = ['active', 'grace'].includes(ctx?.subscription?.state);
  return (
    <>
      <PageHeader title="Products" actions={write && productAccess ? <><button className="btn-secondary" onClick={() => setCatOpen(true)}>Categories</button><button className="btn-primary" onClick={() => setEdit({})}><Plus className="h-4 w-4" />Add product</button></> : !productAccess && can('billing.manage') && <Link className="btn-primary" to="/app/billing">Review billing</Link>} />
      {!productAccess && <Notice tone="warn"><span className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" /><span>{subscriptionActive ? `Product management is not included in ${ctx?.subscription?.plan?.name || 'your current plan'}.` : `Your subscription is ${ctx?.subscription?.state || 'not active'}; product changes are locked until it is activated.`} Existing products remain available to view. Visit Billing for next steps.</span></span></Notice>}
      <div className="mb-4 flex flex-wrap gap-3"><div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search products" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(e) => { setArchived(e.target.checked); setPage(1); }} className="h-4 w-4" />Show archived</label></div>
      <Card>{loading ? <Loading /> : error ? <div className="p-4"><ErrorNote error={error} retry={reload} /></div> : data.items.length === 0 ? <Empty icon={Package} title={archived ? 'No archived products' : 'No products yet'} hint="Add your first product to start selling." action={write && productAccess && !archived && <button className="btn-primary" onClick={() => setEdit({})}>Add product</button>} /> : (
        <><Table head={['Product', 'Price', 'Stock', 'Status', '']}>{data.items.map((p) => { const avail = p.stock - p.reserved; return (
          <tr key={p._id}><td className="px-4 py-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.sku || '—'}{p.category?.name ? ` · ${p.category.name}` : ''}</p></td><td className="px-4 py-3">{naira(p.price)}</td>
            <td className="px-4 py-3">{p.trackStock ? <span className={avail <= p.lowStockThreshold ? 'font-semibold text-danger' : ''}>{avail}{p.reserved ? <span className="text-xs text-muted"> ({p.reserved} held)</span> : null}</span> : <span className="text-muted">Not tracked</span>}</td>
            <td className="px-4 py-3">{p.archived ? <Badge>closed</Badge> : p.published ? <Badge tone="ok">Published</Badge> : <Badge>draft</Badge>}</td>
            <td className="px-4 py-3 text-right">{write && productAccess && <><button className="btn-ghost !min-h-[36px] !py-1" onClick={() => setEdit(p)}>Edit</button><button className="btn-ghost !min-h-[36px] !py-1" onClick={() => run(async () => { await api(`/catalog/products/${p._id}/archive`, { method: 'POST', biz: true, body: { archived: !p.archived } }); reload(); }, p.archived ? 'Restored' : 'Archived')}>{p.archived ? 'Restore' : 'Archive'}</button></>}</td></tr>); })}</Table>
          <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} /></>)}</Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit product' : 'Add product'} wide>{edit && <ProductForm product={edit._id ? edit : null} categories={cats.data?.categories || []} onDone={() => { setEdit(null); reload(); }} />}</Modal>
      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="Categories">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/catalog/categories', { method: 'POST', biz: true, body: { name: catName } }); setCatName(''); cats.reload(); }, 'Category added'); }}><input className="input" placeholder="New category" value={catName} onChange={(e) => setCatName(e.target.value)} required /><button className="btn-primary">Add</button></form>
        <ul className="mt-4 divide-y divide-line">{(cats.data?.categories || []).map((c) => <li key={c._id} className="flex items-center justify-between py-2 text-sm">{c.name}<button className="text-danger" onClick={() => run(async () => { await api(`/catalog/categories/${c._id}`, { method: 'DELETE', biz: true }); cats.reload(); }, 'Removed')}>Remove</button></li>)}</ul>
      </Modal>
    </>
  );
}
