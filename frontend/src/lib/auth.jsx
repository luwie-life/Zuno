import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getBizId, getToken, setBizId, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [ctx, setCtx] = useState(null); // current business context (role, permissions, subscription, setup)
  const [loading, setLoading] = useState(!!getToken());

  const signOutLocal = useCallback(() => { setToken(null); setUser(null); setBusinesses([]); setCtx(null); }, []);

  const loadBiz = useCallback(async (list) => {
    let id = getBizId();
    if (!list.find((b) => b.id === id)) id = list[0]?.id || null;
    setBizId(id);
    if (!id) return setCtx(null);
    try { setCtx(await api('/businesses/current', { biz: true })); } catch { setCtx(null); }
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const me = await api('/auth/me');
      setUser(me.user); setBusinesses(me.businesses);
      await loadBiz(me.businesses);
    } catch { signOutLocal(); } finally { setLoading(false); }
  }, [loadBiz, signOutLocal]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { window.addEventListener('zuno:signed-out', signOutLocal); return () => window.removeEventListener('zuno:signed-out', signOutLocal); }, [signOutLocal]);

  const value = useMemo(() => ({
    user, businesses, ctx, loading, refresh,
    can: (p) => !!ctx?.permissions?.includes(p),
    hasFeature: (f) => (ctx?.subscription?.features || (['active', 'grace'].includes(ctx?.subscription?.state) ? ctx?.subscription?.plan?.features : []))?.includes(f) || false,
    async login(email, password) { const r = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false }); setToken(r.token); await refresh(); return r.user; },
    async register(body) { const r = await api('/auth/register', { method: 'POST', body, auth: false }); setToken(r.token); await refresh(); return r.user; },
    async logout() { try { await api('/auth/logout', { method: 'POST' }); } catch { /* already invalid */ } signOutLocal(); },
    async switchBusiness(id) { setBizId(id); await refresh(); },
  }), [user, businesses, ctx, loading, refresh, signOutLocal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
