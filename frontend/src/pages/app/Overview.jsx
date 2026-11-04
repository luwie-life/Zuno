
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, ExternalLink, Copy, Store,
  BriefcaseBusiness, Layers3, ArrowLeft, ArrowRight, Check
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date } from '../../lib/format.js';
import {
  Badge, Card, ErrorNote, Input, Loading, PageHeader,
  Select, Spinner, useApi, useAction, useToast
} from '../../components/ui.jsx';
import { normalizeStorefrontConfig } from '../../lib/storefront.js';
import { revealPreset } from '../../lib/animations.js';

const BUSINESS_TYPES = [
  {
    key: 'product',
    title: 'Product business',
    description: 'Sell physical or digital products online and manage orders.',
    icon: Store,
  },
  {
    key: 'service',
    title: 'Service business',
    description: 'Offer services, manage appointments and organize bookings.',
    icon: BriefcaseBusiness,
  },
  {
    key: 'both',
    title: 'Products and services',
    description: 'Run a business that sells products and offers services.',
    icon: Layers3,
  },
];

const STEPS = [
  { number: 1, title: 'Business type' },
  { number: 2, title: 'Business details' },
  { number: 3, title: 'Choose a plan' },
];

const slugify = (value) =>
  value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

export function NewBusiness() {
  const { switchBusiness } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const { data, loading: plansLoading, error: plansError } = useApi(
    () => api('/billing/plans', { auth: false }),
    []
  );

  const availablePlans = (data?.plans || [])
    .filter((plan) => plan.active !== false)
    .sort((a, b) => {
      const order = ['free', 'starter', 'growth', 'pro'];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  const requestedPlan = sp.get('plan');
  const validRequestedPlan = ['free', 'starter', 'growth', 'pro'].includes(requestedPlan);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: '',
    businessType: '',
    planKey: validRequestedPlan ? requestedPlan : 'free',
  });

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const selectedPlan = availablePlans.find((p) => p.key === form.planKey);
  const selectedType = BUSINESS_TYPES.find((t) => t.key === form.businessType);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) {
      setAvailability(null);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const result = await api(
          `/businesses/slug-available/${encodeURIComponent(form.slug)}`
        );
        if (!cancelled) setAvailability(result.available);
      } catch {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setCheckingSlug(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.slug]);

  const update = (changes) => {
    setForm((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const nextStep = () => {
    setError(null);

    if (step === 1 && !form.businessType) {
      setError(new Error('Choose the type of business you run.'));
      return;
    }

    if (step === 2) {
      if (form.name.trim().length < 2) {
        setError(new Error('Enter a business name with at least 2 characters.'));
        return;
      }

      if (!form.slug || form.slug.length < 3) {
        setError(new Error('Your Zuno address must contain at least 3 characters.'));
        return;
      }

      if (availability === false) {
        setError(new Error('This Zuno address is already taken. Choose another one.'));
        return;
      }

      if (checkingSlug || availability === null) {
        setError(new Error('Wait for your Zuno address availability check to finish.'));
        return;
      }
    }

    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!selectedPlan) {
      setError(new Error('Choose an available plan before continuing.'));
      return;
    }

    if (availability !== true) {
      setStep(2);
      setError(new Error('Please confirm that your Zuno address is available.'));
      return;
    }

    setBusy(true);

    try {
      const result = await api('/businesses', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          slug: form.slug,
          category: form.category.trim(),
          businessType: form.businessType,
          planKey: form.planKey,
        },
      });

      await switchBusiness(result.business._id);
      nav('/app', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const formatPrice = (amount) => {
    const value = Number(amount || 0);
    return value === 0 ? 'Free' : `${naira(value)}/month`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to Zuno
        </Link>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">
            Business setup
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Let's set up your business.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Tell us what you do. We'll prepare your Zuno workspace around the way your business operates.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-2">
        {STEPS.map((item) => {
          const completed = step > item.number;
          const active = step === item.number;

          return (
            <div key={item.number}>
              <div className={`h-1.5 rounded-full ${
                completed || active ? 'bg-forest' : 'bg-line'
              }`} />
              <div className="mt-2 flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  completed || active
                    ? 'bg-forest text-white'
                    : 'bg-paper text-muted'
                }`}>
                  {completed ? <Check className="h-3.5 w-3.5" /> : item.number}
                </span>
                <span className={`text-xs font-medium ${
                  active ? 'text-ink' : 'text-muted'
                }`}>
                  {item.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit}>
        <Card className="p-5 sm:p-7">
          <ErrorNote error={error} />

          {step === 1 && (
            <motion.div {...revealPreset(0, 12)}>
              <p className="text-sm font-medium text-muted">Step 1 of 3</p>
              <h2 className="mt-1 text-xl font-bold">What kind of business do you run?</h2>
              <p className="mt-2 text-sm text-muted">
                This helps us configure the right tools and workspace for you.
              </p>

              <div className="mt-6 grid gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = form.businessType === type.key;

                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => update({ businessType: type.key })}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-forest bg-forest-50 ring-1 ring-forest'
                          : 'border-line bg-white hover:border-forest/40 hover:bg-paper'
                      }`}
                    >
                      <div className={`rounded-xl p-3 ${
                        active ? 'bg-white text-forest' : 'bg-paper text-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{type.title}</p>
                        <p className="mt-1 text-sm leading-5 text-muted">
                          {type.description}
                        </p>
                      </div>

                      <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        active ? 'border-forest bg-forest text-white' : 'border-line'
                      }`}>
                        {active && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div {...revealPreset(0, 12)}>
              <p className="text-sm font-medium text-muted">Step 2 of 3</p>
              <h2 className="mt-1 text-xl font-bold">Tell us about your business.</h2>
              <p className="mt-2 text-sm text-muted">
                These details create your business profile and public Zuno address.
              </p>

              <div className="mt-6 space-y-5">
                <Input
                  id="business-name"
                  label="Business name"
                  placeholder="e.g. Lifestyle Drip"
                  required
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    const shouldUpdateSlug = !form.slug || form.slug === slugify(form.name);

                    update({
                      name,
                      ...(shouldUpdateSlug ? { slug: slugify(name) } : {}),
                    });
                  }}
                />

                <Input
                  id="business-slug"
                  label="Your Zuno address"
                  placeholder="your-business"
                  required
                  value={form.slug}
                  onChange={(event) => update({
                    slug: slugify(event.target.value),
                  })}
                  hint={
                    checkingSlug
                      ? 'Checking availability...'
                      : availability === true
                        ? 'This address is available.'
                        : availability === false
                          ? 'This address is already taken.'
                          : 'Use at least 3 letters, numbers or hyphens.'
                  }
                  error={availability === false ? 'Choose another address.' : null}
                />

                <div className="rounded-xl border border-line bg-paper p-3">
                  <p className="text-xs text-muted">Your public business address</p>
                  <p className="mt-1 break-all text-sm font-semibold text-ink">
                    {window.location.origin}/store/{form.slug || 'your-business'}
                  </p>
                </div>

                <Input
                  id="business-category"
                  label="Business category"
                  placeholder="e.g. Fashion, Beauty, Consulting"
                  value={form.category}
                  onChange={(event) => update({ category: event.target.value })}
                />

                <div className="rounded-xl bg-paper p-4">
                  <p className="text-xs text-muted">Selected business type</p>
                  <p className="mt-1 font-semibold text-ink">
                    {selectedType?.title || 'Not selected'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 text-xs font-semibold text-forest underline"
                  >
                    Change business type
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div {...revealPreset(0, 12)}>
              <p className="text-sm font-medium text-muted">Step 3 of 3</p>
              <h2 className="mt-1 text-xl font-bold">Choose how you want to start.</h2>
              <p className="mt-2 text-sm text-muted">
                Select a plan for your business. You can manage your subscription later from Billing.
              </p>

              {plansLoading ? (
                <Loading text="Loading available plans..." />
              ) : plansError ? (
                <ErrorNote error={plansError} />
              ) : availablePlans.length === 0 ? (
                <ErrorNote error={new Error('No active plans are available right now. Please try again later.')} />
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {availablePlans.map((plan) => {
                    const active = form.planKey === plan.key;

                    return (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => update({ planKey: plan.key })}
                        className={`relative rounded-2xl border p-5 text-left transition ${
                          active
                            ? 'border-forest bg-forest-50 ring-1 ring-forest'
                            : 'border-line bg-white hover:border-forest/40'
                        }`}
                      >
                        {active && (
                          <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-forest text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        )}

                        <p className="text-sm font-semibold text-muted">{plan.name}</p>
                        <p className="mt-3 text-2xl font-bold text-ink">
                          {formatPrice(plan.monthlyFee)}
                        </p>

                        {plan.description && (
                          <p className="mt-2 text-sm leading-5 text-muted">
                            {plan.description}
                          </p>
                        )}

                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <ul className="mt-4 space-y-2 border-t border-line pt-4">
                            {plan.features.slice(0, 5).map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                                <span>{String(feature).replace(/_/g, ' ')}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {plan.key === 'free' && (
                          <p className="mt-4 text-xs font-medium text-forest">
                            Start without paying.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 rounded-xl border border-line bg-paper p-4">
                <p className="text-sm font-semibold text-ink">No payment during setup</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Creating your business does not charge your card or initiate a payment.
                  You can activate or change your subscription later from your Billing page.
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 1 || busy}
              onClick={() => {
                setError(null);
                setStep((current) => Math.max(1, current - 1));
              }}
            >
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={nextStep}
                disabled={step === 2 && checkingSlug}
              >
                Continue
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || plansLoading || !selectedPlan || !availablePlans.length}
              >
                {busy ? (
                  <>
                    <Spinner className="mr-2 inline text-white" />
                    Creating business...
                  </>
                ) : (
                  <>
                    Create my business
                    <Check className="ml-2 inline h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </Card>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        Your business details and plan can be managed from your Zuno dashboard.
      </p>
    </div>
  );
}

export default function Overview() {
  const { ctx, businesses, loading, refresh, can } = useAuth();
  const toast = useToast();
  const [run, busy] = useAction();
  const [storefrontOpen, setStorefrontOpen] = useState(false);
  const [storefront, setStorefront] = useState({});

  const commerceEnabled = ctx?.modules?.includes('commerce') ?? true;

  const { data: rep } = useApi(
    () => (
      commerceEnabled &&
      can('reports.read') &&
      ctx?.subscription?.state &&
      ['active', 'grace'].includes(ctx.subscription.state)
        ? api('/reports/summary', { biz: true })
        : Promise.resolve(null)
    ),
    [ctx?.business?._id, ctx?.subscription?.state, commerceEnabled]
  );

  useEffect(() => {
    if (ctx?.business) {
      setStorefront(normalizeStorefrontConfig(ctx.business.storefront || {}));
    }
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

  const toggle = () => run(
    async () => {
      await api('/businesses/current/publish', {
        method: 'POST',
        biz: true,
        body: { publish: !b.storePublished },
      });
      await refresh();
    },
    b.storePublished ? 'Store unpublished' : 'Store published'
  );

  const saveStorefront = async () => {
    try {
      const result = await api('/businesses/current/storefront', {
        method: 'PUT',
        biz: true,
        body: storefront,
      });

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
      <PageHeader
        title={b.name || 'Business overview'}
        sub={`Signed in as ${ctx.role}`}
        actions={
          b.storePublished ? (
            <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">
              View store <ExternalLink className="h-4 w-4" />
            </a>
          ) : null
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Storefront</p>
              <h2 className="mt-1 text-lg font-semibold">Banner editor</h2>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setStorefrontOpen((open) => !open)}
            >
              {storefrontOpen ? 'Close' : 'Edit banner'}
            </button>
          </div>

          {storefrontOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-line bg-paper p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="hero-title"
                  label="Headline"
                  value={storefront.heroTitle || ''}
                  onChange={(e) => setStorefront({ ...storefront, heroTitle: e.target.value })}
                />
                <Input
                  id="cta-text"
                  label="CTA label"
                  value={storefront.ctaText || ''}
                  onChange={(e) => setStorefront({ ...storefront, ctaText: e.target.value })}
                />
                <Input
                  id="hero-subtitle"
                  label="Subtitle"
                  value={storefront.heroSubtitle || ''}
                  onChange={(e) => setStorefront({ ...storefront, heroSubtitle: e.target.value })}
                />
                <Input
                  id="cta-link"
                  label="CTA link"
                  value={storefront.ctaLink || ''}
                  onChange={(e) => setStorefront({ ...storefront, ctaLink: e.target.value })}
                />
                <Input
                  id="primary-color"
                  label="Primary color"
                  type="color"
                  value={storefront.primaryColor || '#0B6B4F'}
                  onChange={(e) => setStorefront({ ...storefront, primaryColor: e.target.value })}
                />
                <Input
                  id="background-image"
                  label="Background image URL"
                  value={storefront.backgroundImage || ''}
                  onChange={(e) => setStorefront({ ...storefront, backgroundImage: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!!storefront.published}
                  onChange={(e) => setStorefront({ ...storefront, published: e.target.checked })}
                />
                Show this banner on the public store
              </label>

              <div className="flex gap-3">
                <button className="btn-primary" onClick={saveStorefront}>Save banner</button>
                <button
                  className="btn-secondary"
                  onClick={() => setStorefront(normalizeStorefrontConfig(b.storefront || {}, b.name))}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Preview</p>
            <motion.div
              {...revealPreset(0, 14)}
              className="mt-3 rounded-2xl p-5 text-white"
              style={{
                background: storefront.published
                  ? `linear-gradient(135deg, ${storefront.primaryColor || '#0B6B4F'}, rgba(17,24,39,0.8))`
                  : '#E7F0ED',
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Featured</p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {storefront.heroTitle || b.name || 'Your storefront'}
              </h3>
              {storefront.heroSubtitle && (
                <p className="mt-2 text-sm text-white/80">{storefront.heroSubtitle}</p>
              )}
              {storefront.ctaText && (
                <span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
                  {storefront.ctaText}
                </span>
              )}
            </motion.div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Quick actions</p>
          <div className="mt-4 space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="block rounded-xl border border-line bg-paper px-3 py-3 transition hover:bg-forest-50"
              >
                <p className="font-medium text-ink">{action.label}</p>
                <p className="mt-1 text-xs text-muted">{action.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {!ctx.setup.complete && (
        <Card className="mb-5 p-5">
          <h2 className="font-semibold">Finish setting up</h2>
          <ul className="mt-3 space-y-2">
            {ctx.setup.steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 className="h-5 w-5 text-forest-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted" />
                )}
                <span className={s.done ? 'text-muted line-through' : ''}>{s.label}</span>
                {!s.done && (
                  <Link
                    className="ml-auto font-semibold text-forest underline"
                    to={{
                      profile: '/app/settings',
                      plan: '/app/billing',
                      products: '/app/products',
                      publish: '/app/settings',
                    }[s.key]}
                  >
                    Go
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Plan</p>
          <p className="mt-1 font-display text-xl font-bold">{sub.plan?.name || 'None'}</p>
          <div className="mt-2"><Badge>{sub.state || 'not active'}</Badge></div>
          {sub.currentPeriodEnd && (
            <p className="mt-2 text-xs text-muted">Paid until {date(sub.currentPeriodEnd)}</p>
          )}
          {!['active', 'grace'].includes(sub.state || '') && can('billing.manage') && (
            <Link to="/app/billing" className="btn-primary mt-3 w-full">Activate in Billing</Link>
          )}
        </Card>

        {commerceEnabled ? (
          <Card className="p-5">
            <p className="text-sm text-muted">Online store</p>
            <p className="mt-1 font-display text-xl font-bold">
              {b.storePublished ? 'Published' : 'Not published'}
            </p>
            {b.storePublished && (
              <button
                className="mt-2 flex items-center gap-1 break-all text-left text-xs text-forest underline"
                onClick={() => {
                  navigator.clipboard?.writeText(url);
                  toast('Link copied');
                }}
              >
                <Copy className="h-3 w-3 shrink-0" />
                {url}
              </button>
            )}
            {can('business.update') && (
              <button className="btn-secondary mt-3 w-full" disabled={busy} onClick={toggle}>
                {b.storePublished ? 'Unpublish' : 'Publish store'}
              </button>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-muted">Business type</p>
            <p className="mt-1 font-display text-xl font-bold">Service business</p>
            <p className="mt-2 text-sm text-muted">
              Service catalog and appointment workflows are not part of this foundation phase.
            </p>
          </Card>
        )}

        {commerceEnabled ? (
          <Card className="p-5">
            <p className="text-sm text-muted">Last 30 days (net sales)</p>
            {rep ? (
              <>
                <p className="mt-1 font-display text-2xl font-bold">{naira(rep.summary.netSales)}</p>
                <p className="mt-1 text-xs text-muted">
                  {rep.summary.online.orders} online orders · {rep.summary.pos.transactions} POS sales
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {can('reports.read')
                  ? 'Available once your plan is active.'
                  : 'Reports are available to managers and owners.'}
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-muted">Enabled modules</p>
            <p className="mt-1 font-display text-xl font-bold">Services</p>
            <p className="mt-2 text-sm text-muted">
              Your business profile, account, and subscription use the shared Zuno foundation.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
