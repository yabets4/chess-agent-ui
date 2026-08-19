// Standard algebraic notation (SAN) for moves.

import { pieceMoves } from './moves.js';
import { allLegalMoves, isInCheck } from './rules.js';
import { cloneGameState, toAlgebraic, opposite } from './board.js';

const PIECE_LETTER = { n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

// Build SAN for a move that has just been applied.
// `stateBefore` is the position before the move; `move` has the move info (piece type, from/to, etc.)
// `stateAfter` is the position after the move; used to detect check / mate suffix.
export function toSAN(stateBefore, move, stateAfter) {
  if (move.isCastle === 'K') {
    const suffix = mateSuffix(stateAfter);
    return 'O-O' + suffix;
  }
  if (move.isCastle === 'Q') {
    const suffix = mateSuffix(stateAfter);
    return 'O-O-O' + suffix;
  }

  const piece = move.piece;
  const isPawn = piece === 'p';
  let s = '';

  if (!isPawn) s += PIECE_LETTER[piece];

  // Disambiguation: find other pieces of same type & color that could move to the same square.
  if (!isPawn) {
    const others = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === move.from.row && c === move.from.col) continue;
        const p = stateBefore.board[r][c];
        if (!p || p.color !== move.color || p.type !== piece) continue;
        // Could this piece move to move.to in the BEFORE state?
        // We approximate by checking pseudo-legal moves of that piece.
        // (Legal-filter isn't needed for disambiguation because two pieces
        // both able to capture the same square is a rare ambiguous case.)
        const test = cloneGameState(stateBefore);
        test.turn = move.color;
        const ms = pieceMoves(test, { row: r, col: c });
        if (ms.some((m) => m.to.row === move.to.row && m.to.col === move.to.col && !m.isCastle)) {
          others.push({ row: r, col: c });
        }
      }
    }
    if (others.length > 0) {
      const sameFile = others.some((o) => o.col === move.from.col);
      const sameRank = others.some((o) => o.row === move.from.row);
      if (!sameFile) s += 'abcdefgh'[move.from.col];
      else if (!sameRank) s += (8 - move.from.row).toString();
      else s += 'abcdefgh'[move.from.col] + (8 - move.from.row).toString();
    }
  }

  // Capture marker
  if (move.isCapture) {
    if (isPawn) s += 'abcdefgh'[move.from.col];
    s += 'x';
  }

  s += toAlgebraic(move.to);

  // Promotion
  if (move.promotion) s += '=' + PIECE_LETTER[move.promotion];

  // Check / mate suffix
  s += mateSuffix(stateAfter);

  return s;
}

function mateSuffix(state) {
  const moves = allLegalMoves(state, state.turn);
  if (moves.length === 0) {
    if (isInCheck(state, state.turn)) return '#';
    return '';
  }
  if (isInCheck(state, state.turn)) return '+';
  return '';
}
