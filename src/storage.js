import { CRAMP_LEVELS, DEFAULT_SETTINGS, FLOW_LEVELS, MOODS, SYMPTOMS } from './cycle.js';
import { isIsoDate } from './dates.js';

const STORAGE_KEY = 'mtracker.v1';
const CORRUPT_BACKUP_KEY = 'mtracker.v1.corrupt';

export const EMPTY_DATA = { logs: {}, settings: DEFAULT_SETTINGS };

// Moods saved under an earlier name, mapped to their current name so those days still load.
const RENAMED_MOODS = { sad: 'low' };

export function loadData() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_DATA;
  }
  if (!raw) return EMPTY_DATA;
  try {
    return parseData(JSON.parse(raw)).data;
  } catch {
    // Keep the unreadable data aside instead of overwriting it on the next save.
    try {
      localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      /* nothing more we can do */
    }
    return EMPTY_DATA;
  }
}

// Asks the browser not to clear this site's storage on its own (for example when disk space runs low).
// The browser decides; a refusal or an unsupported browser just leaves storage as it was.
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// Validates every entry and reports all problems at once; invalid entries are skipped.
export function parseData(json) {
  const errors = [];
  if (typeof json !== 'object' || json === null || typeof json.logs !== 'object' || json.logs === null) {
    throw new Error('Expected an object with a "logs" field.');
  }
  const logs = {};
  for (const [date, savedDayLog] of Object.entries(json.logs)) {
    const dayLog = withCurrentMoodName(savedDayLog);
    const dayErrors = collectDayLogErrors(date, dayLog);
    if (dayErrors.length > 0) errors.push(...dayErrors);
    else logs[date] = normalizeDayLog(dayLog);
  }
  const settings = { ...DEFAULT_SETTINGS };
  for (const [name, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    const value = json.settings?.[name];
    if (value === undefined) continue;
    if (Number.isInteger(value) && value > 0 && value <= 90) settings[name] = value;
    else errors.push(`settings.${name}: "${value}" is not a whole number between 1 and 90; kept ${defaultValue}.`);
  }
  return { data: { logs, settings }, errors };
}

function withCurrentMoodName(dayLog) {
  const currentMood = RENAMED_MOODS[dayLog?.mood];
  return currentMood ? { ...dayLog, mood: currentMood } : dayLog;
}

function collectDayLogErrors(date, dayLog) {
  const errors = [];
  if (!isIsoDate(date)) errors.push(`${date}: "${date}" is not a date in YYYY-MM-DD format.`);
  if (typeof dayLog !== 'object' || dayLog === null) {
    errors.push(`${date}: expected an object, got "${JSON.stringify(dayLog)}".`);
    return errors;
  }
  if (dayLog.flow !== undefined && !FLOW_LEVELS.includes(dayLog.flow))
    errors.push(`${date}: flow "${dayLog.flow}" is not one of ${FLOW_LEVELS.join(', ')}.`);
  if (dayLog.cramps !== undefined && !(Number.isInteger(dayLog.cramps) && dayLog.cramps >= 0 && dayLog.cramps < CRAMP_LEVELS.length))
    errors.push(`${date}: cramps "${dayLog.cramps}" is not a number from 0 to ${CRAMP_LEVELS.length - 1}.`);
  if (dayLog.symptoms !== undefined) {
    if (!Array.isArray(dayLog.symptoms)) errors.push(`${date}: symptoms "${dayLog.symptoms}" is not a list.`);
    else
      for (const symptom of dayLog.symptoms)
        if (!SYMPTOMS.includes(symptom)) errors.push(`${date}: symptom "${symptom}" is not one of ${SYMPTOMS.join(', ')}.`);
  }
  if (dayLog.mood !== undefined && dayLog.mood !== null && !MOODS.includes(dayLog.mood))
    errors.push(`${date}: mood "${dayLog.mood}" is not one of ${MOODS.join(', ')}.`);
  if (dayLog.unprotectedSex !== undefined && typeof dayLog.unprotectedSex !== 'boolean')
    errors.push(`${date}: unprotectedSex "${dayLog.unprotectedSex}" is not true or false.`);
  if (dayLog.notes !== undefined && typeof dayLog.notes !== 'string')
    errors.push(`${date}: notes "${dayLog.notes}" is not text.`);
  return errors;
}

function normalizeDayLog(dayLog) {
  return {
    flow: dayLog.flow ?? 'none',
    cramps: dayLog.cramps ?? 0,
    symptoms: dayLog.symptoms ?? [],
    mood: dayLog.mood ?? null,
    notes: dayLog.notes ?? '',
    unprotectedSex: dayLog.unprotectedSex ?? false,
  };
}
