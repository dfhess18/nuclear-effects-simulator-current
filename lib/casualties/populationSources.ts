/**
 * Population density sources.
 *
 * v1: BostonZoneModel — three concentric zones around Boston City Hall.
 * v2: Replace with CensusBlockGroupModel using ACS API:
 *     GET https://api.census.gov/data/2020/acs/acs5
 *         ?get=B01003_001E,NAME&for=block group:*&in=state:25 county:025 tract:*
 *         &key=YOUR_KEY
 *
 * Zone densities calibrated to 2020 Census Boston metro data:
 *   - Downtown core (≤2 km): 25,000 people/km² (high-rise, mixed-use)
 *   - Urban neighborhoods (2–8 km): 6,500 people/km²
 *   - Suburban fringe (>8 km): 1,500 people/km²
 */

import type { PopulationSource } from "./types";

function haversineKm(
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

class BostonZoneModel implements PopulationSource {
  // Boston City Hall as zone center
  private readonly centerLat = 42.3601;
  private readonly centerLng = -71.0589;

  getDensityAt(lat: number, lng: number): number {
    const distKm = haversineKm(this.centerLat, this.centerLng, lat, lng);
    if (distKm <= 2) return 25000;
    if (distKm <= 8) return 6500;
    return 1500;
  }
}

export const bostonZoneModel: PopulationSource = new BostonZoneModel();

// ── Census block group model (v2) ─────────────────────────────────────────────
// Populated by running: node scripts/fetch-census.mjs
// Falls back to bostonZoneModel when data is empty (before first run).

interface BlockGroupRecord {
  lat: number;
  lng: number;
  density: number; // people/km²
}

/**
 * Generic Census block-group population model with a precomputed nearest-
 * centroid spatial grid for O(1) lookups. Grid bounds are derived from the
 * input data so the same class works for any city — no hardcoded geography.
 *
 * Construction cost (one-off): roughly grid_cells × block_groups comparisons.
 * For a typical mid-size city (~1500 block groups, ~6000 cells) that's ~9M
 * ops — under ~30 ms on modern hardware. Lazy-build per city to avoid paying
 * for cities the user never selects.
 */
export class CensusBlockGroupModel implements PopulationSource {
  private readonly grid: Float32Array;
  private readonly latMin: number;
  private readonly lngMin: number;
  private readonly step: number;
  private readonly nLat: number;
  private readonly nLng: number;
  /** Squared great-circle threshold (in degrees²) for "no centroid nearby". */
  private readonly farSq: number;
  /** Fallback density when the grid cell is far from any centroid. */
  private readonly suburbanDensity: number;

  constructor(blockGroups: BlockGroupRecord[], suburbanDensity = 1500) {
    this.suburbanDensity = suburbanDensity;
    // Far-cell threshold: cells whose nearest centroid is > ~0.1° away
    // (≈ 11 km) fall back to suburban. Squared because we compare in
    // squared-degree distance.
    this.farSq = 0.1 * 0.1;
    // Grid resolution: ~0.005° per cell ≈ 550 m latitude, scales with cos(lat)
    // for longitude. Fine enough for casualty integration which uses 500 m steps.
    this.step = 0.005;

    if (blockGroups.length === 0) {
      // Default to a tiny grid centred at (0,0); every getDensityAt call will
      // miss the bounds and return suburbanDensity.
      this.latMin = 0;
      this.lngMin = 0;
      this.nLat = 1;
      this.nLng = 1;
      this.grid = new Float32Array([this.suburbanDensity]);
      return;
    }

    // Derive bounds from the data. Add a buffer of ~0.05° (≈ 5 km) so points
    // just outside the extreme centroids still get a real-data lookup.
    let latMin = Infinity, latMax = -Infinity;
    let lngMin = Infinity, lngMax = -Infinity;
    for (const bg of blockGroups) {
      if (bg.lat < latMin) latMin = bg.lat;
      if (bg.lat > latMax) latMax = bg.lat;
      if (bg.lng < lngMin) lngMin = bg.lng;
      if (bg.lng > lngMax) lngMax = bg.lng;
    }
    const buffer = 0.05;
    this.latMin = latMin - buffer;
    this.lngMin = lngMin - buffer;
    this.nLat = Math.ceil((latMax + buffer - this.latMin) / this.step);
    this.nLng = Math.ceil((lngMax + buffer - this.lngMin) / this.step);

    this.grid = new Float32Array(this.nLat * this.nLng).fill(this.suburbanDensity);

    for (let r = 0; r < this.nLat; r++) {
      const lat = this.latMin + (r + 0.5) * this.step;
      for (let c = 0; c < this.nLng; c++) {
        const lng = this.lngMin + (c + 0.5) * this.step;
        let minDist = Infinity;
        let nearestDensity = this.suburbanDensity;
        for (const bg of blockGroups) {
          const dLat = lat - bg.lat;
          const dLng = lng - bg.lng;
          const d = dLat * dLat + dLng * dLng;
          if (d < minDist) {
            minDist = d;
            nearestDensity = bg.density;
          }
        }
        this.grid[r * this.nLng + c] =
          minDist <= this.farSq ? nearestDensity : this.suburbanDensity;
      }
    }
  }

  getDensityAt(lat: number, lng: number): number {
    const r = Math.floor((lat - this.latMin) / this.step);
    const c = Math.floor((lng - this.lngMin) / this.step);
    if (r < 0 || r >= this.nLat || c < 0 || c >= this.nLng) {
      return this.suburbanDensity;
    }
    return this.grid[r * this.nLng + c];
  }
}
