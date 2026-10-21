const nf = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 });
export const naira = (kobo) => nf.format((kobo || 0) / 100);
export const toKobo = (v) => Math.round(Number(String(v).replace(/,/g, '')) * 100);
export const fromKobo = (k) => (k == null ? '' : String(k / 100));
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
export const label = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
