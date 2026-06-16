"use client";

import { Badge } from "@/components/ui/badge";
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
    <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
          Estimated effects
        </span>
        <Badge variant="outline" className="text-[10px] font-normal text-slate-500 dark:text-zinc-400 px-1.5 py-0">
          {yieldKt >= 1000 ? `${yieldKt / 1000} Mt` : `${yieldKt} kt`}
        </Badge>
      </div>

      <Stat
        label="Fatalities"
        value={populationLoading ? dash : fmt(casualties!.fatalities)}
        accent="text-slate-900 dark:text-zinc-100"
      />
      <Stat
        label="Blast injuries"
        value={populationLoading ? dash : fmt(casualties!.injuriesBlast)}
        accent="text-purple-700 dark:text-purple-400"
      />
      <Stat
        label="Burn injuries"
        value={populationLoading ? dash : fmt(casualties!.injuriesBurns)}
        accent="text-amber-700 dark:text-amber-400"
      />
      <Stat
        label="Affected area"
        value={populationLoading ? dash : `${casualties!.affectedAreaKm2.toLocaleString()} km²`}
        accent="text-slate-600 dark:text-zinc-400"
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className="text-[11px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">{label}:</span>
      <span className={`text-sm font-semibold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}
