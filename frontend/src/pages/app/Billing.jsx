import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { naira, date, label } from '../../lib/format.js';
import { Badge, Card, ErrorNote, Loading, Notice, PageHeader, Table, useApi, useAction, useToast } from '../../components/ui.jsx';

const STATE_TEXT = { pending_setup: 'Setup fee not paid yet', pending_payment: 'Monthly subscription not paid yet', active: 'Active', grace: 'Payment overdue: grace period', expired: 'Expired: paid features are paused', cancelled: 'Cancelled', suspended: 'Suspended' };

export default function Billing() {
  const { refresh } = useAuth(); const toast = useToast(); const [sp, setSp] = useSearchParams(); const [run, busy] = useAction();
  const { data, loading, error, reload } = useApi(() => api('/billing', { biz: true }), []);
  const [verifying, setVerifying] = useState(false);
  const ref = sp.get('reference') || sp.get('trxref');
  useEffect(() => { if (!ref) return; setVerifying(true); api(`/billing/verify?reference=${encodeURIComponent(ref)}`, { biz: true }).then((r) => { toast(r.result === 'success' || r.result === 'already_processed' ? 'Payment confirmed' : r.result === 'pending' ? 'Payment not completed' : 'We could not confirm that payment', r.result === 'success' || r.result === 'already_processed' ? 'ok' : 'bad'); }).catch((e) => toast(e.message, 'bad')).finally(() => { setVerifying(false); setSp({}, { replace: true }); reload(); refresh(); }); }, [ref]); // eslint-disable-line
  if (loading || verifying) return <Loading text={verifying ? 'Confirming your payment with Paystack' : 'Loading'} />;
  if (error) return <ErrorNote error={error} retry={reload} />;
  const d = data; const pay = (purpose) => run(async () => { const r = await api('/billing/checkout', { method: 'POST', biz: true, body: { purpose } }); window.location.href = r.authorizationUrl; });
  const setupDue = d.pendingPlan ? true : d.setupStatus === 'unpaid';
  return (<>
    <PageHeader title="Billing" sub="Setup fee and monthly subscription are separate payments." />
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5"><p className="text-sm text-muted">Current plan</p><p className="font-display text-2xl font-bold">{d.plan?.name}</p><div className="mt-2 flex items-center gap-2"><Badge tone={['active'].includes(d.state) ? 'ok' : d.state === 'grace' ? 'warn' : 'bad'}>{STATE_TEXT[d.state] || d.state}</Badge></div>
        <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Setup fee {d.plan && `(${naira(d.plan.setupFee)})`}</dt><dd><Badge>{d.setupStatus === 'paid' ? 'paid' : d.setupStatus === 'waived' ? 'waived' : 'unpaid'}</Badge></dd></div><div className="flex justify-between"><dt>Monthly {d.plan && `(${naira(d.plan.monthlyFee)})`}</dt><dd>{d.currentPeriodEnd ? `Paid until ${date(d.currentPeriodEnd)}` : 'Not paid yet'}</dd></div>{d.card && <div className="flex justify-between"><dt>Saved authorisation</dt><dd>{d.card.brand} •••• {d.card.last4}</dd></div>}</dl>
        {d.pendingPlan && <Notice tone="warn">Upgrade to <strong>{d.pendingPlan.name}</strong> starts after you pay the setup-fee difference.</Notice>}
        {d.scheduledPlan && <Notice>Your plan changes to <strong>{d.scheduledPlan.name}</strong> at your next renewal.</Notice>}
        <div className="mt-4 flex flex-wrap gap-2">{setupDue && <button className="btn-primary" disabled={busy} onClick={() => pay('setup_fee')}>Pay setup fee</button>}<button className="btn-primary" disabled={busy || (d.setupStatus === 'unpaid' && !d.pendingPlan && d.plan?.setupFee > 0)} onClick={() => pay('subscription')}>{d.currentPeriodEnd ? 'Pay for next month' : 'Pay monthly subscription'}</button></div>
        {d.setupStatus === 'unpaid' && d.plan?.setupFee > 0 && <p className="mt-2 text-xs text-muted">Pay the setup fee first, then the monthly subscription.</p>}
        <p className="mt-4 text-xs text-muted">Payments are made on Paystack's secure page. Zuno never sees your card details. Your plan activates only after we verify the payment with Paystack.</p>
        <div className="mt-3 border-t border-line pt-3 text-sm">{d.cancelAtPeriodEnd ? <button className="font-semibold text-forest underline" onClick={() => run(async () => { await api('/billing/cancel', { method: 'POST', biz: true, body: { cancel: false } }); reload(); }, 'Cancellation reverted')}>Keep my subscription</button> : <button className="text-danger underline" onClick={() => window.confirm('Cancel at the end of the paid period? Your data stays safe.') && run(async () => { await api('/billing/cancel', { method: 'POST', biz: true, body: { cancel: true } }); reload(); }, 'Will cancel at period end')}>Cancel at period end</button>}</div></Card>
      <Card className="p-5"><h2 className="font-semibold">Change plan</h2><ul className="mt-3 space-y-3">{d.plans.map((p) => { const cur = p.key === d.plan?.key; return <li key={p.key} className="rounded-lg border border-line p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{naira(p.setupFee)} setup · {naira(p.monthlyFee)}/month{p.priceIsFrom ? ' (from)' : ''}</p></div>{cur ? <Badge tone="ok">Current</Badge> : <button className="btn-secondary !min-h-[36px] !py-1" disabled={busy} onClick={() => run(async () => { const r = await api('/billing/change-plan', { method: 'POST', biz: true, body: { planKey: p.key } }); toast(r.upgrade ? 'Upgrade started: pay the setup-fee difference to activate it' : r.downgradeAtPeriodEnd ? 'Downgrade scheduled for next renewal' : 'Plan changed'); reload(); })}>Switch</button>}</div></li>; })}</ul></Card>
    </div>
    <h2 className="mb-2 mt-8 text-lg font-bold">Payment history</h2>
    <Card>{d.payments.length === 0 ? <p className="p-4 text-sm text-muted">No payments yet.</p> : <Table head={['Date', 'For', 'Amount', 'Status', 'Reference']}>{d.payments.map((p) => <tr key={p.reference}><td className="px-4 py-2.5">{date(p.createdAt)}</td><td className="px-4 py-2.5">{label(p.purpose)}</td><td className="px-4 py-2.5">{naira(p.amount)}</td><td className="px-4 py-2.5"><Badge>{p.status}</Badge></td><td className="px-4 py-2.5 text-xs text-muted">{p.reference}</td></tr>)}</Table>}</Card>
  </>);
}
