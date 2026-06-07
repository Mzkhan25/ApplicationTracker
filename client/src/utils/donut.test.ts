import { describe, it, expect } from 'vitest';
import { donutSegments } from './donut';

describe('donutSegments', () => {
  it('splits a circle into proportional arcs with cumulative offsets', () => {
    const segments = donutSegments([1, 2, 1], 4);
    expect(segments.map((s) => s.fraction)).toEqual([0.25, 0.5, 0.25]);
    expect(segments.map((s) => s.dashLength)).toEqual([1, 2, 1]);
    // Each arc starts where the previous ones ended.
    expect(segments.map((s) => s.offset)).toEqual([0, -1, -3]);
    // Gap fills the rest of the circumference so only one arc shows per circle.
    expect(segments.map((s) => s.dashGap)).toEqual([3, 2, 3]);
  });

  it('yields zero-length arcs when the total is zero', () => {
    const segments = donutSegments([0, 0], 100);
    expect(segments.map((s) => s.fraction)).toEqual([0, 0]);
    expect(segments.map((s) => s.dashLength)).toEqual([0, 0]);
    expect(segments.map((s) => s.offset)).toEqual([0, 0]);
  });
});
