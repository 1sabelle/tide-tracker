import { describe, expect, it } from 'vitest';
import { findSurgeStarts } from './ovulation.js';

describe('findSurgeStarts', () => {
  it('treats positives with only untested days between them as one surge', () => {
    const logs = {
      '2026-01-12': { ovulationTest: 'negative' },
      '2026-01-13': { ovulationTest: 'positive' },
      '2026-01-15': { ovulationTest: 'positive' },
    };
    expect(findSurgeStarts(logs, '2026-01-01', '2026-01-29')).toEqual(['2026-01-13']);
  });

  it('starts a new surge after a negative test', () => {
    const logs = {
      '2026-01-10': { ovulationTest: 'positive' },
      '2026-01-11': { ovulationTest: 'negative' },
      '2026-01-16': { ovulationTest: 'positive' },
    };
    expect(findSurgeStarts(logs, '2026-01-01', '2026-01-29')).toEqual(['2026-01-10', '2026-01-16']);
  });

  it('only looks within the given range', () => {
    const logs = { '2026-01-29': { ovulationTest: 'positive' } };
    expect(findSurgeStarts(logs, '2026-01-01', '2026-01-29')).toEqual([]);
  });
});
