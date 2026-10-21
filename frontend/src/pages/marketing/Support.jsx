import { Link } from 'react-router-dom';
import { Mail, Phone, KeyRound } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../components/ui.jsx';

const FAQ = [
  ['Do my customers need an account to buy?', 'No. Customers check out with their name, contact details and delivery address, and pay through Paystack.'],
  ['Is the online store a mobile app?', 'No. It is a responsive website that works well on phones. A branded mobile app is a separate, individually quoted service.'],
  ['How does stock stay accurate between my website and my shop?', 'Both use one stock count. Online orders hold stock while payment is pending, then deduct it once the payment is verified. POS sales deduct immediately.'],
  ['What happens if I stop paying my subscription?', 'You get a grace period. After that your store and POS access pause. Your data is never deleted automatically.'],
  ['Are setup fee and subscription the same thing?', 'No. The setup fee is paid once. The monthly subscription is paid every month. They are tracked separately.'],
  ['I cannot sign in and lost my email or phone. What now?', 'Use the account recovery form. Our team verifies your identity before any change is made to your account.'],
];

export default function Support() {
  const { data } = useApi(() => api('/contact', { auth: false }), []);
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-bold">Support</h1>
      <div className="card mt-6 flex items-start gap-3 p-5"><KeyRound className="mt-1 h-5 w-5 text-forest-500" /><div><h2 className="font-semibold">Locked out of your account?</h2><p className="text-sm text-muted">Forgot your password, lost your email or phone, or think someone else got in.</p><div className="mt-3 flex flex-wrap gap-2"><Link to="/forgot-password" className="btn-secondary">Reset my password</Link><Link to="/recover" className="btn-primary">Recover my business account</Link></div></div></div>
      <h2 className="mt-10 text-2xl font-bold">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">{FAQ.map(([q, a]) => <details key={q} className="group p-4"><summary className="cursor-pointer list-none font-medium">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>)}</div>
      <h2 className="mt-10 text-2xl font-bold">Contact us</h2>
      <p className="mt-2 text-sm text-muted">Signed-in merchants get the fastest help from <Link className="font-semibold text-forest underline" to="/app/support">Support in the dashboard</Link>, where every request has a reference number.</p>
      <div className="mt-4 space-y-2 text-sm">
        {data?.supportEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /><a className="underline" href={`mailto:${data.supportEmail}`}>{data.supportEmail}</a></p>}
        {data?.supportPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{data.supportPhone}</p>}
        {data && !data.supportEmail && !data.supportPhone && <p className="text-muted">Public contact details have not been published yet.</p>}
      </div>
    </section>
  );
}
