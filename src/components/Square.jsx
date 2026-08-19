import { Piece } from './Piece.jsx';

const FILES = 'abcdefgh';

export function Square({ row, col, piece, isLight, isSelected, isLegal, isCaptureTarget, isLastMove, inCheck, onClick }) {
  // Background
  let bg = isLight ? 'bg-amber-100' : 'bg-amber-700';
  if (isSelected) bg = isLight ? 'bg-yellow-200' : 'bg-yellow-600';
  if (isLastMove && !isSelected) bg = isLight ? 'bg-amber-200' : 'bg-amber-600';

  // Check ring on the king
  const ring = inCheck ? 'ring-4 ring-inset ring-red-500' : '';

  // File / rank labels on the outer rim
  const fileLabel = col === 0 ? (8 - row).toString() : null;
  const rankLabel = row === 7 ? FILES[col] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-square ${bg} ${ring} flex items-center justify-center transition-colors`}
    >
      {fileLabel && (
        <span className={`absolute top-0.5 left-1 text-[0.65rem] font-semibold ${isLight ? 'text-amber-800' : 'text-amber-100'}`}>
          {fileLabel}
        </span>
      )}
      {rankLabel && (
        <span className={`absolute bottom-0.5 right-1 text-[0.65rem] font-semibold ${isLight ? 'text-amber-800' : 'text-amber-100'}`}>
          {rankLabel}
        </span>
      )}

      {piece && <Piece piece={piece} />}

      {isLegal && !isCaptureTarget && (
        <span className="absolute w-1/4 h-1/4 rounded-full bg-slate-900/30 pointer-events-none" />
      )}
      {isLegal && isCaptureTarget && (
        <span className="absolute inset-1 rounded-full ring-4 ring-slate-900/40 pointer-events-none" />
      )}
    </button>
  );
}
