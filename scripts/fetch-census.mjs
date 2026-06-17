/**
 * fetch-census.mjs
 *
 * Fetches 2020 ACS 5-year block-group population (B01003_001E) and
 * TIGERweb block-group geometry for every county listed for a given
 * city in lib/cities/registry.ts, joins them by GEOID, and writes the
 * result to lib/cities/data/{cityId}.json. The runtime
 * CensusBlockGroupModel reads these files lazily.
 *
 * Usage:
 *   node scripts/fetch-census.mjs <cityId>     # one city
 *   node scripts/fetch-census.mjs all          # every city in the registry
 *
 * Requires CENSUS_API_KEY in .env.local.
 *
 * Throttling: counties are fetched serially with a small inter-request
 * delay to avoid hitting Census/TIGERweb rate limits when a city has
 * many counties (e.g. NYC = 9, DC = 6).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Read the registry as plain text and extract the city list. The registry
// lives in TypeScript so we can't import it directly from a .mjs script
// without running tsc; parse the literal array instead. This keeps the
// script dependency-free and the registry as the single source of truth.
function loadRegistry() {
  const src = readFileSync(join(ROOT, "lib/cities/registry.ts"), "utf8");
  // crude but reliable: extract every CityEntry block
  const cities = [];
  const cityRe =
    /\{\s*id:\s*"([^"]+)",[\s\S]*?counties:\s*\[([\s\S]*?)\][\s\S]*?\},?/g;
  for (const m of src.matchAll(cityRe)) {
    const [, id, countiesBlock] = m;
    const counties = [];
    const countyRe = /state:\s*"(\d{2})",\s*county:\s*"(\d{3})"/g;
    for (const cm of countiesBlock.matchAll(countyRe)) {
      counties.push({ state: cm[1], county: cm[2] });
    }
    if (counties.length > 0) cities.push({ id, counties });
  }
  return cities;
}

// ── Census ACS 2020 5-year ────────────────────────────────────────────────────

async function fetchACS(state, county, key) {
  const url = new URL("https://api.census.gov/data/2020/acs/acs5");
  url.searchParams.set("get", "B01003_001E,NAME");
  url.searchParams.set("for", "block group:*");
  url.searchParams.set("in", `state:${state} county:${county} tract:*`);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Census ACS state=${state} county=${county} ${res.status}: ${body.slice(0, 200)}`
    );
  }

  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return {};

  const [headers, ...rows] = json;
  const col = (name) => headers.indexOf(name);

  const pop = {};
  for (const row of rows) {
    const geoid =
      row[col("state")] +
      row[col("county")].padStart(3, "0") +
      row[col("tract")].padStart(6, "0") +
      row[col("block group")];
    pop[geoid] = parseInt(row[col("B01003_001E")], 10) || 0;
  }
  return pop;
}

// ── TIGERweb geometry ─────────────────────────────────────────────────────────

async function fetchTIGER(state, county) {
  const base =
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer/8/query";

  const allFeatures = [];
  let offset = 0;

  // Paginate until the service reports no more records.
  while (true) {
    const params = new URLSearchParams({
      where: `STATE='${state}' AND COUNTY='${county}'`,
      outFields: "GEOID,AREALAND",
      returnGeometry: "true",
      outSR: "4326",
      f: "json",
      resultRecordCount: "2000",
      resultOffset: String(offset),
    });

    const res = await fetch(`${base}?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `TIGERweb state=${state} county=${county} ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(
        `TIGERweb state=${state} county=${county} error: ${JSON.stringify(data.error)}`
      );
    }

    const features = data.features ?? [];
    allFeatures.push(...features);

    if (!data.exceededTransferLimit || features.length === 0) break;
    offset += features.length;
    await sleep(100); // brief pause between pages
  }

  return allFeatures;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function polygonCentroid(rings) {
  const coords = rings[0];
  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
  };
}

// ── Fetch one city ────────────────────────────────────────────────────────────

async function fetchCity(city, key) {
  console.log(`\n──── ${city.id} (${city.counties.length} counties) ────`);

  const blockGroups = [];
  let totalSkipped = 0;

  for (const { state, county } of city.counties) {
    process.stdout.write(`  ${state}-${county} `);
    const [pop, features] = await Promise.all([
      fetchACS(state, county, key),
      fetchTIGER(state, county),
    ]);

    let added = 0, skipped = 0;
    for (const feat of features) {
      const geoid = feat.attributes.GEOID;
      const areaLandM2 = feat.attributes.AREALAND ?? 0;
      const popHere = pop[geoid];

      if (popHere === undefined || areaLandM2 === 0) {
        skipped++;
        continue;
      }

      const { lat, lng } = polygonCentroid(feat.geometry.rings);
      const areaKm2 = areaLandM2 / 1e6;

      blockGroups.push({
        geoid,
        lat: Math.round(lat * 1e6) / 1e6,
        lng: Math.round(lng * 1e6) / 1e6,
        population: popHere,
        areaKm2: Math.round(areaKm2 * 100) / 100,
        density: Math.round(popHere / areaKm2),
      });
      added++;
    }
    totalSkipped += skipped;
    console.log(`→ ${added} block groups (${skipped} skipped)`);
    await sleep(150); // gentle pacing
  }

  // Stats
  const densities = blockGroups.map((b) => b.density).sort((a, b) => a - b);
  const median = densities[Math.floor(densities.length / 2)] ?? 0;
  const totalPop = blockGroups.reduce((s, b) => s + b.population, 0);

  console.log(
    `  ── total: ${blockGroups.length} block groups, ` +
      `pop ${totalPop.toLocaleString()}, ` +
      `density min/median/max = ${densities[0] ?? 0}/${median}/${densities.at(-1) ?? 0}`
  );

  const dataDir = join(ROOT, "lib/cities/data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const outPath = join(dataDir, `${city.id}.json`);
  writeFileSync(outPath, JSON.stringify({ blockGroups }));
  console.log(`  ✓ ${outPath.replace(ROOT + "\\", "").replace(ROOT + "/", "")}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const key = env["CENSUS_API_KEY"];
  if (!key) throw new Error("CENSUS_API_KEY not set in .env.local");

  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/fetch-census.mjs <cityId | all>");
    process.exit(1);
  }

  const registry = loadRegistry();
  const targets =
    arg === "all" ? registry : registry.filter((c) => c.id === arg);

  if (targets.length === 0) {
    console.error(
      `No matching cities. Known ids:\n  ${registry.map((c) => c.id).join(", ")}`
    );
    process.exit(1);
  }

  for (const city of targets) {
    try {
      await fetchCity(city, key);
    } catch (err) {
      console.error(`\n✗ ${city.id}: ${err.message}`);
      // Continue with the next city rather than aborting the whole batch.
    }
  }
}

main().catch((err) => {
  console.error("\n✗", err.stack ?? err.message);
  process.exit(1);
});
