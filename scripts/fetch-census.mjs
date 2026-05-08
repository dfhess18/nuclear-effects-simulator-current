/**
 * fetch-census.mjs
 *
 * Fetches 2020 ACS 5-year block group population data for Suffolk County, MA
 * (FIPS 25025) and block group geometry from the Census TIGERweb REST API.
 * Outputs lib/cities/boston-census-data.json for use by CensusBlockGroupModel.
 *
 * Run once (or when you want to refresh the data):
 *   node scripts/fetch-census.mjs
 *
 * Requires CENSUS_API_KEY in .env.local.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) throw new Error(".env.local not found at " + p);
  const env = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}

// ── Census ACS 2020 5-year ────────────────────────────────────────────────────

async function fetchACS(key) {
  const url = new URL("https://api.census.gov/data/2020/acs/acs5");
  url.searchParams.set("get", "B01003_001E,NAME");
  url.searchParams.set("for", "block group:*");
  url.searchParams.set("in", "state:25 county:025 tract:*");
  url.searchParams.set("key", key);

  console.log("→ Census ACS 2020 — block group population for Suffolk County…");
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Census ACS ${res.status}: ${body.slice(0, 300)}`);
  }

  const [headers, ...rows] = await res.json();
  const col = (name) => headers.indexOf(name);

  const pop = {};
  for (const row of rows) {
    // GEOID: 2-digit state + 3-digit county + 6-digit tract + 1-digit block group
    const geoid =
      row[col("state")] +
      row[col("county")].padStart(3, "0") +
      row[col("tract")].padStart(6, "0") +
      row[col("block group")];
    pop[geoid] = parseInt(row[col("B01003_001E")], 10) || 0;
  }

  console.log(`  ✓ ${Object.keys(pop).length} block groups`);
  return pop;
}

// ── TIGERweb geometry ─────────────────────────────────────────────────────────

async function fetchTIGER() {
  // ACS 2022 MapServer — layer 8 = Block Groups
  const base =
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer/8/query";

  const params = new URLSearchParams({
    where: "STATE='25' AND COUNTY='025'",
    outFields: "GEOID,AREALAND",
    returnGeometry: "true",
    outSR: "4326",
    f: "json",
    resultRecordCount: "2000",
  });

  console.log("→ TIGERweb — block group polygons for Suffolk County…");
  const res = await fetch(`${base}?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TIGERweb ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.error)
    throw new Error(`TIGERweb error: ${JSON.stringify(data.error)}`);

  console.log(`  ✓ ${data.features.length} polygons`);
  return data.features;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function polygonCentroid(rings) {
  // Average of outer-ring vertices (fast; accurate enough for small polygons)
  const coords = rings[0];
  let sumLng = 0,
    sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const key = env["CENSUS_API_KEY"];
  if (!key) throw new Error("CENSUS_API_KEY not set in .env.local");

  const [population, features] = await Promise.all([
    fetchACS(key),
    fetchTIGER(),
  ]);

  const blockGroups = [];
  let skipped = 0;

  for (const feat of features) {
    const geoid = feat.attributes.GEOID;
    const areaLandM2 = feat.attributes.AREALAND ?? 0;
    const pop = population[geoid];

    if (pop === undefined || areaLandM2 === 0) {
      skipped++;
      continue;
    }

    const { lat, lng } = polygonCentroid(feat.geometry.rings);
    const areaKm2 = areaLandM2 / 1e6;

    blockGroups.push({
      geoid,
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      population: pop,
      areaKm2: Math.round(areaKm2 * 100) / 100,
      // people/km² — the value CensusBlockGroupModel.getDensityAt() returns
      density: Math.round(pop / areaKm2),
    });
  }

  // Stats
  const densities = blockGroups.map((b) => b.density).sort((a, b) => a - b);
  const median = densities[Math.floor(densities.length / 2)];
  const totalPop = blockGroups.reduce((s, b) => s + b.population, 0);

  console.log(`
Results
  Block groups: ${blockGroups.length}  (skipped ${skipped} with no match or zero area)
  Total population: ${totalPop.toLocaleString()}
  Density — min: ${densities[0]}  median: ${median}  max: ${densities.at(-1)} people/km²`);

  const outPath = join(ROOT, "lib/cities/boston-census-data.json");
  writeFileSync(outPath, JSON.stringify({ blockGroups }, null, 2));
  console.log(`\n✓ Written to lib/cities/boston-census-data.json`);
}

main().catch((err) => {
  console.error("\n✗ Error:", err.message);
  process.exit(1);
});
