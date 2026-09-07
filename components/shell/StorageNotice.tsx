"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";

/**
 * First-visit disclosure of what this site keeps in local storage.
 *
 * Deliberately a NOTICE, not a consent gate. The app sets no analytics,
 * advertising, or cross-site identifiers — only three functional preference
 * keys — and those are strictly necessary under the ePrivacy Directive, so
 * blocking the interface behind an Accept button would misrepresent the legal
 * position and train people to dismiss real consent prompts.
 *
 * If tracking is ever added, `hasConsent("analytics")` is the hook to gate it
 * on, and this should become a true two-choice consent banner at that point.
 *
 * Read through useSyncExternalStore rather than an effect, matching
 * lib/theme/themeStore: localStorage can't be touched during render without a
 * hydration mismatch, and setState-in-effect is what the lint rule rejects.
 */

const KEY = "cookie-consent";

type Decision = "acknowledged" | "essential-only";
/** Server value. Renders nothing, so returning visitors never see a flash. */
type Snapshot = Decision | "unseen" | "pending";

const listeners = new Set<() => void>();
let cached: Snapshot | null = null;

function readStorage(): Snapshot {
  try {
    const v = localStorage.getItem(KEY);
    return v === "acknowledged" || v === "essential-only" ? v : "unseen";
  } catch {
    return "unseen";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Primitive return value, so referential stability is free.
function getSnapshot(): Snapshot {
  if (cached === null) cached = readStorage();
  return cached;
}

const getServerSnapshot = (): Snapshot => "pending";

/** Non-essential storage is gated on this. Nothing uses it yet — by design. */
export function hasConsent(category: "analytics"): boolean {
  return category === "analytics" && getSnapshot() === "acknowledged";
}

export function StorageNotice() {
  const decision = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, "acknowledged");
    } catch {
      // Private mode: the notice reappears next visit, which is acceptable.
    }
    cached = "acknowledged";
    listeners.forEach((l) => l());
  }, []);

  if (decision !== "unseen") return null;

  return (
    <div
      role="region"
      aria-label="Data storage notice"
      className="fixed inset-x-0 bottom-0 z-[2000] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-5 dark:border-zinc-700 dark:bg-zinc-900/95 dark:ring-white/5">
        <p className="flex-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
          This site stores three preferences in your browser — your theme,
          basemap, and this notice. There is no tracking or advertising, and
          nothing you simulate leaves your device.{" "}
          <Link
            href="/privacy"
            className="text-brand-accent underline-offset-4 hover:underline"
          >
            Read the privacy policy
          </Link>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full bg-brand px-5 py-2 text-xs font-medium text-brand-fg transition-colors hover:bg-brand-hover"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
