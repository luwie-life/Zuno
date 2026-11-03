import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Search, ShoppingBag, Trash2, MapPin, Phone, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api, qs } from '../lib/api.js';
import { naira } from '../lib/format.js';
import { normalizeStorefrontConfig } from '../lib/storefront.js';
import { revealPreset } from '../lib/animations.js';
import { Badge, Empty, ErrorNote, Input, Loading, Modal, Spinner, useApi } from '../components/ui.jsx';

function useCart(slug) {
  const key = `zuno_cart_${slug}`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
  const [items, setItems] = useState(read);
  const save = (n) => { setItems(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* storage unavailable */ } };
  return {
    items,
    add: (p, qty = 1) => { const e = items.find((i) => i.id === p.id); save(e ? items.map((i) => (i.id === p.id ? { ...i, qty: Math.min(i.qty + qty, 99) } : i)) : [...items, { id: p.id, name: p.name, price: p.price, image: p.images?.[0], qty }]); },
    setQty: (id, qty) => save(qty <= 0 ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, 99) } : i))),
    clear: () => save([]),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0), // display only: the server recomputes everything
  };
}

function useSeo(title, description) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    if (description) m.content = description.slice(0, 160);
  }, [title, description]);
}

export function StoreLayout({ merchantSlug }) {
  const { slug: pathSlug } = useParams(); const slug = merchantSlug || pathSlug; const storeBase = merchantSlug ? '' : `/store/${slug}`; const nav = useNavigate();
  const { data, error, loading } = useApi(() => api(`/store/${slug}`, { auth: false }), [slug]);
  const cart = useCart(slug);
  const [open, setOpen] = useState(false);
  useSeo(data ? `${data.business.name} | Online store` : 'Online store', data?.business.description || (data && `Shop ${data.business.name} online.`));
  if (loading) return <Loading />;
  if (error) return <div className="mx-auto max-w-md p-10 text-center"><Empty title="Store not available" hint="This store may be unpublished or the address may be wrong." action={<Link className="btn-secondary" to="/">Go to Zuno</Link>} /></div>;
  const b = data.business; const color = b.brandColor || '#0B3D2E';
  return (
    <div className="min-h-screen" style={{ '--brand': color }}>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to={storeBase || '/'} className="flex items-center gap-2 font-display text-xl font-bold">{b.logoUrl && <img src={b.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />}{b.name}</Link>
          <div className="flex items-center gap-3">
            {b.acceptingServices && <Link to={storeBase ? `${storeBase}/services` : '/services'} className="hidden text-sm font-medium text-muted hover:text-ink sm:block">Services</Link>}
            <button onClick={() => setOpen(true)} className="relative rounded-lg p-2.5 hover:bg-paper" aria-label={`Cart, ${cart.count} items`}><ShoppingBag className="h-6 w-6" />{cart.count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white" style={{ background: color }}>{cart.count}</span>}</button>
          </div>
        </div>
      </header>
      {!b.acceptingOrders && <div className="bg-mango-100 px-4 py-2 text-center text-sm">This store is not taking new orders right now.</div>}
      <main className="mx-auto max-w-5xl px-4 py-6"><Outlet context={{ biz: b, categories: data.categories, cart, slug, color, storeBase }} /></main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-4">{b.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{b.phone}</span>}{b.address?.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[b.address.line, b.address.city, b.address.state].filter(Boolean).join(', ')}</span>}</div>
        <p className="mt-3 text-xs">Store powered by <Link to="/" className="underline">Zuno</Link></p>
      </footer>
      <Modal open={open} onClose={() => setOpen(false)} title="Your cart">
        {cart.items.length === 0 ? <Empty title="Your cart is empty" icon={ShoppingBag} /> : (
          <div>
            <ul className="divide-y divide-line">{cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.name}</p><p className="text-sm text-muted">{naira(i.price)}</p></div>
                <div className="flex items-center gap-1"><button className="rounded border border-line p-2" aria-label="Decrease" onClick={() => cart.setQty(i.id, i.qty - 1)}><Minus className="h-4 w-4" /></button><span className="w-7 text-center text-sm">{i.qty}</span><button className="rounded border border-line p-2" aria-label="Increase" onClick={() => cart.setQty(i.id, i.qty + 1)}><Plus className="h-4 w-4" /></button></div>
                <button className="p-2 text-muted" aria-label={`Remove ${i.name}`} onClick={() => cart.setQty(i.id, 0)}><Trash2 className="h-4 w-4" /></button></li>))}</ul>
            <div className="mt-3 flex justify-between font-semibold"><span>Subtotal</span><span>{naira(cart.subtotal)}</span></div>
            <button className="btn-primary mt-4 w-full" style={{ background: color }} disabled={!b.acceptingOrders} onClick={() => { setOpen(false); nav(`/store/${slug}/checkout`); }}>Checkout</button>
          </div>)}
      </Modal>
    </div>
  );
}

