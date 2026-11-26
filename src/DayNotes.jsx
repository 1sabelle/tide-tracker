import { EMPTY_DAY_LOG } from './cycle.js';
import { formatShort } from './dates.js';
import { NoteMark } from './DayMarks.jsx';

// The selected day's free-text notes. Kept apart from the day editor so it can sit under the calendar.
export default function DayNotes({ date, dayLog = EMPTY_DAY_LOG, onChange }) {
  const log = { ...EMPTY_DAY_LOG, ...dayLog };
  return (
    <section className="day-notes">
      <label htmlFor="day-notes-text">
        Notes for {formatShort(date)} <NoteMark />
      </label>
      <textarea id="day-notes-text" rows={3} value={log.notes} onChange={(e) => onChange({ ...log, notes: e.target.value })} />
    </section>
  );
}
