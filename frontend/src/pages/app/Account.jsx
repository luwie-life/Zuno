import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Smartphone, LifeBuoy } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, dateTime, label } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, Notice, PageHeader, Select, Textarea, useApi, useAction, useToast } from '../../components/ui.jsx';

const SUPPORT_CATS = [['account_access', 'Login and account access'], ['account_recovery', 'Account recovery'], ['store_setup', 'Store setup'], ['products_inventory', 'Products and inventory'], ['pos_sales', 'POS and sales'], ['payments', 'Payments'], ['subscriptions', 'Subscriptions'], ['mobile_app', 'Branded mobile app'], ['other', 'Other']];

export function SupportPage() {
  const { data, loading, error, reload } = useApi(() => api('/support', { biz: true }), []);
  const [open, setOpen] = useState(null); const [add, setAdd] = useState(false); const [f, setF] = useState({ category: 'other', subject: '', message: '' }); const [err, setErr] = useState(null);
  const create = async (e) => { e.preventDefault(); setErr(null); try { const r = await api('/support', { method: 'POST', biz: true, body: f }); setAdd(false); setF({ category: 'other', subject: '', message: '' }); reload(); setOpen(r.ticket.id); } catch (x) { setErr(x); } };
  return (<>
    <PageHeader title="Support" actions={<button className="btn-primary" onClick={() => setAdd(true)}><Plus className="h-4 w-4" />New request</button>} />
    {loading ? <Loading /> : error ? <ErrorNote error={error} /> : data.items.length === 0 ? <Empty icon={LifeBuoy} title="No support requests" hint="Ask us anything about your store, payments or account." /> : <Card><ul className="divide-y divide-line">{data.items.map((t) => <li key={t.id}><button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-forest-50/50" onClick={() => setOpen(t.id)}><div className="min-w-0"><p className="truncate font-medium">{t.subject}</p><p className="text-xs text-muted">{t.reference} · {label(t.category)} · {dateTime(t.updatedAt)}</p></div><Badge>{t.status}</Badge></button></li>)}</ul></Card>}
    <Modal open={add} onClose={() => setAdd(false)} title="New support request"><form onSubmit={create} className="space-y-4"><ErrorNote error={err} /><Select id="sc" label="Topic" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{SUPPORT_CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select><Input id="ss" label="Subject" required value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /><Textarea id="sm" label="How can we help?" required minLength={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /><p className="text-xs text-muted">Never include passwords or card numbers.</p><button className="btn-primary w-full">Send request</button></form></Modal>
    <Modal open={!!open} onClose={() => setOpen(null)} title="Support request" wide>{open && <Thread id={open} onChange={reload} />}</Modal>
  </>);
}
function Thread({ id, onChange }) {
  const { data, loading, error, reload } = useApi(() => api(`/support/${id}`, { biz: true }), [id]); const [msg, setMsg] = useState(''); const [run, busy] = useAction();
  if (loading) return <Loading />; if (error) return <ErrorNote error={error} />;
  const t = data.ticket;
  return <div className="space-y-4"><div className="flex items-center gap-2"><span className="font-semibold">{t.reference}</span><Badge>{t.status}</Badge></div><p className="font-medium">{t.subject}</p>
    <ul className="space-y-3">{t.messages.map((m, i) => <li key={i} className={`rounded-lg p-3 text-sm ${m.author === 'staff' ? 'bg-forest-50' : 'bg-paper'}`}><p className="text-xs text-muted">{m.author === 'staff' ? 'Zuno support' : 'You'} · {dateTime(m.at)}</p><p className="whitespace-pre-line">{m.body}</p></li>)}</ul>
    {t.status !== 'closed' && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await api(`/support/${id}/reply`, { method: 'POST', biz: true, body: { message: msg } }); setMsg(''); reload(); onChange(); }); }}><Textarea id="rp" label="Reply" required value={msg} onChange={(e) => setMsg(e.target.value)} /><button className="btn-primary" disabled={busy}>Send</button></form>}</div>;
}

const FEATURES = ['Product catalogue', 'Online ordering', 'Push notifications', 'Loyalty / rewards', 'Customer accounts', 'Order tracking'];
export function MobileAppPage() {
  const { ctx, can } = useAuth(); const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api('/mobile-apps', { biz: true }), []); const pricing = useApi(() => api('/mobile-apps/pricing', { auth: false }), []);
  const [open, setOpen] = useState(null); const [add, setAdd] = useState(false); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const b = ctx?.business;
  const blank = { businessName: b?.name || '', applicantName: '', email: b?.email || '', phone: b?.phone || '', category: b?.category || '', storeSlug: b?.slug || '', reason: '', platform: 'both', features: [], brandAssets: '', additional: '', preferredContact: 'email' };
  const [f, setF] = useState(blank);
  const submit = async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { const body = { ...f, brandAssets: f.brandAssets.split('\n').map((s) => s.trim()).filter(Boolean), submit: true }; if (!body.category) delete body.category; await api('/mobile-apps', { method: 'POST', biz: true, body }); setAdd(false); toast('Application submitted. No payment is taken.'); reload(); } catch (x) { setErr(x); } finally { setBusy(false); } };
  return (<>
    <PageHeader title="Branded mobile app" sub="A custom Android and/or iOS app with your brand, quoted individually." actions={can('billing.manage') && <button className="btn-primary" onClick={() => { setF(blank); setAdd(true); }}><Plus className="h-4 w-4" />Apply for a mobile app</button>} />
    {pricing.data && <Notice>Indicative starting prices: setup from <strong>{naira(pricing.data.setupFrom)}</strong>, support and maintenance from <strong>{naira(pricing.data.monthlyFrom)}/month</strong>. Applying is free. You are only charged if you approve a quotation.</Notice>}
    <div className="mt-4">{loading ? <Loading /> : error ? <ErrorNote error={error} /> : data.items.length === 0 ? <Empty icon={Smartphone} title="No applications yet" hint="Apply to receive a quotation for your own branded app." /> : <Card><ul className="divide-y divide-line">{data.items.map((a) => <li key={a.id}><button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-forest-50/50" onClick={() => setOpen(a.id)}><div><p className="font-medium">{a.reference} · {label(a.form.platform)}</p><p className="text-xs text-muted">{dateTime(a.updatedAt)}</p></div><Badge>{a.status}</Badge></button></li>)}</ul></Card>}</div>
    <Modal open={add} onClose={() => setAdd(false)} title="Apply for a mobile app" wide><form onSubmit={submit} className="space-y-4"><ErrorNote error={err} />
      <div className="grid gap-4 sm:grid-cols-2"><Input id="a1" label="Business name" required value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} /><Input id="a2" label="Your name" required value={f.applicantName} onChange={(e) => setF({ ...f, applicantName: e.target.value })} /><Input id="a3" label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><Input id="a4" label="Phone" type="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <Select id="a5" label="Platform" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="android">Android</option><option value="ios">iOS</option><option value="both">Both</option></Select>
      <Textarea id="a6" label="Why do you want an app?" required minLength={10} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      <fieldset><legend className="label">Features you want</legend><div className="grid gap-2 sm:grid-cols-2">{FEATURES.map((x) => <label key={x} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.features.includes(x)} onChange={(e) => setF({ ...f, features: e.target.checked ? [...f.features, x] : f.features.filter((y) => y !== x) })} />{x}</label>)}</div></fieldset>
      <Textarea id="a7" label="Logo / brand asset links (optional, one per line)" rows={2} value={f.brandAssets} onChange={(e) => setF({ ...f, brandAssets: e.target.value })} />
      <Textarea id="a8" label="Anything else? (optional)" rows={2} value={f.additional} onChange={(e) => setF({ ...f, additional: e.target.value })} />
      <Select id="a9" label="Preferred contact" value={f.preferredContact} onChange={(e) => setF({ ...f, preferredContact: e.target.value })}><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></Select>
      <button className="btn-primary w-full" disabled={busy}>Submit application</button></form></Modal>
    <Modal open={!!open} onClose={() => setOpen(null)} title="Application" wide>{open && <AppDetail id={open} onChange={reload} />}</Modal>
  </>);
}
function AppDetail({ id, onChange }) {
  const { data, loading, error, reload } = useApi(() => api(`/mobile-apps/${id}`, { biz: true }), [id]); const [msg, setMsg] = useState(''); const [run, busy] = useAction();
  if (loading) return <Loading />; if (error) return <ErrorNote error={error} />;
  const a = data.application; const setStatus = (status, ok) => run(async () => { await api(`/mobile-apps/${id}/status`, { method: 'POST', biz: true, body: { status } }); reload(); onChange(); }, ok);
  return <div className="space-y-4 text-sm"><div className="flex items-center gap-2"><span className="font-display text-lg font-bold">{a.reference}</span><Badge>{a.status}</Badge></div>
    {a.status === 'more_info_required' && <Notice tone="warn">We need more information. Reply below.</Notice>}
    {a.quotation && <Card className="p-4"><h3 className="font-semibold">Quotation</h3><p>Setup: <strong>{naira(a.quotation.setupFee)}</strong> · Support: <strong>{naira(a.quotation.monthlyFee)}/month</strong></p>{a.quotation.notes && <p className="text-muted">{a.quotation.notes}</p>}{a.status === 'quotation_issued' && <div className="mt-3 flex gap-2"><button className="btn-primary" disabled={busy} onClick={() => setStatus('approved', 'Quotation accepted')}>Accept quotation</button><button className="btn-secondary" disabled={busy} onClick={() => setStatus('rejected', 'Quotation declined')}>Decline</button></div>}<p className="mt-2 text-xs text-muted">Setup payment: {label(a.setupPayment.status)}. Accepting does not charge you automatically; our team will arrange payment with you.</p></Card>}
    <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-muted">Platform</dt><dd>{label(a.form.platform)}</dd></div><div><dt className="text-muted">Contact</dt><dd>{a.form.email} · {a.form.phone}</dd></div><div className="sm:col-span-2"><dt className="text-muted">Reason</dt><dd>{a.form.reason}</dd></div>{a.form.features?.length > 0 && <div className="sm:col-span-2"><dt className="text-muted">Features</dt><dd>{a.form.features.join(', ')}</dd></div>}</dl>
    {a.progress.length > 0 && <div><h3 className="font-semibold">Progress</h3><ul className="mt-1 space-y-1 text-muted">{a.progress.map((p, i) => <li key={i}>{dateTime(p.at)}: {p.note}</li>)}</ul></div>}
    {a.delivery && <Card className="p-4"><h3 className="font-semibold">Delivery</h3>{a.delivery.notes && <p>{a.delivery.notes}</p>}{a.delivery.androidUrl && <p><a className="underline" href={a.delivery.androidUrl} target="_blank" rel="noreferrer">Android link</a></p>}{a.delivery.iosUrl && <p><a className="underline" href={a.delivery.iosUrl} target="_blank" rel="noreferrer">iOS link</a></p>}</Card>}
    <div><h3 className="font-semibold">Messages</h3><ul className="mt-2 space-y-2">{a.messages.map((m, i) => <li key={i} className={`rounded-lg p-3 ${m.author === 'staff' ? 'bg-forest-50' : 'bg-paper'}`}><p className="text-xs text-muted">{m.author === 'staff' ? 'Zuno' : 'You'} · {dateTime(m.at)}</p>{m.body}</li>)}</ul>
      {!['delivered', 'rejected', 'cancelled'].includes(a.status) && <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); run(async () => { await api(`/mobile-apps/${id}/message`, { method: 'POST', biz: true, body: { message: msg } }); setMsg(''); reload(); onChange(); }); }}><Textarea id="am" label="Send a message" required value={msg} onChange={(e) => setMsg(e.target.value)} /><button className="btn-secondary" disabled={busy}>Send</button></form>}</div>
    {['draft', 'submitted', 'under_review', 'more_info_required', 'quotation_issued', 'approved'].includes(a.status) && <button className="text-danger underline" onClick={() => window.confirm('Cancel this application?') && setStatus('cancelled', 'Application cancelled')}>Cancel application</button>}
    <details><summary className="cursor-pointer font-medium">History</summary><ul className="mt-1 text-xs text-muted">{a.history.map((h, i) => <li key={i}>{dateTime(h.at)} · {h.from ? `${label(h.from)} → ` : ''}{label(h.to)}</li>)}</ul></details></div>;
}

