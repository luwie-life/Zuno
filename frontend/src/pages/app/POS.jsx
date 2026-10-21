import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Printer, Search, ShoppingCart, Trash2, Lock } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, toKobo, dateTime, newKey, label } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, Notice, PageHeader, Pager, Select, Spinner, Table, Textarea, useApi, useAction, useToast } from '../../components/ui.jsx';

export function Receipt({ r }) {
  return (
    <div className="print-area mx-auto w-full max-w-[320px] bg-white p-4 font-mono text-xs leading-snug text-black">
      <div className="text-center"><p className="text-base font-bold">{r.business.name}</p>{r.business.phone && <p>{r.business.phone}</p>}{r.business.address?.city && <p>{[r.business.address.line, r.business.address.city].filter(Boolean).join(', ')}</p>}</div>
      <div className="my-2 border-t border-dashed border-black" />
      <p>Receipt: {r.receiptNo}</p><p>{dateTime(r.date)}</p>{r.cashier && <p>Cashier: {r.cashier}</p>}{r.customer && <p>Customer: {r.customer}</p>}
      <div className="my-2 border-t border-dashed border-black" />
      {r.items.map((i, k) => <div key={k} className="mb-1"><p>{i.name}</p><div className="flex justify-between"><span>{i.qty} × {naira(i.unitPrice)}</span><span>{naira(i.lineTotal)}</span></div></div>)}
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex justify-between"><span>Subtotal</span><span>{naira(r.subtotal)}</span></div>
      {r.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{naira(r.discount)}</span></div>}
      <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{naira(r.total)}</span></div>
      <p className="mt-1">Paid by: {label(r.paymentMethod)} ({r.paymentStatus}{r.paymentVerification === 'gateway_verified' ? ' · gateway verified' : r.paymentVerification === 'manual_recorded' ? ' · manually recorded' : r.paymentVerification === 'cash_recorded' ? ' · cash recorded' : ''})</p>
      {r.paymentReference && <p>Ref: {r.paymentReference}</p>}
      {r.cashReceived ? <><p>Cash received: {naira(r.cashReceived)}</p><p>Change: {naira(r.change)}</p></> : null}
      <div className="my-2 border-t border-dashed border-black" /><p className="text-center">Thank you</p>
    </div>
  );
}

