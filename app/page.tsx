"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITIES } from "@/lib/cities/registry";

// Orthographic projection centered on the continental US so the dots cluster
// across the visible hemisphere. lat0/lng0 chosen so all 21 cities are visible
// (z > 0) without crowding the limb.
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
  // SVG y-axis points down — negate so north renders up
  return { x, y: -y, visible: z > 0 };
}

export default function HomePage() {
  const router = useRouter();
  const [zooming, setZooming] = useState(false);

  const handleOpen = () => {
    if (zooming) return;
    setZooming(true);
    // Navigate after the zoom-in completes so the simulator's US view picks up
    // visually where the globe transition leaves off.
    setTimeout(() => router.push("/simulator"), 750);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
      <header
        className={`px-6 py-4 flex items-center justify-between transition-opacity duration-300 ${
          zooming ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-xs font-medium tracking-widest uppercase text-[#A31F34] dark:text-[#FF5A6F]">
          MIT Laboratory for Nuclear Science
        </div>
        <ThemeToggle />
      </header>

      <section className="relative flex-1 flex items-center justify-center px-6 py-16">
        <Globe zooming={zooming} />

        <div
          className={`relative max-w-2xl w-full text-center transition-all duration-500 ease-out ${
            zooming ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A31F34] dark:text-[#FF5A6F] border border-[#A31F34]/20 dark:border-[#FF5A6F]/20 bg-[#A31F34]/5 dark:bg-[#FF5A6F]/10 rounded-full px-3 py-1 mb-6">
            Educational research tool
          </span>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5 text-slate-900 dark:text-zinc-100">
            Nuclear Effects
            <br />
            Simulator
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-10 max-w-xl mx-auto">
            An interactive visualization of the immediate physical effects of
            nuclear detonations across 21 US cities, built on Glasstone &amp;
            Dolan and US Census population data.
          </p>

          <button
            onClick={handleOpen}
            disabled={zooming}
            className="group inline-flex items-center gap-2 rounded-full bg-[#A31F34] hover:bg-[#8B1A2C] text-white px-7 py-3.5 text-sm font-medium shadow-lg shadow-[#A31F34]/20 hover:shadow-xl transition-all disabled:cursor-default"
          >
            Open Simulator
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M3 7H11M11 7L7 3M11 7L7 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>

      <footer
        className={`border-t border-slate-200 dark:border-zinc-800 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 transition-opacity duration-300 ${
          zooming ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          MIT Laboratory for Nuclear Science · UROP project
        </p>
        <Link
          href="/about"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#A31F34] dark:text-[#FF5A6F] hover:underline"
        >
          About this project
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M2.5 6h7M9.5 6L6 2.5M9.5 6L6 9.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </footer>
    </main>
  );
}

/**
 * Decorative globe — orthographic projection of Earth centered on the
 * continental US, with the 21 active cities plotted as glowing dots.
 * On zoom: scales up dramatically and fades out to feel like the camera
 * is flying through the globe into the simulator's US-level map view.
 */
function Globe({ zooming }: { zooming: boolean }) {
  const R = 180;
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none text-[#A31F34] dark:text-[#FF5A6F] origin-center transition-all duration-700 ease-in ${
        zooming ? "scale-[7] opacity-0" : "scale-100 opacity-100"
      }`}
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

        {/* Sphere body */}
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

        {/* A couple of latitude bands purely for visual texture */}
        <ellipse
          cx="0"
          cy="48"
          rx={R * 0.99}
          ry={R * 0.16}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.13"
          strokeWidth="0.8"
        />
        <ellipse
          cx="0"
          cy="-50"
          rx={R * 0.95}
          ry={R * 0.18}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.13"
          strokeWidth="0.8"
        />
        <ellipse
          cx="0"
          cy="-115"
          rx={R * 0.78}
          ry={R * 0.17}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.10"
          strokeWidth="0.8"
        />

        {/* City dots */}
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
