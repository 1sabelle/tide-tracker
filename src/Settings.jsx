import { useState } from 'react';
import { todayIso } from './dates.js';
import { parseData } from './storage.js';

const SETTING_LABELS = {
  cycleLength: 'Default cycle length',
  periodLength: 'Default period length',
  lutealLength: 'Days from ovulation to next period',
};

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Whether the app is using each setting right now, or a value measured from the logged periods instead.
function describeSettingUse(prediction) {
  const basedOnCycles = prediction?.basedOnCycles ?? 0;
  const basedOnPeriods = prediction?.basedOnPeriods ?? 0;
  return {
    cycleLength:
      basedOnCycles > 0
        ? { isOverridden: true, text: `Not used: your logs give ${plural(prediction.cycleLength, 'day')}, averaged over ${plural(basedOnCycles, 'cycle')}.` }
        : { isOverridden: false, text: 'In use until a full cycle is logged (two period starts).' },
    periodLength:
      basedOnPeriods > 0
        ? { isOverridden: true, text: `Not used: your logs give ${plural(prediction.periodLength, 'day')}, averaged over ${plural(basedOnPeriods, 'period')}.` }
        : { isOverridden: false, text: 'In use until a finished period is logged.' },
    lutealLength: { isOverridden: false, text: 'Always in use: ovulation cannot be measured from period dates.' },
  };
}

export default function Settings({ data, prediction, onReplace }) {
  const [importMessages, setImportMessages] = useState([]);
  const settingUse = describeSettingUse(prediction);

  function updateSetting(name, valueText) {
    const value = Number(valueText);
    if (!Number.isInteger(value) || value < 1 || value > 90) return;
    onReplace({ ...data, settings: { ...data.settings, [name]: value } });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cycle-tracker-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importData(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { data: imported, errors } = parseData(JSON.parse(await file.text()));
      const dayCount = Object.keys(imported.logs).length;
      if (!confirm(`Replace your current data with ${dayCount} logged days from "${file.name}"?`)) return;
      onReplace(imported);
      setImportMessages([`Imported ${dayCount} days.`, ...errors.map((error) => `Skipped ${error}`)]);
    } catch (error) {
      setImportMessages([`Could not read "${file.name}": ${error.message}`]);
    }
  }

  return (
    <details className="settings">
      <summary>Settings and data</summary>
      {Object.entries(SETTING_LABELS).map(([name, label]) => (
        <div key={name} className={`setting ${settingUse[name].isOverridden ? 'is-overridden' : ''}`}>
          <label>
            {label}
            <input
              type="number"
              min={1}
              max={90}
              value={data.settings[name]}
              onChange={(e) => updateSetting(name, e.target.value)}
            />
          </label>
          <p className="setting-use">{settingUse[name].text}</p>
        </div>
      ))}
      <p className="hint">Your data is stored only in this browser. Export it regularly as a backup.</p>
      <div className="data-actions">
        <button onClick={exportData}>Export JSON</button>
        <label className="button">
          Import JSON
          <input type="file" accept="application/json,.json" onChange={importData} hidden />
        </label>
      </div>
      {importMessages.length > 0 && (
        <ul className="import-messages">
          {importMessages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </details>
  );
}
