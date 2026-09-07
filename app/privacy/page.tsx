import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/shell/PageShell";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What the Nuclear Effects Simulator stores, what it transmits, and to whom.",
  alternates: { canonical: "/privacy" },
};

/** Kept in sync with lib/theme/themeScript.ts and components/map/Map.tsx. */
const STORAGE = [
  {
    key: "theme",
    written: "components/ThemeToggle",
    purpose: "Remembers light or dark mode so the page doesn't flash on load.",
  },
  {
    key: "mapStyle",
    written: "the basemap switcher",
    purpose:
      "Remembers whether you pinned a basemap or left it following the theme.",
  },
  {
    key: "cookie-consent",
    written: "the storage notice",
    purpose: "Remembers that you dismissed the notice, so it isn't shown again.",
  },
];

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Privacy">
      <Prose>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
          Privacy
        </p>
        <h1 className="mb-6 mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          What this site stores
        </h1>

        <p>
          This is an educational research tool published by the MIT Laboratory
          for Nuclear Science. It has no accounts, no sign-in, and no analytics
          or advertising. The summary below describes the whole of it.
        </p>

        <h2>What is never collected</h2>
        <p>
          The simulation runs entirely in your browser. Where you place ground
          zero, the yields you choose, the burst parameters you set, and the
          casualty figures produced are computed locally and are{" "}
          <strong>never transmitted to us or stored on a server</strong>. We
          operate no database and keep no logs of simulator activity.
        </p>

        <h2>Data stored in your browser</h2>
        <p>
          Three keys are written to your browser&apos;s local storage. All are
          functional preferences, readable only by this site, and removable at
          any time by clearing site data.
        </p>
        <ul>
          {STORAGE.map((s) => (
            <li key={s.key}>
              <code className="font-mono text-xs">{s.key}</code> — {s.purpose}
            </li>
          ))}
        </ul>
        <p>
          No advertising, tracking, or cross-site identifiers are set. Because
          these are strictly necessary for the interface to function as you
          configured it, they do not require consent under the ePrivacy
          Directive or comparable rules.
        </p>

        <h2>Third parties that receive data</h2>
        <p>
          <strong>Mapbox.</strong> Map tiles are served by Mapbox GL JS. Loading
          them necessarily discloses your IP address, the map area you are
          viewing, and standard browser headers to Mapbox, who process it under
          their own privacy policy. Panning or zooming reveals your viewport,
          but not your ground-zero placements — those are drawn locally and are
          never sent as requests.
        </p>
        <p>
          <strong>Vercel.</strong> The site is hosted on Vercel, which records
          standard server request logs, including IP address and user agent, for
          delivery and abuse prevention.
        </p>
        <p>
          <strong>US Census Bureau.</strong> Population data is fetched ahead of
          time and bundled with the application. Your browser downloads it from
          this site, not from the Census Bureau, so browsing does not disclose
          anything to them.
        </p>

        <h2>Fonts</h2>
        <p>
          IBM Plex Sans and IBM Plex Mono are self-hosted and served from this
          domain. No request is made to Google Fonts.
        </p>

        <h2>Your choices</h2>
        <p>
          Clearing site data for this domain removes every key listed above.
          Blocking third-party requests to Mapbox will stop the map from
          rendering; the rest of the interface will still load.
        </p>

        <h2>Contact</h2>
        <p>
          This tool is maintained as an undergraduate research project. Questions
          about this policy can be directed to the MIT Laboratory for Nuclear
          Science.
        </p>
      </Prose>
    </PageShell>
  );
}