export function StoreHome() {
  const { biz, categories, cart, slug, color, storeBase } = useOutletContext();
  const [search, setSearch] = useState(''); const [cat, setCat] = useState(''); const [page, setPage] = useState(1);
  const { data, loading, error } = useApi(() => api(`/store/${slug}/products${qs({ search, category: cat, page, limit: 24 })}`, { auth: false }), [slug, search, cat, page]);
  const storefront = normalizeStorefrontConfig(biz.storefront || {});
  const showHero = storefront.published && (storefront.heroTitle || storefront.heroSubtitle || storefront.backgroundImage || storefront.bannerImage);
  const backgroundImage = storefront.backgroundImage || storefront.bannerImage;
  return (
    <>
      {showHero && (
        <motion.div {...revealPreset(0, 18)} className="mb-6 overflow-hidden rounded-3xl border border-line bg-white shadow-soft" style={{ backgroundImage: backgroundImage ? `linear-gradient(135deg, rgba(11, 107, 79, 0.7), rgba(0,0,0,0.25)), url(${backgroundImage})` : 'linear-gradient(135deg, rgba(11,107,79,0.92), rgba(17,24,39,0.82))', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="p-6 text-white md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-white/80">Featured</p>
            <h1 className="mt-3 max-w-xl text-3xl font-bold md:text-5xl">{storefront.heroTitle || biz.name}</h1>
            {storefront.heroSubtitle && <p className="mt-3 max-w-lg text-sm text-white/85 md:text-base">{storefront.heroSubtitle}</p>}
            {storefront.ctaLink && <motion.div {...revealPreset(0.1, 10)} className="mt-5"><Link className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink" to={storefront.ctaLink.startsWith('http') ? storefront.ctaLink : `${storeBase || `/store/${slug}`}${storefront.ctaLink.startsWith('/') ? storefront.ctaLink : `/${storefront.ctaLink}`}`}>{storefront.ctaText || 'Shop now'}</Link></motion.div>}
          </div>
        </motion.div>
      )}
      {biz.description && <p className="mb-5 max-w-2xl text-muted">{biz.description}</p>}
      {biz.acceptingServices && <div className="mb-5 flex justify-end"><Link className="btn-secondary" to={storeBase ? `${storeBase}/services` : '/services'}>Browse services</Link></div>}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="input pl-9" placeholder="Search products" aria-label="Search products" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        {categories.length > 0 && <select className="input w-auto" aria-label="Category" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}
      </div>
      {loading ? <Loading /> : error ? <ErrorNote error={error} /> : data.items.length === 0 ? <Empty title="No products found" hint="Try a different search." /> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => (
              <div key={p.id} className="card flex flex-col overflow-hidden">
                <Link to={`${storeBase}/p/${p.id}`} className="block aspect-square bg-paper">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ShoppingBag className="h-8 w-8" /></div>}</Link>
                <div className="flex flex-1 flex-col p-3"><Link to={`${storeBase}/p/${p.id}`} className="line-clamp-2 text-sm font-medium">{p.name}</Link><p className="mt-1 font-display font-bold">{naira(p.price)}</p>
                  <button className="btn-secondary mt-auto !min-h-[40px] w-full !py-1.5" style={{ marginTop: 12 }} disabled={!p.inStock || !biz.acceptingOrders} onClick={() => cart.add(p)}>{p.inStock ? 'Add to cart' : 'Out of stock'}</button></div>
              </div>))}
          </div>
          {data.total > data.limit && <div className="mt-6 flex justify-center gap-2"><button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-secondary" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next</button></div>}
        </>)}
      <div className="mt-8 text-sm"><Link className="underline" to={`${storeBase}/order`}>Track an order</Link></div>
    </>
  );
}

