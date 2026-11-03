
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ShoppingBag,
  CalendarDays,
  Package,
  BarChart3,
  Users,
  Globe2,
  CreditCard,
  Store,
  Layers3,
  Menu,
  Palette,
  Smartphone,
  Zap,
  Clock3,
  ShieldCheck,
  LayoutDashboard,
  Plus,
  Minus,
  MousePointer2,
  CircleHelp,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const reveal = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.15 },
  variants: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
  },
};

const features = [
  {
    icon: Store,
    number: '01',
    title: 'Your own online storefront',
    description:
      'Create a professional digital storefront, showcase your products or services, and give customers one simple place to discover your business.',
    tag: 'ONLINE PRESENCE',
  },
  {
    icon: Package,
    number: '02',
    title: 'Products and inventory',
    description:
      'Organise your products, monitor stock levels, manage variations and stay informed about what is moving in your business.',
    tag: 'INVENTORY',
  },
  {
    icon: ShoppingBag,
    number: '03',
    title: 'Sales and orders',
    description:
      'Manage customer orders and walk-in sales from one workspace. Keep your sales activity organised and easy to follow.',
    tag: 'COMMERCE',
  },
  {
    icon: CalendarDays,
    number: '04',
    title: 'Bookings and services',
    description:
      'Manage your services, availability and customer bookings. Stay in control of appointments and your daily schedule.',
    tag: 'SERVICE MANAGEMENT',
  },
  {
    icon: Users,
    number: '05',
    title: 'Customer management',
    description:
      'Keep customer information and business activity organised, so you can build stronger relationships and serve people better.',
    tag: 'RELATIONSHIPS',
  },
  {
    icon: BarChart3,
    number: '06',
    title: 'Business insights',
    description:
      'Get a clearer picture of your operations with organised reports and performance information in one place.',
    tag: 'REPORTING',
  },
];

const businessTypes = [
  {
    id: 'products',
    title: 'I sell products',
    subtitle: 'For shops, retailers and online sellers.',
    icon: ShoppingBag,
    examples: ['Clothing brands', 'Supermarkets', 'Electronics stores', 'Beauty stores'],
    description:
      'Manage your products, stock, orders and online storefront without jumping between disconnected tools.',
  },
  {
    id: 'services',
    title: 'I offer services',
    subtitle: 'For professionals and appointment-based businesses.',
    icon: CalendarDays,
    examples: ['Barbers and salons', 'Consultants', 'Photographers', 'Fitness studios'],
    description:
      'Showcase your services, manage appointments and keep your customer activity organised.',
  },
  {
    id: 'both',
    title: 'I do both',
    subtitle: 'For businesses that sell and provide services.',
    icon: Layers3,
    examples: ['Beauty and cosmetics', 'Fashion and tailoring', 'Spas and wellness', 'Retail with services'],
    description:
      'Bring your products and services together in one business workspace, instead of managing two separate systems.',
  },
];

const demoProducts = [
  { name: 'Everyday Essentials', price: '₦18,500', category: 'New arrival' },
  { name: 'Signature Collection', price: '₦32,000', category: 'Bestseller' },
  { name: 'Classic Accessories', price: '₦12,000', category: 'Popular' },
];

function SectionLabel({ children, light = false }) {
  return (
    <div className={`mb-5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] ${light ? 'text-lime-300' : 'text-forest'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-lime-300' : 'bg-forest'}`} />
      {children}
    </div>
  );
}

