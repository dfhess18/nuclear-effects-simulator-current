import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Chrome for the app's non-map routes — about, privacy, terms, 404, errors.
 *
 * The map routes deliberately don't use this: they own the whole viewport and
 * carry their own phase-driven header.
 */
export function PageShell({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-800">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-accent hover:underline"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path
              d="M9.5 6h-7M2.5 6L6 9.5M2.5 6L6 2.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>
        <div className="hidden text-xs font-medium uppercase tracking-widest text-slate-500 sm:block dark:text-zinc-500">
          {eyebrow}
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 px-6 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            MIT Laboratory for Nuclear Science · UROP project
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { href: "/about", label: "About" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-slate-500 underline-offset-4 hover:text-brand-accent hover:underline dark:text-zinc-500"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}

/** Long-form policy body: readable measure, consistent heading rhythm. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto max-w-[68ch] px-6 py-12 sm:py-16
        [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight
        [&_h2:first-of-type]:mt-0
        [&_li]:mb-1.5
        [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600 dark:[&_p]:text-zinc-400
        [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:text-slate-600 dark:[&_ul]:text-zinc-400
        [&_a]:text-brand-accent [&_a]:underline-offset-4 hover:[&_a]:underline"
    >
      {children}
    </div>
  );
}