export function StoreServices() {
  const { biz, slug, color, storeBase } = useOutletContext();
  const { data, loading, error } = useApi(() => api(`/store/${slug}/services`, { auth: false }), [slug]);
  const items = data?.items || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Services</p>
          <h1 className="text-2xl font-bold">Book an appointment</h1>
        </div>
        <Link className="btn-secondary" to={storeBase || '/'}>Back to store</Link>
      </div>
      {loading ? <Loading /> : error ? <ErrorNote error={error} /> : items.length === 0 ? <Empty title="No services available yet" hint="This business has not published any services for booking yet." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((service) => (
            <div key={service.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{service.category || 'Service'}</p>
                  <h2 className="mt-2 text-xl font-semibold">{service.name}</h2>
                </div>
                <div className="font-display text-xl font-bold">{naira(service.price)}</div>
              </div>
              <p className="mt-3 text-sm text-muted">{service.description || 'No description available yet.'}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-muted">
                <span>{service.durationMinutes} minutes</span>
                <span>{service.bookingRequirements ? 'Requirements apply' : 'Simple booking'}</span>
              </div>
              <Link className="btn-primary mt-5 w-full" style={{ background: color }} to={storeBase ? `${storeBase}/services/${service.id}` : `/services/${service.id}`}>Book now</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StoreService() {
  const { biz, slug, color, storeBase } = useOutletContext();
  const { id } = useParams();
  const { data, loading, error } = useApi(() => api(`/store/${slug}/services`, { auth: false }), [slug]);
  const items = data?.items || [];
  const service = items.find((item) => item.id === id) || null;
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });

  useEffect(() => {
    if (!service) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().slice(0, 10);
    setSelectedDate((current) => current || defaultDate);
  }, [service]);

  const loadSlots = useCallback(async (date) => {
    if (!service || !date) return;
    try {
      setLoadError(null);
      const response = await api(`/store/${slug}/services/${service.id}/availability?date=${date}`, { auth: false });
      setSlots(response.times || []);
      setSelectedTime((current) => (response.times?.includes(current) ? current : (response.times?.[0] || '')));
    } catch (failure) {
      setLoadError(failure);
      setSlots([]);
      setSelectedTime('');
    }
  }, [service, slug]);

  useEffect(() => {
    if (service && selectedDate) loadSlots(selectedDate);
  }, [service, selectedDate, loadSlots]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!service) return <Empty title="Service not found" hint="This booking may be unavailable or unpublished." action={<Link className="btn-secondary" to={storeBase || '/'}>Back to store</Link>} />;

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      setLoadError(new Error('Choose an available date and time.'));
      return;
    }
    setBusy(true);
    setLoadError(null);
    try {
      const response = await api(`/store/${slug}/bookings`, { method: 'POST', auth: false, body: {
        serviceId: service.id,
        date: selectedDate,
        startTime: selectedTime,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note || undefined,
        },
      } });
      setBooking(response.booking);
      setForm({ name: '', email: '', phone: '', note: '' });
    } catch (failure) {
      setLoadError(failure);
    } finally {
      setBusy(false);
    }
  };

  if (booking) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 text-center shadow-soft">
        <h1 className="text-2xl font-bold">Request sent</h1>
        <p className="mt-3 text-muted">Your booking request has been received. The business will confirm it shortly.</p>
        <div className="mt-5 space-y-2 rounded-xl bg-paper p-4 text-left">
          <div className="flex justify-between gap-4"><span className="text-muted">Reference</span><strong>{booking.reference}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-muted">Service</span><strong>{booking.serviceName}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-muted">Date</span><strong>{booking.date}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-muted">Time</span><strong>{booking.startTime}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-muted">Status</span><strong>{booking.status}</strong></div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn-secondary" to={storeBase || '/'}>Back to store</Link>
          <Link className="btn-primary" style={{ background: color }} to={storeBase ? `${storeBase}/services` : '/services'}>Book another</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="card p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Service</p>
        <h1 className="mt-2 text-3xl font-bold">{service.name}</h1>
        <div className="mt-4 font-display text-2xl font-bold">{naira(service.price)}</div>
        <p className="mt-4 text-muted">{service.description || 'No description added yet.'}</p>
        <div className="mt-5 grid gap-2 text-sm text-muted">
          <div className="flex justify-between gap-3"><span>Duration</span><strong className="text-ink">{service.durationMinutes} minutes</strong></div>
          {service.bookingRequirements && <div className="rounded-xl bg-paper p-3"><strong className="block text-ink">What to prepare</strong><p className="mt-1">{service.bookingRequirements}</p></div>}
        </div>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Booking</p>
          <h2 className="mt-2 text-2xl font-bold">Choose a time</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="booking-date" label="Date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <div className="self-end">
            <label className="mb-1 block text-sm font-medium text-ink">Time</label>
            <select className="input" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} disabled={slots.length === 0}>
              {slots.length === 0 ? <option value="">No times available</option> : <option value="">Select a time</option>}
              {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
        </div>
        {loadError && <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{loadError.message || 'Please select another time.'}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="customer-name" label="Full name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input id="customer-phone" label="Phone" type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </div>
        <Input id="customer-email" label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Input id="customer-note" label="Notes (optional)" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <button className="btn-primary w-full" style={{ background: color }} disabled={busy || !selectedTime || !form.name || !form.email || !form.phone}>
          {busy ? 'Sending request…' : `Request ${naira(service.price)}`}
        </button>
      </form>
    </div>
  );
}

