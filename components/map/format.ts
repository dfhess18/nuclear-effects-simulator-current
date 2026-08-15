/** Shared display formatting for ring data, used by Legend and RingPopup. */

/** Rounded percent; sub-1% rates read as "<1%" rather than "0%". */
export function ratePct(rate: number): string {
  const pct = rate * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

/** Ground radius in km, and in miles for the US audience. */
export function formatRadius(radiusM: number): { km: string; mi: string } {
  return {
    km: `${(radiusM / 1000).toFixed(2)} km`,
    mi: `${(radiusM / 1609.34).toFixed(2)} mi`,
  };
}
