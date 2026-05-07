/**
 * Blast overpressure radius tests.
 *
 * Reference: Glasstone & Dolan (1977), Table 3.73b (surface burst, 1 kT).
 * Scaled to 15 kT Hiroshima via cube-root law: d = d₁ × 15^(1/3) ≈ d₁ × 2.466
 *
 * Accepted tolerance: ±10% of canonical value.
 */

import { describe, it, expect } from "vitest";
import { computeBlastRings, optimalHobM } from "../blast";

const HIROSHIMA_KT = 15;
const TOL = 0.10; // 10% tolerance

function within(actual: number, expected: number, tol: number) {
  const lo = expected * (1 - tol);
  const hi = expected * (1 + tol);
  return actual >= lo && actual <= hi;
}

describe("computeBlastRings — Hiroshima 15 kt surface burst", () => {
  const rings = computeBlastRings({
    yieldKt: HIROSHIMA_KT,
    burstType: "surface",
    hobM: 0,
  });

  const byPsi = Object.fromEntries(rings.map((r) => [r.psi, r.radiusM]));

  it("returns 5 rings", () => {
    expect(rings).toHaveLength(5);
  });

  it("20 psi ring is approximately 750 m", () => {
    // 305 m × 15^(1/3) ≈ 752 m
    expect(
      within(byPsi[20], 752, TOL),
      `expected ~752 m, got ${byPsi[20].toFixed(0)} m`
    ).toBe(true);
  });

  it("5 psi ring is approximately 2064 m", () => {
    // 837 m × 15^(1/3) ≈ 2064 m
    expect(
      within(byPsi[5], 2064, TOL),
      `expected ~2064 m, got ${byPsi[5].toFixed(0)} m`
    ).toBe(true);
  });

  it("1 psi ring is approximately 6393 m", () => {
    // 2591 m × 15^(1/3) ≈ 6393 m
    expect(
      within(byPsi[1], 6393, TOL),
      `expected ~6393 m, got ${byPsi[1].toFixed(0)} m`
    ).toBe(true);
  });

  it("lower psi threshold has larger radius (1 psi > 2 psi > 5 psi > 10 psi > 20 psi)", () => {
    // Higher overpressure (psi) = more intense = smaller radius
    const sorted = [...rings].sort((a, b) => a.psi - b.psi); // ascending psi: 1,2,5,10,20
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].radiusM).toBeGreaterThan(sorted[i + 1].radiusM);
    }
  });
});

describe("computeBlastRings — scaling sanity", () => {
  it("300 kt produces rings ~(300/15)^(1/3) ≈ 2.71x larger than 15 kt surface burst", () => {
    const r15 = computeBlastRings({ yieldKt: 15, burstType: "surface", hobM: 0 });
    const r300 = computeBlastRings({ yieldKt: 300, burstType: "surface", hobM: 0 });
    const ratio =
      r300.find((r) => r.psi === 5)!.radiusM /
      r15.find((r) => r.psi === 5)!.radiusM;
    const expected = Math.pow(300 / 15, 1 / 3);
    expect(within(ratio, expected, 0.05)).toBe(true);
  });

  it("airburst at optimal HOB produces larger 5 psi radius than surface burst", () => {
    const surface = computeBlastRings({ yieldKt: 15, burstType: "surface", hobM: 0 });
    const airburst = computeBlastRings({
      yieldKt: 15,
      burstType: "airburst",
      hobM: optimalHobM(15),
    });
    expect(airburst.find((r) => r.psi === 5)!.radiusM).toBeGreaterThan(
      surface.find((r) => r.psi === 5)!.radiusM
    );
  });
});

describe("optimalHobM", () => {
  it("returns positive values for all presets", () => {
    for (const kt of [15, 21, 300, 1000]) {
      expect(optimalHobM(kt)).toBeGreaterThan(0);
    }
  });

  it("scales with cube root of yield", () => {
    const h15 = optimalHobM(15);
    const h300 = optimalHobM(300);
    const ratio = h300 / h15;
    const expected = Math.pow(300 / 15, 1 / 3);
    expect(within(ratio, expected, 0.01)).toBe(true);
  });
});
