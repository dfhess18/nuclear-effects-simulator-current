import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-slate-900 dark:text-zinc-100">
      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 px-6 py-4 flex items-center justify-between z-10">
        <div className="text-xs font-medium tracking-widest uppercase text-slate-500 dark:text-zinc-500">
          MIT Laboratory for Nuclear Science
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        <BlastRingsBackdrop />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-3 py-1 mb-6">
            Educational research tool
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
            Nuclear Effects
            <br />
            <span className="bg-gradient-to-r from-orange-600 via-rose-600 to-purple-700 dark:from-amber-400 dark:via-rose-400 dark:to-purple-400 bg-clip-text text-transparent">
              Simulator
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            An interactive visualization of the immediate physical effects of nuclear
            detonations in urban environments — modeling blast overpressure, thermal
            radiation, and prompt ionizing radiation against real population data
            for 21 US cities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/simulator"
              className="group inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-7 py-3.5 text-sm font-medium shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20 hover:bg-slate-800 dark:hover:bg-white transition-all"
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
            <a
              href="#about"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 px-7 py-3.5 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <Stat value="21" label="US cities" />
          <Stat value="3" label="effect categories" />
          <Stat value="1–2,000 kt" label="yield range" />
          <Stat value="Census" label="block-group data" />
        </div>
      </section>

      {/* Features */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Built on the physics of nuclear weapons
          </h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
            All effect calculations follow Glasstone &amp; Dolan,{" "}
            <em>The Effects of Nuclear Weapons</em> (1977). Casualty methodology
            adapts the zone-based model from MIT course materials, layered onto
            real population density from the US Census.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            color="purple"
            title="Blast overpressure"
            body="Five concentric pressure rings (20, 10, 5, 2, 1 psi) using cube-root scaling for any yield and burst height."
          />
          <FeatureCard
            color="amber"
            title="Thermal radiation"
            body="First-, second-, and third-degree burn radii computed from fluence at range, with weather and visibility transmission factors."
          />
          <FeatureCard
            color="blue"
            title="Prompt ionizing radiation"
            body="600, 450, and 100 rem dose contours — automatically suppressed at high yields where blast effects dominate."
          />
          <FeatureCard
            color="rose"
            title="Casualty estimation"
            body="Day / night population distribution and indoor / outdoor mortality fractions applied per ring against Census block-group densities."
          />
          <FeatureCard
            color="cyan"
            title="3D burst visualization"
            body="Tilt the map to reveal a Three.js-rendered fireball with HOB-correct slant geometry. Right-click and drag to enter 3D mode."
          />
          <FeatureCard
            color="emerald"
            title="Configurable conditions"
            body="Switch between airburst and surface burst, slide burst height, and pick day or night with three visibility regimes."
          />
        </div>
      </section>

      {/* Scope panel */}
      <section className="max-w-5xl mx-auto px-6 pb-20 sm:pb-28">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Modeled
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-zinc-400">
              <ScopeItem>Blast overpressure (20, 10, 5, 2, 1 psi)</ScopeItem>
              <ScopeItem>Thermal radiation (3 burn degrees)</ScopeItem>
              <ScopeItem>Prompt ionizing radiation (600, 450, 100 rem)</ScopeItem>
              <ScopeItem>Casualty estimates from Census block-group data</ScopeItem>
              <ScopeItem>Airburst with optimal-HOB scaling</ScopeItem>
              <ScopeItem>Day / night occupancy and weather visibility</ScopeItem>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Out of scope
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-zinc-400">
              <ScopeItem>Fallout and downwind contamination</ScopeItem>
              <ScopeItem>Electromagnetic pulse (EMP)</ScopeItem>
              <ScopeItem>Mass-fire ignition and firestorm dynamics</ScopeItem>
              <ScopeItem>Per-building shielding and survivability</ScopeItem>
              <ScopeItem>Long-term medical and societal effects</ScopeItem>
              <ScopeItem>Evacuation or emergency response modeling</ScopeItem>
            </ul>
          </div>
        </div>
      </section>

      {/* Weapons strip */}
      <section className="max-w-5xl mx-auto px-6 pb-20 sm:pb-28">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
          Calibrated to historical and modern yields
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <WeaponCard era="1945" name="Hiroshima" yield_="15 kt" />
          <WeaponCard era="1945" name="Nagasaki" yield_="21 kt" />
          <WeaponCard era="Modern" name="Strategic" yield_="300 kt" />
          <WeaponCard era="Large" name="Strategic" yield_="1 Mt" />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 text-center mt-6">
          Plus a custom yield slider from 1 kt to 2 Mt.
        </p>
      </section>

      {/* CTA + disclaimer */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-8 py-12 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Explore the simulator
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-7 max-w-md mx-auto">
            Place ground zero, choose a weapon, and watch the rings update live.
            Switch cities from the in-app dropdown.
          </p>
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Open Simulator →
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-600 leading-relaxed mt-10 max-w-2xl mx-auto">
          This tool is intended for educational and policy-analysis purposes only.
          Casualty estimates are rough approximations using simplified population
          density models and do not account for evacuation, sheltering, building
          density, or emergency response. Actual casualties from a real detonation
          would depend on many factors not represented here.
        </p>
      </section>

      <footer className="border-t border-slate-200 dark:border-zinc-800 py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
        MIT Laboratory for Nuclear Science · UROP project · Built with Next.js,
        Mapbox, and Three.js
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 mt-1">
        {label}
      </div>
    </div>
  );
}

const ACCENT: Record<string, string> = {
  purple: "from-purple-500/20 to-purple-500/0 text-purple-700 dark:text-purple-300",
  amber: "from-amber-500/20 to-amber-500/0 text-amber-700 dark:text-amber-300",
  blue: "from-blue-500/20 to-blue-500/0 text-blue-700 dark:text-blue-300",
  rose: "from-rose-500/20 to-rose-500/0 text-rose-700 dark:text-rose-300",
  cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-700 dark:text-cyan-300",
  emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-700 dark:text-emerald-300",
};

function FeatureCard({
  color,
  title,
  body,
}: {
  color: keyof typeof ACCENT;
  title: string;
  body: string;
}) {
  const accent = ACCENT[color];
  return (
    <div className="group relative rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors overflow-hidden">
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${accent.split(" ").slice(0, 2).join(" ")} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`}
      />
      <div className="relative">
        <div
          className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${accent.split(" ").slice(2).join(" ")}`}
        >
          {title}
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}

function ScopeItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-slate-300 dark:text-zinc-700 mt-1.5">•</span>
      <span>{children}</span>
    </li>
  );
}

function WeaponCard({
  era,
  name,
  yield_,
}: {
  era: string;
  name: string;
  yield_: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
        {era}
      </div>
      <div className="text-sm font-medium text-slate-900 dark:text-zinc-100 mb-1">
        {name}
      </div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
        {yield_}
      </div>
    </div>
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
        className="opacity-[0.18] dark:opacity-[0.12]"
      >
        <defs>
          <radialGradient id="ringGlow" cx="0" cy="0" r="0.5">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#e11d48" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="0" cy="0" r="380" fill="url(#ringGlow)" />
        <circle cx="0" cy="0" r="60" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="0" cy="0" r="120" fill="none" stroke="#c026d3" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="0" cy="0" r="200" fill="none" stroke="#e11d48" strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="0" cy="0" r="290" fill="none" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="0" cy="0" r="380" fill="none" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.25" />
      </svg>
    </div>
  );
}
