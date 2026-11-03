
import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Wordmark } from '../components/Layouts.jsx';
import { ErrorNote, Input, Spinner, Loading } from '../components/ui.jsx';

function AuthShell({ children, admin = false }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-white/[0.035]" />

        <div className="relative z-10">
          <Wordmark light />
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#D7F36A]" />
              One connected business workspace
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
              Build your business.
              <span className="mt-2 block text-[#D7F36A]">
                Run it with clarity.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-white/65">
              Bring your products, services, sales and daily operations
              together in one place. Spend less time managing tools and
              more time growing your business.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-12 max-w-md rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">
                Your business, connected
              </span>
              <span className="h-2 w-2 rounded-full bg-[#D7F36A]" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ['01', 'Products'],
                ['02', 'Services'],
                ['03', 'Operations'],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
                >
                  <span className="font-mono text-xs text-[#D7F36A]">
                    {number}
                  </span>
                  <p className="mt-3 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/55">
              <ShieldCheck className="h-4 w-4 text-[#D7F36A]" />
              One workspace. Better visibility.
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/45">
          <span>© {new Date().getFullYear()} Zuno</span>
          <span>{admin ? 'Platform administration' : 'Business management platform'}</span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:hidden">
          <Wordmark />
          {admin && (
            <span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest">
              Admin
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 px-5 pb-6 text-xs text-muted">
          {!admin && (
            <>
              <Link to="/privacy" className="hover:text-forest">Privacy</Link>
              <Link to="/terms" className="hover:text-forest">Terms</Link>
              <Link to="/support" className="hover:text-forest">Support</Link>
            </>
          )}
          {admin && <span>Restricted access · Authorized personnel only</span>}
        </div>
      </section>
    </main>
  );
}

function AuthHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-forest">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2.1rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-sm leading-6 text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  label = 'Password',
  autoComplete = 'current-password',
  hint,
  minLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor="password" className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id="password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          className="input pr-12"
          placeholder="Enter your password"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition-colors hover:text-forest"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const useForm = (initial) => {
  const [values, setValues] = useState(initial);

  const onChange = (field) => (event) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  return [values, onChange];
};

