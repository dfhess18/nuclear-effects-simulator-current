"use client";

import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";
import { CITIES } from "@/lib/cities/registry";
import { useTheme } from "@/lib/theme/useTheme";

/**
 * WebGL globe for the landing page, replacing the static SVG one.
 *
 * Pointer-drag spins it; otherwise it auto-rotates. The 21 simulator cities
 * are plotted as markers.
 *
 * Two things here are deliberate and easy to get wrong:
 *
 *  1. The zoom-through is driven by cobe's own `scale` inside the render loop,
 *     NOT by a CSS transform. The SVG version used `scale(7)` on its wrapper,
 *     which is crisp for vectors but would blow up a canvas's rasterised
 *     pixels into a blur. Only opacity is left to CSS.
 *  2. Colours are read from the *hex* --brand-* tokens. cobe takes numeric RGB
 *     and cannot parse oklch(), which is exactly why globals.css keeps the
 *     brand tokens as hex while everything else is oklch.
 */

/** cobe wants linear 0..1 RGB triples. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0.64, 0.12, 0.2];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readBrandAccent(): [number, number, number] {
  if (typeof document === "undefined") return [0.64, 0.12, 0.2];
  const v = getComputedStyle(document.documentElement).getPropertyValue(
    "--brand-accent"
  );
  return hexToRgb(v || "#a31f34");
}

/**
 * The globe drifts back and forth around the US rather than spinning freely.
 * A free spin carries North America out of view within seconds, which on a
 * page about 21 US cities means most visitors watch the Indian Ocean. The
 * oscillation keeps the markers on screen while still feeling alive — and it
 * makes the framing deterministic, since phi is a pure function of elapsed
 * time rather than an accumulator.
 */
const SWAY_AMPLITUDE = 0.32; // radians, ~18°
const SWAY_PERIOD_MS = 24000;
/** Must match the setTimeout before router.push in app/page.tsx. */
const ZOOM_MS = 750;
/** How far cobe's internal scale travels during the zoom-through. */
const ZOOM_SCALE = 4.5;

/**
 * Rotation that brings the continental US to the front on load — otherwise
 * the globe opens on Africa with all 21 markers bunched on the limb. Matches
 * the lat/lng the SVG fallback's orthographic projection was centred on.
 */
const CENTER_LNG = -98;
const CENTER_LAT = 40;
/**
 * cobe does not document where its phi origin sits relative to longitude, and
 * its shader ships minified past reading, so this was measured rather than
 * derived: at 0° the marker cluster rendered ~45° west of the disc centre,
 * and phi increasing moves the surface east.
 */
const PHI_ORIGIN_OFFSET = (75 * Math.PI) / 180;
const INITIAL_PHI = (CENTER_LNG * Math.PI) / 180 + PHI_ORIGIN_OFFSET;
/** Damped rather than the full 40°, which tips the pole uncomfortably far. */
const INITIAL_THETA = ((CENTER_LAT * Math.PI) / 180) * 0.55;

interface GlobeProps {
  zooming: boolean;
}

