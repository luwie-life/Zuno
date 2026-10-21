import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { api, qs } from '../../lib/api.js';
import { naira, label } from '../../lib/format.js';
import { Card, Empty, ErrorNote, Loading, Notice, PageHeader, Table, useApi } from '../../components/ui.jsx';

const iso = (d) => d.toISOString().slice(0, 10);
export default function Reports() {
  const [from, setFrom] = useState(iso(new Date(Date.now() - 30 * 864e5))); const [to, setTo] = useState(iso(new Date()));
  const { data, loading, error, reload } = useApi(() => api(`/reports/summary${qs({ from, to: `${to}T23:59:59.999Z` })}`, { biz: true }), [from, to]);
  const s = data?.summary; const e = s?.enhanced;
  const Stat = ({ t, v, sub }) => <Card className="p-4"><p className="text-sm text-muted">{t}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p>{sub && <p className="mt-1 text-xs text-muted">{sub}</p>}</Card>;
  return (<>
    <PageHeader title="Reports" sub="Calculated from your verified records. Unpaid, failed and refunded orders are not counted as sales." />
    <div className="mb-5 flex flex-wrap items-end gap-3"><div><label className="label" htmlFor="f">From</label><input id="f" type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div><div><label className="label" htmlFor="t">To</label><input id="t" type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div></div>
    {loading ? <Loading /> : error ? <ErrorNote error={error} retry={reload} /> : (<>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat t="Net sales" v={naira(s.netSales)} sub="Online paid + POS paid, minus POS refunds" /><Stat t="Online store" v={naira(s.online.revenue)} sub={`${s.online.orders} paid orders`} /><Stat t="Physical POS" v={naira(s.pos.revenue)} sub={`${s.pos.transactions} transactions · ${naira(s.pos.refunds)} refunded`} /><Stat t="Awaiting payment" v={s.pendingOnlineOrders} sub="Online orders not yet paid" /></div>
      {s.online.orders + s.pos.transactions === 0 && <div className="mt-5"><Empty icon={BarChart3} title="No sales in this period" hint="Try a wider date range." /></div>}
      {e ? <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card><h2 className="px-4 pt-4 font-semibold">Best-selling products</h2>{e.topProducts.length ? <Table head={['Product', 'Units', 'Revenue']}>{e.topProducts.map((p) => <tr key={p._id}><td className="px-4 py-2.5">{p.name}</td><td className="px-4 py-2.5">{p.qty}</td><td className="px-4 py-2.5">{naira(p.revenue)}</td></tr>)}</Table> : <p className="p-4 text-sm text-muted">No data yet.</p>}</Card>
        <Card><h2 className="px-4 pt-4 font-semibold">POS payment methods</h2>{e.posPaymentMethods.length ? <Table head={['Method', 'Sales', 'Total']}>{e.posPaymentMethods.map((m) => <tr key={m.method}><td className="px-4 py-2.5">{label(m.method)}</td><td className="px-4 py-2.5">{m.count}</td><td className="px-4 py-2.5">{naira(m.total)}</td></tr>)}</Table> : <p className="p-4 text-sm text-muted">No data yet.</p>}</Card>
        <Card className="p-4"><h2 className="font-semibold">Cancellations and returns</h2><p className="mt-2 text-sm">Online orders cancelled: <strong>{e.onlineCancellations}</strong></p><p className="text-sm">POS returns recorded: <strong>{e.posReturns}</strong></p></Card>
        <Card><h2 className="px-4 pt-4 font-semibold">Low stock now</h2>{e.lowStock.length ? <Table head={['Product', 'Available', 'Alert at']}>{e.lowStock.map((p) => <tr key={p.id}><td className="px-4 py-2.5">{p.name}</td><td className="px-4 py-2.5 text-danger">{p.available}</td><td className="px-4 py-2.5">{p.threshold}</td></tr>)}</Table> : <p className="p-4 text-sm text-muted">Nothing is low on stock.</p>}</Card>
      </div> : <div className="mt-6"><Notice>Best sellers, payment methods and low-stock reports are part of plans with enhanced reports.</Notice></div>}</>)}
  </>);
}
