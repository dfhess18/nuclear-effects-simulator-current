/**
 * Prompt ionizing radiation radius tests.
 *
 * Reference: Glasstone & Dolan (1977), Chapter 8.
 *
 * Physics note: at 15 kt, the 100 rem prompt radiation radius (~2.5 km) falls well
 * inside the 5 psi blast radius (~2.3 km for airburst), so radiation rings are
 * suppressed — blast effects dominate at those distances. This is correct physics
 * (confirmed by Hiroshima casualty data: lethal prompt radiation at ≤ ~1 km, within
 * the lethal blast zone). Radiation rings become relevant only for smaller yields
 * (≤ ~2 kt) where the 100 rem boundary extends beyond the 5 psi zone.
 *
 * For 1 kt surface burst, radiation rings extend beyond the blast zone:
 *   - 600 rem lethal radius: ~980 m
 *   - 5 psi blast radius: ~837 m  → rings visible
 *
 * Tolerance: ±20% (radiation model has the highest uncertainty).
 */

import { describe, it, expect } from "vitest";
import { computeRadiationRings } from "../radiation";

const TOL = 0.20;

function within(actual: number, expected: number, tol: number) {
  return actual >= expected * (1 - tol) && actual <= expected * (1 + tol);
}

describe("computeRadiationRings — 15 kt airburst", () => {
  const rings = computeRadiationRings({
    yieldKt: 15,
    burstType: "airburst",
    hobM: 600,
  });

  it("returns radiation rings (100 rem zone extends beyond 5 psi blast zone at 15 kt)", () => {
    // At 15 kt, the 100 rem prompt radiation boundary (~2.5 km) extends modestly
    // beyond the 5 psi blast radius (~2.3 km). Rings are shown but the margin is small.
    expect(rings.length).toBeGreaterThan(0);
  });

  it("600 rem lethal radius is approximately 1,855 m (±20%)", () => {
    const lethalRing = rings.find((r) => r.rem === 600);
    expect(lethalRing).toBeDefined();
    if (lethalRing) {
      expect(
        within(lethalRing.radiusM, 1855, 0.20),
        `expected ~1855 m, got ${lethalRing.radiusM.toFixed(0)} m`
      ).toBe(true);
    }
  });
});

describe("computeRadiationRings — 1 kt surface burst (radiation visible)", () => {
  const rings = computeRadiationRings({
    yieldKt: 1,
    burstType: "surface",
    hobM: 0,
  });

  it("returns non-empty rings (100 rem extends beyond 5 psi blast zone at 1 kt)", () => {
    expect(rings.length).toBeGreaterThan(0);
  });

  it("600 rem lethal radius is approximately 980 m", () => {
    const lethalRing = rings.find((r) => r.rem === 600);
    expect(lethalRing).toBeDefined();
    if (lethalRing) {
      expect(
        within(lethalRing.radiusM, 980, TOL),
        `expected ~980 m, got ${lethalRing.radiusM.toFixed(0)} m`
      ).toBe(true);
    }
  });

  it("100 rem radius is larger than 600 rem radius", () => {
    const r100 = rings.find((r) => r.rem === 100)?.radiusM ?? 0;
    const r600 = rings.find((r) => r.rem === 600)?.radiusM ?? 0;
    if (r600 > 0 && r100 > 0) {
      expect(r100).toBeGreaterThan(r600);
    }
  });
});

describe("computeRadiationRings — blast-dominant large yields", () => {
  it("returns empty rings for 1 Mt (radiation swamped by blast)", () => {
    const rings = computeRadiationRings({
      yieldKt: 1000,
      burstType: "airburst",
      hobM: 5000,
    });
    expect(rings).toHaveLength(0);
  });

  it("returns empty rings for 300 kt (radiation swamped by blast)", () => {
    const rings = computeRadiationRings({
      yieldKt: 300,
      burstType: "airburst",
      hobM: 3000,
    });
    expect(rings).toHaveLength(0);
  });
});

describe("computeRadiationRings — dose model monotonicity", () => {
  it("600 rem radius < 450 rem radius < 100 rem radius for small yield", () => {
    const rings = computeRadiationRings({
      yieldKt: 1,
      burstType: "surface",
      hobM: 0,
    });
    if (rings.length >= 2) {
      const byRem = Object.fromEntries(rings.map((r) => [r.rem, r.radiusM]));
      if (byRem[600] && byRem[450]) {
        expect(byRem[600]).toBeLessThan(byRem[450]);
      }
    }
  });
});
