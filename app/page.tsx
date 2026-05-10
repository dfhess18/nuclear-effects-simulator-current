import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="text-xs font-medium tracking-widest uppercase text-[#A31F34] dark:text-[#FF5A6F]">
          MIT Laboratory for Nuclear Science
        </div>
        <ThemeToggle />
      </header>

      <section className="relative flex-1 flex items-center justify-center px-6 py-16 overflow-hidden">
        <BlastRingsBackdrop />

        <div className="relative max-w-2xl w-full text-center">
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A31F34] dark:text-[#FF5A6F] border border-[#A31F34]/20 dark:border-[#FF5A6F]/20 bg-[#A31F34]/5 dark:bg-[#FF5A6F]/10 rounded-full px-3 py-1 mb-6">
            Educational research tool
          </span>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Nuclear Effects
            <br />
            <span className="text-[#A31F34] dark:text-[#FF5A6F]">Simulator</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-10 max-w-xl mx-auto">
            An interactive visualization of the immediate physical effects of
            nuclear detonations across 21 US cities, built on Glasstone &amp;
            Dolan and US Census population data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/simulator"
              className="group inline-flex items-center gap-2 rounded-full bg-[#A31F34] hover:bg-[#8B1A2C] text-white px-7 py-3.5 text-sm font-medium shadow-lg shadow-[#A31F34]/20 hover:shadow-xl transition-all"
            >
              Open Simulator
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M3 7H11M11 7L7 3M11 7L7 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-zinc-800 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          MIT Laboratory for Nuclear Science · UROP project
        </p>
        <Link
          href="/about"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#A31F34] dark:text-[#FF5A6F] hover:underline"
        >
          About this project
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M2.5 6h7M9.5 6L6 2.5M9.5 6L6 9.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </footer>
    </main>
  );
}

/** Decorative concentric circles evoking blast rings, behind the hero. */
function BlastRingsBackdrop() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <svg
        width="900"
        height="900"
        viewBox="-450 -450 900 900"
        className="opacity-[0.10] dark:opacity-[0.18]"
      >
        <defs>
          <radialGradient id="ringGlow" cx="0" cy="0" r="0.5">
            <stop offset="0%" stopColor="#A31F34" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#A31F34" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#A31F34" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="0" cy="0" r="380" fill="url(#ringGlow)" />
        <circle cx="0" cy="0" r="60" fill="none" stroke="#A31F34" strokeWidth="1" strokeOpacity="0.55" />
        <circle cx="0" cy="0" r="120" fill="none" stroke="#A31F34" strokeWidth="1" strokeOpacity="0.45" />
        <circle cx="0" cy="0" r="200" fill="none" stroke="#A31F34" strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="0" cy="0" r="290" fill="none" stroke="#A31F34" strokeWidth="1" strokeOpacity="0.25" />
        <circle cx="0" cy="0" r="380" fill="none" stroke="#A31F34" strokeWidth="1" strokeOpacity="0.18" />
      </svg>
    </div>
  );
}
