import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, X, Inbox } from 'lucide-react';
import { label } from '../lib/format.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Spinner({ className }) { return <Loader2 className={cx('h-5 w-5 animate-spin text-forest-500', className)} aria-label="Loading" />; }
export const Loading = ({ text = 'Loading' }) => <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status"><Spinner />{text}</div>;

export function ErrorNote({ error, retry }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-100 p-3 text-sm text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{error.message || String(error)}{retry && <button onClick={retry} className="ml-2 font-semibold underline">Try again</button>}</div>
    </div>
  );
}
export const Notice = ({ children, tone = 'info' }) => (
  <div className={cx('rounded-lg border p-3 text-sm', tone === 'warn' ? 'border-mango/40 bg-mango-100' : tone === 'ok' ? 'border-forest-500/30 bg-forest-50' : 'border-line bg-white')}>{children}</div>
);

export function Empty({ title, hint, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center sm:py-16">
      <div className="rounded-2xl bg-forest-50 p-5 text-forest"><Icon className="h-10 w-10" aria-hidden /></div>
      <p className="mt-5 font-display text-xl font-bold">{title}</p>
      {hint && <p className="mt-2 max-w-md text-sm leading-6 text-muted sm:text-base">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const TONES = {
  ok: 'bg-forest-100 text-forest', warn: 'bg-mango-100 text-[#7A4A00]', bad: 'bg-danger-100 text-danger', neutral: 'bg-paper text-muted border border-line',
};
const STATUS_TONE = { paid: 'ok', active: 'ok', delivered: 'ok', completed: 'ok', success: 'ok', approved: 'ok', resolved: 'ok', received: 'ok', published: 'ok',
  pending: 'warn', new: 'warn', processing: 'warn', grace: 'warn', submitted: 'warn', under_review: 'warn', more_info_required: 'warn', refund_pending: 'warn', in_progress: 'warn', open: 'warn', draft: 'neutral',
  failed: 'bad', cancelled: 'bad', rejected: 'bad', expired: 'bad', suspended: 'bad', voided: 'bad', refunded: 'neutral', closed: 'neutral' };
export const Badge = ({ children, tone }) => <span className={cx('inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone || STATUS_TONE[children] || 'neutral'])}>{typeof children === 'string' ? label(children) : children}</span>;

export function Field({ label: l, error, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{l}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
export const Input = ({ id, label: l, hint, error, ...p }) => <Field label={l} hint={hint} error={error} htmlFor={id}><input id={id} className="input" {...p} /></Field>;
export const Textarea = ({ id, label: l, hint, error, ...p }) => <Field label={l} hint={hint} error={error} htmlFor={id}><textarea id={id} rows={4} className="input" {...p} /></Field>;
export const Select = ({ id, label: l, hint, error, children, ...p }) => <Field label={l} hint={hint} error={error} htmlFor={id}><select id={id} className="input" {...p}>{children}</select></Field>;

export const Card = ({ className, children }) => <div className={cx('card', className)}>{children}</div>;
export const PageHeader = ({ title, sub, actions }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.activeElement;
    setTimeout(() => ref.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.18 }}
            className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
            <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="rounded p-1 text-muted hover:bg-paper" aria-label="Close"><X className="h-5 w-5" /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'ok') => { const id = Math.random(); setItems((i) => [...i, { id, message, tone }]); setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4000); }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        <AnimatePresence>{items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cx('pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg', t.tone === 'bad' ? 'bg-danger' : 'bg-forest')}>
            {t.tone === 'bad' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{t.message}
          </motion.div>))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/** Small data hook: { data, error, loading, reload } */
export function useApi(fn, deps = []) {
  const [s, setS] = useState({ data: null, error: null, loading: true });
  const run = useCallback(async () => {
    setS((p) => ({ ...p, loading: true, error: null }));
    try { setS({ data: await fn(), error: null, loading: false }); } catch (e) { setS({ data: null, error: e, loading: false }); }
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...s, reload: run };
}

export function Pager({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2"><button className="btn-secondary !min-h-[36px] !py-1" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button className="btn-secondary !min-h-[36px] !py-1" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div>
    </div>
  );
}

export const Table = ({ head, children }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
    <thead className="border-b border-line text-xs text-muted"><tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
    <tbody className="divide-y divide-line">{children}</tbody></table></div>
);

export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'bad'); return undefined; } finally { setBusy(false); }
  };
  return [run, busy];
}
