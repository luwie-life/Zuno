import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LayoutDashboard, Package, ShoppingBag, Store, Boxes, Users, BarChart3, CreditCard, LifeBuoy, Smartphone, UserCog, Settings, LogOut, Lock, MoreHorizontal, ShieldCheck, Building2, KeyRound, Receipt, ScrollText, Truck, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api, getToken } from '../lib/api.js';
import { Loading, useApi, cx } from './ui.jsx';

export const Wordmark = ({ light }) => <Link to="/" className={cx('font-display text-2xl font-bold tracking-tight', light ? 'text-white' : 'text-forest')}>Zuno</Link>;

export function MarketingLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const links = [['/#product', 'Product'], ['/pricing', 'Pricing'], ['/mobile-app', 'Mobile app'], ['/support', 'Support']];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main">{links.map(([to, t]) => <Link key={t} to={to} className="text-muted hover:text-ink">{t}</Link>)}</nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? <Link to="/app" className="btn-primary">Open dashboard</Link> : <><Link to="/login" className="btn-ghost">Sign in</Link><Link to="/register" className="btn-primary">Start your store</Link></>}
          </div>
          <button className="rounded p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        <AnimatePresence>{open && (
          <motion.nav initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-line bg-paper md:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1 p-4">
              {links.map(([to, t]) => <Link key={t} to={to} className="rounded-lg px-3 py-3 font-medium hover:bg-forest-50">{t}</Link>)}
              {user ? <Link to="/app" className="btn-primary mt-2">Open dashboard</Link> : <><Link to="/login" className="btn-secondary mt-2">Sign in</Link><Link to="/register" className="btn-primary">Start your store</Link></>}
            </div>
          </motion.nav>)}</AnimatePresence>
      </header>
      <main><Outlet /></main>
      <footer className="mt-24 bg-forest text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-4">
          <div className="sm:col-span-2"><Wordmark light /><p className="mt-3 max-w-xs text-sm text-white/70">Online store, in-person sales and one shared inventory for Nigerian businesses.</p></div>
          <div className="text-sm"><p className="mb-2 font-semibold">Product</p><ul className="space-y-1.5 text-white/70"><li><Link to="/pricing">Pricing</Link></li><li><Link to="/mobile-app">Branded mobile app</Link></li><li><Link to="/register">Create an account</Link></li></ul></div>
          <div className="text-sm"><p className="mb-2 font-semibold">Help</p><ul className="space-y-1.5 text-white/70"><li><Link to="/support">Support and FAQ</Link></li><li><Link to="/recover">Recover my business account</Link></li><li><Link to="/privacy">Privacy policy</Link></li><li><Link to="/terms">Terms of service</Link></li></ul></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} Zuno</div>
      </footer>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user && !getToken()) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/products', label: 'Products', icon: Package, perm: 'products.write', alsoRead: true },
  { to: '/app/orders', label: 'Orders', icon: ShoppingBag, perm: 'orders.write' },
  { to: '/app/pos', label: 'POS', icon: Store, feature: 'pos', perm: 'pos.sell', cashier: true },
  { to: '/app/inventory', label: 'Inventory', icon: Boxes, feature: 'shared_inventory', cashier: true },
  { to: '/app/customers', label: 'Customers', icon: Users, feature: 'customers', cashier: true },
  { to: '/app/reports', label: 'Reports', icon: BarChart3, perm: 'reports.read' },
  { to: '/app/billing', label: 'Billing', icon: CreditCard, perm: 'billing.manage' },
  { to: '/app/mobile-app', label: 'Mobile app', icon: Smartphone, perm: 'apps.read' },
  { to: '/app/team', label: 'Team', icon: UserCog, perm: 'staff.manage' },
  { to: '/app/support', label: 'Support', icon: LifeBuoy },
  { to: '/app/settings', label: 'Settings', icon: Settings, perm: 'business.update' },
  { to: '/app/settings/payments', label: 'Payments', icon: CreditCard, perm: 'business.update' },
];

