"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/lib/theme/useTheme";

export function ThemeToggle() {
  // All theme state lives in lib/theme/themeStore. This component used to own
  // it, which meant the Map (a separate, ssr:false subtree) had no way to read
  // it and the anti-FOUC script in layout.tsx duplicated the resolution rule.
  const { resolvedTheme, toggleTheme, hydrated } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      suppressHydrationWarning
      // min-w keeps the header from reflowing when the label swaps in
      // post-hydration.
      className="group inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 min-w-[104px]"
      aria-label={
        hydrated
          ? dark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle theme"
      }
    >
      <span
        suppressHydrationWarning
        className="inline-flex items-center gap-1.5"
      >
        {hydrated ? (
          <>
            {dark ? (
              <SunIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <MoonIcon className="size-3.5" aria-hidden="true" />
            )}
            {dark ? "Light mode" : "Dark mode"}
          </>
        ) : null}
      </span>
    </button>
  );
}
