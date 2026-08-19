import { useMemo } from 'react';
import { Square } from './Square.jsx';

function findKingSquareForColor(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p && p.type === 'k' && p.color === color) return { row: r, col: c };
  }
  return null;
}

export function Board({ state, selected, legalForSelected, onSquareClick, status }) {
  const lastMove = state.history[state.history.length - 1];
  const lastSquares = lastMove ? [lastMove.from, lastMove.to] : [];
  const inCheck = status.inCheck;
  const kingSquare = inCheck ? findKingSquareForColor(state.board, state.turn) : null;

  const cells = useMemo(() => {
    const out = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const piece = state.board[r][c];
        const isSelected = selected && selected.row === r && selected.col === c;
        const move = legalForSelected.find((m) => m.to.row === r && m.to.col === c);
        const isLegal = !!move;
        const isCaptureTarget = !!(move && move.isCapture);
        const isLastMove = lastSquares.some((s) => s.row === r && s.col === c);
        const inCheckHere = kingSquare && kingSquare.row === r && kingSquare.col === c;
        out.push(
          <Square
            key={`${r}-${c}`}
            row={r}
            col={c}
            piece={piece}
            isLight={isLight}
            isSelected={isSelected}
            isLegal={isLegal}
            isCaptureTarget={isCaptureTarget}
            isLastMove={isLastMove}
            inCheck={inCheckHere}
            onClick={() => onSquareClick(r, c)}
          />,
        );
      }
    }
    return out;
  }, [state, selected, legalForSelected, lastSquares, kingSquare]);

  return (
    <div className="grid grid-cols-8 w-full max-w-[640px] aspect-square border-4 border-slate-700 rounded-md overflow-hidden shadow-2xl">
      {cells}
    </div>
  );
}
