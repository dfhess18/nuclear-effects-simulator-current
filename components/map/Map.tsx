/**
 * Map.tsx — Mapbox GL JS implementation.
 *
 * This is the ONLY file that imports from mapbox-gl.
 * The prop interface (MapProps) is defined in ./types.ts and must not change.
 * All consumers receive EffectRing[] from lib/physics/types — no Mapbox types leak out.
 *
 * Ring rendering is handled imperatively via GeoJSON sources/layers.
 * EffectRings.tsx (react-leaflet) is no longer used.
 */
"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapProps } from "./types";
import type { EffectRing } from "../../lib/physics/types";
import { Legend } from "./Legend";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type StyleId = "streets" | "light" | "dark";

const STYLES: Record<StyleId, { url: string; label: string }> = {
  streets: { url: "mapbox://styles/mapbox/streets-v12", label: "Standard" },
  light:   { url: "mapbox://styles/mapbox/light-v11",   label: "Light" },
  dark:    { url: "mapbox://styles/mapbox/dark-v11",    label: "Dark" },
};

const SOURCE_ID = "effect-rings";
const FILL_LAYER = "effect-rings-fill";
const STROKE_LAYER = "effect-rings-stroke";

/** Approximate a circle as a GeoJSON polygon (64 vertices). */
function circleCoords(
  lat: number,
  lng: number,
  radiusM: number,
  steps = 64
): [number, number][] {
  const latRad = (lat * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dlat = (radiusM * Math.cos(angle)) / 111320;
    const dlng = (radiusM * Math.sin(angle)) / (111320 * Math.cos(latRad));
    coords.push([lng + dlng, lat + dlat]);
  }
  return coords;
}

function ringsToGeoJSON(
  rings: EffectRing[],
  gz: { lat: number; lng: number }
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    // largest first so fills layer correctly (each ring is a full disk, not annulus)
    features: [...rings]
      .sort((a, b) => b.radiusM - a.radiusM)
      .map((ring) => ({
        type: "Feature" as const,
        properties: {
          color: ring.color,
          fillOpacity: ring.fillOpacity,
          thresholdLabel: ring.thresholdLabel,
          physicalDescription: ring.physicalDescription,
          radiusM: ring.radiusM,
          casualtyRateInner: ring.casualtyRateInner,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [circleCoords(gz.lat, gz.lng, ring.radiusM)],
        },
      })),
  };
}

function setupRingLayers(map: mapboxgl.Map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer(FILL_LAYER)) {
    map.addLayer({
      id: FILL_LAYER,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["get", "fillOpacity"],
      },
    });
  }
  if (!map.getLayer(STROKE_LAYER)) {
    map.addLayer({
      id: STROKE_LAYER,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.8,
      },
    });
  }
}