export function StoreProduct() {
  const { id } = useParams(); const { biz, cart, slug, color, storeBase } = useOutletContext();
  const { data, loading, error } = useApi(() => api(`/store/${slug}/products/${id}`, { auth: false }), [id]);
  const [qty, setQty] = useState(1); const [img, setImg] = useState(0);
  useSeo(data ? `${data.product.name} | ${biz.name}` : biz.name, data?.product.description);
  if (loading) return <Loading />;
  if (error) return <Empty title="Product not found" action={<Link className="btn-secondary" to={storeBase || '/'}>Back to store</Link>} />;
  const p = data.product;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div><div className="aspect-square overflow-hidden rounded-xl2 border border-line bg-paper">{p.images?.[img] && <img src={p.images[img]} alt={p.name} className="h-full w-full object-cover" />}</div>
        {p.images?.length > 1 && <div className="mt-2 flex gap-2">{p.images.map((u, i) => <button key={u} onClick={() => setImg(i)} className={`h-16 w-16 overflow-hidden rounded border ${i === img ? 'border-ink' : 'border-line'}`}><img src={u} alt="" className="h-full w-full object-cover" /></button>)}</div>}</div>
      <div>
        <Link to={storeBase || '/'} className="text-sm text-muted underline">All products</Link>
        <h1 className="mt-2 text-3xl font-bold">{p.name}</h1><p className="mt-2 font-display text-2xl font-bold">{naira(p.price)}</p>
        <p className="mt-2">{p.inStock ? <Badge tone="ok">In stock</Badge> : <Badge tone="bad">Out of stock</Badge>}</p>
        {p.description && <p className="mt-4 whitespace-pre-line text-muted">{p.description}</p>}
        <div className="mt-6 flex items-center gap-3"><div className="flex items-center gap-1"><button className="rounded border border-line p-2.5" aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button><span className="w-8 text-center">{qty}</span><button className="rounded border border-line p-2.5" aria-label="Increase" onClick={() => setQty(Math.min(p.available ?? 99, qty + 1))}><Plus className="h-4 w-4" /></button></div>
          <button className="btn-primary flex-1" style={{ background: color }} disabled={!p.inStock || !biz.acceptingOrders} onClick={() => cart.add(p, qty)}>Add to cart</button></div>
      </div>
    </div>
  );
}

