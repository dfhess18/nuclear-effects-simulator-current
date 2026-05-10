/**
 * Multi-city blast effects simulator.
 *
 * One page handles every city in lib/cities/registry.ts. The active city is
 * URL-state-free for now (just a useState); the dropdown in InputsPanel
 * switches it in place. Switching a city:
 *   1. Flies the map to the new city's defaultCenter
 *   2. Sets ground zero to the city's default landmark
 *   3. Lazy-loads the city's Census block-group data, replaces the active
 *      population source, and recomputes casualties.
 *
 * Until the Census data finishes loading we fall back to the Boston zone
 * model — casualty estimates may be off for that brief window, but rings
 * still render correctly because the physics is independent of population.
 */
"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { InputsPanel } from "@/components/panels/InputsPanel";
import { ResultsPanel } from "@/components/panels/ResultsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITIES, DEFAULT_CITY_ID, findCity, findNearestCity } from "@/lib/cities/registry";
import { loadCityPopulation } from "@/lib/cities/loadPopulation";
import { bostonZoneModel } from "@/lib/casualties/populationSources";
import { DEFAULT_PRESET } from "@/lib/weapons/presets";
import { computeEffects, optimalHobM } from "@/lib/physics/index";
import type { WeaponPreset } from "@/lib/weapons/types";
import type { BurstType, Weather, TimeOfDay } from "@/lib/physics/types";
import type { CityMarker } from "@/components/map/types";
import type { PopulationSource } from "@/lib/casualties/types";

// SSR-disabled — Mapbox needs window/document.
const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
      <p className="text-slate-500 dark:text-zinc-400 text-sm">Loading map…</p>
    </div>
  ),
});

// Country-level initial view so all 20+ markers are visible.
const US_CENTER = { lat: 39.5, lng: -98.35 };

const CITY_MARKERS: CityMarker[] = CITIES.map((c) => ({
  id: c.id,
  label: c.name,
  lat: c.defaultCenter.lat,
  lng: c.defaultCenter.lng,
}));

