import type { City } from "./types";
import { bostonZoneModel, CensusBlockGroupModel } from "../casualties/populationSources";
import type { PopulationSource } from "../casualties/types";
import censusData from "./boston-census-data.json";

// Use real Census block group data when available; fall back to the 3-zone
// approximation before `node scripts/fetch-census.mjs` has been run.
const censusModel = new CensusBlockGroupModel(censusData.blockGroups);
export const bostonPopulation: PopulationSource =
  censusData.blockGroups.length > 0 ? censusModel : bostonZoneModel;

export const boston: City = {
  id: "boston",
  name: "Boston, MA",
  bounds: [
    [42.2279, -71.1912],
    [42.397, -70.9232],
  ],
  defaultCenter: { lat: 42.3554, lng: -71.0603 },
  defaultGroundZero: { lat: 42.3554, lng: -71.0603 }, // Downtown Crossing
  populationSource: bostonPopulation,
};
