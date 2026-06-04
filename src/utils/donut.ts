export interface DonutSegment {
  /** Share of the whole, 0..1 (0 when the total is 0). */
  fraction: number;
  /** Arc length along the circle for this slice (= fraction × circumference). */
  dashLength: number;
  /** Remaining circumference, used as the dash gap so one arc shows per circle. */
  dashGap: number;
  /** strokeDashoffset that places this arc after the previous slices. */
  offset: number;
}

/**
 * Compute the arcs for a stacked-circle SVG donut. Each value becomes one arc
 * whose length is its share of the total; offsets accumulate so the arcs sit
 * end-to-end around the ring. Pure geometry — no SVG, no DOM.
 */
export function donutSegments(
  values: number[],
  circumference: number,
): DonutSegment[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  let accumulated = 0;
  return values.map((value) => {
    const fraction = total === 0 ? 0 : value / total;
    const dashLength = fraction * circumference;
    const segment: DonutSegment = {
      fraction,
      dashLength,
      dashGap: circumference - dashLength,
      // Negate, but keep a clean +0 for the first slice (avoid -0).
      offset: accumulated === 0 ? 0 : -accumulated,
    };
    accumulated += dashLength;
    return segment;
  });
}
