"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  setTheme as setThemeInStore,
  subscribe,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeStore";

export interface UseThemeResult {
  /** What the user chose — may be "system". */
  theme: ThemePreference;
  /** What that resolves to right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
  /** Flips resolvedTheme and pins it as an explicit preference. */
  toggleTheme: () => void;
  /**
   * false during the hydration render, true after. Gate any text that differs
   * between server and client on this, or React will warn about a mismatch.
   */
  hydrated: boolean;
}

const noopSubscribe = () => () => {};

export function useTheme(): UseThemeResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const toggleTheme = useCallback(() => {
    setThemeInStore(getSnapshot().resolvedTheme === "dark" ? "light" : "dark");
  }, []);

  return {
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    setTheme: setThemeInStore,
    toggleTheme,
    hydrated,
  };
}
