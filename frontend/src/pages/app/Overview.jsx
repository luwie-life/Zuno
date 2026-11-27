
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  Store,
  BriefcaseBusiness,
  Layers3,
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Globe2,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';

import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date } from '../../lib/format.js';
import {
  Badge,
  Card,
  ErrorNote,
  Input,
  Loading,
  PageHeader,
  Spinner,
  useApi,
  useAction,
  useToast,
} from '../../components/ui.jsx';
import { normalizeStorefrontConfig } from '../../lib/storefront.js';
import { revealPreset } from '../../lib/animations.js';

const COLORS = {
  forest: '#0B3D2E',
  green: '#1C6F52',
  mango: '#E9A23B',
  ink: '#12201A',
  paper: '#F6F7F5',
  muted: '#68756D',
  line: '#DCE2DD',
  dark: '#0B2118',
};

const BUSINESS_TYPES = [
  {
    key: 'product',
    title: 'Product business',
    description: 'Sell physical or digital products, manage orders and grow your catalogue.',
    icon: Store,
    tag: 'Commerce',
  },
  {
    key: 'service',
    title: 'Service business',
    description: 'Offer professional services, manage appointments and organize bookings.',
    icon: BriefcaseBusiness,
    tag: 'Services',
  },
  {
    key: 'restaurant',
    title: 'Restaurant',
    description: 'Manage your food menu and give customers a dedicated online restaurant experience.',
    icon: UtensilsCrossed,
    tag: 'Food & hospitality',
  },
  {
    key: 'hybrid',
    title: 'Products and services',
    description: 'Bring your products and service operations together in one workspace.',
    icon: Layers3,
    tag: 'All-in-one',
  },
];

const STEPS = [
  { number: 1, title: 'Business type', detail: 'Your operations' },
  { number: 2, title: 'Business details', detail: 'Your identity' },
  { number: 3, title: 'Choose a plan', detail: 'Your starting point' },
];

const slugify = (value) =>
  value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const getErrorMessage = (error) => {
  if (error?.message) return error.message;
  return 'We could not check this address. Please try again.';
};

