
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Smartphone,
  Apple,
  Play,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Palette,
  Layers3,
  Rocket,
  ClipboardList,
  MessageSquare,
  Code2,
  PackageCheck,
  Globe2,
  MonitorSmartphone,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { naira } from '../../lib/format.js';
import { useApi } from '../../components/ui.jsx';

const process = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Tell us what you have in mind.',
    description:
      'Share your business details, preferred platform and the experience you want your customers to have.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Review your proposal.',
    description:
      'Our team reviews your request, clarifies the requirements and sends a quotation for your approval.',
  },
  {
    number: '03',
    icon: Code2,
    title: 'We build your app.',
    description:
      'Once you approve the quotation and the setup fee is recorded, development can begin.',
  },
  {
    number: '04',
    icon: PackageCheck,
    title: 'Receive your app.',
    description:
      'We deliver the completed app and guide you through the next steps for publication where applicable.',
  },
];

const benefits = [
  {
    icon: Palette,
    title: 'Your identity, your experience',
    description:
      'A visual experience built around your business name, identity and customer journey.',
  },
  {
    icon: Layers3,
    title: 'Designed around your needs',
    description:
      'Discuss the screens, features and workflows that make sense for your business.',
  },
  {
    icon: Smartphone,
    title: 'A dedicated mobile experience',
    description:
      'Give customers a dedicated app experience beyond visiting your website in a browser.',
  },
];

const faqs = [
  {
    question: 'Is a branded app included in my Zuno subscription?',
    answer:
      'No. Your Zuno subscription and online storefront are separate from a branded mobile app. App development is a custom project with its own quotation and approval process.',
  },
  {
    question: 'Can I request an Android app, an iOS app or both?',
    answer:
      'Yes. You can indicate your preferred platform when applying. The final scope and quotation will depend on the platforms and requirements of your project.',
  },
  {
    question: 'How much does a branded app cost?',
    answer:
      'There is no single fixed price for every project. Zuno may display indicative starting prices, but your actual project quotation depends on the requirements and scope.',
  },
  {
    question: 'Will my app automatically be published?',
    answer:
      'Publication is a separate step. App-store requirements, review and approval processes apply, so publication is only confirmed once it has actually happened.',
  },
  {
    question: 'Do I need a Zuno account?',
    answer:
      'Yes. You need a Zuno account and a business on the platform to submit an application through your dashboard.',
  },
];

