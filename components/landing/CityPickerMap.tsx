"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import { CITIES, type CityEntry } from "@/lib/cities/registry";
import { useTheme } from "@/lib/theme/useTheme";

/**
 * The landing page's live map: the continental US with all 21 modelled cities
 * as targets. Picking one flies the camera down to it and then hands off to
 * /simulator?city=<id>, which seeds itself from that param so the zoom the
 * user started here continues rather than restarting.
 *
 * Both landing designs share this; only `variant` and the surrounding layout
 * differ. Kept separate from components/map/Map.tsx, which carries the
 * simulator's ring layers, 3D spheres and drag handling — none of which
 * belong on a landing page.
 */

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/** Continental US. Framed with fitBounds rather than a fixed center/zoom so
 *  the composition holds at any container aspect — a fixed zoom that frames
 *  the country in a short hero shows Canada to the Caribbean in a tall one. */
const US_BOUNDS: [[number, number], [number, number]] = [
  [-125.2, 24.4],
  [-66.6, 49.6],
];
/** The immersive hero reserves room for the masthead and rail; the framed
 *  panel has its own border doing that job and wants a tighter crop. */
const FIT_BY_VARIANT = {
  immersive: { top: 96, right: 72, bottom: 112, left: 72 },
  framed: { top: 28, right: 28, bottom: 28, left: 28 },
} as const;
/** Long enough to read as a descent rather than a cut. */
export const FLY_MS = 1750;

const STYLE = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
} as const;

export interface CityPickerMapProps {
  /** immersive = full-bleed hero; framed = panel beside an index. */
  variant: "immersive" | "framed";
  /** Highlighted from an external list (framed variant). */
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  /** Fired the moment a city is chosen, before the flight finishes. */
  onSelect?: (city: CityEntry) => void;
  /** Suppresses interaction once a launch is underway. */
  launching?: boolean;
  className?: string;
}

export function CityPickerMap({
  variant,
  activeId = null,
  onHover,
  onSelect,
  launching = false,
  className = "",
}: CityPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const fitRef = useRef(FIT_BY_VARIANT[variant]);
  const [ready, setReady] = useState(false);

  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  // Stable handles for the imperative Mapbox callbacks.
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const launchingRef = useRef(launching);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);
  useEffect(() => {
    launchingRef.current = launching;
  }, [launching]);

  const pick = useCallback((city: CityEntry) => {
    if (launchingRef.current) return;
    launchingRef.current = true;
    onSelectRef.current?.(city);
    mapRef.current?.flyTo({
      center: [city.defaultCenter.lng, city.defaultCenter.lat],
      zoom: 10.5,
      duration: FLY_MS,
      essential: true,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE[themeRef.current === "dark" ? "dark" : "light"],
      center: [-96.5, 38.6],
      zoom: 3,
      // A landing page map is a picture you choose from, not a map you pan.
      // Removing the pan/zoom affordances keeps the composition fixed and
      // stops a stray scroll from hijacking the page.
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.fitBounds(US_BOUNDS, { padding: fitRef.current, duration: 0 });

    map.on("load", () => {
      for (const city of CITIES) {
        const el = document.createElement("div");
        el.className = "cpm-pin";
        el.dataset.cityId = city.id;
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", `Model a detonation in ${city.name}`);
        // Visuals live on inner nodes: Mapbox rewrites the marker root's
        // inline transform and opacity every frame to position it.
        el.innerHTML =
          '<span class="cpm-halo"></span>' +
          '<span class="cpm-ring"></span>' +
          '<span class="cpm-core"></span>' +
          `<span class="cpm-name">${city.name.split(",")[0]}</span>`;

        const activate = () => pick(city);
        el.addEventListener("click", activate);
        el.addEventListener("keydown", (e) => {
          const key = (e as KeyboardEvent).key;
          if (key === "Enter" || key === " ") {
            e.preventDefault();
            activate();
          }
        });
        el.addEventListener("mouseenter", () => onHoverRef.current?.(city.id));
        el.addEventListener("mouseleave", () => onHoverRef.current?.(null));
        el.addEventListener("focus", () => onHoverRef.current?.(city.id));
        el.addEventListener("blur", () => onHoverRef.current?.(null));

        new mapboxgl.Marker({ element: el })
          .setLngLat([city.defaultCenter.lng, city.defaultCenter.lat])
          .addTo(map);
      }
      setReady(true);
    });

    // Mapbox sizes itself once at construction. Inside a flex/grid hero the
    // container is frequently still zero-height at that moment, which leaves
    // the canvas a letterbox strip; it does not observe the container itself.
    const ro = new ResizeObserver(() => {
      map.resize();
      // Re-frame on resize, but never while a launch flight is in progress —
      // re-fitting mid-flyTo would yank the camera back out.
      if (!launchingRef.current) {
        map.fitBounds(US_BOUNDS, { padding: fitRef.current, duration: 0 });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [pick]);

  // Follow the app theme. setStyle drops markers, so they are re-added by the
  // load handler above only on first build; here we swap style and re-attach.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(STYLE[resolvedTheme === "dark" ? "dark" : "light"]);
  }, [resolvedTheme, ready]);

  // Reflect the externally-hovered row (framed variant) onto the pins. The
  // pins are queried from the DOM rather than held in a ref: Mapbox owns those
  // nodes, and keeping a ref-held collection of them just to mutate it inside
  // an effect is what react-hooks/immutability (rightly) rejects.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".cpm-pin").forEach((el) => {
      el.dataset.active = String(el.dataset.cityId === activeId);
    });
  }, [activeId, ready]);

  return (
    // cn(), not template concat: callers pass `absolute inset-0`, and a
    // hardcoded `relative` here would collide with it. Without tailwind-merge
    // both position utilities survive and the wrapper collapses to content
    // height, leaving the map a letterbox strip.
    <div className={cn("relative", className)} data-variant={variant}>
      {/* Sized with h/w rather than `absolute inset-0`: Mapbox adds its own
          .mapboxgl-map class, and mapbox-gl.css is imported UNLAYERED, so its
          `position: relative` outranks Tailwind's layered `absolute` and the
          container collapses to a letterbox strip. Sizing avoids the fight. */}
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-current/40">
            Loading map
          </span>
        </div>
      )}
    </div>
  );
}
