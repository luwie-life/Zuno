
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Globe2,
  Layers3,
  Menu,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';

const rise = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const capabilities = [
  {
    number: '01',
    icon: Globe2,
    title: 'Be somewhere customers can find you.',
    body: 'Create an online storefront that gives your business a home beyond social media and word of mouth.',
    detail: 'Your brand. Your presence. Your space.',
  },
  {
    number: '02',
    icon: Package,
    title: 'Bring everything you offer together.',
    body: 'Showcase products and services, organise your catalogue and make it easier for customers to explore.',
    detail: 'Products, services and inventory.',
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Keep business moving.',
    body: 'Manage customer orders, sales and booking requests without losing track of the details.',
    detail: 'Orders, sales and appointments.',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'See the bigger picture.',
    body: 'Bring everyday business activity into one workspace and make more informed decisions.',
    detail: 'Customers, activity and reports.',
  },
];

const audiences = [
  {
    number: '01',
    type: 'PRODUCT BUSINESSES',
    title: 'For the things you sell.',
    description: 'Give your products a home. Organise your catalogue, keep an eye on inventory and manage customer orders.',
    examples: ['Fashion and retail', 'Beauty and lifestyle', 'Electronics and more'],
    icon: ShoppingBag,
    theme: 'bg-[#E9E7DE]',
    accent: '#A9A28C',
  },
  {
    number: '02',
    type: 'SERVICE BUSINESSES',
    title: 'For the work you do.',
    description: 'Present your services professionally, manage availability and keep customer booking requests organised.',
    examples: ['Salons and barbers', 'Freelancers and studios', 'Consultants and professionals'],
    icon: CalendarDays,
    theme: 'bg-[#E8EAE4]',
    accent: '#8EAA91',
  },
  {
    number: '03',
    type: 'HYBRID BUSINESSES',
    title: 'For everything you do.',
    description: 'Bring products and services into the same business experience instead of managing disconnected tools.',
    examples: ['Beauty and wellness', 'Fashion and tailoring', 'Retail with services'],
    icon: Layers3,
    theme: 'bg-[#EAE5E0]',
    accent: '#B69A89',
  },
];

const questions = [
  {
    q: 'What exactly is Zuno?',
    a: 'Zuno is a business platform that helps businesses establish an online presence and organise important parts of their operations, including products, orders, inventory, customers and service bookings.',
  },
  {
    q: 'Who can use Zuno?',
    a: 'Zuno is designed for product businesses, service businesses and businesses that do both. Examples include retailers, fashion brands, salons, barbers, freelancers and other independent businesses.',
  },
  {
    q: 'Can I create a storefront for my business?',
    a: 'Yes. Zuno provides storefront tools that let you present your business and showcase the products or services you offer to customers.',
  },
  {
    q: 'Can I manage services and appointments?',
    a: 'Zuno includes service and booking capabilities for appointment-based businesses. You can present services and manage booking requests from your business workspace.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. Zuno is designed to help you set up and manage your business without having to build software yourself.',
  },
];

function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      transition={reduceMotion ? { duration: 0 } : { delay }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, light = false }) {
  return (
    <div className={`mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${light ? 'text-[#C9E5A9]' : 'text-[#37664A]'}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${light ? 'bg-[#C9E5A9]' : 'bg-[#37664A]'}`} />
      {children}
    </div>
  );
}

