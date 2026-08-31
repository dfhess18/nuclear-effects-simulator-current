/**
 * The whole product on one mounted tree: landing chrome and simulator chrome
 * are two phases of the same page, sharing ONE map instance.
 *
 * This is why there is no route change between them. Navigating from a landing
 * route to /simulator unmounts the map and builds a new one, which is exactly
 * the hitch you see — the camera resets, tiles refetch, and the descent the
 * user started is thrown away mid-flight. Keeping the map mounted and swapping
 * the furniture around it makes the zoom continuous by construction.
 *
 * Phases:
 *   landing   — chrome collapsed to zero size, map full-bleed, overlay visible
 *   flying    — overlay dissolves while the camera descends to the city
 *   simulator — panels expand in; the map keeps the camera it flew to
 *
 * /simulator?city=<id> mounts straight into `simulator`, so a shared link
 * still lands where it should.
 */
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InputsPanel } from "@/components/panels/InputsPanel";
import { ResultsPanel } from "@/components/panels/ResultsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CITIES,
  DEFAULT_CITY_ID,
  findCity,
  findNearestCity,
  type CityEntry,
} from "@/lib/cities/registry";
import { loadCityPopulation } from "@/lib/cities/loadPopulation";
import { bostonZoneModel } from "@/lib/casualties/populationSources";
import { DEFAULT_PRESET } from "@/lib/weapons/presets";
import { computeEffects, optimalHobM } from "@/lib/physics/index";
import { EASE } from "@/lib/motion";
import type { WeaponPreset } from "@/lib/weapons/types";
import type { BurstType, Weather, TimeOfDay } from "@/lib/physics/types";
import type { CityMarker, MapProps } from "@/components/map/types";
import type { PopulationSource } from "@/lib/casualties/types";

const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--map-bg)]" />,
});

/**
 * Country view. Zoomed out far enough that the whole continental US clears the
 * masthead on the left and the fact rail along the bottom, rather than sitting
 * under them.
 */
const US_CENTER = { lat: 39.6, lng: -95.0 };
const US_ZOOM = 3.35;

/** Descent to the chosen city. Long enough to read as travel, not a cut. */
const FLY_MS = 2000;
/** Landing copy clears out well before the camera arrives. */
const CHROME_OUT_MS = 420;
/** Panels opening. Matches lib/motion's panel timing so this feels like the
 *  results bar expanding rather than a separate effect. */
const CHROME_IN_MS = 560;
/**
 * The chrome starts arriving BEFORE the camera stops. Running them back to
 * back left a visible dead beat at the end of the flight — the descent
 * finished, then nothing happened, then panels appeared. Overlapping removes
 * the pause without speeding either part up.
 */
const RINGS_AT = Math.round(FLY_MS * 0.55);
const CHROME_AT = Math.round(FLY_MS * 0.72);

/** Continental US, framed by fitBounds so it fits whatever width the map has. */
const US_BOUNDS: [[number, number], [number, number]] = [
  [-125.2, 24.4],
  [-66.6, 49.6],
];

const CITY_MARKERS: CityMarker[] = CITIES.map((c) => ({
  id: c.id,
  label: c.name,
  lat: c.defaultCenter.lat,
  lng: c.defaultCenter.lng,
}));

const RAIL = [
  { k: "Model", v: "Glasstone & Dolan (1977)" },
  { k: "Population", v: "US Census block groups" },
  { k: "Cities", v: `${CITIES.length} modelled` },
];

export type Phase = "landing" | "flying" | "simulator";

export interface SimulatorExperienceProps {
  initialPhase: Phase;
  /** Pre-selected city when entering directly at `simulator`. */
  initialCity?: CityEntry | null;
}