function PhoneMockup() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      <div className="absolute -left-8 top-20 h-44 w-44 rounded-full bg-mango/20 blur-3xl" />
      <div className="absolute -right-8 bottom-16 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative mx-auto w-[270px] rounded-[42px] border-[7px] border-[#263A31] bg-[#101D17] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:w-[290px]">
        <div className="relative overflow-hidden rounded-[32px] bg-[#F6F7F5]">
          <div className="flex h-8 items-center justify-center bg-white">
            <div className="h-4 w-20 rounded-full bg-[#101D17]" />
          </div>

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-[9px] font-medium text-[#68756D]">
                  YOUR BRAND
                </p>
                <p className="text-sm font-bold text-[#12201A]">
                  Good morning.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B3D2E] text-xs font-bold text-white">
                Y
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-[#0B3D2E] p-4 text-white">
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/60">
                YOUR BUSINESS
              </p>
              <p className="mt-2 text-xl font-bold leading-tight">
                Everything
                <br />
                starts here.
              </p>
              <div className="mt-4 flex h-20 items-center justify-center rounded-xl bg-white/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mango text-[#12201A]">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] font-bold text-[#12201A]">
                Explore
              </p>
              <p className="text-[9px] text-[#68756D]">View all</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#DCE2DD] bg-white p-2">
                <div className="flex h-16 items-center justify-center rounded-lg bg-[#E9EFEA]">
                  <StoreIcon />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-[#12201A]">
                  Discover
                </p>
                <p className="mt-0.5 text-[8px] text-[#68756D]">
                  Your products
                </p>
              </div>

              <div className="rounded-xl border border-[#DCE2DD] bg-white p-2">
                <div className="flex h-16 items-center justify-center rounded-lg bg-[#F8EBD6]">
                  <CalendarIcon />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-[#12201A]">
                  Services
                </p>
                <p className="mt-0.5 text-[8px] text-[#68756D]">
                  What you offer
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#DCE2DD] bg-white p-3">
              <p className="text-[9px] font-semibold text-[#12201A]">
                Stay connected
              </p>
              <p className="mt-1 text-[8px] leading-4 text-[#68756D]">
                A dedicated space for your customers and your brand.
              </p>
              <div className="mt-2 h-1.5 w-20 rounded-full bg-[#E9A23B]" />
            </div>
          </div>

          <div className="flex items-center justify-around border-t border-[#DCE2DD] bg-white px-2 py-3">
            {['Home', 'Explore', 'Account'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`text-[9px] font-semibold transition ${
                  activeTab === tab ? 'text-[#0B3D2E]' : 'text-[#9AA49D]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-28 rounded-2xl border border-white/10 bg-[#1B3025] px-4 py-3 shadow-xl sm:-right-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mango text-[#12201A]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] text-white/50">A home for</p>
            <p className="text-xs font-semibold text-white">Your brand</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/10 bg-[#1B3025] px-4 py-3 shadow-xl sm:-left-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-mango">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] text-white/50">Built around</p>
            <p className="text-xs font-semibold text-white">Your business</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
      <path d="M9 20h30v19H9z" stroke="#0B3D2E" strokeWidth="2.5" />
      <path d="M7 20l4-11h26l4 11" stroke="#0B3D2E" strokeWidth="2.5" />
      <path d="M7 20c0 4 6 4 6 0 0 4 7 4 7 0 0 4 7 4 7 0 0 4 7 4 7 0 0 4 7 4 7 0" stroke="#0B3D2E" strokeWidth="2.5" />
      <path d="M19 39V27h10v12" stroke="#0B3D2E" strokeWidth="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
      <rect x="8" y="11" width="32" height="29" rx="4" stroke="#9B641D" strokeWidth="2.5" />
      <path d="M8 19h32M17 7v8M31 7v8" stroke="#9B641D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 26h5M27 26h5M16 33h5" stroke="#9B641D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function FaqItem({ question, answer, index }) {
  return (
    <details className="group border-b border-line py-5">
      <summary className="flex cursor-pointer list-none items-center gap-4">
        <span className="text-xs font-semibold tabular-nums text-forest/50">
          0{index + 1}
        </span>
        <span className="flex-1 text-sm font-semibold text-ink sm:text-base">
          {question}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition duration-300 group-open:rotate-180" />
      </summary>
      <p className="ml-9 mt-4 max-w-2xl text-sm leading-7 text-muted">
        {answer}
      </p>
    </details>
  );
}

export default function MobileApp() {
  const { data } = useApi(
    () => api('/mobile-apps/pricing', { auth: false }),
    [],
  );

  const hasPricing =
    data &&
    (data.setupFrom !== undefined || data.monthlyFrom !== undefined);

  return (
    <main className="overflow-hidden bg-paper">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B2118] px-4 pb-24 pt-16 text-white sm:pb-32 sm:pt-24">
        <div className="pointer-events-none absolute -right-48 -top-48 h-[650px] w-[650px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-[410px] w-[410px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/70">
              <Smartphone className="h-3.5 w-3.5 text-mango" />
              Custom branded mobile apps
            </div>

            <h1 className="mt-8 max-w-2xl text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.5rem]">
              Your brand.
              <br />
              <span className="text-mango">Their home screen.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg">
              Give your customers a dedicated mobile experience built around
              your business. Your identity, your requirements and an app
              experience designed with your goals in mind.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/app/mobile-app"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-mango px-6 text-sm font-bold text-[#12201A] transition hover:bg-white"
              >
                Start your application
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/45">
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mango" />
                Free application
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mango" />
                Custom quotation
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mango" />
                Android and iOS options
              </span>
            </div>
          </div>

          <div className="relative flex justify-center py-8 lg:py-12">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* PLATFORM STRIP */}
      <section className="border-b border-line bg-white px-4 py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            Choose your platform
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <Play className="h-5 w-5 fill-current text-forest" />
              Android
            </div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <Apple className="h-5 w-5" />
              iOS
            </div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <MonitorSmartphone className="h-5 w-5 text-forest" />
              Both platforms
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              A different kind of presence
            </p>

            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              Not just an app.
              <br />
              <span className="text-forest">A brand experience.</span>
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-muted">
              A branded mobile app gives your business a dedicated place on
              your customers’ devices. It is an opportunity to create a
              customer experience that feels distinctly yours.
            </p>

            <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
              Every project begins with understanding your business and what
              you want the app to accomplish. The final features, scope and
              delivery plan are agreed before development begins.
            </p>
          </div>

          <div className="grid gap-3">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="group flex gap-5 rounded-2xl border border-line bg-white p-5 transition hover:border-forest/30 hover:shadow-lg hover:shadow-ink/5 sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-white transition group-hover:bg-mango group-hover:text-ink">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-forest/50">
                    0{index + 1}
                  </p>
                  <h3 className="mt-1 font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DARK DIFFERENCE SECTION */}
      <section className="bg-[#12201A] px-4 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mango">
              Understand the difference
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your storefront is one thing.
              <br />
              Your app is another.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/55">
              Both can be part of your digital presence, but they serve
              different purposes and are provided through different services.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Globe2 className="h-6 w-6" />
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                Included in your relevant Zuno plan
              </p>
              <h3 className="mt-3 text-2xl font-bold">Online storefront</h3>
              <p className="mt-4 text-sm leading-7 text-white/55">
                A browser-based online presence where customers can discover
                your business, products or services using a web address.
              </p>
              <div className="mt-7 border-t border-white/10 pt-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Check className="h-4 w-4 text-mango" />
                  Works in a web browser
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Check className="h-4 w-4 text-mango" />
                  Covered by your Zuno plan
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-mango/30 bg-[#1B3025] p-7 sm:p-9">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-mango/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mango text-ink">
                  <Smartphone className="h-6 w-6" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.15em] text-mango">
                  Separate custom project
                </p>
                <h3 className="mt-3 text-2xl font-bold">Branded mobile app</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  A dedicated Android and/or iOS application developed around
                  your business identity and agreed project requirements.
                </p>
                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Check className="h-4 w-4 text-mango" />
                    Dedicated mobile application
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Check className="h-4 w-4 text-mango" />
                    Custom quotation and approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section
        id="how-it-works"
        className="scroll-mt-20 px-4 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
                From idea to delivery
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                A clear process.
                <br />
                No guesswork.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted">
              Every project follows a review and approval process before
              development begins.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map(({ number, icon: Icon, title, description }) => (
              <div
                key={number}
                className="relative rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-forest/30 hover:shadow-xl hover:shadow-ink/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-forest/40">
                    {number}
                  </span>
                  <Icon className="h-5 w-5 text-forest" />
                </div>
                <h3 className="mt-9 text-lg font-bold leading-snug text-ink">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-[#E9A23B] px-4 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
              Project pricing
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              Built around your requirements.
              <br />
              Priced transparently.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-ink/65">
              Every app project has its own scope. Tell us what you need and
              receive a quotation to review before you commit.
            </p>
            <div className="mt-7 flex items-start gap-3 text-sm leading-6 text-ink/70">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
              Applying is free. Development starts only after you approve the
              quotation and the setup fee is recorded.
            </div>
          </div>

          <div className="rounded-[28px] border border-ink/10 bg-white p-7 shadow-xl shadow-ink/10 sm:p-9">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                Indicative starting prices
              </p>
              <Sparkles className="h-5 w-5 text-forest" />
            </div>

            {hasPricing ? (
              <div className="mt-7 space-y-6">
                {data.setupFrom !== undefined && (
                  <div>
                    <p className="text-sm text-muted">App setup</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-ink">
                      From {naira(data.setupFrom)}
                    </p>
                  </div>
                )}

                {data.monthlyFrom !== undefined && (
                  <div className="border-t border-line pt-5">
                    <p className="text-sm text-muted">
                      Support and maintenance
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                      From {naira(data.monthlyFrom)}
                      <span className="ml-1 text-sm font-medium text-muted">
                        / month
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-7">
                <p className="text-2xl font-bold tracking-tight text-ink">
                  Request a quotation
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Pricing is confirmed after your project requirements have
                  been reviewed.
                </p>
              </div>
            )}

            <div className="mt-7 border-t border-line pt-5">
              <p className="text-xs leading-6 text-muted">
                Indicative starting prices only. Your final quotation depends
                on project scope, platform requirements and agreed services.
              </p>
              <Link
                to="/app/mobile-app"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-bold text-white transition hover:bg-[#1C6F52]"
              >
                Apply for your app
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Good to know
            </p>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Questions,
              <br />
              answered.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
              Have a question about the process or what is included? Start
              here.
            </p>
            <Link
              to="/support"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-forest"
            >
              Visit support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#0B2118] px-4 py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-9 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mango">
              Make your next move
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your business deserves
              <br />
              its own space.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base">
              Tell us what you want to build. Your application is the first
              step, not a commitment to purchase.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/app/mobile-app"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-mango px-7 text-sm font-bold text-ink transition hover:bg-white"
            >
              Start your application
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="text-center text-sm font-medium text-white/55 transition hover:text-white"
            >
              Explore Zuno plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
