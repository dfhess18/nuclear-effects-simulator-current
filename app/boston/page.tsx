/**
 * Boston blast effects simulator page.
 * All interactive state lives here; Map and panels are client components.
 */
"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback } from "react";
import { InputsPanel } from "@/components/panels/InputsPanel";
import { ResultsPanel } from "@/components/panels/ResultsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { boston } from "@/lib/cities/boston";
import { DEFAULT_PRESET } from "@/lib/weapons/presets";
import { computeEffects, optimalHobM } from "@/lib/physics/index";
import type { WeaponPreset } from "@/lib/weapons/types";
import type { BurstType, Weather, TimeOfDay } from "@/lib/physics/types";
import type { CityMarker } from "@/components/map/types";

// Dynamic import prevents SSR for the Leaflet map (requires window/document)
const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
      <p className="text-slate-500 dark:text-zinc-400 text-sm">Loading map…</p>
    </div>
  ),
});

// US geographic center for initial view
const US_CENTER = { lat: 39.5, lng: -98.35 };

const CITY_MARKERS: CityMarker[] = [
  {
    id: "boston",
    label: "Boston, MA",
    lat: boston.defaultCenter.lat,
    lng: boston.defaultCenter.lng,
  },
];

export default function BostonPage() {
  const [preset, setPreset] = useState<WeaponPreset>(DEFAULT_PRESET);
  const [useCustomYield, setUseCustomYield] = useState(false);
  const [customYieldKt, setCustomYieldKt] = useState(15);
  const [burstType, setBurstType] = useState<BurstType>("airburst");
  const [hobM, setHobM] = useState(optimalHobM(DEFAULT_PRESET.yieldKt));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [weather, setWeather] = useState<Weather>("clear");
  const [groundZero, setGroundZero] = useState<{ lat: number; lng: number } | null>(null);

  const activeYieldKt = useCustomYield ? customYieldKt : preset.yieldKt;

  // Yield and preset changes do NOT auto-adjust HOB — user controls HOB independently.
  // HOB is only auto-set when switching burst type to airburst.
  const handlePresetChange = useCallback((p: WeaponPreset) => {
    setPreset(p);
  }, []);

  const handleCustomYieldChange = useCallback((kt: number) => {
    setCustomYieldKt(kt);
  }, []);

  const handleBurstTypeChange = useCallback(
    (b: BurstType) => {
      setBurstType(b);
      setHobM(b === "airburst" ? optimalHobM(activeYieldKt) : 0);
    },
    [activeYieldKt]
  );

  const handleCitySelect = useCallback((lat: number, lng: number) => {
    setGroundZero({ lat, lng });
  }, []);

  const handleGroundZeroMove = useCallback((lat: number, lng: number) => {
    setGroundZero({ lat, lng });
  }, []);

  const results = useMemo(() => {
    if (!groundZero) return null;
    return computeEffects(
      { yieldKt: activeYieldKt, burstType, hobM },
      { groundZero, timeOfDay, weather }
    );
  }, [activeYieldKt, burstType, hobM, groundZero, timeOfDay, weather]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            Nuclear Effects Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">MIT Laboratory for Nuclear Science</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-slate-200 transition-colors"
          >
            Home
          </a>
        </div>
      </header>

      {/* Main layout */}
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
          onPresetChange={handlePresetChange}
          onCustomYieldChange={handleCustomYieldChange}
          onUseCustomYieldChange={setUseCustomYield}
          onBurstTypeChange={handleBurstTypeChange}
          onHobChange={setHobM}
          onTimeOfDayChange={setTimeOfDay}
          onWeatherChange={setWeather}
          onResetGroundZero={() => setGroundZero(boston.defaultGroundZero)}
        />

        {/* Map + results column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <Map
              center={US_CENTER}
              bounds={boston.bounds}
              initialZoom={4}
              cityMarkers={CITY_MARKERS}
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
          />
        </div>
      </div>
    </div>
  );
}
