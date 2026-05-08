export type BurstType = "airburst" | "surface";
export type Weather = "clear" | "hazy" | "overcast";
export type TimeOfDay = "day" | "night";
export type EffectCategory = "blast" | "thermal" | "radiation";

export interface WeaponSpec {
  yieldKt: number;
  burstType: BurstType;
  /** Meters above ground. 0 for surface burst. */
  hobM: number;
}

export interface Conditions {
  groundZero: { lat: number; lng: number };
  timeOfDay: TimeOfDay;
  weather: Weather;
}

export interface EffectRing {
  /** Ground-range radius (meters): horizontal distance from the ground-zero
   *  point at which this threshold is reached on the surface. For an airburst
   *  blast ring this is the *Mach-amplified* footprint, NOT the geometric
   *  slant projection of the free-air sphere. */
  radiusM: number;
  /** Free-air slant radius (meters) of the 3D shock/heat sphere centered at
   *  the burst point. Independent of HOB.
   *  - Blast: the free-air spherical-shock radius for this overpressure at
   *    this yield. Distinct from `radiusM`, which the airburst Mach stem
   *    extends beyond this value along the ground.
   *  - Thermal/radiation: equal to `radiusM`, since those effects propagate
   *    spherically without a Mach analogue. */
  sphereRadiusM: number;
  category: EffectCategory;
  /** Hex color. Colorblind-safe palette — no red-vs-green encoding. */
  color: string;
  fillOpacity: number;
  thresholdLabel: string;
  physicalDescription: string;
  /** Fraction of population inside this ring that are fatalities (informational). */
  casualtyRateInner: number;
}

export interface CasualtyEstimate {
  fatalities: number;
  injuriesBlast: number;
  injuriesBurns: number;
  injuriesRadiation: number;
  affectedAreaKm2: number;
  narrative: string;
}

export interface EffectsResult {
  rings: EffectRing[];
  casualties: CasualtyEstimate;
}
