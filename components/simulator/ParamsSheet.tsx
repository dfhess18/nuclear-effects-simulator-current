"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createSpring,
  project,
  rubberband,
  velocityFrom,
  type Spring,
} from "@/lib/gesture";

/**
 * The parameters panel: a permanent column at lg and up, a draggable bottom
 * sheet below it.
 *
 * The sheet is grabbable, not merely toggleable:
 *  - it tracks the finger 1:1 and respects where you grabbed it
 *  - it can be grabbed mid-flight and reversed, because the drag reads the
 *    spring's live presentation value rather than its target
 *  - release hands the pointer velocity to the spring, so there is no seam
 *    between dragging and animating
 *  - the landing position comes from PROJECTED momentum, not the release
 *    point, so a flick throws it
 *  - dragging past the open stop resists progressively instead of stopping dead
 *
 * Drawer spring values are Apple's published pair for this interaction:
 * damping 0.8, response 0.3 — slight bounce, because a drawer is something you
 * physically threw.
 */

const SPRING = { damping: 0.8, response: 0.3 };
/** Past this fraction of the sheet, a slow release still commits to closing. */
const DISMISS_FRACTION = 0.5;
/** Below this, a release is treated as a position rather than a flick. */
const FLICK_VELOCITY = 300;

interface ParamsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Collapsed entirely while the landing view owns the screen. */
  visible: boolean;
  title: string;
  children: React.ReactNode;
}

export function ParamsSheet({
  open,
  onOpenChange,
  visible,
  title,
  children,
}: ParamsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<Spring | null>(null);
  const heightRef = useRef(0);
  const draggingRef = useRef(false);
  const samplesRef = useRef<{ y: number; t: number }[]>([]);
  const grabOffsetRef = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const isSheet = () =>
    typeof window !== "undefined" && window.innerWidth < 1024;

  const apply = useCallback((y: number) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = isSheet() ? `translate3d(0, ${y}px, 0)` : "";
  }, []);

  // One spring for the sheet's life. Rebuilding it per gesture would discard
  // the velocity that makes a reversal continuous.
  useEffect(() => {
    const spring = createSpring(0, apply, SPRING);
    springRef.current = spring;
    return () => spring.destroy();
  }, [apply]);

  const measure = useCallback(() => {
    const el = sheetRef.current;
    if (el) heightRef.current = el.getBoundingClientRect().height || 0;
    return heightRef.current;
  }, []);

  // Follow the declarative `open` prop whenever a gesture is not driving.
  useEffect(() => {
    const spring = springRef.current;
    if (!spring || draggingRef.current) return;
    if (!isSheet()) {
      spring.set(0);
      return;
    }
    const h = measure();
    spring.to(open ? 0 : h);
  }, [open, visible, measure]);

  useEffect(() => {
    const onResize = () => {
      const spring = springRef.current;
      if (!spring || draggingRef.current) return;
      if (!isSheet()) {
        spring.set(0);
        return;
      }
      spring.set(openRef.current ? 0 : measure());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isSheet()) return;
    const spring = springRef.current;
    if (!spring) return;
    // Interrupt from the PRESENTATION value, so grabbing a sheet mid-flight
    // continues from where it visibly is rather than jumping to its target.
    const live = spring.current;
    spring.stop();
    spring.set(live);

    draggingRef.current = true;
    grabOffsetRef.current = e.clientY - live;
    samplesRef.current = [{ y: e.clientY, t: performance.now() }];
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is an enhancement — without it the drag still tracks, it just
      // stops if the pointer leaves the handle.
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const spring = springRef.current;
      if (!spring) return;

      const h = heightRef.current || measure();
      let y = e.clientY - grabOffsetRef.current;

      // Above the open stop there is nothing more to reveal, and below the
      // closed stop nothing more to hide — resist rather than hard-stop.
      if (y < 0) y = -rubberband(-y, h || 1);
      if (y > h) y = h + rubberband(y - h, h || 1);

      spring.set(y);
      samplesRef.current.push({ y: e.clientY, t: performance.now() });
      if (samplesRef.current.length > 8) samplesRef.current.shift();
    },
    [measure]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const spring = springRef.current;
      if (!spring) return;

      const h = heightRef.current || measure();
      const v = velocityFrom(samplesRef.current);
      // Land where the flick was GOING, not where the finger let go.
      const projected = spring.current + project(v);

      const shouldOpen =
        Math.abs(v) > FLICK_VELOCITY
          ? // A deliberate flick: direction wins over position.
            v < 0
          : projected < h * DISMISS_FRACTION;

      spring.to(shouldOpen ? 0 : h, v);
      if (shouldOpen !== openRef.current) onOpenChange(shouldOpen);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Capture may already be gone if the pointer was cancelled.
      }
    },
    [measure, onOpenChange]
  );

  return (
    <div
      ref={sheetRef}
      data-sheet-open={open ? "true" : "false"}
      inert={!visible}
      aria-hidden={!visible}
      className={
        visible
          ? "flex w-full flex-shrink-0 overflow-hidden lg:w-72 lg:h-full max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[1100] max-lg:max-h-[62svh] max-lg:rounded-t-2xl max-lg:border-t max-lg:border-slate-200 max-lg:shadow-2xl max-lg:dark:border-zinc-700"
          : "flex w-0 flex-shrink-0 overflow-hidden opacity-0 lg:h-full"
      }
      style={{ willChange: "transform" }}
    >
      <div className="flex w-full flex-col overflow-hidden bg-white lg:contents dark:bg-zinc-900">
        {/* Grab handle. touch-none is required, or the browser's own scroll
            gesture claims the drag before a single pointermove arrives. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex flex-shrink-0 cursor-grab touch-none items-center justify-between border-b border-slate-200 bg-white px-4 pb-2.5 pt-2 active:cursor-grabbing lg:hidden dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1.5">
            <span
              aria-hidden="true"
              className="h-1 w-9 self-center rounded-full bg-slate-300 dark:bg-zinc-600"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              {title}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md px-3 py-1 text-xs font-medium text-brand-accent transition-[background-color,transform] duration-100 hover:bg-slate-100 active:scale-[0.97] active:transition-none dark:hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
