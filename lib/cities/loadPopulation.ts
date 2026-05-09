/**
 * Lazy loader for per-city Census block-group data.
 *
 * Each city's data file (`lib/cities/data/{id}.json`) is a few hundred KB.
 * Bundling all 21 of them eagerly would add ~5 MB to the initial JS chunk;
 * dynamic imports keep startup fast — only the active city's data is fetched
 * and only the first time it's selected. The constructed CensusBlockGroupModel
 * (which builds a spatial grid in its constructor — ~10–30 ms) is also cached
 * so re-selecting a city is instant.
 *
 * If a data file is missing (the user hasn't run `node scripts/fetch-census.mjs`
 * yet) we fall back to bostonZoneModel — an obvious "no real data" signal that
 * still produces a usable map experience.
 */

import {
  CensusBlockGroupModel,
  bostonZoneModel,
} from "../casualties/populationSources";
import type { PopulationSource } from "../casualties/types";

interface CityDataFile {
  blockGroups: Array<{
    lat: number;
    lng: number;
    density: number;
  }>;
}

const cache = new Map<string, PopulationSource>();
const inFlight = new Map<string, Promise<PopulationSource>>();

/**
 * Resolve the population source for a city. Cached; safe to call repeatedly.
 * The cache is keyed by city id so concurrent dropdown switches dedupe.
 */
export function loadCityPopulation(cityId: string): Promise<PopulationSource> {
  const cached = cache.get(cityId);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(cityId);
  if (pending) return pending;

  const promise = (async (): Promise<PopulationSource> => {
    try {
      // Dynamic import keyed by id. Webpack/Turbopack handles this by
      // bundling each `lib/cities/data/*.json` as its own async chunk.
      const mod = (await import(
        /* webpackChunkName: "city-[request]" */
        `./data/${cityId}.json`
      )) as { default: CityDataFile };
      const model = new CensusBlockGroupModel(mod.default.blockGroups);
      cache.set(cityId, model);
      return model;
    } catch (err) {
      console.warn(
        `[cities] No Census data for "${cityId}" — falling back to Boston zone model. ` +
          `Run \`node scripts/fetch-census.mjs ${cityId}\` to generate it.`,
        err
      );
      cache.set(cityId, bostonZoneModel);
      return bostonZoneModel;
    } finally {
      inFlight.delete(cityId);
    }
  })();

  inFlight.set(cityId, promise);
  return promise;
}
