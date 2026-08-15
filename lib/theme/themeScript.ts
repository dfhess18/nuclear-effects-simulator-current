/**
 * Anti-FOUC theme bootstrap.
 *
 * This runs synchronously in <head>, before React or any stylesheet paints,
 * and writes the resolved theme into the DOM. Everything downstream — the
 * store, the map, Tailwind's `dark:` variant — reads the DOM rather than
 * re-deriving from localStorage, so this file is the single place the
 * resolution rule lives.
 *
 * Deliberately NOT a client component: it exports a plain string, so the
 * server layout can import it without pulling anything into the client bundle.
 */

export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Injected verbatim via dangerouslySetInnerHTML. Must stay behaviourally
 * identical to themeStore.applyTheme().
 *
 * Writes three things:
 *  1. the `dark` class     — Tailwind keys off this (@custom-variant in globals.css)
 *  2. style.colorScheme    — native scrollbars, <select> popups, form controls
 *  3. dataset.theme        — the *preference*, so the store can recover
 *                            "system" vs an explicit choice without re-reading
 *                            localStorage during hydration
 */
export const themeInitScript = `try{
var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||'system';
var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var e=document.documentElement;
e.classList.toggle('dark',d);
e.style.colorScheme=d?'dark':'light';
e.dataset.theme=p;
}catch(e){}`;
