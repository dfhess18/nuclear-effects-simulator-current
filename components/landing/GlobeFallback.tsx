/**
 * Static SVG globe — orthographic projection centered on the continental US,
 * with the 21 active cities plotted as glowing dots.
 *
 * This was the landing page's only globe; it now serves as the placeholder
 * while the WebGL one loads. Keeping it means the hero paints immediately
 * instead of waiting on a WebGL context, and it's also the graceful
 * degradation path if WebGL is unavailable.
 *
 * Deliberately a server-renderable component with no hooks: it must be safe to
 * render inside next/dynamic's `loading` slot.
 */

import { CITIES } from "@/lib/cities/registry";

// lat0/lng0 chosen so all 21 cities land on the visible hemisphere (z > 0)
// without crowding the limb.
const LAT0_RAD = (40 * Math.PI) / 180;
const LNG0 = -98;
const DEG = Math.PI / 180;

function projectCity(lat: number, lng: number, R: number) {
  const dlng = (lng - LNG0) * DEG;
  const latR = lat * DEG;
  const x = R * Math.cos(latR) * Math.sin(dlng);
  const y =
    R *
    (Math.cos(LAT0_RAD) * Math.sin(latR) -
      Math.sin(LAT0_RAD) * Math.cos(latR) * Math.cos(dlng));
  const z =
    Math.sin(LAT0_RAD) * Math.sin(latR) +
    Math.cos(LAT0_RAD) * Math.cos(latR) * Math.cos(dlng);
  // Round to 4 decimal places so server and client produce identical values,
  // preventing floating-point hydration mismatches.
  const round = (n: number) => Math.round(n * 10000) / 10000;
  return { x: round(x), y: round(-y), visible: z > 0 };
}

export function GlobeFallback() {
  const R = 180;
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none text-brand-accent"
      aria-hidden="true"
    >
      <svg width="520" height="520" viewBox="-260 -260 520 520">
        <defs>
          {/* Subtle radial light from upper-left for sphere shading */}
          <radialGradient id="globeFill" cx="32%" cy="28%" r="72%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          {/* Halo around each city dot */}
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          {/* Light rim on the limb to suggest atmosphere */}
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        <circle
          cx="0"
          cy="0"
          r={R}
          fill="url(#globeFill)"
          stroke="currentColor"
          strokeOpacity="0.42"
          strokeWidth="1.1"
        />
        <circle cx="0" cy="0" r={R} fill="url(#rim)" />

        {/* Latitude bands, purely for visual texture */}
        <ellipse cx="0" cy="48" rx={R * 0.99} ry={R * 0.16} fill="none" stroke="currentColor" strokeOpacity="0.13" strokeWidth="0.8" />
        <ellipse cx="0" cy="-50" rx={R * 0.95} ry={R * 0.18} fill="none" stroke="currentColor" strokeOpacity="0.13" strokeWidth="0.8" />
        <ellipse cx="0" cy="-115" rx={R * 0.78} ry={R * 0.17} fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="0.8" />

        {CITIES.map((c) => {
          const p = projectCity(c.defaultCenter.lat, c.defaultCenter.lng, R);
          if (!p.visible) return null;
          return (
            <g key={c.id}>
              <circle cx={p.x} cy={p.y} r="7" fill="url(#dotGlow)" />
              <circle
                cx={p.x}
                cy={p.y}
                r="2.4"
                fill="currentColor"
                stroke="white"
                strokeOpacity="0.85"
                strokeWidth="0.6"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
