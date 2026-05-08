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
  private readonly data: BlockGroupRecord[];

  constructor(blockGroups: BlockGroupRecord[]) {
    this.data = blockGroups;
  }

  getDensityAt(lat: number, lng: number): number {
    // Nearest-centroid lookup — O(n) over ~500 Suffolk County block groups.
    // Fast enough for the 0.5 km grid used in annulusPopulation().
    let minDist = Infinity;
    let nearest = -1;
    for (let i = 0; i < this.data.length; i++) {
      const dLat = lat - this.data[i].lat;
      const dLng = lng - this.data[i].lng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    return nearest >= 0 ? this.data[nearest].density : 0;
  }
}