export function AppLayout() {
  const { user, ctx, businesses, can, hasFeature, logout, switchBusiness, loading } = useAuth();
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMore(false), [pathname]);
  if (loading) return <Loading />;

  const items = NAV.filter((n) => !n.perm || can(n.perm) || n.cashier || (n.alsoRead && can('products.read')));
  const mobileMain = ['/app', '/app/products', '/app/pos', '/app/orders'].map((to) => items.find((i) => i.to === to)).filter(Boolean);
  const Item = ({ n, mobile }) => {
    const locked = n.feature && !hasFeature(n.feature);
    return (
      <NavLink to={n.to} end={n.end} className={({ isActive }) => cx(mobile ? 'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[11px]' : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium', isActive ? 'bg-forest-50 text-forest' : 'text-muted hover:bg-forest-50/60 hover:text-ink', mobile && 'rounded-lg')}>
        <n.icon className="h-5 w-5" aria-hidden />{n.label}{locked && <Lock className="ml-auto h-3.5 w-3.5 opacity-60" aria-label="Not in your plan" />}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white p-3 md:flex">
        <div className="px-3 py-3"><Wordmark /></div>
        {businesses.length > 1 && <BizSwitch />}
        <nav className="mt-2 flex-1 space-y-0.5" aria-label="Dashboard">{items.map((n) => <Item key={n.to} n={n} />)}</nav>
        <div className="border-t border-line pt-3"><p className="truncate px-3 text-xs text-muted">{user?.email}</p><button onClick={async () => { await logout(); nav('/'); }} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-paper"><LogOut className="h-5 w-5" />Sign out</button></div>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden"><Wordmark /><span className="max-w-[55%] truncate text-sm text-muted">{ctx?.business?.name}</span></div>
        {ctx?.business?.status === 'suspended' && <div className="bg-danger px-4 py-2 text-center text-sm text-white">This business is suspended: {ctx.business.suspensionReason || 'contact support'}. Your data is safe.</div>}
        {user && !user.emailVerified && <VerifyBanner />}
        <div className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden" aria-label="Primary">
        {mobileMain.map((n) => <Item key={n.to} n={n} mobile />)}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] text-muted"><MoreHorizontal className="h-5 w-5" />More</button>
      </nav>
      <AnimatePresence>{more && (
        <motion.div className="fixed inset-0 z-50 bg-ink/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)}>
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-2">{items.filter((i) => !mobileMain.includes(i)).map((n) => <Item key={n.to} n={n} mobile />)}</div>
            {businesses.length > 1 && <div className="mt-3"><BizSwitch /></div>}
            <button onClick={async () => { await logout(); nav('/'); }} className="btn-secondary mt-4 w-full"><LogOut className="h-4 w-4" />Sign out</button>
          </motion.div>
        </motion.div>)}</AnimatePresence>
    </div>
  );
}

function BizSwitch() {
  const { businesses, ctx, switchBusiness } = useAuth();
  return (
    <div className="relative px-1"><select aria-label="Switch business" className="input appearance-none pr-8 text-sm font-medium" value={ctx?.business?._id || ''} onChange={(e) => switchBusiness(e.target.value)}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-muted" /></div>
  );
}
function VerifyBanner() {
  const [sent, setSent] = useState(false);
  return <div className="flex flex-wrap items-center justify-center gap-2 bg-mango-100 px-4 py-2 text-center text-sm">Verify your email to publish your store. <button className="font-semibold underline" disabled={sent} onClick={async () => { await api('/auth/resend-verification', { method: 'POST' }).catch(() => {}); setSent(true); }}>{sent ? 'Check your inbox' : 'Resend link'}</button></div>;
}

const ANAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/merchants', label: 'Merchants', icon: Users, perm: 'merchants.read' },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2, perm: 'businesses.read' },
  { to: '/admin/recovery', label: 'Account recovery', icon: KeyRound, perm: 'recovery.read' },
  { to: '/admin/subscriptions', label: 'Plans & subscriptions', icon: CreditCard, perm: 'subscriptions.read' },
  { to: '/admin/payments', label: 'Payments', icon: Receipt, perm: 'payments.read' },
  { to: '/admin/mobile-apps', label: 'Mobile apps', icon: Smartphone, perm: 'apps.review' },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy, perm: 'support.manage' },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, perm: 'audit.read' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, perm: '*' },
];
const PERMS = { owner: ['*'], support: ['merchants.read', 'businesses.read', 'recovery.read', 'support.manage', 'audit.read', 'apps.review'], billing: ['merchants.read', 'businesses.read', 'subscriptions.read', 'payments.read', 'apps.review', 'audit.read'] };

export function AdminLayout() {
  const { user, logout, loading } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!user.platformRole) return <Navigate to="/" replace />;
  const perms = PERMS[user.platformRole] || [];
  const items = ANAV.filter((n) => !n.perm || perms.includes('*') || perms.includes(n.perm));
  const links = <nav className="space-y-0.5" aria-label="Admin">{items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium', isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10')}><n.icon className="h-5 w-5" />{n.label}</NavLink>)}</nav>;
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-forest p-3 md:flex"><div className="flex items-center gap-2 px-3 py-3"><Wordmark light /><span className="rounded bg-mango px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink">Control</span></div><div className="mt-2 flex-1">{links}</div><div className="border-t border-white/15 pt-3 text-xs text-white/70"><p className="px-3">{user.email}</p><p className="px-3 capitalize">{user.platformRole} admin</p><button onClick={async () => { await logout(); nav('/admin/login'); }} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"><LogOut className="h-5 w-5" />Sign out</button></div></aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between bg-forest px-4 md:hidden"><Wordmark light /><button onClick={() => setOpen(!open)} className="text-white" aria-label="Menu">{open ? <X /> : <Menu />}</button></div>
        {open && <div className="bg-forest p-3 md:hidden">{links}<button onClick={async () => { await logout(); nav('/admin/login'); }} className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80">Sign out</button></div>}
        <div className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
