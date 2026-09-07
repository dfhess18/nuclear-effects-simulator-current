/**
 * Canonical site constants.
 *
 * `metadataBase` needs an absolute origin for OpenGraph and canonical URLs to
 * resolve. Reads the Vercel-provided host in preview/production so branch
 * deploys advertise themselves rather than the production domain.
 */

const VERCEL_HOST = process.env.NEXT_PUBLIC_VERCEL_URL;

export const SITE_URL = VERCEL_HOST
  ? `https://${VERCEL_HOST}`
  : "https://nuclear-effects-simulator-current.vercel.app";

export const SITE_NAME = "Nuclear Effects Simulator";

export const SITE_DESCRIPTION =
  "An interactive visualization of the immediate physical effects of nuclear detonations across 21 US cities, built on Glasstone & Dolan and US Census population data.";

/** Every indexable route. Kept here so sitemap and canonicals can't drift. */
export const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "monthly" as const },
  { path: "/simulator", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];
