import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Boxes, Smartphone, CreditCard, Users, ArrowRight, Globe, Receipt, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

const fade = (d = 0) => ({ initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: d } });

function StoreSnapshot() {
  const metricCards = [
    { label: 'Sales today', value: '₦184,200', tone: 'text-forest' },
    { label: 'Orders online', value: '38', tone: 'text-ink' },
    { label: 'Low stock', value: '4 items', tone: 'text-mango' },
  ];

  return (
    <div className="card relative overflow-hidden p-5 shadow-[0_24px_64px_-28px_rgba(11,61,46,.45)]">
      <div className="absolute inset-x-8 top-0 h-24 rounded-b-[32px] bg-gradient-to-b from-forest-100 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Live overview</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Mabinu Stores</h3>
          </div>
          <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest">Open</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {metricCards.map((m) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-2xl border border-line bg-paper px-3 py-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{m.label}</p>
              <p className={`mt-2 font-display text-xl font-bold ${m.tone}`}>{m.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Channel performance</span>
            <span className="font-medium text-forest">+18.4%</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Online store', '72%', 'bg-forest'],
              ['Walk-in POS', '54%', 'bg-mango'],
              ['Mobile app', '31%', 'bg-ink'],
            ].map(([label, percent, color]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs text-muted"><span>{label}</span><span>{percent}</span></div>
                <div className="h-2.5 rounded-full bg-forest-50">
                  <div className={`h-2.5 rounded-full ${color}`} style={{ width: percent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Globe, t: 'Sell everywhere', d: 'Your own storefront, customer checkout, and walk-in sales all work from one system.' },
  { icon: Store, t: 'One shared inventory', d: 'Stock counts change with every sale, return and transfer without manual syncing.' },
  { icon: Boxes, t: 'Orders and fulfilment', d: 'Track what is paid, packed, delivered and still waiting in plain English.' },
  { icon: Users, t: 'Customers you know', d: 'Keep purchase history, contacts and supplier records in the same place as your sales.' },
  { icon: Receipt, t: 'Clear reporting', d: 'Know what sells, what is slow, and where the money is coming from without spreadsheets.' },
  { icon: CreditCard, t: 'Simple billing', d: 'A clear setup fee and monthly plan, with no hidden confusion about what you are paying for.' },
];

const pillars = [
  ['Built for businesses that want growth', 'From boutique stores to fast-moving trade businesses, Zuno keeps the core operations simple enough to run well and complete enough to grow with you.'],
  ['Less chaos, more control', 'Everything — sales, stock, customer records, and digital checkout — sits in one working flow instead of multiple disconnected tools.'],
  ['Ready for the way you actually sell', 'Take online orders, serve customers in store, and manage your cash flow from one dashboard built for everyday operations.'],
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-[1.08fr_0.92fr] md:pt-20">
        <div>
          <motion.p {...fade()} className="mb-4 inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-forest"><Sparkles className="h-3.5 w-3.5" />Built for real retail operations</motion.p>
          <motion.h1 {...fade(0.05)} className="max-w-xl text-4xl font-bold leading-[1.04] sm:text-5xl md:text-6xl">Run your shop, your store, and your stock from one place.</motion.h1>
          <motion.p {...fade(0.1)} className="mt-5 max-w-xl text-lg leading-8 text-muted">Zuno helps Nigerian businesses sell online, take walk-in sales, and manage inventory without juggling disconnected apps, spreadsheets, or manual reconciliations.</motion.p>
          <motion.div {...fade(0.15)} className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">Start your store <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/pricing" className="btn-secondary">See pricing</Link>
          </motion.div>
          <motion.div {...fade(0.2)} className="mt-8 flex flex-wrap gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-forest" />Paystack-ready checkout</span>
            <span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-forest" />Built for growth</span>
          </motion.div>
        </div>
        <motion.div {...fade(0.2)}><StoreSnapshot /></motion.div>
      </section>

      <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">Why businesses choose Zuno</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">The operating system for modern retail and commerce</h2>
        </div>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.t} {...fade(i * 0.04)} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <f.icon className="h-6 w-6 text-forest-500" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">From product discovery to repeat sales, without the usual chaos</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {pillars.map(([title, copy], i) => (
            <motion.div key={title} {...fade(i * 0.04)} className="rounded-2xl bg-forest-50 p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white font-display text-lg font-bold text-forest">{i + 1}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-[28px] bg-forest p-8 text-white md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mango">What you get</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A simple stack for commerce that actually works.</h2>
            </div>
            <div className="text-sm leading-7 text-white/80">
              Whether you sell from a shop, online, or both, Zuno gives you a clearer operating picture: one dashboard, one stock count, and a cleaner path from browse to payment.
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <Globe className="h-6 w-6 text-mango" />
              <h3 className="mt-3 font-semibold">Online storefront</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">A branded store you can share with your customers and use to accept online payments with Paystack.</p>
            </div>
            <div>
              <Store className="h-6 w-6 text-mango" />
              <h3 className="mt-3 font-semibold">POS for the counter</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">Serve walk-in buyers from the same system without duplicating stock or creating separate records.</p>
            </div>
            <div>
              <Smartphone className="h-6 w-6 text-mango" />
              <h3 className="mt-3 font-semibold">Custom mobile app</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">A separate branded app offering for businesses that want a more premium customer experience.</p>
              <Link to="/mobile-app" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-mango">Learn more <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
