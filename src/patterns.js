import { MOODS, PAINKILLERS, SYMPTOMS } from './cycle.js';
import { addDays, daysBetween } from './dates.js';

// Each thing the patterns view tracks, and how to tell whether a day's log has it.
const TRACKED = [
  { group: 'Symptoms', label: 'cramps', isLoggedIn: (dayLog) => dayLog.cramps > 0 },
  ...SYMPTOMS.map((symptom) => ({
    group: 'Symptoms',
    label: symptom,
    isLoggedIn: (dayLog) => dayLog.symptoms?.includes(symptom),
  })),
  ...PAINKILLERS.map((painkiller) => ({
    group: 'Painkillers',
    label: painkiller,
    isLoggedIn: (dayLog) => dayLog.painkillers?.includes(painkiller),
  })),
  ...MOODS.map((mood) => ({ group: 'Mood', label: mood, isLoggedIn: (dayLog) => dayLog.mood === mood })),
];

function earlierOf(isoDateA, isoDateB) {
  return isoDateA < isoDateB ? isoDateA : isoDateB;
}

// The days of each cycle that have happened: up to the day before the next period, or up to today.
function collectLivedCycles(prediction, today) {
  // Only future cycles start after today, and the cycle in progress always has a predicted one after it.
  return prediction.cycles.flatMap((cycle, i) =>
    cycle.start > today
      ? []
      : [{ start: cycle.start, end: earlierOf(addDays(prediction.cycles[i + 1].start, -1), today) }],
  );
}

// For each tracked thing and cycle day: in how many cycles it was logged on that day,
// out of how many cycles have reached that day so far.
export function measurePatterns(logs, prediction, today) {
  if (!prediction) return { cycleCount: 0, cycleDays: [], rows: [] };
  const cycles = collectLivedCycles(prediction, today);
  const longestCycleDays = Math.max(...cycles.map((cycle) => daysBetween(cycle.start, cycle.end) + 1));
  const cycleDays = Array.from({ length: longestCycleDays }, (_, i) => i + 1);

  const cyclesReachingDay = cycleDays.map(
    (cycleDay) => cycles.filter((cycle) => addDays(cycle.start, cycleDay - 1) <= cycle.end).length,
  );
  const rows = TRACKED.map(({ group, label, isLoggedIn }) => ({
    group,
    label,
    days: cycleDays.map((cycleDay, i) => {
      const loggedIn = cycles.filter((cycle) => {
        const date = addDays(cycle.start, cycleDay - 1);
        return date <= cycle.end && logs[date] && isLoggedIn(logs[date]);
      }).length;
      return { cycleDay, loggedIn, outOf: cyclesReachingDay[i] };
    }),
  })).filter((row) => row.days.some((day) => day.loggedIn > 0));

  return { cycleCount: cycles.length, cycleDays, rows };
}
