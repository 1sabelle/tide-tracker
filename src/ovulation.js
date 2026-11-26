import { addDays } from './dates.js';

// Ovulation usually follows the first positive urine LH test within about 1 to 2 days.
// The earlier day is used as the single best estimate.
const LIKELY_OVULATION_DAYS_AFTER_SURGE_START = [1, 2];
// A luteal phase outside this range more likely comes from a misread surge or a missed period log than from a real
// measurement, so it is not learned from.
const MIN_PLAUSIBLE_LUTEAL_LENGTH = 7;
const MAX_PLAUSIBLE_LUTEAL_LENGTH = 17;

// The first day of each LH surge logged from start up to (not including) end.
// Positive tests belong to the same surge until a negative test separates them; untested days in between do not.
export function findSurgeStarts(logs, start, end) {
  const surgeStarts = [];
  let isInSurge = false;
  for (let date = start; date < end; date = addDays(date, 1)) {
    const result = logs[date]?.ovulationTest;
    if (result === 'positive' && !isInSurge) surgeStarts.push(date);
    if (result) isInSurge = result === 'positive';
  }
  return surgeStarts;
}

export function ovulationAfterSurge(surgeStart) {
  return addDays(surgeStart, LIKELY_OVULATION_DAYS_AFTER_SURGE_START[0]);
}

export function likelyOvulationDatesAfterSurge(surgeStart) {
  return LIKELY_OVULATION_DAYS_AFTER_SURGE_START.map((days) => addDays(surgeStart, days));
}

export function isPlausibleLutealLength(days) {
  return days >= MIN_PLAUSIBLE_LUTEAL_LENGTH && days <= MAX_PLAUSIBLE_LUTEAL_LENGTH;
}