export function Globe({ zooming }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  // Read inside the render loop rather than re-creating the globe on change.
  const zoomingRef = useRef(zooming);
  const themeRef = useRef(resolvedTheme);
  const zoomStartRef = useRef<number | null>(null);

  // Drag state. Refs, not state — these change per pointer event and must
  // never trigger a React render.
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const dragDelta = useRef({ phi: 0, theta: 0 });
  const dragCommitted = useRef({ phi: 0, theta: 0 });

  useEffect(() => {
    zoomingRef.current = zooming;
  }, [zooming]);
  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownAt.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointerDownAt.current) return;
      dragDelta.current = {
        phi: (e.clientX - pointerDownAt.current.x) / 300,
        theta: (e.clientY - pointerDownAt.current.y) / 1000,
      };
    };
    const onUp = () => {
      if (pointerDownAt.current) {
        dragCommitted.current.phi += dragDelta.current.phi;
        dragCommitted.current.theta += dragDelta.current.theta;
        dragDelta.current = { phi: 0, theta: 0 };
      }
      pointerDownAt.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // The CSS reduced-motion block can't reach a requestAnimationFrame loop,
    // so the spin has to opt out here.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let sway = motionQuery.matches ? 0 : SWAY_AMPLITUDE;
    const onMotionChange = () => {
      sway = motionQuery.matches ? 0 : SWAY_AMPLITUDE;
    };
    motionQuery.addEventListener("change", onMotionChange);

    let globe: ReturnType<typeof createGlobe> | null = null;
    let frame = 0;
    let disposed = false;
    const startedAt = performance.now();

    const build = () => {
      if (globe || disposed) return;
      const size = canvas.offsetWidth;
      if (!size) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const dark = themeRef.current === "dark";
      const accent = readBrandAccent();

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: INITIAL_PHI,
        theta: INITIAL_THETA,
        dark: dark ? 1 : 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: dark ? 6 : 7,
        baseColor: dark ? [0.26, 0.26, 0.28] : [0.92, 0.91, 0.9],
        markerColor: accent,
        glowColor: dark ? [0.16, 0.16, 0.17] : [0.86, 0.85, 0.84],
        opacity: 0.95,
        markers: CITIES.map((c) => ({
          location: [c.defaultCenter.lat, c.defaultCenter.lng] as [
            number,
            number,
          ],
          size: 0.028,
        })),
      });

      const render = () => {
        if (disposed || !globe) return;
        const elapsed = performance.now() - startedAt;
        // Pure function of elapsed time — no accumulator to drift.
        const phi =
          INITIAL_PHI +
          Math.sin((elapsed / SWAY_PERIOD_MS) * Math.PI * 2) * sway;

        // Ease-in (cubic) so the camera reads as accelerating into the planet.
        // Deliberately NOT lib/motion.ts's EASE, which decelerates.
        let scale = 1;
        if (zoomingRef.current) {
          if (zoomStartRef.current === null) {
            zoomStartRef.current = performance.now();
          }
          const t = Math.min(
            1,
            (performance.now() - zoomStartRef.current) / ZOOM_MS
          );
          scale = 1 + t * t * t * (ZOOM_SCALE - 1);
        }

        const isDark = themeRef.current === "dark";
        globe.update({
          phi: phi + dragCommitted.current.phi + dragDelta.current.phi,
          theta:
            INITIAL_THETA + dragCommitted.current.theta + dragDelta.current.theta,
          scale,
          // Re-sent every frame so a theme flip is picked up without
          // tearing down and rebuilding the WebGL context.
          dark: isDark ? 1 : 0,
          mapBrightness: isDark ? 6 : 7,
          baseColor: isDark ? [0.26, 0.26, 0.28] : [0.92, 0.91, 0.9],
          markerColor: readBrandAccent(),
          glowColor: isDark ? [0.16, 0.16, 0.17] : [0.86, 0.85, 0.84],
        });
        frame = requestAnimationFrame(render);
      };
      render();
      // cobe's first paint lands a frame late; fade in to hide the flash.
      requestAnimationFrame(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    };

    // The canvas may have zero width on first mount inside a flex layout.
    let ro: ResizeObserver | null = null;
    if (canvas.offsetWidth > 0) {
      build();
    } else {
      ro = new ResizeObserver(() => {
        if (canvas.offsetWidth > 0) {
          ro?.disconnect();
          ro = null;
          build();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      disposed = true;
      motionQuery.removeEventListener("change", onMotionChange);
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      globe?.destroy();
      globe = null;
    };
    // Built once. Theme and zoom are read through refs inside the loop so a
    // change never rebuilds the WebGL context.
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in"
      style={{ opacity: zooming ? 0 : 1 }}
    >
      {/* Centred with absolute positioning rather than by the flex parent:
          createGlobe() inserts its own `position:relative; width:100%;
          height:100%` div around the canvas to anchor markers, so the canvas
          is a grandchild and `justify-center` above never reaches it. That
          injected div fills this one, so centring inside it is equivalent. */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        // Decorative: the hero copy sits above this in the stacking order and
        // keeps its own pointer targets, so dragging here can't steal the CTA.
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] max-w-[85vw] max-h-[85vw] cursor-grab touch-none"
        style={{ opacity: 0, transition: "opacity 600ms ease" }}
      />
    </div>
  );
}
