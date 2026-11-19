import { describe, expect, it } from 'vitest';
import { classifyDay, DEFAULT_SETTINGS, findCycleContaining, findPeriods, logPastPeriod, predictCycles } from './cycle.js';
import { parseData } from './storage.js';

function bleeding(...dates) {
  return Object.fromEntries(dates.map((date) => [date, { flow: 'medium' }]));
}

describe('findPeriods', () => {
  it('groups consecutive bleeding days and tolerates one unlogged day', () => {
    const logs = bleeding('2026-01-01', '2026-01-02', '2026-01-04', '2026-01-29');
    expect(findPeriods(logs)).toEqual([
      { start: '2026-01-01', end: '2026-01-04' },
      { start: '2026-01-29', end: '2026-01-29' },
    ]);
  });

  it('ignores spotting', () => {
    expect(findPeriods({ '2026-01-01': { flow: 'spotting' } })).toEqual([]);
  });
});

describe('predictCycles', () => {
  it('returns null with no periods logged', () => {
    expect(predictCycles({}, DEFAULT_SETTINGS, '2026-01-10')).toBeNull();
  });

  it('uses default cycle length with a single period', () => {
    const logs = bleeding('2026-01-01', '2026-01-02', '2026-01-03');
    const prediction = predictCycles(logs, DEFAULT_SETTINGS, '2026-01-10');
    expect(prediction.cycleDay).toBe(10);
    expect(prediction.nextPeriod.start).toBe('2026-01-29');
    expect(prediction.periodLength).toBe(3);
    expect(prediction.upcomingFertility).toMatchObject({
      ovulation: '2026-01-15',
      fertileStart: '2026-01-10',
      fertileEnd: '2026-01-16',
    });
  });

  it('averages recent cycle lengths and gives an earliest/latest window', () => {
    // Cycles of 30 and 26 days -> average 28.
    const logs = bleeding('2026-01-01', '2026-01-31', '2026-02-26');
    const prediction = predictCycles(logs, DEFAULT_SETTINGS, '2026-03-01');
    expect(prediction.cycleLength).toBe(28);
    expect(prediction.basedOnCycles).toBe(2);
    expect(prediction.basedOnPeriods).toBe(3);
    expect(prediction.nextPeriod).toMatchObject({ start: '2026-03-26', earliest: '2026-03-24', latest: '2026-03-28' });
    expect(prediction.daysUntilNextPeriod).toBe(25);
  });

  it('ignores implausible cycle lengths from missed logging', () => {
    const logs = bleeding('2026-01-01', '2026-01-29', '2026-04-01');
    expect(predictCycles(logs, DEFAULT_SETTINGS, '2026-04-02').cycleLength).toBe(28);
  });

  it('does not count an ongoing period towards the average period length', () => {
    const logs = bleeding('2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-29');
    expect(predictCycles(logs, DEFAULT_SETTINGS, '2026-01-29').periodLength).toBe(4);
  });

  it('classifies calendar days', () => {
    const logs = bleeding('2026-01-01');
    const prediction = predictCycles(logs, DEFAULT_SETTINGS, '2026-01-05');
    expect(classifyDay('2026-01-01', prediction).isPeriod).toBe(true);
    expect(classifyDay('2026-01-15', prediction)).toMatchObject({ isOvulation: true, isFertile: true });
    expect(classifyDay('2026-01-29', prediction).isPredictedPeriod).toBe(true);
  });

  it('marks possible implantation 6 to 12 days after ovulation', () => {
    const logs = bleeding('2026-01-01');
    const prediction = predictCycles(logs, DEFAULT_SETTINGS, '2026-01-05');
    // Ovulation is 2026-01-15.
    expect(classifyDay('2026-01-20', prediction).isImplantation).toBe(false);
    expect(classifyDay('2026-01-21', prediction).isImplantation).toBe(true);
    expect(classifyDay('2026-01-27', prediction).isImplantation).toBe(true);
    expect(classifyDay('2026-01-28', prediction).isImplantation).toBe(false);
  });
});

describe('late periods', () => {
  it('moves later predictions to tomorrow while a period is late', () => {
    const logs = bleeding('2026-01-01');
    const prediction = predictCycles(logs, DEFAULT_SETTINGS, '2026-02-02');
    expect(prediction.daysUntilNextPeriod).toBe(-4);
    const current = findCycleContaining('2026-02-02', prediction);
    expect(current.start).toBe('2026-01-01');
    expect(current.nextStartEarliest).toBe('2026-02-03');
    expect(prediction.cycles.find((c) => c.predictedPeriod).predictedPeriod.start).toBe('2026-02-03');
  });
});

describe('logPastPeriod', () => {
  it('fills the range and keeps what was already logged', () => {
    const logs = {
      '2026-01-02': { flow: 'heavy', cramps: 3, symptoms: [], mood: null, notes: 'bad day' },
      '2026-01-03': { flow: 'none', cramps: 1, symptoms: ['acne'], mood: null, notes: '' },
    };
    const updated = logPastPeriod(logs, '2026-01-01', '2026-01-04', 'medium');
    expect(Object.keys(updated).sort()).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
    expect(updated['2026-01-01'].flow).toBe('medium');
    expect(updated['2026-01-02']).toEqual(logs['2026-01-02']);
    expect(updated['2026-01-03']).toMatchObject({ flow: 'medium', cramps: 1, symptoms: ['acne'] });
    expect(findPeriods(updated)).toEqual([{ start: '2026-01-01', end: '2026-01-04' }]);
  });
});

describe('parseData', () => {
  it('loads days saved with the old "sad" mood as "low"', () => {
    const { data, errors } = parseData({ logs: { '2026-01-01': { mood: 'sad' } } });
    expect(errors).toEqual([]);
    expect(data.logs['2026-01-01'].mood).toBe('low');
  });

  it('reports every invalid entry and keeps the valid ones', () => {
    const { data, errors } = parseData({
      logs: {
        '2026-01-01': { flow: 'heavy', cramps: 2 },
        '2026-13-01': { flow: 'light' },
        '2026-01-02': { flow: 'lots', cramps: 9 },
      },
    });
    expect(Object.keys(data.logs)).toEqual(['2026-01-01']);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain('"2026-13-01"');
  });
});
