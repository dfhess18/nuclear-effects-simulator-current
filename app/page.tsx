"use client";

/**
 * Home — the "Atlas" landing view.
 *
 * This is the same mounted tree as /simulator, entered at the `landing` phase.
 * Choosing a city does not navigate: the chrome expands around a map that has
 * been on screen the whole time, so the descent is continuous. See
 * components/simulator/SimulatorExperience.tsx.
 */

import { SimulatorExperience } from "@/components/simulator/SimulatorExperience";

export default function HomePage() {
  return <SimulatorExperience initialPhase="landing" />;
}
