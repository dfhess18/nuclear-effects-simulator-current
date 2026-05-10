import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-zinc-100 mb-3">
          Nuclear Effects Simulator
        </h1>
        <p className="text-base text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
          An interactive tool for modeling the immediate physical effects of nuclear
          detonations in urban environments. Visualizes blast overpressure, thermal
          radiation, and prompt ionizing radiation rings alongside rough casualty
          estimates.
        </p>
        <p className="text-base text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
          Physics are based on Glasstone &amp; Dolan,{" "}
          <em>The Effects of Nuclear Weapons</em> (1977). Casualty methodology follows
          the zone-based model described in MIT course materials. This tool is intended
          for educational and policy-analysis purposes only.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-10">
          <Link
            href="/simulator"
            className="inline-block rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
          >
            Open Simulator
          </Link>
          <span className="text-xs text-slate-500 dark:text-zinc-500">
            Featuring 21 US cities — switch via the in-app dropdown
          </span>
        </div>

        <div className="border-t border-slate-200 dark:border-zinc-800 pt-6 grid sm:grid-cols-3 gap-4 text-xs text-slate-500 dark:text-zinc-500">
          <div>
            <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Effects modeled</p>
            <ul className="space-y-0.5">
              <li>Blast overpressure (5 rings)</li>
              <li>Thermal radiation (3 burn degrees)</li>
              <li>Prompt ionizing radiation</li>
              <li>Casualty estimates</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Weapon yields</p>
            <ul className="space-y-0.5">
              <li>Hiroshima (15 kt)</li>
              <li>Nagasaki (21 kt)</li>
              <li>Modern strategic (300 kt)</li>
              <li>Large strategic (1 Mt)</li>
              <li>Custom yield (1–2,000 kt)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-zinc-300 mb-1">Not modeled</p>
            <ul className="space-y-0.5">
              <li>Fallout / downwind contamination</li>
              <li>EMP effects</li>
              <li>Fires / firestorm</li>
              <li>Building shielding</li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-600 mt-8">
          Casualty estimates are rough approximations using simplified population density
          models. Actual casualties depend on time of day, sheltering, building density,
          evacuation, and emergency response.
        </p>
      </div>
    </main>
  );
}
