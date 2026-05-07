/**
 * Thermal radiation (fireball) effect radius calculations.
 *
 * Physics: Glasstone & Dolan, "Effects of Nuclear Weapons" (1977), Chapter 7.
 * Fluence model (eq. 7.86 form):
 *   Q(d) = f_T × Y_J / (4π d²) × τ(weather)   [J/m²]
 *
 * Where:
 *   f_T = 0.35  — fraction of weapon yield deposited as thermal radiation
 *                 (Glasstone §1.66; typical fission/fusion weapon)
 *   Y_J         — yield in joules  (1 kT = 4.184 × 10¹² J)
 *   d           — slant range in meters
 *   τ           — atmospheric transmission (visibility-dependent)
 *
 * Burn thresholds from Glasstone Table 12.17 (sea-level, clear-sky reference):
 *   3rd degree (full-thickness): 25 J/cm²  (≈ 6 cal/cm²)
 *   2nd degree (partial):        12.5 J/cm² (≈ 3 cal/cm²)
 *   1st degree (erythema):       6 J/cm²   (≈ 1.5 cal/cm²)
 *
 * Atmospheric transmission (Simulator_Blast_thermal.pdf methodology):
 *   Clear   τ = 0.90
 *   Hazy    τ = 0.60
 *   Overcast τ = 0.30
 */

import type { WeaponSpec, Weather } from "./types";

export interface ThermalRing {
  degree: 1 | 2 | 3;
  radiusM: number;
  color: string;
  thresholdLabel: string;
  physicalDescription: string;
  casualtyRateInner: number;
}

const KT_TO_JOULES = 4.184e12;
const THERMAL_FRACTION = 0.35;

// Thresholds in J/m² (converted from J/cm²: multiply by 1e4).
// Values calibrated against NUKEMAP (Wellerstein, 2013) for mixed skin types.
// Glasstone (1977) Table 12.17 gives minimum thresholds for light skin (6 cal/cm² 3rd degree);
// for a representative population average, higher values (~12 cal/cm²) are appropriate.
const BURN_THRESHOLDS_J_M2: Record<1 | 2 | 3, number> = {
  3: 50 * 1e4,  // ~12 cal/cm² — 3rd degree, average skin type
  2: 25 * 1e4,  // ~6 cal/cm²  — 2nd degree
  1: 10 * 1e4,  // ~2.4 cal/cm² — 1st degree erythema
};

const TRANSMISSION: Record<Weather, number> = {
  clear: 0.90,
  hazy: 0.60,
  overcast: 0.30,
};

const THERMAL_COLORS: Record<1 | 2 | 3, string> = {
  3: "#C8520A",
  2: "#E88535",
  1: "#F5B96B",
};

const THERMAL_DESCRIPTIONS: Record<1 | 2 | 3, string> = {
  3: "3rd degree burns — full-thickness skin destruction; fatal without treatment",
  2: "2nd degree burns — blistering; serious injury requiring medical care",
  1: "1st degree burns — erythema (sunburn-equivalent); painful but survivable",
};

const THERMAL_CASUALTY_RATES: Record<1 | 2 | 3, number> = {
  3: 0.85,
  2: 0.30,
  1: 0.05,
};

/**
 * Invert the fluence equation to find the radius at which Q equals a threshold.
 *   Q_threshold = f_T × Y_J × τ / (4π d²)
 *   d = sqrt(f_T × Y_J × τ / (4π × Q_threshold))
 */
function burnRadius(
  yieldKt: number,
  weather: Weather,
  degreeKey: 1 | 2 | 3
): number {
  const Y_J = yieldKt * KT_TO_JOULES;
  const tau = TRANSMISSION[weather];
  const Q = BURN_THRESHOLDS_J_M2[degreeKey];
  return Math.sqrt((THERMAL_FRACTION * Y_J * tau) / (4 * Math.PI * Q));
}

export function computeThermalRings(
  weapon: WeaponSpec,
  weather: Weather
): ThermalRing[] {
  const degrees: Array<1 | 2 | 3> = [3, 2, 1];
  return degrees.map((degree) => ({
    degree,
    radiusM: burnRadius(weapon.yieldKt, weather, degree),
    color: THERMAL_COLORS[degree],
    thresholdLabel:
      degree === 3
        ? "3rd degree burns"
        : degree === 2
          ? "2nd degree burns"
          : "1st degree burns",
    physicalDescription: THERMAL_DESCRIPTIONS[degree],
    casualtyRateInner: THERMAL_CASUALTY_RATES[degree],
  }));
}
