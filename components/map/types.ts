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
  /** Burst height in meters (0 for surface burst). Used to elevate the 3D burst point. */
  hobM?: number;
  /** Initial zoom level (default 12). */
  initialZoom?: number;
  /** City selection markers shown on the map. */
  cityMarkers?: CityMarker[];
  /** When this changes (by reference or coords), the map flies to it. Used
   *  for switching active city via the dropdown / marker click. */
  flyTo?: { lat: number; lng: number };
  /** Called when the user clicks the map. */
  onMapClick: (lat: number, lng: number) => void;
  /** Called when the ground zero marker is dragged to a new position. */
  onGroundZeroDrag?: (lat: number, lng: number) => void;
  /** Called when a city marker is clicked (lat/lng of the city). */
  onCitySelect?: (lat: number, lng: number) => void;
}

export type { EffectRing };
