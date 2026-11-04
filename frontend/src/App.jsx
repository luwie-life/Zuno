import React, { Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, AppLayout, MarketingLayout, RequireAuth } from './components/Layouts.jsx';
import { Empty } from './components/ui.jsx';
import { Compass } from 'lucide-react';
import { merchantSlugFromHost } from './lib/merchantDomain.js';

const Home = lazy(() => import('./pages/marketing/Home.jsx'));
const Pricing = lazy(() => import('./pages/marketing/Pricing.jsx'));
const MobileApp = lazy(() => import('./pages/marketing/MobileApp.jsx'));
const Support = lazy(() => import('./pages/marketing/Support.jsx'));
const Privacy = lazy(() => import('./pages/marketing/Legal.jsx').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/marketing/Legal.jsx').then((m) => ({ default: m.Terms })));
const Login = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Register })));
const Forgot = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Forgot })));
const Reset = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Reset })));
const VerifyEmail = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.VerifyEmail })));
const ConfirmContact = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.ConfirmContact })));
const Recover = lazy(() => import('./pages/Recover.jsx').then((m) => ({ default: m.Recover })));
const RecoverStatus = lazy(() => import('./pages/Recover.jsx').then((m) => ({ default: m.RecoverStatus })));

const StoreLayout = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreLayout })));
const StoreServices = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreServices })));
const StoreService = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreService })));
const StoreProduct = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreProduct })));
const StoreCheckout = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreCheckout })));
const StoreOrder = lazy(() => import('./pages/Store.jsx').then((m) => ({ default: m.StoreOrder })));

const StorefrontHome = lazy(() => import('./pages/StorefrontHome.jsx').then((m) => ({ default: m.StorefrontHome })));
const StorefrontPage = lazy(() => import('./pages/StorefrontPage.jsx').then((m) => ({ default: m.StorefrontPage })));
const StorePortfolio = lazy(() => import('./pages/StorePortfolio.jsx').then((m) => ({ default: m.StorePortfolio })));
const StorePortfolioProject = lazy(() => import('./pages/StorePortfolio.jsx').then((m) => ({ default: m.StorePortfolioProject })));

const AdminOverview = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.AdminOverview })));
const Merchants = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Merchants })));
const MerchantDetail = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.MerchantDetail })));
const Businesses = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Businesses })));
const BusinessDetail = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.BusinessDetail })));
const Subscriptions = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Subscriptions })));
const Payments = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Payments })));
const Audit = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.Audit })));
const PlatformSettings = lazy(() => import('./pages/admin/Admin.jsx').then((m) => ({ default: m.PlatformSettings })));
const RecoveryQueue = lazy(() => import('./pages/admin/Queues.jsx').then((m) => ({ default: m.RecoveryQueue })));
const RecoveryDetail = lazy(() => import('./pages/admin/Queues.jsx').then((m) => ({ default: m.RecoveryDetail })));
const AdminApps = lazy(() => import('./pages/admin/Queues.jsx').then((m) => ({ default: m.AdminApps })));
const AdminSupport = lazy(() => import('./pages/admin/Queues.jsx').then((m) => ({ default: m.AdminSupport })));

const SupportPage = lazy(() => import('./pages/app/Account.jsx').then((m) => ({ default: m.SupportPage })));
const MobileAppPage = lazy(() => import('./pages/app/Account.jsx').then((m) => ({ default: m.MobileAppPage })));
const Team = lazy(() => import('./pages/app/Account.jsx').then((m) => ({ default: m.Team })));
const SettingsPage = lazy(() => import('./pages/app/Account.jsx').then((m) => ({ default: m.SettingsPage })));
const PaymentSettings = lazy(() => import('./pages/app/PaymentSettings.jsx'));
const Overview = lazy(() => import('./pages/app/Overview.jsx'));
const NewBusiness = lazy(() => import('./pages/app/Overview.jsx').then((m) => ({ default: m.NewBusiness })));
const StorefrontEditor = lazy(() => import('./pages/app/StorefrontEditor.jsx'));
const Products = lazy(() => import('./pages/app/Products.jsx'));
const Orders = lazy(() => import('./pages/app/Orders.jsx'));
const POS = lazy(() => import('./pages/app/POS.jsx'));
const Inventory = lazy(() => import('./pages/app/Inventory.jsx'));
const Customers = lazy(() => import('./pages/app/Customers.jsx'));
const Reports = lazy(() => import('./pages/app/Reports.jsx'));
const Billing = lazy(() => import('./pages/app/Billing.jsx'));
const Sales = lazy(() => import('./pages/app/POS.jsx').then((m) => ({ default: m.Sales })));

const NotFound = () => (
  <main className="mx-auto max-w-3xl px-4 py-16">
    <Empty
      icon={Compass}
      title="We can’t find that page"
      hint="The link may be outdated, or the address may have been typed incorrectly. Head back to Zuno and choose where to go next."
      action={<Link className="btn-primary" to="/">Back to home</Link>}
    />
  </main>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error.message || 'Something went wrong.',
    };
  }

  componentDidCatch(error) {
    console.error('App error boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-danger">App error</p>
            <h1 className="mt-3 text-3xl font-bold">Something broke while loading this page.</h1>
            <p className="mt-3 text-sm text-muted">
              The app hit an unexpected runtime error. Refresh the page or return to the home screen.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/">Back to home</Link>
              <button className="btn-secondary" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
            {this.state.message && (
              <p className="mt-4 rounded-xl bg-danger-100 p-3 text-sm text-danger">
                {this.state.message}
              </p>
            )}
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
        <Route
          path={merchantSlug ? '/' : '/store/:slug'}
          element={<StoreLayout merchantSlug={merchantSlug} />}
        >
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
      <Suspense fallback={<div className="p-16 text-center text-sm text-muted">Loading…</div>}>
        <StoreRoutes merchantSlug={merchantSlug} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-16 text-center text-sm text-muted">Loading…</div>}>
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
              <RequireAuth>
                <div className="px-4 py-10">
                  <NewBusiness />
                </div>
              </RequireAuth>
            }
          />

          <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="storefront" element={<StorefrontEditor />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="pos" element={<POS />} />
            <Route path="pos/sales" element={<Sales />} />
            <Route path="pos/sales/:id" element={<Navigate to="/app/pos/sales" replace />} />
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
