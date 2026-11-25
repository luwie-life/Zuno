
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  Phone,
  KeyRound,
  ChevronDown,
  MessageCircle,
  ShieldCheck,
  Search,
  LifeBuoy,
  LockKeyhole,
  Store,
  CreditCard,
  Smartphone,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../../components/ui.jsx';

const FAQ = [
  {
    category: 'Getting started',
    icon: Store,
    questions: [
      ['Do my customers need an account to buy?', 'No. Customers check out with their name, contact details and delivery address, and pay through Paystack.'],
      ['Is the online store a mobile app?', 'No. It is a responsive website that works well on phones. A branded mobile app is a separate, individually quoted service.'],
    ],
  },
  {
    category: 'Orders and payments',
    icon: CreditCard,
    questions: [
      ['How does stock stay accurate between my website and my shop?', 'Both use one stock count. Online orders hold stock while payment is pending, then deduct it once the payment is verified. POS sales deduct immediately.'],
      ['Are setup fee and subscription the same thing?', 'No. The setup fee is paid once. The monthly subscription is paid every month. They are tracked separately.'],
    ],
  },
  {
    category: 'Account and subscription',
    icon: LockKeyhole,
    questions: [
      ['What happens if I stop paying my subscription?', 'You get a grace period. After that your store and POS access pause. Your data is never deleted automatically.'],
      ['I cannot sign in and lost my email or phone. What now?', 'Use the account recovery form. Our team verifies your identity before any change is made to your account.'],
    ],
  },
];

const quickLinks = [
  {
    icon: Store,
    title: 'Store and business setup',
    description: 'Questions about your online presence and business workspace.',
    target: '/pricing',
    label: 'Explore plans',
  },
  {
    icon: CreditCard,
    title: 'Billing and subscriptions',
    description: 'Understand plans, setup fees and subscription access.',
    target: '/pricing',
    label: 'View pricing',
  },
  {
    icon: Smartphone,
    title: 'Branded mobile apps',
    description: 'Learn about building a mobile app for your business.',
    target: '/mobile-app',
    label: 'Explore mobile apps',
  },
];

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9A23B]">
      {children}
    </p>
  );
}

