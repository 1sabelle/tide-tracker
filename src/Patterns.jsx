import { useState } from 'react';
import { measurePatterns } from './patterns.js';

const MIN_CYCLES_FOR_PATTERNS = 2;
// The faintest shade a cell logged at least once gets, so a single occurrence is still visible.
const MIN_SHADE_PERCENT = 18;

function shadeFor({ loggedIn, outOf }) {
  if (loggedIn === 0) return undefined;
  const percent = MIN_SHADE_PERCENT + (100 - MIN_SHADE_PERCENT) * (loggedIn / outOf);
  return { background: `color-mix(in srgb, var(--accent) ${percent}%, transparent)` };
}

function describeCell(label, day) {
  return `${label} · cycle day ${day.cycleDay} · ${day.loggedIn} of ${day.outOf} cycle${day.outOf === 1 ? '' : 's'}`;
}

export default function Patterns({ logs, prediction, today }) {
  const [hovered, setHovered] = useState(null);
  const { cycleCount, cycleDays, rows } = measurePatterns(logs, prediction, today);
  const hasEnoughCycles = cycleCount >= MIN_CYCLES_FOR_PATTERNS;
  const groups = [...new Set(rows.map((row) => row.group))];

  return (
    <details className="patterns collapsible" open>
      <summary>Patterns</summary>
      {!hasEnoughCycles ? (
        <p className="empty">Patterns appear once you have logged at least two cycles.</p>
      ) : rows.length === 0 ? (
        <p className="empty">Log symptoms, cramps, painkillers, mood, libido or ovulation tests and patterns across your cycles will show here.</p>
      ) : (
        <>
          <p className="subheading">How often each thing was logged on each day of your cycle, across {cycleCount} cycles</p>
          <p className="readout">{hovered ? describeCell(hovered.label, hovered.day) : ' '}</p>
          <div className="pattern-grid" style={{ gridTemplateColumns: `max-content repeat(${cycleDays.length}, minmax(5px, 1fr))` }}>
            {groups.map((group) => (
              <PatternGroup key={group} group={group} rows={rows.filter((row) => row.group === group)} onHover={setHovered} />
            ))}
            <span />
            {cycleDays.map((cycleDay) => (
              <span key={cycleDay} className="pattern-tick">
                {cycleDay === 1 || cycleDay % 7 === 0 ? cycleDay : ''}
              </span>
            ))}
          </div>
          <div className="pattern-scale">
            <span>Day of cycle</span>
            <span className="pattern-scale-key">
              Rarely <i className="pattern-scale-ramp" /> Every cycle
            </span>
          </div>
        </>
      )}
    </details>
  );
}

function PatternGroup({ group, rows, onHover }) {
  return (
    <>
      <span className="pattern-group">{group}</span>
      {rows.map((row) => (
        <PatternRow key={row.label} row={row} onHover={onHover} />
      ))}
    </>
  );
}

function PatternRow({ row, onHover }) {
  return (
    <>
      <span className="pattern-label">{row.label}</span>
      {row.days.map((day) => (
        <span
          key={day.cycleDay}
          className="pattern-cell"
          style={shadeFor(day)}
          role="img"
          aria-label={describeCell(row.label, day)}
          onMouseEnter={() => onHover({ label: row.label, day })}
          onMouseLeave={() => onHover(null)}
        />
      ))}
    </>
  );
}
