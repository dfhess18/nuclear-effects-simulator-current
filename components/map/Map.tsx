/**
 * Map.tsx — the ONLY file that imports from react-leaflet.
 *
 * Swap this file for a Mapbox GL JS implementation when the token arrives.
 * The prop interface (MapProps) is defined in ./types.ts and must not change.
 * All consumers receive EffectRing[] from lib/physics/types — no Leaflet types leak out.
 */
"use client";

import { useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapProps, CityMarker } from "./types";
import { EffectRings } from "./EffectRings";
import { Legend } from "./Legend";

type TileType = "osm" | "light" | "dark";

const TILES: Record<TileType, { url: string; attribution: string; label: string }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: "Standard",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Light",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Dark",
  },
};

// Fix default marker icon paths broken by webpack bundling
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "/leaflet/marker-icon.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

const groundZeroIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `<div style="
          width:16px;height:16px;
          border-radius:50%;
          background:#ef4444;
          border:2.5px solid #fff;
          box-shadow:0 0 0 1.5px #ef4444,0 2px 6px rgba(0,0,0,0.4);
          cursor:grab;
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
    : undefined;

const cityIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;
          border-radius:50%;
          background:#2563eb;
          border:2.5px solid #fff;
          box-shadow:0 0 0 1.5px #2563eb,0 2px 6px rgba(0,0,0,0.4);
          cursor:pointer;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
    : undefined;

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CityMarkerLayer({
  markers,
  onCitySelect,
}: {
  markers: CityMarker[];
  onCitySelect?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  if (!cityIcon) return null;

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={cityIcon}
          eventHandlers={{
            click() {
              if (onCitySelect) onCitySelect(m.lat, m.lng);
              map.flyTo([m.lat, m.lng], 12, { duration: 1.2 });
            },
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -10]}
            className="text-xs font-medium"
          >
            {m.label}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
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
  const iconsFixed = useRef(false);
  const [tileType, setTileType] = useState<TileType>("osm");

  if (!iconsFixed.current && typeof window !== "undefined") {
    fixLeafletIcons();
    iconsFixed.current = true;
  }

  const tile = TILES[tileType];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={initialZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          key={tileType}
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={19}
        />

        <ClickHandler onMapClick={onMapClick} />

        {cityMarkers && cityMarkers.length > 0 && (
          <CityMarkerLayer markers={cityMarkers} onCitySelect={onCitySelect} />
        )}

        {groundZero && groundZeroIcon && (
          <>
            <Marker
              position={[groundZero.lat, groundZero.lng]}
              icon={groundZeroIcon}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  if (onGroundZeroDrag) onGroundZeroDrag(lat, lng);
                },
              }}
            />
            {rings.length > 0 && (
              <EffectRings rings={rings} groundZero={groundZero} />
            )}
          </>
        )}
      </MapContainer>

      {/* Tile selector */}
      <div className="absolute top-2 right-2 z-[1000] flex rounded-md overflow-hidden border border-slate-300 dark:border-zinc-600 shadow-sm">
        {(["osm", "light", "dark"] as TileType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTileType(t)}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
              tileType === t
                ? "bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-slate-800"
            }`}
            aria-pressed={tileType === t}
          >
            {TILES[t].label}
          </button>
        ))}
      </div>

      {groundZero && rings.length > 0 && <Legend rings={rings} />}
    </div>
  );
}
