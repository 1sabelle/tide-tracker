import { addDays, daysBetween } from './dates.js';

export const FLOW_LEVELS = ['none', 'spotting', 'light', 'medium', 'heavy'];
export const CRAMP_LEVELS = ['none', 'mild', 'moderate', 'severe'];
export const SYMPTOMS = [
  'headache',
  'migraine',
  'bloating',
  'breast tenderness',
  'acne',
  'fatigue',
  'back pain',
  'nausea',
  'cravings',
];
export const PAINKILLERS = ['ibuprofen', 'paracetamol'];
export const MOODS = ['happy', 'calm', 'sensitive', 'irritable', 'low', 'anxious'];
// Only a noticeably low or high day is logged; nothing logged means nothing stood out.
export const LIBIDO_LEVELS = ['low', 'high'];
// The result of an LH ovulation test taken that day; nothing logged means no test was taken.
export const OVULATION_TEST_RESULTS = ['negative', 'positive'];

export const EMPTY_DAY_LOG = {
  flow: 'none',
  cramps: 0,
  symptoms: [],
  painkillers: [],
  mood: null,
  libido: null,
  ovulationTest: null,
  notes: '',
  unprotectedSex: false,
};

export const DEFAULT_SETTINGS = {
  cycleLength: 28,
  periodLength: 5,
  lutealLength: 14,
};

// One unlogged day inside a period (gap of 2 between bleeding days) still counts as the same period.
const MAX_GAP_WITHIN_PERIOD = 2;
const RECENT_CYCLES_USED = 6;
const PREDICTED_CYCLES = 3;
const FERTILE_DAYS_BEFORE_OVULATION = 5;
const FERTILE_DAYS_AFTER_OVULATION = 1;
// A fertilised egg implants 6-12 days after ovulation. Wilcox, Baird & Weinberg (1999), NEJM 340:1796-9.
const IMPLANTATION_FIRST_DAY_AFTER_OVULATION = 6;
const IMPLANTATION_LAST_DAY_AFTER_OVULATION = 12;
// The ovulatory phase is counted as the predicted ovulation day and one day either side.
const OVULATORY_DAYS_AROUND_OVULATION = 1;

// Spotting alone does not start or extend a period.
export function isBleedingDay(dayLog) {
  return dayLog?.flow === 'light' || dayLog?.flow === 'medium' || dayLog?.flow === 'heavy';
}

// Cycles shorter or longer than this are most likely a missed or partial log, not a real cycle.
function isPlausibleCycleLength(days) {
  return days >= 15 && days <= 60;
}

export function findPeriods(logs) {
  const bleedingDates = Object.keys(logs)
    .filter((date) => isBleedingDay(logs[date]))
    .sort();
  const periods = [];
  for (const date of bleedingDates) {
    const currentPeriod = periods.at(-1);
    if (currentPeriod && daysBetween(currentPeriod.end, date) <= MAX_GAP_WITHIN_PERIOD) {
      currentPeriod.end = date;
    } else {
      periods.push({ start: date, end: date });
    }
  }
  return periods;
}

function periodLengthOf(period) {
  return daysBetween(period.start, period.end) + 1;
}

// A completed cycle runs from one period start to the day before the next.
export function measureCycles(periods) {
  return periods.slice(0, -1).map((period, i) => ({
    start: period.start,
    length: daysBetween(period.start, periods[i + 1].start),
    periodLength: periodLengthOf(period),
  }));
}

