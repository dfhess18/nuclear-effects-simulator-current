/**
 * Module-level theme store, read via useSyncExternalStore.
 *
 * Deliberately not a React context. Map.tsx is loaded with `ssr: false` and
 * mounts outside the hydration pass; a provider would have to wrap the server
 * layout and every consumer beneath it. A module store is reachable from
 * anywhere with no wiring, and the imperative Mapbox/Three.js callbacks can
 * read getResolvedTheme() or subscribe() without participating in a render.
 *
 * The DOM is the source of truth: themeScript.ts already wrote the resolved
 * value onto <html> before React ran, so there is nothing to re-derive.
 */

import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeScript";

export type { ResolvedTheme, ThemePreference };

export interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

// useSyncExternalStore compares snapshots by reference and will loop forever if
// getSnapshot() returns a fresh object each call. This is replaced only when
// something actually changes.
let snapshot: ThemeState = { theme: "system", resolvedTheme: "light" };

const SERVER_SNAPSHOT: ThemeState = { theme: "system", resolvedTheme: "light" };

let mediaQuery: MediaQueryList | null = null;
let initialized = false;

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return prefersDark() ? "dark" : "light";
  return pref;
}

/** Read what themeScript.ts wrote onto <html>. */
function readFromDom(): ThemeState {
  if (typeof document === "undefined") return SERVER_SNAPSHOT;
  const pref = (document.documentElement.dataset.theme ??
    "system") as ThemePreference;
  return { theme: pref, resolvedTheme: resolve(pref) };
}

function commit(next: ThemeState) {
  if (
    next.theme === snapshot.theme &&
    next.resolvedTheme === snapshot.resolvedTheme
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((l) => l());
}

/** Mirror of themeInitScript's DOM writes. Keep the two in step. */
function applyTheme(pref: ThemePreference, resolved: ResolvedTheme) {
  const el = document.documentElement;
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved === "dark" ? "dark" : "light";
  el.dataset.theme = pref;
}

function handleMediaChange() {
  // An OS-level change only moves the needle while the user is on "system".
  if (snapshot.theme !== "system") return;
  const resolved: ResolvedTheme = prefersDark() ? "dark" : "light";
  applyTheme("system", resolved);
  commit({ theme: "system", resolvedTheme: resolved });
}

function handleStorage(e: StorageEvent) {
  if (e.key !== THEME_STORAGE_KEY) return;
  const pref = (e.newValue ?? "system") as ThemePreference;
  const resolved = resolve(pref);
  applyTheme(pref, resolved);
  commit({ theme: pref, resolvedTheme: resolved });
}

export function subscribe(onChange: () => void): () => void {
  if (!initialized) {
    initialized = true;
    snapshot = readFromDom();
    mediaQuery = window.matchMedia(DARK_QUERY);
    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      mediaQuery?.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorage);
      mediaQuery = null;
      initialized = false;
    }
  };
}

export function getSnapshot(): ThemeState {
  // Covers non-React callers that read before anything subscribed.
  if (!initialized && typeof document !== "undefined") {
    snapshot = readFromDom();
  }
  return snapshot;
}

/**
 * React uses this for the hydration render only, then immediately re-renders
 * with getSnapshot(). Returning the neutral default here is what keeps server
 * HTML and first client render identical.
 */
export function getServerSnapshot(): ThemeState {
  return SERVER_SNAPSHOT;
}

export function setTheme(next: ThemePreference): void {
  const resolved = resolve(next);
  applyTheme(next, resolved);
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Safari private mode — the DOM is already correct, only persistence fails.
  }
  commit({ theme: next, resolvedTheme: resolved });
}

/** For imperative consumers (Mapbox, Three.js) that aren't in a render. */
export function getResolvedTheme(): ResolvedTheme {
  return getSnapshot().resolvedTheme;
}
