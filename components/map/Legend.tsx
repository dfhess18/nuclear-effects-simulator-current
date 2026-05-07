"use client";

import type { EffectRing } from "../../lib/physics/types";

interface LegendProps {
  rings: EffectRing[];
}

const CATEGORY_LABELS = {
  blast: "Blast overpressure",
  thermal: "Thermal radiation",
  radiation: "Prompt radiation",
};

export function Legend({ rings }: LegendProps) {
  const byCategory = rings.reduce<Record<string, EffectRing[]>>(
    (acc, ring) => {
      acc[ring.category] = acc[ring.category] ?? [];
      acc[ring.category].push(ring);
      return acc;
    },
    {}
  );

  const categories = (["blast", "thermal", "radiation"] as const).filter(
    (c) => byCategory[c]?.length
  );

  if (categories.length === 0) return null;

  return (
    <div className="absolute bottom-8 right-2 z-[1000] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 min-w-[220px] max-w-[260px] text-xs">
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-[11px] uppercase tracking-wide">
        Effects legend
      </p>
      {categories.map((cat) => (
        <div key={cat} className="mb-2">
          <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">
            {CATEGORY_LABELS[cat]}
          </p>
          {byCategory[cat]
            .sort((a, b) => b.radiusM - a.radiusM)
            .map((ring) => (
              <div
                key={ring.thresholdLabel}
                className="flex items-center gap-2 mb-0.5"
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: ring.color }}
                  aria-hidden="true"
                />
                <span className="text-slate-700 dark:text-slate-300">{ring.thresholdLabel}</span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
