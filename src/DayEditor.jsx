import { CRAMP_LEVELS, EMPTY_DAY_LOG, FLOW_LEVELS, MOODS, PAINKILLERS, SYMPTOMS } from './cycle.js';
import { formatLong } from './dates.js';
import { CrampMark, FlowMark, NoteMark, PainkillerMark, SexMark } from './DayMarks.jsx';

export default function DayEditor({ date, dayLog = EMPTY_DAY_LOG, onChange }) {
  const log = { ...EMPTY_DAY_LOG, ...dayLog };
  const update = (changes) => onChange({ ...log, ...changes });

  function toggleSymptom(symptom) {
    const symptoms = log.symptoms.includes(symptom)
      ? log.symptoms.filter((s) => s !== symptom)
      : [...log.symptoms, symptom];
    update({ symptoms });
  }

  function togglePainkiller(painkiller) {
    const painkillers = log.painkillers.includes(painkiller)
      ? log.painkillers.filter((p) => p !== painkiller)
      : [...log.painkillers, painkiller];
    update({ painkillers });
  }

  return (
    <section className="editor">
      <h2>{formatLong(date)}</h2>

      <fieldset>
        <legend>Flow</legend>
        <div className="chips">
          {FLOW_LEVELS.map((flow) => (
            <button key={flow} className={`chip ${log.flow === flow ? 'on' : ''}`} onClick={() => update({ flow })}>
              {flow !== 'none' && <FlowMark flow={flow} />}
              {flow}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Cramps</legend>
        <div className="chips">
          {CRAMP_LEVELS.map((label, cramps) => (
            <button key={label} className={`chip ${log.cramps === cramps ? 'on' : ''}`} onClick={() => update({ cramps })}>
              {cramps > 0 && <CrampMark cramps={cramps} />}
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Symptoms <NoteMark /></legend>
        <div className="chips">
          {SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              className={`chip ${log.symptoms.includes(symptom) ? 'on' : ''}`}
              onClick={() => toggleSymptom(symptom)}
            >
              {symptom}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Painkillers <PainkillerMark /></legend>
        <div className="chips">
          {PAINKILLERS.map((painkiller) => (
            <button
              key={painkiller}
              className={`chip ${log.painkillers.includes(painkiller) ? 'on' : ''}`}
              onClick={() => togglePainkiller(painkiller)}
            >
              {painkiller}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Mood</legend>
        <div className="chips">
          {MOODS.map((mood) => (
            <button
              key={mood}
              className={`chip ${log.mood === mood ? 'on' : ''}`}
              onClick={() => update({ mood: log.mood === mood ? null : mood })}
            >
              {mood}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Sex</legend>
        <div className="chips">
          <button
            className={`chip ${log.unprotectedSex ? 'on' : ''}`}
            aria-pressed={log.unprotectedSex}
            onClick={() => update({ unprotectedSex: !log.unprotectedSex })}
          >
            <SexMark /> unprotected sex
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Notes <NoteMark /></legend>
        <textarea rows={3} value={log.notes} onChange={(e) => update({ notes: e.target.value })} />
      </fieldset>
    </section>
  );
}
