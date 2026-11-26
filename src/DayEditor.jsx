import { useState } from 'react';
import { CRAMP_LEVELS, EMPTY_DAY_LOG, FLOW_LEVELS, LIBIDO_LEVELS, MOODS, OVULATION_TEST_RESULTS, PAINKILLERS, SYMPTOMS } from './cycle.js';
import { formatLong } from './dates.js';
import { CrampMark, FlowMark, NoteMark, PainkillerMark, PositiveOvulationTestMark, SexMark } from './DayMarks.jsx';

// Judged by the heaviest stretch of the day, from how fast a regular pad or tampon fills.
const FLOW_GUIDE = {
  spotting: 'A few drops or brownish discharge, seen when wiping or on a liner. No pad or tampon needed.',
  light: 'A regular pad or tampon is less than half full after 4 or more hours.',
  medium: 'A regular pad or tampon is fairly full after about 3 to 4 hours.',
  heavy: 'A regular pad or tampon fills in about 2 hours or less, you need super size or double up, or you leak.',
};

export default function DayEditor({ date, dayLog = EMPTY_DAY_LOG, onChange }) {
  const log = { ...EMPTY_DAY_LOG, ...dayLog };
  const [isFlowGuideShown, setIsFlowGuideShown] = useState(false);
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
        <legend>
          Flow
          <button
            className="guide-toggle"
            aria-expanded={isFlowGuideShown}
            aria-label="How to judge flow"
            onClick={() => setIsFlowGuideShown(!isFlowGuideShown)}
          >
            ?
          </button>
        </legend>
        <div className="chips">
          {FLOW_LEVELS.map((flow) => (
            <button key={flow} className={`chip ${log.flow === flow ? 'on' : ''}`} onClick={() => update({ flow })}>
              {flow !== 'none' && <FlowMark flow={flow} />}
              {flow}
            </button>
          ))}
        </div>
        {isFlowGuideShown && (
          <div className="flow-guide">
            <dl>
              {Object.entries(FLOW_GUIDE).map(([flow, description]) => (
                <div key={flow}>
                  <dt>
                    <FlowMark flow={flow} /> {flow}
                  </dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
            <p>Log the heaviest part of the day. Soaking through every hour for several hours is worth raising with a doctor.</p>
          </div>
        )}
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
        <legend>Ovulation test</legend>
        <div className="chips">
          {OVULATION_TEST_RESULTS.map((result) => (
            <button
              key={result}
              className={`chip ${log.ovulationTest === result ? 'on' : ''}`}
              aria-pressed={log.ovulationTest === result}
              onClick={() => update({ ovulationTest: log.ovulationTest === result ? null : result })}
            >
              {result === 'positive' && <PositiveOvulationTestMark />}
              {result}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Sex and libido</legend>
        <div className="chips">
          {LIBIDO_LEVELS.map((libido) => (
            <button
              key={libido}
              className={`chip ${log.libido === libido ? 'on' : ''}`}
              aria-pressed={log.libido === libido}
              onClick={() => update({ libido: log.libido === libido ? null : libido })}
            >
              {libido} libido
            </button>
          ))}
          <button
            className={`chip ${log.unprotectedSex ? 'on' : ''}`}
            aria-pressed={log.unprotectedSex}
            onClick={() => update({ unprotectedSex: !log.unprotectedSex })}
          >
            <SexMark /> unprotected sex
          </button>
        </div>
      </fieldset>
    </section>
  );
}
