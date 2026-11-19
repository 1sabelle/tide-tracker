// The small indicators a calendar day shows for what was logged. The day editor shows the same ones as its legend.

export function FlowMark({ flow }) {
  return <span className={`flow-dot flow-${flow}`} />;
}

export function CrampMark({ cramps }) {
  return <span className="cramp-mark">{'•'.repeat(cramps)}</span>;
}

// Shared by symptoms and notes: either one being logged shows it.
export function NoteMark() {
  return <span className="note-mark" />;
}

export function SexMark() {
  return <span className="sex-mark" aria-label="unprotected sex">♥</span>;
}
