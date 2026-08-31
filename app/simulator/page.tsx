"use client";

/**
 * The simulator entered directly — a shared or bookmarked link.
 *
 * Renders the same tree as `/`, but starting at the `simulator` phase with the
 * chrome already open. `/` reaches this state by animating into it rather than
 * navigating here, so arriving through the landing page never remounts the map.
 */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SimulatorExperience } from "@/components/simulator/SimulatorExperience";
import { findCity } from "@/lib/cities/registry";

function SimulatorRoute() {
  // Falls back to the default whenever the value is missing or unknown, so a
  // hand-edited URL can never leave the simulator without a city.
  const requested = useSearchParams().get("city");
  return (
    <SimulatorExperience
      initialPhase="simulator"
      initialCity={requested ? (findCity(requested) ?? null) : null}
    />
  );
}

export default function SimulatorPage() {
  // useSearchParams forces client-side rendering up to the nearest Suspense
  // boundary on a prerendered route, so the boundary is required here.
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Loading simulator…
          </p>
        </div>
      }
    >
      <SimulatorRoute />
    </Suspense>
  );
}
