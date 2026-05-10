"use client";

import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

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
    <div className="absolute bottom-8 right-2 z-[1000] bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg min-w-[220px] max-w-[260px] text-xs overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] uppercase tracking-wide">
          Effects legend
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-slate-500 dark:text-zinc-400 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {categories.map((cat) => (
            <div key={cat} className="mb-2 last:mb-0">
              <p className="font-medium text-slate-600 dark:text-zinc-400 mb-1">
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
                    <span className="text-slate-700 dark:text-zinc-300">{ring.thresholdLabel}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
