
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Globe2,
  Layers3,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  Menu as MenuIcon,
} from 'lucide-react';

const ease = [0.22, 1, 0.36, 1];

const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay, duration: reduce ? 0 : 0.7 }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, light = false }) {
  return (
    <div className={`mb-5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.19em] ${light ? 'text-[#B9D5B8]' : 'text-[#477452]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-[#B9D5B8]' : 'bg-[#477452]'}`} />
      {children}
    </div>
  );
}

function ButtonLink({ to = '/register', children = 'Get started', secondary = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full px-6 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
        secondary
          ? 'border border-[#DCE3DA] bg-white text-[#263B2D] hover:border-[#174D35] hover:bg-[#F7FAF5]'
          : 'bg-[#174D35] text-white shadow-[0_12px_30px_-15px_rgba(23,77,53,.55)] hover:bg-[#236344]'
      }`}
    >
      {children}
      <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${secondary ? 'bg-[#EEF2EC]' : 'bg-white/15'}`}>
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

function BrowserFrame({ children, label = 'yourbusiness.zuno.com.ng' }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#E5E8E1] bg-white shadow-[0_35px_90px_-48px_rgba(18,42,26,.35)]">
      <div className="flex h-11 items-center gap-2 border-b border-[#EDF0EA] bg-[#FAFBF9] px-4">
        <span className="h-2 w-2 rounded-full bg-[#E5B0A6]" />
        <span className="h-2 w-2 rounded-full bg-[#E7D39B]" />
        <span className="h-2 w-2 rounded-full bg-[#A9C7A5]" />
        <div className="mx-auto flex h-6 max-w-[260px] flex-1 items-center justify-center rounded-md border border-[#EEF0EB] bg-white text-[9px] text-[#899287]">
          <Globe2 size={10} className="mr-1.5" />
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

function StorefrontPreview() {
  return (
    <BrowserFrame>
      <div className="flex items-center justify-between border-b border-[#F0F1ED] px-4 py-3 sm:px-6">
        <span className="font-display text-[13px] font-bold tracking-[-0.04em] text-[#26372A]">FORME STUDIO</span>
        <div className="hidden items-center gap-5 text-[9px] font-medium text-[#687469] sm:flex">
          <span>COLLECTION</span>
          <span>OUR STORY</span>
          <span>CONTACT</span>
        </div>
        <ShoppingBag size={15} className="text-[#526451]" />
      </div>

      <div className="grid min-h-[245px] grid-cols-[1.05fr_.95fr] overflow-hidden bg-[#EAE9E1] sm:min-h-[320px]">
        <div className="flex flex-col justify-center px-5 py-7 sm:px-9 sm:py-10">
          <p className="text-[8px] font-bold tracking-[0.2em] text-[#777D6F] sm:text-[9px]">DESIGNED TO BE YOURS</p>
          <h3 className="mt-4 max-w-[250px] font-display text-[clamp(27px,4vw,49px)] font-medium leading-[.98] tracking-[-0.065em] text-[#253127]">
            A little more you. Every day.
          </h3>
          <p className="mt-4 max-w-[190px] text-[9px] leading-5 text-[#74796F] sm:text-[11px] sm:leading-6">
            Thoughtful essentials made for the way you live.
          </p>
          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#263D2D] px-4 py-2.5 text-[9px] font-semibold text-white">
            Explore collection <ArrowUpRight size={11} />
          </span>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-[#D9D6C9]">
          <div className="absolute right-[-18%] top-[-15%] h-[75%] w-[90%] rounded-full bg-[#C5C0AE]" />
          <div className="absolute bottom-[-15%] left-[-20%] h-[80%] w-[100%] rounded-full border border-white/30" />
          <div className="relative flex h-[72%] w-[55%] items-center justify-center rounded-t-[48%] bg-[#A7A28F] shadow-[0_25px_50px_-20px_rgba(0,0,0,.25)]">
            <div className="absolute inset-x-4 top-0 h-8 rounded-b-full bg-[#7F806F]" />
            <span className="mt-7 text-[8px] font-bold tracking-[.2em] text-white/80">FORME</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        {[
          ['#DAD7CC', 'Everyday tote'],
          ['#E3D9D0', 'The linen edit'],
          ['#D7DED4', 'Studio objects'],
        ].map(([color, name]) => (
          <div key={name}>
            <div className="flex aspect-[1/1] items-center justify-center rounded-lg" style={{ background: color }}>
              <div className="h-[55%] w-[42%] rounded-[35%_35%_12%_12%] border border-black/10 bg-white/30" />
            </div>
            <p className="mt-2 text-[8px] font-medium text-[#536052] sm:text-[9px]">{name}</p>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function WorkspacePreview() {
  const rows = [
    { icon: ShoppingBag, title: 'Customer order', subtitle: 'New order received', status: 'New', color: 'bg-[#EAF1E9] text-[#47734B]' },
    { icon: CalendarDays, title: 'Booking request', subtitle: 'Appointment request', status: 'Pending', color: 'bg-[#F5EEE5] text-[#96734E]' },
    { icon: Users, title: 'Customer record', subtitle: 'Customer added', status: 'Saved', color: 'bg-[#EBEFF5] text-[#58718F]' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[490px]">
      <div className="absolute -inset-8 rounded-full bg-[#D7E5D4] blur-[65px]" />
      <div className="relative overflow-hidden rounded-[20px] border border-white/80 bg-white p-4 shadow-[0_35px_90px_-45px_rgba(12,38,22,.35)] sm:p-6">
        <div className="flex items-center justify-between border-b border-[#EDF0EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1E9] text-[#315D3C]">
              <Store size={17} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#28382C]">Business workspace</p>
              <p className="mt-0.5 text-[9px] text-[#929A90]">Your business, in one place</p>
            </div>
          </div>
          <span className="rounded-full bg-[#EDF4EA] px-3 py-1.5 text-[8px] font-semibold text-[#557552]">Overview</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F5F7F3] p-4">
            <div className="flex items-center justify-between text-[#73806F]">
              <span className="text-[9px]">Products</span>
              <Package size={14} />
            </div>
            <p className="mt-3 font-display text-2xl tracking-tight text-[#26372A]">Catalogue</p>
            <p className="mt-1 text-[8px] text-[#929A90]">Organise what you sell</p>
          </div>
          <div className="rounded-xl bg-[#F5F7F3] p-4">
            <div className="flex items-center justify-between text-[#73806F]">
              <span className="text-[9px]">Activity</span>
              <BarChart3 size={14} />
            </div>
            <p className="mt-3 font-display text-2xl tracking-tight text-[#26372A]">Overview</p>
            <p className="mt-1 text-[8px] text-[#929A90]">See what's happening</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#39483A]">Recent activity</p>
          <span className="text-[8px] text-[#9AA196]">Illustrative preview</span>
        </div>

        <div className="mt-3 space-y-2">
          {rows.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3 rounded-xl border border-[#EFF1ED] p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold text-[#344236]">{item.title}</p>
                  <p className="mt-0.5 text-[8px] text-[#9AA196]">{item.subtitle}</p>
                </div>
                <span className="rounded-full bg-[#F5F6F3] px-2.5 py-1.5 text-[8px] font-medium text-[#697668]">{item.status}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#173F2D] px-4 py-3 text-white">
          <Layers3 size={14} className="text-[#D9EDB9]" />
          <span className="text-[9px] font-medium text-white/90">The important parts of your business, connected.</span>
          <ArrowUpRight size={13} className="ml-auto text-[#D9EDB9]" />
        </div>
      </div>
    </div>
  );
}

const businessTypes = [
  {
    icon: ShoppingBag,
    label: 'PRODUCT BUSINESSES',
    title: 'Sell what you create.',
    body: 'Give your products a professional home. Present your catalogue, organise inventory and manage customer orders.',
    examples: 'Retail · Fashion · Lifestyle · Electronics',
    tone: 'bg-[#EAE8DF]',
    accent: '#817C68',
  },
  {
    icon: CalendarDays,
    label: 'SERVICE BUSINESSES',
    title: 'Showcase what you do.',
    body: 'Present your services, make it easier for customers to discover your work and manage booking requests.',
    examples: 'Salons · Barbers · Freelancers · Studios',
    tone: 'bg-[#E7ECE5]',
    accent: '#58785C',
  },
  {
    icon: Layers3,
    label: 'HYBRID BUSINESSES',
    title: 'Bring it all together.',
    body: 'For businesses that sell products and provide services. Keep both sides of your business organised.',
    examples: 'Beauty · Wellness · Tailoring · Retail',
    tone: 'bg-[#EEE5DF]',
    accent: '#99745E',
  },
];

const platformItems = [
  {
    id: 'presence',
    number: '01',
    icon: Globe2,
    label: 'Your online presence',
    title: 'A place customers can call yours.',
    body: 'Create a customer-facing storefront that introduces your business and gives people a place to explore what you offer.',
    bullets: ['Your business identity', 'Products and services', 'A dedicated online storefront'],
  },
  {
    id: 'commerce',
    number: '02',
    icon: Package,
    label: 'Products and sales',
    title: 'Everything you offer, organised.',
    body: 'Bring your catalogue and inventory together, and keep customer orders within reach.',
    bullets: ['Product catalogue', 'Inventory management', 'Order management'],
  },
  {
    id: 'services',
    number: '03',
    icon: CalendarDays,
    label: 'Services and bookings',
    title: 'Make room for the work you do.',
    body: 'Present your services and manage customer booking requests from your business workspace.',
    bullets: ['Service listings', 'Availability management', 'Booking requests'],
  },
  {
    id: 'operations',
    number: '04',
    icon: BarChart3,
    label: 'Business operations',
    title: 'Stay close to what matters.',
    body: 'Keep customer information and everyday business activity more organised as you grow.',
    bullets: ['Customer records', 'Business activity', 'Reports and insights'],
  },
];

const faqs = [
  ['What is Zuno?', 'Zuno is a business platform that helps businesses establish an online presence and organise important parts of their operations, including products, orders, inventory, customers and service bookings.'],
  ['Who is Zuno for?', 'Zuno is designed for product businesses, service businesses and businesses that do both. This includes retailers, fashion brands, salons, barbers, freelancers, studios and other independent businesses.'],
  ['Can I create a storefront?', 'Yes. Zuno provides storefront tools to present your business and showcase the products or services you offer to customers.'],
  ['Can I manage bookings?', 'Zuno includes service and booking capabilities for appointment-based businesses. You can present services and manage booking requests from your business workspace.'],
  ['Do I need technical skills?', 'No. Zuno is designed to help you set up and manage your business without having to build software yourself.'],
];

function PlatformExperience() {
  const [active, setActive] = useState('presence');
  const current = platformItems.find((item) => item.id === active) || platformItems[0];
  const Icon = current.icon;

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E4E9E1] bg-white shadow-[0_30px_80px_-55px_rgba(12,38,22,.35)]">
      <div className="flex gap-1 overflow-x-auto border-b border-[#EDF0EB] bg-[#FAFBF9] p-3 sm:gap-2 sm:p-4">
        {platformItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-semibold transition ${
              active === item.id
                ? 'bg-[#174D35] text-white shadow-sm'
                : 'text-[#6C786D] hover:bg-[#EDF2EA] hover:text-[#174D35]'
            }`}
          >
            <item.icon size={13} />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.number}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[.85fr_1.15fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Eyebrow>{current.label}</Eyebrow>
              <h3 className="max-w-[420px] font-display text-3xl leading-[1.05] tracking-[-0.055em] text-[#1C3023] sm:text-4xl">
                {current.title}
              </h3>
              <p className="mt-5 max-w-[390px] text-[13px] leading-7 text-[#778277]">
                {current.body}
              </p>
              <ul className="mt-7 space-y-3">
                {current.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-[11px] font-medium text-[#455648]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF1E8] text-[#47734B]">
                      <Check size={11} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden bg-[#F1F4EF] p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#DDE6DA]" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border border-[#DDE6DA]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: .98 }}
              transition={{ duration: .3, ease }}
              className="relative z-10 w-full max-w-[390px] rounded-2xl border border-white bg-white p-5 shadow-[0_25px_60px_-35px_rgba(0,0,0,.22)] sm:p-6"
            >
              <div className="flex items-center justify-between border-b border-[#EEF0EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1E8] text-[#315D3C]">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-[#354337]">Your business</p>
                    <p className="mt-0.5 text-[8px] text-[#9AA296]">Zuno workspace</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#EFF4EC] px-2.5 py-1.5 text-[8px] font-semibold text-[#557653]">Workspace</span>
              </div>

              <p className="mt-5 text-[8px] font-bold uppercase tracking-[.16em] text-[#9AA296]">A clearer way to work</p>
              <h4 className="mt-1 font-display text-xl tracking-tight text-[#26372A]">{current.title}</h4>
              <div className="mt-5 space-y-2.5">
                {current.bullets.map((bullet, index) => (
                  <div key={bullet} className="flex items-center gap-3 rounded-xl border border-[#EFF1EC] p-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 1 ? 'bg-[#F2EEE7] text-[#8D7357]' : 'bg-[#EDF2E9] text-[#53734E]'}`}>
                      {index === 0 ? <Check size={14} /> : index === 1 ? <Layers3 size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <span className="flex-1 text-[10px] font-medium text-[#4A554B]">{bullet}</span>
                    <ArrowRight size={12} className="text-[#A7AEA3]" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F5F7F2] px-3 py-2.5">
                <span className="text-[8px] text-[#788174]">Your business, organised</span>
                <span className="text-[8px] font-semibold text-[#426345]">Zuno</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E6EAE3]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 py-5 text-left sm:py-6"
      >
        <span className="text-[13px] font-semibold text-[#2D3D30] sm:text-[15px]">{question}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${open ? 'rotate-180 bg-[#174D35] text-white' : 'bg-[#EEF2EC] text-[#637164]'}`}>
          <ChevronDown size={15} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: .23 }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pr-10 text-[13px] leading-7 text-[#778277]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <main className="overflow-hidden bg-[#FCFCFA] text-[#1C3023]">
      {/* HERO */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-[15%] -top-[20%] h-[700px] w-[700px] rounded-full bg-[#E8F0E5]" />
          <div className="absolute right-[20%] top-[25%] h-[400px] w-[400px] rounded-full bg-[#F0EFE7] blur-[80px]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FCFCFA] to-transparent" />
        </div>

        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:min-h-[700px] lg:grid-cols-[.92fr_1.08fr] lg:gap-8 lg:px-12 lg:pb-28 lg:pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: .11 } } }}
            className="relative z-10"
          >
            <motion.div variants={rise}>
              <Eyebrow>YOUR BUSINESS, READY FOR WHAT'S NEXT</Eyebrow>
            </motion.div>

            <motion.h1
              variants={rise}
              className="max-w-[700px] font-display text-[clamp(3.25rem,6.2vw,6.5rem)] font-medium leading-[.94] tracking-[-.075em] text-[#172B1E]"
            >
              Build your business beyond
              <span className="mt-2 block text-[#4F7951]">what it is today.</span>
            </motion.h1>

            <motion.p variants={rise} className="mt-8 max-w-[510px] text-[15px] leading-8 text-[#6F7B70] sm:text-[17px]">
              Your business deserves more than scattered tools and social media pages. Build your presence, manage what you offer and bring your everyday business operations together with Zuno.
            </motion.p>

            <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink>Build with Zuno</ButtonLink>
              <a href="#platform" className="group inline-flex min-h-[52px] items-center gap-3 rounded-full px-4 text-[12px] font-semibold text-[#526354] transition hover:text-[#174D35]">
                Explore the platform
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D9E2D7] transition group-hover:translate-x-1 group-hover:border-[#174D35]">
                  <ArrowRight size={14} />
                </span>
              </a>
            </motion.div>

            <motion.div variants={rise} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#DDE5DA] pt-6 text-[10px] font-medium text-[#748074]">
              <span className="flex items-center gap-2"><Check size={13} className="text-[#4F7951]" /> For products and services</span>
              <span className="flex items-center gap-2"><Check size={13} className="text-[#4F7951]" /> Built for growing businesses</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 35, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: .9, delay: .15, ease }}
            className="relative mx-auto w-full max-w-[650px]"
          >
            <div className="absolute -inset-8 rounded-full bg-[#D8E5D4]/70 blur-[65px]" />
            <div className="relative rounded-[26px] border border-white/80 bg-[#F0F1EA] p-3 shadow-[0_40px_100px_-55px_rgba(20,50,30,.45)] sm:p-5">
              <div className="mb-4 flex items-center justify-between px-1 sm:px-2">
                <div>
                  <p className="text-[9px] font-bold tracking-[.17em] text-[#667364]">THE CUSTOMER EXPERIENCE</p>
                  <p className="mt-1 text-[10px] text-[#969D92]">A storefront made for your business</p>
                </div>
                <span className="rounded-full border border-[#DCE4D8] bg-white/80 px-3 py-1.5 text-[8px] font-semibold text-[#557052]">ZUNO STOREFRONT</span>
              </div>

              <StorefrontPreview />

              <motion.div
                className="absolute -bottom-7 -left-2 z-20 w-[205px] rounded-2xl border border-white bg-white p-4 shadow-[0_20px_55px_-25px_rgba(0,0,0,.3)] sm:-left-9 sm:w-[230px]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-[#39473A]">Business activity</p>
                  <span className="rounded-full bg-[#EFF4EC] px-2 py-1 text-[7px] font-semibold text-[#557653]">Example</span>
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1E8] text-[#47734B]"><ShoppingBag size={14} /></span>
                  <div>
                    <p className="text-[9px] font-semibold text-[#39473A]">New customer order</p>
                    <p className="mt-0.5 text-[8px] text-[#9AA196]">Activity in your workspace</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-2 top-[20%] z-20 hidden rounded-xl border border-white bg-white px-4 py-3 shadow-xl sm:block"
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF2E9] text-[#47734B]"><Globe2 size={15} /></span>
                  <div>
                    <p className="text-[8px] text-[#969C91]">Your business online</p>
                    <p className="text-[10px] font-semibold text-[#28382C]">Your own storefront</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="border-y border-[#E9EDE6] bg-white/70">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-12">
            <p className="text-[9px] font-bold tracking-[.18em] text-[#929B90]">ONE PLATFORM. MANY WAYS TO BUILD.</p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-semibold tracking-[.08em] text-[#69766A]">
              <span>RETAIL</span>
              <span>FASHION</span>
              <span>PROFESSIONAL SERVICES</span>
              <span>BEAUTY & WELLNESS</span>
              <span>INDEPENDENT BRANDS</span>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES */}
      <section id="businesses" className="scroll-mt-24 bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="grid gap-8 lg:grid-cols-[1fr_.75fr] lg:items-end">
            <div>
              <Eyebrow>MADE FOR THE WAY YOU WORK</Eyebrow>
              <h2 className="max-w-[700px] font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#1C3023] sm:text-6xl">
                Different businesses. One place to move forward.
              </h2>
            </div>
            <p className="max-w-[450px] text-[13px] leading-8 text-[#7A857A] lg:justify-self-end">
              Whether you sell products, provide services or do a bit of both, your business deserves tools that make sense for the way you work.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {businessTypes.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.label} delay={index * .08}>
                  <article className="group h-full overflow-hidden rounded-[20px] border border-[#E8ECE6] bg-[#FCFCFA] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_65px_-45px_rgba(15,40,22,.35)]">
                    <div className={`relative flex h-[190px] items-center justify-center overflow-hidden ${item.tone}`}>
                      <div className="absolute h-48 w-48 rounded-full border border-black/[.07]" />
                      <div className="absolute h-36 w-36 rounded-full border border-black/[.07]" />
                      <motion.div whileHover={{ scale: 1.07, rotate: 5 }} className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[23px] bg-white shadow-[0_20px_45px_-20px_rgba(0,0,0,.22)]">
                        <Icon size={29} strokeWidth={1.5} style={{ color: item.accent }} />
                      </motion.div>
                      <span className="absolute left-5 top-5 font-mono text-[10px] text-black/35">0{index + 1}</span>
                      <span className="absolute bottom-5 right-5 text-[8px] font-bold tracking-[.16em] text-black/35">ZUNO / BUSINESS</span>
                    </div>
                    <div className="p-7 sm:p-8">
                      <p className="text-[9px] font-bold tracking-[.16em] text-[#6A866B]">{item.label}</p>
                      <h3 className="mt-3 font-display text-[27px] leading-tight tracking-[-.045em] text-[#26372A]">{item.title}</h3>
                      <p className="mt-4 min-h-[76px] text-[13px] leading-7 text-[#7A857A]">{item.body}</p>
                      <p className="mt-6 border-t border-[#E9EDE6] pt-5 text-[9px] font-semibold text-[#657566]">{item.examples}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="scroll-mt-24 bg-[#F3F5F0] py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="mx-auto max-w-[760px] text-center">
            <Eyebrow>MEET YOUR BUSINESS PLATFORM</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#1C3023] sm:text-6xl">
              The pieces of your business, working together.
            </h2>
            <p className="mx-auto mt-6 max-w-[580px] text-[13px] leading-8 text-[#7A857A] sm:text-[15px]">
              From the first impression to the work that happens behind the scenes, bring more of your business into one connected workspace.
            </p>
          </Reveal>

          <div className="mt-14">
            <PlatformExperience />
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Store, '01', 'Show up professionally', 'Give your business a customer-facing home beyond social media.'],
              [Package, '02', 'Organise what you offer', 'Keep your products, services and catalogue organised.'],
              [ShoppingBag, '03', 'Manage customer activity', 'Keep orders and booking requests within reach.'],
              [BarChart3, '04', 'Understand your business', 'Bring important business activity into one workspace.'],
            ].map(([Icon, number, title, body]) => (
              <Reveal key={number}>
                <div className="border-t border-[#DCE3D9] pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#9BA598]">{number}</span>
                    <Icon size={18} strokeWidth={1.5} className="text-[#527253]" />
                  </div>
                  <h3 className="mt-7 font-display text-[21px] leading-tight tracking-[-.04em] text-[#26372A]">{title}</h3>
                  <p className="mt-3 text-[12px] leading-7 text-[#788176]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STATEMENT */}
      <section className="relative overflow-hidden bg-[#153C2C] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute -right-40 -top-52 h-[650px] w-[650px] rounded-full border border-white/[.08]" />
        <div className="pointer-events-none absolute -right-10 -top-24 h-[400px] w-[400px] rounded-full border border-white/[.08]" />
        <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
          <Reveal>
            <Eyebrow light>MORE THAN A STOREFRONT</Eyebrow>
            <h2 className="max-w-[560px] font-display text-4xl leading-[1.02] tracking-[-.065em] sm:text-6xl">
              Your business doesn't stop at the first sale.
            </h2>
            <p className="mt-6 max-w-[460px] text-[13px] leading-8 text-white/60 sm:text-[15px]">
              Customers discover you. They explore what you offer. Orders and booking requests come in. You manage the work that follows. Zuno brings those important moments closer together.
            </p>
            <Link to="/pricing" className="mt-8 inline-flex items-center gap-3 text-[12px] font-semibold text-[#D9EDB9] transition hover:gap-4">
              Explore Zuno plans <ArrowRight size={15} />
            </Link>
          </Reveal>

          <Reveal>
            <div className="relative mx-auto grid w-full max-w-[600px] grid-cols-2 gap-3">
              {[
                [Globe2, 'Be discovered', 'Your online presence'],
                [Package, 'Show your offer', 'Products and services'],
                [ShoppingBag, 'Welcome customers', 'Orders and bookings'],
                [BarChart3, 'Keep moving', 'Business operations'],
              ].map(([Icon, title, subtitle], index) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/10 bg-white/[.055] p-5 backdrop-blur-sm sm:p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D9EDB9] text-[#183F2C]">
                    <Icon size={19} />
                  </div>
                  <p className="mt-7 text-[13px] font-semibold text-white">{title}</p>
                  <p className="mt-1.5 text-[10px] text-white/45">{subtitle}</p>
                  <span className="mt-6 block font-mono text-[9px] text-white/25">0{index + 1} / ZUNO</span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <Reveal>
            <Eyebrow>A GOOD PLACE TO BEGIN</Eyebrow>
            <h2 className="max-w-[470px] font-display text-4xl leading-[1.02] tracking-[-.06em] text-[#1C3023] sm:text-6xl">
              Start where you are. Build from there.
            </h2>
            <p className="mt-6 max-w-[400px] text-[13px] leading-8 text-[#7A857A]">
              You don't need every answer today. Start by bringing your business online and build a stronger way of working as you grow.
            </p>
            <div className="mt-8"><ButtonLink /></div>
          </Reveal>

          <div>
            {[
              ['01', 'Create your business workspace', 'Bring your business details together in one place.', Users],
              ['02', 'Build your online presence', 'Show customers your business, products and services.', Store],
              ['03', 'Manage what happens next', 'Keep your orders, bookings and customer activity organised.', Layers3],
            ].map(([number, title, body, Icon], index) => (
              <Reveal key={number} delay={index * .07}>
                <div className="group flex gap-5 border-t border-[#E7EBE4] py-7 sm:gap-8 sm:py-9">
                  <span className="pt-1 font-mono text-[11px] text-[#9BA598]">{number}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-[22px] tracking-[-.04em] text-[#29382C] sm:text-[25px]">{title}</h3>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F3ED] text-[#4B704C] transition group-hover:bg-[#173F2D] group-hover:text-white"><Icon size={17} /></span>
                    </div>
                    <p className="mt-3 max-w-[430px] text-[13px] leading-7 text-[#788176]">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-[#E7EBE4]" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F7F8F5] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <Reveal>
            <Eyebrow>QUESTIONS, ANSWERED</Eyebrow>
            <h2 className="max-w-[430px] font-display text-4xl leading-[1.03] tracking-[-.06em] text-[#1C3023] sm:text-5xl">
              Know what you're building with.
            </h2>
            <p className="mt-5 max-w-[360px] text-[13px] leading-7 text-[#788176]">
              A few useful details about getting started with Zuno.
            </p>
            <Link to="/support" className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-[#3E6744] transition hover:gap-3">
              Visit the help centre <ArrowUpRight size={14} />
            </Link>
          </Reveal>

          <Reveal>
            <div className="border-t border-[#E1E6DE]">
              {faqs.map(([question, answer]) => (
                <FAQItem key={question} question={question} answer={answer} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#F7F8F5] px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[26px] bg-[#DDE8D4] px-7 py-16 sm:px-14 sm:py-24 lg:px-20">
            <div className="pointer-events-none absolute -right-20 -top-52 h-[500px] w-[500px] rounded-full border border-[#426544]/10" />
            <div className="pointer-events-none absolute -right-2 -top-36 h-[360px] w-[360px] rounded-full border border-[#426544]/10" />
            <div className="relative z-10 max-w-[760px]">
              <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
              <h2 className="font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#173323] sm:text-6xl lg:text-7xl">
                Give your ambition a place to grow.
              </h2>
              <p className="mt-6 max-w-[530px] text-[13px] leading-8 text-[#637362] sm:text-[15px]">
                Build your presence. Organise your business. Make room for what's next.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink />
                <ButtonLink to="/pricing" secondary>Explore pricing</ButtonLink>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-20 right-12 hidden h-64 w-64 items-center justify-center rounded-full border border-[#557451]/15 lg:flex">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-[#557451]/20">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#173F2D] shadow-2xl">
                  <span className="font-display text-4xl font-bold tracking-[-.08em] text-white">z</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