function SupportFaq({ category, icon: Icon, questions, search }) {
  const filtered = questions.filter(([q, a]) =>
    `${q} ${a}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!filtered.length) return null;

  return (
    <div className="border-b border-[#E4E9E5] py-7 last:border-0">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3EF] text-[#0B3D2E]">
          <Icon size={17} />
        </div>
        <h3 className="font-semibold text-[#12201A]">{category}</h3>
      </div>

      <div className="space-y-2">
        {filtered.map(([question, answer]) => (
          <details
            key={question}
            className="group rounded-xl border border-transparent transition hover:border-[#E4E9E5] hover:bg-[#F8FAF8] open:border-[#E4E9E5] open:bg-[#F8FAF8]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-[#12201A] [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown
                size={17}
                className="shrink-0 text-[#68756D] transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-sm leading-7 text-[#68756D]">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function Support() {
  const { data } = useApi(() => api('/contact', { auth: false }), []);
  const [search, setSearch] = useState('');

  const hasContact = Boolean(data?.supportEmail || data?.supportPhone);

  return (
    <main className="overflow-hidden bg-[#F6F7F5] text-[#12201A]">
      {/* HERO */}
      <section className="relative bg-[#0B2118] px-5 pb-20 pt-16 text-white md:pb-28 md:pt-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-[290px] w-[290px] rounded-full border border-white/[0.08]" />

        <div className="relative mx-auto max-w-6xl">
          <SectionLabel>THE ZUNO HELP CENTRE</SectionLabel>

          <div className="mt-7 grid items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Good businesses
                <span className="block text-[#E9A23B]">deserve good support.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/65 md:text-lg">
                Whether you’re setting up, managing orders or figuring something
                out, find the help you need to keep your business moving.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#help"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E9A23B] px-6 py-3.5 text-sm font-semibold text-[#12201A] transition hover:bg-[#F3B85D]"
                >
                  Find an answer <ArrowRight size={16} />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact support
                </a>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="ml-auto max-w-sm rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9A23B] text-[#12201A]">
                    <LifeBuoy size={22} />
                  </div>
                  <span className="rounded-full border border-[#7AC39D]/30 bg-[#7AC39D]/10 px-3 py-1 text-xs font-medium text-[#9AD9B7]">
                    Here to help
                  </span>
                </div>
                <h2 className="mt-8 text-xl font-semibold">What can we help with?</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ['Account access', KeyRound],
                    ['Orders and payments', CreditCard],
                    ['Store management', Store],
                  ].map(([label, Icon]) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                      <Icon size={17} className="text-[#E9A23B]" />
                      <span className="text-sm text-white/80">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-6 text-white/40">
                  Clear answers. Account-aware assistance. A better way forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK HELP */}
      <section className="relative z-10 mx-auto -mt-7 max-w-6xl px-5">
        <div className="grid gap-3 rounded-2xl border border-[#E1E7E2] bg-white p-4 shadow-[0_18px_60px_rgba(18,32,26,0.06)] sm:grid-cols-3">
          {quickLinks.map(({ icon: Icon, title, description, target, label }) => (
            <Link
              key={title}
              to={target}
              className="group rounded-xl p-4 transition hover:bg-[#F6F7F5]"
            >
              <div className="flex items-center justify-between">
                <Icon size={21} className="text-[#0B6B4B]" />
                <ArrowRight size={16} className="text-[#A2ADA5] transition group-hover:translate-x-1 group-hover:text-[#0B3D2E]" />
              </div>
              <h2 className="mt-5 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#68756D]">{description}</p>
              <span className="mt-4 inline-block text-xs font-semibold text-[#0B6B4B]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ACCOUNT RECOVERY */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-10 rounded-[28px] bg-[#E9EFEA] p-7 md:p-12 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B3D2E] text-white">
              <ShieldCheck size={21} />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              Locked out of your business account?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#68756D] md:text-base">
              Forgot your password, lost access to your email or phone, or
              suspect someone else accessed your account? Start with the
              appropriate recovery option.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C9D5CC] bg-white px-6 py-3.5 text-sm font-semibold transition hover:border-[#0B3D2E]"
            >
              <KeyRound size={16} /> Reset password
            </Link>
            <Link
              to="/recover"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B3D2E] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1C6F52]"
            >
              Recover my account <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="help" className="scroll-mt-20 border-y border-[#E1E7E2] bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:py-28 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SectionLabel>KNOWLEDGE BASE</SectionLabel>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Answers to the things that matter.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#68756D]">
              Browse common questions about your Zuno workspace, payments,
              subscriptions and account.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#E1E7E2] bg-[#F6F7F5] px-4 py-3">
              <Search size={18} className="shrink-0 text-[#68756D]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for an answer..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9AA59D]"
                aria-label="Search frequently asked questions"
              />
            </div>

            <p className="mt-5 text-xs leading-6 text-[#87928A]">
              Can't find what you're looking for? Our support team can help.
            </p>
            <a href="#contact" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0B6B4B]">
              Get in touch <ArrowRight size={15} />
            </a>
          </div>

          <div>
            {FAQ.map((group) => (
              <SupportFaq key={group.category} {...group} search={search} />
            ))}
            {FAQ.every((group) =>
              group.questions.every(([q, a]) =>
                !`${q} ${a}`.toLowerCase().includes(search.toLowerCase())
              )
            ) && (
              <div className="rounded-2xl bg-[#F6F7F5] p-8 text-center">
                <Search size={25} className="mx-auto text-[#9AA59D]" />
                <p className="mt-4 font-semibold">No matching answers found.</p>
                <p className="mt-2 text-sm text-[#68756D]">
                  Try another search or contact our support team.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20 bg-[#0B2118] px-5 py-20 text-white md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionLabel>WE'RE WITH YOU</SectionLabel>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Let's get your business moving again.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/60 md:text-base">
              If you already use Zuno, the best place to get help is your
              business dashboard. Your requests can be tracked there.
            </p>
            <Link
              to="/app/support"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#E9A23B] px-6 py-4 text-sm font-semibold text-[#12201A] transition hover:bg-[#F3B85D]"
            >
              <MessageCircle size={17} />
              Open dashboard support
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 md:p-8">
            <h3 className="text-xl font-semibold">Public contact details</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Reach out using the published contact channels below.
            </p>

            <div className="mt-8 space-y-5">
              {data?.supportEmail && (
                <a
                  href={`mailto:${data.supportEmail}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E9A23B]">
                    <Mail size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/45">Email support</p>
                    <p className="mt-1 break-all text-sm font-medium">{data.supportEmail}</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto shrink-0 text-white/40" />
                </a>
              )}

              {data?.supportPhone && (
                <div className="flex items-center gap-4 rounded-xl border border-white/10 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E9A23B]">
                    <Phone size={19} />
                  </div>
                  <div>
                    <p className="text-xs text-white/45">Phone support</p>
                    <p className="mt-1 text-sm font-medium">{data.supportPhone}</p>
                  </div>
                </div>
              )}

              {!hasContact && (
                <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/55">
                  Public contact details are not available right now. If you
                  have a Zuno account, please use Support in your dashboard.
                </p>
              )}
            </div>

            <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-6">
              <Package size={17} className="mt-1 shrink-0 text-[#E9A23B]" />
              <p className="text-xs leading-6 text-white/45">
                For account-specific issues, use dashboard support so your
                request can be associated with your business account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