export function StoreCheckout() {
  const { biz, cart, slug, color, storeBase } = useOutletContext();
  const [f, setF] = useState({ name: '', email: '', phone: '', line: '', city: '', state: '', note: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const total = cart.subtotal + (biz.deliveryFee || 0);
  if (cart.items.length === 0) return <Empty title="Your cart is empty" action={<Link className="btn-primary" to={storeBase || '/'}>Continue shopping</Link>} />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await api(`/store/${slug}/checkout`, { method: 'POST', auth: false, body: { items: cart.items.map((i) => ({ productId: i.id, qty: i.qty })), customer: { name: f.name, email: f.email, phone: f.phone, address: { line: f.line, city: f.city, state: f.state } }, note: f.note || undefined } });
      window.location.href = r.authorizationUrl; // hosted Paystack checkout
    } catch (x) { setErr(x); setBusy(false); }
  };
  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={submit} className="space-y-4"><h1 className="text-2xl font-bold">Checkout</h1><ErrorNote error={err} />
        <Input id="n" label="Full name" required autoComplete="name" value={f.name} onChange={on('name')} />
        <div className="grid gap-4 sm:grid-cols-2"><Input id="e" label="Email" type="email" required autoComplete="email" value={f.email} onChange={on('email')} hint="Your receipt and order updates go here." /><Input id="p" label="Phone" type="tel" required autoComplete="tel" value={f.phone} onChange={on('phone')} /></div>
        <Input id="a" label="Delivery address" required autoComplete="street-address" value={f.line} onChange={on('line')} />
        <div className="grid gap-4 sm:grid-cols-2"><Input id="c" label="City" required value={f.city} onChange={on('city')} /><Input id="s" label="State" required value={f.state} onChange={on('state')} /></div>
        <Input id="no" label="Delivery note (optional)" value={f.note} onChange={on('note')} />
        <button className="btn-primary w-full" style={{ background: color }} disabled={busy}>{busy ? <Spinner className="text-white" /> : `Pay ${naira(total)}`}</button>
        <p className="text-xs text-muted">You will be taken to the merchant's connected Paystack account to pay securely. Your items are held for a short time while you pay.</p>
      </form>
      <aside className="card h-fit p-4"><h2 className="font-semibold">Order summary</h2><ul className="mt-3 space-y-2 text-sm">{cart.items.map((i) => <li key={i.id} className="flex justify-between gap-3"><span>{i.qty} × {i.name}</span><span>{naira(i.qty * i.price)}</span></li>)}</ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{naira(cart.subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{naira(biz.deliveryFee)}</span></div><div className="flex justify-between text-base font-bold"><span>Total</span><span>{naira(total)}</span></div></div>
        <p className="mt-2 text-xs text-muted">Final prices and stock are confirmed by the store when you pay.</p></aside>
    </div>
  );
}

export function StoreOrder() {
  const { slug, cart, storeBase } = useOutletContext(); const [sp] = useSearchParams();
  const reference = sp.get('reference') || sp.get('trxref');
  const [state, setState] = useState(reference ? { loading: true } : {});
  const [lookup, setLookup] = useState({ ref: '', email: '' }); const [err, setErr] = useState(null);
  useEffect(() => {
    if (!reference) return;
    api(`/store/${slug}/orders/verify${qs({ reference })}`, { auth: false }).then((r) => { setState({ ...r }); if (r.order?.paymentStatus === 'paid') cart.clear(); }).catch((e) => setState({ error: e }));
  }, [reference]); // eslint-disable-line
  const find = async (e) => { e.preventDefault(); setErr(null); try { const r = await api(`/store/${slug}/orders/lookup`, { method: 'POST', auth: false, body: lookup }); setState({ order: r.order, lookedUp: true }); } catch (x) { setErr(x); } };
  const o = state.order;
  return (
    <div className="mx-auto max-w-lg">
      {state.loading && <Loading text="Confirming your payment with Paystack" />}
      {state.error && <ErrorNote error={state.error} />}
      {o && (
        <div className="card p-6 text-center">
          {o.paymentStatus === 'paid' ? <CheckCircle2 className="mx-auto h-10 w-10 text-forest-500" /> : o.paymentStatus === 'pending' ? <Clock className="mx-auto h-10 w-10 text-mango" /> : <XCircle className="mx-auto h-10 w-10 text-danger" />}
          <h1 className="mt-3 text-2xl font-bold">{o.paymentStatus === 'paid' ? 'Order confirmed' : o.paymentStatus === 'pending' ? 'Waiting for payment' : 'Payment not completed'}</h1>
          <p className="mt-1 text-sm text-muted">Order reference</p><p className="font-display text-2xl font-bold">{o.ref}</p>
          <div className="mt-3 flex justify-center gap-2"><Badge>{o.paymentStatus}</Badge><Badge>{o.fulfilmentStatus}</Badge></div>
          <p className="mt-3 text-sm">Total {naira(o.total)}</p>
          {o.items && <ul className="mt-3 text-left text-sm text-muted">{o.items.map((i, k) => <li key={k}>{i.qty} × {i.name}</li>)}</ul>}
          {state.result === 'rejected' && <p className="mt-3 text-sm text-danger">We could not confirm this payment. If you were charged, contact the store with your reference.</p>}
          {o.paymentStatus === 'paid' && <p className="mt-3 text-xs text-muted">Keep this reference. You can track the order from the store page.</p>}
        </div>)}
      {!reference && !o && <><h1 className="text-2xl font-bold">Track an order</h1><form onSubmit={find} className="card mt-4 space-y-4 p-5"><ErrorNote error={err} /><Input id="r" label="Order reference" required value={lookup.ref} onChange={(e) => setLookup({ ...lookup, ref: e.target.value })} /><Input id="e" label="Email used at checkout" type="email" required value={lookup.email} onChange={(e) => setLookup({ ...lookup, email: e.target.value })} /><button className="btn-primary w-full">Find order</button></form></>}
      <div className="mt-6 text-center"><Link className="underline" to={storeBase || '/'}>Back to store</Link></div>
    </div>
  );
}
