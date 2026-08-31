"use client";

/**
 * Landing option B — "Registry".
 *
 * Thesis: this is a reference instrument, so its front door is an index. The
 * 21 cities are presented as a scannable table with real coordinates, and the
 * map is the confirming panel beside it — hover a row, the pin answers.
 *
 * Deliberately NOT numbered 01/02/03: the cities are a set, not a sequence,
 * so ordinal markers would assert an order that does not exist. The
 * coordinates carry the structural texture instead, and they encode something
 * true — where the place actually is.
 *
 * Signature: the index is fully keyboard-drivable. Arrow through the register,
 * press Enter to model. That is what a research tool should feel like.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FLY_MS } from "@/components/landing/CityPickerMap";
import { CITIES, type CityEntry } from "@/lib/cities/registry";

const CityPickerMap = dynamic(
  () =>
    import("@/components/landing/CityPickerMap").then((m) => m.CityPickerMap),
  { ssr: false }
);

function coords(c: CityEntry): string {
  const { lat, lng } = c.defaultCenter;
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(
    lng
  ).toFixed(2)}°${lng >= 0 ? "E" : "W"}`;
}

export default function LandingB() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [launching, setLaunching] = useState<CityEntry | null>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const sorted = useMemo(
    () => [...CITIES].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const handleSelect = useCallback(
    (city: CityEntry) => {
      if (launching) return;
      setLaunching(city);
      setHovered(city.id);
      setTimeout(() => router.push(`/simulator?city=${city.id}`), FLY_MS - 150);
    },
    [launching, router]
  );

  // Roving arrow-key navigation through the register.
  const handleKey = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const next =
        e.key === "ArrowDown"
          ? (index + 1) % sorted.length
          : (index - 1 + sorted.length) % sorted.length;
      rowRefs.current[next]?.focus();
    },
    [sorted.length]
  );

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#fbfbfa] text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-8 py-4 dark:border-zinc-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
          MIT Laboratory for Nuclear Science
        </p>
        <div className="flex items-center gap-5">
          <Link
            href="/about"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 underline-offset-4 hover:text-brand-accent hover:underline dark:text-zinc-400"
          >
            About the model
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,38%)_1fr] transition-opacity duration-500 ${
          launching ? "opacity-60" : "opacity-100"
        }`}
      >
        {/* ── Register ──────────────────────────────────────────────────── */}
        <section className="flex min-h-0 flex-col border-r border-slate-200 dark:border-zinc-800">
          <div className="flex-shrink-0 px-8 pt-10 pb-6">
            <h1 className="text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Nuclear effects,
              <br />
              mapped to scale
            </h1>
            <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Overpressure, thermal and prompt-radiation contours for a
              detonation of any yield, drawn over US Census block-group
              population. Choose a city to begin.
            </p>
          </div>

          <div className="flex flex-shrink-0 items-baseline justify-between border-y border-slate-200 px-8 py-2 dark:border-zinc-800">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
              City
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
              Coordinates
            </span>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {sorted.map((city, i) => {
              const active = hovered === city.id;
              return (
                <li key={city.id}>
                  <button
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    onClick={() => handleSelect(city)}
                    onKeyDown={(e) => handleKey(e, i)}
                    onMouseEnter={() => setHovered(city.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(city.id)}
                    onBlur={() => setHovered(null)}
                    className={`group flex w-full items-baseline justify-between gap-4 rounded-md px-4 py-2 text-left outline-none transition-colors ${
                      active
                        ? "bg-brand-accent/8 dark:bg-brand-accent/12"
                        : "hover:bg-slate-100 dark:hover:bg-zinc-900"
                    } focus-visible:ring-2 focus-visible:ring-brand-accent`}
                  >
                    <span className="flex min-w-0 items-baseline gap-2.5">
                      {/* Presence marker, not a bullet: it tracks selection. */}
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${
                          active
                            ? "bg-brand-accent"
                            : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                      />
                      <span className="truncate text-[15px] tracking-[-0.01em]">
                        {city.name.split(",")[0]}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        {city.state}
                      </span>
                    </span>
                    <span className="flex-shrink-0 font-mono text-[11px] tabular-nums text-slate-500 dark:text-zinc-400">
                      {coords(city)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="flex-shrink-0 border-t border-slate-200 px-8 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
            ↑↓ to browse · Enter to model
          </p>
        </section>

        {/* ── Panel ─────────────────────────────────────────────────────── */}
        <section className="relative hidden min-h-0 p-6 lg:block">
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
            <CityPickerMap
              variant="framed"
              activeId={hovered}
              onHover={setHovered}
              onSelect={handleSelect}
              launching={launching !== null}
              className="absolute inset-0"
            />
            {/* Top-left, not bottom: Mapbox pins its attribution and logo to
                the bottom edge, and this would sit on top of them. */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em]">
              <span className="rounded bg-[var(--background)]/75 px-2 py-1 text-slate-500 backdrop-blur-sm dark:text-zinc-400">
                {launching
                  ? `Opening ${launching.name}`
                  : hovered
                    ? (CITIES.find((c) => c.id === hovered)?.name ?? "")
                    : `${CITIES.length} cities modelled`}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
