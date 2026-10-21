import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Plus, Users } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, dateTime } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, PageHeader, Pager, Table, useApi } from '../../components/ui.jsx';

export default function Customers() {
  const { hasFeature, can, ctx } = useAuth(); const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [open, setOpen] = useState(null); const [add, setAdd] = useState(false); const [f, setF] = useState({ name: '', phone: '', email: '' }); const [err, setErr] = useState(null);
  const { data, loading, error, reload } = useApi(() => (hasFeature('customers') ? api(`/customers${qs({ search, page })}`, { biz: true }) : Promise.resolve(null)), [search, page]);
  if (!hasFeature('customers')) {
    const active = ['active', 'grace'].includes(ctx?.subscription?.state);
    const planName = ctx?.subscription?.plan?.name || 'your selected plan';
    return <><PageHeader title="Customers" /><Empty icon={Lock} title={active ? `Customer management is not included in ${planName}` : 'Activate your plan to unlock customer management'} hint={active ? 'Choose a plan with customer management, or contact support if this feature should already be available.' : `Your subscription is ${ctx?.subscription?.state || 'not active'}. Complete the required setup or payment in Billing; customer management unlocks once your subscription is active.`} action={can('billing.manage') && <Link className="btn-primary" to="/app/billing">Review plan and billing</Link>} /></>;
  }
  const save = async (e) => { e.preventDefault(); setErr(null); try { await api('/customers', { method: 'POST', biz: true, body: { name: f.name, phone: f.phone || undefined, email: f.email || undefined } }); setAdd(false); setF({ name: '', phone: '', email: '' }); reload(); } catch (x) { setErr(x); } };
  return (<>
    <PageHeader title="Customers" sub="Online buyers are added automatically. Walk-in customers do not need to be recorded." actions={can('customers.write') && <button className="btn-primary" onClick={() => setAdd(true)}><Plus className="h-4 w-4" />Add customer</button>} />
    <input className="input mb-4 max-w-xs" placeholder="Search name, phone, email" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
    <Card>{loading ? <Loading /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : !data || data.items.length === 0 ? <Empty icon={Users} title="No customers yet" /> : <><Table head={['Name', 'Phone', 'Email', 'Orders', 'Spent']}>{data.items.map((c) => <tr key={c._id} className="cursor-pointer hover:bg-forest-50/50" onClick={() => setOpen(c._id)}><td className="px-4 py-3 font-medium">{c.name}</td><td className="px-4 py-3">{c.phone}</td><td className="px-4 py-3">{c.email}</td><td className="px-4 py-3">{c.orderCount}</td><td className="px-4 py-3">{naira(c.totalSpent)}</td></tr>)}</Table><Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} /></>}</Card>
    <Modal open={add} onClose={() => setAdd(false)} title="Add customer"><form onSubmit={save} className="space-y-4"><ErrorNote error={err} /><Input id="cn" label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Input id="cp" label="Phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><Input id="ce" label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><button className="btn-primary w-full">Save</button></form></Modal>
    <Modal open={!!open} onClose={() => setOpen(null)} title="Customer" wide>{open && <CustomerDetail id={open} />}</Modal>
  </>);
}
function CustomerDetail({ id }) {
  const { data, loading, error } = useApi(() => api(`/customers/${id}`, { biz: true }), [id]);
  if (loading) return <Loading />; if (error) return <ErrorNote error={error} />;
  const c = data.customer;
  return <div className="space-y-4 text-sm"><div><p className="text-lg font-bold">{c.name}</p><p className="text-muted">{c.phone} {c.email}</p></div>
    <div><h3 className="mb-1 font-semibold">Online orders</h3>{data.orders.length ? <ul className="divide-y divide-line">{data.orders.map((o) => <li key={o._id} className="flex items-center justify-between py-2"><span>{o.ref} · {dateTime(o.createdAt)}</span><span className="flex items-center gap-2">{naira(o.total)}<Badge>{o.paymentStatus}</Badge></span></li>)}</ul> : <p className="text-muted">None</p>}</div>
    <div><h3 className="mb-1 font-semibold">POS sales</h3>{data.sales.length ? <ul className="divide-y divide-line">{data.sales.map((s) => <li key={s._id} className="flex items-center justify-between py-2"><span>{s.receiptNo} · {dateTime(s.createdAt)}</span><span>{naira(s.total)}</span></li>)}</ul> : <p className="text-muted">None</p>}</div></div>;
}
