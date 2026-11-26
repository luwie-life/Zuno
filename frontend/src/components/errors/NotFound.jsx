
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  House,
  LifeBuoy,
  MoveUpRight,
} from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0B2118] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full border border-white/[0.045]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-64 -left-40 h-[500px] w-[500px] rounded-full bg-[#1C6F52]/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 md:px-10">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          zuno<span className="text-[#E9A23B]">.</span>
        </Link>

        <Link
          to="/support"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
        >
          <LifeBuoy size={16} />
          <span className="hidden sm:inline">Help centre</span>
          <span className="sm:hidden">Help</span>
        </Link>
      </header>

      {/* Main */}
      <section className="relative z-10 flex flex-1 items-center px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9A23B]/25 bg-[#E9A23B]/10 px-3.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E9A23B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9A23B]">
                Page not found
              </span>
            </div>

            <h1 className="mt-8 text-[clamp(5rem,13vw,10rem)] font-semibold leading-[0.82] tracking-[-0.09em] text-white">
              404<span className="text-[#E9A23B]">.</span>
            </h1>

            <h2 className="mt-9 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl md:text-5xl">
              Well, this is an unexpected turn.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-[#A8B9AE]">
              The page you're looking for isn't here. It may have moved, or
              the address might not be quite right. Let's get you back on track.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="group inline-flex items-center gap-3 rounded-full bg-[#E9A23B] px-6 py-4 text-sm font-semibold text-[#12201A] transition hover:-translate-y-0.5 hover:bg-[#F3B85D]"
              >
                <House size={17} />
                Back to Zuno
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft size={16} />
                Go back
              </button>
            </div>

            <p className="mt-7 text-sm text-[#82978A]">
              Still stuck?{' '}
              <Link
                to="/support"
                className="font-medium text-[#E9A23B] underline decoration-[#E9A23B]/40 underline-offset-4 transition hover:decoration-[#E9A23B]"
              >
                Visit our support centre
              </Link>
            </p>
          </div>

          {/* Navigation illustration */}
          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute inset-8 rounded-full bg-[#1C6F52]/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#102B20] p-5 shadow-[0_35px_100px_rgba(0,0,0,0.3)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-medium text-white/45">
                    ZUNO NAVIGATION
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Finding your way
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9A23B]/10 text-[#E9A23B]">
                  <Compass size={20} />
                </div>
              </div>

              <div className="relative my-7 flex h-[270px] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0B2118]">
                <div className="absolute h-64 w-64 rounded-full border border-dashed border-white/10" />
                <div className="absolute h-44 w-44 rounded-full border border-white/[0.07]" />
                <div className="absolute h-28 w-28 rounded-full border border-white/[0.08]" />

                <svg
                  viewBox="0 0 320 230"
                  className="absolute h-full w-full"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M28 172 C72 172 65 72 123 88 S192 178 238 116 S276 62 300 55"
                    stroke="#47745D"
                    strokeWidth="2"
                    strokeDasharray="6 8"
                  />
                  <path
                    d="M40 42 L90 42 M230 194 L282 194"
                    stroke="#47745D"
                    strokeOpacity=".35"
                    strokeWidth="1"
                  />
                  <circle cx="28" cy="172" r="5" fill="#47745D" />
                  <circle cx="300" cy="55" r="5" fill="#E9A23B" />
                </svg>

                <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#E9A23B]/30 bg-[#E9A23B]/10 shadow-[0_0_70px_rgba(233,162,59,0.12)]">
                  <Compass size={43} strokeWidth={1.3} className="text-[#E9A23B]" />
                </div>

                <div className="absolute left-5 top-7 rounded-xl border border-white/10 bg-[#173629] px-3 py-2">
                  <span className="text-[10px] font-medium text-white/55">YOUR DESTINATION</span>
                  <p className="mt-1 text-xs font-semibold text-white">Unknown</p>
                </div>

                <div className="absolute bottom-6 right-5 rounded-xl border border-[#E9A23B]/20 bg-[#392D19] px-3 py-2">
                  <span className="text-[10px] font-medium text-[#E9A23B]/70">STATUS</span>
                  <p className="mt-1 text-xs font-semibold text-[#E9A23B]">Not found</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/45">Navigation status</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Route unavailable
                    </p>
                  </div>
                  <span className="rounded-full bg-[#E9A23B]/10 px-3 py-1.5 text-[10px] font-semibold text-[#E9A23B]">
                    404 ERROR
                  </span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[38%] rounded-full bg-[#E9A23B]" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#173629] p-4 shadow-xl sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C6F52]/30 text-[#91C6A8]">
                <House size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">There's a way back.</p>
                <p className="mt-1 text-[10px] text-white/45">Your business is still here.</p>
              </div>
              <MoveUpRight size={15} className="ml-2 text-[#E9A23B]" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-white/10 px-6 py-6 text-xs text-[#82978A] sm:flex-row sm:items-center sm:justify-between md:px-10">
        <span>© {new Date().getFullYear()} Zuno. Business, without the friction.</span>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 transition hover:text-white"
        >
          Need a hand? We're here <ArrowRight size={13} />
        </Link>
      </footer>
    </main>
  );
}
