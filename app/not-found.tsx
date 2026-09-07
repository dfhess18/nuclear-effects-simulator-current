import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/shell/PageShell";
import { CITIES } from "@/lib/cities/registry";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell eyebrow="Not found">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
          Error 404
        </p>
        <h1 className="mt-4 text-[clamp(1.9rem,5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          No such page
        </h1>
        <p className="mt-5 max-w-[52ch] text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          The address you followed doesn&apos;t match a route in this
          simulator. If you were opening a specific city, it may not be one of
          the {CITIES.length} currently modelled — the simulator only covers
          cities with Census block-group data loaded.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Back to the map
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            About the model
          </Link>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 dark:border-zinc-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
            Cities modelled
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {[...CITIES]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/simulator?city=${c.id}`}
                    className="text-sm text-slate-600 underline-offset-4 hover:text-brand-accent hover:underline dark:text-zinc-400"
                  >
                    {c.name.split(",")[0]}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
