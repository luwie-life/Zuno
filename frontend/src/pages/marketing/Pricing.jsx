
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Sparkles,
  Store,
  CalendarDays,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { naira, label } from '../../lib/format.js';
import { ErrorNote, Loading, useApi } from '../../components/ui.jsx';

const FEATURE_LABELS = {
  online_store: 'Online storefront',
  products: 'Product management',
  orders: 'Online orders',
  basic_reports: 'Basic sales reports',
  pos: 'Integrated POS',
  shared_inventory: 'Shared inventory',
  stock_movements: 'Stock movement history',
  low_stock: 'Low-stock alerts',
  customers: 'Customer management',
  suppliers: 'Supplier records',
  purchasing: 'Basic purchasing',
  enhanced_reports: 'Enhanced reports',
  priority_support: 'Priority support',
  services: 'Service management',
  bookings: 'Appointment bookings',
};

const PLAN_ORDER = ['free', 'starter', 'growth', 'pro'];

const PLAN_DETAILS = {
  free: {
    eyebrow: 'Start here',
    description: 'Get your business online and explore the essentials.',
  },
  starter: {
    eyebrow: 'Build your presence',
    description: 'Give your business a more complete online home.',
  },
  growth: {
    eyebrow: 'For growing businesses',
    description: 'Bring more of your daily business operations together.',
  },
  pro: {
    eyebrow: 'More control',
    description: 'Unlock a stronger toolkit for a growing operation.',
  },
};

