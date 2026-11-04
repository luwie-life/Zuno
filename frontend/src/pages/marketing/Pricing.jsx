
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
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
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
          Pricing
        </p>

        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Simple pricing that scales with your business.
        </h1>

        <p className="mt-4 text-lg leading-8 text-muted">
          Start with the essentials and unlock more tools as your business
          grows. One straightforward monthly subscription, with no setup fees.
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="mt-8">
          <ErrorNote error={error} retry={reload} />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const popular = plan.key === 'growth';
            const isFree = Number(plan.monthlyFee) === 0;

            return (
              <div
                key={plan.key}
                className={`card flex flex-col p-6 ${
                  popular ? 'border-forest ring-2 ring-forest-100' : ''
                }`}
              >
                {popular && (
                  <span className="mb-2 w-fit rounded-full bg-mango-100 px-2.5 py-0.5 text-xs font-semibold">
                    Most popular
                  </span>
                )}

                <h2 className="text-xl font-bold">{plan.name}</h2>

                <p className="mt-1 min-h-10 text-sm text-muted">
                  {plan.description}
                </p>

                <p className="mt-5 text-sm text-muted">
                  {isFree ? 'Free forever' : 'Monthly subscription'}
                </p>

                <p className="font-display text-3xl font-bold">
                  {plan.priceIsFrom && (
                    <span className="text-base font-medium text-muted">
                      from{' '}
                    </span>
                  )}
                  {naira(plan.monthlyFee)}
                </p>

                {!isFree && (
                  <p className="mt-2 text-xs text-muted">
                    Billed monthly. No setup fees.
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {(plan.features || []).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" />
                      <span>
                        {FEATURE_LABELS[feature] || label(feature)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/register?plan=${encodeURIComponent(plan.key)}`}
                  className={`mt-6 inline-flex items-center justify-center gap-2 ${
                    popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {isFree ? 'Get started free' : `Choose ${plan.name}`}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-line bg-forest-50 p-5 text-sm text-muted">
        A branded mobile app is a separate service with a custom quotation and
        approval step.{' '}
        <Link
          to="/mobile-app"
          className="font-semibold text-forest underline"
        >
          See how it works
        </Link>
        .
      </div>
    </section>
  );
}
