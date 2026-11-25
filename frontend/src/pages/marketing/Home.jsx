import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Globe2,
  Layers3,
  Package,
  ShoppingBag,
  Store,
  Users,
  ChartNoAxesCombined,
  Menu,
  X,
  Sparkles,
  Clock3,
} from 'lucide-react';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: 'easeOut' },
  },
};

const businessTypes = [
  {
    title: 'Product businesses',
    description: 'Give your products a place to be discovered, explored and ordered.',
    examples: 'Retail · Fashion · Beauty · Electronics',
    icon: ShoppingBag,
  },
  {
    title: 'Service businesses',
    description: 'Present your services, organise appointments and manage booking requests.',
    examples: 'Salons · Freelancers · Studios · Consultants',
    icon: CalendarDays,
  },
  {
    title: 'Growing businesses',
    description: 'Bring the different parts of your business into one organised workspace.',
    examples: 'Shops · Hybrid businesses · Independent brands',
    icon: Layers3,
  },
];

const capabilities = [
  {
    number: '01',
    icon: Globe2,
    title: 'Your online presence',
    description: 'Create a place customers can visit to discover your business and what you offer.',
  },
  {
    number: '02',
    icon: Package,
    title: 'Products and services',
    description: 'Present your catalogue, organise your products and make your services easy to explore.',
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Orders and bookings',
    description: 'Keep customer orders and service booking requests organised as they come in.',
  },
  {
    number: '04',
    icon: ChartNoAxesCombined,
    title: 'Business operations',
    description: 'Manage sales, customers, stock and everyday activity from one workspace.',
  },
];

const faqs = [
  {
    question: 'What is Zuno?',
    answer: 'Zuno is a business platform that helps businesses establish an online presence and manage important day-to-day activities, including products, orders, customers, inventory and service bookings.',
  },
  {
    question: 'Is Zuno only for businesses that sell products?',
    answer: 'No. Zuno supports product businesses, service businesses and businesses that offer both. The tools available depend on the features included in your plan.',
  },
  {
    question: 'Can I create an online storefront?',
    answer: 'Yes. You can create a storefront for your business and use it to present your brand, products or services to customers.',
  },
  {
    question: 'Can I manage appointments?',
    answer: 'Zuno includes service and booking capabilities for appointment-based businesses. Booking requests can be managed from your business workspace.',
  },
  {
    question: 'Do I need technical skills?',
    answer: 'No coding is required to set up and manage your Zuno workspace. The platform is designed to make everyday business tasks easier to organise.',
  },
];

function Eyebrow({ children, light = false }) {
  return (
    <div className={`mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-lime-200' : 'text-forest'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-lime-200' : 'bg-forest'}`} />
      {children}
    </div>
  );
}

