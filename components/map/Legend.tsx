"use client";

import { useState, type CSSProperties } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ratePct } from "./format";
import type { EffectRing } from "../../lib/physics/types";

interface LegendProps {
  rings: EffectRing[];
}

const CATEGORY_LABELS = {
  blast: "Blast overpressure",
  thermal: "Thermal radiation",
  radiation: "Prompt radiation",
};

// Shared easing/duration so the legend matches the ResultsPanel transition.
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DUR = 450;

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
          className={`text-slate-500 dark:text-zinc-400 transition-transform ${collapsed ? "rotate-180" : ""}`}
          style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
          aria-hidden="true"
        >
          <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Smooth reveal via grid 0fr->1fr height-to-auto, matching ResultsPanel. */}
      <div
        className="grid"
        style={{
          gridTemplateRows: collapsed ? "0fr" : "1fr",
          transition: `grid-template-rows ${DUR}ms ${EASE}`,
        }}
      >
        <div className="overflow-hidden">
          <div
            className="px-3 pb-3"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: `opacity ${DUR}ms ${EASE}`,
              transitionDelay: collapsed ? "0ms" : "80ms",
            }}
          >
            {categories.map((cat) => (
              <div key={cat} className="mb-2 last:mb-0">
                <p className="font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  {CATEGORY_LABELS[cat]}
                </p>
                {byCategory[cat]
                  .sort((a, b) => b.radiusM - a.radiusM)
                  .map((ring) => (
                    <Tooltip key={ring.thresholdLabel}>
                      {/* render={<div/>} because the row contains block-level
                          content (the Progress track), which a <button> — the
                          trigger's default element — may not legally wrap.
                          tabIndex keeps the description keyboard-reachable. */}
                      <TooltipTrigger
                        render={<div />}
                        tabIndex={0}
                        className="w-full mb-1.5 last:mb-0 -mx-1 px-1 py-0.5 rounded cursor-help outline-none hover:bg-slate-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-zinc-500 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: ring.color }}
                            aria-hidden="true"
                          />
                          <span className="text-slate-700 dark:text-zinc-300 truncate">
                            {ring.thresholdLabel}
                          </span>
                          <span className="ml-auto text-[10px] tabular-nums text-slate-400 dark:text-zinc-500 flex-shrink-0">
                            {ratePct(ring.casualtyRateInner)}
                          </span>
                        </div>
                        {/* Severity bar — the inner fatality rate for this
                            threshold. Coloured with the ring's own hex via a
                            CSS var, since Tailwind can't generate a class from
                            a runtime value. */}
                        <Progress
                          value={ring.casualtyRateInner * 100}
                          aria-label={`${ring.thresholdLabel} fatality rate`}
                          className="gap-0 mt-1 pl-5 [&_[data-slot=progress-track]]:h-[3px] [&_[data-slot=progress-indicator]]:bg-[var(--ring-color)]"
                          style={
                            { "--ring-color": ring.color } as CSSProperties
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        align="center"
                        className="max-w-[260px] flex-col items-start gap-1 py-2 text-left"
                      >
                        <span className="font-semibold">
                          {ring.thresholdLabel}
                        </span>
                        <span className="opacity-80 leading-snug">
                          {ring.physicalDescription}
                        </span>
                        <span className="opacity-60 tabular-nums">
                          Ground radius {(ring.radiusM / 1000).toFixed(2)} km ·{" "}
                          {ratePct(ring.casualtyRateInner)} fatality rate inside
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