function PrimaryLink({ to = '/register', children = 'Get started with Zuno', light = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-[54px] items-center justify-center gap-4 rounded-full px-7 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
        light
          ? 'bg-[#D9EDB9] text-[#173C2B] hover:bg-white'
          : 'bg-[#123F2D] text-white shadow-[0_12px_30px_-14px_rgba(18,63,45,.6)] hover:bg-[#1D563D]'
      }`}
    >
      {children}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

function BrowserBar() {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-[#E9EAE5] bg-white px-4">
      <span className="h-2 w-2 rounded-full bg-[#E7B0A6]" />
      <span className="h-2 w-2 rounded-full bg-[#E6D19A]" />
      <span className="h-2 w-2 rounded-full bg-[#A8C8A8]" />
      <div className="mx-auto flex h-6 max-w-[220px] flex-1 items-center justify-center rounded-md bg-[#F4F5F1] text-[9px] text-[#92988F]">
        yourbusiness.zuno.com.ng
      </div>
    </div>
  );
}

function StorefrontMockup() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_35px_90px_-45px_rgba(0,0,0,.38)]">
      <BrowserBar />
      <div className="flex items-center justify-between border-b border-[#F0F0EB] px-4 py-3 sm:px-5">
        <span className="text-[10px] font-bold tracking-[0.16em] text-[#252A24]">STUDIO / FORM</span>
        <div className="flex items-center gap-3 text-[9px] text-[#777D74]">
          <span>SHOP</span>
          <span>ABOUT</span>
          <span className="flex items-center gap-1"><ShoppingBag size={11} /> BAG</span>
        </div>
      </div>

      <div className="relative grid min-h-[190px] grid-cols-[1fr_.75fr] overflow-hidden bg-[#E8E6DC] sm:min-h-[250px]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8">
          <p className="text-[8px] font-semibold tracking-[0.2em] text-[#687065]">A MORE CONSIDERED COLLECTION</p>
          <h3 className="mt-4 max-w-[210px] font-display text-[27px] leading-[1.04] tracking-[-0.055em] text-[#20271F] sm:text-[40px]">
            Made for your everyday.
          </h3>
          <p className="mt-3 max-w-[180px] text-[9px] leading-5 text-[#73776D]">
            Discover pieces designed to become part of your story.
          </p>
          <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#173F2D] px-4 py-2.5 text-[9px] font-semibold text-white">
            Explore collection <ArrowUpRight size={11} />
          </span>
        </div>
        <div className="relative flex items-end justify-center overflow-hidden">
          <div className="absolute right-[-25px] top-[-30px] h-48 w-48 rounded-full bg-[#D0C6B4] sm:h-64 sm:w-64" />
          <div className="relative mb-[-18px] flex h-[150px] w-[100px] items-center justify-center rounded-t-[48px] bg-[#A7A18F] shadow-2xl sm:h-[200px] sm:w-[140px]">
            <div className="absolute inset-x-5 top-0 h-10 rounded-b-[30px] bg-[#777B6C]" />
            <span className="mt-8 text-[8px] font-semibold tracking-[0.2em] text-white/80">S / F</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] font-semibold tracking-[0.18em] text-[#9A9D94]">SELECTED FOR YOU</p>
            <h4 className="mt-1 font-display text-lg tracking-tight text-[#252A24]">Explore the collection</h4>
          </div>
          <span className="text-[9px] text-[#777D74]">View all <ArrowRight className="ml-1 inline" size={10} /></span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            ['#DAD6C9', 'The Form Tote'],
            ['#D8D0C8', 'Everyday Shirt'],
            ['#D8DCD2', 'Studio Objects'],
          ].map(([color, name]) => (
            <div key={name}>
              <div className="flex aspect-[1/1.05] items-center justify-center rounded-md" style={{ backgroundColor: color }}>
                <div className="h-[52%] w-[48%] rounded-[35%_35%_12%_12%] border border-black/10 bg-white/20" />
              </div>
              <p className="mt-2 text-[8px] font-medium text-[#343A32]">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityCard() {
  return (
    <div className="w-full max-w-[255px] rounded-[16px] border border-white/70 bg-white p-4 shadow-[0_25px_60px_-25px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-[#3C463D]">Business activity</span>
        <span className="rounded-full bg-[#EDF3E9] px-2 py-1 text-[8px] font-medium text-[#426447]">Example</span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF2E9] text-[#315C3C]"><ShoppingBag size={14} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold text-[#343B34]">New order received</p>
            <p className="text-[8px] text-[#92988F]">Customer order</p>
          </div>
          <CircleCheck size={14} className="text-[#62825D]" />
        </div>
        <div className="h-px bg-[#EFF0EB]" />
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2EDE7] text-[#8C684D]"><CalendarDays size={14} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold text-[#343B34]">Booking request</p>
            <p className="text-[8px] text-[#92988F]">Awaiting confirmation</p>
          </div>
          <span className="rounded-full bg-[#F8F0E1] px-2 py-1 text-[8px] text-[#92703C]">Pending</span>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="absolute -inset-8 rounded-full bg-[#D9E6D2]/60 blur-[70px]" />
      <div className="relative rounded-[28px] border border-white/80 bg-[#F2F1EA] p-3 shadow-[0_40px_100px_-55px_rgba(20,50,30,.45)] sm:p-5">
        <div className="mb-3 flex items-center justify-between px-1 sm:px-2">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.18em] text-[#6D776C]">A BUSINESS, BROUGHT TOGETHER</p>
            <p className="mt-1 text-[10px] text-[#969C91]">A glimpse of what you can build</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#DCE3D8] bg-white/70 px-3 py-1.5 text-[8px] font-medium text-[#557052]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6C9464]" /> Zuno
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <StorefrontMockup />
        </motion.div>

        <motion.div
          className="absolute -bottom-6 -left-3 z-20 sm:-left-8 sm:bottom-5"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ActivityCard />
        </motion.div>

        <motion.div
          className="absolute -right-2 top-[18%] z-20 hidden rounded-xl border border-white/80 bg-white px-4 py-3 shadow-xl sm:block"
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF0E6] text-[#315D3C]"><Globe2 size={15} /></span>
            <div>
              <p className="text-[8px] text-[#969C91]">Your online presence</p>
              <p className="text-[10px] font-semibold text-[#28342A]">Open for business</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PlatformDemo() {
  const [active, setActive] = useState('Presence');

  const views = {
    Presence: {
      label: 'YOUR ONLINE STOREFRONT',
      title: 'A home for your brand.',
      text: 'Give customers a place to discover your business, explore what you offer and get in touch.',
      icon: Store,
      items: ['Your business identity', 'Products and services', 'A customer-facing storefront'],
    },
    Commerce: {
      label: 'YOUR PRODUCTS AND SALES',
      title: 'Know what is moving.',
      text: 'Organise your catalogue, keep track of stock and manage customer orders in one workspace.',
      icon: Package,
      items: ['Product catalogue', 'Inventory management', 'Sales and orders'],
    },
    Services: {
      label: 'YOUR SERVICES AND BOOKINGS',
      title: 'Make every appointment count.',
      text: 'Present your services, organise availability and keep booking requests in view.',
      icon: CalendarDays,
      items: ['Service listings', 'Availability', 'Booking requests'],
    },
    Operations: {
      label: 'YOUR BUSINESS WORKSPACE',
      title: 'Bring the details together.',
      text: 'Keep customers and everyday business activity organised as your business grows.',
      icon: BarChart3,
      items: ['Customer records', 'Business activity', 'Reports and insights'],
    },
  };

  const current = views[active];
  const Icon = current.icon;

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E3E6DF] bg-white shadow-[0_30px_90px_-55px_rgba(0,0,0,.3)]">
      <div className="flex flex-wrap gap-2 border-b border-[#ECEEE9] bg-[#FBFCFA] p-3 sm:p-4">
        {Object.keys(views).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-full px-4 py-2.5 text-[11px] font-semibold transition ${
              active === tab
                ? 'bg-[#173F2D] text-white shadow-sm'
                : 'text-[#737D72] hover:bg-[#EDF1E9] hover:text-[#294B32]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Eyebrow>{current.label}</Eyebrow>
              <h3 className="max-w-sm font-display text-3xl leading-[1.08] tracking-[-0.045em] text-[#17291E] sm:text-4xl">
                {current.title}
              </h3>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#727B70]">{current.text}</p>
              <ul className="mt-7 space-y-3">
                {current.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs font-medium text-[#455347]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF1E6] text-[#47704B]"><Check size={11} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex min-h-[310px] items-center justify-center overflow-hidden bg-[#F1F3ED] p-6 sm:p-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#DCE4D7]" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border border-[#DCE4D7]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-[360px] rounded-2xl border border-white bg-white p-5 shadow-[0_25px_65px_-35px_rgba(0,0,0,.25)] sm:p-6"
            >
              <div className="flex items-center justify-between border-b border-[#F0F1ED] pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1E6] text-[#315D3C]"><Icon size={17} /></span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#303B31]">Your business</p>
                    <p className="text-[8px] text-[#9AA096]">Zuno workspace</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#EFF4EC] px-2.5 py-1 text-[8px] font-medium text-[#557653]">Overview</span>
              </div>

              <div className="mt-5">
                <p className="text-[8px] font-semibold tracking-[0.16em] text-[#9AA096]">YOUR BUSINESS, AT A GLANCE</p>
                <h4 className="mt-1 font-display text-xl tracking-tight text-[#263329]">{current.title}</h4>
              </div>

              <div className="mt-5 space-y-2.5">
                {current.items.map((item, i) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-[#EFF1EC] p-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 1 ? 'bg-[#F2EEE7] text-[#8D7357]' : 'bg-[#EDF2E9] text-[#53734E]'}`}>
                      {i === 0 ? <CircleCheck size={14} /> : i === 1 ? <Layers3 size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <span className="flex-1 text-[10px] font-medium text-[#4A554B]">{item}</span>
                    <ArrowRight size={12} className="text-[#A7AEA3]" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F5F7F2] px-3 py-2.5">
                <span className="text-[8px] text-[#788174]">One connected workspace</span>
                <span className="text-[8px] font-semibold text-[#426345]">Powered by Zuno</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConnectedDiagram() {
  const nodes = [
    { icon: Store, title: 'Online presence', sub: 'Your storefront' },
    { icon: Package, title: 'What you offer', sub: 'Products and services' },
    { icon: ShoppingBag, title: 'Customer activity', sub: 'Orders and bookings' },
    { icon: BarChart3, title: 'Business operations', sub: 'Manage and understand' },
  ];

  return (
    <div className="relative mx-auto max-w-[900px]">
      <div className="absolute left-1/2 top-[12%] hidden h-[76%] w-px -translate-x-1/2 bg-white/15 md:block" />
      <div className="grid gap-3 sm:grid-cols-2">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D9EDB9] text-[#183F2C]"><Icon size={20} /></span>
              <div>
                <p className="text-sm font-semibold text-white">{node.title}</p>
                <p className="mt-1 text-[11px] text-white/45">{node.sub}</p>
              </div>
              <span className="ml-auto font-mono text-[10px] text-white/25">0{i + 1}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="relative mx-auto mt-5 flex max-w-[360px] items-center justify-center gap-3 rounded-full border border-[#D9EDB9]/25 bg-[#D9EDB9]/10 px-5 py-4 text-center">
        <Sparkles size={16} className="text-[#D9EDB9]" />
        <span className="text-xs font-semibold text-[#E5F1D5]">One business. More room to grow.</span>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E8EAE5]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-sm font-semibold text-[#263329] sm:text-base">{question}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${open ? 'rotate-180 bg-[#173F2D] text-white' : 'bg-[#F0F2ED] text-[#687366]'}`}>
          <ChevronDown size={15} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-[#737D72]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);

  const navLinks = [
    ['#platform', 'Platform'],
    ['#businesses', 'Who it’s for'],
    ['/pricing', 'Pricing'],
    ['/support', 'Support'],
  ];

  return (
    <main className="overflow-hidden bg-[#FBFCF9] text-[#17291E]">
      {/* HERO */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-[18%] -top-[30%] h-[780px] w-[780px] rounded-full bg-[#E9F0E3] blur-[2px]" />
          <div className="absolute right-[14%] top-[20%] h-[420px] w-[420px] rounded-full bg-[#F2F0E8] blur-[70px]" />
        </div>

        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <header className="relative z-30 flex h-[82px] items-center justify-between border-b border-[#263C2D]/10">
            <Link to="/" aria-label="Zuno home" className="flex items-center">
              <img src="/logo.svg" alt="Zuno" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="ml-[-1px] font-display text-2xl font-bold tracking-[-0.07em] text-[#173F2D]">zuno</span>
            </Link>

            <nav className="hidden items-center gap-9 lg:flex" aria-label="Main navigation">
              {navLinks.map(([href, label]) => (
                href.startsWith('/') ? (
                  <Link key={label} to={href} className="text-xs font-medium text-[#677268] transition hover:text-[#173F2D]">{label}</Link>
                ) : (
                  <a key={label} href={href} className="text-xs font-medium text-[#677268] transition hover:text-[#173F2D]">{label}</a>
                )
              ))}
            </nav>

            <div className="hidden items-center gap-5 lg:flex">
              <Link to="/login" className="text-xs font-semibold text-[#536052] transition hover:text-[#173F2D]">Sign in</Link>
              <Link to="/register" className="group inline-flex h-11 items-center gap-3 rounded-full bg-[#173F2D] px-5 text-xs font-semibold text-white transition hover:bg-[#24563C]">
                Get started <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE3D9] bg-white/70 text-[#173F2D] lg:hidden"
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>

            <AnimatePresence>
              {mobileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 right-0 top-[72px] z-40 rounded-2xl border border-[#E4E9E0] bg-white p-4 shadow-xl lg:hidden"
                >
                  <div className="flex flex-col">
                    {navLinks.map(([href, label]) => (
                      href.startsWith('/') ? (
                        <Link key={label} to={href} onClick={() => setMobileMenu(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-[#4F5D50] hover:bg-[#F3F6F0]">{label}</Link>
                      ) : (
                        <a key={label} href={href} onClick={() => setMobileMenu(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-[#4F5D50] hover:bg-[#F3F6F0]">{label}</a>
                      )
                    ))}
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EDF0EA] pt-3">
                      <Link to="/login" onClick={() => setMobileMenu(false)} className="rounded-full border border-[#DCE4D8] py-3 text-center text-xs font-semibold">Sign in</Link>
                      <Link to="/register" onClick={() => setMobileMenu(false)} className="rounded-full bg-[#173F2D] py-3 text-center text-xs font-semibold text-white">Get started</Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <div className="grid items-center gap-16 pb-28 pt-16 lg:min-h-[690px] lg:grid-cols-[.88fr_1.12fr] lg:gap-8 lg:pb-32 lg:pt-20">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10">
              <motion.div variants={rise}>
                <Eyebrow>FOR THE BUSINESS YOU'RE BUILDING</Eyebrow>
              </motion.div>
              <motion.h1 variants={rise} className="max-w-[690px] font-display text-[clamp(3.3rem,6.5vw,6.3rem)] font-medium leading-[.96] tracking-[-0.075em] text-[#17291E]">
                Your business deserves a bigger
                <span className="relative mt-1 block text-[#49744B]">
                  kind of future.
                  <svg className="absolute -bottom-3 left-0 w-[78%]" viewBox="0 0 500 18" fill="none" aria-hidden="true">
                    <path d="M3 13C126 2 315 1 497 8" stroke="#B9D29F" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>
              <motion.p variants={rise} className="mt-9 max-w-[510px] text-base leading-8 text-[#69756A] sm:text-lg">
                Build your presence. Bring your products and services together. Manage the work behind every order and booking — with one platform designed to help your business move forward.
              </motion.p>
              <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-4">
                <PrimaryLink />
                <a href="#platform" className="group inline-flex min-h-[54px] items-center gap-3 px-2 text-xs font-semibold text-[#445547] transition hover:text-[#173F2D]">
                  See what you can build
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7DFD3] transition group-hover:translate-y-1 group-hover:border-[#173F2D]"><ArrowDown size={14} /></span>
                </a>
              </motion.div>
              <motion.div variants={rise} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#DDE4D9] pt-6 text-[10px] font-medium text-[#7A8579]">
                <span className="flex items-center gap-2"><Check size={13} className="text-[#4B794C]" /> Products and services</span>
                <span className="flex items-center gap-2"><Check size={13} className="text-[#4B794C]" /> Online and in-person operations</span>
              </motion.div>
            </motion.div>

            <HeroVisual />
          </div>
        </div>

        <div className="border-y border-[#E7EBE3] bg-white/65">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-12">
            <p className="text-[9px] font-semibold tracking-[0.2em] text-[#8A9488]">ONE PLATFORM. DIFFERENT WAYS TO DO BUSINESS.</p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[10px] font-semibold tracking-[0.1em] text-[#667366]">
              <span>RETAIL</span>
              <span>FASHION</span>
              <span>PROFESSIONAL SERVICES</span>
              <span>BEAUTY & WELLNESS</span>
              <span>INDEPENDENT BRANDS</span>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="businesses" className="scroll-mt-20 bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <Eyebrow>BUILT FOR YOUR KIND OF BUSINESS</Eyebrow>
              <h2 className="max-w-[600px] font-display text-4xl leading-[1.04] tracking-[-0.06em] text-[#17291E] sm:text-6xl">
                Your business is unique. Your tools should understand that.
              </h2>
            </div>
            <p className="max-w-[470px] text-sm leading-8 text-[#778176] lg:justify-self-end">
              Not every business works the same way. Zuno brings together the tools different businesses need, without forcing them into one way of working.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {audiences.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.number} delay={index * 0.08}>
                  <article className="group h-full overflow-hidden rounded-[22px] border border-[#E8EBE5] bg-[#FBFCF9] transition duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_-40px_rgba(20,50,30,.3)]">
                    <div className={`relative flex h-[190px] items-center justify-center overflow-hidden ${item.theme}`}>
                      <div className="absolute h-48 w-48 rounded-full border border-black/[0.07]" />
                      <div className="absolute h-36 w-36 rounded-full border border-black/[0.07]" />
                      <div className="absolute h-24 w-24 rounded-full border border-black/[0.07]" />
                      <motion.div whileHover={{ rotate: 8, scale: 1.06 }} className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-white shadow-[0_20px_45px_-20px_rgba(0,0,0,.25)]">
                        <Icon size={30} strokeWidth={1.5} style={{ color: item.accent }} />
                      </motion.div>
                      <span className="absolute left-5 top-5 font-mono text-[10px] text-black/35">{item.number}</span>
                      <span className="absolute bottom-5 right-5 text-[9px] font-semibold tracking-[0.16em] text-black/40">ZUNO / BUSINESS</span>
                    </div>
                    <div className="p-7 sm:p-8">
                      <p className="text-[9px] font-semibold tracking-[0.18em] text-[#68816A]">{item.type}</p>
                      <h3 className="mt-3 font-display text-[27px] leading-tight tracking-[-0.045em] text-[#243228]">{item.title}</h3>
                      <p className="mt-4 min-h-[72px] text-sm leading-7 text-[#788176]">{item.description}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {item.examples.map((example) => (
                          <span key={example} className="rounded-full border border-[#E5E9E2] bg-white px-3 py-2 text-[9px] font-medium text-[#667265]">{example}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="scroll-mt-20 bg-[#F3F5F0] py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="mx-auto max-w-[780px] text-center">
            <Eyebrow>THE ZUNO PLATFORM</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.06em] text-[#17291E] sm:text-6xl">
              Less juggling. More building.
            </h2>
            <p className="mx-auto mt-6 max-w-[580px] text-sm leading-8 text-[#778176] sm:text-base">
              Your storefront, products, customers and everyday operations shouldn't feel like separate businesses. Bring the important pieces together in one place.
            </p>
          </Reveal>

          <div className="mt-14">
            <PlatformDemo />
          </div>

          <div className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.number} delay={index * 0.06}>
                  <div className="border-t border-[#D9E0D5] pt-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9AA497]">{item.number}</span>
                      <Icon size={18} strokeWidth={1.5} className="text-[#527253]" />
                    </div>
                    <h3 className="mt-7 font-display text-[22px] leading-tight tracking-[-0.04em] text-[#26372A]">{item.title}</h3>
                    <p className="mt-3 text-xs leading-7 text-[#788176]">{item.body}</p>
                    <p className="mt-5 text-[9px] font-semibold tracking-[0.1em] text-[#59765A]">{item.detail}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONNECTED BUSINESS */}
      <section className="relative overflow-hidden bg-[#153C2C] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute -right-36 -top-48 h-[650px] w-[650px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-12 -top-24 h-[400px] w-[400px] rounded-full border border-white/[0.08]" />
        <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
          <Reveal>
            <Eyebrow light>ONE CONNECTED BUSINESS</Eyebrow>
            <h2 className="max-w-[570px] font-display text-4xl leading-[1.04] tracking-[-0.06em] sm:text-6xl">
              Every part of your business has a place.
            </h2>
            <p className="mt-6 max-w-[470px] text-sm leading-8 text-white/60 sm:text-base">
              A customer discovers your business. They explore what you offer. An order or booking comes in. You manage what happens next.
            </p>
            <p className="mt-8 flex items-center gap-3 text-xs font-semibold text-[#D9EDB9]">
              One clearer way to move forward <ArrowRight size={15} />
            </p>
          </Reveal>
          <ConnectedDiagram />
        </div>
      </section>

      {/* HOW TO BEGIN */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal>
              <Eyebrow>YOUR NEXT CHAPTER</Eyebrow>
              <h2 className="max-w-[470px] font-display text-4xl leading-[1.05] tracking-[-0.06em] text-[#17291E] sm:text-6xl">
                Start with what you have. Grow into what's possible.
              </h2>
              <p className="mt-6 max-w-[400px] text-sm leading-8 text-[#778176]">
                You don't need to have everything figured out. Start by giving your business a place to grow, then build from there.
              </p>
              <div className="mt-8"><PrimaryLink /></div>
            </Reveal>

            <div className="space-y-0">
              {[
                { n: '01', title: 'Set up your business', body: 'Create your workspace and bring your business details together.', icon: Users },
                { n: '02', title: 'Build your presence', body: 'Showcase your products or services in a place customers can explore.', icon: Store },
                { n: '03', title: 'Manage what comes next', body: 'Keep track of customer activity and the work behind your business.', icon: Layers3 },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.n} delay={i * 0.07}>
                    <div className="group flex gap-5 border-t border-[#E7EBE4] py-7 sm:gap-8 sm:py-9">
                      <span className="pt-1 font-mono text-[11px] text-[#9BA598]">{step.n}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-display text-2xl tracking-[-0.04em] text-[#29382C]">{step.title}</h3>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F3ED] text-[#4B704C] transition group-hover:bg-[#173F2D] group-hover:text-white"><Icon size={17} /></span>
                        </div>
                        <p className="mt-3 max-w-[430px] text-sm leading-7 text-[#788176]">{step.body}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
              <div className="border-t border-[#E7EBE4]" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F7F8F5] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <Reveal>
            <Eyebrow>THE DETAILS</Eyebrow>
            <h2 className="max-w-[430px] font-display text-4xl leading-[1.05] tracking-[-0.06em] text-[#17291E] sm:text-5xl">
              Good things begin with clarity.
            </h2>
            <p className="mt-5 max-w-[360px] text-sm leading-7 text-[#788176]">
              A few things you might want to know before getting started.
            </p>
            <Link to="/support" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-[#3E6744] transition hover:gap-3">
              Visit the help centre <ArrowUpRight size={14} />
            </Link>
          </Reveal>
          <Reveal>
            <div className="border-t border-[#E1E6DE]">
              {questions.map((item) => <FAQItem key={item.q} question={item.q} answer={item.a} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#F7F8F5] px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-[#DDE8D4] px-7 py-16 sm:px-14 sm:py-24 lg:px-20">
            <div className="pointer-events-none absolute -right-20 -top-52 h-[500px] w-[500px] rounded-full border border-[#426544]/10" />
            <div className="pointer-events-none absolute -right-2 -top-36 h-[360px] w-[360px] rounded-full border border-[#426544]/10" />
            <div className="relative z-10 max-w-[760px]">
              <Eyebrow>THE NEXT CHAPTER STARTS HERE</Eyebrow>
              <h2 className="font-display text-4xl leading-[1.03] tracking-[-0.065em] text-[#173323] sm:text-6xl lg:text-7xl">
                Your ambition deserves somewhere to go.
              </h2>
              <p className="mt-6 max-w-[530px] text-sm leading-8 text-[#637362] sm:text-base">
                Give your business the presence and tools to take its next step. Start building with Zuno.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <PrimaryLink />
                <Link to="/pricing" className="inline-flex min-h-[54px] items-center gap-2 rounded-full border border-[#AABBA4] px-6 text-xs font-semibold text-[#34513A] transition hover:border-[#173F2D] hover:bg-white/40">
                  Explore pricing <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-16 right-10 hidden h-64 w-64 items-center justify-center rounded-full border border-[#557451]/15 lg:flex">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-[#557451]/20">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#173F2D] text-3xl font-display font-bold tracking-[-0.08em] text-white shadow-2xl">z.</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