function DashboardPreview() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Products', 'Bookings'];

  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-8 rounded-full bg-lime-200/30 blur-3xl" />

      <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_35px_100px_-35px_rgba(12,55,39,.35)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-sm font-bold text-white">
              Z
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Zuno workspace</p>
              <p className="text-[10px] text-gray-400">Mabinu Business</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-medium text-gray-500">Workspace active</span>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-5 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-3 pb-3 text-xs font-medium transition ${
                activeTab === tab
                  ? 'border-forest text-forest'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[300px] p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-xs text-gray-400">Tuesday, your business at a glance</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">Good morning.</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Sales', '₦284k', '+12.8%'],
                    ['Orders', '48', '+8.2%'],
                    ['Bookings', '16', '+5.4%'],
                  ].map(([label, value, change]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-[#FAFBF9] p-3">
                      <p className="text-[10px] text-gray-400">{label}</p>
                      <p className="mt-2 text-lg font-bold tracking-tight text-gray-900">{value}</p>
                      <p className="mt-1 text-[9px] font-medium text-green-600">{change}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-800">Business activity</p>
                    <span className="text-[10px] text-gray-400">This week</span>
                  </div>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[38, 57, 45, 76, 54, 88, 68, 96, 62, 79, 55, 90].map((height, i) => (
                      <div key={i} className="flex flex-1 items-end">
                        <div
                          className={`w-full rounded-t-sm ${i === 7 ? 'bg-forest' : 'bg-forest/15'}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] text-gray-400">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Your products</h3>
                    <p className="text-xs text-gray-400">Manage your catalogue</p>
                  </div>
                  <span className="rounded-lg bg-forest px-3 py-2 text-[10px] font-semibold text-white">+ Add product</span>
                </div>
                {demoProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${['bg-lime-100', 'bg-orange-100', 'bg-gray-100'][i]}`}>
                        <Package className="h-5 w-5 text-forest" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{product.name}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{product.category}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-800">{product.price}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'Bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Today's bookings</h3>
                  <p className="text-xs text-gray-400">Keep your appointments organised</p>
                </div>
                {[
                  ['09:00 AM', 'Hair styling', 'Confirmed'],
                  ['11:30 AM', 'Consultation', 'Pending'],
                  ['02:00 PM', 'Premium service', 'Confirmed'],
                ].map(([time, service, status]) => (
                  <div key={time} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="rounded-lg bg-forest/5 p-2.5">
                      <Clock3 className="h-4 w-4 text-forest" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">{service}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{time}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-[#FAFBF9] px-5 py-3">
          <span className="text-[10px] text-gray-400">A connected view of your business</span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-forest">Powered by Zuno <ArrowUpRight className="h-3 w-3" /></span>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-3 top-16 hidden rounded-xl border border-gray-100 bg-white p-3 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-green-50 p-2"><TrendingIcon /></div>
          <div>
            <p className="text-[9px] text-gray-400">Business growth</p>
            <p className="text-sm font-bold text-gray-900">+18.6%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TrendingIcon() {
  return <Zap className="h-4 w-4 text-green-700" />;
}

function StorefrontDemo() {
  const [headline, setHeadline] = useState('Style that speaks for you.');
  const [businessName, setBusinessName] = useState('THE EVERYDAY EDIT');
  const [colour, setColour] = useState('#174C36');
  const [published, setPublished] = useState(false);

  const colours = ['#174C36', '#263B56', '#67433D', '#3F3F46'];

  return (
    <div className="grid overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-[0_25px_70px_-35px_rgba(0,0,0,.25)] lg:grid-cols-[0.78fr_1.22fr]">
      <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-forest/10 p-2"><Palette className="h-4 w-4 text-forest" /></div>
          <span className="text-xs font-bold text-gray-900">Storefront editor</span>
          <span className="ml-auto rounded-full bg-green-50 px-2 py-1 text-[9px] font-semibold text-green-700">INTERACTIVE DEMO</span>
        </div>

        <p className="mt-7 text-sm font-semibold text-gray-900">Make it yours.</p>
        <p className="mt-1 text-xs leading-5 text-gray-400">Try changing your store name, headline and brand colour. See your changes instantly.</p>

        <label className="mt-6 block text-[11px] font-semibold text-gray-600">BUSINESS NAME</label>
        <input
          value={businessName}
          onChange={(e) => { setBusinessName(e.target.value); setPublished(false); }}
          maxLength={28}
          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
        />

        <label className="mt-5 block text-[11px] font-semibold text-gray-600">HERO HEADLINE</label>
        <textarea
          value={headline}
          onChange={(e) => { setHeadline(e.target.value); setPublished(false); }}
          maxLength={70}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
        />

        <label className="mt-5 block text-[11px] font-semibold text-gray-600">BRAND COLOUR</label>
        <div className="mt-3 flex items-center gap-3">
          {colours.map((c) => (
            <button
              key={c}
              onClick={() => { setColour(c); setPublished(false); }}
              aria-label={`Choose ${c}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${colour === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            >
              {colour === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPublished(true)}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest/90"
        >
          {published ? <><Check className="h-4 w-4" /> Demo updated</> : <>Preview your changes <ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="mt-3 text-center text-[10px] text-gray-400">This is a sample editor. Changes are not published to a real store.</p>
      </div>

      <div className="bg-[#F2F3EF] p-4 sm:p-7">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-gray-400">LIVE STORE PREVIEW</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><Smartphone className="h-3 w-3" /> Responsive preview</span>
        </div>

        <motion.div layout className="mx-auto max-w-[520px] overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="text-xs font-bold tracking-widest text-gray-900">{businessName || 'YOUR BUSINESS'}</span>
            <div className="flex gap-3 text-[9px] text-gray-500"><span>SHOP</span><span>ABOUT</span><span>CONTACT</span></div>
          </div>

          <div className="relative flex min-h-[245px] flex-col justify-center overflow-hidden px-7 py-10 text-white sm:px-10" style={{ backgroundColor: colour }}>
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-8 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative max-w-[310px]">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-white/60">A LITTLE SOMETHING DIFFERENT</p>
              <h3 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{headline || 'Your headline goes here.'}</h3>
              <p className="mt-3 max-w-[230px] text-[10px] leading-5 text-white/65">Discover a collection made with you in mind.</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-semibold" style={{ color: colour }}>Explore collection <ArrowUpRight className="h-3 w-3" /></span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-widest text-gray-400">CURATED FOR YOU</p>
                <h4 className="mt-1 text-lg font-bold text-gray-900">Featured collection</h4>
              </div>
              <span className="text-[10px] text-gray-400">View all →</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {['Everyday', 'Signature', 'Essentials'].map((item, i) => (
                <div key={item}>
                  <div className={`flex aspect-[4/5] items-center justify-center rounded-lg ${['bg-[#E9E9E2]', 'bg-[#E9E2D9]', 'bg-[#E5E8E2]'][i]}`}>
                    <ShoppingBag className="h-7 w-7 text-gray-400/70" />
                  </div>
                  <p className="mt-2 text-[9px] font-semibold text-gray-700">{item}</p>
                  <p className="mt-1 text-[9px] text-gray-400">From ₦12,000</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900 sm:text-base">{question}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pt-4 text-sm leading-7 text-gray-500">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [selectedBusiness, setSelectedBusiness] = useState('products');

  const selected = businessTypes.find((item) => item.id === selectedBusiness);

  return (
    <main className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute -right-40 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-lime-100/40 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:pb-32 lg:pt-24">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }}>
            <SectionLabel>ONE WORKSPACE. YOUR ENTIRE BUSINESS.</SectionLabel>
            <h1 className="max-w-[650px] text-[43px] font-semibold leading-[1.08] tracking-[-0.055em] text-[#14251C] sm:text-6xl lg:text-[68px]">
              Your business.
              <span className="block text-forest">One platform.</span>
              More room to grow.
            </h1>
            <p className="mt-7 max-w-[510px] text-base leading-8 text-gray-500 sm:text-lg">
              Zuno brings your products, services, sales, bookings and everyday operations together in one connected workspace. Spend less time managing tools and more time growing your business.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/register" className="inline-flex min-h-[52px] items-center gap-3 rounded-xl bg-forest px-6 text-sm font-semibold text-white shadow-lg shadow-forest/15 transition hover:-translate-y-0.5 hover:bg-forest/90">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:border-forest hover:text-forest">
                Explore Zuno <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-400">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" /> Products and services</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" /> One business workspace</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" /> Built to grow with you</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative lg:pl-3"
          >
            <DashboardPreview />
          </motion.div>
        </div>
        <div className="border-y border-gray-100 bg-[#FAFBF9]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">ONE PLATFORM FOR DIFFERENT WAYS OF DOING BUSINESS</p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-gray-500">
              <span>RETAIL</span><span>PROFESSIONAL SERVICES</span><span>BEAUTY & WELLNESS</span><span>ONLINE COMMERCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <SectionLabel>BUILT AROUND YOUR BUSINESS</SectionLabel>
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#14251C] sm:text-5xl">
            However you do business, <span className="text-forest">there's a place for it here.</span>
          </h2>
          <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
            You shouldn't need different platforms just because your business sells products, offers services, or does both.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {businessTypes.map((type, index) => {
            const Icon = type.icon;
            const active = selectedBusiness === type.id;

            return (
              <motion.button
                key={type.id}
                {...reveal}
                onClick={() => setSelectedBusiness(type.id)}
                className={`rounded-2xl border p-6 text-left transition duration-300 sm:p-7 ${
                  active
                    ? 'border-forest bg-[#F5F8F4] shadow-[0_15px_40px_-30px_rgba(20,76,52,.5)]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-forest text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-forest bg-forest text-white' : 'border-gray-300 text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-gray-900">{type.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{type.subtitle}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {type.examples.map((example) => (
                    <span key={example} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200">{example}</span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedBusiness}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 flex flex-col justify-between gap-5 rounded-2xl bg-forest p-6 text-white sm:flex-row sm:items-center sm:p-8"
          >
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-lime-300">YOUR BUSINESS, CONNECTED</p>
              <p className="mt-2 text-sm leading-7 text-white/80">{selected.description}</p>
            </div>
            <Link to="/register" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-lime-300 hover:text-white">
              Build with Zuno <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* FEATURES */}
      <section id="product" className="scroll-mt-24 bg-[#F8F9F6] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...reveal} className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionLabel>THE ZUNO WORKSPACE</SectionLabel>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#14251C] sm:text-5xl">
                Everything your business needs to move forward.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-gray-500">
              Bring your daily operations into one place. Stay organised, understand what's happening and make better decisions.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.number}
                  {...reveal}
                  transition={{ duration: 0.55, delay: index * 0.04 }}
                  className="group bg-white p-7 transition hover:bg-[#FBFCFA] sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3ED] text-forest transition group-hover:bg-forest group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-gray-300">{feature.number}</span>
                  </div>
                  <p className="mt-8 font-mono text-[9px] font-semibold tracking-[0.16em] text-forest/70">{feature.tag}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-500">{feature.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-forest opacity-0 transition group-hover:opacity-100">
                    Explore capability <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <SectionLabel>GET STARTED</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#14251C] sm:text-5xl">
            From setup to running your business.
          </h2>
          <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
            Get your business organised with a simple starting point. Add what you need and build from there.
          </p>
        </motion.div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-gray-300 md:block" />
          {[
            {
              n: '01',
              icon: Users,
              title: 'Create your workspace',
              text: 'Register your business and tell Zuno what you sell or the services you provide.',
            },
            {
              n: '02',
              icon: Layers3,
              title: 'Set up your business',
              text: 'Add your products or services, organise your operations and customise your storefront.',
            },
            {
              n: '03',
              icon: Zap,
              title: 'Start operating',
              text: 'Share your online presence, manage activity and run your business from one workspace.',
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.n} {...reveal} className="relative text-center">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-forest shadow-sm">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest font-mono text-[9px] font-bold text-white">{step.n}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-gray-500">{step.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* STOREFRONT EDITOR DEMO */}
      <section className="bg-[#F8F9F6] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...reveal} className="mb-12 max-w-2xl">
            <SectionLabel>YOUR BUSINESS, YOUR IDENTITY</SectionLabel>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#14251C] sm:text-5xl">
              Your storefront should feel like your brand.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
              Your online presence is part of your business identity. Explore how a storefront can look and experiment with a few simple customisations.
            </p>
          </motion.div>
          <motion.div {...reveal}>
            <StorefrontDemo />
          </motion.div>
        </div>
      </section>

      {/* CONNECTED BUSINESS */}
      <section className="relative overflow-hidden bg-[#153D2D] py-24 text-white lg:py-32">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[500px] w-[500px] rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -right-10 -top-20 h-[350px] w-[350px] rounded-full border border-white/[0.07]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <motion.div {...reveal}>
            <SectionLabel light>ONE CONNECTED BUSINESS</SectionLabel>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Stop managing your business in pieces.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-8 text-white/65 sm:text-base">
              Your storefront, products, customers, sales and services are all parts of the same business. Zuno gives them a shared workspace, so you can manage the bigger picture without losing sight of the details.
            </p>
            <Link to="/register" className="mt-8 inline-flex min-h-[50px] items-center gap-3 rounded-xl bg-lime-300 px-6 text-sm font-semibold text-[#173B2B] transition hover:-translate-y-0.5 hover:bg-lime-200">
              Start building with Zuno <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div {...reveal} className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Store, title: 'Storefront', desc: 'Your digital presence' },
                { icon: Package, title: 'Products', desc: 'Your catalogue and stock' },
                { icon: ShoppingBag, title: 'Sales', desc: 'Your orders and payments' },
                { icon: CalendarDays, title: 'Bookings', desc: 'Your services and schedule' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`rounded-2xl border border-white/10 p-5 sm:p-7 ${i === 0 ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
                    <Icon className="h-6 w-6 text-lime-300" />
                    <h3 className="mt-8 text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs text-white/45">{item.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 py-4 text-xs font-semibold text-lime-200">
              <Layers3 className="h-4 w-4" /> One connected workspace
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div {...reveal}>
            <SectionLabel>GOOD QUESTIONS</SectionLabel>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#14251C] sm:text-5xl">
              A few things you might want to know.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500">
              Still have questions? Our support team can help you understand how Zuno works.
            </p>
            <Link to="/support" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest">
              Visit support <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div {...reveal}>
            <FAQItem
              question="What exactly is Zuno?"
              answer="Zuno is a business management platform that brings together your online storefront, products, inventory, sales, customer records and service bookings in one workspace."
            />
            <FAQItem
              question="Is Zuno only for businesses that sell products?"
              answer="No. Zuno is designed for product businesses, service businesses and businesses that offer both. The features available to your business depend on your subscription plan."
            />
            <FAQItem
              question="Can I create an online store with Zuno?"
              answer="Yes. Zuno includes a digital storefront where you can present your business and showcase your products or services to customers."
            />
            <FAQItem
              question="Can I manage appointments and bookings?"
              answer="Zuno includes service and booking capabilities for businesses that work with appointments. You can organise your services and manage booking requests from your workspace."
            />
            <FAQItem
              question="Do I need technical skills to use Zuno?"
              answer="Zuno is designed to make everyday business operations easier to manage. You can create your workspace, configure your business and manage your operations without building software yourself."
            />
            <FAQItem
              question="How much does Zuno cost?"
              answer="Zuno offers subscription plans with different features and limits. Visit the pricing page to review the current plans and choose the one that fits your business."
            />
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#EAF0E7] px-7 py-16 text-center sm:px-12 lg:py-24"
        >
          <div className="pointer-events-none absolute -right-20 -top-40 h-80 w-80 rounded-full border border-forest/10" />
          <div className="pointer-events-none absolute -bottom-48 -left-20 h-96 w-96 rounded-full border border-forest/10" />
          <div className="relative mx-auto max-w-2xl">
            <SectionLabel>YOUR NEXT CHAPTER STARTS HERE</SectionLabel>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#14251C] sm:text-5xl">
              Build a business that's ready for what's next.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-gray-500 sm:text-base">
              Bring your business operations together. Start with what you need today and grow with a platform built to move with you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="inline-flex min-h-[52px] items-center gap-3 rounded-xl bg-forest px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-forest/90">
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="inline-flex min-h-[52px] items-center rounded-xl border border-forest/20 bg-white/60 px-7 text-sm font-semibold text-forest transition hover:bg-white">
                Explore pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
