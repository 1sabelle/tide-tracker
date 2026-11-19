import { useState } from 'react';
import { daysBetween } from './dates.js';

const LONGEST_PERIOD_DAYS = 15;
const BLEEDING_FLOWS = ['light', 'medium', 'heavy'];

function findEntryProblem(start, end, today) {
  if (!start || !end) return 'Enter both a start and an end date.';
  if (end < start) return 'The end date must be on or after the start date.';
  if (end > today) return 'Past periods cannot end after today. Log an ongoing period day by day in the calendar.';
  if (daysBetween(start, end) + 1 > LONGEST_PERIOD_DAYS)
    return `That is ${daysBetween(start, end) + 1} days; a period entry can be at most ${LONGEST_PERIOD_DAYS} days.`;
  return null;
}

export default function PastPeriodForm({ today, onAdd }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState('medium');
  const [problem, setProblem] = useState(null);

  function submit(event) {
    event.preventDefault();
    const entryProblem = findEntryProblem(start, end, today);
    setProblem(entryProblem);
    if (entryProblem) return;
    onAdd(start, end, flow);
    setStart('');
    setEnd('');
  }

  return (
    <form className="past-period-form" onSubmit={submit}>
      <h3>Add a past period</h3>
      <div className="fields">
        <label>
          Started
          <input type="date" max={today} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          Ended
          <input type="date" min={start || undefined} max={today} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label>
          Typical flow
          <select value={flow} onChange={(e) => setFlow(e.target.value)}>
            {BLEEDING_FLOWS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <button type="submit">Add</button>
      </div>
      {problem && <p className="warning">{problem}</p>}
    </form>
  );
}
