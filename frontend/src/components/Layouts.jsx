import { BrandIcon, BrandWordmark } from './BrandMark.jsx';
import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe2, Menu, X, LayoutDashboard, Package, ShoppingBag, Store, Boxes, Users, BarChart3, CreditCard, LifeBuoy, Smartphone, UserCog, Settings, LogOut, Lock, MoreHorizontal, ShieldCheck, Building2, KeyRound, Receipt, ScrollText, Truck, ChevronDown, UtensilsCrossed, CalendarDays, Wrench } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api, getToken } from '../lib/api.js';
import { Loading, useApi, cx } from './ui.jsx';
import { ArrowRight } from 'lucide-react';

const LogoMark = ({ light = false }) => (
  <BrandIcon light={light} size={36} />
);

export const Wordmark = ({ light }) => (
  <BrandWordmark light={light} />
);



export function MarketingLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const pages = {
      '/': {
        title: 'Zuno | Business management, online stores, POS and bookings',
        description: 'Build your business presence with Zuno. Create an online storefront, manage products and services, accept orders and bookings, and run daily business operations in one place.',
      },
      '/pricing': {
        title: 'Zuno Pricing | Business tools and online storefront plans',
        description: 'Explore Zuno plans for businesses selling products, offering services, managing bookings and running daily operations.',
      },
      '/mobile-app': {
        title: 'Zuno Mobile App | Manage your business on the go',
        description: 'Stay connected to your business with Zuno. Access important business activity and manage operations wherever you are.',
      },
      '/support': {
        title: 'Zuno Support | Help with your business workspace',
        description: 'Find help and support for setting up your Zuno business workspace, storefront, products, services and bookings.',
      },
      '/privacy': {
        title: 'Privacy Policy | Zuno',
        description: 'Read how Zuno handles personal information and protects user privacy.',
      },
      '/terms': {
        title: 'Terms of Service | Zuno',
        description: 'Read the terms that apply when using Zuno services and business tools.',
      },
    };

    const page = pages[pathname] || pages['/'];
    const canonical = `https://www.zuno.com.ng${pathname === '/' ? '/' : pathname}`;

    document.title = page.title;

    const setMeta = (attribute, key, content) => {
      let element = document.head.querySelector(
        `meta[${attribute}="${key}"]`
      );

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    setMeta('name', 'description', page.description);
    setMeta('property', 'og:title', page.title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:title', page.title);
    setMeta('name', 'twitter:description', page.description);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');

    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }

    canonicalLink.href = canonical;
  }, [pathname]);

  const links = [
    { to: '/#platform', label: 'Platform' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/mobile-app', label: 'Mobile app' },
    { to: '/support', label: 'Resources' },
  ];

  const closeMenu = () => setOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FCFCFA] text-[#17231C]">
      <header className="sticky top-0 z-50 border-b border-[#17231C]/[0.07] bg-[#FCFCFA]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            aria-label="Zuno home"
            className="relative z-10 shrink-0"
            onClick={closeMenu}
          >
            <Wordmark />
          </Link>

          <nav
            className="hidden items-center gap-9 lg:flex"
            aria-label="Main navigation"
          >
            {links.map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className={`relative py-2 text-[13px] font-medium transition-colors duration-200 ${
                  pathname === to
                    ? 'text-[#174D35]'
                    : 'text-[#657168] hover:text-[#174D35]'
                }`}
              >
                {label}
                {pathname === to && (
                  <span className="absolute -bottom-[2px] left-0 h-[2px] w-full rounded-full bg-[#174D35]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {user ? (
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-[#174D35] px-5 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#103C29]"
              >
                Open workspace
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-semibold text-[#455249] transition-colors hover:text-[#174D35]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#174D35] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(23,77,53,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#103C29] hover:shadow-[0_8px_20px_rgba(23,77,53,0.18)]"
                >
                  Get started
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#17231C]/10 bg-white text-[#17231C] transition hover:bg-[#F1F4EF] lg:hidden"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'menu'}
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {open ? <X size={19} /> : <Menu size={19} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-[#17231C]/[0.07] bg-[#FCFCFA] lg:hidden"
            >
              <nav
                aria-label="Mobile navigation"
                className="mx-auto flex max-w-[1440px] flex-col px-5 pb-6 pt-3 sm:px-8"
              >
                {links.map(({ to, label }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                  >
                    <Link
                      to={to}
                      onClick={closeMenu}
                      className="flex items-center justify-between border-b border-[#17231C]/[0.07] py-4 text-[15px] font-medium text-[#27372D] transition-colors hover:text-[#174D35]"
                    >
                      {label}
                      <ArrowRight size={16} className="text-[#89958B]" />
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {user ? (
                    <Link
                      to="/app"
                      onClick={closeMenu}
                      className="col-span-2 flex items-center justify-center rounded-full bg-[#174D35] px-5 py-3.5 text-sm font-semibold text-white"
                    >
                      Open workspace
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={closeMenu}
                        className="flex items-center justify-center rounded-full border border-[#17231C]/15 px-5 py-3.5 text-sm font-semibold text-[#27372D]"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeMenu}
                        className="flex items-center justify-center rounded-full bg-[#174D35] px-5 py-3.5 text-sm font-semibold text-white"
                      >
                        Get started
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 overflow-hidden bg-[#102D22] text-white">
        <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 sm:px-8 lg:px-12 lg:pt-20">
          <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-20">
            <div>
              <Wordmark light />

              <p className="mt-6 max-w-[390px] text-[14px] leading-7 text-white/60">
                A better way to build, manage and grow your business.
                Bring your presence, customers and everyday operations
                into one connected workspace.
              </p>

              <Link
                to="/register"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#D9F078] px-5 py-3.5 text-[13px] font-bold text-[#173A29] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E5FA91]"
              >
                Start building with Zuno
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Explore
              </h3>
              <ul className="mt-6 space-y-4 text-[13px] text-white/65">
                <li><Link to="/#platform" className="transition hover:text-white">Platform overview</Link></li>
                <li><Link to="/pricing" className="transition hover:text-white">Plans and pricing</Link></li>
                <li><Link to="/mobile-app" className="transition hover:text-white">Mobile app</Link></li>
                <li><Link to="/register" className="transition hover:text-white">Create an account</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Company & support
              </h3>
              <ul className="mt-6 space-y-4 text-[13px] text-white/65">
                <li><Link to="/support" className="transition hover:text-white">Help centre</Link></li>
                <li><Link to="/recover" className="transition hover:text-white">Account recovery</Link></li>
                <li><Link to="/privacy" className="transition hover:text-white">Privacy policy</Link></li>
                <li><Link to="/terms" className="transition hover:text-white">Terms of service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-7 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Zuno. All rights reserved.</p>
            <p className="tracking-wide">Built for the ambition behind every business.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}



export function RequireAuth({ children, allowUnverified = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <Loading />;

  const returnTo = `${loc.pathname}${loc.search}${loc.hash}`;

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: returnTo }}
        replace
      />
    );
  }

  if (!allowUnverified && !user.emailVerified) {
    return (
      <Navigate
        to="/verify-email?pending=1"
        state={{ from: returnTo }}
        replace
      />
    );
  }

  return children;
}



const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true, group: 'Workspace' },
  { to: '/app/storefront', label: 'Storefront', icon: Globe2, perm: 'business.update', group: 'Workspace' },
  { to: '/app/products', label: 'Products', icon: Package, module: 'commerce', perm: 'products.write', alsoRead: true, group: 'Manage' },
  { to: '/app/orders', label: 'Orders', icon: ShoppingBag, module: 'commerce', perm: 'orders.write', group: 'Manage' },
  { to: '/app/menu', label: 'Menu', icon: UtensilsCrossed, module: 'menu', perm: 'menu.read', group: 'Manage' },
  { to: '/app/services', label: 'Services', icon: Wrench, module: 'services', perm: 'services.read', feature: 'services', group: 'Manage' },
  { to: '/app/bookings', label: 'Bookings', icon: CalendarDays, module: 'services', perm: 'bookings.read', feature: 'bookings', group: 'Manage' },
  { to: '/app/pos', label: 'POS', icon: Store, module: 'commerce', feature: 'pos', perm: 'pos.sell', cashier: true, group: 'Operations' },
  { to: '/app/inventory', label: 'Inventory', icon: Boxes, module: 'commerce', feature: 'shared_inventory', cashier: true, group: 'Operations' },
  { to: '/app/customers', label: 'Customers', icon: Users, feature: 'customers', cashier: true, group: 'Operations' },
  { to: '/app/reports', label: 'Reports', icon: BarChart3, module: 'commerce', perm: 'reports.read', group: 'Insights' },
  { to: '/app/billing', label: 'Billing', icon: CreditCard, perm: 'billing.manage', group: 'Account' },
  { to: '/app/mobile-app', label: 'Mobile app', icon: Smartphone, perm: 'apps.read', group: 'Account' },
  { to: '/app/team', label: 'Team', icon: UserCog, perm: 'staff.manage', group: 'Account' },
  { to: '/app/support', label: 'Support', icon: LifeBuoy, group: 'Account' },
  { to: '/app/settings', label: 'Settings', icon: Settings, perm: 'business.update', group: 'Account' },
  { to: '/app/settings/payments', label: 'Payments', icon: CreditCard, perm: 'business.update', group: 'Account' },
];

export function AppLayout() {
  const { user, ctx, businesses, can, hasFeature, logout, loading } = useAuth();
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMore(false), [pathname]);

  if (loading) return <Loading />;

  const items = NAV.filter(
    (n) =>
      (!n.module || ctx?.modules?.includes(n.module)) &&
      (!n.perm || can(n.perm) || n.cashier || (n.alsoRead && can('products.read')))
  );

  const mobileMain = ['/app', '/app/storefront', '/app/products', '/app/orders']
    .map((to) => items.find((item) => item.to === to))
    .filter(Boolean);

  const groups = ['Workspace', 'Manage', 'Operations', 'Insights', 'Account'];

  const Item = ({ n, mobile = false }) => {
    const locked = n.feature && !hasFeature(n.feature);

    return (
      <NavLink
        to={n.to}
        end={n.end}
        className={({ isActive }) =>
          cx(
            'group relative flex transition-all duration-200',
            mobile
              ? 'min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold'
              : 'items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium',
            isActive
              ? mobile
                ? 'bg-[#E7F2EA] text-[#174D35]'
                : 'bg-white/12 text-white shadow-sm'
              : mobile
                ? 'text-[#718078] hover:bg-[#F1F5F1] hover:text-[#174D35]'
                : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            {!mobile && isActive && (
              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#D9F078]" />
            )}
            <n.icon
              className={cx(
                'h-[19px] w-[19px] shrink-0 transition-transform duration-200 group-hover:scale-105',
                mobile && 'h-5 w-5'
              )}
              aria-hidden
            />
            <span className={cx('truncate', mobile && 'max-w-full')}>
              {n.label}
            </span>
            {locked && (
              <Lock
                className={cx('h-3.5 w-3.5 opacity-60', mobile ? 'absolute right-1 top-1' : 'ml-auto')}
                aria-label="Not in your plan"
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const signOut = async () => {
    await logout();
    nav('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F3] text-[#17231C] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-[#103B2B] px-4 py-5 text-white md:flex">
        <Link to="/app" className="mb-7 flex items-center px-3 py-2">
          <Wordmark light />
        </Link>

        {businesses.length > 1 && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.07] p-2">
            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
              Your business
            </p>
            <BizSwitch />
          </div>
        )}

        {businesses.length === 1 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D9F078] text-[#173A29]">
              <Store className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Workspace
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {ctx?.business?.name || 'My business'}
              </p>
            </div>
          </div>
        )}

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4" aria-label="Dashboard">
          {groups.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (!groupItems.length) return null;

            return (
              <div key={group}>
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupItems.map((n) => (
                    <Item key={n.to} n={n} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.07] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9F078] text-xs font-bold text-[#173A29]">
              {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || 'Your account'}
              </p>
              <p className="truncate text-[10px] text-white/45">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#E5EAE3] bg-[#F9FAF7]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
              <Wordmark />
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#829087]">
                Business workspace
              </p>
              <p className="truncate text-sm font-semibold text-[#24352B]">
                {ctx?.business?.name || 'Your business'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#DCE8DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#52705D] sm:inline-flex">
              {ctx?.role || 'Workspace member'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4EDE3] text-xs font-bold text-[#174D35]">
              {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {ctx?.business?.status === 'suspended' && (
          <div className="bg-[#B3261E] px-4 py-2 text-center text-sm text-white">
            This business is suspended: {ctx.business.suspensionReason || 'contact support'}. Your data is safe.
          </div>
        )}

        {user && !user.emailVerified && <VerifyBanner />}

        <main className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:px-9 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[#E5EAE3] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_30px_rgba(25,55,37,0.06)] backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        {mobileMain.map((n) => (
          <Item key={n.to} n={n} mobile />
        ))}
        <button
          onClick={() => setMore(true)}
          className={cx(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition',
            more ? 'bg-[#E7F2EA] text-[#174D35]' : 'text-[#718078] hover:bg-[#F1F5F1]'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {more && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#102D22]/45 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMore(false)}
          >
            <motion.div
              initial={{ y: 36, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 36, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[28px] bg-[#F8FAF6] px-5 pb-8 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#D6DED5]" />
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#819087]">
                    Navigation
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#173A29]">
                    Your workspace
                  </h2>
                </div>
                <button
                  onClick={() => setMore(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#526258]"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {groups.map((group) => {
                const groupItems = items.filter(
                  (item) => item.group === group && !mobileMain.some((main) => main.to === item.to)
                );
                if (!groupItems.length) return null;

                return (
                  <section key={group} className="mb-5">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#89968D]">
                      {group}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {groupItems.map((n) => (
                        <Item key={n.to} n={n} />
                      ))}
                    </div>
                  </section>
                );
              })}

              {businesses.length > 1 && (
                <div className="mb-4 rounded-2xl bg-white p-3">
                  <BizSwitch />
                </div>
              )}

              <button
                onClick={signOut}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8E0] bg-white text-sm font-semibold text-[#526258]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
