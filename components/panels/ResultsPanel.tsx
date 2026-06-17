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

  return (
    <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Compact bar — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-x-6 gap-y-1 flex-wrap px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Estimated effects
          </span>
          <Badge variant="outline" className="text-[10px] font-normal text-slate-500 dark:text-zinc-400 px-1.5 py-0">
            {yieldKt >= 1000 ? `${yieldKt / 1000} Mt` : `${yieldKt} kt`}
          </Badge>
        </div>

        <InlineStat
          label="Fatalities"
          value={populationLoading ? dash : fmt(casualties!.fatalities)}
          accent="text-slate-900 dark:text-zinc-100"
        />
        <InlineStat
          label="Blast injuries"
          value={populationLoading ? dash : fmt(casualties!.injuriesBlast)}
          accent="text-purple-700 dark:text-purple-400"
        />
        <InlineStat
          label="Burn injuries"
          value={populationLoading ? dash : fmt(casualties!.injuriesBurns)}
          accent="text-amber-700 dark:text-amber-400"
        />
        <InlineStat
          label="Affected area"
          value={populationLoading ? dash : `${casualties!.affectedAreaKm2.toLocaleString()} km²`}
          accent="text-slate-600 dark:text-zinc-400"
        />

        {/* Expand/collapse chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`ml-auto shrink-0 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
          aria-hidden="true"
        >
          <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded detail view */}
      {expanded && (
        <div className="px-6 pb-4 pt-1 border-t border-slate-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 mt-3">
            <StatCard
              label="Fatalities"
              value={populationLoading ? dash : fmt(casualties!.fatalities)}
              accent="text-slate-900 dark:text-zinc-100"
            />
            <StatCard
              label="Blast injuries"
              value={populationLoading ? dash : fmt(casualties!.injuriesBlast)}
              accent="text-purple-700 dark:text-purple-400"
            />
            <StatCard
              label="Burn injuries"
              value={populationLoading ? dash : fmt(casualties!.injuriesBurns)}
              accent="text-amber-700 dark:text-amber-400"
            />
            <StatCard
              label="Affected area"
              value={populationLoading ? dash : `${casualties!.affectedAreaKm2.toLocaleString()} km²`}
              accent="text-slate-600 dark:text-zinc-400"
            />
          </div>

          <Separator className="mb-3" />

          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            {populationLoading ? "Loading population data…" : casualties!.narrative}
          </p>

          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
            All figures are rough estimates using a zone-based population density model.
            Actual casualties would depend on time of day, sheltering, building density,
            evacuation, and emergency response.
          </p>
        </div>
      )}
    </div>
  );
}

function InlineStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">{label}:</span>
      <span className={`text-sm font-semibold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
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
