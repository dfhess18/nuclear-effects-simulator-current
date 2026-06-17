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
      {/* Header bar — always the TOP element, so as the panel grows upward the
          "Estimated effects" label rides the top edge. Acts as the toggle. */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-x-6 gap-y-1 flex-wrap px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Estimated effects
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-normal text-slate-500 dark:text-zinc-400 px-1.5 py-0"
          >
            {yieldKt >= 1000 ? `${yieldKt / 1000} Mt` : `${yieldKt} kt`}
          </Badge>
        </div>

        {/* Inline metrics — shown collapsed, fade out as the cards take over.
            They keep their layout space so the header row doesn't reflow. */}
        <div
          className={`flex items-center gap-x-6 gap-y-1 flex-wrap transition-opacity duration-200 ${
            expanded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">
                {s.label}:
              </span>
              <span className={`text-sm font-semibold tabular-nums ${s.accent}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`ml-auto shrink-0 text-slate-400 dark:text-zinc-500 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
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

      {/* Detail region — grows downward from the header via the grid 0fr→1fr
          height-to-auto trick. The map's ResizeObserver keeps the GL canvas
          synced as this animates, so the map resizes smoothly. */}
      <div
        className={`grid transition-[grid-template-rows] duration-[350ms] ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-4 pt-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  // Bubble scales + fades in behind the metric, staggered per
                  // card so they cascade in like scroll-resize site elements.
                  className={`rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2.5 origin-bottom transition-all duration-300 ease-out ${
                    expanded
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-[0.92] translate-y-1"
                  }`}
                  style={{ transitionDelay: expanded ? `${80 + i * 70}ms` : "0ms" }}
                >
                  <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                    {s.label}
                  </p>
                  <p className={`text-lg font-semibold tabular-nums ${s.accent}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="mb-3" />

            <p
              className={`text-sm text-slate-500 dark:text-zinc-400 leading-relaxed transition-opacity duration-300 ${
                expanded ? "opacity-100 delay-[280ms]" : "opacity-0"
              }`}
            >
              {populationLoading
                ? "Loading population data…"
                : casualties!.narrative}
            </p>

            <p
              className={`text-xs text-slate-400 dark:text-zinc-500 mt-2 transition-opacity duration-300 ${
                expanded ? "opacity-100 delay-[320ms]" : "opacity-0"
              }`}
            >
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
