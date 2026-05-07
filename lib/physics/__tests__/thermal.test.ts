/**
 * Thermal radiation burn radius tests.
 *
 * Reference: Glasstone & Dolan (1977), Chapter 7; NUKEMAP (Wellerstein, 2013).
 * Thresholds calibrated to average mixed skin type (not minimum/light-skin values).
 * For 15 kt clear-sky:
 *   3rd degree burns at ~1,770 m  (matches NUKEMAP)
 *   1st degree burns at ~3,960 m  (matches NUKEMAP)
 *
 * Tolerance: ±15% (thermal model has higher uncertainty than blast).
 */

import { describe, it, expect } from "vitest";
import { computeThermalRings } from "../thermal";

const TOL = 0.15;

function within(actual: number, expected: number, tol: number) {
  return actual >= expected * (1 - tol) && actual <= expected * (1 + tol);
}

describe("computeThermalRings — 15 kt, clear sky", () => {
  const rings = computeThermalRings(
    { yieldKt: 15, burstType: "airburst", hobM: 600 },
    "clear"
  );

  const byDegree = Object.fromEntries(rings.map((r) => [r.degree, r.radiusM]));

  it("returns 3 rings (3rd, 2nd, 1st degree)", () => {
    expect(rings).toHaveLength(3);
  });

  it("3rd degree burn radius is approximately 1,770 m (NUKEMAP reference)", () => {
    expect(
      within(byDegree[3], 1770, TOL),
      `expected ~1770 m, got ${byDegree[3].toFixed(0)} m`
    ).toBe(true);
  });

  it("1st degree burn radius is approximately 3,960 m (NUKEMAP reference)", () => {
    expect(
      within(byDegree[1], 3960, TOL),
      `expected ~3960 m, got ${byDegree[1].toFixed(0)} m`
    ).toBe(true);
  });

  it("rings ordered 3rd < 2nd < 1st by radius (more severe = smaller zone)", () => {
    expect(byDegree[3]).toBeLessThan(byDegree[2]);
    expect(byDegree[2]).toBeLessThan(byDegree[1]);
  });
});

describe("computeThermalRings — weather attenuation", () => {
  it("overcast produces smaller radii than clear sky (30% vs 90% transmission)", () => {
    const weapon = { yieldKt: 300, burstType: "airburst" as const, hobM: 2000 };
    const clear = computeThermalRings(weapon, "clear");
    const overcast = computeThermalRings(weapon, "overcast");

    for (const deg of [1, 2, 3] as const) {
      const rClear = clear.find((r) => r.degree === deg)!.radiusM;
      const rOvercast = overcast.find((r) => r.degree === deg)!.radiusM;
      expect(rClear).toBeGreaterThan(rOvercast);
    }
  });

  it("radius scales as sqrt(tau) when transmission changes", () => {
    // Q = f*Y*tau/(4pi*d^2), invert: d = sqrt(f*Y*tau/(4pi*Q))
    // ratio of radii = sqrt(tau_clear / tau_overcast) = sqrt(0.9/0.3) = sqrt(3) ≈ 1.732
    const weapon = { yieldKt: 15, burstType: "surface" as const, hobM: 0 };
    const clear = computeThermalRings(weapon, "clear");
    const overcast = computeThermalRings(weapon, "overcast");

    const rClear = clear.find((r) => r.degree === 2)!.radiusM;
    const rOvercast = overcast.find((r) => r.degree === 2)!.radiusM;
    const ratio = rClear / rOvercast;
    const expected = Math.sqrt(0.9 / 0.3);

    expect(Math.abs(ratio - expected)).toBeLessThan(0.01);
  });
});

describe("computeThermalRings — scaling with yield", () => {
  it("1 Mt produces burn radii sqrt(1000/15) ≈ 8.16x larger than 15 kt", () => {
    const w15 = computeThermalRings(
      { yieldKt: 15, burstType: "surface", hobM: 0 },
      "clear"
    );
    const w1mt = computeThermalRings(
      { yieldKt: 1000, burstType: "surface", hobM: 0 },
      "clear"
    );
    const ratio =
      w1mt.find((r) => r.degree === 2)!.radiusM /
      w15.find((r) => r.degree === 2)!.radiusM;
    const expected = Math.sqrt(1000 / 15);
    expect(Math.abs(ratio - expected)).toBeLessThan(0.01);
  });
});
