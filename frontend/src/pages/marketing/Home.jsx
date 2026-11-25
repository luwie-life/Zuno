
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlay,
  Globe2,
  Layers3,
  Menu,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';

const C = {
  forest: '#0B3D2E',
  green: '#1C6F52',
  mango: '#E9A23B',
  ink: '#12201A',
  paper: '#F6F7F5',
  muted: '#68756D',
  line: '#DCE2DD',
};

const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduce ? 0 : 0.75,
        delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, light = false, mango = false }) {
  return (
    <div
      className={`mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.19em] ${
        light ? 'text-white/55' : mango ? 'text-[#0B3D2E]' : 'text-[#1C6F52]'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </div>
  );
}

function PrimaryLink({ to = '/register', children = 'Get started' }) {
  return (
    <Link
      to={to}
      className="group inline-flex min-h-[52px] items-center gap-3 rounded-full bg-[#E9A23B] px-5 text-[13px] font-bold text-[#12201A] transition hover:-translate-y-0.5 hover:bg-[#F3B653]"
    >
      {children}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#12201A]/10 transition group-hover:translate-x-1">
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

function TextLink({ to, children, light = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 text-[13px] font-semibold transition ${
        light ? 'text-white' : 'text-[#0B3D2E]'
      }`}
    >
      {children}
      <ArrowRight
        size={15}
        className="transition group-hover:translate-x-1"
      />
    </Link>
  );
}

