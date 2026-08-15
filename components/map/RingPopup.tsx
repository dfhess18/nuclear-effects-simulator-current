"use client";

import { formatRadius, ratePct } from "./format";
import type { RingPopupData } from "./types";

/**
 * Contents of the ring hover callout.
 *
 * Deliberately imports nothing from mapbox-gl — Map.tsx portals this into a
 * detached node that a mapboxgl.Popup owns. That keeps it inside the app's
 * React tree (and therefore its theme and design tokens), which the previous
 * HTML-template-string popup could not be.
 */
export function RingPopup({ ring }: { ring: RingPopupData }) {
  const { km, mi } = formatRadius(ring.radiusM);

  return (
    <div className="w-[228px] p-3 font-sans">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: ring.color }}
          aria-hidden="true"
        />
        <p className="text-[13px] font-semibold text-popover-foreground">
          {ring.thresholdLabel}
        </p>
      </div>

      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
        {ring.physicalDescription}
      </p>

      <dl className="mt-2.5 space-y-1 border-t border-border pt-2 text-[11px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Ground radius</dt>
          <dd className="font-medium tabular-nums text-popover-foreground">
            {km} · {mi}
          </dd>
        </div>
        {ring.casualtyRateInner > 0 && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Fatality rate inside</dt>
            <dd className="font-medium tabular-nums text-popover-foreground">
              {ratePct(ring.casualtyRateInner)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
