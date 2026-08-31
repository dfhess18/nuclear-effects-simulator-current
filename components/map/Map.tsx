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
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapProps, RingPopupData } from "./types";
import type { EffectRing } from "../../lib/physics/types";
import { Legend } from "./Legend";
import { RingPopup } from "./RingPopup";
import { createBlastSpheresLayer, type BlastSpheresLayer } from "./blastSpheres";
import { useTheme } from "@/lib/theme/useTheme";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type StyleId = "streets" | "light" | "dark";
/** "auto" derives the style from the app theme; anything else pins it. */
type StylePreference = "auto" | StyleId;

const MAP_STYLE_KEY = "mapStyle";

const STYLES: Record<StyleId, { url: string; label: string }> = {
  streets: { url: "mapbox://styles/mapbox/streets-v12", label: "Standard" },
  light:   { url: "mapbox://styles/mapbox/light-v11",   label: "Light" },
  dark:    { url: "mapbox://styles/mapbox/dark-v11",    label: "Dark" },
};

const STYLE_CHOICES: StylePreference[] = ["auto", "streets", "light", "dark"];

function styleLabel(p: StylePreference): string {
  return p === "auto" ? "Auto" : STYLES[p].label;
}

/** Roomy enough that the whole continental US always fits at MIN_ZOOM, tight
 *  enough that the camera can't wander to another continent. */
export const US_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-140, 16],
  [-56, 56],
];
/** Padding used when framing US_BOUNDS, leaving space for the landing rail. */
const FIT_PADDING = { top: 70, right: 60, bottom: 90, left: 60 };
/** Stops the user zooming out past the country. */
const MIN_ZOOM = 2.7;