export default function SimulatorPage() {
  const [cityId, setCityId] = useState<string>(DEFAULT_CITY_ID);
  const activeCity = findCity(cityId) ?? findCity(DEFAULT_CITY_ID)!;

  // Population source for the active city. Begins as the zone-model fallback
  // and is replaced once the Census data finishes loading.
  const [populationSource, setPopulationSource] =
    useState<PopulationSource>(bostonZoneModel);
  const [populationLoading, setPopulationLoading] = useState(false);

  // Track the current load token so a slow load for City A doesn't clobber
  // the state after the user has already switched to City B.
  const loadTokenRef = useRef(0);
  useEffect(() => {
    const token = ++loadTokenRef.current;
    setPopulationLoading(true);
    loadCityPopulation(cityId).then((src) => {
      if (loadTokenRef.current === token) {
        setPopulationSource(src);
        setPopulationLoading(false);
      }
    });
  }, [cityId]);

  const [preset, setPreset] = useState<WeaponPreset>(DEFAULT_PRESET);
  const [useCustomYield, setUseCustomYield] = useState(false);
  const [customYieldKt, setCustomYieldKt] = useState(15);
  const [burstType, setBurstType] = useState<BurstType>("airburst");
  const [hobM, setHobM] = useState(optimalHobM(DEFAULT_PRESET.yieldKt));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [weather, setWeather] = useState<Weather>("clear");
  const [groundZero, setGroundZero] = useState<{ lat: number; lng: number } | null>(null);
  // Only set when the user actively picks a city (dropdown / marker click).
  // The Map flies to it on change; on initial mount it's undefined so the
  // map stays at the country-level overview the user expects.
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();

  const activeYieldKt = useCustomYield ? customYieldKt : preset.yieldKt;

  const handlePresetChange = useCallback((p: WeaponPreset) => setPreset(p), []);
  const handleCustomYieldChange = useCallback(
    (kt: number) => setCustomYieldKt(kt),
    []
  );

  const handleBurstTypeChange = useCallback(
    (b: BurstType) => {
      setBurstType(b);
      setHobM(b === "airburst" ? optimalHobM(activeYieldKt) : 0);
    },
    [activeYieldKt]
  );

  // Clicking a city marker on the map: switch active city, set GZ at the
  // city, and trigger a fly-to.
  const handleCitySelect = useCallback((lat: number, lng: number) => {
    const hit = CITIES.find(
      (c) =>
        Math.abs(c.defaultCenter.lat - lat) < 1e-4 &&
        Math.abs(c.defaultCenter.lng - lng) < 1e-4
    );
    if (hit) setCityId(hit.id);
    setGroundZero({ lat, lng });
    setFlyToTarget({ lat, lng });
  }, []);

  const handleGroundZeroMove = useCallback((lat: number, lng: number) => {
    setGroundZero({ lat, lng });
    const nearest = findNearestCity(lat, lng);
    setCityId((prev) => (nearest.id !== prev ? nearest.id : prev));
  }, []);

  // Dropdown selection: switch city, fly to it, drop GZ on its default.
  // setFlyToTarget creates a NEW object reference even if the user picks
  // the same city twice — the Map's effect re-fires on identity change.
  const handleCityIdChange = useCallback((id: string) => {
    const c = findCity(id);
    if (!c) return;
    setCityId(id);
    setGroundZero({ lat: c.defaultGroundZero.lat, lng: c.defaultGroundZero.lng });
    setFlyToTarget({ lat: c.defaultCenter.lat, lng: c.defaultCenter.lng });
  }, []);

  const results = useMemo(() => {
    if (!groundZero) return null;
    return computeEffects(
      { yieldKt: activeYieldKt, burstType, hobM },
      { groundZero, timeOfDay, weather },
      populationSource
    );
  }, [activeYieldKt, burstType, hobM, groundZero, timeOfDay, weather, populationSource]);

  // The Map component is mounted once; we drive its camera via flyToCenter
  // changes (a new key triggers a re-fly). Use the active city's center.
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            Nuclear Effects Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">MIT Laboratory for Nuclear Science</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGroundZero(null);
              setFlyToTarget({ ...US_CENTER, zoom: 4, nonce: Date.now() });
            }}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset map to full US view and clear ground zero"
          >
            Reset view
          </button>
          <ThemeToggle />
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-slate-200 transition-colors"
          >
            Home
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <InputsPanel
          preset={preset}
          customYieldKt={customYieldKt}
          useCustomYield={useCustomYield}
          burstType={burstType}
          hobM={hobM}
          timeOfDay={timeOfDay}
          weather={weather}
          groundZero={groundZero}
          cityId={cityId}
          cities={CITIES}
          onPresetChange={handlePresetChange}
          onCustomYieldChange={handleCustomYieldChange}
          onUseCustomYieldChange={setUseCustomYield}
          onBurstTypeChange={handleBurstTypeChange}
          onHobChange={setHobM}
          onTimeOfDayChange={setTimeOfDay}
          onWeatherChange={setWeather}
          onResetGroundZero={() =>
            setGroundZero(activeCity.defaultGroundZero)
          }
          onCityChange={handleCityIdChange}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <Map
              center={US_CENTER}
              bounds={activeCity.bounds}
              initialZoom={4}
              cityMarkers={CITY_MARKERS}
              flyTo={flyToTarget}
              groundZero={groundZero}
              rings={results?.rings ?? []}
              hobM={burstType === "airburst" ? hobM : 0}
              onMapClick={handleGroundZeroMove}
              onGroundZeroDrag={handleGroundZeroMove}
              onCitySelect={handleCitySelect}
            />
          </div>

          <ResultsPanel
            casualties={results?.casualties ?? null}
            groundZeroPlaced={groundZero !== null}
            yieldKt={activeYieldKt}
            populationLoading={populationLoading}
          />
        </div>
      </div>
    </div>
  );
}
