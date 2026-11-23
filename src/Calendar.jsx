import { useState } from 'react';
import { classifyDay } from './cycle.js';
import { CrampMark, FlowMark, NoteMark, PainkillerMark, SexMark } from './DayMarks.jsx';
import { formatMonth, isoForYearMonthDay, weekdayMondayFirst } from './dates.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar({ logs, prediction, today, selectedDate, onSelect }) {
  const [shownMonth, setShownMonth] = useState(() => {
    const [year, month] = today.split('-').map(Number);
    return { year, monthIndex: month - 1 };
  });
  const { year, monthIndex } = shownMonth;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingBlanks = weekdayMondayFirst(isoForYearMonthDay(year, monthIndex, 1));
  const dates = Array.from({ length: daysInMonth }, (_, i) => isoForYearMonthDay(year, monthIndex, i + 1));

  function shiftMonth(delta) {
    const shifted = new Date(Date.UTC(year, monthIndex + delta, 1));
    setShownMonth({ year: shifted.getUTCFullYear(), monthIndex: shifted.getUTCMonth() });
  }

  return (
    <section className="calendar">
      <div className="calendar-nav">
        <button onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
        <h2>{formatMonth(year, monthIndex)}</h2>
        <button onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
      </div>
      <div className="grid">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="weekday">{weekday}</div>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {dates.map((date) => {
          const dayLog = logs[date];
          const day = classifyDay(date, prediction);
          const hasFlow = dayLog?.flow && dayLog.flow !== 'none';
          const classes = [
            'day',
            day.isPeriod && 'is-period',
            !day.isPeriod && day.isPredictedPeriod && 'is-predicted',
            !day.isPeriod && day.isFertile && 'is-fertile',
            day.isOvulation && 'is-ovulation',
            day.isImplantation && 'is-implantation',
            hasFlow && `flow-${dayLog.flow}`,
            date === today && 'is-today',
            date === selectedDate && 'is-selected',
          ].filter(Boolean);
          return (
            <button key={date} className={classes.join(' ')} onClick={() => onSelect(date)}>
              <span className="number">{Number(date.slice(8))}</span>
              <span className="marks">
                {dayLog?.cramps > 0 && <CrampMark cramps={dayLog.cramps} />}
                {(dayLog?.symptoms?.length > 0 || dayLog?.notes) && <NoteMark />}
                {dayLog?.painkillers?.length > 0 && <PainkillerMark />}
                {dayLog?.unprotectedSex && <SexMark />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="swatch is-period" /> Period</span>
        <span><FlowMark flow="spotting" /> Spotting</span>
        <span><i className="swatch is-predicted" /> Predicted period</span>
        <span><i className="swatch is-fertile" /> Fertile window</span>
        <span><i className="swatch is-ovulation" /> Ovulation</span>
        <span><i className="swatch is-implantation" /> Possible implantation</span>
        <span><SexMark /> Unprotected sex</span>
      </div>
    </section>
  );
}
