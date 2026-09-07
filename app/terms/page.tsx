import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Prose } from "@/components/shell/PageShell";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for the Nuclear Effects Simulator, including the limits of its casualty model.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell eyebrow="Terms">
      <Prose>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-accent">
          Terms
        </p>
        <h1 className="mb-6 mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          Terms of use
        </h1>

        <p>
          By using this simulator you accept the terms below. If you do not,
          please do not use it.
        </p>

        <h2>Educational purpose</h2>
        <p>
          This tool exists to make the physical scale of nuclear weapons effects
          legible to students, researchers, and the public. It is a teaching and
          research instrument. It is not targeting software, not an emergency
          planning system, and not a substitute for professional civil defence
          or public health guidance.
        </p>

        <h2>The numbers are estimates, not predictions</h2>
        <p>
          Every figure this tool reports is an order-of-magnitude estimate
          produced by a simplified model. Specifically:
        </p>
        <ul>
          <li>
            Blast, thermal, and prompt-radiation radii come from cube-root
            scaling of the tabulated values in Glasstone &amp; Dolan,{" "}
            <em>The Effects of Nuclear Weapons</em> (1977), and assume idealised
            conditions.
          </li>
          <li>
            Casualties are derived by sampling US Census block-group population
            density across each effect ring and applying fixed casualty rates
            per threshold. Real outcomes depend on time of day, sheltering,
            building construction, terrain, weather, evacuation, and emergency
            response — none of which this model resolves.
          </li>
          <li>
            Fallout, fire spread, electromagnetic pulse, infrastructure
            collapse, and long-term health effects are <strong>not</strong>{" "}
            modelled at all. Real consequences would exceed what is shown.
          </li>
        </ul>
        <p>
          Do not cite these outputs as authoritative casualty figures. See the{" "}
          <Link href="/about">About page</Link> for the model&apos;s scope and
          sources.
        </p>

        <h2>Acceptable use</h2>
        <p>
          You may use this tool for study, teaching, journalism, and research.
          You may not use it to plan, threaten, or encourage harm to any person
          or place, nor present its output as an official assessment from MIT or
          any government body.
        </p>

        <h2>No warranty</h2>
        <p>
          The tool is provided &ldquo;as is&rdquo;, without warranty of any kind,
          express or implied. The maintainers accept no liability for any loss or
          damage arising from its use or from reliance on its output.
        </p>

        <h2>Third-party services and data</h2>
        <p>
          Map tiles are provided by Mapbox and OpenStreetMap contributors under
          their respective licences. Population data derives from US Census
          Bureau public releases. Their terms govern that material.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be revised as the model changes. Continued use after a
          revision constitutes acceptance of it.
        </p>
      </Prose>
    </PageShell>
  );
}
