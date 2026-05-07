/**
 * Weapon presets for v1.
 *
 * HOB values are set to the empirically optimal burst height for maximizing
 * 5 psi coverage radius (approximately h₁ ≈ 280 m/kT^(1/3) per Class 7B §Scaling).
 */

import type { WeaponPreset } from "./types";
import { optimalHobM } from "../physics/blast";

export const PRESETS: WeaponPreset[] = [
  {
    id: "hiroshima",
    label: "Hiroshima-type (15 kt)",
    yieldKt: 15,
    defaultBurstType: "airburst",
    defaultHobM: optimalHobM(15),
    historicalNote:
      "Little Boy gun-type uranium bomb, detonated 6 August 1945 at 580 m HOB.",
  },
  {
    id: "nagasaki",
    label: "Nagasaki-type (21 kt)",
    yieldKt: 21,
    defaultBurstType: "airburst",
    defaultHobM: optimalHobM(21),
    historicalNote:
      "Fat Man implosion plutonium bomb, detonated 9 August 1945 at approximately 500 m HOB.",
  },
  {
    id: "strategic-300",
    label: "Modern strategic (300 kt)",
    yieldKt: 300,
    defaultBurstType: "airburst",
    defaultHobM: optimalHobM(300),
    historicalNote:
      "Approximate yield of the W87/W88 ICBM warheads deployed in current US forces.",
  },
  {
    id: "strategic-1mt",
    label: "Large strategic (1 Mt)",
    yieldKt: 1000,
    defaultBurstType: "airburst",
    defaultHobM: optimalHobM(1000),
    historicalNote:
      "Representative large thermonuclear warhead; comparable to older US and Russian strategic warheads.",
  },
];

export const DEFAULT_PRESET = PRESETS[0];
