
import React, { Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import {
  AdminLayout,
  AppLayout,
  MarketingLayout,
  RequireAuth,
} from './components/Layouts.jsx';
import { merchantSlugFromHost } from './lib/merchantDomain.js';
import NotFound from './components/errors/NotFound.jsx';

const Home = lazy(() => import('./pages/marketing/Home.jsx'));
const Pricing = lazy(() => import('./pages/marketing/Pricing.jsx'));
const MobileApp = lazy(() => import('./pages/marketing/MobileApp.jsx'));
const Support = lazy(() => import('./pages/marketing/Support.jsx'));
const Privacy = lazy(() =>
  import('./pages/marketing/Legal.jsx').then((m) => ({ default: m.Privacy }))
);
const Terms = lazy(() =>
  import('./pages/marketing/Legal.jsx').then((m) => ({ default: m.Terms }))
);

const Login = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.Login }))
);
const Register = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.Register }))
);
const Forgot = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.Forgot }))
);
const Reset = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.Reset }))
);
const VerifyEmail = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.VerifyEmail }))
);
const ConfirmContact = lazy(() =>
  import('./pages/Auth.jsx').then((m) => ({ default: m.ConfirmContact }))
);

const Recover = lazy(() =>
  import('./pages/Recover.jsx').then((m) => ({ default: m.Recover }))
);
const RecoverStatus = lazy(() =>
  import('./pages/Recover.jsx').then((m) => ({ default: m.RecoverStatus }))
);

const StoreLayout = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreLayout }))
);
const StoreServices = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreServices }))
);
const StoreService = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreService }))
);
const StoreProduct = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreProduct }))
);
const StoreCheckout = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreCheckout }))
);
const StoreOrder = lazy(() =>
  import('./pages/Store.jsx').then((m) => ({ default: m.StoreOrder }))
);

const StorefrontHome = lazy(() =>
  import('./pages/StorefrontHome.jsx').then((m) => ({ default: m.StorefrontHome }))
);
const StorefrontPage = lazy(() =>
  import('./pages/StorefrontPage.jsx').then((m) => ({ default: m.StorefrontPage }))
);
const StorePortfolio = lazy(() =>
  import('./pages/StorePortfolio.jsx').then((m) => ({ default: m.StorePortfolio }))
);
const StorePortfolioProject = lazy(() =>
  import('./pages/StorePortfolio.jsx').then((m) => ({ default: m.StorePortfolioProject }))
);

const AdminOverview = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.AdminOverview }))
);
const Merchants = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Merchants }))
);
const MerchantDetail = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.MerchantDetail }))
);
const Businesses = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Businesses }))
);
const BusinessDetail = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.BusinessDetail }))
);
const Subscriptions = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Subscriptions }))
);
const Payments = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Payments }))
);
const Audit = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Audit }))
);
const PlatformSettings = lazy(() =>
  import('./pages/admin/Admin.jsx').then((m) => ({ default: m.PlatformSettings }))
);

const RecoveryQueue = lazy(() =>
  import('./pages/admin/Queues.jsx').then((m) => ({ default: m.RecoveryQueue }))
);
const RecoveryDetail = lazy(() =>
  import('./pages/admin/Queues.jsx').then((m) => ({ default: m.RecoveryDetail }))
);
const AdminApps = lazy(() =>
  import('./pages/admin/Queues.jsx').then((m) => ({ default: m.AdminApps }))
);
const AdminSupport = lazy(() =>
  import('./pages/admin/Queues.jsx').then((m) => ({ default: m.AdminSupport }))
);

const SupportPage = lazy(() =>
  import('./pages/app/Account.jsx').then((m) => ({ default: m.SupportPage }))
);
const MobileAppPage = lazy(() =>
  import('./pages/app/Account.jsx').then((m) => ({ default: m.MobileAppPage }))
);
const Team = lazy(() =>
  import('./pages/app/Account.jsx').then((m) => ({ default: m.Team }))
);
const SettingsPage = lazy(() =>
  import('./pages/app/Account.jsx').then((m) => ({ default: m.SettingsPage }))
);

const PaymentSettings = lazy(() => import('./pages/app/PaymentSettings.jsx'));
const Overview = lazy(() => import('./pages/app/Overview.jsx'));
const NewBusiness = lazy(() =>
  import('./pages/app/Overview.jsx').then((m) => ({ default: m.NewBusiness }))
);
const GuidedStorefrontSetup = lazy(() =>
  import('./pages/app/GuidedStorefrontSetup.jsx')
);
const Products = lazy(() => import('./pages/app/Products.jsx'));
const Menu = lazy(() => import('./pages/app/Menu.jsx'));
const Services = lazy(() => import('./pages/app/Services.jsx'));
const Bookings = lazy(() => import('./pages/app/Bookings.jsx'));
const Orders = lazy(() => import('./pages/app/Orders.jsx'));
const POS = lazy(() => import('./pages/app/POS.jsx'));
const Inventory = lazy(() => import('./pages/app/Inventory.jsx'));
const Customers = lazy(() => import('./pages/app/Customers.jsx'));
const Reports = lazy(() => import('./pages/app/Reports.jsx'));
const Billing = lazy(() => import('./pages/app/Billing.jsx'));
const Sales = lazy(() =>
  import('./pages/app/POS.jsx').then((m) => ({ default: m.Sales }))
);

