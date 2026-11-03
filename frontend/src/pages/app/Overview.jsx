import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink, Copy } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date } from '../../lib/format.js';
import { Badge, Card, ErrorNote, Input, Loading, PageHeader, Select, Spinner, useApi, useAction, useToast } from '../../components/ui.jsx';
import { normalizeStorefrontConfig } from '../../lib/storefront.js';
import { revealPreset } from '../../lib/animations.js';

export function NewBusiness() {
  const { refresh, switchBusiness } = useAuth(); const nav = useNavigate(); const [sp] = useSearchParams();
  const { data } = useApi(() => api('/billing/plans', { auth: false }), []);
  const [f, setF] = useState({ name: '', slug: '', category: '', businessType: '', planKey: sp.get('plan') || 'store_business' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [avail, setAvail] = useState(null);
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const check = async (slug) => { if (slug.length < 3) return setAvail(null); try { setAvail((await api(`/businesses/slug-available/${slug}`)).available); } catch { setAvail(null); } };
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { const r = await api('/businesses', { method: 'POST', body: f }); await switchBusiness(r.business._id); nav('/app', { replace: true }); } catch (x) { setErr(x); } finally { setBusy(false); } };
  return (
    <div className="mx-auto max-w-lg"><h1 className="text-3xl font-bold">Set up your business</h1><p className="mt-1 text-sm text-muted">You can change most of this later.</p>
      <form onSubmit={submit} className="card mt-5 space-y-4 p-5"><ErrorNote error={err} />
        <Input id="n" label="Business name" required value={f.name} onChange={(e) => { const name = e.target.value; const slug = f.slug === slugify(f.name) ? slugify(name) : f.slug; setF({ ...f, name, slug }); check(slug); }} />
        <Select id="business-type" label="What kind of business do you run?" required value={f.businessType} onChange={(e) => setF({ ...f, businessType: e.target.value })}>
          <option value="" disabled>Select a business type</option><option value="product">Product business</option><option value="service">Service business</option><option value="both">Products and services</option>
        </Select>
        <p className="-mt-2 text-xs text-muted">We’ll configure your dashboard for the modules you need. You can expand your business setup later.</p>
        <Input id="s" label="Store address" required value={f.slug} onChange={(e) => { const slug = slugify(e.target.value); setF({ ...f, slug }); check(slug); }} hint={avail === null ? `Your store will live at /store/${f.slug || 'your-name'}` : avail ? 'Available' : 'That address is taken'} error={avail === false ? 'That address is taken' : null} />
        <Input id="c" label="Business category" placeholder="e.g. Fashion, Pharmacy, Supermarket" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
        <Select id="p" label="Plan" value={f.planKey} onChange={(e) => setF({ ...f, planKey: e.target.value })}>{data?.plans.map((p) => <option key={p.key} value={p.key}>{p.name}: {naira(p.setupFee)} setup + {naira(p.monthlyFee)}/month</option>)}</Select>
        <p className="text-xs text-muted">Choosing a plan does not charge you. You pay from Billing when you are ready.</p>
        <button className="btn-primary w-full" disabled={busy || avail === false}>{busy ? <Spinner className="text-white" /> : 'Create business'}</button></form></div>
  );
}

export default function Overview() {
  const { ctx, businesses, loading, refresh, can } = useAuth(); const toast = useToast(); const [run, busy] = useAction();
  const [storefrontOpen, setStorefrontOpen] = useState(false);
  const [storefront, setStorefront] = useState({});
  const commerceEnabled = ctx?.modules?.includes('commerce') ?? true;
  const { data: rep } = useApi(() => (commerceEnabled && can('reports.read') && ctx?.subscription?.state && ['active', 'grace'].includes(ctx.subscription.state) ? api('/reports/summary', { biz: true }) : Promise.resolve(null)), [ctx?.business?._id, ctx?.subscription?.state, commerceEnabled]);
  useEffect(() => {
    if (ctx?.business) setStorefront(normalizeStorefrontConfig(ctx.business.storefront || {}));
  }, [ctx?.business?._id, ctx?.business?.storefront]);
  if (loading) return <Loading />;
  if (!businesses.length) return <Navigate to="/app/new" replace />;
  if (!ctx) return <Loading />;
  const b = ctx.business || {};
  const url = `${window.location.origin}/store/${b.slug || ''}`;
  const sub = ctx.subscription || {};
  const quickActions = [
    { label: 'Products', href: '/app/products', detail: 'Add or refine your catalogue' },
    { label: 'Billing', href: '/app/billing', detail: 'Check subscription and setup status' },
    { label: 'Settings', href: '/app/settings', detail: 'Update profile and store details' },
  ];
  const toggle = () => run(async () => { await api('/businesses/current/publish', { method: 'POST', biz: true, body: { publish: !b.storePublished } }); await refresh(); }, b.storePublished ? 'Store unpublished' : 'Store published');
  const saveStorefront = async () => {
    try {
      const result = await api('/businesses/current/storefront', { method: 'PUT', biz: true, body: storefront });
      setStorefront(result.storefront || storefront);
      await refresh();
      setStorefrontOpen(false);
      toast('Storefront banner saved');
    } catch (error) {
      toast(error.message || 'Could not save the storefront banner.', 'bad');
    }
  };
  return (
    <>
      <PageHeader title={b.name || 'Business overview'} sub={`Signed in as ${ctx.role}`} actions={b.storePublished ? <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">View store <ExternalLink className="h-4 w-4" /></a> : null} />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Storefront</p>
              <h2 className="mt-1 text-lg font-semibold">Banner editor</h2>
            </div>
            <button className="btn-secondary" onClick={() => setStorefrontOpen((open) => !open)}>{storefrontOpen ? 'Close' : 'Edit banner'}</button>
          </div>
          {storefrontOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-line bg-paper p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input id="hero-title" label="Headline" value={storefront.heroTitle || ''} onChange={(e) => setStorefront({ ...storefront, heroTitle: e.target.value })} />
                <Input id="cta-text" label="CTA label" value={storefront.ctaText || ''} onChange={(e) => setStorefront({ ...storefront, ctaText: e.target.value })} />
                <Input id="hero-subtitle" label="Subtitle" value={storefront.heroSubtitle || ''} onChange={(e) => setStorefront({ ...storefront, heroSubtitle: e.target.value })} />
                <Input id="cta-link" label="CTA link" value={storefront.ctaLink || ''} onChange={(e) => setStorefront({ ...storefront, ctaLink: e.target.value })} />
                <Input id="primary-color" label="Primary color" type="color" value={storefront.primaryColor || '#0B6B4F'} onChange={(e) => setStorefront({ ...storefront, primaryColor: e.target.value })} />
                <Input id="background-image" label="Background image URL" value={storefront.backgroundImage || ''} onChange={(e) => setStorefront({ ...storefront, backgroundImage: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={!!storefront.published} onChange={(e) => setStorefront({ ...storefront, published: e.target.checked })} />Show this banner on the public store</label>
              <div className="flex gap-3"><button className="btn-primary" onClick={saveStorefront}>Save banner</button><button className="btn-secondary" onClick={() => setStorefront(normalizeStorefrontConfig(b.storefront || {}, b.name))}>Reset</button></div>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Preview</p>
            <motion.div {...revealPreset(0, 14)} className="mt-3 rounded-2xl p-5 text-white" style={{ background: storefront.published ? `linear-gradient(135deg, ${storefront.primaryColor || '#0B6B4F'}, rgba(17,24,39,0.8))` : '#E7F0ED' }}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Featured</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{storefront.heroTitle || b.name || 'Your storefront'}</h3>
              {storefront.heroSubtitle && <p className="mt-2 text-sm text-white/80">{storefront.heroSubtitle}</p>}
              {storefront.ctaText && <span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">{storefront.ctaText}</span>}
            </motion.div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Quick actions</p>
          <div className="mt-4 space-y-2">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href} className="block rounded-xl border border-line bg-paper px-3 py-3 transition hover:bg-forest-50">
                <p className="font-medium text-ink">{action.label}</p>
                <p className="mt-1 text-xs text-muted">{action.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {!ctx.setup.complete && (
        <Card className="mb-5 p-5"><h2 className="font-semibold">Finish setting up</h2><ul className="mt-3 space-y-2">{ctx.setup.steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">{s.done ? <CheckCircle2 className="h-5 w-5 text-forest-500" /> : <Circle className="h-5 w-5 text-muted" />}<span className={s.done ? 'text-muted line-through' : ''}>{s.label}</span>
            {!s.done && <Link className="ml-auto font-semibold text-forest underline" to={{ profile: '/app/settings', plan: '/app/billing', products: '/app/products', publish: '/app/settings' }[s.key]}>Go</Link>}</li>))}</ul></Card>)}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-muted">Plan</p><p className="mt-1 font-display text-xl font-bold">{sub.plan?.name || 'None'}</p><div className="mt-2"><Badge>{sub.state || 'not active'}</Badge></div>{sub.currentPeriodEnd && <p className="mt-2 text-xs text-muted">Paid until {date(sub.currentPeriodEnd)}</p>}{!['active', 'grace'].includes(sub.state || '') && can('billing.manage') && <Link to="/app/billing" className="btn-primary mt-3 w-full">Activate in Billing</Link>}</Card>
            {commerceEnabled ? <Card className="p-5"><p className="text-sm text-muted">Online store</p><p className="mt-1 font-display text-xl font-bold">{b.storePublished ? 'Published' : 'Not published'}</p>{b.storePublished && <button className="mt-2 flex items-center gap-1 break-all text-left text-xs text-forest underline" onClick={() => { navigator.clipboard?.writeText(url); toast('Link copied'); }}><Copy className="h-3 w-3 shrink-0" />{url}</button>}{can('business.update') && <button className="btn-secondary mt-3 w-full" disabled={busy} onClick={toggle}>{b.storePublished ? 'Unpublish' : 'Publish store'}</button>}</Card> : <Card className="p-5"><p className="text-sm text-muted">Business type</p><p className="mt-1 font-display text-xl font-bold">Service business</p><p className="mt-2 text-sm text-muted">Service catalog and appointment workflows are not part of this foundation phase.</p></Card>}
            {commerceEnabled ? <Card className="p-5"><p className="text-sm text-muted">Last 30 days (net sales)</p>{rep ? <><p className="mt-1 font-display text-2xl font-bold">{naira(rep.summary.netSales)}</p><p className="mt-1 text-xs text-muted">{rep.summary.online.orders} online orders · {rep.summary.pos.transactions} POS sales</p></> : <p className="mt-2 text-sm text-muted">{can('reports.read') ? 'Available once your plan is active.' : 'Reports are available to managers and owners.'}</p>}</Card> : <Card className="p-5"><p className="text-sm text-muted">Enabled modules</p><p className="mt-1 font-display text-xl font-bold">Services</p><p className="mt-2 text-sm text-muted">Your business profile, account, and subscription use the shared Zuno foundation.</p></Card>}
      </div>
    </>
  );
}
