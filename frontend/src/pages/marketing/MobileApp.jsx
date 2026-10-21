import { Link } from 'react-router-dom';
import { Smartphone, FileText, ClipboardCheck, Hammer, PackageCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { naira } from '../../lib/format.js';
import { useApi } from '../../components/ui.jsx';

export default function MobileApp() {
  const { data } = useApi(() => api('/mobile-apps/pricing', { auth: false }), []);
  const steps = [[FileText, 'Apply', 'Tell us about your business, platform (Android, iOS or both) and the features you want. Applying is free and creates no charge.'], [ClipboardCheck, 'Quotation', 'Our team reviews your request and may ask questions. If it is a fit, we send a quotation you can accept or decline.'], [Hammer, 'Development', 'After you approve and the setup fee is recorded, your app is built. You can follow progress in your dashboard.'], [PackageCheck, 'Delivery and publication', 'We deliver the finished app. Publication on Google Play or the App Store is a separate step and is only confirmed once it has actually happened.']];
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <Smartphone className="h-8 w-8 text-forest-500" />
      <h1 className="mt-3 text-4xl font-bold">A mobile app with your brand on it</h1>
      <p className="mt-4 text-lg text-muted">A branded app is a custom Android and/or iOS application that carries your name, logo and colours and works with your Zuno store. It gives loyal customers an icon on their home screen.</p>
      <div className="mt-6 rounded-xl border border-mango/40 bg-mango-100 p-4 text-sm"><strong>Not the same as your Zuno store.</strong> Your online storefront is a website that works in any browser and is included in your plan. A branded app is a separate project: custom-built, individually quoted, and delivered after you approve a quotation.</div>
      <h2 className="mt-12 text-2xl font-bold">The process</h2>
      <ol className="mt-5 space-y-5">{steps.map(([I, t, d], i) => <li key={t} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest"><I className="h-5 w-5" /></span><div><h3 className="font-semibold">{i + 1}. {t}</h3><p className="text-sm text-muted">{d}</p></div></li>)}</ol>
      {data && <div className="card mt-10 p-5"><h2 className="text-lg font-bold">Indicative pricing</h2><p className="mt-1 text-sm text-muted">Starting points only. You always receive a written quotation first.</p><ul className="mt-3 space-y-1 text-sm"><li>Branded app setup: from <strong>{naira(data.setupFrom)}</strong></li><li>Support and maintenance: from <strong>{naira(data.monthlyFrom)}</strong> per month</li></ul></div>}
      <div className="mt-8"><Link to="/app/mobile-app" className="btn-primary">Apply for a mobile app</Link><p className="mt-2 text-xs text-muted">You need a Zuno account and business to apply.</p></div>
    </section>
  );
}
