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
  radiusM: number;
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
