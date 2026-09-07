"use client";

// Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/shell/PageShell";

/**
 * Route-level error boundary.
 *
 * This matters more here than on a typical page: the map IS the whole screen,
 * so an uncaught failure — a lost WebGL context, a bad Mapbox response —
 * previously left a blank viewport with no way back.
 *
 * Note the retry prop is `unstable_retry` in this Next version, not `reset`.
 */
export default function GlobalRouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // No error-reporting service is wired up; the console is the only sink.
    console.error(error);
  }, [error]);

  return (
    <PageShell eyebrow="Error">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
          Something broke
        </p>
        <h1 className="mt-4 text-[clamp(1.9rem,5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          The simulator stopped
        </h1>
        <p className="mt-5 max-w-[54ch] text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          This is usually the map losing its WebGL context, which can happen
          after long sessions or when a device runs low on graphics memory.
          Retrying rebuilds the view without reloading the page.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-slate-400 dark:text-zinc-500">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={unstable_retry}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Back to the map
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
