"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CasualtyEstimate } from "@/lib/casualties/types";

/**
 * Single stacked horizontal bar showing the proportion of fatalities vs.
 * blast injuries vs. burn injuries.
 *
 * Colours are pulled from the same palettes the map rings use — slate for
 * fatalities, the blast purple, and the thermal orange — so a reader can
 * connect a segment here to a ring on the map without a lookup. Each entry
 * carries a light/dark pair because the results bar sits on white in light
 * mode and near-black in dark mode.
 */
const chartConfig = {
  fatalities: {
    label: "Fatalities",
    theme: { light: "#334155", dark: "#e4e4e7" },
  },
  injuriesBlast: {
    label: "Blast injuries",
    theme: { light: "#C044D0", dark: "#C044D0" },
  },
  injuriesBurns: {
    label: "Burn injuries",
    theme: { light: "#E88535", dark: "#E88535" },
  },
} satisfies ChartConfig;

const KEYS = ["fatalities", "injuriesBlast", "injuriesBurns"] as const;

/**
 * Legend dot colours, duplicated as literal utility classes.
 * ChartStyle scopes its `--color-*` vars to the ChartContainer element, so the
 * legend — a sibling of that element — can't read them. slate-700/zinc-200
 * are the same hexes the config above uses for fatalities.
 */
const DOT_CLASS: Record<(typeof KEYS)[number], string> = {
  fatalities: "bg-slate-700 dark:bg-zinc-200",
  injuriesBlast: "bg-[#C044D0]",
  injuriesBurns: "bg-[#E88535]",
};

interface Props {
  casualties: CasualtyEstimate;
}

export function CasualtyBreakdownChart({ casualties }: Props) {
  const data = [
    {
      name: "casualties",
      fatalities: casualties.fatalities,
      injuriesBlast: casualties.injuriesBlast,
      injuriesBurns: casualties.injuriesBurns,
    },
  ];

  const total = KEYS.reduce((sum, k) => sum + data[0][k], 0);

  // Nothing to draw — a 0-width stack renders as an empty strip, which reads
  // as a broken chart rather than as "no casualties".
  if (total === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-zinc-500">
        No casualties in range at this yield and location.
      </p>
    );
  }

  return (
    <div>
      {/* aspect-auto + a fixed height: the results bar animates its own height,
          so letting the chart derive one from an aspect ratio would make it
          re-measure on every frame of that transition. */}
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[26px] w-full"
        initialDimension={{ width: 640, height: 26 }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis type="number" domain={[0, total]} hide />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="fatalities"
            stackId="a"
            fill="var(--color-fatalities)"
            radius={[4, 0, 0, 4]}
          />
          <Bar
            dataKey="injuriesBlast"
            stackId="a"
            fill="var(--color-injuriesBlast)"
          />
          <Bar
            dataKey="injuriesBurns"
            stackId="a"
            fill="var(--color-injuriesBurns)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* Inline legend with shares — recharts' own legend has no room for the
          percentages, which are the point of a proportion chart. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {KEYS.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${DOT_CLASS[key]}`}
              aria-hidden="true"
            />
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {chartConfig[key].label}
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-700 dark:text-zinc-300">
              {Math.round((data[0][key] / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
