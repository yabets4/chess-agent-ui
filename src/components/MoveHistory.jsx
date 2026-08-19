// Renders the move list in two columns (white move / black move), one row per move number.

export function MoveHistory({ history }) {
  if (history.length === 0) {
    return <p className="text-slate-400 text-sm italic">No moves yet.</p>;
  }
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    const w = history[i];
    const b = history[i + 1];
    rows.push(
      <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 py-0.5 text-sm">
        <span className="text-slate-500 tabular-nums">{i / 2 + 1}.</span>
        <span className="text-slate-100 font-mono">{w.san}</span>
        <span className="text-slate-300 font-mono">{b ? b.san : ''}</span>
      </div>,
    );
  }
  return <div className="divide-y divide-slate-800">{rows}</div>;
}
