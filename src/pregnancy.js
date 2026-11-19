import { addDays, daysBetween } from './dates.js';

// Chance of conception from unprotected sex on one day, indexed by days before ovulation (0 = ovulation day).
// Wilcox, Weinberg & Baird (1995), NEJM 333:1517-21. No pregnancies followed sex after the ovulation day.
const CONCEPTION_CHANCE_BY_DAYS_BEFORE_OVULATION = [0.33, 0.31, 0.27, 0.14, 0.16, 0.1];
// The time from ovulation to the next period itself varies by a couple of days.
const LUTEAL_VARIATION_DAYS = 2;

function singleDayChance(sexDate, ovulationDate) {
  return CONCEPTION_CHANCE_BY_DAYS_BEFORE_OVULATION[daysBetween(sexDate, ovulationDate)] ?? 0;
}

// Every day ovulation could plausibly fall on in this cycle, given how uncertain the next period start is.
export function possibleOvulationDates(cycle, lutealLength) {
  const first = addDays(cycle.nextStartEarliest, -lutealLength - LUTEAL_VARIATION_DAYS);
  const last = addDays(cycle.nextStartLatest, -lutealLength + LUTEAL_VARIATION_DAYS);
  const dates = [];
  for (let date = first; date <= last; date = addDays(date, 1)) dates.push(date);
  return dates;
}

// Chance that at least one of the sex dates leads to pregnancy, averaged over the possible ovulation days
// (each treated as equally likely, since the exact one is unknown).
export function conceptionChance(sexDates, ovulationDates) {
  const totalChance = ovulationDates.reduce((sum, ovulation) => {
    const chanceOfNoConception = sexDates.reduce((p, date) => p * (1 - singleDayChance(date, ovulation)), 1);
    return sum + (1 - chanceOfNoConception);
  }, 0);
  return totalChance / ovulationDates.length;
}

export function describeChance(chance) {
  if (chance < 0.02) return 'very low';
  if (chance < 0.1) return 'low';
  if (chance < 0.2) return 'moderate';
  return 'high';
}
