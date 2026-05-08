/**
 * Blast overpressure radius calculations.
 *
 * Physics: Glasstone & Dolan, "Effects of Nuclear Weapons" (1977), §3.66.
 * Cube-root scaling law (eq. 3.66.2): d = d₁ × W^(1/3)
 *   where W is yield in kT and d₁ is the 1 kT reference radius.
 *
 * Reference radii for 1 kT surface burst derived from Glasstone Table 3.73b
 * and confirmed against the MIT Nuclear Weapons Education Project blast calculator
 * (https://nuclearweaponsedproj.mit.edu/nuclear-weapons-blast-effects-calculator/).
 *
 * For airburst, a 2-D lookup table maps (scaledHeight, overpressure) → d₁.
 * Scaled height: h₁ = HOB_m / W^(1/3)  [normalized to 1 kT, meters].
 */

import type { WeaponSpec } from "./types";

export interface BlastRing {
  psi: number;
  /** Ground-range radius (m). For airburst this includes Mach amplification. */
  radiusM: number;
  /** Free-air slant radius (m) of the spherical shock front for this
   *  overpressure. HOB-independent; used for the 3D visualization. */
  sphereRadiusM: number;
  color: string;
  thresholdLabel: string;
  physicalDescription: string;
  /** Conservative peak mortality fraction inside this radius (cumulative). */
  casualtyRateInner: number;
}

// Reference radii (meters) for 1 kT surface burst at each overpressure level.
// Source: Glasstone & Dolan Table 3.73b, scaled per cube-root law.
const SURFACE_1KT_RADII_M: Record<number, number> = {
  20: 305,
  10: 499,
  5: 837,
  2: 1641,
  1: 2591,
};

// 2-D table for airburst: scaledHeight (m/kT^1/3) → {psi: radius_m}
// Source: Glasstone & Dolan Figs. 3.72–3.74 (digitized key contours).
// Row key = scaled HOB in meters (for 1 kT); values = d₁ in meters.
const AIRBURST_TABLE: Array<{
  h1: number;
  radii: Record<number, number>;
}> = [
  // h1 = 0 m (surface-equivalent lower bound for airburst table)
  { h1: 0, radii: { 20: 305, 10: 499, 5: 837, 2: 1641, 1: 2591 } },
  // h1 ≈ 150 m  (shallow airburst)
  { h1: 150, radii: { 20: 330, 10: 540, 5: 900, 2: 1720, 1: 2700 } },
  // h1 ≈ 300 m  (moderate airburst; near optimal for 5 psi at many yields)
  { h1: 300, radii: { 20: 350, 10: 575, 5: 960, 2: 1800, 1: 2820 } },
  // h1 ≈ 500 m  (Hiroshima-class HOB scaled to 1 kT)
  { h1: 500, radii: { 20: 340, 10: 555, 5: 940, 2: 1780, 1: 2790 } },
  // h1 ≈ 700 m  (higher airburst — 5 psi radius begins to fall)
  { h1: 700, radii: { 20: 310, 10: 510, 5: 880, 2: 1700, 1: 2700 } },
  // h1 ≈ 1000 m (very high burst — all overpressure radii shrink)
  { h1: 1000, radii: { 20: 260, 10: 430, 5: 760, 2: 1560, 1: 2550 } },
];

const PSI_THRESHOLDS = [20, 10, 5, 2, 1] as const;

const BLAST_COLORS: Record<number, string> = {
  20: "#7B2D8B",
  10: "#C044D0",
  5: "#E070EA",
  2: "#EFA0F7",
  1: "#F5CCFC",
};

const PHYSICAL_DESCRIPTIONS: Record<number, string> = {
  20: "Reinforced concrete structures severely damaged; virtually all fatalities",
  10: "Most residential buildings collapse; lung damage and debris lethal to most",
  5: "Moderate building collapse; eardrum rupture; windows shatter for miles",
  2: "Light structural damage; projectile glass injures unprotected persons",
  1: "Window breakage; minor blast injuries to exposed persons",
};

