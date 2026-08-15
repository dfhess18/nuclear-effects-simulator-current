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
 * Blast and burns inherit the map's ring hues so a segment here can be
 * connected to a ring on the map without a lookup. Fatalities leads with MIT
 * crimson.
 *
 * Every value below was picked with scripts/validate_palette.js from the
 * dataviz skill rather than by eye, and both modes pass all six checks under
 * --pairs all. Two things that measurement caught:
 *  - The previous light-mode fatalities slate (#334155) failed the lightness
 *    band AND the chroma floor — it literally "read gray".
 *  - Dark needs its OWN steps, not a flip of light. The brand's dark accent
 *    (#FF5A6F) sits at ΔE 12.6 from the thermal orange, under the hard
 *    normal-vision floor of 15. And the dark band is L 0.48–0.67, so these
 *    are mid-tones, not the pastels dark mode usually wants.
 *
 * Dark's worst CVD pair is ΔE 7.4 (deutan), inside the 6–8 floor band, which
 * is legal only with secondary encoding — hence the direct-labelled legend
 * below and the SEGMENT_GAP between fills. Don't remove either.
 */
const chartConfig = {
  fatalities: {
    label: "Fatalities",
    theme: { light: "#A31F34", dark: "#E8556E" },
  },
  injuriesBlast: {
    label: "Blast injuries",
    theme: { light: "#C044D0", dark: "#CB5AD8" },
  },
  injuriesBurns: {
    label: "Burn injuries",
    theme: { light: "#E88535", dark: "#C9821F" },
  },
} satisfies ChartConfig;

/** Surface-coloured gap between stacked fills, in px. Secondary encoding. */
const SEGMENT_GAP = 2;

const KEYS = ["fatalities", "injuriesBlast", "injuriesBurns"] as const;

/**
 * Legend dot colours, duplicated as literal utility classes.
 * ChartStyle scopes its `--color-*` vars to the ChartContainer element, so the
 * legend — a sibling of that element — can't read them. Keep these in step
 * with chartConfig above.
 */
const DOT_CLASS: Record<(typeof KEYS)[number], string> = {
  fatalities: "bg-brand dark:bg-[#E8556E]",
  injuriesBlast: "bg-[#C044D0] dark:bg-[#CB5AD8]",
  injuriesBurns: "bg-[#E88535] dark:bg-[#C9821F]",
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
          {/* The stroke is painted in the surface colour, which is how the
              2px gap between fills is achieved — recharts has no gap option
              for stacked segments. Rounded ends only on the outer two so the
              stack still reads as one bar. */}
          <Bar
            dataKey="fatalities"
            stackId="a"
            fill="var(--color-fatalities)"
            radius={[4, 0, 0, 4]}
            stroke="var(--color-background)"
            strokeWidth={SEGMENT_GAP}
          />
          <Bar
            dataKey="injuriesBlast"
            stackId="a"
            fill="var(--color-injuriesBlast)"
            stroke="var(--color-background)"
            strokeWidth={SEGMENT_GAP}
          />
          <Bar
            dataKey="injuriesBurns"
            stackId="a"
            fill="var(--color-injuriesBurns)"
            radius={[0, 4, 4, 0]}
            stroke="var(--color-background)"
            strokeWidth={SEGMENT_GAP}
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
