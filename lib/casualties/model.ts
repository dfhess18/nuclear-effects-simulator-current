/**
 * Casualty estimation model.
 *
 * Methodology: Simulator_Blast_thermal.pdf (30 kT Los Angeles worked example).
 * Population is split into fraction_inside / fraction_outside depending on
 * time of day. Each overpressure annulus has independent mortality and injury
 * rates for each sub-population.
 *
 * Thermal burns are applied to the outdoor population in the burn radius rings,
 * with a line-of-sight occlusion factor of 0.5 (half the outdoor population
 * has direct line-of-sight to the fireball in an urban setting).
 */

import type { BlastRing } from "../physics/blast";
import type { ThermalRing } from "../physics/thermal";
import type { CasualtyEstimate, PopulationSource } from "./types";
import type { TimeOfDay } from "../physics/types";

// Inside / outside fraction by time of day
// Source: Simulator_Blast_thermal.pdf — "weekday morning" uses 50/50
const INSIDE_FRACTION: Record<TimeOfDay, number> = {
  day: 0.5,
  night: 0.7,
};

// Per-ring mortality & injury fractions [inside, outside]
// Source: Simulator_Blast_thermal.pdf §§ Casualties, adapted from 30 kT LA example
interface RingFractions {
  insideMort: number;
  outsideMort: number;
  insideInj: number;
  outsideInj: number;
}

const BLAST_FRACTIONS: Record<number, RingFractions> = {
  20: { insideMort: 1.0, outsideMort: 1.0, insideInj: 0.0, outsideInj: 0.0 },
  10: { insideMort: 0.9, outsideMort: 0.5, insideInj: 0.1, outsideInj: 0.5 },
  5: { insideMort: 0.5, outsideMort: 0.05, insideInj: 0.5, outsideInj: 0.475 },
  2: { insideMort: 0.1, outsideMort: 0.05, insideInj: 0.4, outsideInj: 0.95 },
  1: { insideMort: 0.01, outsideMort: 0.0, insideInj: 0.3, outsideInj: 0.8 },
};

// Fraction of outdoor population exposed to direct thermal pulse (line-of-sight)
const THERMAL_LOS_FRACTION = 0.5;

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Integrate population density over an annulus using a simple grid sample.
 * Resolution: 0.25 km² cells.
 */
function annulusPopulation(
  centerLat: number,
  centerLng: number,
  innerRadiusM: number,
  outerRadiusM: number,
  source: PopulationSource
): number {
  const outerKm = outerRadiusM / 1000;
  const innerKm = innerRadiusM / 1000;

  // Convert km to degrees (approximate)
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);

  const stepKm = 0.5;
  let total = 0;
  const halfSpan = outerKm + stepKm;

  for (let dLat = -halfSpan; dLat <= halfSpan; dLat += stepKm) {
    for (let dLng = -halfSpan; dLng <= halfSpan; dLng += stepKm) {
      const lat = centerLat + dLat / kmPerDegLat;
      const lng = centerLng + dLng / kmPerDegLng;
      const dist = haversineDistanceKm(centerLat, centerLng, lat, lng);
      if (dist >= innerKm && dist < outerKm) {
        total += source.getDensityAt(lat, lng) * stepKm * stepKm;
      }
    }
  }
  return total;
}

export function computeCasualties(
  blastRings: BlastRing[],
  thermalRings: ThermalRing[],
  groundZero: { lat: number; lng: number },
  timeOfDay: TimeOfDay,
  source: PopulationSource
): CasualtyEstimate {
  const sorted = [...blastRings].sort((a, b) => a.radiusM - b.radiusM);
  const fIn = INSIDE_FRACTION[timeOfDay];
  const fOut = 1 - fIn;

  let totalFatalities = 0;
  let blastInjuries = 0;
  let totalAffectedAreaKm2 = 0;

  // Blast casualties per annulus
  for (let i = 0; i < sorted.length; i++) {
    const ring = sorted[i];
    const innerR = i === 0 ? 0 : sorted[i - 1].radiusM;
    const outerR = ring.radiusM;

    const population = annulusPopulation(
      groundZero.lat,
      groundZero.lng,
      innerR,
      outerR,
      source
    );

    const fracs = BLAST_FRACTIONS[ring.psi];
    const dead =
      (fIn * fracs.insideMort + fOut * fracs.outsideMort) * population;
    const injured =
      (fIn * fracs.insideInj + fOut * fracs.outsideInj) * population;

    totalFatalities += dead;
    blastInjuries += injured;
    totalAffectedAreaKm2 += Math.PI * (outerR / 1000) ** 2;
  }

  // Thermal burn injuries (outdoor, line-of-sight, 1st and 2nd degree zones
  // that extend beyond the 5 psi lethal blast ring)
  const blast5psiRadius = sorted.find((r) => r.psi === 5)?.radiusM ?? 0;
  let burnInjuries = 0;

  for (const tRing of thermalRings) {
    if (tRing.radiusM <= blast5psiRadius) continue; // already counted in blast
    const innerR = blast5psiRadius;
    const outerR = tRing.radiusM;
    if (outerR <= innerR) continue;

    const population = annulusPopulation(
      groundZero.lat,
      groundZero.lng,
      innerR,
      outerR,
      source
    );

    const exposed = fOut * THERMAL_LOS_FRACTION * population;
    if (tRing.degree === 3) {
      totalFatalities += exposed * 0.85;
      burnInjuries += exposed * 0.15;
    } else if (tRing.degree === 2) {
      burnInjuries += exposed * 0.8;
    } else {
      burnInjuries += exposed * 0.5;
    }
  }

  // Radiation injuries (prompt — typically minor contribution at large yields)
  // Stubbed as 0 for v1 because radiation rings are suppressed at W > 50 kt
  const radiationInjuries = 0;

  const roundTo = (n: number, digits: number) => {
    const f = Math.pow(10, digits);
    return Math.round(n / f) * f;
  };

  const fat = roundTo(totalFatalities, 2);
  const inj = roundTo(blastInjuries + burnInjuries, 2);

  const narrative = buildNarrative(
    fat,
    inj,
    totalAffectedAreaKm2,
    blastRings[0]?.casualtyRateInner ?? 0
  );

  return {
    fatalities: fat,
    injuriesBlast: roundTo(blastInjuries, 2),
    injuriesBurns: roundTo(burnInjuries, 2),
    injuriesRadiation: radiationInjuries,
    affectedAreaKm2: Math.round(totalAffectedAreaKm2 * 10) / 10,
    narrative,
  };
}

function buildNarrative(
  fatalities: number,
  injuries: number,
  areaKm2: number,
  _maxCasualtyRate: number
): string {
  const fmt = (n: number) =>
    n >= 1e6
      ? `${(n / 1e6).toFixed(1)} million`
      : n >= 1e3
        ? `${Math.round(n / 100) / 10}k`
        : n.toLocaleString();

  return (
    `The detonation would affect approximately ${areaKm2.toLocaleString()} km². ` +
    `Estimated fatalities: ${fmt(fatalities)}. ` +
    `An additional ${fmt(injuries)} people would sustain serious injuries from blast ` +
    `overpressure, thermal burns, or flying debris. ` +
    `These estimates assume a spatially-varying population density model and ` +
    `do not account for evacuation, sheltering, or emergency response.`
  );
}