export function Team() {
  const { user } = useAuth(); const { data, loading, error, reload } = useApi(() => api('/businesses/current/members', { biz: true }), []); const [f, setF] = useState({ email: '', role: 'cashier' }); const [err, setErr] = useState(null); const [run] = useAction();
  const add = async (e) => { e.preventDefault(); setErr(null); try { await api('/businesses/current/members', { method: 'POST', biz: true, body: f }); setF({ email: '', role: 'cashier' }); reload(); } catch (x) { setErr(x); } };
  return (<><PageHeader title="Team" sub="Owners manage everything. Managers run daily operations. Cashiers use the POS." />
    <Card className="mb-5 p-5"><h2 className="font-semibold">Add a team member</h2><p className="text-xs text-muted">They need a Zuno account first. Ask them to register, then add their email here.</p><form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_auto]"><div className="sm:col-span-3"><ErrorNote error={err} /></div><input className="input" type="email" required placeholder="Their email" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><select className="input" aria-label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="cashier">Cashier</option><option value="manager">Manager</option></select><button className="btn-primary">Add</button></form></Card>
    <Card>{loading ? <Loading /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : <ul className="divide-y divide-line">{data.members.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium">{m.user.name}</p><p className="text-xs text-muted">{m.user.email}</p></div>{m.role === 'owner' ? <Badge tone="ok">Owner</Badge> : <div className="flex items-center gap-2"><select className="input !w-auto !min-h-[36px] !py-1" aria-label={`Role for ${m.user.name}`} value={m.role} onChange={(e) => run(async () => { await api(`/businesses/current/members/${m.id}`, { method: 'PATCH', biz: true, body: { role: e.target.value } }); reload(); }, 'Role updated')}><option value="manager">Manager</option><option value="cashier">Cashier</option></select><button className="text-danger" onClick={() => window.confirm(`Remove ${m.user.name}?`) && run(async () => { await api(`/businesses/current/members/${m.id}`, { method: 'DELETE', biz: true }); reload(); }, 'Removed')}>Remove</button></div>}</li>)}</ul>}</Card></>);
}

export function SettingsPage() {
  const { ctx, refresh } = useAuth(); const b = ctx.business; const toast = useToast();
  const [f, setF] = useState({ name: b.name, category: b.category || '', description: b.description || '', phone: b.phone || '', email: b.email || '', line: b.address?.line || '', city: b.address?.city || '', state: b.address?.state || '', logoUrl: b.logoUrl || '', brandColor: b.brandColor || '#0B3D2E', deliveryFee: String((b.deliveryFee || 0) / 100) });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const save = async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { await api('/businesses/current', { method: 'PATCH', biz: true, body: { name: f.name, category: f.category, description: f.description, phone: f.phone, email: f.email, address: { line: f.line, city: f.city, state: f.state }, logoUrl: f.logoUrl, brandColor: f.brandColor, deliveryFee: Math.round(Number(f.deliveryFee || 0) * 100) } }); await refresh(); toast('Saved'); } catch (x) { setErr(x); } finally { setBusy(false); } };
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (<><PageHeader title="Business settings" /><form onSubmit={save} className="card max-w-2xl space-y-4 p-5"><ErrorNote error={err} />
    <Input id="bn" label="Business name" required value={f.name} onChange={on('name')} />
    <div className="grid gap-4 sm:grid-cols-2"><Input id="bc" label="Category" value={f.category} onChange={on('category')} /><Input id="bp" label="Phone" type="tel" value={f.phone} onChange={on('phone')} /></div>
    <Input id="be" label="Business email" type="email" value={f.email} onChange={on('email')} />
    <Textarea id="bd" label="Short description (shown on your store)" rows={3} value={f.description} onChange={on('description')} />
    <Input id="ba" label="Street address" value={f.line} onChange={on('line')} /><div className="grid gap-4 sm:grid-cols-2"><Input id="bci" label="City" value={f.city} onChange={on('city')} /><Input id="bs" label="State" value={f.state} onChange={on('state')} /></div>
    <Input id="bl" label="Logo link (https)" value={f.logoUrl} onChange={on('logoUrl')} />
    <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="bcol">Brand colour</label><input id="bcol" type="color" className="h-11 w-full rounded-lg border border-line bg-white p-1" value={f.brandColor} onChange={on('brandColor')} /></div><Input id="bdf" label="Delivery fee (₦)" inputMode="decimal" value={f.deliveryFee} onChange={on('deliveryFee')} /></div>
    <p className="text-xs text-muted">Store address: /store/{b.slug}</p><button className="btn-primary" disabled={busy}>Save changes</button></form></>);
}
