/**
 * Prompt ionizing radiation dose calculations.
 *
 * Physics: Glasstone & Dolan, "Effects of Nuclear Weapons" (1977), Chapter 8.
 * Dose model (simplified exponential attenuation):
 *   D(d) = D₀ × W × exp(−d / λ) / d²   [rem]
 *
 * Where:
 *   D₀ = 3.0 × 10⁹ rem·m²/kT  — normalization constant (Glasstone §8.42)
 *   λ  = 600 m                 — mean free path of prompt gamma in air at STP
 *   W  = yield in kT
 *   d  = slant range in meters
 *
 * Dose thresholds (Glasstone Chapter 8):
 *   600 rem — highly lethal (>95% mortality within 30 days)
 *   450 rem — LD50 (50% mortality within 30 days)
 *   100 rem — onset of acute radiation syndrome (ARS)
 *
 * Radiation rings are suppressed when the 100 rem radius falls inside the
 * 2 psi blast ring, because blast/thermal effects dominate at those distances.
 * This occurs at approximately W > 50 kT for optimal airburst HOB.
 */

import type { WeaponSpec } from "./types";
import { computeBlastRings } from "./blast";

export interface RadiationRing {
  rem: number;
  radiusM: number;
  color: string;
  thresholdLabel: string;
  physicalDescription: string;
  casualtyRateInner: number;
}

// D₀: normalization constant [rem·m²/kT], from Glasstone §8.42
const D0 = 3.0e9;
// λ: mean free path of prompt gamma [m]
const LAMBDA = 600;

const REM_THRESHOLDS = [600, 450, 100] as const;

const RADIATION_COLORS: Record<number, string> = {
  600: "#1B6FA8",
  450: "#3A9ED4",
  100: "#80CAF0",
};

const RADIATION_DESCRIPTIONS: Record<number, string> = {
  600: "600 rem — highly lethal dose; >95% mortality within 30 days",
  450: "450 rem — LD50; 50% mortality within 30 days without treatment",
  100: "100 rem — onset of acute radiation syndrome; nausea, fatigue, increased cancer risk",
};

const RADIATION_CASUALTY_RATES: Record<number, number> = {
  600: 0.95,
  450: 0.5,
  100: 0.05,
};

/**
 * Solve D(d) = D_threshold for d numerically (bisection).
 * Closed-form inversion of D = D₀ × W × exp(−d/λ) / d² is not tractable.
 */
function solveRadius(yieldKt: number, doseLimitRem: number): number {
  const f = (d: number) => (D0 * yieldKt * Math.exp(-d / LAMBDA)) / (d * d);

  // Fast check: if dose at 10 m is below threshold, weapon is very small
  if (f(10) < doseLimitRem) return 0;

  let lo = 1;
  let hi = 50000; // 50 km upper bound
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > doseLimitRem) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Returns radiation rings, or an empty array if radiation effects are
 * swamped by blast at all relevant ranges.
 */
export function computeRadiationRings(weapon: WeaponSpec): RadiationRing[] {
  const blastRings = computeBlastRings(weapon);
  // Suppress radiation rings only when they fall inside the 5 psi blast radius.
  // People inside 5 psi generally do not survive; showing radiation rings there
  // would imply a survivable radiation hazard where none exists.
  const blast5psiRadius = blastRings.find((r) => r.psi === 5)?.radiusM ?? 0;

  const rings: RadiationRing[] = REM_THRESHOLDS.map((rem) => ({
    rem,
    radiusM: solveRadius(weapon.yieldKt, rem),
    color: RADIATION_COLORS[rem],
    thresholdLabel: `${rem} rem`,
    physicalDescription: RADIATION_DESCRIPTIONS[rem],
    casualtyRateInner: RADIATION_CASUALTY_RATES[rem],
  }));

  // Hide all radiation rings when even the 100 rem radius is inside the 5 psi zone.
  const outerRadiation = rings.find((r) => r.rem === 100)?.radiusM ?? 0;
  if (outerRadiation <= blast5psiRadius) return [];

  return rings.filter((r) => r.radiusM > blast5psiRadius * 0.5);
}
