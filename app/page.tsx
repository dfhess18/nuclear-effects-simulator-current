"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobeFallback } from "@/components/landing/GlobeFallback";

// WebGL, so it needs a browser: ssr:false. The static SVG globe stands in
// while it loads, which keeps this route's hero painting immediately —
// it is otherwise the lightest page in the app and shouldn't gate LCP on a
// WebGL context.
const Globe = dynamic(
  () => import("@/components/landing/Globe").then((m) => m.Globe),
  { ssr: false, loading: () => <GlobeFallback /> }
);

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
        <div className="text-xs font-medium tracking-widest uppercase text-brand-accent">
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
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-accent border border-brand-accent/20 bg-brand-accent/5 dark:bg-brand-accent/10 rounded-full px-3 py-1 mb-6">
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
            className="group inline-flex items-center gap-2 rounded-full bg-brand hover:bg-brand-hover text-brand-fg px-7 py-3.5 text-sm font-medium shadow-lg shadow-brand/20 hover:shadow-xl transition-all disabled:cursor-default"
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
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent hover:underline"
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
