import { useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, dateTime, label } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, Notice, PageHeader, Pager, Select, Table, Textarea, useApi, useAction } from '../../components/ui.jsx';

const NEXT = { new: [], processing: ['ready', 'out_for_delivery'], ready: ['out_for_delivery', 'delivered'], out_for_delivery: ['delivered'] };

function OrderDetail({ id, onChange }) {
  const { can } = useAuth(); const { data, loading, error, reload } = useApi(() => api(`/orders/${id}`, { biz: true }), [id]);
  const [run, busy] = useAction(); const [cancel, setCancel] = useState(false); const [reason, setReason] = useState(''); const [restock, setRestock] = useState(false);
  if (loading) return <Loading />; if (error) return <ErrorNote error={error} />;
  const o = data.order; const done = () => { reload(); onChange(); };
  const nextOptions = o.paymentStatus === 'paid' ? (o.fulfilmentStatus === 'new' ? ['processing'] : NEXT[o.fulfilmentStatus] || []) : [];
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2"><span className="font-display text-lg font-bold">{o.ref}</span><Badge>{o.paymentStatus}</Badge><Badge>{o.fulfilmentStatus}</Badge></div>
      <div className="rounded-lg bg-paper p-3"><p className="font-medium">{o.customerInfo.name}</p><p>{o.customerInfo.phone} · {o.customerInfo.email}</p><p className="text-muted">{[o.customerInfo.address?.line, o.customerInfo.address?.city, o.customerInfo.address?.state].filter(Boolean).join(', ')}</p>{o.customerInfo.note && <p className="mt-1 italic">“{o.customerInfo.note}”</p>}</div>
      <ul className="divide-y divide-line">{o.items.map((i, k) => <li key={k} className="flex justify-between py-2"><span>{i.qty} × {i.name}</span><span>{naira(i.lineTotal)}</span></li>)}</ul>
      <div className="space-y-1 border-t border-line pt-2"><div className="flex justify-between"><span>Delivery</span><span>{naira(o.deliveryFee)}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>{naira(o.total)}</span></div></div>
      {o.paymentStatus === 'refund_pending' && <Notice tone="warn">This order needs a refund.{can('orders.refund') && <button className="ml-2 font-semibold underline" disabled={busy} onClick={() => { const r = window.prompt('Reason for refund'); if (r) run(async () => { await api(`/orders/${id}/refund`, { method: 'POST', biz: true, body: { reason: r } }); done(); }, 'Refund submitted to Paystack'); }}>Refund via Paystack</button>}</Notice>}
      {can('orders.write') && nextOptions.length > 0 && <div className="flex flex-wrap gap-2">{nextOptions.map((s) => <button key={s} className="btn-primary" disabled={busy} onClick={() => run(async () => { await api(`/orders/${id}/fulfilment`, { method: 'PATCH', biz: true, body: { status: s } }); done(); }, `Marked ${label(s)}`)}>Mark {label(s).toLowerCase()}</button>)}</div>}
      {can('orders.write') && !['delivered', 'cancelled'].includes(o.fulfilmentStatus) && ['pending', 'paid'].includes(o.paymentStatus) && <button className="btn-secondary w-full" onClick={() => setCancel(!cancel)}>Cancel order</button>}
      {cancel && <div className="space-y-3 rounded-lg border border-line p-3"><Textarea id="cr" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />{o.paymentStatus === 'paid' && <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4" checked={restock} onChange={(e) => setRestock(e.target.checked)} />Return these items to stock (only tick if the goods are back on your shelf)</label>}<button className="btn-danger w-full" disabled={busy || reason.length < 3} onClick={() => run(async () => { await api(`/orders/${id}/cancel`, { method: 'POST', biz: true, body: { reason, restock } }); setCancel(false); done(); }, 'Order cancelled')}>Confirm cancellation</button></div>}
      <details><summary className="cursor-pointer font-medium">History</summary><ul className="mt-2 space-y-1 text-xs text-muted">{o.history.map((h, i) => <li key={i}>{dateTime(h.at)} · {label(h.action)}{h.note ? `: ${h.note}` : ''}</li>)}</ul></details>
    </div>
  );
}

export default function Orders() {
  const [f, setF] = useState({ search: '', payment: '', fulfilment: '' }); const [page, setPage] = useState(1); const [open, setOpen] = useState(null);
  const { data, loading, error, reload } = useApi(() => api(`/orders${qs({ ...f, page })}`, { biz: true }), [f, page]);
  return (
    <>
      <PageHeader title="Orders" sub="Online storefront orders. POS sales are under POS → Sales." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search reference, name, phone" aria-label="Search" value={f.search} onChange={(e) => { setF({ ...f, search: e.target.value }); setPage(1); }} /></div>
        <select className="input" aria-label="Payment status" value={f.payment} onChange={(e) => { setF({ ...f, payment: e.target.value }); setPage(1); }}><option value="">Any payment</option>{['pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        <select className="input" aria-label="Fulfilment status" value={f.fulfilment} onChange={(e) => { setF({ ...f, fulfilment: e.target.value }); setPage(1); }}><option value="">Any fulfilment</option>{['new', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
      <Card>{loading ? <Loading /> : error ? <div className="p-4"><ErrorNote error={error} retry={reload} /></div> : data.items.length === 0 ? <Empty icon={ShoppingBag} title="No orders found" hint="Orders from your online store will appear here." /> : (
        <><Table head={['Order', 'Customer', 'Total', 'Payment', 'Fulfilment', 'Placed']}>{data.items.map((o) => <tr key={o._id} className="cursor-pointer hover:bg-forest-50/50" onClick={() => setOpen(o._id)}><td className="px-4 py-3 font-medium">{o.ref}</td><td className="px-4 py-3">{o.customerInfo?.name}</td><td className="px-4 py-3">{naira(o.total)}</td><td className="px-4 py-3"><Badge>{o.paymentStatus}</Badge></td><td className="px-4 py-3"><Badge>{o.fulfilmentStatus}</Badge></td><td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td></tr>)}</Table><Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} /></>)}</Card>
      <Modal open={!!open} onClose={() => setOpen(null)} title="Order details" wide>{open && <OrderDetail id={open} onChange={reload} />}</Modal>
    </>
  );
}
