import { daysBetween, formatShort } from './dates.js';

function describeDaysUntil(days) {
  if (days > 1) return `in ${days} days`;
  if (days === 1) return 'tomorrow';
  if (days === 0) return 'today';
  return `${-days} ${days === -1 ? 'day' : 'days'} late`;
}

// Nothing is shown once the predicted end has passed (a long period or a late one).
function describeDaysRemaining(phase, today) {
  const daysAfterToday = daysBetween(today, phase.lastDay);
  if (daysAfterToday > 0) return ` (${daysAfterToday} ${daysAfterToday === 1 ? 'day' : 'days'} remaining)`;
  if (daysAfterToday === 0) return ' (last day)';
  return '';
}

export default function Summary({ prediction, today }) {
  if (!prediction) {
    return (
      <section className="summary">
        <p className="empty">
          Log the first day of your period (flow light, medium or heavy) and predictions will appear here.
        </p>
      </section>
    );
  }
  const { cycleDay, phase, ongoingPeriod, nextPeriod, daysUntilNextPeriod, upcomingFertility, cycleLength, periodLength, basedOnCycles } =
    prediction;
  const isFertileNow =
    upcomingFertility && today >= upcomingFertility.fertileStart && today <= upcomingFertility.fertileEnd;
  const hasWindowSpread = nextPeriod.earliest !== nextPeriod.latest;

  return (
    <section className="summary">
      <div className="stat">
        <span className="label">Cycle day</span>
        <span className="value">{cycleDay}</span>
        <span className="detail">
          <span className="phase">
            {phase.name} phase{describeDaysRemaining(phase, today)}
          </span>
          {ongoingPeriod &&
            (ongoingPeriod.end >= today
              ? `Period expected to end ${formatShort(ongoingPeriod.end)}`
              : `Period running longer than your usual ${periodLength} days`)}
        </span>
      </div>
      <div className="stat period">
        <span className="label">Next period</span>
        <span className="value">{describeDaysUntil(daysUntilNextPeriod)}</span>
        <span className="detail">
          {formatShort(nextPeriod.start)} to {formatShort(nextPeriod.end)}
          {hasWindowSpread && (
            <>
              <br />
              could start {formatShort(nextPeriod.earliest)} to {formatShort(nextPeriod.latest)}
            </>
          )}
        </span>
      </div>
      {upcomingFertility && (
        <div className="stat fertile">
          <span className="label">{isFertileNow ? 'Fertile window now' : 'Fertile window'}</span>
          <span className="value">
            {formatShort(upcomingFertility.fertileStart)} to {formatShort(upcomingFertility.fertileEnd)}
          </span>
          <span className="detail">
            Ovulation around {formatShort(upcomingFertility.ovulationEarliest)}
            {upcomingFertility.ovulationLatest !== upcomingFertility.ovulationEarliest &&
              ` to ${formatShort(upcomingFertility.ovulationLatest)}`}
            {upcomingFertility.surgeStart && ', from your positive test'}
            {upcomingFertility.hasSeveralSurges && (
              <>
                <br />
                positive tests on separate days, so this is a calendar estimate
              </>
            )}
          </span>
        </div>
      )}
      <div className="stat">
        <span className="label">Averages</span>
        <span className="value">{cycleLength}-day cycle</span>
        <span className="detail">
          {periodLength}-day period
          <br />
          {basedOnCycles > 0 ? `from your last ${basedOnCycles} cycle${basedOnCycles > 1 ? 's' : ''}` : 'default until you log a second period'}
        </span>
      </div>
    </section>
  );
}