function PlanCard({ plan }) {
  const popular = plan.key === 'growth';
  const isFree = Number(plan.monthlyFee) === 0;
  const details = PLAN_DETAILS[plan.key] || {};

  return (
    <article
      className={`relative flex flex-col rounded-[28px] border p-6 transition duration-300 hover:-translate-y-1 sm:p-7 ${
        popular
          ? 'border-forest bg-forest text-white shadow-xl shadow-forest/15'
          : 'border-line bg-white text-ink hover:border-forest/30 hover:shadow-xl hover:shadow-ink/5'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-mango px-3 py-1 text-xs font-bold text-ink">
          <Sparkles className="h-3.5 w-3.5" />
          Most popular
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${
              popular ? 'text-white/60' : 'text-muted'
            }`}
          >
            {details.eyebrow || 'Your plan'}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {plan.name}
          </h2>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            popular ? 'bg-white/10 text-mango' : 'bg-forest-50 text-forest'
          }`}
        >
          {plan.key === 'free' ? (
            <Store className="h-5 w-5" />
          ) : plan.key === 'growth' ? (
            <Zap className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>
      </div>

      <p
        className={`mt-3 min-h-[48px] text-sm leading-6 ${
          popular ? 'text-white/70' : 'text-muted'
        }`}
      >
        {plan.description || details.description}
      </p>

      <div className="mt-7 border-t border-current/10 pt-6">
        <p
          className={`text-sm ${
            popular ? 'text-white/60' : 'text-muted'
          }`}
        >
          {isFree ? 'No monthly payment' : 'Monthly subscription'}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          {plan.priceIsFrom && (
            <span
              className={`text-sm ${
                popular ? 'text-white/60' : 'text-muted'
              }`}
            >
              From
            </span>
          )}

          <span className="text-4xl font-bold tracking-tight sm:text-[2.65rem]">
            {naira(plan.monthlyFee)}
          </span>
        </div>

        <p
          className={`mt-2 text-xs ${
            popular ? 'text-white/60' : 'text-muted'
          }`}
        >
          {isFree ? 'Free to get started' : 'Billed monthly · No setup fee'}
        </p>
      </div>

      <div className="mt-7">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            popular ? 'text-white/60' : 'text-muted'
          }`}
        >
          Included features
        </p>

        <ul className="mt-4 space-y-3">
          {(plan.features || []).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  popular ? 'text-mango' : 'text-forest'
                }`}
              />
              <span className={popular ? 'text-white/85' : 'text-ink/80'}>
                {FEATURE_LABELS[feature] || label(feature)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={`/register?plan=${encodeURIComponent(plan.key)}`}
        className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
          popular
            ? 'bg-white text-forest hover:bg-mango hover:text-ink'
            : 'bg-forest text-white hover:bg-forest-700'
        }`}
      >
        {isFree ? 'Get started free' : `Choose ${plan.name}`}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function Pricing() {
  const { data, error, loading, reload } = useApi(
    () => api('/billing/plans', { auth: false }),
    [],
  );

  const plans = [...(data?.plans || [])].sort((a, b) => {
    const aIndex = PLAN_ORDER.indexOf(a.key);
    const bIndex = PLAN_ORDER.indexOf(b.key);

    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return (
    <main className="overflow-hidden bg-paper">
      {/* Hero */}
      <section className="relative bg-forest px-4 pb-20 pt-16 text-white sm:pb-24 sm:pt-24">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-[320px] w-[320px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black/10 to-transparent" />

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-mango" />
              Plans that grow with your business
            </div>

            <h1 className="mt-7 text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Start small.
              <br />
              <span className="text-mango">Grow with Zuno.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Get the tools to build your business presence and manage more of
              your day-to-day work. Start with what you need. Upgrade when
              you’re ready.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#plans"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-mango px-6 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Explore plans
                <ArrowRight className="h-4 w-4" />
              </a>

              <p className="text-sm text-white/55">
                No setup fees on subscriptions
              </p>
            </div>
          </div>

          <div className="relative mt-16 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <Store className="h-5 w-5 text-mango" />
              <p className="mt-4 font-semibold">Your online presence</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Put your business and offerings in front of customers.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-mango" />
              <p className="mt-4 font-semibold">Your daily operations</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Manage the work behind your business from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-mango" />
              <p className="mt-4 font-semibold">Room to grow</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Choose a plan that matches your current needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Choose your plan
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              The right tools for
              <br className="hidden sm:block" /> your next chapter.
            </h2>

            <p className="mt-5 text-base leading-7 text-muted">
              Compare the plans below and choose the one that fits the way
              your business works today.
            </p>
          </div>

          {loading ? (
            <div className="py-12">
              <Loading />
            </div>
          ) : error ? (
            <div className="mx-auto mt-10 max-w-2xl">
              <ErrorNote error={error} retry={reload} />
            </div>
          ) : plans.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-line bg-white p-8 text-center">
              <p className="font-semibold text-ink">
                Plans are temporarily unavailable.
              </p>
              <button
                type="button"
                onClick={reload}
                className="mt-4 text-sm font-semibold text-forest underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mt-12 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <PlanCard key={plan.key} plan={plan} />
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-6 text-muted">
            Plan prices and included features are loaded from Zuno’s current
            billing configuration.
          </p>
        </div>
      </section>

      {/* Value section */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] bg-[#E9A23B] sm:grid-cols-2">
          <div className="p-7 sm:p-12 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">
              More than a storefront
            </p>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Your business is bigger than one page.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-ink/70 sm:text-base">
              Zuno is built to help you establish your online presence and
              bring useful business tools closer together as you grow.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-ink"
            >
              Discover Zuno
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#D9942B] p-6 sm:min-h-full">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-ink/10" />
            <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full border border-ink/10" />

            <div className="relative w-full max-w-sm rotate-[-2deg] rounded-2xl border border-ink/10 bg-white p-5 shadow-2xl shadow-ink/10">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs text-muted">Business overview</p>
                  <p className="mt-1 font-semibold text-ink">
                    Your workspace
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white">
                  <Store className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-muted">Storefront</p>
                  <div className="mt-3 h-2 w-16 rounded-full bg-forest/20" />
                  <div className="mt-2 h-2 w-10 rounded-full bg-forest/10" />
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-muted">Catalogue</p>
                  <div className="mt-3 h-2 w-14 rounded-full bg-mango/70" />
                  <div className="mt-2 h-2 w-9 rounded-full bg-mango/30" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl border border-line p-3">
                <div className="h-9 w-9 rounded-lg bg-forest/10" />
                <div className="flex-1">
                  <div className="h-2 w-24 rounded-full bg-ink/15" />
                  <div className="mt-2 h-2 w-16 rounded-full bg-ink/8" />
                </div>
                <Check className="h-4 w-4 text-forest" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              A few things to know
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Before you choose.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-line border-y border-line">
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                Can I start with the free plan?
                <span className="text-xl font-normal text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Yes. Select the free plan to create an account and get started
                with the features included in that plan.
              </p>
            </details>

            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                Can I upgrade later?
                <span className="text-xl font-normal text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                You can choose a different plan when your business needs
                change. Review the plan features before upgrading.
              </p>
            </details>

            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                Are there setup fees?
                <span className="text-xl font-normal text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Zuno subscriptions do not have a setup fee. Separate services,
                such as a branded mobile app, are quoted independently.
              </p>
            </details>

            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                Is a branded mobile app included?
                <span className="text-xl font-normal text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                A branded mobile app is a separate service with a custom
                quotation and approval step.
              </p>
              <Link
                to="/mobile-app"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest"
              >
                Explore mobile apps
                <ArrowRight className="h-4 w-4" />
              </Link>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest px-4 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mango">
              Your next chapter starts here
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Make room for
              <br className="hidden sm:block" /> what your business can become.
            </h2>
          </div>

          <Link
            to="/register"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-mango px-6 text-sm font-bold text-ink transition hover:bg-white"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
