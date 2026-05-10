"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  // Gate the dynamic label behind a mounted flag so the server-rendered HTML
  // and the first client render are identical — otherwise the button text
  // (and aria-label) flip immediately based on localStorage / system theme,
  // triggering a hydration mismatch warning.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded border border-slate-200 dark:border-slate-700 min-w-[80px]"
      aria-label={mounted ? (dark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
    >
      <span suppressHydrationWarning>
        {mounted ? (dark ? "Light mode" : "Dark mode") : ""}
      </span>
    </button>
  );
}
