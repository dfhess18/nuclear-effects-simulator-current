"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CasualtyEstimate } from "@/lib/casualties/types";

interface ResultsPanelProps {
  casualties: CasualtyEstimate | null;
  groundZeroPlaced: boolean;
  yieldKt: number;
  populationLoading?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// Shared easing/duration so every animated property moves together.
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = 450;

export function ResultsPanel({
  casualties,
  groundZeroPlaced,
  yieldKt,
  populationLoading = false,
}: ResultsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!groundZeroPlaced) {
    return (
      <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-6 py-2.5 text-center">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Click a city or anywhere on the map to place ground zero.
        </p>
      </div>
    );
  }

  if (!casualties && !populationLoading) return null;

  const dash = "—";

  const stats = [
    {
      label: "Fatalities",
      value: populationLoading ? dash : fmt(casualties!.fatalities),
      accent: "text-slate-900 dark:text-zinc-100",
    },
    {
      label: "Blast injuries",
      value: populationLoading ? dash : fmt(casualties!.injuriesBlast),
      accent: "text-purple-700 dark:text-purple-400",
    },
    {
      label: "Burn injuries",
      value: populationLoading ? dash : fmt(casualties!.injuriesBurns),
      accent: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Affected area",
      value: populationLoading
        ? dash
        : `${casualties!.affectedAreaKm2.toLocaleString()} km²`,
      accent: "text-slate-600 dark:text-zinc-400",
    },
  ];

  return (
    <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Header — always the top row. Acts as the toggle. */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-6 pt-2.5 pb-1 text-left"
        aria-expanded={expanded}
      >
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
          Estimated effects
        </span>
        <Badge
          variant="outline"
          className="text-[10px] font-normal text-slate-500 dark:text-zinc-400 px-1.5 py-0"
        >
          {yieldKt >= 1000 ? `${yieldKt / 1000} Mt` : `${yieldKt} kt`}
        </Badge>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`ml-auto shrink-0 text-slate-400 dark:text-zinc-500 transition-transform ${
            expanded ? "" : "rotate-180"
          }`}
          style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
          aria-hidden="true"
        >
          <path
            d="M2 4.5L6 8.5L10 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Stats — a fixed 4-column grid directly under the header. Each cell
          grows in place (font + padding + bubble), so the numbers stay the
          same elements and just enlarge. Because every size change is a real
          CSS transition, the panel's real height animates continuously and the
          map resizes smoothly (no snap). */}
      <div
        className="px-6 pb-2.5 grid grid-cols-2 md:grid-cols-4"
        style={{
          columnGap: expanded ? "0.75rem" : "0.75rem",
          rowGap: expanded ? "0.75rem" : "0.5rem",
          transition: `gap ${DUR}ms ${EASE}`,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="relative"
            style={{
              padding: expanded ? "0.625rem 0.75rem" : "0rem",
              transition: `padding ${DUR}ms ${EASE}`,
            }}
          >
            {/* Bubble — fades in behind the metric, staggered per cell. */}
            <div
              className="absolute inset-0 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60"
              style={{
                opacity: expanded ? 1 : 0,
                transition: `opacity ${DUR}ms ${EASE}`,
                transitionDelay: expanded ? `${i * 55}ms` : "0ms",
              }}
            />
            <div className="relative flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wide leading-tight">
                {s.label}
              </span>
              <span
                className={`font-semibold tabular-nums leading-tight ${s.accent}`}
                style={{
                  fontSize: expanded ? "1.25rem" : "0.875rem",
                  marginTop: expanded ? "0.25rem" : "0rem",
                  transition: `font-size ${DUR}ms ${EASE}, margin-top ${DUR}ms ${EASE}`,
                }}
              >
                {s.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Narrative + disclaimer — revealed via the grid 0fr→1fr height-to-auto
          trick so their appearance also animates the real height smoothly. */}
      <div
        className="grid px-6"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: `grid-template-rows ${DUR}ms ${EASE}`,
        }}
      >
        <div className="overflow-hidden">
          <div
            style={{
              opacity: expanded ? 1 : 0,
              transition: `opacity ${DUR}ms ${EASE}`,
              transitionDelay: expanded ? "120ms" : "0ms",
            }}
          >
            <Separator className="mb-3" />
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {populationLoading
                ? "Loading population data…"
                : casualties!.narrative}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 pb-4">
              All figures are rough estimates using a zone-based population
              density model. Actual casualties would depend on time of day,
              sheltering, building density, evacuation, and emergency response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
