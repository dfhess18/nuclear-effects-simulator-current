"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      {/* Expanded detail — grows upward above the bar. The grid 0fr → 1fr
          trick animates height-to-auto smoothly; the inner wrapper hides
          overflow so children collapse cleanly. Opacity is tied to the same
          state so the cards cross-fade with the bar's inline numbers. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-6 pt-4 transition-opacity duration-300 ${
              expanded ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {stats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            <Separator className="mb-3" />

            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {populationLoading
                ? "Loading population data…"
                : casualties!.narrative}
            </p>

            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
              All figures are rough estimates using a zone-based population
              density model. Actual casualties would depend on time of day,
              sheltering, building density, evacuation, and emergency response.
            </p>
          </div>
        </div>
      </div>

      {/* Compact bar — always at the bottom, acts as the toggle. The inline
          stats fade out as the cards above fade in, so the numbers are never
          shown twice. They keep their layout space so the bar doesn't reflow. */}
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

        <div
          className={`flex items-center gap-x-6 gap-y-1 flex-wrap transition-opacity duration-200 ${
            expanded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {stats.map((s) => (
            <InlineStat key={s.label} {...s} />
          ))}
        </div>

        {/* Expand/collapse chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`ml-auto shrink-0 text-slate-400 dark:text-zinc-500 transition-transform duration-300 ${
            expanded ? "" : "rotate-180"
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
    </div>
  );
}

function InlineStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">
        {label}:
      </span>
      <span className={`text-sm font-semibold tabular-nums ${accent}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="border-slate-200 dark:border-zinc-700">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p className={`text-lg font-semibold tabular-nums ${accent}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