const CASUALTY_RATES: Record<number, number> = {
  20: 1.0,
  10: 0.7,
  5: 0.35,
  2: 0.1,
  1: 0.02,
};

/** Linearly interpolate between two airburst table rows. */
function interpolateAirburstRadius(h1: number, psi: number): number {
  const table = AIRBURST_TABLE;
  if (h1 <= table[0].h1) return table[0].radii[psi];
  if (h1 >= table[table.length - 1].h1)
    return table[table.length - 1].radii[psi];

  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i];
    const hi = table[i + 1];
    if (h1 >= lo.h1 && h1 <= hi.h1) {
      const t = (h1 - lo.h1) / (hi.h1 - lo.h1);
      return lo.radii[psi] + t * (hi.radii[psi] - lo.radii[psi]);
    }
  }
  return table[0].radii[psi];
}

/**
 * Compute the scaled height h₁ = HOB_m / W^(1/3), which normalizes any
 * airburst to the equivalent 1 kT burst height for table lookup.
 */
function scaledHeight(hobM: number, yieldKt: number): number {
  return hobM / Math.pow(yieldKt, 1 / 3);
}

/**
 * Compute the ground-range radius (meters) for a given overpressure level.
 *
 * For surface burst: d = d₁_surface × W^(1/3)   (Glasstone eq. 3.66.2)
 * For airburst:      d₁ interpolated from 2-D table at h₁, then d = d₁ × W^(1/3)
 */
function radiusForPsi(psi: number, weapon: WeaponSpec): number {
  const W = weapon.yieldKt;
  const scaleFactor = Math.pow(W, 1 / 3);

  if (weapon.burstType === "surface") {
    const d1 = SURFACE_1KT_RADII_M[psi];
    return d1 * scaleFactor;
  }

  const h1 = scaledHeight(weapon.hobM, W);
  const d1 = interpolateAirburstRadius(h1, psi);
  return d1 * scaleFactor;
}

/**
 * Free-air slant radius (m) at which the given overpressure occurs in
 * unobstructed air around the burst point. Independent of HOB.
 *
 * Source: BlastWave_Physics.pdf and Class 7B notes describe the unreflected
 * shock as propagating *spherically* outward, with Mach reflection modifying
 * only the *ground footprint* — not the free-air shock front itself. The
 * cube-root scaling law (eq. 3.66.2) gives d = d₁ × W^(1/3) for any threshold,
 * where d₁ is the 1-kT reference radius. We use the surface-burst 1-kT radii
 * as the reference: a contact burst is essentially a hemisphere of the same
 * spherical wave, so its ground radius equals the spherical free-air radius
 * for the (effectively coupled) yield. This makes the 3D sphere coincide
 * with the 2D ring when HOB=0, and stay HOB-independent for any airburst.
 */
export function freeAirRadiusM(yieldKt: number, psi: number): number {
  const d1 = SURFACE_1KT_RADII_M[psi];
  return d1 * Math.pow(yieldKt, 1 / 3);
}

export function computeBlastRings(weapon: WeaponSpec): BlastRing[] {
  return PSI_THRESHOLDS.map((psi) => ({
    psi,
    radiusM: radiusForPsi(psi, weapon),
    sphereRadiusM: freeAirRadiusM(weapon.yieldKt, psi),
    color: BLAST_COLORS[psi],
    thresholdLabel: `${psi} psi`,
    physicalDescription: PHYSICAL_DESCRIPTIONS[psi],
    casualtyRateInner: CASUALTY_RATES[psi],
  }));
}

/**
 * Default height of burst (meters) that approximately maximizes the 5 psi
 * coverage radius for a given yield.
 *
 * From Class 7B example: for 500 kT, h = 1.1 mi ≈ 1770 m; scaled h₁ ≈ 220 m.
 * Best-coverage h₁ is empirically ~200–350 m for yields 1–1000 kT.
 * We use h₁ ≈ 280 m → HOB = 280 × W^(1/3).
 */
export function optimalHobM(yieldKt: number): number {
  return Math.round(280 * Math.pow(yieldKt, 1 / 3));
}
