import type { BurstType } from "../physics/types";

export interface WeaponPreset {
  id: string;
  label: string;
  yieldKt: number;
  defaultBurstType: BurstType;
  /** Optimized HOB in meters for airburst mode; 0 for surface default. */
  defaultHobM: number;
  historicalNote: string;
}
