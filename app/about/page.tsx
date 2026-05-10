import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <header className="border-b border-slate-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-[#A31F34] dark:text-[#FF5A6F] hover:underline"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path
              d="M9.5 6h-7M2.5 6L6 9.5M2.5 6L6 2.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>
        <div className="text-xs font-medium tracking-widest uppercase text-slate-500 dark:text-zinc-500">
          About the project
        </div>
        <ThemeToggle />
      </header>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-6 pt-16 sm:pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-5">
          Built on the physics of
          <br />
          <span className="text-[#A31F34] dark:text-[#FF5A6F]">nuclear weapons</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          All effect calculations follow Glasstone &amp; Dolan,{" "}
          <em>The Effects of Nuclear Weapons</em> (1977). Casualty methodology
          adapts the zone-based model from MIT course materials, layered onto
          real population density from the US Census ACS block-group data.
        </p>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <Stat value="21" label="US cities" />
          <Stat value="3" label="effect categories" />
          <Stat value="1–2,000 kt" label="yield range" />
          <Stat value="Census" label="block-group data" />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
          What the simulator models
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            title="Blast overpressure"
            body="Five concentric pressure rings (20, 10, 5, 2, 1 psi) using cube-root scaling for any yield and burst height."
          />
          <FeatureCard
            title="Thermal radiation"
            body="First-, second-, and third-degree burn radii computed from fluence at range, with weather and visibility transmission factors."
          />
          <FeatureCard
            title="Prompt ionizing radiation"
            body="600, 450, and 100 rem dose contours — automatically suppressed at high yields where blast effects dominate."
          />
          <FeatureCard
            title="Casualty estimation"
            body="Day / night population distribution and indoor / outdoor mortality fractions applied per ring against Census block-group densities."
          />
          <FeatureCard
            title="3D burst visualization"
            body="Tilt the map to reveal a Three.js-rendered fireball with HOB-correct slant geometry. Right-click and drag to enter 3D mode."
          />
          <FeatureCard
            title="Configurable conditions"
            body="Switch between airburst and surface burst, slide burst height, and pick day or night with three visibility regimes."
          />
        </div>
      </section>

      {/* Scope panel */}
      <section className="max-w-5xl mx-auto px-6 pb-16 sm:pb-20">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#A31F34]" />
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
      <section className="max-w-5xl mx-auto px-6 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-2">
          Calibrated to historical and modern yields
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-500 text-center mb-10">
          Plus a custom yield slider from 1 kt to 2 Mt.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <WeaponCard era="1945" name="Hiroshima" yield_="15 kt" />
          <WeaponCard era="1945" name="Nagasaki" yield_="21 kt" />
          <WeaponCard era="Modern" name="Strategic" yield_="300 kt" />
          <WeaponCard era="Large" name="Strategic" yield_="1 Mt" />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 px-8 py-12 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Ready to explore?
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-7 max-w-md mx-auto">
            Place ground zero, choose a weapon, and watch the rings update live.
          </p>
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 rounded-full bg-[#A31F34] hover:bg-[#8B1A2C] text-white px-6 py-3 text-sm font-medium transition-colors"
          >
            Open Simulator →
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-600 leading-relaxed mt-10 max-w-2xl mx-auto">
          This tool is intended for educational and policy-analysis purposes only.
          Casualty estimates are rough approximations using simplified population
          density models and do not account for evacuation, sheltering, building
          density, or emergency response. Actual casualties from a real
          detonation would depend on many factors not represented here.
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
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#A31F34] dark:text-[#FF5A6F]">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 mt-1">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 hover:border-[#A31F34]/30 dark:hover:border-[#FF5A6F]/30 transition-colors">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-2 text-[#A31F34] dark:text-[#FF5A6F]">
        {title}
      </div>
      <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
        {body}
      </p>
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
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 text-center hover:border-[#A31F34]/30 dark:hover:border-[#FF5A6F]/30 transition-colors">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
        {era}
      </div>
      <div className="text-sm font-medium text-slate-900 dark:text-zinc-100 mb-1">
        {name}
      </div>
      <div className="text-xs text-[#A31F34] dark:text-[#FF5A6F] tabular-nums font-medium">
        {yield_}
      </div>
    </div>
  );
}
