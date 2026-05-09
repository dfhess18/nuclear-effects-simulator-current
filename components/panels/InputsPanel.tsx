"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PRESETS } from "@/lib/weapons/presets";
import type { WeaponPreset } from "@/lib/weapons/types";
import type { BurstType, Weather, TimeOfDay } from "@/lib/physics/types";
import { optimalHobM } from "@/lib/physics/blast";
import type { CityEntry } from "@/lib/cities/registry";

interface InputsPanelProps {
  preset: WeaponPreset;
  customYieldKt: number;
  useCustomYield: boolean;
  burstType: BurstType;
  hobM: number;
  timeOfDay: TimeOfDay;
  weather: Weather;
  groundZero: { lat: number; lng: number } | null;
  cityId: string;
  cities: CityEntry[];

  onPresetChange: (preset: WeaponPreset) => void;
  onCustomYieldChange: (kt: number) => void;
  onUseCustomYieldChange: (v: boolean) => void;
  onBurstTypeChange: (b: BurstType) => void;
  onHobChange: (m: number) => void;
  onTimeOfDayChange: (t: TimeOfDay) => void;
  onWeatherChange: (w: Weather) => void;
  onResetGroundZero: () => void;
  onCityChange: (id: string) => void;
}

export function InputsPanel({
  preset,
  customYieldKt,
  useCustomYield,
  burstType,
  hobM,
  timeOfDay,
  weather,
  groundZero,
  cityId,
  cities,
  onPresetChange,
  onCustomYieldChange,
  onUseCustomYieldChange,
  onBurstTypeChange,
  onHobChange,
  onTimeOfDayChange,
  onWeatherChange,
  onResetGroundZero,
  onCityChange,
}: InputsPanelProps) {
  const activeYield = useCustomYield ? customYieldKt : preset.yieldKt;
  const activeCity = cities.find((c) => c.id === cityId);
  // Sort alphabetically for the dropdown — easier to scan 21 cities.
  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside className="w-72 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto">
      <div className="p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-0.5">
            Weapon
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3">
            Select a preset or enter a custom yield.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <Switch
              id="custom-yield-toggle"
              checked={useCustomYield}
              onCheckedChange={onUseCustomYieldChange}
              aria-label="Use custom yield"
            />
            <Label htmlFor="custom-yield-toggle" className="text-sm text-slate-600 dark:text-zinc-400">
              Custom yield
            </Label>
          </div>

          {!useCustomYield ? (
            <div>
              <Label className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block">Preset</Label>
              <Select
                value={preset.id}
                onValueChange={(id) => {
                  const p = PRESETS.find((p) => p.id === id);
                  if (p) onPresetChange(p);
                }}
              >
                <SelectTrigger className="text-sm" aria-label="Weapon preset">
                  <SelectValue>{preset.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preset.historicalNote && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 leading-snug">
                  {preset.historicalNote}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label
                htmlFor="custom-yield"
                className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block"
              >
                Yield: {customYieldKt} kt
              </Label>
              <Slider
                id="custom-yield"
                min={1}
                max={2000}
                step={1}
                value={customYieldKt}
                onValueChange={(v) =>
                  onCustomYieldChange(Array.isArray(v) ? v[0] : v)
                }
                aria-label={`Custom yield ${customYieldKt} kilotons`}
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                <span>1 kt</span>
                <span>2,000 kt</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3">
            Burst parameters
          </h2>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block">Burst type</Label>
              <Select
                value={burstType}
                onValueChange={(v) => {
                  onBurstTypeChange(v as BurstType);
                }}
              >
                <SelectTrigger className="text-sm" aria-label="Burst type">
                  <SelectValue>{burstType === "airburst" ? "Airburst" : "Surface burst"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airburst" className="text-sm">
                    Airburst
                  </SelectItem>
                  <SelectItem value="surface" className="text-sm">
                    Surface burst
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {burstType === "airburst" && (
              <div>
                <Label
                  htmlFor="hob-slider"
                  className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block"
                >
                  Burst height: {hobM.toLocaleString()} m
                </Label>
                <Slider
                  id="hob-slider"
                  min={100}
                  max={Math.max(10000, optimalHobM(activeYield) * 2)}
                  step={50}
                  value={hobM}
                  onValueChange={(v) =>
                    onHobChange(Array.isArray(v) ? v[0] : v)
                  }
                  aria-label={`Burst height ${hobM} meters`}
                />
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  Optimal for 5 psi coverage: {optimalHobM(activeYield).toLocaleString()} m
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3">
            Conditions
          </h2>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block">Time of day</Label>
              <div
                className="flex rounded-md border border-slate-200 dark:border-zinc-700 overflow-hidden"
                role="group"
                aria-label="Time of day"
              >
                {(["day", "night"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onTimeOfDayChange(t)}
                    className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                      timeOfDay === t
                        ? "bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                        : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    aria-pressed={timeOfDay === t}
                  >
                    {t === "day" ? "Day" : "Night"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                {timeOfDay === "day"
                  ? "50% indoors / 50% outdoors (workday)"
                  : "70% indoors / 30% outdoors (residential)"}
              </p>
            </div>

            <div>
              <Label className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block">Visibility</Label>
              <Select
                value={weather}
                onValueChange={(v) => onWeatherChange(v as Weather)}
              >
                <SelectTrigger className="text-sm" aria-label="Weather visibility">
                  <SelectValue>
                    {weather === "clear" ? "Clear (transmission 90%)" : weather === "hazy" ? "Hazy (transmission 60%)" : "Overcast (transmission 30%)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear" className="text-sm">
                    Clear (transmission 90%)
                  </SelectItem>
                  <SelectItem value="hazy" className="text-sm">
                    Hazy (transmission 60%)
                  </SelectItem>
                  <SelectItem value="overcast" className="text-sm">
                    Overcast (transmission 30%)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
            Ground zero
          </h2>
          {groundZero ? (
            <div className="space-y-1.5">
              <p className="text-xs font-mono text-slate-700 dark:text-zinc-300">
                {groundZero.lat.toFixed(5)}° N
              </p>
              <p className="text-xs font-mono text-slate-700 dark:text-zinc-300">
                {Math.abs(groundZero.lng).toFixed(5)}°{" "}
                {groundZero.lng < 0 ? "W" : "E"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={onResetGroundZero}
              >
                Reset to {activeCity?.name.split(",")[0] ?? "city"} default
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Set a ground zero to get started.
            </p>
          )}
        </div>

        <Separator />

        {/* City selector — switching pans the map and drops GZ on the new
            city's default landmark. The dropdown is alphabetised so 21
            entries are easy to scan. */}
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
            City
          </h2>
          <Select
            value={cityId}
            onValueChange={(v) => {
              if (typeof v === "string") onCityChange(v);
            }}
          >
            <SelectTrigger className="text-sm w-full" aria-label="Active city">
              <SelectValue>{activeCity?.name ?? "Select a city"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortedCities.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-sm">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 leading-snug">
            Casualty estimates use US Census block-group population data
            for the active city.
          </p>
        </div>
      </div>
    </aside>
  );
}
