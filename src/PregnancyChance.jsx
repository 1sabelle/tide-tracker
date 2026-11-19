import { useState } from 'react';
import { findCycleContaining } from './cycle.js';
import { addDays, daysBetween, formatShort } from './dates.js';
import { conceptionChance, describeChance, possibleOvulationDates } from './pregnancy.js';

const CHART_MAX_CHANCE = 0.35;
const GRIDLINES = [0.1, 0.2, 0.3];
// Emergency contraception is effective up to about 5 days (120 hours) after sex.
const EMERGENCY_CONTRACEPTION_DAYS = 5;

function percent(chance) {
  return `${Math.round(chance * 100)}%`;
}

function cycleDatesOf(cycle) {
  const dates = [];
  for (let date = cycle.start; date < cycle.nextStartLatest; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export default function PregnancyChance({ logs, prediction, lutealLength, today, selectedDate, onSelect }) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const cycle = findCycleContaining(selectedDate, prediction);
  if (!cycle || cycle.start > today) return null;

  const cycleDates = cycleDatesOf(cycle);
  const ovulationDates = possibleOvulationDates(cycle, lutealLength);
  const sexDates = cycleDates.filter((date) => logs[date]?.unprotectedSex);
  const cycleChance = conceptionChance(sexDates, ovulationDates);
  const isCompletedCycle = cycle.nextStartEarliest === cycle.nextStartLatest && cycle.nextStartLatest <= today;
  const daysLate = daysBetween(prediction.nextPeriod.start, today);
  const isPeriodLate = !isCompletedCycle && daysLate > 0;
  const recentSexDate = sexDates.findLast((date) => daysBetween(date, today) < EMERGENCY_CONTRACEPTION_DAYS);
  const readoutDate = hoveredDate ?? selectedDate;
  const cycleIndex = prediction.cycles.indexOf(cycle);
  const previousCycle = prediction.cycles[cycleIndex - 1];
  const nextCycle = prediction.cycles[cycleIndex + 1];
  const hasStartedNextCycle = nextCycle && nextCycle.start <= today;

  return (
    <details className="pregnancy collapsible" open>
      <summary>Pregnancy likelihood</summary>
      <div className="subheading cycle-nav">
        <button disabled={!previousCycle} onClick={() => onSelect(previousCycle.start)} aria-label="Previous cycle">‹</button>
        <span>Cycle starting {formatShort(cycle.start)}</span>
        <button disabled={!hasStartedNextCycle} onClick={() => onSelect(nextCycle.start)} aria-label="Next cycle">›</button>
      </div>

      {sexDates.length === 0 ? (
        <p className="verdict">No unprotected sex logged in this cycle.</p>
      ) : isCompletedCycle ? (
        <p className="verdict">
          Estimated {percent(cycleChance)} ({describeChance(cycleChance)}) from {sexDates.length} logged day
          {sexDates.length > 1 ? 's' : ''}. A period started on {formatShort(cycle.nextStartLatest)}, which usually
          means this cycle did not lead to pregnancy.
        </p>
      ) : (
        <p className="verdict">
          <strong>
            Estimated {percent(cycleChance)} ({describeChance(cycleChance)})
          </strong>{' '}
          from {sexDates.length} logged day{sexDates.length > 1 ? 's' : ''} of unprotected sex this cycle.
        </p>
      )}
      {!isCompletedCycle && sexDates.length > 0 && isPeriodLate && (
        <p className="note">
          Your period is {daysLate} day{daysLate > 1 ? 's' : ''} late. A home pregnancy test is reliable from the day
          your period was due.
        </p>
      )}
      {!isCompletedCycle && recentSexDate && cycleChance >= 0.02 && (
        <p className="note">
          Emergency contraception works up to about 5 days after sex and is most effective the sooner it is taken.
        </p>
      )}

      <DayReadout date={readoutDate} cycle={cycle} chance={conceptionChance([readoutDate], ovulationDates)} logs={logs} />
      <div className="chance-chart" role="list" aria-label="Chance of pregnancy from unprotected sex on each day of this cycle">
        {GRIDLINES.map((gridline) => (
          <div key={gridline} className="gridline" style={{ bottom: `${(gridline / CHART_MAX_CHANCE) * 100}%` }}>
            <span>{percent(gridline)}</span>
          </div>
        ))}
        {cycleDates.map((date) => {
          const chance = conceptionChance([date], ovulationDates);
          const hadSex = Boolean(logs[date]?.unprotectedSex);
          const cycleDay = daysBetween(cycle.start, date) + 1;
          const classes = ['column', hadSex && 'had-sex', date === selectedDate && 'is-selected', date === today && 'is-today'];
          return (
            <button
              key={date}
              role="listitem"
              className={classes.filter(Boolean).join(' ')}
              aria-label={`${formatShort(date)}, cycle day ${cycleDay}: ${percent(chance)}${hadSex ? ', unprotected sex logged' : ''}`}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              onFocus={() => setHoveredDate(date)}
              onBlur={() => setHoveredDate(null)}
              onClick={() => onSelect(date)}
            >
              <span className="bar-area">
                {hadSex && <span className="sex-mark">♥</span>}
                <span className="bar" style={{ height: `${(chance / CHART_MAX_CHANCE) * 100}%` }} />
              </span>
              <span className="tick">{cycleDay === 1 || cycleDay % 7 === 0 ? cycleDay : ''}</span>
            </button>
          );
        })}
      </div>
      <p className="axis-label">Day of cycle</p>

      <p className="hint">
        Each bar is the chance of pregnancy from unprotected sex on that day alone, using per-day rates from Wilcox et
        al. (1995) averaged over your likely ovulation days. Estimates only: not a substitute for contraception or a
        pregnancy test.
      </p>
    </details>
  );
}

function DayReadout({ date, cycle, chance, logs }) {
  const hadSex = Boolean(logs[date]?.unprotectedSex);
  const isInCycle = date >= cycle.start && date < cycle.nextStartLatest;
  if (!isInCycle) return <p className="readout">&nbsp;</p>;
  return (
    <p className="readout">
      {formatShort(date)} · cycle day {daysBetween(cycle.start, date) + 1} · <strong>{percent(chance)}</strong> chance from
      sex on this day{hadSex && ' · ♥ logged'}
    </p>
  );
}
