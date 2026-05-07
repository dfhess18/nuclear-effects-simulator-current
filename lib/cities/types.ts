import type { PopulationSource } from "../casualties/types";

export interface City {
  id: string;
  name: string;
  /** [[south, west], [north, east]] */
  bounds: [[number, number], [number, number]];
  defaultCenter: { lat: number; lng: number };
  defaultGroundZero: { lat: number; lng: number };
  populationSource: PopulationSource;
}
