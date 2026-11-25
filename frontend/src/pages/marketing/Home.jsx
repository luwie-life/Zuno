
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Globe2,
  Heart,
  Layers3,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';

const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
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

function Eyebrow({ children, light = false }) {
  return (
    <div
      className={`mb-5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[.18em] ${
        light ? 'text-[#C9E2B6]' : 'text-[#557A57]'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </div>
  );
}

function CTA({ to = '/register', children = 'Start with Zuno', secondary = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full px-6 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
        secondary
          ? 'border border-[#DCE3D8] bg-white text-[#253D2C] hover:border-[#174D35]'
          : 'bg-[#174D35] text-white shadow-[0_12px_30px_-15px_rgba(23,77,53,.55)] hover:bg-[#246343]'
      }`}
    >
      {children}
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${
          secondary ? 'bg-[#EEF2EC]' : 'bg-white/15'
        }`}
      >
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

function BrowserBar({ children = 'yourbusiness.zuno.com.ng' }) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-[#E9EDE6] bg-[#FAFBF8] px-4">
      <span className="h-2 w-2 rounded-full bg-[#E6B1A7]" />
      <span className="h-2 w-2 rounded-full bg-[#E8D49D]" />
      <span className="h-2 w-2 rounded-full bg-[#A8C7A5]" />
      <div className="mx-auto flex h-6 max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-md border border-[#EEF0EB] bg-white text-[9px] text-[#879287]">
        <Globe2 size={10} />
        {children}
      </div>
    </div>
  );
}

function ProductArtwork() {
  return (
    <div className="relative flex h-full min-h-[245px] items-center justify-center overflow-hidden bg-[#DCD8CB]">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#C8C3B4]" />
      <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-white/30" />
      <div className="absolute bottom-8 left-8 right-8 h-3 rounded-full bg-[#B6B1A2]/50 blur-md" />

      <motion.div
        className="relative flex h-[170px] w-[130px] items-center justify-center rounded-t-[48%] bg-[#A7A28F] shadow-[0_30px_45px_-20px_rgba(0,0,0,.3)]"
        animate={{ y: [0, -5, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-x-4 top-0 h-7 rounded-b-full bg-[#858573]" />
        <span className="mt-6 text-[9px] font-bold tracking-[.22em] text-white/80">
          FORME
        </span>
      </motion.div>

      <div className="absolute bottom-7 right-7 rounded-xl border border-white/70 bg-white/75 px-3 py-2.5 shadow-lg backdrop-blur">
        <p className="text-[8px] text-[#899085]">A new collection</p>
        <p className="mt-1 text-[10px] font-semibold text-[#354235]">
          Made to be yours
        </p>
      </div>
    </div>
  );
}

function ServiceArtwork() {
  return (
    <div className="relative flex min-h-[245px] items-center justify-center overflow-hidden bg-[#E7E9DF] p-6">
      <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-[#BFC9B8]" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full border border-[#BFC9B8]" />

      <div className="relative w-full max-w-[270px] rounded-2xl bg-[#FCFCF8] p-5 shadow-[0_25px_55px_-30px_rgba(0,0,0,.25)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold tracking-[.16em] text-[#8B9587]">
              STUDIO NO. 08
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-[-.05em] text-[#29382B]">
              Your time,
              <br />
              your moment.
            </h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8EDE3] text-[#547653]">
            <CalendarDays size={17} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F1F3EC] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#577653]">
            <Check size={14} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#3D4B3D]">
              Service appointment
            </p>
            <p className="mt-0.5 text-[8px] text-[#8D9689]">
              Booking request received
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorefrontScene() {
  const [business, setBusiness] = useState('products');

  return (
    <div className="relative mx-auto w-full max-w-[630px]">
      <div className="absolute -inset-10 rounded-full bg-[#DDE8D8] blur-[70px]" />

      <div className="relative overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_35px_90px_-45px_rgba(16,42,24,.35)]">
        <BrowserBar />

        <div className="flex items-center justify-between border-b border-[#F0F2ED] px-5 py-4 sm:px-7">
          <span className="font-display text-[13px] font-bold tracking-[-.04em] text-[#29382B]">
            FORME STUDIO
          </span>
          <div className="hidden items-center gap-5 text-[9px] text-[#778176] sm:flex">
            <span>DISCOVER</span>
            <span>ABOUT</span>
            <span>CONTACT</span>
          </div>
          <ShoppingBag size={15} className="text-[#526451]" />
        </div>

        <div className="grid sm:grid-cols-[.92fr_1.08fr]">
          <div className="flex flex-col justify-center bg-[#F7F6F0] px-5 py-7 sm:px-7 sm:py-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={business}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[8px] font-bold tracking-[.17em] text-[#899184]">
                  {business === 'products' ? 'THE EVERYDAY EDIT' : 'A LITTLE TIME FOR YOU'}
                </p>
                <h3 className="mt-4 font-display text-[clamp(26px,4vw,43px)] leading-[.98] tracking-[-.06em] text-[#29382B]">
                  {business === 'products'
                    ? 'Thoughtful things. Beautifully yours.'
                    : 'Your next favourite appointment.'}
                </h3>
                <p className="mt-4 max-w-[210px] text-[9px] leading-5 text-[#7B8377]">
                  {business === 'products'
                    ? 'A considered collection for the way you live.'
                    : 'Discover the service, meet the people and make time for yourself.'}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#293F2E] px-4 py-2.5 text-[9px] font-semibold text-white">
                  {business === 'products' ? 'Explore collection' : 'Explore services'}
                  <ArrowUpRight size={11} />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-h-[245px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={business}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {business === 'products' ? <ProductArtwork /> : <ServiceArtwork />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F2ED] px-5 py-4 sm:px-7">
          <p className="text-[9px] font-semibold text-[#687568]">
            Preview your business
          </p>
          <div className="flex rounded-full bg-[#F0F3ED] p-1">
            <button
              type="button"
              onClick={() => setBusiness('products')}
              className={`rounded-full px-3 py-2 text-[9px] font-semibold transition ${
                business === 'products'
                  ? 'bg-[#174D35] text-white'
                  : 'text-[#667466] hover:text-[#174D35]'
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setBusiness('services')}
              className={`rounded-full px-3 py-2 text-[9px] font-semibold transition ${
                business === 'services'
                  ? 'bg-[#174D35] text-white'
                  : 'text-[#667466] hover:text-[#174D35]'
              }`}
            >
              Services
            </button>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute -bottom-7 -left-3 hidden rounded-2xl border border-white bg-white p-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,.3)] sm:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1E8] text-[#4D754F]">
            <Store size={15} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#344236]">
              Your business, online
            </p>
            <p className="mt-1 text-[8px] text-[#929A90]">
              A place that feels like yours
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const chapters = [
  {
    number: '01',
    title: 'Be more than a page in someone’s feed.',
    body: 'Give your business a home of its own. A place customers can visit, explore and remember.',
    label: 'Your online presence',
    icon: Globe2,
    points: ['Your business identity', 'Products and services', 'A dedicated storefront'],
  },
  {
    number: '02',
    title: 'Make what you offer easy to find.',
    body: 'Bring your products or services into focus. Let customers understand what you do without having to piece it all together.',
    label: 'Your catalogue',
    icon: Package,
    points: ['Organised product listings', 'Service presentations', 'A clearer customer experience'],
  },
  {
    number: '03',
    title: 'Keep the work moving.',
    body: 'Orders, booking requests and customer details are part of the business too. Keep important activity close at hand.',
    label: 'Your workspace',
    icon: Layers3,
    points: ['Customer orders', 'Booking requests', 'Customer information'],
  },
];

function ChapterScene({ chapter }) {
  const Icon = chapter.icon;

  return (
    <div className="relative mx-auto w-full max-w-[470px]">
      <div className="absolute -inset-8 rounded-full bg-[#DDE7D8] blur-[65px]" />
      <div className="relative overflow-hidden rounded-[22px] border border-white bg-white p-5 shadow-[0_30px_70px_-45px_rgba(16,42,24,.35)] sm:p-7">
        <div className="flex items-center justify-between border-b border-[#EDF0EB] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1E8] text-[#47734B]">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#344236]">Business workspace</p>
              <p className="mt-1 text-[8px] text-[#9AA196]">A clearer way to work</p>
            </div>
          </div>
          <span className="font-mono text-[9px] text-[#9AA196]">{chapter.number}</span>
        </div>

        <div className="mt-6">
          <p className="text-[8px] font-bold uppercase tracking-[.17em] text-[#8B9587]">
            {chapter.label}
          </p>
          <h3 className="mt-2 font-display text-2xl leading-tight tracking-[-.05em] text-[#29382B]">
            {chapter.title}
          </h3>
        </div>

        <div className="mt-6 space-y-2.5">
          {chapter.points.map((point, index) => (
            <motion.div
              key={point}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="flex items-center gap-3 rounded-xl border border-[#EEF1EB] p-3.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F3ED] text-[#53734E]">
                {index === 0 ? <Check size={14} /> : index === 1 ? <Layers3 size={14} /> : <ArrowUpRight size={14} />}
              </span>
              <span className="flex-1 text-[10px] font-medium text-[#4A554B]">
                {point}
              </span>
              <Check size={13} className="text-[#71916D]" />
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-[#173F2D] px-4 py-3.5">
          <p className="text-[9px] font-medium text-white/80">
            The next chapter is yours to build.
          </p>
        </div>
      </div>
    </div>
  );
}

function FAQ({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E3E8E0]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 py-5 text-left sm:py-6"
      >
        <span className="text-[13px] font-semibold text-[#2D3D30] sm:text-[15px]">
          {question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            open
              ? 'rotate-180 bg-[#174D35] text-white'
              : 'bg-[#EEF2EC] text-[#637164]'
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
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pr-10 text-[13px] leading-7 text-[#778277]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [activeChapter, setActiveChapter] = useState(0);

  return (
    <div className="overflow-hidden bg-[#FCFCFA] text-[#1C3023]">
      {/* HERO — the business taking shape */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-[18%] -top-[15%] h-[650px] w-[650px] rounded-full bg-[#E7EFE2]" />
          <div className="absolute right-[22%] top-[30%] h-[320px] w-[320px] rounded-full bg-[#F1EFE6] blur-[75px]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FCFCFA] to-transparent" />
        </div>

        <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:min-h-[720px] lg:grid-cols-[.9fr_1.1fr] lg:gap-10 lg:px-12 lg:pb-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="relative z-10"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
              }}
            >
              <Eyebrow>For the business you're becoming</Eyebrow>
            </motion.div>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
              }}
              className="max-w-[700px] font-display text-[clamp(3.4rem,6.4vw,6.6rem)] font-medium leading-[.91] tracking-[-.078em] text-[#172B1E]"
            >
              Your business has
              <span className="mt-2 block text-[#4F7951]">somewhere to go.</span>
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
              }}
              className="mt-8 max-w-[490px] text-[15px] leading-8 text-[#6F7B70] sm:text-[17px]"
            >
              Give it a place online. Bring what you offer into focus. Keep
              the everyday work moving. Build your next chapter with Zuno.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
              }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <CTA>Build with Zuno</CTA>
              <a
                href="#the-story"
                className="group inline-flex min-h-[52px] items-center gap-3 rounded-full px-4 text-[12px] font-semibold text-[#526354] transition hover:text-[#174D35]"
              >
                Take a look around
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D9E2D7] transition group-hover:translate-y-1 group-hover:border-[#174D35]">
                  <ArrowDown size={14} />
                </span>
              </a>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.7, ease } },
              }}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#DDE5DA] pt-6 text-[10px] font-medium text-[#748074]"
            >
              <span className="flex items-center gap-2">
                <Check size={13} className="text-[#4F7951]" />
                Products and services
              </span>
              <span className="flex items-center gap-2">
                <Check size={13} className="text-[#4F7951]" />
                Built around your business
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease }}
            className="relative mx-auto w-full max-w-[650px]"
          >
            <div className="mb-4 flex items-center justify-between px-1 sm:px-2">
              <div>
                <p className="text-[9px] font-bold tracking-[.17em] text-[#667364]">
                  A BUSINESS, BROUGHT TO LIFE
                </p>
                <p className="mt-1 text-[10px] text-[#969D92]">
                  Explore a customer-facing experience
                </p>
              </div>
              <span className="rounded-full border border-[#DCE4D8] bg-white/80 px-3 py-1.5 text-[8px] font-semibold text-[#557052]">
                INTERACTIVE PREVIEW
              </span>
            </div>
            <StorefrontScene />
          </motion.div>
        </div>

        <div className="border-y border-[#E9EDE6] bg-white/70">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-12">
            <p className="text-[9px] font-bold tracking-[.18em] text-[#929B90]">
              BUILT FOR YOUR KIND OF BUSINESS
            </p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-semibold tracking-[.08em] text-[#69766A]">
              <span>RETAIL</span>
              <span>FASHION</span>
              <span>BEAUTY</span>
              <span>FREELANCERS</span>
              <span>INDEPENDENT BRANDS</span>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLL STORY */}
      <section id="the-story" className="scroll-mt-24 bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-[780px]">
            <Eyebrow>Every business has a next chapter</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#1C3023] sm:text-6xl lg:text-7xl">
              It starts with
              <span className="text-[#5B805B]"> showing up.</span>
            </h2>
            <p className="mt-6 max-w-[580px] text-[14px] leading-8 text-[#7A857A] sm:text-[16px]">
              And it keeps going with the work you do every day. Zuno helps
              you bring the important parts of your business closer together.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
            <div className="space-y-5">
              {chapters.map((chapter, index) => {
                const Icon = chapter.icon;
                const selected = activeChapter === index;

                return (
                  <button
                    key={chapter.number}
                    type="button"
                    onClick={() => setActiveChapter(index)}
                    className={`group w-full rounded-[20px] border p-6 text-left transition-all duration-300 sm:p-7 ${
                      selected
                        ? 'border-[#DCE7D8] bg-[#F5F7F2] shadow-[0_20px_55px_-40px_rgba(20,50,30,.3)]'
                        : 'border-transparent bg-white hover:border-[#E8ECE6] hover:bg-[#FAFBF8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                            selected
                              ? 'bg-[#174D35] text-white'
                              : 'bg-[#F0F3ED] text-[#587658]'
                          }`}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="font-mono text-[10px] text-[#9BA598]">
                          CHAPTER {chapter.number}
                        </span>
                      </div>
                      <ArrowRight
                        size={15}
                        className={`transition-all ${
                          selected
                            ? 'translate-x-0 text-[#4D754F]'
                            : '-translate-x-1 text-[#AAB2A7] group-hover:translate-x-0'
                        }`}
                      />
                    </div>

                    <h3 className="mt-5 max-w-[450px] font-display text-[25px] leading-[1.08] tracking-[-.045em] text-[#29382B] sm:text-[29px]">
                      {chapter.title}
                    </h3>
                    <p className="mt-3 max-w-[450px] text-[12px] leading-7 text-[#788176] sm:text-[13px]">
                      {chapter.body}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChapter}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChapterScene chapter={chapters[activeChapter]} />
                </motion.div>
              </AnimatePresence>
              <p className="mt-5 text-center text-[9px] font-medium tracking-wide text-[#9AA196]">
                ILLUSTRATIVE WORKSPACE PREVIEW
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS TYPES */}
      <section className="bg-[#F2F5EF] py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Reveal className="grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <Eyebrow>Different paths. Same ambition.</Eyebrow>
              <h2 className="max-w-[720px] font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#1C3023] sm:text-6xl">
                Your business doesn't have to fit a template.
              </h2>
            </div>
            <p className="max-w-[430px] text-[13px] leading-8 text-[#7A857A] lg:justify-self-end">
              Whether you make things, offer a service or bring both together,
              build an online presence that reflects the way you work.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {[
              {
                no: '01',
                title: 'You make or sell things.',
                description: 'Give your products a home. Present your catalogue and keep orders organised.',
                tag: 'PRODUCT BUSINESSES',
                icon: Package,
                tone: 'bg-[#E7E2D6]',
                accent: '#817C68',
              },
              {
                no: '02',
                title: 'You offer a service.',
                description: 'Show people what you do, introduce your services and manage booking requests.',
                tag: 'SERVICE BUSINESSES',
                icon: CalendarDays,
                tone: 'bg-[#E1E9DF]',
                accent: '#58785C',
              },
              {
                no: '03',
                title: 'You do a bit of both.',
                description: 'Bring your products and services into one business experience.',
                tag: 'HYBRID BUSINESSES',
                icon: Layers3,
                tone: 'bg-[#EAE1DA]',
                accent: '#99745E',
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <Reveal key={item.no} delay={index * 0.08}>
                  <article className="group h-full overflow-hidden rounded-[22px] border border-[#E3E9E0] bg-[#FCFCFA] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_65px_-45px_rgba(15,40,22,.35)]">
                    <div className={`relative flex h-[190px] items-center justify-center overflow-hidden ${item.tone}`}>
                      <div className="absolute h-48 w-48 rounded-full border border-black/[.07]" />
                      <div className="absolute h-36 w-36 rounded-full border border-black/[.07]" />
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 5 }}
                        className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[23px] bg-white shadow-[0_20px_45px_-20px_rgba(0,0,0,.22)]"
                      >
                        <Icon size={29} strokeWidth={1.5} style={{ color: item.accent }} />
                      </motion.div>
                      <span className="absolute left-5 top-5 font-mono text-[10px] text-black/35">
                        {item.no}
                      </span>
                      <span className="absolute bottom-5 right-5 text-[8px] font-bold tracking-[.16em] text-black/35">
                        ZUNO / BUSINESS
                      </span>
                    </div>

                    <div className="p-7 sm:p-8">
                      <p className="text-[9px] font-bold tracking-[.16em] text-[#6A866B]">
                        {item.tag}
                      </p>
                      <h3 className="mt-3 font-display text-[27px] leading-tight tracking-[-.045em] text-[#26372A]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-[13px] leading-7 text-[#7A857A]">
                        {item.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* THE ZUNO DIFFERENCE */}
      <section className="relative overflow-hidden bg-[#153C2C] py-24 text-white sm:py-32">
        <div className="pointer-events-none absolute -right-40 -top-52 h-[650px] w-[650px] rounded-full border border-white/[.08]" />
        <div className="pointer-events-none absolute -right-10 -top-24 h-[400px] w-[400px] rounded-full border border-white/[.08]" />

        <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
          <Reveal>
            <Eyebrow light>More than the first impression</Eyebrow>
            <h2 className="max-w-[560px] font-display text-4xl leading-[1.02] tracking-[-.065em] sm:text-6xl">
              Your business doesn't end at the storefront.
            </h2>
            <p className="mt-6 max-w-[460px] text-[13px] leading-8 text-white/60 sm:text-[15px]">
              Customers discover you. They explore what you offer. Orders
              and booking requests arrive. You manage the work that follows.
              Zuno brings those important moments closer together.
            </p>
            <Link
              to="/pricing"
              className="mt-8 inline-flex items-center gap-3 text-[12px] font-semibold text-[#D9EDB9] transition hover:gap-4"
            >
              Explore Zuno plans <ArrowRight size={15} />
            </Link>
          </Reveal>

          <Reveal>
            <div className="relative mx-auto grid w-full max-w-[600px] grid-cols-2 gap-3">
              {[
                [Globe2, 'Be discovered', 'Your online presence'],
                [Package, 'Show your offer', 'Products and services'],
                [ShoppingBag, 'Welcome customers', 'Orders and bookings'],
                [Users, 'Know your customers', 'Customer information'],
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
                  <span className="mt-6 block font-mono text-[9px] text-white/25">
                    0{index + 1} / ZUNO
                  </span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* STARTING POINT */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <Reveal>
            <Eyebrow>A good place to begin</Eyebrow>
            <h2 className="max-w-[470px] font-display text-4xl leading-[1.02] tracking-[-.06em] text-[#1C3023] sm:text-6xl">
              Start where you are. Build from there.
            </h2>
            <p className="mt-6 max-w-[400px] text-[13px] leading-8 text-[#7A857A]">
              You don't need every answer today. Start by bringing your
              business online and build a stronger way of working as you grow.
            </p>
            <div className="mt-8">
              <CTA />
            </div>
          </Reveal>

          <div>
            {[
              ['01', 'Set up your business', 'Bring your business details together in one workspace.', Store],
              ['02', 'Create your online presence', 'Show customers your business, products and services.', Globe2],
              ['03', 'Manage what happens next', 'Keep orders, bookings and customer activity organised.', Layers3],
            ].map(([number, title, body, Icon], index) => (
              <Reveal key={number} delay={index * 0.07}>
                <div className="group flex gap-5 border-t border-[#E7EBE4] py-7 sm:gap-8 sm:py-9">
                  <span className="pt-1 font-mono text-[11px] text-[#9BA598]">
                    {number}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-[22px] tracking-[-.04em] text-[#29382C] sm:text-[25px]">
                        {title}
                      </h3>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F3ED] text-[#4B704C] transition group-hover:bg-[#173F2D] group-hover:text-white">
                        <Icon size={17} />
                      </span>
                    </div>
                    <p className="mt-3 max-w-[430px] text-[13px] leading-7 text-[#788176]">
                      {body}
                    </p>
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
            <Eyebrow>Questions, answered</Eyebrow>
            <h2 className="max-w-[430px] font-display text-4xl leading-[1.03] tracking-[-.06em] text-[#1C3023] sm:text-5xl">
              Know what you're building with.
            </h2>
            <p className="mt-5 max-w-[360px] text-[13px] leading-7 text-[#788176]">
              A few useful details about getting started with Zuno.
            </p>
            <Link
              to="/support"
              className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-[#3E6744] transition hover:gap-3"
            >
              Visit the help centre <ArrowUpRight size={14} />
            </Link>
          </Reveal>

          <Reveal>
            <div className="border-t border-[#E1E6DE]">
              {[
                [
                  'What is Zuno?',
                  'Zuno is a business platform that helps businesses establish an online presence and organise important parts of their operations, including products, orders, inventory, customers and service bookings.',
                ],
                [
                  'Who is Zuno for?',
                  'Zuno is designed for product businesses, service businesses and businesses that do both. This includes retailers, fashion brands, salons, barbers, freelancers, studios and other independent businesses.',
                ],
                [
                  'Can I create a storefront?',
                  'Yes. Zuno provides storefront tools to present your business and showcase the products or services you offer to customers.',
                ],
                [
                  'Can I manage bookings?',
                  'Zuno includes service and booking capabilities for appointment-based businesses. You can present services and manage booking requests from your business workspace.',
                ],
                [
                  'Do I need technical skills?',
                  'Zuno is designed to help you set up and manage your business without having to build everything from scratch.',
                ],
              ].map(([question, answer]) => (
                <FAQ key={question} question={question} answer={answer} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL MOMENT */}
      <section className="bg-[#F7F8F5] px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[26px] bg-[#DDE8D4] px-7 py-16 sm:px-14 sm:py-24 lg:px-20">
            <div className="pointer-events-none absolute -right-20 -top-52 h-[500px] w-[500px] rounded-full border border-[#426544]/10" />
            <div className="pointer-events-none absolute -right-2 -top-36 h-[360px] w-[360px] rounded-full border border-[#426544]/10" />

            <div className="relative z-10 max-w-[760px]">
              <Eyebrow>Your next chapter starts here</Eyebrow>
              <h2 className="font-display text-4xl leading-[1.02] tracking-[-.065em] text-[#173323] sm:text-6xl lg:text-7xl">
                Give your ambition a place to grow.
              </h2>
              <p className="mt-6 max-w-[530px] text-[13px] leading-8 text-[#637362] sm:text-[15px]">
                Build your presence. Organise your business. Make room for
                what's next.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <CTA />
                <CTA to="/pricing" secondary>
                  Explore pricing
                </CTA>
              </div>
            </div>

            <motion.div
              className="pointer-events-none absolute -bottom-20 right-12 hidden h-64 w-64 items-center justify-center rounded-full border border-[#557451]/15 lg:flex"
              animate={{ rotate: 360 }}
              transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            >
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-[#557451]/20">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#173F2D] shadow-2xl">
                  <Sparkles size={28} className="text-[#D9EDB9]" />
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
