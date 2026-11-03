import { Link } from 'react-router-dom';
import { Smartphone, FileText, ClipboardCheck, Hammer, PackageCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { naira } from '../../lib/format.js';
import { useApi } from '../../components/ui.jsx';

export default function MobileApp() {
  const { data } = useApi(() => api('/mobile-apps/pricing', { auth: false }), []);
  const steps = [[FileText, 'Apply', 'Tell us about your business, platform (Android, iOS or both) and the features you want. Applying is free and creates no charge.'], [ClipboardCheck, 'Quotation', 'Our team reviews your request and may ask questions. If it is a fit, we send a quotation you can accept or decline.'], [Hammer, 'Development', 'After you approve and the setup fee is recorded, your app is built. You can follow progress in your dashboard.'], [PackageCheck, 'Delivery and publication', 'We deliver the finished app. Publication on Google Play or the App Store is a separate step and is only confirmed once it has actually happened.']];

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <div className="rounded-[28px] bg-forest-50 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-white"><Smartphone className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">Branded app</p>
            <h1 className="mt-2 text-4xl font-bold sm:text-5xl">A mobile app that carries your brand.</h1>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">A branded app is a custom Android and/or iOS application built around your business identity. It gives customers a faster path to your brand, your products and your services from a home-screen icon.</p>
        <div className="mt-6 rounded-2xl border border-mango/40 bg-mango-100 p-4 text-sm leading-6 text-ink"><strong>Important:</strong> this is not the same as your Zuno storefront. Your online store is a website that works in any browser and comes with your plan. A branded app is a separate custom project with its own quotation and approval step.</div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          ['Who it is for', 'Businesses that want a stronger branded customer experience and an icon on their customer’s device.'],
          ['What is included', 'Custom visual design, app flow, and delivery guidance for Android and/or iOS depending on the project.'],
          ['What it is not', 'Not a replacement for your store; it is a separate branded layer on top of the Zuno business system.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-3xl font-bold">The process</h2>
      <ol className="mt-6 space-y-5">{steps.map(([I, t, d], i) => <li key={t} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest"><I className="h-5 w-5" /></span><div><h3 className="font-semibold">{i + 1}. {t}</h3><p className="text-sm leading-6 text-muted">{d}</p></div></li>)}</ol>

      {data && <div className="card mt-10 p-5"><h2 className="text-lg font-bold">Indicative pricing</h2><p className="mt-1 text-sm text-muted">Starting points only. You always receive a written quotation first.</p><ul className="mt-3 space-y-2 text-sm"><li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-forest" />Branded app setup: from <strong>{naira(data.setupFrom)}</strong></li><li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-forest" />Support and maintenance: from <strong>{naira(data.monthlyFrom)}</strong> per month</li></ul></div>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link to="/app/mobile-app" className="btn-primary">Apply for a mobile app <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/pricing" className="btn-secondary">View plans</Link>
      </div>
      <p className="mt-2 text-xs text-muted">You need a Zuno account and business to apply.</p>
    </section>
  );
}