export function Login({ admin = false }) {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, onChange] = useForm({
    email: '',
    password: '',
  });

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <Navigate
        to={
          admin
            ? '/admin'
            : user.platformRole && !location.state?.from
              ? '/admin'
              : location.state?.from || '/app'
        }
        replace
      />
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const authenticatedUser = await login(
        form.email.trim(),
        form.password
      );

      navigate(
        admin
          ? authenticatedUser.platformRole
            ? '/admin'
            : '/'
          : location.state?.from || '/app',
        { replace: true }
      );
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell admin={admin}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-ink">
            {admin ? 'Secure administration' : 'Your business workspace'}
          </span>
        </div>

        <AuthHeading
          eyebrow={admin ? 'Platform access' : 'Welcome back'}
          title={admin ? 'Admin sign in' : 'Sign in to Zuno'}
          description={
            admin
              ? 'Sign in with your authorized platform administrator account.'
              : 'Enter your details to continue managing your business.'
          }
        />

        <form onSubmit={submit} className="space-y-5">
          <ErrorNote error={error} />

          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={onChange('email')}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <PasswordField
            value={form.password}
            onChange={onChange('password')}
          />

          {!admin && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-forest hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full !min-h-[50px] !rounded-xl"
          >
            {busy ? (
              <>
                <Spinner className="text-white" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {!admin && (
          <>
            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-muted">NEW TO ZUNO?</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <Link
              to="/register"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink transition-colors hover:border-forest hover:bg-forest-50"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-6 text-center text-xs leading-5 text-muted">
              Having trouble accessing your account?{' '}
              <Link to="/recover" className="font-semibold text-forest hover:underline">
                Recover your account
              </Link>
            </p>
          </>
        )}

        {admin && (
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-forest-50 p-4 text-xs leading-5 text-forest">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            This area is restricted to authorized Zuno platform personnel.
          </div>
        )}
      </motion.div>
    </AuthShell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, onChange] = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await register({
        ...form,
        phone: form.phone || undefined,
      });

      const plan = searchParams.get('plan');
      navigate(`/app/new${plan ? `?plan=${plan}` : ''}`, {
        replace: true,
      });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <AuthHeading
        eyebrow="Get started"
        title="Create your account"
        description="Set up your Zuno account and bring your business into one workspace."
      />

      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />

        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={onChange('name')}
            className="input"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={onChange('email')}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone number <span className="font-normal text-muted">(optional)</span></label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={onChange('phone')}
            className="input"
            placeholder="Your phone number"
          />
        </div>

        <PasswordField
          value={form.password}
          onChange={onChange('password')}
          label="Create password"
          autoComplete="new-password"
          minLength={10}
          hint="Use at least 10 characters."
        />

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full !min-h-[50px] !rounded-xl"
        >
          {busy ? <Spinner className="text-white" /> : 'Create account'}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-xs leading-5 text-muted">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="font-medium text-forest underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="font-medium text-forest underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-forest hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-forest">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <AuthHeading
        eyebrow="Account security"
        title="Reset your password"
        description="Enter the email address associated with your account. We'll send a reset link if an account exists."
      />

      {done ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-forest/10 bg-forest-50 p-5">
            <CheckCircle2 className="mb-3 h-7 w-7 text-forest" />
            <p className="font-semibold text-ink">Check your inbox</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              If an account exists for that email, a password reset link is on its way.
            </p>
          </div>
          <Link to="/login" className="btn-primary w-full">Return to sign in</Link>
          <p className="text-center text-sm text-muted">
            Lost access to your email?{' '}
            <Link to="/recover" className="font-semibold text-forest underline">Recover your account</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <ErrorNote error={error} />
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <button disabled={busy} className="btn-primary w-full !min-h-[50px]">
            {busy ? <Spinner className="text-white" /> : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function Reset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        auth: false,
      });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <AuthHeading
          title="Reset link missing"
          description="Open the password reset link from your email, or request a new one."
        />
        <Link to="/forgot-password" className="btn-primary w-full">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        eyebrow="Account security"
        title="Choose a new password"
        description="Create a new password for your Zuno account."
      />

      {done ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-forest-50 p-5">
            <CheckCircle2 className="mb-3 h-7 w-7 text-forest" />
            <p className="font-semibold">Password updated</p>
            <p className="mt-2 text-sm text-muted">
              Your password has been changed. Sign in with your new password.
            </p>
          </div>
          <Link to="/login" className="btn-primary w-full">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <ErrorNote error={error} />
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            label="New password"
            autoComplete="new-password"
            minLength={10}
            hint="Use at least 10 characters."
          />
          <button disabled={busy} className="btn-primary w-full !min-h-[50px]">
            {busy ? <Spinner className="text-white" /> : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function TokenPage({ title, path, successText }) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('working');
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setState('missing');
      return;
    }

    api(path, {
      method: 'POST',
      body: { token },
      auth: false,
    })
      .then(() => setState('success'))
      .catch((err) => {
        setError(err);
        setState('error');
      });
  }, [path, searchParams]);

  return (
    <AuthShell>
      <AuthHeading title={title} />

      {state === 'working' && <Loading text="Checking your link..." />}

      {state === 'success' && (
        <div className="space-y-5">
          <div className="rounded-xl bg-forest-50 p-5">
            <CheckCircle2 className="mb-3 h-7 w-7 text-forest" />
            <p className="text-sm leading-6 text-ink">{successText}</p>
          </div>
          <Link to="/login" className="btn-primary w-full">Continue to sign in</Link>
        </div>
      )}

      {state === 'error' && (
        <>
          <ErrorNote error={error} />
          <Link to="/login" className="btn-secondary mt-5 w-full">Back to sign in</Link>
        </>
      )}

      {state === 'missing' && (
        <p className="text-sm leading-6 text-muted">
          This link is incomplete. Please open the link from the email we sent.
        </p>
      )}
    </AuthShell>
  );
}

export const VerifyEmail = () => (
  <TokenPage
    title="Verify your email"
    path="/auth/verify-email"
    successText="Your email address has been verified."
  />
);

export const ConfirmContact = () => (
  <TokenPage
    title="Confirm your new email"
    path="/auth/confirm-contact-change"
    successText="Your new email address has been confirmed. Sign in again with it."
  />
);
