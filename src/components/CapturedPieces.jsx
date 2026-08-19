import { Piece } from './Piece.jsx';

// Material point values used for the captured-pieces tally.
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const ORDER = { p: 0, n: 1, b: 2, r: 3, q: 4 };

// Group captured pieces by color; sort by type for a tidy display.
function groupByColor(captures) {
  const w = captures.filter((p) => p.color === 'w').sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  const b = captures.filter((p) => p.color === 'b').sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  return { w, b };
}

function materialDelta(captures) {
  // If white has captured more value, white is up by that many points.
  let wPoints = 0;
  let bPoints = 0;
  for (const p of captures) {
    if (p.color === 'w') wPoints += VALUE[p.type];
    else bPoints += VALUE[p.type];
  }
  return wPoints - bPoints;
}

export function CapturedPieces({ captures }) {
  const { w, b } = groupByColor(captures);
  const delta = materialDelta(captures);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 min-h-[1.75rem]">
        {w.map((p, i) => (
          <Piece key={i} piece={p} />
        ))}
        {delta > 0 && (
          <span className="ml-2 text-xs text-slate-600 font-semibold">+{delta}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 min-h-[1.75rem]">
        {b.map((p, i) => (
          <Piece key={i} piece={p} />
        ))}
        {delta < 0 && (
          <span className="ml-2 text-xs text-slate-600 font-semibold">+{-delta}</span>
        )}
      </div>
    </div>
  );
}