function StepProgress({ step }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STEPS.map((item) => {
        const completed = step > item.number;
        const active = step === item.number;

        return (
          <div key={item.number} className="min-w-0">
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: COLORS.line }}
            >
              <motion.div
                initial={false}
                animate={{ width: completed || active ? '100%' : '0%' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS.forest }}
              />
            </div>

            <div className="mt-3 flex items-start gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: completed || active ? COLORS.forest : COLORS.paper,
                  color: completed || active ? '#FFFFFF' : COLORS.muted,
                }}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : item.number}
              </span>

              <div className="min-w-0">
                <p
                  className="truncate text-xs font-semibold sm:text-sm"
                  style={{ color: active ? COLORS.ink : COLORS.muted }}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 hidden text-[11px] sm:block" style={{ color: COLORS.muted }}>
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusMessage({ type, children }) {
  const styles = {
    success: {
      background: '#EDF7F1',
      border: '#C9E5D3',
      color: COLORS.forest,
    },
    error: {
      background: '#FFF3F0',
      border: '#F2D2CB',
      color: '#A33C2C',
    },
    loading: {
      background: '#F2F5F2',
      border: COLORS.line,
      color: COLORS.muted,
    },
    info: {
      background: '#FBF5E9',
      border: '#F0DFBB',
      color: '#805A19',
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5"
      style={{
        backgroundColor: current.background,
        borderColor: current.border,
        color: current.color,
      }}
    >
      {type === 'success' ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : type === 'error' ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : type === 'loading' ? (
        <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function NewBusiness() {
  const { switchBusiness, user } = useAuth();
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
  const [availabilityError, setAvailabilityError] = useState('');
  const [checkedSlug, setCheckedSlug] = useState('');
  const [slugCheckAttempt, setSlugCheckAttempt] = useState(0);

  const selectedPlan = availablePlans.find((p) => p.key === form.planKey);
  const selectedType = BUSINESS_TYPES.find((t) => t.key === form.businessType);

  useEffect(() => {
    let cancelled = false;
    const slug = form.slug;

    if (!slug || slug.length < 3) {
      setAvailability(null);
      setAvailabilityError('');
      setCheckedSlug('');
      setCheckingSlug(false);
      return undefined;
    }

    setAvailability(null);
    setAvailabilityError('');
    setCheckedSlug('');
    setCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const result = await api(
          `/businesses/slug-available/${encodeURIComponent(slug)}`
        );

        if (typeof result?.available !== 'boolean') {
          throw new Error('The availability service returned an unexpected response.');
        }

        if (!cancelled) {
          setAvailability(result.available);
          setCheckedSlug(slug);
          setAvailabilityError('');
        }
      } catch (err) {
        if (!cancelled) {
          setAvailability(null);
          setCheckedSlug('');
          setAvailabilityError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setCheckingSlug(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.slug, slugCheckAttempt]);

  const update = (changes) => {
    setForm((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const retrySlugCheck = () => {
    setAvailability(null);
    setAvailabilityError('');
    setCheckedSlug('');
    setCheckingSlug(true);
    setSlugCheckAttempt((attempt) => attempt + 1);
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

      if (checkedSlug !== form.slug || checkingSlug) {
        setError(
          new Error(
            availabilityError
              ? 'We could not verify this address. Retry the availability check.'
              : 'Your Zuno address is still being checked. Please wait a moment.'
          )
        );
        return;
      }

      if (availability === false) {
        setError(new Error('This Zuno address is already taken. Choose another one.'));
        return;
      }

      if (availability !== true) {
        setError(new Error('We could not confirm that this address is available. Please retry.'));
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

    if (
      availability !== true ||
      checkedSlug !== form.slug ||
      checkingSlug
    ) {
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

nav(
  user?.emailVerified
    ? '/app'
    : '/verify-email?pending=1',
  { replace: true }
);
    } catch (err) {
      setError(err);
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const formatPrice = (amount) => {
    const value = Number(amount || 0);
    return value === 0 ? 'Free' : `${naira(value)}/month`;
  };

  const addressStatus =
    checkedSlug === form.slug
      ? availability === true
        ? 'available'
        : availability === false
          ? 'taken'
          : 'unknown'
      : checkingSlug
        ? 'checking'
        : 'idle';

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-70"
          style={{ color: COLORS.muted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Zuno
        </Link>
      </div>

      <div
        className="relative mb-7 overflow-hidden rounded-[28px] px-6 py-8 text-white sm:px-9 sm:py-10"
        style={{ backgroundColor: COLORS.dark }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.green }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-56 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: COLORS.mango }}
        />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: COLORS.mango }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              Your business starts here
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Let's build something
            <span className="block" style={{ color: COLORS.mango }}>
              worth growing.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
            Set up your business on Zuno. Bring your products, services and daily
            operations into one place.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/65">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: COLORS.mango }} />
              Simple setup
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" style={{ color: COLORS.mango }} />
              Your own online presence
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: COLORS.mango }} />
              No payment during setup
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-6 rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: COLORS.line }}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.green }}>
                  Business setup
                </p>
                <h2 className="mt-1 text-lg font-bold" style={{ color: COLORS.ink }}>
                  Step {step} of 3
                </h2>
              </div>
              <span
                className="rounded-full px-3 py-1.5 text-[10px] font-semibold"
                style={{ backgroundColor: '#EDF4F0', color: COLORS.forest }}
              >
                {Math.round((step / 3) * 100)}% complete
              </span>
            </div>

            <StepProgress step={step} />
          </div>

          <form onSubmit={submit}>
            <Card className="overflow-hidden border p-5 sm:p-7" >
              <div className="mb-6">
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: COLORS.ink }}>
                      What kind of business do you run?
                    </h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
                      Choose the setup that best describes how your business operates.
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: COLORS.ink }}>
                      Give your business an identity.
                    </h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
                      Add the details customers will recognize when they find you online.
                    </p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: COLORS.ink }}>
                      Choose how you want to start.
                    </h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
                      Pick a plan for your business. You can manage your subscription later.
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mb-5">
                  <ErrorNote error={error} />
                </div>
              )}

              {step === 1 && (
                <motion.div {...revealPreset(0, 12)}>
                  <div className="grid gap-3">
                    {BUSINESS_TYPES.map((type) => {
                      const Icon = type.icon;
                      const active = form.businessType === type.key;

                      return (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => update({ businessType: type.key })}
                          className="group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition duration-200 sm:p-5"
                          style={{
                            borderColor: active ? COLORS.forest : COLORS.line,
                            backgroundColor: active ? '#F0F6F2' : '#FFFFFF',
                            boxShadow: active ? '0 0 0 1px #0B3D2E' : 'none',
                          }}
                        >
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition"
                            style={{
                              backgroundColor: active ? COLORS.forest : COLORS.paper,
                              color: active ? '#FFFFFF' : COLORS.forest,
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold" style={{ color: COLORS.ink }}>
                                {type.title}
                              </p>
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                                style={{
                                  backgroundColor: active ? '#DCEBE2' : COLORS.paper,
                                  color: COLORS.green,
                                }}
                              >
                                {type.tag}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs leading-5 sm:text-sm" style={{ color: COLORS.muted }}>
                              {type.description}
                            </p>
                          </div>

                          <div
                            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              borderColor: active ? COLORS.forest : COLORS.line,
                              backgroundColor: active ? COLORS.forest : '#FFFFFF',
                              color: '#FFFFFF',
                            }}
                          >
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
                  <div className="space-y-5">
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

                    <div>
                      <Input
                        id="business-slug"
                        label="Your Zuno address"
                        placeholder="your-business"
                        required
                        value={form.slug}
                        onChange={(event) => update({
                          slug: slugify(event.target.value),
                        })}
                        hint="Use at least 3 letters, numbers or hyphens."
                        error={addressStatus === 'taken' ? 'This address is already taken.' : null}
                      />

                      <div
                        className="mt-2 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                        style={{
                          borderColor: COLORS.line,
                          backgroundColor: COLORS.paper,
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Globe2 className="h-4 w-4 shrink-0" style={{ color: COLORS.green }} />
                          <p className="break-all text-xs font-medium" style={{ color: COLORS.ink }}>
                            {window.location.origin}/s/{form.slug || 'your-business'}
                          </p>
                        </div>
                        {addressStatus === 'available' && (
                          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: COLORS.green }} />
                        )}
                      </div>

                      <div className="mt-3">
                        {addressStatus === 'checking' && (
                          <StatusMessage type="loading">
                            Checking whether this address is available...
                          </StatusMessage>
                        )}

                        {addressStatus === 'available' && (
                          <StatusMessage type="success">
                            <strong>This address is available.</strong> It's ready to use for your business.
                          </StatusMessage>
                        )}

                        {addressStatus === 'taken' && (
                          <StatusMessage type="error">
                            <strong>This address is already in use.</strong> Try another business name or address.
                          </StatusMessage>
                        )}

                        {availabilityError && (
                          <div className="space-y-2">
                            <StatusMessage type="error">
                              <strong>We couldn't check this address.</strong>
                              <p className="mt-1">{availabilityError}</p>
                            </StatusMessage>
                            <button
                              type="button"
                              onClick={retrySlugCheck}
                              disabled={checkingSlug || form.slug.length < 3}
                              className="inline-flex items-center gap-2 text-xs font-semibold transition hover:opacity-70 disabled:opacity-50"
                              style={{ color: COLORS.forest }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Retry availability check
                            </button>
                          </div>
                        )}

                        {addressStatus === 'idle' && !availabilityError && (
                          <StatusMessage type="info">
                            Your address will be checked automatically as you type.
                          </StatusMessage>
                        )}
                      </div>
                    </div>

                    <Input
                      id="business-category"
                      label="Business category"
                      placeholder="e.g. Fashion, Beauty, Consulting"
                      value={form.category}
                      onChange={(event) => update({ category: event.target.value })}
                    />

                    <div
                      className="flex items-center justify-between gap-3 rounded-xl border p-4"
                      style={{ borderColor: COLORS.line, backgroundColor: COLORS.paper }}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                          Selected business type
                        </p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: COLORS.ink }}>
                          {selectedType?.title || 'Not selected'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setStep(1);
                        }}
                        className="shrink-0 text-xs font-semibold underline underline-offset-4"
                        style={{ color: COLORS.forest }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div {...revealPreset(0, 12)}>
                  {plansLoading ? (
                    <Loading text="Loading available plans..." />
                  ) : plansError ? (
                    <ErrorNote error={plansError} />
                  ) : availablePlans.length === 0 ? (
                    <ErrorNote error={new Error('No active plans are available right now. Please try again later.')} />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availablePlans.map((plan) => {
                        const active = form.planKey === plan.key;

                        return (
                          <button
                            key={plan.key}
                            type="button"
                            onClick={() => update({ planKey: plan.key })}
                            className="relative rounded-2xl border p-5 text-left transition duration-200"
                            style={{
                              borderColor: active ? COLORS.forest : COLORS.line,
                              backgroundColor: active ? '#F0F6F2' : '#FFFFFF',
                              boxShadow: active ? '0 0 0 1px #0B3D2E' : 'none',
                            }}
                          >
                            {active && (
                              <span
                                className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
                                style={{ backgroundColor: COLORS.forest, color: '#FFFFFF' }}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}

                            <p className="text-sm font-semibold" style={{ color: COLORS.muted }}>
                              {plan.name}
                            </p>
                            <p className="mt-3 text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
                              {formatPrice(plan.monthlyFee)}
                            </p>

                            {plan.description && (
                              <p className="mt-2 text-xs leading-5" style={{ color: COLORS.muted }}>
                                {plan.description}
                              </p>
                            )}

                            {Array.isArray(plan.features) && plan.features.length > 0 && (
                              <ul className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: COLORS.line }}>
                                {plan.features.slice(0, 5).map((feature) => (
                                  <li key={feature} className="flex items-start gap-2 text-xs" style={{ color: COLORS.muted }}>
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: COLORS.green }} />
                                    <span>{String(feature).replace(/_/g, ' ')}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {plan.key === 'free' && (
                              <p className="mt-4 text-xs font-semibold" style={{ color: COLORS.green }}>
                                Start without paying.
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className="mt-5 flex items-start gap-3 rounded-xl border p-4"
                    style={{ backgroundColor: '#FBF5E9', borderColor: '#F0DFBB' }}
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#805A19' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                        No payment during setup
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: COLORS.muted }}>
                        Creating your business does not charge your card or initiate a payment.
                        You can activate or change your subscription later from Billing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div
                className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: COLORS.line }}
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-40"
                  style={{ borderColor: COLORS.line, color: COLORS.ink }}
                  disabled={step === 1 || busy}
                  onClick={() => {
                    setError(null);
                    setStep((current) => Math.max(1, current - 1));
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: COLORS.forest }}
                    onClick={nextStep}
                    disabled={
                      step === 2 &&
                      (
                        checkingSlug ||
                        form.slug.length < 3 ||
                        checkedSlug !== form.slug ||
                        availability !== true
                      )
                    }
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: COLORS.forest }}
                    disabled={
                      busy ||
                      plansLoading ||
                      !selectedPlan ||
                      !availablePlans.length
                    }
                  >
                    {busy ? (
                      <>
                        <Spinner className="text-white" />
                        Creating business...
                      </>
                    ) : (
                      <>
                        Create my business
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </Card>
          </form>
        </div>

        <aside className="space-y-4">
          <div
            className="rounded-2xl p-5 text-white"
            style={{ backgroundColor: COLORS.forest }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5" style={{ color: COLORS.mango }} />
            </div>
            <h3 className="mt-5 text-lg font-bold">One workspace. More possibilities.</h3>
            <p className="mt-2 text-xs leading-5 text-white/65">
              Zuno brings your business presence and essential operations together,
              so you can focus on serving customers and growing.
            </p>
            <div className="mt-5 space-y-3 border-t border-white/15 pt-4">
              {[
                'A dedicated business workspace',
                'Your own public business page',
                'Tools that grow with your business',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-white/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COLORS.mango }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.line }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: COLORS.green }}>
              Need to know
            </p>
            <h3 className="mt-2 font-semibold" style={{ color: COLORS.ink }}>
              Your setup is not permanent.
            </h3>
            <p className="mt-2 text-xs leading-5" style={{ color: COLORS.muted }}>
              You can update your business details and manage your subscription
              from your dashboard after setup.
            </p>
          </div>
        </aside>
      </div>

      <p className="mt-7 text-center text-xs" style={{ color: COLORS.muted }}>
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
  const sub = ctx.subscription || {};
  const url = `${window.location.origin}/s/${b.slug || ''}`;
  const setup = ctx.setup || { complete: true, steps: [] };
  const completedSteps = (setup.steps || []).filter((step) => step.done).length;
  const totalSteps = (setup.steps || []).length;
  const setupProgress = totalSteps
    ? Math.round((completedSteps / totalSteps) * 100)
    : 100;

  const quickActions = [
    {
      label: 'Manage products',
      detail: 'Update your catalogue',
      href: '/app/products',
      icon: Store,
      show: commerceEnabled,
    },
    {
      label: 'Manage orders',
      detail: 'Keep up with customer orders',
      href: '/app/orders',
      icon: ArrowRight,
      show: commerceEnabled,
    },
    {
      label: 'Bookings',
      detail: 'Manage appointments',
      href: '/app/bookings',
      icon: Globe2,
      show: ctx?.modules?.includes('services'),
    },
    {
      label: 'Business settings',
      detail: 'Update your business profile',
      href: '/app/settings',
      icon: ShieldCheck,
      show: true,
    },
  ].filter((action) => action.show);

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

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      toast('Store link copied');
    } catch {
      toast('Could not copy the store link.', 'bad');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome area */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[26px] bg-[#103B2B] px-5 py-7 text-white shadow-[0_16px_40px_rgba(16,59,43,0.12)] sm:px-8 sm:py-9"
      >
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[38px] border-white/[0.045]" />
        <div className="pointer-events-none absolute -bottom-28 right-[20%] h-64 w-64 rounded-full bg-[#D9F078]/[0.07] blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-[#D9F078]" />
              Your business workspace
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back.
            </h1>
            <p className="mt-2 text-lg font-semibold text-[#D9F078]">
              {b.name || 'Your business'}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              Your business, your customers and your day-to-day operations—
              everything starts here.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/storefront"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D9F078] px-5 text-xs font-bold text-[#173A29] transition hover:-translate-y-0.5 hover:bg-[#E5FA91]"
            >
              <Globe2 className="h-4 w-4" />
              Open storefront studio
            </Link>
            {b.storePublished && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-5 text-xs font-semibold text-white transition hover:bg-white/[0.15]"
              >
                View live store
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-[11px] text-white/55">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D9F078]" />
            {ctx.role || 'Workspace member'}
          </span>
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${b.storePublished ? 'bg-[#8FE0A5]' : 'bg-[#E9A23B]'}`} />
            {b.storePublished ? 'Storefront published' : 'Storefront not published'}
          </span>
          <span>{sub.plan?.name || 'Free plan'}</span>
        </div>
      </motion.section>

      {/* Setup progress */}
      {!setup.complete && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#688071]">
                Getting started
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#1B3024]">
                Let's get your business ready.
              </h2>
              <p className="mt-1 text-xs text-[#819087]">
                Complete these steps to get the most out of Zuno.
              </p>
            </div>
            <span className="rounded-full bg-[#EAF3E9] px-3 py-1.5 text-xs font-bold text-[#245B3B]">
              {setupProgress}% complete
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EDF1EC]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${setupProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-[#276B48]"
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(setup.steps || []).map((step) => (
              <div
                key={step.key}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  step.done
                    ? 'border-[#E4ECE3] bg-[#F7FAF6]'
                    : 'border-[#E8EAE2] bg-[#FCFCF9]'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#34764B]" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#A0AAA1]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${step.done ? 'text-[#718078]' : 'text-[#26392D]'}`}>
                    {step.label}
                  </p>
                  {!step.done && (
                    <Link
                      className="mt-2 inline-flex text-[11px] font-bold text-[#276B48] hover:underline"
                      to={{
                        profile: '/app/settings',
                        plan: '/app/billing',
                        products: '/app/products',
                        publish: '/app/storefront',
                      }[step.key] || '/app'}
                    >
                      Complete step <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Business snapshot */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829087]">
              Business snapshot
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#1B3024]">
              Your business at a glance
            </h2>
          </div>
          {commerceEnabled && can('reports.read') && (
            <Link to="/app/reports" className="text-xs font-semibold text-[#276B48] hover:underline">
              View reports <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#829087]">Subscription</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF4E9] text-[#34764B]">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-xl font-bold text-[#1B3024]">
              {sub.plan?.name || 'No plan'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge>{sub.state || 'not active'}</Badge>
            </div>
            {sub.currentPeriodEnd && (
              <p className="mt-3 text-[11px] text-[#829087]">
                Paid until {date(sub.currentPeriodEnd)}
              </p>
            )}
            {!['active', 'grace'].includes(sub.state || '') && can('billing.manage') && (
              <Link to="/app/billing" className="mt-3 inline-flex text-xs font-semibold text-[#276B48] hover:underline">
                Review your plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#829087]">Storefront status</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1E7] text-[#94702E]">
                <Globe2 className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-xl font-bold text-[#1B3024]">
              {b.storePublished ? 'Published' : 'Draft'}
            </p>
            <p className="mt-2 text-[11px] text-[#829087]">
              {b.storePublished ? 'Your public business page is live.' : 'Your business page is not public yet.'}
            </p>
            {b.storePublished ? (
              <button onClick={copyStoreLink} className="mt-3 inline-flex items-center gap-1.5 break-all text-left text-[11px] font-semibold text-[#276B48] hover:underline">
                <Copy className="h-3 w-3 shrink-0" /> Copy store link
              </button>
            ) : (
              <Link to="/app/storefront" className="mt-3 inline-flex text-xs font-semibold text-[#276B48] hover:underline">
                Finish your storefront <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {commerceEnabled ? (
            <div className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#829087]">Net sales · 30 days</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3E9] text-[#34764B]">
                  <Store className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-4 text-xl font-bold text-[#1B3024]">
                {rep?.summary ? naira(rep.summary.netSales) : '—'}
              </p>
              <p className="mt-2 text-[11px] text-[#829087]">
                {rep?.summary
                  ? `${rep.summary.online.orders} online orders · ${rep.summary.pos.transactions} POS sales`
                  : can('reports.read')
                    ? 'Available when reporting data is ready.'
                    : 'Reports are available to managers and owners.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5EAE3] bg-white p-5">
              <p className="text-xs font-medium text-[#829087]">Business type</p>
              <p className="mt-4 text-xl font-bold text-[#1B3024]">Services</p>
              <p className="mt-2 text-[11px] text-[#829087]">Manage your services and customer appointments from this workspace.</p>
            </div>
          )}

          <div className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#829087]">Workspace access</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDF7] text-[#6E5A9A]">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-xl font-bold capitalize text-[#1B3024]">
              {ctx.role || 'Member'}
            </p>
            <p className="mt-2 text-[11px] text-[#829087]">
              Your current role and workspace permissions.
            </p>
            <Link to="/app/settings" className="mt-3 inline-flex text-xs font-semibold text-[#276B48] hover:underline">
              Manage workspace <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Storefront feature */}
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-[#E5EAE3] bg-white shadow-[0_4px_18px_rgba(25,55,37,0.025)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0EA] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829087]">
                Your online presence
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#1B3024]">
                Storefront appearance
              </h2>
            </div>
            <Link to="/app/storefront" className="inline-flex items-center gap-1 text-xs font-bold text-[#276B48] hover:underline">
              Open studio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#26392D]">
                  {b.storePublished ? 'Your storefront is live' : 'Your storefront is taking shape'}
                </p>
                <p className="mt-1 text-xs text-[#829087]">
                  {b.storePublished
                    ? 'Your customers can visit your public business page.'
                    : 'Build your page and publish it when you are ready.'}
                </p>
              </div>
              <Badge>{b.storePublished ? 'published' : 'draft'}</Badge>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E5EAE3] bg-[#F3F6F1] p-3 sm:p-4">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#89968D]">
                Storefront preview
              </p>
              <motion.div
                {...revealPreset(0, 12)}
                className="relative min-h-[170px] overflow-hidden rounded-xl p-5 text-white sm:p-7"
                style={{
                  background: storefront.published
                    ? `linear-gradient(125deg, ${storefront.primaryColor || '#0B6B4F'}, #102D22)`
                    : 'linear-gradient(125deg, #1A5139, #102D22)',
                }}
              >
                <div className="pointer-events-none absolute -right-8 -top-14 h-44 w-44 rounded-full border-[24px] border-white/[0.08]" />
                <div className="relative max-w-lg">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">
                    {b.name || 'Your business'}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {storefront.heroTitle || b.name || 'Your business, beautifully presented.'}
                  </h3>
                  {storefront.heroSubtitle && (
                    <p className="mt-2 max-w-md text-xs leading-5 text-white/70">
                      {storefront.heroSubtitle}
                    </p>
                  )}
                  <span className="mt-5 inline-flex rounded-full bg-[#D9F078] px-4 py-2 text-[10px] font-bold text-[#173A29]">
                    {storefront.ctaText || 'Explore business'}
                  </span>
                </div>
              </motion.div>
            </div>

            {storefrontOpen && (
              <div className="mt-5 space-y-4 rounded-2xl border border-[#E5EAE3] bg-[#F8FAF6] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="hero-title"
                    label="Headline"
                    value={storefront.heroTitle || ''}
                    onChange={(e) => setStorefront({ ...storefront, heroTitle: e.target.value })}
                  />
                  <Input
                    id="cta-text"
                    label="Button label"
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
                    label="Button link"
                    value={storefront.ctaLink || ''}
                    onChange={(e) => setStorefront({ ...storefront, ctaLink: e.target.value })}
                  />
                  <Input
                    id="primary-color"
                    label="Primary colour"
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

                <label className="flex items-center gap-2 text-xs font-medium text-[#526258]">
                  <input
                    type="checkbox"
                    checked={!!storefront.published}
                    onChange={(e) => setStorefront({ ...storefront, published: e.target.checked })}
                  />
                  Show this banner on the public store
                </label>

                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={saveStorefront}>
                    Save changes
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setStorefront(normalizeStorefrontConfig(b.storefront || {}, b.name))}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="btn-secondary"
                onClick={() => setStorefrontOpen((open) => !open)}
              >
                {storefrontOpen ? 'Close editor' : 'Edit banner'}
              </button>
              {can('business.update') && (
                <button className="btn-primary" disabled={busy} onClick={toggle}>
                  {busy ? 'Please wait…' : b.storePublished ? 'Unpublish store' : 'Publish store'}
                </button>
              )}
              {b.storePublished && (
                <button className="btn-secondary" onClick={copyStoreLink}>
                  <Copy className="h-4 w-4" /> Copy link
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <aside className="rounded-2xl border border-[#E5EAE3] bg-white p-5 shadow-[0_4px_18px_rgba(25,55,37,0.025)] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829087]">
            Keep things moving
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#1B3024]">
            Quick actions
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#829087]">
            Jump straight into the tools you use most.
          </p>

          <div className="mt-5 space-y-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.045 }}
                >
                  <Link
                    to={action.href}
                    className="group flex items-center gap-3 rounded-xl border border-[#E9EDE7] bg-[#FBFCF9] p-3 transition duration-200 hover:-translate-y-0.5 hover:border-[#C9DCCB] hover:bg-[#F1F7EF]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3E9] text-[#34764B] transition group-hover:bg-[#DCEBDD]">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[#26392D]">
                        {action.label}
                      </span>
                      <span className="mt-1 block text-[10px] text-[#829087]">
                        {action.detail}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#9BA79D] transition group-hover:translate-x-1 group-hover:text-[#276B48]" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl bg-[#103B2B] p-4 text-white">
            <div className="flex items-center gap-2 text-[#D9F078]">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                A little reminder
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/75">
              Keep your business details, products and storefront up to date.
              A clear online presence makes it easier for customers to find you.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
