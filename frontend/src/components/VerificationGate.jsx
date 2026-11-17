import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { merchantSlugFromHost } from '../lib/merchantDomain.js';

export default function VerificationGate({ children }) {
  const { user, loading, refresh, logout } = useAuth();
  const { pathname, search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const lock = useRef(false);
  const merchantHost = merchantSlugFromHost();
  const isLink = !merchantHost && pathname === '/verify-email';
  const workspace = !merchantHost && (/^\/app(?:\/|$)/.test(pathname) || (/^\/admin(?:\/|$)/.test(pathname) && pathname !== '/admin/login'));
  const token = isLink ? new URLSearchParams(search).get('token') || '' : '';
  const confirmed = !!token && verifiedToken === token;

  const perform = async (task) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setNotice('');
    try { await task(); } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const resend = () => perform(async () => {
    const result = await api('/auth/resend-verification', { method: 'POST' });
    if (result.alreadyVerified) { await refresh(); setNotice('Your email is already verified.'); }
    else setNotice(result.message || 'Verification email submitted for delivery. Check your inbox and spam folder.');
  });
  const checkStatus = () => perform(async () => {
    const result = await api('/auth/me');
    if (result.user?.emailVerified === true) await refresh();
    else setNotice('Your email is not verified yet. Open your email link, or request a new one.');
  });
  const confirmLink = () => perform(async () => {
    await api('/auth/verify-email', { method: 'POST', body: { token }, auth: false });
    setVerifiedToken(token);
    if (user) await refresh();
  });

  if (!isLink && !workspace) return children;
  if (loading) return <main className="p-10 text-center" role="status">Checking your session...</main>;
  if (!isLink && (!user || user.emailVerified === true)) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <section className="card w-full max-w-lg p-6 sm:p-8" aria-labelledby="verification-heading">
        <p className="text-sm font-semibold text-forest">Zuno account security</p>
        <h1 id="verification-heading" className="mt-3 text-2xl font-bold">{confirmed ? 'Email verified' : 'Verify your email'}</h1>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger-100 p-3 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg bg-forest-50 p-3 text-sm text-forest">{notice}</p>}
        {isLink ? (
          confirmed ? (
            <>
              <p className="mt-4 text-sm text-muted">Your email address has been verified.</p>
              <Link className="btn-primary mt-6 w-full" to={user ? '/app' : '/login'}>Continue</Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-muted">{token ? 'Confirm below to verify your email. Links expire after 30 minutes and work only once.' : 'This link is incomplete. Open the full link from your email or request a new one.'}</p>
              {token && <button type="button" className="btn-primary mt-6 w-full" disabled={busy} onClick={confirmLink}>{busy ? 'Please wait...' : 'Confirm email address'}</button>}
              {user && user.emailVerified !== true && <button type="button" className="btn-secondary mt-3 w-full" disabled={busy} onClick={resend}>Send a new verification link</button>}
              <Link className="mt-5 block text-center text-sm text-forest underline" to={user ? '/app' : '/login'}>{user ? 'Return to workspace' : 'Sign in to resend verification'}</Link>
            </>
          )
        ) : (
          <>
            <p className="mt-4 break-words text-sm leading-6 text-muted">Verify {user.email} before accessing your workspace. If you have not received an email, request a new link below. Each link expires after 30 minutes.</p>
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" className="btn-primary w-full" disabled={busy} onClick={resend}>{busy ? 'Please wait...' : 'Resend verification email'}</button>
              <button type="button" className="btn-secondary w-full" disabled={busy} onClick={checkStatus}>I have verified my email</button>
              <button type="button" className="text-sm text-muted underline" disabled={busy} onClick={() => perform(logout)}>Sign out</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
