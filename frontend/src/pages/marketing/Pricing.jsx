import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { naira, label } from '../../lib/format.js';
import { ErrorNote, Loading, useApi } from '../../components/ui.jsx';

const FEATURE_LABELS = { online_store: 'Online storefront', products: 'Product management', orders: 'Online orders', basic_reports: 'Basic sales reports', pos: 'Integrated POS', shared_inventory: 'Shared inventory', stock_movements: 'Stock movement history', low_stock: 'Low-stock alerts', customers: 'Customer management', suppliers: 'Supplier records', purchasing: 'Basic purchasing', enhanced_reports: 'Enhanced reports', priority_support: 'Priority support' };

export default function Pricing() {
  const { data, error, loading, reload } = useApi(() => api('/billing/plans', { auth: false }), []);
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-bold">Simple, honest pricing</h1>
      <p className="mt-3 max-w-2xl text-muted">Each plan has a one-time setup fee and a monthly subscription. They are separate payments: paying the setup fee does not start your subscription, and the other way round. Prices are in naira and may be adjusted by Zuno.</p>
      {loading ? <Loading /> : error ? <div className="mt-8"><ErrorNote error={error} retry={reload} /></div> : (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {data.plans.map((p, i) => (
            <div key={p.key} className={`card flex flex-col p-6 ${i === 1 ? 'border-forest ring-2 ring-forest-100' : ''}`}>
              {i === 1 && <span className="mb-2 w-fit rounded-full bg-mango-100 px-2.5 py-0.5 text-xs font-semibold">Most complete for shops</span>}
              <h2 className="text-xl font-bold">{p.name}</h2><p className="mt-1 text-sm text-muted">{p.description}</p>
              <p className="mt-5 text-sm text-muted">Monthly</p><p className="font-display text-3xl font-bold">{p.priceIsFrom && <span className="text-base font-medium text-muted">from </span>}{naira(p.monthlyFee)}</p>
              <p className="mt-3 text-sm text-muted">One-time setup</p><p className="font-display text-xl font-semibold">{p.priceIsFrom && <span className="text-sm font-medium text-muted">from </span>}{naira(p.setupFee)}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" />{FEATURE_LABELS[f] || label(f)}</li>)}</ul>
              <Link to={`/register?plan=${p.key}`} className={`mt-6 ${i === 1 ? 'btn-primary' : 'btn-secondary'}`}>Choose {p.name}</Link>
            </div>
          ))}
        </div>
      )}
      <p className="mt-8 text-sm text-muted">A branded mobile app is a separate service with its own quotation. <Link to="/mobile-app" className="font-semibold text-forest underline">See how it works</Link>.</p>
    </section>
  );
}
