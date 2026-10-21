const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN = 'zuno_token';
const BIZ = 'zuno_biz';

export const getToken = () => localStorage.getItem(TOKEN);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN));
export const getBizId = () => localStorage.getItem(BIZ);
export const setBizId = (id) => (id ? localStorage.setItem(BIZ, id) : localStorage.removeItem(BIZ));

export class ApiError extends Error {
  constructor(status, body) { super(body?.error?.message || 'Something went wrong'); this.status = status; this.code = body?.error?.code; this.details = body?.error?.details; }
}

export async function api(path, { method = 'GET', body, biz = false, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (auth && t) headers.Authorization = `Bearer ${t}`;
  if (biz) { const b = getBizId(); if (b) headers['X-Business-Id'] = b; }
  let res;
  try { res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new ApiError(0, { error: { message: 'Cannot reach the server. Check your connection and try again.' } }); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth && t) window.dispatchEvent(new Event('zuno:signed-out'));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
export const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v); }); const s = p.toString(); return s ? `?${s}` : ''; };
