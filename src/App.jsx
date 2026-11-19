import { useEffect, useMemo, useState } from 'react';
import { isEmptyLog, logPastPeriod, predictCycles } from './cycle.js';
import { todayIso } from './dates.js';
import { loadData, saveData } from './storage.js';
import Summary from './Summary.jsx';
import Calendar from './Calendar.jsx';
import DayEditor from './DayEditor.jsx';
import History from './History.jsx';
import PregnancyChance from './PregnancyChance.jsx';
import Settings from './Settings.jsx';

export default function App() {
  const [data, setData] = useState(loadData);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [saveFailed, setSaveFailed] = useState(false);
  const today = todayIso();

  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  const prediction = useMemo(() => predictCycles(data.logs, data.settings, today), [data, today]);

  function updateDayLog(date, dayLog) {
    setData((current) => {
      const logs = { ...current.logs };
      if (isEmptyLog(dayLog)) delete logs[date];
      else logs[date] = dayLog;
      return { ...current, logs };
    });
  }

  function addPastPeriod(start, end, flow) {
    setData((current) => ({ ...current, logs: logPastPeriod(current.logs, start, end, flow) }));
  }

  return (
    <div className="app">
      <header>
        <h1>Tide</h1>
        {saveFailed && <p className="warning">Could not save to browser storage. Export your data to keep it.</p>}
      </header>
      <Summary prediction={prediction} today={today} />
      <main className="layout">
        <Calendar
          logs={data.logs}
          prediction={prediction}
          today={today}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
        <DayEditor
          key={selectedDate}
          date={selectedDate}
          dayLog={data.logs[selectedDate]}
          onChange={(dayLog) => updateDayLog(selectedDate, dayLog)}
        />
      </main>
      <PregnancyChance
        logs={data.logs}
        prediction={prediction}
        lutealLength={data.settings.lutealLength}
        today={today}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
      <History logs={data.logs} prediction={prediction} today={today} onAddPastPeriod={addPastPeriod} />
      <Settings data={data} onReplace={setData} />
      <footer>
        Predictions are calendar estimates (ovulation about {data.settings.lutealLength} days before the next
        period). They are not reliable for contraception.
      </footer>
    </div>
  );
}
