import type { EffectRing } from "../../lib/physics/types";

export interface CityMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
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
  /** Initial zoom level (default 12). */
  initialZoom?: number;
  /** City selection markers shown on the map. */
  cityMarkers?: CityMarker[];
  /** Called when the user clicks the map. */
  onMapClick: (lat: number, lng: number) => void;
  /** Called when the ground zero marker is dragged to a new position. */
  onGroundZeroDrag?: (lat: number, lng: number) => void;
  /** Called when a city marker is clicked (lat/lng of the city). */
  onCitySelect?: (lat: number, lng: number) => void;
}

export type { EffectRing };
