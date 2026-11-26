import { describe, expect, it } from 'vitest';
import { conceptionChance, possibleOvulationDates } from './pregnancy.js';

describe('conceptionChance', () => {
  it('uses the per-day rate when ovulation is known exactly', () => {
    expect(conceptionChance(['2026-01-13'], ['2026-01-15'])).toBeCloseTo(0.27);
    expect(conceptionChance(['2026-01-16'], ['2026-01-15'])).toBe(0);
    expect(conceptionChance(['2026-01-05'], ['2026-01-15'])).toBe(0);
  });

  it('combines several days without exceeding certainty', () => {
    const chance = conceptionChance(['2026-01-14', '2026-01-15'], ['2026-01-15']);
    expect(chance).toBeCloseTo(1 - (1 - 0.31) * (1 - 0.33));
  });

  it('averages over uncertain ovulation days', () => {
    expect(conceptionChance(['2026-01-15'], ['2026-01-15', '2026-01-20'])).toBeCloseTo((0.33 + 0.1) / 2);
  });
});

describe('possibleOvulationDates', () => {
  it('spans the next-period window shifted back by the luteal phase, plus its variation', () => {
    const dates = possibleOvulationDates({ nextStartEarliest: '2026-01-27', nextStartLatest: '2026-01-29' }, 14);
    expect(dates[0]).toBe('2026-01-11');
    expect(dates.at(-1)).toBe('2026-01-17');
  });

  it('is the one or two days after a clear surge in ovulation tests', () => {
    const dates = possibleOvulationDates({ surgeStart: '2026-01-18', nextStartEarliest: '2026-01-27', nextStartLatest: '2026-01-29' }, 14);
    expect(dates).toEqual(['2026-01-19', '2026-01-20']);
  });
});