function DashboardPreview() {
  const [active, setActive] = useState('Overview');
  const tabs = ['Overview', 'Products', 'Bookings'];

  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-8 rounded-full bg-[#DDEBCF]/60 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative overflow-hidden rounded-[22px] border border-[#E8EDE6] bg-white shadow-[0_35px_100px_-40px_rgba(20,55,35,.35)]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-sm font-bold text-white">Z</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Your business</p>
              <p className="text-[10px] text-gray-400">Sample workspace</p>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Workspace
          </span>
        </div>

        <div className="flex gap-5 border-b border-gray-100 px-5 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`border-b-2 pb-3 text-xs font-medium transition ${
                active === tab ? 'border-forest text-forest' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[300px] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {active === 'Overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-xs text-gray-400">Your business at a glance</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">Everything in its place.</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Products', 'Catalogue'],
                    ['Orders', 'Activity'],
                    ['Customers', 'Records'],
                  ].map(([name, value]) => (
                    <div key={name} className="rounded-xl border border-gray-100 bg-[#FAFBF9] p-3">
                      <p className="text-[10px] text-gray-400">{name}</p>
                      <p className="mt-2 text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-800">Business activity</p>
                    <span className="text-[10px] text-gray-400">Illustrative view</span>
                  </div>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[35, 52, 43, 70, 56, 83, 64, 94, 61, 77, 53, 86].map((height, i) => (
                      <div key={i} className="flex flex-1 items-end">
                        <div className={`w-full rounded-t-sm ${i === 7 ? 'bg-forest' : 'bg-forest/15'}`} style={{ height: `${height}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] text-gray-400">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                  </div>
                </div>
              </motion.div>
            )}

            {active === 'Products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs text-gray-400">Your catalogue</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">What you offer.</h3>
                </div>
                {['Featured collection', 'Everyday essentials', 'Signature pieces'].map((item, i) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${['bg-[#E9EEE7]', 'bg-[#F0E8E1]', 'bg-[#E8EAF0]'][i]}`}>
                      <Package className="h-5 w-5 text-forest" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{item}</p>
                      <p className="mt-1 text-[10px] text-gray-400">Product listing</p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-gray-300" />
                  </div>
                ))}
              </motion.div>
            )}

            {active === 'Bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-xs text-gray-400">Service management</p>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900">Keep your day organised.</h3>
                </div>
                {[
                  ['09:00 AM', 'Service appointment', 'Confirmed'],
                  ['11:30 AM', 'Customer booking', 'Pending'],
                  ['02:00 PM', 'Consultation', 'Confirmed'],
                ].map(([time, service, status]) => (
                  <div key={time} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="rounded-lg bg-forest/5 p-2.5"><Clock3 className="h-4 w-4 text-forest" /></div>
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
          <span className="text-[10px] text-gray-400">One connected business workspace</span>
          <span className="text-[10px] font-semibold text-forest">Powered by Zuno</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-3 top-16 hidden rounded-xl border border-gray-100 bg-white p-3 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#EEF4E9] p-2"><CircleCheck className="h-4 w-4 text-forest" /></div>
          <div>
            <p className="text-[9px] text-gray-400">Business tools</p>
            <p className="text-xs font-semibold text-gray-900">Together, at last.</p>
          </div>
        </div>
      </motion.div>
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
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="overflow-hidden bg-white text-[#17251D]">
      {/* HERO */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute -right-40 -top-20 -z-10 h-[620px] w-[620px] rounded-full bg-[#EAF2E3] blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <motion.div initial="hidden" animate="visible" variants={reveal}>
            <Eyebrow>FOR THE BUSINESS YOU'RE BUILDING</Eyebrow>
            <h1 className="max-w-[650px] text-[44px] font-semibold leading-[1.04] tracking-[-0.06em] text-[#17251D] sm:text-6xl lg:text-[70px]">
              Your business has somewhere
              <span className="block text-forest">bigger to go.</span>
            </h1>
            <p className="mt-7 max-w-[510px] text-base leading-8 text-gray-500 sm:text-lg">
              Give it the tools, presence and confidence to get there. Build your online presence, showcase what you offer and manage the work behind every order or booking.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/register" className="inline-flex min-h-[54px] items-center gap-3 rounded-xl bg-forest px-7 text-sm font-semibold text-white shadow-lg shadow-forest/15 transition hover:-translate-y-0.5 hover:bg-forest/90">
                Get started with Zuno <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#platform" className="inline-flex min-h-[54px] items-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:border-forest hover:text-forest">
                Explore the platform <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-400">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" /> For products and services</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" /> One connected workspace</span>
            </div>
          </motion.div>

          <DashboardPreview />
        </div>

        <div className="border-y border-gray-100 bg-[#FAFBF9]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">BUILT FOR DIFFERENT WAYS OF DOING BUSINESS</p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-semibold tracking-wider text-gray-500">
              <span>RETAIL</span><span>PROFESSIONAL SERVICES</span><span>BEAUTY & WELLNESS</span><span>ONLINE COMMERCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <motion.div {...{ ...reveal, viewport: { once: true, amount: 0.2 } }} className="max-w-2xl">
          <Eyebrow>YOUR BUSINESS, YOUR WAY</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
            Different businesses. One place to move forward.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Whether you sell products, provide services or do a little of both, Zuno gives your business a more organised way to grow.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {businessTypes.map((business, index) => {
            const Icon = business.icon;
            return (
              <motion.div
                key={business.title}
                {...reveal}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="group rounded-2xl border border-gray-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-forest/30 hover:shadow-[0_20px_55px_-35px_rgba(20,55,35,.3)] sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3ED] text-forest transition group-hover:bg-forest group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{business.title}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-7 text-gray-500">{business.description}</p>
                <p className="mt-6 border-t border-gray-100 pt-5 text-[10px] font-semibold tracking-wide text-gray-400">{business.examples}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section id="platform" className="scroll-mt-24 bg-[#F7F9F5] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <motion.div {...reveal}>
              <Eyebrow>THE ZUNO PLATFORM</Eyebrow>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                Everything connected. Nothing holding you back.
              </h2>
            </motion.div>
            <motion.p {...reveal} className="max-w-lg text-sm leading-8 text-gray-500 sm:text-base lg:justify-self-end">
              Your online presence, products, customers and daily operations are all part of the same business. Zuno helps bring them together, so you can focus on what comes next.
            </motion.p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.number}
                  {...reveal}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="bg-white p-7 sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3ED] text-forest">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-gray-300">{item.number}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500">{item.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-forest/10 bg-[#EAF0E7] px-6 py-6 text-center sm:flex-row sm:justify-center">
            <Layers3 className="h-5 w-5 text-forest" />
            <p className="text-sm font-semibold text-forest">One connected workspace for the business you're building.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <Eyebrow>YOUR NEXT STEP</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Start with what you have. Build from there.
          </h2>
          <p className="mt-5 text-sm leading-7 text-gray-500 sm:text-base">
            Getting your business organised doesn't have to be complicated. Begin with the essentials and grow into more.
          </p>
        </motion.div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-gray-300 md:block" />
          {[
            { icon: Users, title: 'Create your workspace', text: 'Set up your business and choose the tools that fit the way you work.' },
            { icon: Store, title: 'Build your presence', text: 'Showcase your business, products or services in a place customers can visit.' },
            { icon: Sparkles, title: 'Keep moving forward', text: 'Manage activity, serve customers and build better ways of working over time.' },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} {...reveal} className="relative text-center">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-forest shadow-sm">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest font-mono text-[9px] font-bold text-white">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-gray-500">{step.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CUSTOMER PROMISE */}
      <section className="relative overflow-hidden bg-[#153D2D] py-24 text-white lg:py-32">
        <div className="pointer-events-none absolute -right-28 -top-36 h-[480px] w-[480px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-5 -top-16 h-[330px] w-[330px] rounded-full border border-white/[0.08]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.85fr]">
          <motion.div {...reveal}>
            <Eyebrow light>BUILT AROUND YOUR AMBITION</Eyebrow>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
              You bring the ambition. We'll help with the tools.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-8 text-white/65 sm:text-base">
              Every business starts somewhere. Zuno is here to make the next steps feel more possible — with a professional presence and a clearer way to manage the work behind it.
            </p>
            <Link to="/register" className="mt-8 inline-flex min-h-[52px] items-center gap-3 rounded-xl bg-lime-200 px-6 text-sm font-semibold text-[#173B2B] transition hover:-translate-y-0.5 hover:bg-lime-100">
              Start building with Zuno <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div {...reveal} className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Store, title: 'Your presence', detail: 'A place to be discovered' },
                { icon: Package, title: 'Your offering', detail: 'Products and services' },
                { icon: CalendarDays, title: 'Your customers', detail: 'Orders and bookings' },
                { icon: ChartNoAxesCombined, title: 'Your operations', detail: 'A clearer overview' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`rounded-2xl border border-white/10 p-5 sm:p-7 ${index === 0 ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
                    <Icon className="h-6 w-6 text-lime-200" />
                    <h3 className="mt-8 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-[11px] text-white/45">{item.detail}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-lime-200/20 bg-lime-200/10 py-4 text-xs font-semibold text-lime-100">
              <CircleCheck className="h-4 w-4" /> One business. More room to grow.
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div {...reveal}>
            <Eyebrow>GOOD QUESTIONS</Eyebrow>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
              A little more clarity before you begin.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500">
              Need help deciding whether Zuno fits your business? Our support team can help.
            </p>
            <Link to="/support" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest">
              Visit support <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div {...reveal}>
            {faqs.map((faq) => <FAQItem key={faq.question} {...faq} />)}
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
            <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-[#17251D] sm:text-5xl">
              Give your business room to become more.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-gray-500 sm:text-base">
              Your ideas deserve somewhere to grow. Start building your business with Zuno.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="inline-flex min-h-[52px] items-center gap-3 rounded-xl bg-forest px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-forest/90">
                Get started with Zuno <ArrowRight className="h-4 w-4" />
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