const PageLoading = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-[#F6F7F5] px-6">
    <div className="flex items-center gap-3">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#1C6F52]" />
      <span className="text-sm font-medium text-[#68756D]">
        Preparing your experience...
      </span>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Zuno application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0B2118] px-5 py-16 text-white">
          <div className="w-full max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
              <span className="text-2xl text-[#E9A23B]">!</span>
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-[#E9A23B]">
              A little interruption
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Something didn’t go as planned.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60 sm:text-base">
              We ran into an unexpected problem while loading this page.
              Your next step is simple: try again or return to Zuno.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#E9A23B] px-7 text-sm font-semibold text-[#12201A] transition hover:bg-[#f2b653]"
              >
                Try again
              </button>

              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Zuno
              </Link>
            </div>

            <p className="mt-12 text-xs text-white/35">
              Zuno · Business, moving forward.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function StoreRoutes({ merchantSlug }) {
  return (
    <ErrorBoundary>
      <Routes>
       
          <Route path="/store/:slug" element={<StoreLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="services" element={<StoreServices />} />
            <Route path="services/:id" element={<StoreService />} />
            <Route path="portfolio" element={<StorePortfolio />} />
            <Route path="portfolio/:projectSlug" element={<StorePortfolioProject />} />
            <Route path="p/:id" element={<StoreProduct />} />
            <Route path="checkout" element={<StoreCheckout />} />
            <Route path="order" element={<StoreOrder />} />
            <Route path=":pageSlug" element={<StorefrontPage />} />
          </Route>

          <Route path="/s/:slug" element={<StoreLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="services" element={<StoreServices />} />
            <Route path="services/:id" element={<StoreService />} />
            <Route path="portfolio" element={<StorePortfolio />} />
            <Route path="portfolio/:projectSlug" element={<StorePortfolioProject />} />
            <Route path="p/:id" element={<StoreProduct />} />
            <Route path="checkout" element={<StoreCheckout />} />
            <Route path="order" element={<StoreOrder />} />
            <Route path=":pageSlug" element={<StorefrontPage />} />
          </Route>


        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  const merchantSlug = merchantSlugFromHost();

  if (merchantSlug) {
    return (
      <Suspense fallback={<PageLoading />}>
        <StoreRoutes merchantSlug={merchantSlug} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/mobile-app" element={<MobileApp />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route path="/reset-password" element={<Reset />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/confirm-contact" element={<ConfirmContact />} />

          <Route path="/recover" element={<Recover />} />
          <Route path="/recover/status" element={<RecoverStatus />} />

          <Route path="/store/:slug" element={<StoreLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="services" element={<StoreServices />} />
            <Route path="services/:id" element={<StoreService />} />
            <Route path="portfolio" element={<StorePortfolio />} />
            <Route path="portfolio/:projectSlug" element={<StorePortfolioProject />} />
            <Route path="p/:id" element={<StoreProduct />} />
            <Route path="checkout" element={<StoreCheckout />} />
            <Route path="order" element={<StoreOrder />} />
            <Route path=":pageSlug" element={<StorefrontPage />} />
          </Route>

          <Route
            path="/app/new"
            element={
              <RequireAuth allowUnverified>
                <div className="px-4 py-10">
                  <NewBusiness />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="storefront" element={<GuidedStorefrontSetup />} />
            <Route path="products" element={<Products />} />
            <Route path="menu" element={<Menu />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} /> 
            <Route path="orders" element={<Orders />} />
            <Route path="pos" element={<POS />} />
            <Route path="pos/sales" element={<Sales />} />
            <Route
              path="pos/sales/:id"
              element={<Navigate to="/app/pos/sales" replace />}
            />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="billing" element={<Billing />} />
            <Route path="mobile-app" element={<MobileAppPage />} />
            <Route path="team" element={<Team />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/payments" element={<PaymentSettings />} />
          </Route>

          <Route path="/admin/login" element={<Login admin />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="merchants" element={<Merchants />} />
            <Route path="merchants/:id" element={<MerchantDetail />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="businesses/:id" element={<BusinessDetail />} />
            <Route path="recovery" element={<RecoveryQueue />} />
            <Route path="recovery/:id" element={<RecoveryDetail />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="payments" element={<Payments />} />
            <Route path="mobile-apps" element={<AdminApps />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="audit" element={<Audit />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