export default function Map({
  center,
  groundZero,
  rings,
  initialZoom = 12,
  cityMarkers,
  onMapClick,
  onGroundZeroDrag,
  onCitySelect,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const gzMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const cityMarkerRefs = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [styleId, setStyleId] = useState<StyleId>("light");

  // Stable refs so event handlers in imperative callbacks never go stale
  const onMapClickRef = useRef(onMapClick);
  const onGroundZeroDragRef = useRef(onGroundZeroDrag);
  const onCitySelectRef = useRef(onCitySelect);
  const ringsRef = useRef(rings);
  const groundZeroRef = useRef(groundZero);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onGroundZeroDragRef.current = onGroundZeroDrag; }, [onGroundZeroDrag]);
  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);
  useEffect(() => { ringsRef.current = rings; }, [rings]);
  useEffect(() => { groundZeroRef.current = groundZero; }, [groundZero]);

  // ── Map initialisation (runs once on mount) ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLES.light.url,
      center: [center.lng, center.lat],
      zoom: initialZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    // Re-add ring sources/layers every time a new style finishes loading
    // (covers initial load AND subsequent setStyle() calls)
    map.on("style.load", () => {
      setupRingLayers(map);
      const gz = groundZeroRef.current;
      const r = ringsRef.current;
      if (gz && r.length > 0) {
        (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(
          ringsToGeoJSON(r, gz)
        );
      }
    });

    // Map click → place / move ground zero
    map.on("click", (e) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    // Ring hover tooltip
    map.on("mousemove", FILL_LAYER, (e) => {
      map.getCanvas().style.cursor = "crosshair";
      const feat = e.features?.[0];
      if (!feat?.properties) return;
      const p = feat.properties as {
        thresholdLabel: string;
        physicalDescription: string;
        radiusM: number;
        casualtyRateInner: number;
      };
      const html = `
        <div style="font-size:12px;max-width:210px;font-family:system-ui,sans-serif;line-height:1.4">
          <p style="font-weight:600;margin:0 0 3px">${p.thresholdLabel}</p>
          <p style="color:#555;margin:0 0 3px">${p.physicalDescription}</p>
          <p style="color:#777;margin:0 0 3px">
            Radius: ${(p.radiusM / 1000).toFixed(2)} km /
            ${(p.radiusM / 1609.34).toFixed(2)} mi
          </p>
          ${
            p.casualtyRateInner > 0
              ? `<p style="color:#777;margin:0">Est. fatality rate inside: ${Math.round(p.casualtyRateInner * 100)}%</p>`
              : ""
          }
        </div>`;
      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
      })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    map.on("mouseleave", FILL_LAYER, () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
      popupRef.current = null;
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Style switching ───────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.setStyle(STYLES[styleId].url);
    // style.load handler (set up in init effect) re-adds layers and restores data
  }, [styleId]);

  // ── Ring data update ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    if (groundZero && rings.length > 0) {
      source.setData(ringsToGeoJSON(rings, groundZero));
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [rings, groundZero]);

  // ── Ground zero marker ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!groundZero) {
      gzMarkerRef.current?.remove();
      gzMarkerRef.current = null;
      return;
    }

    if (!gzMarkerRef.current) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        background: "#ef4444",
        border: "2.5px solid #fff",
        boxShadow: "0 0 0 1.5px #ef4444,0 2px 6px rgba(0,0,0,0.4)",
        cursor: "grab",
      });

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([groundZero.lng, groundZero.lat])
        .addTo(map);

      // Update ring GeoJSON live during drag (no React re-render needed)
      marker.on("drag", () => {
        const { lng, lat } = marker.getLngLat();
        const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        if (source && ringsRef.current.length > 0) {
          source.setData(ringsToGeoJSON(ringsRef.current, { lat, lng }));
        }
      });

      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        onGroundZeroDragRef.current?.(lat, lng);
      });

      gzMarkerRef.current = marker;
    } else {
      gzMarkerRef.current.setLngLat([groundZero.lng, groundZero.lat]);
    }
  }, [groundZero]);

  // ── City markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    cityMarkerRefs.current.forEach((m) => m.remove());
    cityMarkerRefs.current = [];

    (cityMarkers ?? []).forEach((city) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:14px;height:14px;";

      const dot = document.createElement("div");
      Object.assign(dot.style, {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#2563eb",
        border: "2.5px solid #fff",
        boxShadow: "0 0 0 1.5px #2563eb,0 2px 6px rgba(0,0,0,0.4)",
        cursor: "pointer",
      });

      const label = document.createElement("div");
      label.textContent = city.label;
      label.style.cssText = [
        "position:absolute",
        "bottom:18px",
        "left:50%",
        "transform:translateX(-50%)",
        "background:white",
        "color:#1e293b",
        "padding:2px 6px",
        "border-radius:4px",
        "font-size:11px",
        "font-weight:500",
        "white-space:nowrap",
        "box-shadow:0 1px 4px rgba(0,0,0,0.2)",
        "pointer-events:none",
      ].join(";");

      wrapper.appendChild(dot);
      wrapper.appendChild(label);

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        onCitySelectRef.current?.(city.lat, city.lng);
        map.flyTo({ center: [city.lng, city.lat], zoom: 12, duration: 1200 });
      });

      const marker = new mapboxgl.Marker({ element: wrapper })
        .setLngLat([city.lng, city.lat])
        .addTo(map);

      cityMarkerRefs.current.push(marker);
    });
  }, [cityMarkers]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Style switcher */}
      <div className="absolute top-2 right-2 z-10 flex rounded-md overflow-hidden border border-slate-300 dark:border-zinc-600 shadow-sm">
        {(Object.keys(STYLES) as StyleId[]).map((s) => (
          <button
            key={s}
            onClick={() => setStyleId(s)}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
              styleId === s
                ? "bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-slate-800"
            }`}
            aria-pressed={styleId === s}
          >
            {STYLES[s].label}
          </button>
        ))}
      </div>

      {groundZero && rings.length > 0 && <Legend rings={rings} />}
    </div>
  );
}
