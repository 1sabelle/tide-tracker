// The small indicators a calendar day shows for what was logged. The day editor shows the same ones as its legend.

// Flow colours the whole calendar day rather than adding a mark, so this is a small swatch of that day colour.
export function FlowMark({ flow }) {
  return <span className={`flow-swatch flow-${flow}`} />;
}

export function CrampMark({ cramps }) {
  return <span className="cramp-mark">{'•'.repeat(cramps)}</span>;
}

// Shared by symptoms and notes: either one being logged shows it.
export function NoteMark() {
  return <span className="note-mark" />;
}

export function PainkillerMark() {
  return <span className="painkiller-mark" aria-label="painkillers" />;
}

export function SexMark() {
  return <span className="sex-mark" aria-label="unprotected sex">♥</span>;
}
