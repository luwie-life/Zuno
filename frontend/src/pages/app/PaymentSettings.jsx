import { useState } from 'react';
import { CheckCircle2, CreditCard, Link2Off, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { dateTime } from '../../lib/format.js';
import { Badge, Card, ErrorNote, Input, Loading, Notice, PageHeader, useApi, useToast } from '../../components/ui.jsx';

export default function PaymentSettings() {
  const { ctx } = useAuth();
  const { data, loading, error, reload } = useApi(() => api('/payments/gateways', { biz: true }), []);
  const toast = useToast();
  const [secretKey, setSecretKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [tested, setTested] = useState(null);
  const owner = ctx?.role === 'owner';
  const gateway = data?.gateways?.find((g) => g.provider === 'paystack');

  const send = async (path, body) => {
    setBusy(true); setErr(null);
    try {
      const result = await api(path, { method: 'POST', biz: true, body });
      return result;
    } catch (e) { setErr(e); return null; }
    finally { setBusy(false); }
  };
  const testConnection = async () => {
    if (!secretKey) return;
    const result = await send('/payments/gateways/paystack/test', { secretKey });
    if (result) { setTested(result); toast('Paystack connection verified'); }
  };
  const connect = async () => {
    if (!secretKey) return;
    const result = await send('/payments/gateways/paystack/connect', { secretKey });
    if (result) { setSecretKey(''); setTested(null); await reload(); toast('Merchant Paystack account connected'); }
  };
  const disconnect = async () => {
    if (!window.confirm('Disconnect this Paystack account? New online payments will be blocked. Existing transaction records are retained.')) return;
    setBusy(true); setErr(null);
    try { await api('/payments/gateways/paystack', { method: 'DELETE', biz: true }); await reload(); toast('Paystack disconnected'); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const makeDefault = async () => {
    setBusy(true); setErr(null);
    try { await api('/payments/gateways/default', { method: 'PATCH', biz: true, body: { provider: 'paystack' } }); await reload(); toast('Default payment provider updated'); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return <>
    <PageHeader title="Payment settings" sub="Connect your business's own payment account for customer sales. Zuno's billing account is separate." />
    {loading ? <Loading /> : error ? <ErrorNote error={error} /> : <div className="max-w-3xl space-y-4">
      <Notice><span className="font-semibold">Merchant sales go directly through your gateway.</span> Zuno does not collect or pool your store or POS revenue. Platform subscription payments use a separate Zuno-owned Paystack account.</Notice>
      {(data.providers || []).map((provider) => {
        const connected = provider.id === 'paystack' && gateway?.connected;
        return <Card key={provider.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3"><div className="rounded-xl bg-forest-50 p-2.5 text-forest"><CreditCard className="h-5 w-5" /></div><div><h2 className="font-semibold">{provider.name}</h2><p className="text-sm text-muted">Customer online checkout{provider.refunds ? ' · refunds' : ''}</p></div></div>
            <Badge tone={connected ? 'ok' : 'warn'}>{connected ? 'Connected' : 'Not connected'}</Badge>
          </div>
          {connected && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper p-3 text-sm"><div><p className="font-medium">Account {gateway.maskedAccount || 'connected'}</p><p className="text-xs text-muted">{gateway.testedAt ? `Last tested ${dateTime(gateway.testedAt)}` : 'Connection test recorded'}</p></div><div className="flex gap-2">{data.defaultProvider === provider.id ? <Badge tone="ok">Default</Badge> : owner && <button className="btn-secondary !min-h-9 !py-1.5" disabled={busy} onClick={makeDefault}>Make default</button>} {owner && <button className="btn-ghost !min-h-9 !py-1.5 text-danger" disabled={busy} onClick={disconnect}><Link2Off className="h-4 w-4" />Disconnect</button>}</div></div>}
          {!connected && <p className="mt-3 text-sm text-muted">Online checkout is unavailable until this merchant connects a valid account. There is no fallback to Zuno's payment credentials.</p>}
          {owner && <div className="mt-4 border-t border-line pt-4">
            {err && <ErrorNote error={err} />}
            <label className="mb-1 block text-sm font-medium" htmlFor="merchant-paystack-secret">Paystack secret key</label>
            <Input id="merchant-paystack-secret" type="password" autoComplete="new-password" value={secretKey} onChange={(e) => { setSecretKey(e.target.value); setTested(null); }} placeholder="sk_test_… or sk_live_…" hint="Sent only to Zuno's backend, encrypted at rest, and never returned to this browser. Use a test key first." />
            <div className="mt-3 flex flex-wrap gap-2"><button className="btn-secondary" type="button" disabled={busy || !secretKey} onClick={testConnection}><ShieldCheck className="h-4 w-4" />Test connection</button><button className="btn-primary" type="button" disabled={busy || !secretKey} onClick={connect}>{connected ? 'Replace connection' : 'Connect account'}</button></div>
            {tested && <p className="mt-3 flex items-center gap-2 text-sm text-forest"><CheckCircle2 className="h-4 w-4" />Connection valid{tested.accountName ? ` · ${tested.accountName}` : ''}. Connect to save it securely.</p>}
          </div>}
        </Card>;
      })}
      {!owner && <p className="text-xs text-muted">Only the business owner can change gateway credentials.</p>}
    </div>}
  </>;
}
