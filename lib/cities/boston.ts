import type { City } from "./types";
import { bostonZoneModel } from "../casualties/populationSources";
import type { PopulationSource } from "../casualties/types";

export const bostonPopulation: PopulationSource = bostonZoneModel;

export const boston: City = {
  id: "boston",
  name: "Boston, MA",
  bounds: [
    [42.2279, -71.1912],
    [42.397, -70.9232],
  ],
  defaultCenter: { lat: 42.3554, lng: -71.0603 },
  defaultGroundZero: { lat: 42.3554, lng: -71.0603 }, // Downtown Crossing
  populationSource: bostonZoneModel,
};
