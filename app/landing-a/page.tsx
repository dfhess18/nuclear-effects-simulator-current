"use client";

/**
 * Landing option A — "Atlas".
 *
 * Thesis: the map is not an illustration of the product, it IS the product's
 * first screen. Full-bleed, no card, no hero image competing with it. The only
 * chrome is a thin instrument rail across the bottom carrying the three facts
 * a reader needs (what this models, what it's built from, how precise it is)
 * and a masthead that behaves like a plate caption rather than a marketing
 * headline.
 *
 * Signature: choosing a city is the call to action. There is no "Get started"
 * button, because the 21 pins already are one.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FLY_MS } from "@/components/landing/CityPickerMap";
import { CITIES, type CityEntry } from "@/lib/cities/registry";

const CityPickerMap = dynamic(
  () =>
    import("@/components/landing/CityPickerMap").then((m) => m.CityPickerMap),
  { ssr: false }
);

/** Facts, not benefits — each is checkable against the source. */
const RAIL = [
  { k: "Model", v: "Glasstone & Dolan (1977)" },
  { k: "Population", v: "US Census block groups" },
  { k: "Cities", v: `${CITIES.length} modelled` },
];

export default function LandingA() {
  const router = useRouter();
  const [launching, setLaunching] = useState<CityEntry | null>(null);

  const handleSelect = useCallback(
    (city: CityEntry) => {
      setLaunching(city);
      // Hand off once the camera has arrived, so the simulator's own framing
      // picks the movement up rather than cutting.
      setTimeout(() => router.push(`/simulator?city=${city.id}`), FLY_MS - 150);
    },
    [router]
  );

  return (
    <main className="relative h-screen w-full overflow-hidden bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* The map occupies the whole frame; everything else floats over it. */}
      <CityPickerMap
        variant="immersive"
        onSelect={handleSelect}
        launching={launching !== null}
        className="absolute inset-0"
      />

      {/* Scrims, not a vignette: two soft linear washes behind the masthead and
          the rail only. A radial vignette dims the map's centre, which is
          exactly where the pins are. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[var(--background)] via-[var(--background)]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-[var(--background)] to-transparent"
      />

      <div
        className={`pointer-events-none absolute inset-0 flex flex-col justify-between transition-opacity duration-500 ${
          launching ? "opacity-0" : "opacity-100"
        }`}
      >
        <header className="pointer-events-auto flex items-start justify-between px-7 pt-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
              MIT Laboratory for Nuclear Science
            </p>
            <h1 className="mt-3 max-w-[15ch] text-[clamp(2.2rem,5vw,3.9rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
              Nuclear effects,
              <br />
              mapped to scale
            </h1>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Overpressure, thermal and prompt-radiation contours for a
              detonation of any yield, drawn over real population data.
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Instruction sits with the pins, not in the masthead — it describes
            what the hand should do, at the moment the eye is on the map. */}
        <p className="pointer-events-none self-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
          Select a city
        </p>

        <footer className="pointer-events-auto border-t border-slate-200/70 bg-white/70 px-7 py-4 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              {RAIL.map((item) => (
                <div key={item.k}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-[13px] tabular-nums">{item.v}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/about"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-accent underline-offset-4 hover:underline"
            >
              About the model
            </Link>
          </div>
        </footer>
      </div>

      {/* Confirms the choice during the flight, so the wait reads as intent. */}
      {launching && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brand-accent">
            {launching.name}
          </p>
        </div>
      )}
    </main>
  );
}
