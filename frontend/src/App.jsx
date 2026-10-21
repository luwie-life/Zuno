import { Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, AppLayout, MarketingLayout, RequireAuth } from './components/Layouts.jsx';
import Home from './pages/marketing/Home.jsx';
import Pricing from './pages/marketing/Pricing.jsx';
import MobileApp from './pages/marketing/MobileApp.jsx';
import Support from './pages/marketing/Support.jsx';
import { Privacy, Terms } from './pages/marketing/Legal.jsx';
import { Login, Register, Forgot, Reset, VerifyEmail, ConfirmContact } from './pages/Auth.jsx';
import { Recover, RecoverStatus } from './pages/Recover.jsx';
import { StoreLayout, StoreHome, StoreProduct, StoreCheckout, StoreOrder } from './pages/Store.jsx';
import { Empty } from './components/ui.jsx';
import { Compass } from 'lucide-react';

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
const Products = lazy(() => import('./pages/app/Products.jsx'));
const Orders = lazy(() => import('./pages/app/Orders.jsx'));
const POS = lazy(() => import('./pages/app/POS.jsx'));
const Inventory = lazy(() => import('./pages/app/Inventory.jsx'));
const Customers = lazy(() => import('./pages/app/Customers.jsx'));
const Reports = lazy(() => import('./pages/app/Reports.jsx'));
const Billing = lazy(() => import('./pages/app/Billing.jsx'));
const Sales = lazy(() => import('./pages/app/POS.jsx').then((m) => ({ default: m.Sales })));

const NotFound = () => <main className="mx-auto max-w-3xl px-4 py-16"><Empty icon={Compass} title="We can’t find that page" hint="The link may be outdated, or the address may have been typed incorrectly. Head back to Zuno and choose where to go next." action={<Link className="btn-primary" to="/">Back to home</Link>} /></main>;

export default function App() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-muted">Loading…</div>}>
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} /><Route path="/pricing" element={<Pricing />} /><Route path="/mobile-app" element={<MobileApp />} /><Route path="/support" element={<Support />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} />
      </Route>
      <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<Forgot />} /><Route path="/reset-password" element={<Reset />} /><Route path="/verify-email" element={<VerifyEmail />} /><Route path="/confirm-contact" element={<ConfirmContact />} />
      <Route path="/recover" element={<Recover />} /><Route path="/recover/status" element={<RecoverStatus />} />
      <Route path="/store/:slug" element={<StoreLayout />}><Route index element={<StoreHome />} /><Route path="p/:id" element={<StoreProduct />} /><Route path="checkout" element={<StoreCheckout />} /><Route path="order" element={<StoreOrder />} /></Route>
      <Route path="/app/new" element={<RequireAuth><div className="px-4 py-10"><NewBusiness /></div></RequireAuth>} />
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Overview />} /><Route path="products" element={<Products />} /><Route path="orders" element={<Orders />} /><Route path="pos" element={<POS />} /><Route path="pos/sales" element={<Sales />} /><Route path="pos/sales/:id" element={<Navigate to="/app/pos/sales" replace />} />
        <Route path="inventory" element={<Inventory />} /><Route path="customers" element={<Customers />} /><Route path="reports" element={<Reports />} /><Route path="billing" element={<Billing />} /><Route path="mobile-app" element={<MobileAppPage />} /><Route path="team" element={<Team />} /><Route path="support" element={<SupportPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="settings/payments" element={<PaymentSettings />} />
      </Route>
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} /><Route path="merchants" element={<Merchants />} /><Route path="merchants/:id" element={<MerchantDetail />} /><Route path="businesses" element={<Businesses />} /><Route path="businesses/:id" element={<BusinessDetail />} />
        <Route path="recovery" element={<RecoveryQueue />} /><Route path="recovery/:id" element={<RecoveryDetail />} /><Route path="subscriptions" element={<Subscriptions />} /><Route path="payments" element={<Payments />} /><Route path="mobile-apps" element={<AdminApps />} /><Route path="support" element={<AdminSupport />} /><Route path="audit" element={<Audit />} /><Route path="settings" element={<PlatformSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