export function ReceiptModal({ saleId, onClose }) {
  const { data, loading, error } = useApi(() => (saleId ? api(`/pos/sales/${saleId}/receipt`, { biz: true }) : Promise.resolve(null)), [saleId]);
  return (
    <Modal open={!!saleId} onClose={onClose} title="Receipt">
      {loading ? <Loading /> : error ? <ErrorNote error={error} /> : data && <><Receipt r={data.receipt} /><div className="mt-4 flex gap-2 print:hidden"><button className="btn-primary flex-1" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button><button className="btn-secondary" onClick={onClose}>Close</button></div><p className="mt-2 text-center text-xs text-muted print:hidden">Uses your browser's print dialog (works with standard and receipt printers that appear there).</p></>}
    </Modal>
  );
}

export default function POS() {
  const { can, hasFeature, ctx } = useAuth(); const toast = useToast();
  const [search, setSearch] = useState(''); const [cat, setCat] = useState('');
  const { data, loading, error, reload } = useApi(() => api(`/pos/products${qs({ search, category: cat })}`, { biz: true }), [search, cat]);
  const cats = useApi(() => api('/catalog/categories', { biz: true }), []);
  const [cart, setCart] = useState([]); const [pay, setPay] = useState(false); const [showCart, setShowCart] = useState(false); const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState({ method: 'cash', discountType: 'amount', discount: '', cash: '', email: '', customerId: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const keyRef = useRef(newKey());
  const customers = useApi(() => (hasFeature('customers') ? api('/customers?limit=100', { biz: true }) : Promise.resolve(null)), []);

  if (!hasFeature('pos')) {
    const active = ['active', 'grace'].includes(ctx?.subscription?.state);
    const planName = ctx?.subscription?.plan?.name || 'your selected plan';
    return <><PageHeader title="POS" /><Empty icon={Lock} title={active ? `POS is not included in ${planName}` : 'Activate your plan to unlock POS'} hint={active ? 'Choose a plan with the integrated POS, or contact support if this feature should already be available.' : `Your subscription is ${ctx?.subscription?.state || 'not active'}. Complete the required setup or payment in Billing; the POS unlocks once your subscription is active.`} action={can('billing.manage') && <Link className="btn-primary" to="/app/billing">Review plan and billing</Link>} /></>;
  }

  const add = (p) => setCart((c) => { const e = c.find((i) => i.id === p.id); const max = p.available ?? 9999; if (e) return c.map((i) => (i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, max) } : i)); return [...c, { id: p.id, name: p.name, price: p.price, qty: 1, max }]; });
  const setQty = (id, q) => setCart((c) => (q <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty: Math.min(q, i.max) } : i))));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const dv = form.discount ? (form.discountType === 'percent' ? Number(form.discount) : toKobo(form.discount)) : 0;
  const disc = Math.min(subtotal, form.discountType === 'percent' ? Math.round((subtotal * Math.min(dv, 100)) / 100) : dv);
  const total = subtotal - disc; // preview only; the server recomputes from its own prices

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const body = { idempotencyKey: keyRef.current, paymentMethod: form.method, items: cart.map((i) => ({ productId: i.id, qty: i.qty })) };
      if (dv > 0) body.discount = { type: form.discountType, value: dv };
      if (form.method === 'cash' && form.cash) body.cashReceived = toKobo(form.cash);
      if (form.customerId) body.customerId = form.customerId;
      if (form.method === 'paystack') body.customerEmail = form.email;
      const r = await api('/pos/sales', { method: 'POST', biz: true, body });
      keyRef.current = newKey(); // new key only after the server answered
      if (r.authorizationUrl) { window.open(r.authorizationUrl, '_blank', 'noopener'); toast('Payment page opened. The sale completes when Paystack confirms.'); setPay(false); setCart([]); setReceipt(r.sale._id); }
      else { setPay(false); setCart([]); setShowCart(false); setForm({ ...form, discount: '', cash: '' }); setReceipt(r.sale._id); reload(); toast(r.duplicate ? 'Sale was already recorded' : 'Sale completed'); }
    } catch (x) { setErr(x); } finally { setBusy(false); }
  };

  const CartPanel = (
    <Card className="flex h-full flex-col p-4">
      <h2 className="flex items-center gap-2 font-semibold"><ShoppingCart className="h-5 w-5" />Current sale</h2>
      <div className="mt-3 flex-1 overflow-y-auto">{cart.length === 0 ? <p className="py-8 text-center text-sm text-muted">Tap a product to add it</p> : <ul className="divide-y divide-line">{cart.map((i) => <li key={i.id} className="flex items-center gap-2 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.name}</p><p className="text-xs text-muted">{naira(i.price)}</p></div><button className="rounded border border-line p-2" aria-label="Decrease" onClick={() => setQty(i.id, i.qty - 1)}><Minus className="h-4 w-4" /></button><span className="w-6 text-center text-sm">{i.qty}</span><button className="rounded border border-line p-2" aria-label="Increase" onClick={() => setQty(i.id, i.qty + 1)}><Plus className="h-4 w-4" /></button><button className="p-2 text-muted" aria-label="Remove" onClick={() => setQty(i.id, 0)}><Trash2 className="h-4 w-4" /></button></li>)}</ul>}</div>
      <div className="mt-3 border-t border-line pt-3"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>{naira(subtotal)}</span></div><button className="btn-primary mt-3 w-full" disabled={!cart.length} onClick={() => { setErr(null); setPay(true); }}>Charge</button>{cart.length > 0 && <button className="btn-ghost mt-1 w-full" onClick={() => setCart([])}>Clear</button>}</div>
    </Card>
  );

  return (
    <>
      <PageHeader title="POS" actions={<Link to="/app/pos/sales" className="btn-secondary">Sales history</Link>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3 flex flex-wrap gap-3"><div className="relative min-w-[180px] flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search name or SKU" aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus /></div>
            {(cats.data?.categories || []).length > 0 && <select className="input w-auto" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All</option>{cats.data.categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}</div>
          {loading ? <Loading /> : error ? <ErrorNote error={error} retry={reload} /> : data.items.length === 0 ? <Empty title="No products" hint="Add products first." /> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{data.items.map((p) => { const out = p.available !== null && p.available <= 0; return (
              <button key={p.id} disabled={out} onClick={() => add(p)} className="card p-3 text-left transition hover:border-forest-500 disabled:opacity-50"><p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{p.name}</p><p className="mt-1 font-display font-bold">{naira(p.price)}</p><p className={`text-xs ${out ? 'text-danger' : 'text-muted'}`}>{p.available === null ? 'Not tracked' : out ? 'Out of stock' : `${p.available} in stock`}</p></button>); })}</div>)}
        </div>
        <div className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">{CartPanel}</div>
      </div>
      <div className="fixed inset-x-0 bottom-16 z-30 px-4 lg:hidden"><button className="btn-primary w-full shadow-lg" onClick={() => setShowCart(true)}><ShoppingCart className="h-4 w-4" />Sale: {cart.reduce((s, i) => s + i.qty, 0)} items · {naira(subtotal)}</button></div>
      <Modal open={showCart} onClose={() => setShowCart(false)} title="Current sale"><div className="h-[60vh] lg:hidden">{CartPanel}</div></Modal>
      <Modal open={pay} onClose={() => !busy && setPay(false)} title="Take payment">
        <div className="space-y-4"><ErrorNote error={err} />
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
          {can('pos.discount') && <div className="grid grid-cols-[1fr_auto] gap-2"><Input id="d" label="Discount" inputMode="decimal" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /><Select id="dt" label="Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}><option value="amount">₦</option><option value="percent">%</option></Select></div>}
          <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{naira(total)}</span></div>
          <Select id="m" label="Payment method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option value="cash">Cash</option><option value="transfer">Bank transfer (confirmed received)</option><option value="card_terminal">Card terminal (approved)</option><option value="paystack">Online payment via Paystack</option></Select>
          {form.method === 'cash' && <Input id="c" label="Cash received (₦)" inputMode="decimal" value={form.cash} onChange={(e) => setForm({ ...form, cash: e.target.value })} hint={form.cash && toKobo(form.cash) >= total ? `Change: ${naira(toKobo(form.cash) - total)}` : undefined} />}
          {form.method === 'paystack' && <Input id="em" label="Customer email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint="Uses your connected Paystack account. Stock is held until payment is verified." />}
          {['transfer', 'card_terminal'].includes(form.method) && <Notice tone="warn">Only continue once you have confirmed the money or approval. The sale is recorded as paid.</Notice>}
          {customers.data && <Select id="cu" label="Customer (optional)" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}><option value="">Walk-in customer</option>{customers.data.items.map((c) => <option key={c._id} value={c._id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}</Select>}
          <button className="btn-primary w-full" disabled={busy || (form.method === 'paystack' && !form.email)} onClick={submit}>{busy ? <Spinner className="text-white" /> : `Complete sale ${naira(total)}`}</button></div>
      </Modal>
      <ReceiptModal saleId={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

export function Sales() {
  const { can } = useAuth(); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [open, setOpen] = useState(null); const [receipt, setReceipt] = useState(null);
  const { data, loading, error, reload } = useApi(() => api(`/pos/sales${qs({ page, search })}`, { biz: true }), [page, search]);
  return (
    <>
      <PageHeader title="POS sales" actions={<Link to="/app/pos" className="btn-secondary">Back to POS</Link>} />
      <input className="input mb-4 max-w-xs" placeholder="Search receipt number" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <Card>{loading ? <Loading /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : data.items.length === 0 ? <Empty title="No sales yet" /> : <><Table head={['Receipt', 'Total', 'Method', 'Status', 'Cashier', 'Date']}>{data.items.map((s) => <tr key={s._id} className="cursor-pointer hover:bg-forest-50/50" onClick={() => setOpen(s._id)}><td className="px-4 py-3 font-medium">{s.receiptNo}</td><td className="px-4 py-3">{naira(s.total)}</td><td className="px-4 py-3">{label(s.paymentMethod)}</td><td className="px-4 py-3"><Badge>{s.status}</Badge></td><td className="px-4 py-3">{s.cashier?.name}</td><td className="px-4 py-3 text-muted">{dateTime(s.createdAt)}</td></tr>)}</Table><Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} /></>}</Card>
      <Modal open={!!open} onClose={() => setOpen(null)} title="Sale details" wide>{open && <SaleDetail id={open} onChange={reload} onReceipt={() => { setReceipt(open); }} />}</Modal>
      <ReceiptModal saleId={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

function SaleDetail({ id, onChange, onReceipt }) {
  const { can } = useAuth(); const { data, loading, error, reload } = useApi(() => api(`/pos/sales/${id}`, { biz: true }), [id]);
  const [run, busy] = useAction(); const [mode, setMode] = useState(null); const [reason, setReason] = useState(''); const [restock, setRestock] = useState(false); const [qtys, setQtys] = useState({});
  if (loading) return <Loading />; if (error) return <ErrorNote error={error} />;
  const s = data.sale; const returned = {}; s.returns.forEach((r) => r.items.forEach((i) => { returned[i.product] = (returned[i.product] || 0) + i.qty; }));
  const done = () => { setMode(null); reload(); onChange(); };
  const canReturn = can('pos.refund') && ['paid', 'partially_refunded'].includes(s.paymentStatus);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2"><span className="font-display text-lg font-bold">{s.receiptNo}</span><Badge>{s.status}</Badge><Badge>{s.paymentStatus}</Badge><span className="text-muted">{dateTime(s.createdAt)}</span></div>
      <ul className="divide-y divide-line">{s.items.map((i) => <li key={i.product} className="flex justify-between py-2"><span>{i.qty} × {i.name}{returned[i.product] ? <span className="text-muted"> ({returned[i.product]} returned)</span> : null}</span><span>{naira(i.lineTotal)}</span></li>)}</ul>
      <div className="space-y-1 border-t border-line pt-2"><div className="flex justify-between"><span>Discount</span><span>{naira(s.discount)}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>{naira(s.total)}</span></div><p className="text-muted">Cashier: {s.cashier?.name} · Channel: Physical POS</p></div>
      {s.returns.length > 0 && <div className="rounded-lg bg-paper p-3 text-xs">{s.returns.map((r, i) => <p key={i}>Return {dateTime(r.at)}: {naira(r.refundAmount)} refunded · {r.restock ? 'restocked' : 'not restocked'} · {r.reason}</p>)}</div>}
      <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={onReceipt}><Printer className="h-4 w-4" />Receipt</button>{canReturn && <><button className="btn-secondary" onClick={() => { setMode('return'); setQtys({}); }}>Return items</button><button className="btn-secondary" onClick={() => setMode('void')}>Void sale</button></>}</div>
      {mode && <div className="space-y-3 rounded-lg border border-line p-3">
        {mode === 'return' && s.items.map((i) => { const left = i.qty - (returned[i.product] || 0); return left > 0 ? <div key={i.product} className="flex items-center justify-between gap-2"><span>{i.name} (up to {left})</span><input type="number" min="0" max={left} className="input !w-20" aria-label={`Quantity of ${i.name} to return`} value={qtys[i.product] || ''} onChange={(e) => setQtys({ ...qtys, [i.product]: Math.min(left, Number(e.target.value) || 0) })} /></div> : null; })}
        <Textarea id="rr" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4" checked={restock} onChange={(e) => setRestock(e.target.checked)} />Put these items back in stock (only if they are sellable)</label>
        {s.paymentMethod === 'paystack' && <Notice>This sale was paid online, so the refund is sent through Paystack.</Notice>}
        <button className="btn-danger w-full" disabled={busy || reason.length < 3 || (mode === 'return' && !Object.values(qtys).some(Boolean))} onClick={() => run(async () => { await api(`/pos/sales/${id}/${mode}`, { method: 'POST', biz: true, body: mode === 'void' ? { restock, reason } : { restock, reason, items: Object.entries(qtys).filter(([, q]) => q > 0).map(([productId, qty]) => ({ productId, qty })) } }); done(); }, mode === 'void' ? 'Sale voided' : 'Return recorded')}>{mode === 'void' ? 'Confirm void' : 'Confirm return'}</button></div>}
    </div>
  );
}
