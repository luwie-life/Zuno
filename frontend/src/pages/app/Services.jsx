import { useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { api } from '../../lib/api.js';
import { fromKobo, naira, toKobo } from '../../lib/format.js';
import { Badge, Card, Empty, ErrorNote, Input, Loading, Modal, Notice, PageHeader, Select, Table, Textarea, useApi, useToast } from '../../components/ui.jsx';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const blankService = () => ({ name: '', description: '', category: '', price: '', durationMinutes: '60', bookingRequirements: '', status: 'active', published: true });
const defaultHours = () => weekdays.map((_, dayOfWeek) => ({ dayOfWeek, open: '09:00', close: '17:00', closed: dayOfWeek === 0 || dayOfWeek === 6 }));

function ServiceEditor({ service, onClose, onSaved }) {
  const [form, setForm] = useState(service ? { ...service, price: fromKobo(service.price), durationMinutes: String(service.durationMinutes) } : blankService());
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const body = { ...form, price: toKobo(form.price), durationMinutes: Number(form.durationMinutes) };
      await api(service ? `/services/${service._id}` : '/services', { method: service ? 'PATCH' : 'POST', biz: true, body });
      onSaved();
    } catch (failure) { setError(failure); } finally { setBusy(false); }
  };
  return <Modal open onClose={onClose} title={service ? 'Edit service' : 'Add service'} wide><form onSubmit={submit} className="space-y-4"><ErrorNote error={error} />
    <Input id="service-name" label="Service name" required value={form.name} onChange={set('name')} />
    <div className="grid gap-4 sm:grid-cols-2"><Input id="service-price" label="Price (₦)" type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} /><Select id="service-duration" label="Duration" value={form.durationMinutes} onChange={set('durationMinutes')}>{[15, 30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes === 60 ? '' : 's'}`}</option>)}</Select></div>
    <Input id="service-category" label="Category (optional)" value={form.category || ''} onChange={set('category')} />
    <Textarea id="service-description" label="Description" rows={3} value={form.description || ''} onChange={set('description')} />
    <Textarea id="service-requirements" label="Booking requirements (optional)" rows={2} value={form.bookingRequirements || ''} onChange={set('bookingRequirements')} hint="Tell customers what to prepare or bring." />
    <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.status === 'active'} onChange={(event) => setForm({ ...form, status: event.target.checked ? 'active' : 'inactive' })} />Accept booking requests</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.published} onChange={set('published')} />Show on public storefront</label></div>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : service ? 'Save service' : 'Create service'}</button>
  </form></Modal>;
}

function AvailabilitySettings({ onSaved }) {
  const { data, loading, error, reload } = useApi(() => api('/services/availability/settings', { biz: true }), []);
  const [form, setForm] = useState(null); const [saveError, setSaveError] = useState(null); const [busy, setBusy] = useState(false); const toast = useToast();
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} retry={reload} />;
  const value = form || { timezone: data.timezone, weeklyHours: data.weeklyHours.length === 7 ? data.weeklyHours : defaultHours(), bookingPolicy: data.bookingPolicy };
  const updateDay = (dayOfWeek, patch) => setForm({ ...value, weeklyHours: value.weeklyHours.map((entry) => entry.dayOfWeek === dayOfWeek ? { ...entry, ...patch } : entry) });
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setSaveError(null);
    try { await api('/services/availability/settings', { method: 'PUT', biz: true, body: value }); setForm(null); await reload(); onSaved(); toast('Availability saved'); }
    catch (failure) { setSaveError(failure); } finally { setBusy(false); }
  };
  return <Card className="p-5"><h2 className="font-semibold">Availability and booking policy</h2><p className="mt-1 text-sm text-muted">Customers request a time; appointments remain pending until you confirm them.</p><form onSubmit={save} className="mt-4 space-y-5"><ErrorNote error={saveError} />
    <Input id="service-timezone" label="Business timezone (IANA)" required value={value.timezone} onChange={(event) => setForm({ ...value, timezone: event.target.value })} placeholder="Africa/Lagos" />
    <div className="space-y-2">{value.weeklyHours.map((day) => <div key={day.dayOfWeek} className="grid items-center gap-2 border-b border-line py-2 sm:grid-cols-[100px_1fr_1fr_auto]"><span className="text-sm font-medium">{weekdays[day.dayOfWeek]}</span><Input id={`open-${day.dayOfWeek}`} aria-label={`${weekdays[day.dayOfWeek]} opening time`} type="time" disabled={day.closed} value={day.open} onChange={(event) => updateDay(day.dayOfWeek, { open: event.target.value })} /><Input id={`close-${day.dayOfWeek}`} aria-label={`${weekdays[day.dayOfWeek]} closing time`} type="time" disabled={day.closed} value={day.close} onChange={(event) => updateDay(day.dayOfWeek, { close: event.target.value })} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={day.closed} onChange={(event) => updateDay(day.dayOfWeek, { closed: event.target.checked })} />Closed</label></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-2"><Input id="cancel-notice" label="Cancellation notice (hours)" type="number" min="0" max="720" value={value.bookingPolicy.cancellationNoticeHours} onChange={(event) => setForm({ ...value, bookingPolicy: { ...value.bookingPolicy, cancellationNoticeHours: Number(event.target.value) } })} /><Input id="advance-days" label="Bookings open this far ahead (days)" type="number" min="1" max="365" value={value.bookingPolicy.advanceBookingDays} onChange={(event) => setForm({ ...value, bookingPolicy: { ...value.bookingPolicy, advanceBookingDays: Number(event.target.value) } })} /></div>
    <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save availability'}</button>
  </form></Card>;
}

export default function Services() {
  const [editor, setEditor] = useState(null); const [tab, setTab] = useState('services'); const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api('/services?limit=100', { biz: true }), []);
  const remove = async (service) => {
    if (!window.confirm(`Delete ${service.name}?`)) return;
    try { await api(`/services/${service._id}`, { method: 'DELETE', biz: true }); await reload(); toast('Service deleted'); } catch (failure) { toast(failure.message, 'bad'); }
  };
  const services = data?.items || [];
  return <>
    <PageHeader title="Services" sub="Manage the services customers can request from your storefront." actions={tab === 'services' && <button className="btn-primary" onClick={() => setEditor({})}><Plus className="h-4 w-4" />Add service</button>} />
    <div className="mb-4 flex gap-2 border-b border-line"><button className={`px-4 py-2 text-sm ${tab === 'services' ? 'border-b-2 border-forest font-semibold text-forest' : 'text-muted'}`} onClick={() => setTab('services')}>Services</button><button className={`px-4 py-2 text-sm ${tab === 'availability' ? 'border-b-2 border-forest font-semibold text-forest' : 'text-muted'}`} onClick={() => setTab('availability')}>Availability</button></div>
    {tab === 'availability' ? <AvailabilitySettings onSaved={reload} /> : <>
      <Notice>New appointments arrive as requests. No customer payment is taken; confirm or decline each booking in Bookings.</Notice>
      <div className="mt-4">{loading ? <Loading /> : error ? <ErrorNote error={error} retry={reload} /> : services.length === 0 ? <Empty icon={Wrench} title="No services yet" hint="Add a service with its price and duration, then publish it on your storefront." action={<button className="btn-primary" onClick={() => setEditor({})}><Plus className="h-4 w-4" />Add service</button>} /> : <Card><Table head={['Service', 'Price', 'Duration', 'Status', '']}>
        {services.map((service) => <tr key={service._id}><td className="px-4 py-3"><p className="font-medium">{service.name}</p><p className="text-xs text-muted">{service.category || service.description}</p></td><td className="px-4 py-3">{naira(service.price)}</td><td className="px-4 py-3">{service.durationMinutes} min</td><td className="px-4 py-3"><Badge>{service.status}</Badge>{!service.published && <Badge>draft</Badge>}</td><td className="px-4 py-3 text-right"><button className="btn-ghost !min-h-9 !py-1" onClick={() => setEditor(service)}>Edit</button><button className="btn-ghost !min-h-9 !py-1 text-danger" onClick={() => remove(service)}>Delete</button></td></tr>)}
      </Table></Card>}</div>
    </>}
    {editor && <ServiceEditor service={editor._id ? editor : null} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await reload(); }} />}
  </>;
}
