import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { Wordmark } from '../components/Layouts.jsx';
import { Badge, ErrorNote, Input, Select, Spinner, Textarea, useToast } from '../components/ui.jsx';
import { dateTime } from '../lib/format.js';

const CATS = [['forgot_password', 'I forgot my password'], ['forgot_email', 'I forgot which email I registered with'], ['lost_email_access', 'I lost access to my registered email'], ['lost_phone_access', 'I lost access to my registered phone'], ['cannot_identify_account', 'I cannot identify my account'], ['former_admin_lost_access', 'The person who managed our account left'], ['ownership_changed', 'Business ownership or representative changed'], ['suspected_compromise', 'I think someone else accessed my account'], ['other', 'Another account access problem']];

export function Recover() {
  const toast = useToast();
  const [f, setF] = useState({ category: 'forgot_password', name: '', businessName: '', possibleEmail: '', registeredPhone: '', storeSlug: '', contactEmail: '', contactPhone: '', registrationPeriod: '', explanation: '', preferredContact: 'email', website: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    try { setDone(await api('/recovery', { method: 'POST', body, auth: false })); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  if (done) return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10"><Wordmark />
      <div className="card mt-6 p-6"><ShieldCheck className="h-8 w-8 text-forest-500" /><h1 className="mt-2 text-2xl font-bold">Request received</h1><p className="mt-1 text-sm text-muted">{done.message}</p>
        <dl className="mt-5 space-y-3 rounded-lg bg-forest-50 p-4"><div><dt className="text-xs text-muted">Reference</dt><dd className="font-display text-xl font-bold">{done.reference}</dd></div><div><dt className="text-xs text-muted">Access key (shown only once)</dt><dd className="flex items-center gap-2 font-display text-xl font-bold tracking-widest">{done.statusKey}<button type="button" aria-label="Copy access key" className="rounded p-1 hover:bg-white" onClick={() => { navigator.clipboard?.writeText(done.statusKey); toast('Copied'); }}><Copy className="h-4 w-4" /></button></dd></div></dl>
        <p className="mt-3 text-xs text-muted">Save both. You need them to check progress. We never ask for your password, and we will never share your details with anyone who only knows the reference.</p>
        <Link to="/recover/status" className="btn-primary mt-4 w-full">Check request status</Link></div></div>
  );
  return (
    <div className="mx-auto max-w-xl px-4 py-10"><Wordmark />
      <h1 className="mt-6 text-3xl font-bold">Recover my business account</h1>
      <p className="mt-2 text-sm text-muted">Tell us what happened. Our team will verify who you are before changing anything. Just forgot your password? <Link to="/forgot-password" className="font-semibold text-forest underline">Use the reset link instead</Link>, it is faster. Never include your password or card details.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-5">
        <ErrorNote error={err} />
        <Select id="cat" label="What is the problem?" value={f.category} onChange={on('category')}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Input id="name" label="Your full name" required value={f.name} onChange={on('name')} />
        <Input id="biz" label="Business name" value={f.businessName} onChange={on('businessName')} />
        <div className="grid gap-4 sm:grid-cols-2"><Input id="ce" label="Email we can reach you on now" type="email" value={f.contactEmail} onChange={on('contactEmail')} /><Input id="cp" label="Phone we can reach you on now" type="tel" value={f.contactPhone} onChange={on('contactPhone')} /></div>
        <p className="-mt-2 text-xs text-muted">Give at least one. Do not use an email or phone you cannot access.</p>
        <details className="rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-medium">Details that help us find your account (only what you know)</summary>
          <div className="mt-3 space-y-4"><Input id="pe" label="Email you may have registered with" type="email" value={f.possibleEmail} onChange={on('possibleEmail')} /><Input id="rp" label="Phone you registered with" type="tel" value={f.registeredPhone} onChange={on('registeredPhone')} /><Input id="slug" label="Store address (slug)" value={f.storeSlug} onChange={on('storeSlug')} hint="The part after /store/ in your store link." /><Input id="rg" label="Roughly when did you register?" value={f.registrationPeriod} onChange={on('registrationPeriod')} /></div></details>
        <Textarea id="ex" label="What happened?" required minLength={10} value={f.explanation} onChange={on('explanation')} />
        <Select id="pc" label="Preferred way to contact you" value={f.preferredContact} onChange={on('preferredContact')}><option value="email">Email</option><option value="phone">Phone</option></Select>
        <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={on('website')} /></label></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Submit request'}</button>
      </form>
    </div>
  );
}

export function RecoverStatus() {
  const [f, setF] = useState({ reference: '', statusKey: '' }); const [data, setData] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const toast = useToast();
  const check = async (e) => { e?.preventDefault(); setBusy(true); setErr(null); try { setData(await api('/recovery/status', { method: 'POST', body: f, auth: false })); } catch (x) { setErr(x); setData(null); } finally { setBusy(false); } };
  const reply = async (e) => { e.preventDefault(); try { await api('/recovery/respond', { method: 'POST', body: { ...f, message: msg }, auth: false }); setMsg(''); toast('Message sent'); check(); } catch (x) { toast(x.message, 'bad'); } };
  return (
    <div className="mx-auto max-w-lg px-4 py-10"><Wordmark /><h1 className="mt-6 text-3xl font-bold">Check request status</h1>
      <form onSubmit={check} className="card mt-5 space-y-4 p-5"><ErrorNote error={err} /><Input id="r" label="Reference" required value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="RC-XXXXXXXX" /><Input id="k" label="Access key" required value={f.statusKey} onChange={(e) => setF({ ...f, statusKey: e.target.value })} /><button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Check status'}</button></form>
      {data && <div className="card mt-5 p-5"><div className="flex items-center justify-between"><span className="font-semibold">{data.reference}</span><Badge>{data.status}</Badge></div>
        {data.messages.length > 0 && <ul className="mt-4 space-y-3">{data.messages.map((m, i) => <li key={i} className={`rounded-lg p-3 text-sm ${m.from === 'staff' ? 'bg-forest-50' : 'bg-paper'}`}><p className="text-xs text-muted">{m.from === 'staff' ? 'Zuno team' : 'You'} · {dateTime(m.at)}</p>{m.body}</li>)}</ul>}
        {!['closed', 'resolved', 'rejected'].includes(data.status) && <form onSubmit={reply} className="mt-4 space-y-3"><Textarea id="m" label={data.status === 'more_info_required' ? 'Send the information we asked for' : 'Add a message'} required value={msg} onChange={(e) => setMsg(e.target.value)} /><button className="btn-secondary">Send</button></form>}</div>}
    </div>
  );
}
