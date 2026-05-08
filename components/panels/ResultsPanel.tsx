"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CasualtyEstimate } from "@/lib/casualties/types";

interface ResultsPanelProps {
  casualties: CasualtyEstimate | null;
  groundZeroPlaced: boolean;
  yieldKt: number;
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
}: ResultsPanelProps) {
  if (!groundZeroPlaced) {
    return (
      <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-6 py-4 text-center">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Click a city on the map to get started, or click anywhere to place ground zero.
        </p>
      </div>
    );
  }

  if (!casualties) return null;

  return (
    <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Estimated effects
          </h2>
          <Badge variant="outline" className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
            {yieldKt >= 1000 ? `${yieldKt / 1000} Mt` : `${yieldKt} kt`}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Fatalities"
            value={fmt(casualties.fatalities)}
            accent="text-slate-900 dark:text-zinc-100"
          />
          <StatCard
            label="Blast injuries"
            value={fmt(casualties.injuriesBlast)}
            accent="text-purple-700 dark:text-purple-400"
          />
          <StatCard
            label="Burn injuries"
            value={fmt(casualties.injuriesBurns)}
            accent="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            label="Affected area"
            value={`${casualties.affectedAreaKm2.toLocaleString()} km²`}
            accent="text-slate-600 dark:text-zinc-400"
          />
        </div>

        <Separator className="mb-3" />

        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {casualties.narrative}
        </p>

        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
          All figures are rough estimates using a zone-based population density model.
          Actual casualties would depend on time of day, sheltering, building density,
          evacuation, and emergency response.
        </p>
      </div>
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
