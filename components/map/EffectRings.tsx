"use client";

import { Circle, Tooltip } from "react-leaflet";
import type { EffectRing } from "../../lib/physics/types";

interface EffectRingsProps {
  rings: EffectRing[];
  groundZero: { lat: number; lng: number };
}

export function EffectRings({ rings, groundZero }: EffectRingsProps) {
  return (
    <>
      {rings.map((ring) => (
        <Circle
          key={`${ring.category}-${ring.thresholdLabel}`}
          center={[groundZero.lat, groundZero.lng]}
          radius={ring.radiusM}
          pathOptions={{
            color: ring.color,
            fillColor: ring.color,
            fillOpacity: ring.fillOpacity,
            weight: 1.5,
            opacity: 0.8,
            className: "effect-ring",
          }}
        >
          <Tooltip sticky direction="auto">
            <div className="text-xs max-w-[200px]">
              <p className="font-semibold">{ring.thresholdLabel}</p>
              <p className="text-slate-600 mt-0.5">{ring.physicalDescription}</p>
              <p className="text-slate-500 mt-0.5">
                Radius: {(ring.radiusM / 1000).toFixed(2)} km /{" "}
                {(ring.radiusM / 1609.34).toFixed(2)} mi
              </p>
              {ring.casualtyRateInner > 0 && (
                <p className="text-slate-500">
                  Est. fatality rate inside:{" "}
                  {Math.round(ring.casualtyRateInner * 100)}%
                </p>
              )}
            </div>
          </Tooltip>
        </Circle>
      ))}
    </>
  );
}
