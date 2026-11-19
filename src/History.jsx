import { CRAMP_LEVELS, measureCycles } from './cycle.js';
import { addDays, daysBetween, formatShort } from './dates.js';
import PastPeriodForm from './PastPeriodForm.jsx';

function strongestCrampsDuring(period, logs) {
  let strongest = 0;
  for (let date = period.start; date <= period.end; date = addDays(date, 1)) {
    strongest = Math.max(strongest, logs[date]?.cramps ?? 0);
  }
  return strongest;
}

function heavyDaysDuring(period, logs) {
  let heavyDays = 0;
  for (let date = period.start; date <= period.end; date = addDays(date, 1)) {
    if (logs[date]?.flow === 'heavy') heavyDays++;
  }
  return heavyDays;
}

export default function History({ logs, prediction, today, onAddPastPeriod }) {
  const periods = prediction?.periods ?? [];
  const cycleLengthByStart = Object.fromEntries(
    measureCycles(periods).map((cycle) => [cycle.start, cycle.length]),
  );
  const newestFirstPeriods = [...periods].reverse();

  return (
    <details className="history collapsible" open>
      <summary>Past periods</summary>
      <PastPeriodForm today={today} onAdd={onAddPastPeriod} />
      {newestFirstPeriods.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>Period</th>
              <th>Cycle</th>
              <th>Heavy days</th>
              <th>Worst cramps</th>
            </tr>
          </thead>
          <tbody>
            {newestFirstPeriods.map((period) => (
              <tr key={period.start}>
                <td>{formatShort(period.start)}</td>
                <td>{daysBetween(period.start, period.end) + 1} days</td>
                <td>{cycleLengthByStart[period.start] ? `${cycleLengthByStart[period.start]} days` : 'current'}</td>
                <td>{heavyDaysDuring(period, logs)}</td>
                <td>{CRAMP_LEVELS[strongestCrampsDuring(period, logs)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  );
}
