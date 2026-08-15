/**
 * Shared motion vocabulary.
 *
 * These were originally duplicated as local constants in ResultsPanel and
 * Legend; keeping one copy means the results bar, the legend and the tab
 * panels stay in step when the timing is tuned.
 */

/** Decelerating ease — fast start, long settle. Feels physical for size changes. */
export const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Duration (ms) for panel-scale changes: height, padding, font-size. */
export const DUR = 450;

/** Duration (ms) for small state changes: opacity, colour, transform. */
export const DUR_FAST = 180;
