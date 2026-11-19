import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, predictCycles } from './cycle.js';
import { addDays } from './dates.js';
import { measurePatterns } from './patterns.js';

const dayOn = (cycleStart, cycleDay) => addDays(cycleStart, cycleDay - 1);

describe('measurePatterns', () => {
  // Two finished 28-day cycles, and a third in progress on its day 10.
  const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
  const today = '2026-03-07';
  const logs = Object.fromEntries(starts.map((start) => [start, { flow: 'medium', cramps: 2 }]));
  logs[dayOn(starts[0], 27)] = { symptoms: ['headache'] };
  logs[dayOn(starts[1], 27)] = { symptoms: ['headache'], painkillers: ['ibuprofen'] };
  const patterns = measurePatterns(logs, predictCycles(logs, DEFAULT_SETTINGS, today), today);
  const rowFor = (label) => patterns.rows.find((row) => row.label === label);

  it('counts every cycle lived so far, up to the longest one', () => {
    expect(patterns.cycleCount).toBe(3);
    expect(patterns.cycleDays).toHaveLength(28);
  });

  it('counts a cycle day only against the cycles that have reached it', () => {
    expect(rowFor('cramps').days[0]).toEqual({ cycleDay: 1, loggedIn: 3, outOf: 3 });
    expect(rowFor('headache').days[26]).toEqual({ cycleDay: 27, loggedIn: 2, outOf: 2 });
    expect(rowFor('ibuprofen').days[26]).toEqual({ cycleDay: 27, loggedIn: 1, outOf: 2 });
  });

  it('leaves out things that were never logged', () => {
    expect(rowFor('acne')).toBeUndefined();
    expect(patterns.rows.map((row) => row.label)).toEqual(['cramps', 'headache', 'ibuprofen']);
  });
});
