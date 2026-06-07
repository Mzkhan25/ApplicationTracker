import { describe, it, expect } from 'vitest';
import { formatMoney, formatSalary } from './format';

describe('formatMoney', () => {
  it('formats the exact amount in euros, without rounding', () => {
    expect(formatMoney(185000)).toBe('€185,000');
    expect(formatMoney(145500)).toBe('€145,500');
  });
});

describe('formatSalary (range, euros)', () => {
  it('formats a min–max range', () => {
    expect(formatSalary(120000, 150000)).toBe('€120k–150k');
  });

  it('returns null when both are missing', () => {
    expect(formatSalary(undefined, undefined)).toBeNull();
  });
});
