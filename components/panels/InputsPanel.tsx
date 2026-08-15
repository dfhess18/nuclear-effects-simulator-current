"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PRESETS } from "@/lib/weapons/presets";
import type { WeaponPreset } from "@/lib/weapons/types";
import type { BurstType, Weather, TimeOfDay } from "@/lib/physics/types";
import { optimalHobM } from "@/lib/physics/blast";
import type { CityEntry } from "@/lib/cities/registry";

const MIN_YIELD_KT = 1;
const MAX_YIELD_KT = 2000;

function formatYield(kt: number): string {
  return kt >= 1000 ? `${kt / 1000} Mt` : `${kt} kt`;
}

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

  // The yield field is kept as its own draft string so a half-typed value
  // ("" while backspacing, "15" on the way to "150") isn't clamped out from
  // under the user on every keystroke. Committed to the parent only once it
  // parses to a number in range.
  // Resynced during render (not in an effect) so the field never paints a
  // stale value for a frame: React re-runs the component immediately, before
  // committing anything to the DOM.
  const [yieldDraft, setYieldDraft] = useState(String(customYieldKt));
  const [lastYieldProp, setLastYieldProp] = useState(customYieldKt);
  if (customYieldKt !== lastYieldProp) {
    setLastYieldProp(customYieldKt);
    setYieldDraft(String(customYieldKt));
  }

  const clampYield = (n: number) =>
    Math.min(MAX_YIELD_KT, Math.max(MIN_YIELD_KT, Math.round(n)));

  const handleYieldInput = (raw: string) => {
    setYieldDraft(raw);
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    onCustomYieldChange(clampYield(n));
  };

  // On blur (or Enter) snap the field back to a legal value so it can never be
  // left showing something the simulation isn't actually using.
  const normalizeYield = () => {
    const n = Number(yieldDraft);
    if (yieldDraft.trim() === "" || !Number.isFinite(n)) {
      setYieldDraft(String(customYieldKt));
      return;
    }
    const clamped = clampYield(n);
    setYieldDraft(String(clamped));
    onCustomYieldChange(clamped);
  };

  return (
    <ScrollArea className="w-72 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800">
      <Tabs defaultValue="weapon" className="p-5 gap-4">
        <TabsList className="w-full grid grid-cols-3 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-800/60">
          <TabsTrigger
            value="weapon"
            className="text-xs data-active:text-brand-accent dark:data-active:text-brand-accent"
          >
            Weapon
          </TabsTrigger>
          <TabsTrigger
            value="conditions"
            className="text-xs data-active:text-brand-accent dark:data-active:text-brand-accent"
          >
            Conditions
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="text-xs data-active:text-brand-accent dark:data-active:text-brand-accent"
          >
            Location
          </TabsTrigger>
        </TabsList>

        {/* ── Weapon: yield selection + burst geometry ───────────────────── */}
        <TabsContent value="weapon" className="space-y-5">
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
                  <SelectTrigger className="text-sm w-full" aria-label="Weapon preset">
                    <SelectValue>{preset.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">
                        {/* Hovering an item previews its yield, burst geometry
                            and historical note before committing to it. The
                            trigger renders a <span> because the primitive's
                            default element is an <a>. */}
                        <HoverCard>
                          <HoverCardTrigger render={<span className="flex-1" />}>
                            {p.label}
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="right"
                            align="start"
                            sideOffset={12}
                            className="w-64"
                          >
                            <p className="font-medium mb-1.5">{p.label}</p>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs mb-2">
                              <dt className="text-muted-foreground">Yield</dt>
                              <dd className="tabular-nums">
                                {formatYield(p.yieldKt)}
                              </dd>
                              <dt className="text-muted-foreground">Burst</dt>
                              <dd>
                                {p.defaultBurstType === "airburst"
                                  ? "Airburst"
                                  : "Surface burst"}
                              </dd>
                              <dt className="text-muted-foreground">
                                Optimal HOB
                              </dt>
                              <dd className="tabular-nums">
                                {Math.round(p.defaultHobM).toLocaleString()} m
                              </dd>
                            </dl>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {p.historicalNote}
                            </p>
                          </HoverCardContent>
                        </HoverCard>
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
                {/* Slider for coarse sweeps, number field for exact entry —
                    dragging to 550 kt out of 2,000 is not realistic. */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Label
                    htmlFor="custom-yield-input"
                    className="text-sm text-slate-600 dark:text-zinc-400"
                  >
                    Yield
                  </Label>
                  <div className="relative">
                    <Input
                      id="custom-yield-input"
                      type="number"
                      inputMode="numeric"
                      min={MIN_YIELD_KT}
                      max={MAX_YIELD_KT}
                      step={1}
                      value={yieldDraft}
                      onChange={(e) => handleYieldInput(e.target.value)}
                      onBlur={normalizeYield}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") normalizeYield();
                      }}
                      aria-label="Custom yield in kilotons"
                      className="h-7 w-[5.5rem] pr-7 text-sm tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-zinc-500">
                      kt
                    </span>
                  </div>
                </div>
                <Slider
                  id="custom-yield"
                  min={MIN_YIELD_KT}
                  max={MAX_YIELD_KT}
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
                  <SelectTrigger className="text-sm w-full" aria-label="Burst type">
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
        </TabsContent>

        {/* ── Conditions: sheltering and atmospheric transmission ────────── */}
        <TabsContent value="conditions" className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3">
              Conditions
            </h2>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-slate-600 dark:text-zinc-400 mb-1 block">Time of day</Label>
                {/* Base UI ToggleGroup is multi-select by design, so the value
                    is an array. Ignoring an empty array keeps this
                    single-select: clicking the active option can't deselect
                    it and leave the model with no time of day. */}
                <ToggleGroup
                  value={[timeOfDay]}
                  onValueChange={(v) => {
                    const next = v[0] as TimeOfDay | undefined;
                    if (next) onTimeOfDayChange(next);
                  }}
                  variant="outline"
                  spacing={0}
                  aria-label="Time of day"
                  className="w-full"
                >
                  {(["day", "night"] as const).map((t) => (
                    <ToggleGroupItem
                      key={t}
                      value={t}
                      className="flex-1 text-sm data-pressed:bg-brand data-pressed:text-brand-fg data-pressed:border-brand"
                    >
                      {t === "day" ? "Day" : "Night"}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
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
                  <SelectTrigger className="text-sm w-full" aria-label="Weather visibility">
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
        </TabsContent>

        {/* ── Location: active city + ground zero ────────────────────────── */}
        <TabsContent value="location" className="space-y-5">
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
              {/* alignItemWithTrigger={false} disables the iOS-style pinning of
                  the selected item to the trigger position. Without this, when
                  Boston is selected the popup opens with Boston anchored to the
                  trigger and items above (Austin, etc.) get clipped above the
                  viewport — making it impossible to scroll up to them. */}
              <SelectContent alignItemWithTrigger={false}>
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
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
}
