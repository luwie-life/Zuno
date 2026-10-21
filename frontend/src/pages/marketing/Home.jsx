import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, ShoppingBag, Boxes, Smartphone, CreditCard, Users, ArrowRight, Globe, Receipt } from 'lucide-react';

const fade = (d = 0) => ({ initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: d } });

function StockIllustration() {
  const rows = [
    ['Stock on shelf', '20', 'text-ink'],
    ['Online order, 2 units', '18', 'text-forest-500'],
    ['Walk-in sale at the POS, 3 units', '15', 'text-forest-500'],
  ];
  return (
    <div className="card relative p-5 shadow-[0_20px_50px_-24px_rgba(11,61,46,.35)]" aria-label="Illustration of one shared stock count">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Illustration: one stock count</p>
      <p className="mt-1 font-display text-lg">Ankara tote bag</p>
      <ul className="mt-4 divide-y divide-line">
        {rows.map(([t, n, c], i) => (
          <motion.li key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.35 }} className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm">{i === 1 ? <Globe className="h-4 w-4 text-muted" /> : i === 2 ? <Store className="h-4 w-4 text-muted" /> : <Boxes className="h-4 w-4 text-muted" />}{t}</span>
            <span className={`font-display text-2xl font-bold ${c}`}>{n}</span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Online and in-person sales read and update the same number, so you do not sell what you no longer have.</p>
    </div>
  );
}

const features = [
  { icon: Globe, t: 'Your own online store', d: 'A professional storefront at your own address. Customers browse, add to cart and pay by card or transfer through Paystack, with no account needed.' },
  { icon: Store, t: 'A POS for walk-in customers', d: 'Ring up sales on your phone or a shop computer. Cash, transfer, card terminal or online payment, with printable receipts.' },
  { icon: Boxes, t: 'One inventory, both channels', d: 'Every sale, order, return and stock adjustment is recorded against the same stock count, with a full movement history.' },
  { icon: Users, t: 'Customers and suppliers', d: 'Keep customer history, supplier details and simple purchase records in the same place as your sales.' },
  { icon: Receipt, t: 'Reports from real records', d: 'Online versus in-store sales, best sellers, payment methods and low-stock items, calculated from your own data.' },
  { icon: CreditCard, t: 'Clear monthly plans', d: 'A one-time setup fee and a monthly subscription, both in naira, tracked separately so you always know what you paid for.' },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <motion.p {...fade()} className="mb-4 inline-block rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest">Built for Nigerian businesses</motion.p>
          <motion.h1 {...fade(0.05)} className="text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">Your business deserves more than a social media page.</motion.h1>
          <motion.p {...fade(0.1)} className="mt-5 max-w-xl text-lg text-muted">Launch an online store, sell to walk-in customers with a built-in POS, and run both from one connected system with a single stock count.</motion.p>
          <motion.div {...fade(0.15)} className="mt-7 flex flex-wrap gap-3"><Link to="/register" className="btn-primary">Start your store <ArrowRight className="h-4 w-4" /></Link><Link to="/pricing" className="btn-secondary">See pricing</Link></motion.div>
        </div>
        <motion.div {...fade(0.2)}><StockIllustration /></motion.div>
      </section>

      <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="max-w-2xl text-3xl font-bold">Everything a shop needs to sell online and in person</h2>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.t} {...fade(i * 0.04)} className="border-t border-line pt-4">
              <f.icon className="h-6 w-6 text-forest-500" aria-hidden /><h3 className="mt-3 text-lg font-semibold">{f.t}</h3><p className="mt-1 text-sm text-muted">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {[['Create your account', 'Choose a plan and set up your business details.'], ['Add products', 'Prices, photos by link, categories and starting stock.'], ['Publish your store', 'Share your store link. Orders and payments arrive in your dashboard.'], ['Sell in person too', 'Use the POS on plans that include it. Stock stays in sync.']].map(([t, d], i) => (
            <li key={t}><span className="font-display text-3xl font-bold text-mango">{i + 1}</span><h3 className="mt-1 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl bg-forest p-8 text-white md:p-12">
          <h2 className="max-w-2xl text-3xl font-bold">Three different things, explained plainly</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div><Globe className="h-6 w-6 text-mango" /><h3 className="mt-2 font-semibold">Zuno online storefront</h3><p className="mt-1 text-sm text-white/75">A website for your business hosted by Zuno. It works in any phone browser. It is a responsive website, not a downloadable app.</p></div>
            <div><Store className="h-6 w-6 text-mango" /><h3 className="mt-2 font-semibold">POS and business tools</h3><p className="mt-1 text-sm text-white/75">The dashboard you use to take walk-in sales, manage stock, customers and reports. Available on plans that include it.</p></div>
            <div><Smartphone className="h-6 w-6 text-mango" /><h3 className="mt-2 font-semibold">Branded mobile app</h3><p className="mt-1 text-sm text-white/75">A separate, custom-built Android or iOS app for your brand. You apply, receive a quotation, and it is built only if you approve.</p><Link to="/mobile-app" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-mango">Learn more <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
