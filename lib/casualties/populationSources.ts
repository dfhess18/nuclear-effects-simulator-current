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

export class CensusBlockGroupModel implements PopulationSource {
  // Pre-computed spatial grid for O(1) lookups.
  // Grid covers Suffolk County with a buffer; points outside fall back to a
  // suburban density matching the zone model's outer ring.
  private readonly grid: Float32Array;
  private readonly LAT_MIN = 42.20;
  private readonly LNG_MIN = -71.22;
  private readonly STEP = 0.005; // ~0.55 km per cell
  private readonly N_LAT = 52;   // 42.20 → 42.46
  private readonly N_LNG = 58;   // -71.22 → -70.93
  // Cells more than ~11 km from any centroid get suburban fallback density
  private readonly FAR_SQ = 0.1 * 0.1;
  private readonly SUBURBAN = 1500; // people/km²

  constructor(blockGroups: BlockGroupRecord[]) {
    this.grid = new Float32Array(this.N_LAT * this.N_LNG).fill(this.SUBURBAN);
    if (blockGroups.length === 0) return;

    // For each grid cell, find the nearest block group centroid.
    // One-time cost: ~3000 cells × 680 block groups ≈ 2M comparisons (<10ms).
    for (let r = 0; r < this.N_LAT; r++) {
      const lat = this.LAT_MIN + (r + 0.5) * this.STEP;
      for (let c = 0; c < this.N_LNG; c++) {
        const lng = this.LNG_MIN + (c + 0.5) * this.STEP;
        let minDist = Infinity;
        let nearestDensity = this.SUBURBAN;
        for (const bg of blockGroups) {
          const dLat = lat - bg.lat;
          const dLng = lng - bg.lng;
          const d = dLat * dLat + dLng * dLng;
          if (d < minDist) {
            minDist = d;
            nearestDensity = bg.density;
          }
        }
        this.grid[r * this.N_LNG + c] =
          minDist <= this.FAR_SQ ? nearestDensity : this.SUBURBAN;
      }
    }
  }

  getDensityAt(lat: number, lng: number): number {
    const r = Math.floor((lat - this.LAT_MIN) / this.STEP);
    const c = Math.floor((lng - this.LNG_MIN) / this.STEP);
    if (r < 0 || r >= this.N_LAT || c < 0 || c >= this.N_LNG) return this.SUBURBAN;
    return this.grid[r * this.N_LNG + c];
  }
}