/* A custom storefront scene, not a generic browser mockup. */
function StorefrontScene() {
  const [kind, setKind] = useState('products');
  const isService = kind === 'services';

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-10 rounded-[45%] bg-[#1C6F52]/25 blur-[75px]" />

      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#F6F7F5] shadow-[0_40px_120px_-40px_rgba(0,0,0,.7)]">
        {/* storefront top bar */}
        <div className="flex items-center justify-between border-b border-[#DCE2DD] bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1C6F52]" />
            <span className="text-[10px] font-semibold text-[#12201A]">
              yourbusiness.zuno.com.ng
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#68756D]">
            Live preview
          </span>
        </div>

        <div className="grid sm:grid-cols-[.82fr_1.18fr]">
          <div className="flex flex-col justify-center px-5 py-8 sm:px-7 sm:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={kind}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[8px] font-bold tracking-[.17em] text-[#68756D]">
                  {isService ? 'A LITTLE TIME FOR YOU' : 'THE EVERYDAY EDIT'}
                </p>

                <h3 className="mt-4 font-display text-[clamp(29px,4vw,48px)] leading-[.92] tracking-[-.065em] text-[#12201A]">
                  {isService
                    ? 'Your next favourite appointment.'
                    : 'Good things, made to be yours.'}
                </h3>

                <p className="mt-4 max-w-[190px] text-[10px] leading-5 text-[#68756D]">
                  {isService
                    ? 'Explore the services. Find your time. Make it yours.'
                    : 'A collection of pieces made for everyday living.'}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B3D2E] px-4 py-2.5 text-[9px] font-bold text-white">
                  {isService ? 'Explore services' : 'Explore collection'}
                  <ArrowRight size={11} />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className={`relative flex min-h-[270px] items-center justify-center overflow-hidden ${
              isService ? 'bg-[#D9E8DF]' : 'bg-[#E9A23B]'
            }`}
          >
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full border border-[#12201A]/15" />
            <div className="absolute -bottom-20 -left-12 h-60 w-60 rounded-full border border-[#12201A]/15" />

            {isService ? (
              <motion.div
                key="service-card"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-[78%] rounded-[20px] bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,.25)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[8px] font-bold tracking-[.15em] text-[#68756D]">
                      STUDIO 08
                    </p>
                    <p className="mt-3 font-display text-[30px] leading-[.95] tracking-[-.06em] text-[#12201A]">
                      Your time.
                      <br />
                      Your moment.
                    </p>
                  </div>
                  <CalendarDays size={21} className="text-[#1C6F52]" />
                </div>

                <div className="mt-5 rounded-xl bg-[#EEF5F1] p-3">
                  <div className="flex items-center gap-2 text-[9px] font-semibold text-[#0B3D2E]">
                    <Check size={13} />
                    Booking request received
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="product"
                className="relative flex h-[210px] w-[150px] items-center justify-center rounded-t-[48%] bg-[#0B3D2E] shadow-[0_30px_50px_-20px_rgba(0,0,0,.35)]"
                animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-x-4 top-0 h-8 rounded-b-full bg-[#1C6F52]" />
                <div className="mt-6 text-center">
                  <p className="text-[10px] font-bold tracking-[.24em] text-white">
                    FORME
                  </p>
                  <p className="mt-2 text-[7px] tracking-[.18em] text-white/45">
                    MADE TO LAST
                  </p>
                </div>
              </motion.div>
            )}

            <div className="absolute bottom-5 right-5 rounded-xl bg-white px-3 py-2 shadow-lg">
              <p className="text-[8px] text-[#68756D]">
                {isService ? 'Your calendar' : 'Your collection'}
              </p>
              <p className="mt-1 text-[10px] font-bold text-[#12201A]">
                {isService ? 'Make time for clients' : 'Made for your life'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE2DD] bg-white px-5 py-4">
          <span className="text-[9px] font-semibold text-[#68756D]">
            A little look at what you can create
          </span>

          <div className="flex rounded-full bg-[#F0F2EF] p-1">
            <button
              type="button"
              onClick={() => setKind('products')}
              className={`rounded-full px-3 py-2 text-[9px] font-bold transition ${
                !isService
                  ? 'bg-[#0B3D2E] text-white'
                  : 'text-[#68756D] hover:text-[#12201A]'
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setKind('services')}
              className={`rounded-full px-3 py-2 text-[9px] font-bold transition ${
                isService
                  ? 'bg-[#0B3D2E] text-white'
                  : 'text-[#68756D] hover:text-[#12201A]'
              }`}
            >
              Services
            </button>
          </div>
        </div>
      </div>

      {/* Floating labels are part of the illustration, not extra product claims. */}
      <motion.div
        className="absolute -left-5 top-8 hidden rounded-xl border border-white/10 bg-[#12201A] px-4 py-3 shadow-xl sm:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[8px] font-bold tracking-[.16em] text-[#E9A23B]">
          YOUR BUSINESS
        </p>
        <p className="mt-1.5 text-[11px] font-semibold text-white">
          Your own online home.
        </p>
      </motion.div>
    </div>
  );
}

function ChapterLabel({ number, children, light = false }) {
  return (
    <div
      className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.18em] ${
        light ? 'text-white/45' : 'text-[#68756D]'
      }`}
    >
      <span>{number}</span>
      <span className={`h-px w-8 ${light ? 'bg-white/25' : 'bg-[#0B3D2E]/25'}`} />
      <span>{children}</span>
    </div>
  );
}

function BusinessCanvas() {
  const [active, setActive] = useState('storefront');

  const tabs = [
    { id: 'storefront', label: 'Storefront', icon: Store },
    { id: 'catalogue', label: 'Catalogue', icon: Package },
    { id: 'activity', label: 'Activity', icon: Layers3 },
  ];

  const content = {
    storefront: {
      title: 'A place to be found.',
      description: 'Give customers a clear, considered place to discover your business.',
      rows: ['Your business name', 'Your products or services', 'Your own storefront'],
    },
    catalogue: {
      title: 'A clearer way to offer.',
      description: 'Keep the things you sell or the services you provide organised.',
      rows: ['Product collections', 'Service listings', 'Details customers need'],
    },
    activity: {
      title: 'The work behind the scenes.',
      description: 'Keep important customer activity closer to the business.',
      rows: ['Orders and requests', 'Booking activity', 'Customer information'],
    },
  };

  const current = content[active];

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#17251E] shadow-[0_35px_100px_-45px_rgba(0,0,0,.7)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#E9A23B]" />
          <span className="text-[10px] font-bold text-white">Zuno workspace</span>
        </div>
        <span className="text-[9px] text-white/35">Illustrative preview</span>
      </div>

      <div className="grid sm:grid-cols-[150px_1fr]">
        <div className="border-b border-white/10 p-3 sm:border-b-0 sm:border-r">
          <p className="px-2 pb-3 pt-1 text-[8px] font-bold tracking-[.15em] text-white/30">
            YOUR BUSINESS
          </p>
          <div className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-[10px] font-semibold transition ${
                  active === id
                    ? 'bg-[#E9A23B] text-[#12201A]'
                    : 'text-white/55 hover:bg-white/[.05] hover:text-white'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[290px] p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#E9A23B]">
                {tabs.find(tab => tab.id === active)?.label}
              </p>
              <h3 className="mt-3 font-display text-3xl leading-[.98] tracking-[-.06em] text-white sm:text-4xl">
                {current.title}
              </h3>
              <p className="mt-3 max-w-[360px] text-[11px] leading-6 text-white/50">
                {current.description}
              </p>

              <div className="mt-6 space-y-2">
                {current.rows.map((row, index) => (
                  <div
                    key={row}
                    className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.03] px-3 py-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1C6F52]/30 text-[#A5D5B9]">
                      <Check size={12} />
                    </span>
                    <span className="text-[10px] font-medium text-white/75">
                      {row}
                    </span>
                    <span className="ml-auto font-mono text-[8px] text-white/25">
                      0{index + 1}
                    </span>
                  </div>
                ))}
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
    <div className="border-b border-[#DCE2DD]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between gap-5 py-5 text-left"
      >
        <span className="text-[14px] font-semibold text-[#12201A]">
          {question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            open
              ? 'rotate-180 bg-[#0B3D2E] text-white'
              : 'bg-[#E9EDE8] text-[#0B3D2E]'
          }`}
        >
          <ChevronDown size={15} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 text-[13px] leading-7 text-[#68756D]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <main className="overflow-hidden bg-[#F6F7F5] text-[#12201A]">
      {/* HERO: bold, dark, and visual-first */}
      <section className="relative overflow-hidden bg-[#0B3D2E] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full border border-white/[.07]" />
          <div className="absolute -right-16 top-16 h-[500px] w-[500px] rounded-full border border-white/[.07]" />
          <div className="absolute right-[18%] top-[25%] h-[330px] w-[330px] rounded-full bg-[#1C6F52]/30 blur-[100px]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B3D2E] to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:min-h-[760px] lg:grid-cols-[.9fr_1.1fr] lg:gap-10 lg:px-12">
          <Reveal>
            <Eyebrow light>Make your next move</Eyebrow>

            <h1 className="max-w-[680px] font-display text-[clamp(3.4rem,7vw,7.4rem)] font-medium leading-[.86] tracking-[-.085em]">
              Your business
              <br />
              has <span className="text-[#E9A23B]">more</span>
              <br />
              in it.
            </h1>

            <p className="mt-8 max-w-[460px] text-[14px] leading-8 text-white/65 sm:text-[16px]">
              Give it a place to show up, a better way to present what you do,
              and tools to keep the work moving.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PrimaryLink>Build with Zuno</PrimaryLink>
              <TextLink to="/pricing" light>
                See what’s possible
              </TextLink>
            </div>

            <a
              href="#the-next-step"
              className="mt-12 inline-flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.15em] text-white/35 transition hover:text-white/80"
            >
              Keep scrolling
              <ArrowDown size={13} />
            </a>
          </Reveal>

          <Reveal delay={0.12}>
            <StorefrontScene />
          </Reveal>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
            <span className="text-[9px] font-bold tracking-[.18em] text-white/35">
              MADE FOR THE WAY YOU WORK
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[9px] font-bold tracking-[.12em] text-white/55">
              <span>PRODUCTS</span>
              <span>SERVICES</span>
              <span>INDEPENDENT BRANDS</span>
              <span>CREATIVE BUSINESSES</span>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 01 */}
      <section
        id="the-next-step"
        className="scroll-mt-24 bg-[#F6F7F5] py-24 sm:py-32"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <Reveal>
              <ChapterLabel number="01">Be seen</ChapterLabel>
              <h2 className="mt-7 max-w-[680px] font-display text-5xl leading-[.9] tracking-[-.08em] sm:text-7xl lg:text-[6.4rem]">
                First, give
                <br />
                them a reason
                <br />
                <span className="text-[#1C6F52]">to find you.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="max-w-[480px] text-[15px] leading-8 text-[#68756D]">
                Your business deserves more than a post that disappears into a
                feed. Give people a place to discover what you do, explore your
                offer and come back when they’re ready.
              </p>
              <div className="mt-7">
                <TextLink to="/pricing">Make your business visible</TextLink>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <div className="relative overflow-hidden rounded-[24px] bg-[#E9A23B] p-5 sm:p-10 lg:p-14">
              <div className="absolute -right-24 -top-32 h-[500px] w-[500px] rounded-full border border-[#12201A]/15" />
              <div className="absolute -right-4 top-10 h-[330px] w-[330px] rounded-full border border-[#12201A]/15" />

              <div className="relative grid items-center gap-10 lg:grid-cols-[.7fr_1.3fr]">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#12201A]/55">
                    Your online home
                  </p>
                  <h3 className="mt-5 max-w-[360px] font-display text-4xl leading-[.95] tracking-[-.07em] sm:text-5xl">
                    Your name.
                    <br />
                    Your style.
                    <br />
                    Your space.
                  </h3>
                  <p className="mt-5 max-w-[300px] text-[12px] leading-7 text-[#12201A]/70">
                    Create a storefront that feels like your business—not
                    somebody else’s template.
                  </p>
                </div>

                <div className="relative mx-auto w-full max-w-[650px]">
                  <div className="rotate-[1deg] overflow-hidden rounded-[18px] bg-[#F6F7F5] shadow-[0_30px_70px_-35px_rgba(18,32,26,.5)] transition-transform duration-500 hover:rotate-0">
                    <div className="flex items-center justify-between border-b border-[#DCE2DD] bg-white px-4 py-3">
                      <span className="text-[9px] font-bold text-[#12201A]">
                        FORME / STORE
                      </span>
                      <span className="text-[8px] text-[#68756D]">
                        yourbusiness.zuno.com.ng
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-[1fr_1fr]">
                      <div className="flex flex-col justify-center p-5 sm:p-8">
                        <p className="text-[8px] font-bold tracking-[.16em] text-[#68756D]">
                          THE NEW COLLECTION
                        </p>
                        <p className="mt-4 font-display text-4xl leading-[.92] tracking-[-.06em] text-[#12201A]">
                          Everyday
                          <br />
                          made
                          <br />
                          better.
                        </p>
                        <span className="mt-5 inline-flex w-fit rounded-full bg-[#0B3D2E] px-4 py-2 text-[8px] font-bold text-white">
                          Discover
                        </span>
                      </div>
                      <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden bg-[#1C6F52]">
                        <div className="absolute h-52 w-52 rounded-full border border-white/20" />
                        <div className="relative flex h-[150px] w-[110px] items-center justify-center rounded-t-[45%] bg-[#E9A23B] shadow-2xl">
                          <span className="text-[9px] font-bold tracking-[.2em] text-[#12201A]">
                            FORME
                          </span>
                        </div>
                        <span className="absolute bottom-4 right-4 rounded-lg bg-white px-3 py-2 text-[8px] font-bold text-[#12201A]">
                          New arrivals
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.div
                    className="absolute -bottom-5 -left-3 hidden rounded-xl bg-[#0B3D2E] px-4 py-3 text-white shadow-xl sm:block"
                    animate={reduce ? {} : { y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <p className="text-[8px] font-bold tracking-[.15em] text-[#E9A23B]">
                      YOUR BUSINESS
                    </p>
                    <p className="mt-1 text-[10px] font-semibold">
                      Looking like you.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CHAPTER 02: dark product story */}
      <section className="relative bg-[#12201A] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#1C6F52]/15 blur-[100px]" />

        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-12">
          <Reveal>
            <ChapterLabel number="02" light>Keep it together</ChapterLabel>
            <h2 className="mt-7 max-w-[570px] font-display text-5xl leading-[.9] tracking-[-.08em] sm:text-7xl">
              The front
              <br />
              of your business.
              <br />
              <span className="text-[#E9A23B]">And the rest.</span>
            </h2>
            <p className="mt-7 max-w-[430px] text-[14px] leading-8 text-white/55">
              There’s the part customers see—and the work that happens every
              day. Zuno brings important parts of your business closer together.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <BusinessCanvas />
          </Reveal>
        </div>
      </section>

      {/* CHAPTER 03: products and services */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal>
            <ChapterLabel number="03">Your kind of business</ChapterLabel>
            <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_.65fr] lg:items-end">
              <h2 className="max-w-[850px] font-display text-5xl leading-[.9] tracking-[-.08em] sm:text-7xl lg:text-[6.5rem]">
                Different work.
                <br />
                <span className="text-[#1C6F52]">Same ambition.</span>
              </h2>
              <p className="max-w-[390px] text-[13px] leading-7 text-[#68756D]">
                Whether you sell something people can hold or offer a service
                people need, Zuno gives your business room to show up.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Reveal>
              <article className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[20px] bg-[#F6F7F5] p-7 transition duration-300 hover:-translate-y-1 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-[.16em] text-[#68756D]">
                    PRODUCT BUSINESSES
                  </span>
                  <Package size={18} className="text-[#0B3D2E]" />
                </div>
                <h3 className="mt-12 font-display text-3xl leading-[.98] tracking-[-.06em]">
                  Make your
                  <br />
                  products the
                  <br />
                  main event.
                </h3>
                <p className="mt-4 text-[12px] leading-6 text-[#68756D]">
                  Present your products, collections and the details that help
                  people choose.
                </p>
                <div className="absolute -bottom-8 -right-3 flex h-32 w-32 items-center justify-center rounded-t-[50%] bg-[#E9A23B] transition duration-500 group-hover:rotate-6">
                  <span className="text-[8px] font-bold tracking-[.16em] text-[#12201A]">
                    YOUR COLLECTION
                  </span>
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.08}>
              <article className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[20px] bg-[#0B3D2E] p-7 text-white transition duration-300 hover:-translate-y-1 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-[.16em] text-white/45">
                    SERVICE BUSINESSES
                  </span>
                  <CalendarDays size={18} className="text-[#E9A23B]" />
                </div>
                <h3 className="mt-12 font-display text-3xl leading-[.98] tracking-[-.06em]">
                  Let people
                  <br />
                  find the
                  <br />
                  right time.
                </h3>
                <p className="mt-4 max-w-[260px] text-[12px] leading-6 text-white/55">
                  Show your services and make it easier for customers to send
                  booking requests.
                </p>
                <div className="absolute -bottom-8 -right-3 flex h-32 w-32 items-center justify-center rounded-t-[50%] bg-[#1C6F52] transition duration-500 group-hover:-rotate-6">
                  <span className="text-[8px] font-bold tracking-[.16em] text-white">
                    YOUR SERVICES
                  </span>
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.16}>
              <article className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[20px] bg-[#E9A23B] p-7 transition duration-300 hover:-translate-y-1 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-[.16em] text-[#12201A]/55">
                    INDEPENDENT BUSINESSES
                  </span>
                  <Layers3 size={18} className="text-[#0B3D2E]" />
                </div>
                <h3 className="mt-12 font-display text-3xl leading-[.98] tracking-[-.06em]">
                  Your business
                  <br />
                  doesn’t fit
                  <br />
                  one box.
                </h3>
                <p className="mt-4 max-w-[260px] text-[12px] leading-6 text-[#12201A]/70">
                  Bring different parts of what you offer into one business
                  presence.
                </p>
                <div className="absolute -bottom-8 -right-3 flex h-32 w-32 items-center justify-center rounded-t-[50%] bg-[#12201A] transition duration-500 group-hover:rotate-6">
                  <span className="text-[8px] font-bold tracking-[.16em] text-white">
                    YOUR WAY
                  </span>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CHAPTER 04: momentum */}
      <section className="relative overflow-hidden bg-[#1C6F52] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute -left-28 -top-32 h-[500px] w-[500px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-8 -top-12 h-[350px] w-[350px] rounded-full border border-white/10" />

        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-center lg:px-12">
          <Reveal>
            <ChapterLabel number="04" light />
            <h2 className="mt-7 max-w-[700px] font-display text-5xl leading-[.9] tracking-[-.08em] sm:text-7xl lg:text-[6.5rem]">
              Make the next
              <br />
              step feel
              <br />
              <span className="text-[#E9A23B]">like a step up.</span>
            </h2>
            <p className="mt-7 max-w-[450px] text-[14px] leading-8 text-white/65">
              Start with what you need today. Build a stronger business presence
              as your plans—and your business—get bigger.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mx-auto flex min-h-[370px] w-full max-w-[480px] items-center justify-center">
              <svg
                viewBox="0 0 440 360"
                className="absolute inset-0 h-full w-full"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M40 300 C90 300 80 230 145 230 S200 160 260 160 S330 100 395 55"
                  stroke="rgba(255,255,255,.45)"
                  strokeWidth="2"
                  strokeDasharray="5 8"
                />
                <circle cx="145" cy="230" r="8" fill="#E9A23B" />
                <circle cx="260" cy="160" r="8" fill="#E9A23B" />
                <circle cx="395" cy="55" r="8" fill="#E9A23B" />
              </svg>

              <motion.div
                className="absolute left-[5%] top-[60%] flex h-16 w-16 items-center justify-center rounded-2xl bg-[#12201A] text-white shadow-xl"
                animate={reduce ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Store size={23} />
              </motion.div>

              <motion.div
                className="absolute left-[33%] top-[38%] flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#E9A23B] text-[#12201A] shadow-xl"
                animate={reduce ? {} : { rotate: [0, 4, 0], y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Package size={27} />
              </motion.div>

              <motion.div
                className="absolute right-[5%] top-[10%] flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#F6F7F5] text-[#0B3D2E] shadow-xl"
                animate={reduce ? {} : { y: [0, -9, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Globe2 size={30} />
              </motion.div>

              <div className="absolute bottom-[3%] right-[18%] rounded-full border border-white/20 bg-white/[.08] px-4 py-2 text-[9px] font-bold tracking-[.12em] text-white/75">
                KEEP MOVING
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#F6F7F5] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[26px] bg-[#0B3D2E] px-7 py-16 text-white sm:px-14 sm:py-24 lg:px-20">
            <div className="pointer-events-none absolute -right-28 -top-40 h-[560px] w-[560px] rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-3 -top-20 h-[350px] w-[350px] rounded-full border border-white/10" />

            <div className="relative max-w-[800px]">
              <Eyebrow light>Every big thing starts somewhere</Eyebrow>
              <h2 className="font-display text-5xl leading-[.9] tracking-[-.08em] sm:text-7xl lg:text-[6.5rem]">
                Let’s see what
                <br />
                your business
                <br />
                <span className="text-[#E9A23B]">can become.</span>
              </h2>
              <p className="mt-7 max-w-[500px] text-[14px] leading-8 text-white/60">
                Give your business a place to show up—and a better way to move
                forward.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <PrimaryLink>Start with Zuno</PrimaryLink>
                <TextLink to="/pricing" light>
                  Explore plans
                </TextLink>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-8 right-10 hidden text-[#E9A23B] lg:block">
              <Sparkles size={86} strokeWidth={1.2} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:px-12">
          <Reveal>
            <Eyebrow>Before you begin</Eyebrow>
            <h2 className="font-display text-4xl leading-[.95] tracking-[-.07em] sm:text-5xl">
              A few things
              <br />
              worth knowing.
            </h2>
            <TextLink to="/support">
              Visit help centre
            </TextLink>
          </Reveal>

          <Reveal>
            <div className="border-t border-[#DCE2DD]">
              {[
                [
                  'What is Zuno?',
                  'Zuno is a business platform that helps businesses establish an online presence and organise important parts of their operations.',
                ],
                [
                  'Who is Zuno for?',
                  'Zuno is designed for product businesses, service businesses and businesses that offer both.',
                ],
                [
                  'Can I create a storefront?',
                  'Zuno provides storefront tools to present your business and showcase the products or services you offer.',
                ],
                [
                  'Can I manage service bookings?',
                  'Zuno includes service and booking capabilities for appointment-based businesses.',
                ],
                [
                  'Do I need technical skills?',
                  'Zuno is designed to help you set up and manage your business without building everything from scratch.',
                ],
              ].map(([question, answer]) => (
                <FAQItem
                  key={question}
                  question={question}
                  answer={answer}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
