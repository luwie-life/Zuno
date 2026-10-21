import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Wordmark } from '../components/Layouts.jsx';
import { ErrorNote, Input, Spinner, Loading } from '../components/ui.jsx';

function Shell({ title, sub, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Wordmark />
      <div className="card mt-6 w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        <div className="mt-5">{children}</div>
      </div>
      {footer && <div className="mt-5 text-sm text-muted">{footer}</div>}
    </div>
  );
}
const useForm = (init) => { const [v, setV] = useState(init); return [v, (k) => (e) => setV({ ...v, [k]: e.target.value }), setV]; };

export function Login({ admin }) {
  const { login, user } = useAuth();
  const nav = useNavigate(); const loc = useLocation();
  const [f, on] = useForm({ email: '', password: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={admin ? '/admin' : user.platformRole && !loc.state?.from ? '/admin' : loc.state?.from || '/app'} replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { const u = await login(f.email, f.password); nav(admin ? (u.platformRole ? '/admin' : '/') : loc.state?.from || '/app', { replace: true }); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <Shell title={admin ? 'Platform sign in' : 'Welcome back'} sub={admin ? 'Zuno staff only.' : 'Sign in to manage your business.'}
      footer={admin ? null : <>New to Zuno? <Link className="font-semibold text-forest underline" to="/register">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={err} />
        <Input id="email" label="Email" type="email" autoComplete="email" required value={f.email} onChange={on('email')} />
        <Input id="password" label="Password" type="password" autoComplete="current-password" required value={f.password} onChange={on('password')} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Sign in'}</button>
        {!admin && <div className="flex justify-between text-sm"><Link to="/forgot-password" className="text-forest underline">Forgot password?</Link><Link to="/recover" className="text-forest underline">Can't access your account?</Link></div>}
      </form>
    </Shell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate(); const [sp] = useSearchParams();
  const [f, on] = useForm({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await register({ ...f, phone: f.phone || undefined }); nav(`/app/new${sp.get('plan') ? `?plan=${sp.get('plan')}` : ''}`, { replace: true }); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your Zuno account" sub="Then set up your business and choose a plan." footer={<>Already have an account? <Link className="font-semibold text-forest underline" to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={err} />
        <Input id="name" label="Full name" autoComplete="name" required value={f.name} onChange={on('name')} />
        <Input id="email" label="Email" type="email" autoComplete="email" required value={f.email} onChange={on('email')} />
        <Input id="phone" label="Phone (optional)" type="tel" autoComplete="tel" value={f.phone} onChange={on('phone')} hint="Helps us verify you if you ever lose access." />
        <Input id="password" label="Password" type="password" autoComplete="new-password" required minLength={10} value={f.password} onChange={on('password')} hint="At least 10 characters. A passphrase works well." />
        <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Create account'}</button>
        <p className="text-xs text-muted">By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy policy</Link>.</p>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }); setDone(true); } catch (x) { setErr(x); } finally { setBusy(false); } };
  return (
    <Shell title="Reset your password" sub="We will email you a link if an account exists for that address." footer={<Link to="/login" className="underline">Back to sign in</Link>}>
      {done ? <div className="space-y-4"><div className="flex gap-2 rounded-lg bg-forest-50 p-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-forest-500" />If an account exists for that email, a reset link is on its way. It expires soon and works once.</div><p className="text-sm text-muted">No email, or no longer have access to that inbox? <Link to="/recover" className="font-semibold text-forest underline">Recover my business account</Link>.</p></div> : (
        <form onSubmit={submit} className="space-y-4"><ErrorNote error={err} /><Input id="email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Send reset link'}</button><Link to="/recover" className="block text-center text-sm text-forest underline">I no longer have access to this email</Link></form>)}
    </Shell>
  );
}

export function Reset() {
  const [sp] = useSearchParams(); const token = sp.get('token') || '';
  const [pw, setPw] = useState(''); const [done, setDone] = useState(false); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await api('/auth/reset-password', { method: 'POST', body: { token, password: pw }, auth: false }); setDone(true); } catch (x) { setErr(x); } finally { setBusy(false); } };
  if (!token) return <Shell title="Link missing" sub="Open the link from your email, or request a new one."><Link to="/forgot-password" className="btn-primary w-full">Request a new link</Link></Shell>;
  return (
    <Shell title="Choose a new password">
      {done ? <div className="space-y-4"><div className="flex gap-2 rounded-lg bg-forest-50 p-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-forest-500" />Password updated. You were signed out on all devices.</div><Link to="/login" className="btn-primary w-full">Sign in</Link></div> : (
        <form onSubmit={submit} className="space-y-4"><ErrorNote error={err} /><Input id="pw" label="New password" type="password" autoComplete="new-password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 10 characters." /><button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Set password'}</button></form>)}
    </Shell>
  );
}

function TokenPage({ title, path, okText, children }) {
  const [sp] = useSearchParams(); const [state, setState] = useState('working'); const [err, setErr] = useState(null);
  useEffect(() => { const t = sp.get('token'); if (!t) { setState('missing'); return; } api(path, { method: 'POST', body: { token: t }, auth: false }).then(() => setState('ok')).catch((e) => { setErr(e); setState('error'); }); }, []); // eslint-disable-line
  return (
    <Shell title={title}>
      {state === 'working' && <Loading text="Checking your link" />}
      {state === 'ok' && <div className="space-y-4"><div className="flex gap-2 rounded-lg bg-forest-50 p-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-forest-500" />{okText}</div><Link to="/login" className="btn-primary w-full">Continue</Link></div>}
      {state === 'error' && <ErrorNote error={err} />}
      {state === 'missing' && <p className="text-sm text-muted">This link is incomplete. Open it from the email we sent.</p>}
    </Shell>
  );
}
export const VerifyEmail = () => <TokenPage title="Verify your email" path="/auth/verify-email" okText="Your email is verified." />;
export const ConfirmContact = () => <TokenPage title="Confirm your new email" path="/auth/confirm-contact-change" okText="Your new email is confirmed. Sign in again with it." />;