const SOURCE_ID = "effect-rings";
const FILL_LAYER = "effect-rings-fill";
const STROKE_LAYER = "effect-rings-stroke";
const BLAST_SPHERES_LAYER = "blast-spheres";

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
    // largest first so fills render correctly (each ring is a full disk, not annulus)
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
  hobM = 0,
  initialZoom = 12,
  cityMarkers,
  flyTo,
  onMapClick,
  onGroundZeroDrag,
  onCitySelect,
  onViewStateChange,
  resizeTicker = 0,
  liveResizeMs = 600,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const gzMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const cityMarkerRefs = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const blastLayerRef = useRef<BlastSpheresLayer | null>(null);
  // Which ring the popup is currently describing, compared by threshold label
  // so pointer movement within one ring doesn't re-render React.
  const hoveredKeyRef = useRef<string | null>(null);
  const [hoveredRing, setHoveredRing] = useState<RingPopupData | null>(null);
  // Detached node the popup owns and React portals into. State rather than a
  // ref because it IS render-relevant — it's the portal target.
  const [popupHost, setPopupHost] = useState<HTMLDivElement | null>(null);

  const { resolvedTheme } = useTheme();
  // Lazy initializer is safe: this component is loaded with ssr:false, so it
  // never runs on the server.
  const [stylePref, setStylePref] = useState<StylePreference>(() => {
    try {
      const stored = localStorage.getItem(MAP_STYLE_KEY);
      if (stored && (STYLE_CHOICES as string[]).includes(stored)) {
        return stored as StylePreference;
      }
    } catch {
      // Private mode — fall through to the default.
    }
    return "auto";
  });
  // resolvedTheme is already "light" | "dark", both valid StyleIds.
  const styleId: StyleId = stylePref === "auto" ? resolvedTheme : stylePref;

  // Stable refs so event handlers in imperative Mapbox callbacks never go stale
  const onMapClickRef = useRef(onMapClick);
  const onGroundZeroDragRef = useRef(onGroundZeroDrag);
  const onCitySelectRef = useRef(onCitySelect);
  const onViewStateChangeRef = useRef(onViewStateChange);
  const ringsRef = useRef(rings);
  const groundZeroRef = useRef(groundZero);
  const hobMRef = useRef(hobM);

  // What we WANT rendered — written by ring update effect, read by style-load
  // handler so rings survive style changes without relying on isStyleLoaded().
  const desiredGeoJSON = useRef<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  // Prevents the style-switch effect from calling setStyle on the first render
  // (the map is already initialised with STYLES.light.url; a second setStyle call
  // on an in-progress load triggers the "Rebuilding from scratch" warning and
  // can race with the ring data update).
  const styleInitialized = useRef(false);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onGroundZeroDragRef.current = onGroundZeroDrag; }, [onGroundZeroDrag]);
  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);
  useEffect(() => { onViewStateChangeRef.current = onViewStateChange; }, [onViewStateChange]);
  useEffect(() => { ringsRef.current = rings; }, [rings]);
  useEffect(() => { groundZeroRef.current = groundZero; }, [groundZero]);
  useEffect(() => { hobMRef.current = hobM; }, [hobM]);

  // ── Map initialisation (runs once on mount) ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // styleId is already correct on first render — this component mounts
      // post-hydration, so resolvedTheme is settled. The map is born in the
      // right style: no initial setStyle, no flash.
      style: STYLES[styleId].url,
      center: [center.lng, center.lat],
      zoom: initialZoom,
      // Start flat. Users can right-click + drag (or shift-drag the compass) to
      // tilt into a 3D view; the blast spheres appear as the pitch increases.
      pitch: 0,
      maxPitch: 80,
      // The tool only models US cities, so the camera is fenced to them.
      maxBounds: US_MAX_BOUNDS,
      minZoom: MIN_ZOOM,
    });

    // visualizePitch lets the compass show the current pitch state, so users
    // get a visual cue that the map can be tilted to reveal 3D.
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-left"
    );

    // Restore sources/layers and ring data after any style load.
    // Listening to BOTH 'load' (initial) and 'style.load' (setStyle changes)
    // ensures we never miss the setup, regardless of which fires first. Both
    // events fire on the initial map load, so this handler is idempotent —
    // it must NOT re-create the custom layer if one is already attached, or
    // addLayer throws "Layer already exists" and orphans the live instance.
    const onReady = () => {
      setupRingLayers(map);
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(
        desiredGeoJSON.current
      );
      // Reuse the SAME layer instance across style swaps. setStyle() detaches
      // custom layers, but the instance holds a WebGLRenderer, a shared
      // SphereGeometry and per-ring materials — building a fresh one each time
      // leaked all three over the same GL context, which mattered little when
      // style changes were rare but does now that the map follows the theme.
      if (!blastLayerRef.current) {
        blastLayerRef.current = createBlastSpheresLayer();
      }
      if (!map.getLayer(BLAST_SPHERES_LAYER)) {
        map.addLayer(blastLayerRef.current);
      }
      blastLayerRef.current?.setBurst(
        groundZeroRef.current,
        hobMRef.current,
        ringsRef.current
      );
    };
    map.on("load", onReady);
    map.on("style.load", onReady);

    // Report camera orientation so the parent can decide what "reset" means
    // next: level a tilted view first, then zoom back out to the country.
    const reportView = () => {
      const c = map.getCenter();
      onViewStateChangeRef.current?.({
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        zoom: map.getZoom(),
        center: { lat: c.lat, lng: c.lng },
      });
    };
    map.on("moveend", reportView);
    map.on("pitchend", reportView);
    map.on("rotateend", reportView);

    // Map click → place / move ground zero
    map.on("click", (e) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    // Ring hover callout. ONE popup for the map's lifetime, portalled into a
    // detached host — the previous implementation parsed an HTML string and
    // constructed a new Popup on every mousemove (Mapbox fires those at
    // pointer rate).
    const host = document.createElement("div");
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      // 12 rather than 8 so the callout clears the cursor.
      offset: 12,
      className: "ring-popup",
      maxWidth: "none",
    }).setDOMContent(host);

    map.on("mousemove", FILL_LAYER, (e) => {
      map.getCanvas().style.cursor = "crosshair";
      const feat = e.features?.[0];
      if (!feat?.properties) return;
      const p = feat.properties as RingPopupData;

      // Position is imperative and never touches React.
      popupRef.current?.setLngLat(e.lngLat).addTo(map);

      // Content changes only when the pointer crosses into a different ring,
      // so React renders a handful of times per session rather than ~60/s.
      if (hoveredKeyRef.current !== p.thresholdLabel) {
        hoveredKeyRef.current = p.thresholdLabel;
        setHoveredRing({
          thresholdLabel: p.thresholdLabel,
          physicalDescription: p.physicalDescription,
          radiusM: p.radiusM,
          casualtyRateInner: p.casualtyRateInner,
          color: p.color,
        });
      }
    });

    map.on("mouseleave", FILL_LAYER, () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
      hoveredKeyRef.current = null;
      setHoveredRing(null);
    });

    mapRef.current = map;
    // Gives the portal a target; also gates the portal on the map existing.
    setPopupHost(host);

    // Mapbox doesn't observe container size changes automatically. A
    // ResizeObserver calls map.resize() when the flex layout shifts (e.g. the
    // ResultsPanel expanding/collapsing). We DEBOUNCE it: calling resize() on
    // every frame of the panel's height transition makes Mapbox repaint each
    // frame, flashing the container background. Instead we resize once ~140ms
    // after the size settles. During the transition the canvas is simply
    // clipped (on expand) or briefly shows the map-colored background (on
    // collapse), then snaps to the final size in a single, flash-free repaint.
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => map.resize(), 140);
    });
    ro.observe(containerRef.current!);

    return () => {
      clearTimeout(resizeTimer);
      ro.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      setPopupHost(null);
      // Only place the GPU resources are actually released — onRemove() now
      // just detaches so style swaps can re-add the same instance.
      blastLayerRef.current?.dispose();
      blastLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fly-to (city switching) ───────────────────────────────────────────────
  // The parent passes flyTo only when the user has actively picked a city
  // (dropdown / marker click). On initial mount it's `undefined`, so the map
  // stays at its country-level overview. Each subsequent change of flyTo
  // (.lat or .lng) animates the camera to the new target. A ref-based
  // "skip initial" guard would work in production but double-fires in React
  // strict mode and ends up flying anyway, so the parent owns this signal.
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    const map = mapRef.current;

    // Bounds mode: frame a region regardless of container aspect. A fixed
    // zoom can't do this — the same zoom shows far less once the sidebar
    // takes 18rem off the map's width.
    if (flyTo.bounds) {
      map.fitBounds(flyTo.bounds, {
        padding: FIT_PADDING,
        pitch: flyTo.pitch ?? 0,
        bearing: flyTo.bearing ?? 0,
        duration: flyTo.duration ?? 1600,
        essential: true,
      });
      return;
    }

    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 12,
      ...(flyTo.pitch !== undefined && { pitch: flyTo.pitch }),
      ...(flyTo.bearing !== undefined && { bearing: flyTo.bearing }),
      // With no explicit duration Mapbox derives one from the distance, so a
      // coast-to-coast switch takes proportionally longer rather than being
      // crammed into the same window and tearing through tiles.
      ...(flyTo.duration !== undefined
        ? { duration: flyTo.duration }
        : { speed: 0.9, curve: 1.42, maxDuration: 4200 }),
      essential: true,
    });
  }, [
    flyTo?.lat,
    flyTo?.lng,
    flyTo?.zoom,
    flyTo?.pitch,
    flyTo?.bearing,
    flyTo?.duration,
    flyTo?.bounds,
    flyTo?.nonce,
  ]);

  // ── Live resize during layout animations ─────────────────────────────────
  // Keeps the projection correct on every frame while panels open or close,
  // instead of one corrective jump at the end.
  useEffect(() => {
    if (!resizeTicker || !mapRef.current) return;
    const map = mapRef.current;
    const until = performance.now() + liveResizeMs;
    let raf = 0;
    const step = () => {
      map.resize();
      if (performance.now() < until) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [resizeTicker, liveResizeMs]);

  // ── Style switching ───────────────────────────────────────────────────────
  // Skip the first render: the map was already constructed with STYLES[styleId].
  useEffect(() => {
    if (!styleInitialized.current) {
      styleInitialized.current = true;
      return;
    }
    const map = mapRef.current;
    if (!map) return;

    // Teardown before the swap. Detach, don't destroy — the popup host and the
    // sphere layer instance are both reused after the new style loads.
    popupRef.current?.remove();
    hoveredKeyRef.current = null;
    setHoveredRing(null);
    if (map.getLayer(BLAST_SPHERES_LAYER)) {
      map.removeLayer(BLAST_SPHERES_LAYER);
    }

    map.setStyle(STYLES[styleId].url);
    // onReady (bound to style.load above) re-adds the ring source/layers,
    // restores desiredGeoJSON, re-adds the sphere layer and replays setBurst.
  }, [styleId]);

  // Persist the user's explicit style choice.
  useEffect(() => {
    try {
      localStorage.setItem(MAP_STYLE_KEY, stylePref);
    } catch {
      // Private mode — the choice just won't survive a reload.
    }
  }, [stylePref]);

  // ── Ring data update ──────────────────────────────────────────────────────
  // Update desiredGeoJSON first so the style-load handler always has the
  // latest data. Then push it to the source immediately if layers are ready;
  // if not (source not yet added), onReady will push it when the style loads.
  useEffect(() => {
    desiredGeoJSON.current =
      groundZero && rings.length > 0
        ? ringsToGeoJSON(rings, groundZero)
        : { type: "FeatureCollection", features: [] };

    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(desiredGeoJSON.current);
    }
    // If source is undefined the map is still loading; onReady will apply it.

    // Push the same burst state to the 3D layer.
    blastLayerRef.current?.setBurst(groundZero, hobM, rings);
  }, [rings, groundZero, hobM]);

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
      // Class, not inline style — the cascade handles dark mode for free.
      // NEVER put a transform/scale utility on a marker root: Mapbox rewrites
      // the element's inline transform every frame to position it.
      const el = document.createElement("div");
      el.className = "map-marker-gz";

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([groundZero.lng, groundZero.lat])
        .addTo(map);

      marker.on("dragstart", () => {
        el.dataset.dragging = "true";
      });

      // Update ring GeoJSON + 3D spheres live during drag (no React re-render).
      marker.on("drag", () => {
        const { lng, lat } = marker.getLngLat();
        const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        if (source && ringsRef.current.length > 0) {
          source.setData(ringsToGeoJSON(ringsRef.current, { lat, lng }));
        }
        blastLayerRef.current?.setBurst(
          { lat, lng },
          hobMRef.current,
          ringsRef.current
        );
      });

      marker.on("dragend", () => {
        delete el.dataset.dragging;
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

    // Two-marker pattern: one Mapbox Marker for the dot (anchored at its
    // centre) and a separate Marker for the label (anchored at its bottom,
    // shifted up by an offset). Combining dot + label into a single element
    // with an absolutely-positioned label child made Mapbox's anchor
    // calculation drift — the dot would render BELOW the actual lat/lng,
    // misaligned with the ground-zero marker. Separate markers each have
    // clean bounds so anchoring is exact for both.
    const LABEL_ZOOM = 7;
    const allLabels: HTMLDivElement[] = [];

    (cityMarkers ?? []).forEach((city) => {
      const dot = document.createElement("div");
      dot.className = "map-marker-city";
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        onCitySelectRef.current?.(city.lat, city.lng);
        map.flyTo({ center: [city.lng, city.lat], zoom: 12, duration: 1200 });
      });
      const dotMarker = new mapboxgl.Marker({ element: dot })
        .setLngLat([city.lng, city.lat])
        .addTo(map);
      cityMarkerRefs.current.push(dotMarker);

      // Two elements, not one: Mapbox writes `opacity` and `pointer-events`
      // as INLINE styles on a marker's root element (terrain occlusion), and
      // inline beats any stylesheet. So the root is a bare anchor and all the
      // visuals — including the fade — live on a span Mapbox never touches.
      const label = document.createElement("div");
      label.className = "map-marker-label-anchor";
      // Fades via opacity rather than display:none, so labels don't hard-cut
      // in and out as the zoom animation crosses the threshold.
      label.dataset.visible = "false";
      const labelText = document.createElement("span");
      labelText.className = "map-marker-label";
      labelText.textContent = city.label;
      label.appendChild(labelText);
      allLabels.push(label);
      // Anchor 'bottom' = label's bottom edge sits at the lng/lat. Negative
      // y in offset shifts the label upward so its bottom sits ~12px above
      // the dot's centre, leaving the dot fully visible underneath.
      const labelMarker = new mapboxgl.Marker({
        element: label,
        anchor: "bottom",
        offset: [0, -12],
      })
        .setLngLat([city.lng, city.lat])
        .addTo(map);
      cityMarkerRefs.current.push(labelMarker);

      // Show this city's label on hover even when global zoom is below the
      // threshold — gives "what city is this?" feedback before clicking.
      dot.addEventListener("mouseenter", () => {
        label.dataset.visible = "true";
      });
      dot.addEventListener("mouseleave", () => {
        if (map.getZoom() < LABEL_ZOOM) label.dataset.visible = "false";
      });
    });

    // Sync label visibility with zoom. Listening to "zoom" fires throughout
    // the animation so the transition feels live. dataset writes are
    // idempotent, so the per-frame firing causes no style thrash.
    const syncLabels = () => {
      const show = map.getZoom() >= LABEL_ZOOM;
      for (const el of allLabels) el.dataset.visible = String(show);
    };
    syncLabels();
    map.on("zoom", syncLabels);
    return () => {
      map.off("zoom", syncLabels);
    };
  }, [cityMarkers]);

  return (
    // data-map-style drives --map-bg (see globals.css). The container shows
    // that color under the GL canvas, so the strip exposed by a panel
    // resize paints the land color for a frame instead of flashing black.
    <div
      className="relative w-full h-full bg-[var(--map-bg)]"
      data-map-style={styleId}
    >
      <div ref={containerRef} className="w-full h-full bg-[var(--map-bg)]" />

      {/* Basemap switcher. "Auto" follows the app theme; picking any other
          option pins it. In auto mode the derived option keeps a subdued
          ring so it's visible which one auto landed on. */}
      <div
        className="absolute top-2 right-2 z-10 flex overflow-hidden rounded-lg border border-slate-300 dark:border-zinc-700 shadow-md"
        role="group"
        aria-label="Basemap style"
      >
        {STYLE_CHOICES.map((s) => {
          const active = stylePref === s;
          const derived = stylePref === "auto" && s === styleId;
          return (
            <button
              key={s}
              onClick={() => setStylePref(s)}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : derived
                    ? "bg-white text-slate-700 ring-1 ring-inset ring-slate-400 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-500"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              aria-pressed={active}
            >
              {styleLabel(s)}
            </button>
          );
        })}
      </div>

      {groundZero && rings.length > 0 && <Legend rings={rings} />}

      {/* Ring callout contents. Mapbox owns the popup's position and moves
          this host into its own DOM; React keeps rendering into it. */}
      {popupHost &&
        hoveredRing &&
        createPortal(<RingPopup ring={hoveredRing} />, popupHost)}
    </div>
  );
}