function averageRounded(numbers) {
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

function laterOf(isoDateA, isoDateB) {
  return isoDateA > isoDateB ? isoDateA : isoDateB;
}

function fertilityFor(nextPeriodStart, lutealLength) {
  const ovulation = addDays(nextPeriodStart, -lutealLength);
  return {
    ovulation,
    fertileStart: addDays(ovulation, -FERTILE_DAYS_BEFORE_OVULATION),
    fertileEnd: addDays(ovulation, FERTILE_DAYS_AFTER_OVULATION),
    implantationStart: addDays(ovulation, IMPLANTATION_FIRST_DAY_AFTER_OVULATION),
    implantationEnd: addDays(ovulation, IMPLANTATION_LAST_DAY_AFTER_OVULATION),
  };
}

// Menstrual while the period lasts, follicular until ovulation, ovulatory around it, luteal until the next period.
// lastDay is the predicted last day of that phase; it is in the past when the period runs long or is late.
function phaseOn(today, ongoingPeriod, ovulation, nextPeriodStart) {
  if (ongoingPeriod) return { name: 'menstrual', lastDay: ongoingPeriod.end };
  const ovulatoryStart = addDays(ovulation, -OVULATORY_DAYS_AROUND_OVULATION);
  const ovulatoryEnd = addDays(ovulation, OVULATORY_DAYS_AROUND_OVULATION);
  if (today < ovulatoryStart) return { name: 'follicular', lastDay: addDays(ovulatoryStart, -1) };
  if (today <= ovulatoryEnd) return { name: 'ovulatory', lastDay: ovulatoryEnd };
  return { name: 'luteal', lastDay: addDays(nextPeriodStart, -1) };
}

export function predictCycles(logs, settings, today) {
  const periods = findPeriods(logs);
  if (periods.length === 0) return null;

  const lastPeriod = periods.at(-1);
  const isLastPeriodOngoing = daysBetween(lastPeriod.end, today) < MAX_GAP_WITHIN_PERIOD;
  const completedPeriods = isLastPeriodOngoing ? periods.slice(0, -1) : periods;

  const recentCycleLengths = measureCycles(periods)
    .map((cycle) => cycle.length)
    .filter(isPlausibleCycleLength)
    .slice(-RECENT_CYCLES_USED);
  const recentPeriodLengths = completedPeriods.slice(-RECENT_CYCLES_USED).map(periodLengthOf);

  const hasCycleHistory = recentCycleLengths.length > 0;
  const cycleLength = hasCycleHistory ? averageRounded(recentCycleLengths) : settings.cycleLength;
  const periodLength =
    recentPeriodLengths.length > 0 ? averageRounded(recentPeriodLengths) : settings.periodLength;
  const shortestCycle = hasCycleHistory ? Math.min(...recentCycleLengths) : cycleLength;
  const longestCycle = hasCycleHistory ? Math.max(...recentCycleLengths) : cycleLength;

  const pastCycles = periods.slice(0, -1).map((period, i) => ({
    start: period.start,
    nextStartEarliest: periods[i + 1].start,
    nextStartLatest: periods[i + 1].start,
    predictedPeriod: null,
    ...fertilityFor(periods[i + 1].start, settings.lutealLength),
  }));

  // While a period is ongoing, its expected end comes from the average period length.
  const ongoingPeriod = isLastPeriodOngoing
    ? { start: lastPeriod.start, end: addDays(lastPeriod.start, periodLength - 1) }
    : null;

  // No period has been logged since the last one, so the next can start tomorrow at the earliest.
  // While it is due or late, later predictions move along with that.
  const nextPeriodStart = addDays(lastPeriod.start, cycleLength);
  const tomorrow = addDays(today, 1);
  const postponedDays = Math.max(0, daysBetween(nextPeriodStart, tomorrow));
  const futureCycles = [];
  for (let k = 0; k <= PREDICTED_CYCLES; k++) {
    const start = k === 0 ? lastPeriod.start : addDays(lastPeriod.start, k * cycleLength + postponedDays);
    const nextStart = addDays(lastPeriod.start, (k + 1) * cycleLength + postponedDays);
    const nextStartEarliest = laterOf(addDays(start, shortestCycle), tomorrow);
    futureCycles.push({
      start,
      nextStartEarliest,
      nextStartLatest: laterOf(addDays(start, longestCycle), nextStartEarliest),
      predictedPeriod: k === 0 ? ongoingPeriod : { start, end: addDays(start, periodLength - 1) },
      ...fertilityFor(nextStart, settings.lutealLength),
    });
  }

  return {
    periods,
    cycleLength,
    periodLength,
    basedOnCycles: recentCycleLengths.length,
    basedOnPeriods: recentPeriodLengths.length,
    cycleDay: daysBetween(lastPeriod.start, today) + 1,
    phase: phaseOn(today, ongoingPeriod, futureCycles[0].ovulation, nextPeriodStart),
    ongoingPeriod,
    nextPeriod: {
      start: nextPeriodStart,
      end: addDays(nextPeriodStart, periodLength - 1),
      earliest: addDays(lastPeriod.start, shortestCycle),
      latest: addDays(lastPeriod.start, longestCycle),
    },
    daysUntilNextPeriod: daysBetween(today, nextPeriodStart),
    upcomingFertility: futureCycles.find((cycle) => cycle.fertileEnd >= today) ?? null,
    cycles: [...pastCycles, ...futureCycles],
  };
}

// The cycle a date belongs to: the latest cycle starting on or before it.
export function findCycleContaining(date, prediction) {
  return prediction?.cycles.findLast((cycle) => cycle.start <= date) ?? null;
}

export function classifyDay(date, prediction) {
  if (!prediction) return {};
  const isWithin = (start, end) => date >= start && date <= end;
  return {
    isPeriod: prediction.periods.some((p) => isWithin(p.start, p.end)),
    isPredictedPeriod: prediction.cycles.some(
      (c) => c.predictedPeriod && isWithin(c.predictedPeriod.start, c.predictedPeriod.end),
    ),
    isFertile: prediction.cycles.some((c) => isWithin(c.fertileStart, c.fertileEnd)),
    isOvulation: prediction.cycles.some((c) => c.ovulation === date),
    isImplantation: prediction.cycles.some((c) => isWithin(c.implantationStart, c.implantationEnd)),
  };
}

// Marks every day from start to end as bleeding with the given flow.
// Days that already have bleeding logged keep their own flow; other fields are never touched.
export function logPastPeriod(logs, start, end, flow) {
  const updatedLogs = { ...logs };
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const dayLog = logs[date] ?? EMPTY_DAY_LOG;
    updatedLogs[date] = isBleedingDay(dayLog) ? dayLog : { ...dayLog, flow };
  }
  return updatedLogs;
}

export function isEmptyLog(dayLog) {
  return (
    (dayLog.flow ?? 'none') === 'none' &&
    (dayLog.cramps ?? 0) === 0 &&
    (dayLog.symptoms ?? []).length === 0 &&
    (dayLog.painkillers ?? []).length === 0 &&
    !dayLog.mood &&
    !dayLog.libido &&
    !dayLog.ovulationTest &&
    !dayLog.unprotectedSex &&
    !(dayLog.notes ?? '').trim()
  );
}
