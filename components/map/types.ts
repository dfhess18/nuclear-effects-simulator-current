import type { EffectRing } from "../../lib/physics/types";

export interface CityMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

/**
 * The subset of EffectRing the hover callout displays. Mapbox flattens feature
 * properties, so these must all stay primitives — an object or array would
 * arrive from queryRenderedFeatures as a JSON string needing a parse.
 */
export interface RingPopupData {
  thresholdLabel: string;
  physicalDescription: string;
  radiusM: number;
  casualtyRateInner: number;
  color: string;
}

export interface MapProps {
  /** Map center on initial render (not reactive after first mount). */
  center: { lat: number; lng: number };
  /** Kept for API compatibility; bounds enforcement is not applied. */
  bounds: [[number, number], [number, number]];
  /** Current ground zero location, or null if not yet placed. */
  groundZero: { lat: number; lng: number } | null;
  /** Effect rings to render. */
  rings: EffectRing[];
  /** Burst height in meters (0 for surface burst). Used to elevate the 3D burst point. */
  hobM?: number;
  /** Initial zoom level (default 12). */
  initialZoom?: number;
  /** City selection markers shown on the map. */
  cityMarkers?: CityMarker[];
  /** When this changes (by reference or coords), the map flies to it. Used
   *  for switching active city via the dropdown / marker click.
   *  Optional zoom overrides the default city zoom (12).
   *  Optional nonce (e.g. Date.now()) forces the effect to re-fire even when
   *  lat/lng/zoom are identical to the previous flyTo (e.g. repeated reset). */
  /** When this changes (by reference or coords), the map flies to it.
   *  `bounds` wins over lat/lng/zoom and does a fitBounds instead, which is
   *  what "show the whole US" needs — a fixed zoom frames a different area
   *  once the sidebar narrows the map.
   *  Omit `duration` to let Mapbox derive it from distance, so a cross-country
   *  hop takes longer than a neighbouring one instead of racing. */
  flyTo?: {
    lat: number;
    lng: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
    duration?: number;
    bounds?: [[number, number], [number, number]];
    nonce?: number;
  };
  /** Reported on moveend so the parent can offer a two-stage reset (level the
   *  camera first, then zoom out) without duplicating Mapbox state. */
  onViewStateChange?: (state: {
    pitch: number;
    bearing: number;
    zoom: number;
    center: { lat: number; lng: number };
  }) => void;
  /** Bump to make the map track a layout animation frame-by-frame for
   *  `liveResizeMs`. The standing ResizeObserver is debounced, which is right
   *  for a settled resize but leaves the canvas squashed for the duration of
   *  an animated one — Mapbox sets the canvas to width:100%, so a container
   *  that shrinks over 500ms stretches the rendered image the whole way and
   *  then snaps. */
  resizeTicker?: number;
  liveResizeMs?: number;
  /** Called when the user clicks the map. */
  onMapClick: (lat: number, lng: number) => void;
  /** Called when the ground zero marker is dragged to a new position. */
  onGroundZeroDrag?: (lat: number, lng: number) => void;
  /** Called when a city marker is clicked (lat/lng of the city). */
  onCitySelect?: (lat: number, lng: number) => void;
}

export type { EffectRing };
