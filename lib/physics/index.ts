/**
 * Unified effects computation entry point.
 *
 * Calls blast, thermal, and radiation sub-modules and assembles a single
 * EffectsResult. No Leaflet or map-framework types enter here.
 */

import { computeBlastRings } from "./blast";
import { computeThermalRings } from "./thermal";
import { computeRadiationRings } from "./radiation";
import type { WeaponSpec, Conditions, EffectRing, EffectsResult } from "./types";
import { computeCasualties } from "../casualties/model";
import { bostonPopulation } from "../cities/boston";

export { optimalHobM } from "./blast";
export type { WeaponSpec, Conditions, EffectRing, EffectsResult } from "./types";

export function computeEffects(
  weapon: WeaponSpec,
  conditions: Conditions
): EffectsResult {
  const blastRings = computeBlastRings(weapon);
  const thermalRings = computeThermalRings(weapon, conditions.weather);
  const radiationRings = computeRadiationRings(weapon);

  const rings: EffectRing[] = [
    ...blastRings.map((r) => ({
      radiusM: r.radiusM,
      category: "blast" as const,
      color: r.color,
      fillOpacity: 0.15,
      thresholdLabel: r.thresholdLabel,
      physicalDescription: r.physicalDescription,
      casualtyRateInner: r.casualtyRateInner,
    })),
    ...thermalRings.map((r) => ({
      radiusM: r.radiusM,
      category: "thermal" as const,
      color: r.color,
      fillOpacity: 0.12,
      thresholdLabel: r.thresholdLabel,
      physicalDescription: r.physicalDescription,
      casualtyRateInner: r.casualtyRateInner,
    })),
    ...radiationRings.map((r) => ({
      radiusM: r.radiusM,
      category: "radiation" as const,
      color: r.color,
      fillOpacity: 0.12,
      thresholdLabel: r.thresholdLabel,
      physicalDescription: r.physicalDescription,
      casualtyRateInner: r.casualtyRateInner,
    })),
  ].sort((a, b) => b.radiusM - a.radiusM); // largest first so smaller rings render on top

  const casualties = computeCasualties(
    blastRings,
    thermalRings,
    conditions.groundZero,
    conditions.timeOfDay,
    bostonPopulation
  );

  return { rings, casualties };
}