export function SimulatorExperience({
  initialPhase,
  initialCity = null,
}: SimulatorExperienceProps) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [launchingCity, setLaunchingCity] = useState<CityEntry | null>(null);

  // Live camera, reported by the map. Lets "Reset view" decide whether the
  // next press should level a tilted view or zoom back out to the country.
  const cameraRef = useRef({
    pitch: 0,
    bearing: 0,
    zoom: US_ZOOM,
    center: US_CENTER,
  });
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    []
  );

  const [cityId, setCityId] = useState<string>(
    initialCity?.id ?? DEFAULT_CITY_ID
  );
  const activeCity = findCity(cityId) ?? findCity(DEFAULT_CITY_ID)!;

  const [populationSource, setPopulationSource] =
    useState<PopulationSource>(bostonZoneModel);
  const [sourceCityId, setSourceCityId] = useState<string>(DEFAULT_CITY_ID);
  const [gzSwitchLoading, setGzSwitchLoading] = useState(false);

  const loadTokenRef = useRef(0);
  useEffect(() => {
    const token = ++loadTokenRef.current;
    loadCityPopulation(cityId).then((src) => {
      if (loadTokenRef.current === token) {
        setPopulationSource(src);
        setSourceCityId(cityId);
        setGzSwitchLoading(false);
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
  const [groundZero, setGroundZero] = useState<{
    lat: number;
    lng: number;
  } | null>(initialCity ? initialCity.defaultGroundZero : null);
  const [flyToTarget, setFlyToTarget] = useState<MapProps["flyTo"]>(
    initialCity ? { ...initialCity.defaultCenter, zoom: 11, nonce: 0 } : undefined
  );

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

  /**
   * The landing hand-off. Ground zero is deliberately NOT set until the camera
   * lands: dropping it up front would draw full-country-wide rings for the
   * whole descent, which reads as an explosion the size of Texas.
   */
  const launch = useCallback(
    (city: CityEntry) => {
      setPhase((current) => {
        if (current !== "landing") return current;

        setLaunchingCity(city);
        setCityId(city.id);
        setFlyToTarget({
          ...city.defaultCenter,
          zoom: 11,
          // The only fly with a fixed duration: the chrome timings below are
          // scheduled against it.
          duration: FLY_MS,
          nonce: Date.now(),
        });

        // Rings land first, mid-descent, so the expensive casualty pass runs
        // while the camera is still moving and its cost is hidden.
        timers.current.push(
          window.setTimeout(
            () => setGroundZero(city.defaultGroundZero),
            RINGS_AT
          ),
          window.setTimeout(() => {
            setPhase("simulator");
            // The URL should describe what is on screen, but a router push
            // would remount this tree and undo the whole point. replaceState
            // updates the address bar without touching React.
            window.history.replaceState(
              null,
              "",
              `/simulator?city=${city.id}`
            );
          }, CHROME_AT)
        );

        return "flying";
      });
    },
    []
  );

  // Map marker clicks mean different things per phase: a launch from the
  // landing view, a plain city switch once inside the simulator.
  const handleCitySelect = useCallback(
    (lat: number, lng: number) => {
      const hit = CITIES.find(
        (c) =>
          Math.abs(c.defaultCenter.lat - lat) < 1e-4 &&
          Math.abs(c.defaultCenter.lng - lng) < 1e-4
      );
      if (phase !== "simulator") {
        if (hit) launch(hit);
        return;
      }
      if (hit) setCityId(hit.id);
      setGroundZero({ lat, lng });
      setFlyToTarget({ lat, lng });
    },
    [phase, launch]
  );

  const handleGroundZeroMove = useCallback(
    (lat: number, lng: number) => {
      // Clicking bare map during the landing view shouldn't drop a detonation.
      if (phase !== "simulator") return;
      setGroundZero({ lat, lng });
      const nearest = findNearestCity(lat, lng);
      setCityId((prev) => {
        if (nearest.id !== prev) {
          setGzSwitchLoading(true);
          return nearest.id;
        }
        return prev;
      });
    },
    [phase]
  );

  /** Frame the whole country. Bounds, not a fixed zoom, so it still fits once
   *  the sidebar has taken 18rem off the map's width. */
  const showCountry = useCallback(() => {
    setGroundZero(null);
    setLaunchingCity(null);
    setFlyToTarget({
      ...US_CENTER,
      bounds: US_BOUNDS,
      pitch: 0,
      bearing: 0,
      nonce: Date.now(),
    });
  }, []);

  /**
   * Two-stage, because a tilted 3D view has two things wrong with it and
   * fixing both at once loses the user. First press levels the camera in
   * place — same city, north up, flat. Only once it is already level does a
   * second press pull back to the country.
   */
  const handleResetView = useCallback(() => {
    const { pitch, bearing, zoom, center } = cameraRef.current;
    const tilted = pitch > 1 || Math.abs(bearing) > 1;
    if (tilted) {
      setFlyToTarget({
        ...center,
        zoom,
        pitch: 0,
        bearing: 0,
        duration: 900,
        nonce: Date.now(),
      });
      return;
    }
    showCountry();
  }, [showCountry]);

  const handleGoHome = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setGroundZero(null);
    setLaunchingCity(null);
    setPhase("landing");
    window.history.replaceState(null, "", "/");
    // Frame the country only AFTER the sidebar has finished closing. Fitting
    // while it is still open fits to the narrow map, and the view then reads
    // far too wide once the map expands back to full width.
    timers.current.push(
      window.setTimeout(showCountry, CHROME_IN_MS + 80)
    );
  }, [showCountry]);

  const handleCityIdChange = useCallback((id: string) => {
    const c = findCity(id);
    if (!c) return;
    setCityId(id);
    setGroundZero({ ...c.defaultGroundZero });
    setFlyToTarget({ ...c.defaultCenter });
  }, []);

  const results = useMemo(() => {
    if (!groundZero) return null;
    if (sourceCityId !== cityId) return null;
    return computeEffects(
      { yieldKt: activeYieldKt, burstType, hobM },
      { groundZero, timeOfDay, weather },
      populationSource
    );
  }, [
    activeYieldKt,
    burstType,
    hobM,
    groundZero,
    timeOfDay,
    weather,
    populationSource,
    sourceCityId,
    cityId,
  ]);

  const showChrome = phase === "simulator";
  const chromeStyle = {
    transition: `grid-template-rows ${CHROME_IN_MS}ms ${EASE}, opacity ${CHROME_IN_MS}ms ${EASE}`,
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950"
      data-phase={phase}
    >
      {/* Header — collapsed to nothing during landing so the map is full-bleed.
          grid 0fr→1fr animates to auto height, matching ResultsPanel/Legend. */}
      {/* inert while collapsed: the grid 0fr trick keeps this in the DOM so it
          can animate, which would otherwise leave a zero-height header full of
          keyboard-focusable controls sitting on top of the landing view. */}
      <div
        className="grid flex-shrink-0"
        inert={!showChrome}
        aria-hidden={!showChrome}
        style={{
          gridTemplateRows: showChrome ? "1fr" : "0fr",
          opacity: showChrome ? 1 : 0,
          ...chromeStyle,
        }}
      >
        <div className="overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                Nuclear Effects Simulator
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                MIT Laboratory for Nuclear Science
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetView}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Level a tilted view; press again for the whole country"
              >
                Reset view
              </button>
              <button
                onClick={handleGoHome}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Back to the landing view"
              >
                Home
              </button>
              <ThemeToggle />
              <Link
                href="/about"
                className="text-xs text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                About
              </Link>
            </div>
          </header>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar — width animates so the map is pushed, not covered. */}
        {/* `flex h-full` so InputsPanel stretches the full column. As a plain
            block wrapper it would size to content, leaving the panel's
            background stopping partway down the page. */}
        <div
          className="flex h-full flex-shrink-0 overflow-hidden"
          style={{
            width: showChrome ? "18rem" : "0rem",
            opacity: showChrome ? 1 : 0,
            transition: `width ${CHROME_IN_MS}ms ${EASE}, opacity ${CHROME_IN_MS}ms ${EASE}`,
          }}
          inert={!showChrome}
          aria-hidden={!showChrome}
        >
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
            onResetGroundZero={() => setGroundZero(activeCity.defaultGroundZero)}
            onCityChange={handleCityIdChange}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1">
            {/* Mounted once, for the life of the page. */}
            <Map
              center={US_CENTER}
              bounds={activeCity.bounds}
              initialZoom={US_ZOOM}
              cityMarkers={CITY_MARKERS}
              flyTo={flyToTarget}
              groundZero={groundZero}
              rings={results?.rings ?? []}
              hobM={burstType === "airburst" ? hobM : 0}
              onMapClick={handleGroundZeroMove}
              onGroundZeroDrag={handleGroundZeroMove}
              onCitySelect={handleCitySelect}
              // Derived, not state: it only has to CHANGE when the chrome
              // opens or closes. Never 0, so closing is tracked too.
              resizeTicker={showChrome ? 2 : 1}
              liveResizeMs={CHROME_IN_MS + 120}
              onViewStateChange={(v) => {
                cameraRef.current = v;
              }}
            />

            <LandingOverlay phase={phase} launchingCity={launchingCity} />
          </div>

          <div
            className="grid flex-shrink-0"
            inert={!showChrome}
            aria-hidden={!showChrome}
            style={{
              gridTemplateRows: showChrome ? "1fr" : "0fr",
              opacity: showChrome ? 1 : 0,
              ...chromeStyle,
            }}
          >
            <div className="overflow-hidden">
              <ResultsPanel
                casualties={results?.casualties ?? null}
                groundZeroPlaced={groundZero !== null}
                yieldKt={activeYieldKt}
                populationLoading={gzSwitchLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Landing masthead and rail. Floats over the map; never unmounts it. */
function LandingOverlay({
  phase,
  launchingCity,
}: {
  phase: Phase;
  launchingCity: CityEntry | null;
}) {
  const visible = phase === "landing";
  // Kept mounted through `flying` so it can fade rather than vanish, then
  // removed once the simulator owns the screen.
  if (phase === "simulator") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${CHROME_OUT_MS}ms ease-out`,
      }}
      inert={!visible}
      aria-hidden={!visible}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[var(--background)] via-[var(--background)]/65 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-[var(--background)] to-transparent"
      />

      <div className="absolute inset-0 flex flex-col justify-between">
        <header className="pointer-events-none flex items-start justify-between px-7 pt-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
              MIT Laboratory for Nuclear Science
            </p>
            <h1 className="mt-3 max-w-[15ch] text-[clamp(2.1rem,4.4vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-slate-900 dark:text-zinc-100">
              Nuclear effects,
              <br />
              mapped to scale
            </h1>
            <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              Overpressure, thermal and prompt-radiation contours for a
              detonation of any yield, drawn over real population data.
            </p>
          </div>
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </header>

        <p className="pointer-events-none self-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
          {launchingCity ? launchingCity.name : "Select a city"}
        </p>

        <footer className="pointer-events-none border-t border-slate-200/70 bg-white/70 px-7 py-4 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              {RAIL.map((item) => (
                <div key={item.k}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-[13px] tabular-nums text-slate-800 dark:text-zinc-200">
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/about"
              className="pointer-events-auto font-mono text-[10px] uppercase tracking-[0.22em] text-brand-accent underline-offset-4 hover:underline"
            >
              About the model
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
