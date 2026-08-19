// Legal-move filtering and game-end detection.

import { cloneGameState, opposite } from './board.js';
import { allPseudoLegalMoves, pieceMoves, squareAttacked } from './moves.js';
import { toSAN } from './notation.js';

// Find the king of `color` on the board.
function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) return { row: r, col: c };
    }
  }
  return null;
}

// Is `color`'s king currently in check?
export function isInCheck(state, color = state.turn) {
  const k = findKing(state.board, color);
  if (!k) return false; // shouldn't happen in a legal game
  return squareAttacked(state, k, opposite(color));
}

// Make a move on a cloned state and return the cloned state.
function applyMoveToClone(state, move) {
  const next = cloneGameState(state);
  const piece = next.board[move.from.row][move.from.col];
  const target = next.board[move.to.row][move.to.col];

  // Move piece
  next.board[move.to.row][move.to.col] = piece;
  next.board[move.from.row][move.from.col] = null;

  // En passant: remove the captured pawn
  if (move.isEnPassant) {
    const captureRow = move.from.row;
    next.board[captureRow][move.to.col] = null;
  }

  // Promotion
  if (move.promotion) {
    next.board[move.to.row][move.to.col] = { type: move.promotion, color: piece.color };
  }

  // Castling: also move the rook
  if (move.isCastle) {
    const backRank = move.to.row;
    if (move.isCastle === 'K') {
      next.board[backRank][5] = next.board[backRank][7];
      next.board[backRank][7] = null;
    } else {
      next.board[backRank][3] = next.board[backRank][0];
      next.board[backRank][0] = null;
    }
  }

  // Castling rights: revoke for any king or rook move from their starting square
  if (piece.type === 'k') {
    next.castling[piece.color].K = false;
    next.castling[piece.color].Q = false;
  }
  if (piece.type === 'r') {
    const startRow = piece.color === 'w' ? 7 : 0;
    if (move.from.row === startRow && move.from.col === 0) next.castling[piece.color].Q = false;
    if (move.from.row === startRow && move.from.col === 7) next.castling[piece.color].K = false;
  }
  // If a rook is captured on its starting square, the opponent loses that right.
  if (target && target.type === 'r') {
    const startRow = target.color === 'w' ? 7 : 0;
    if (move.to.row === startRow && move.to.col === 0) next.castling[target.color].Q = false;
    if (move.to.row === startRow && move.to.col === 7) next.castling[target.color].K = false;
  }

  // Set / clear en passant target
  if (move.isDoublePush) {
    next.enPassantTarget = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
  } else {
    next.enPassantTarget = null;
  }

  // Halfmove clock
  if (piece.type === 'p' || move.isCapture) {
    next.halfmoveClock = 0;
  } else {
    next.halfmoveClock += 1;
  }
  if (state.turn === 'b') next.fullmoveNumber += 1;

  // Switch turn
  next.turn = opposite(state.turn);

  return next;
}

// Public: apply a move and return a new state. Returns null if the move is illegal.
export function applyMove(state, move) {
  // Disallow moving opponent's piece
  const piece = state.board[move.from.row][move.from.col];
  if (!piece || piece.color !== state.turn) return null;

  const pseudo = pieceMoves(state, move.from);
  const matched = pseudo.find((m) => m.to.row === move.to.row && m.to.col === move.to.col);
  if (!matched) return null;

  // For castling, also verify the king doesn't pass through check
  if (matched.isCastle) {
    const backRank = matched.to.row;
    const through = matched.isCastle === 'K' ? [{ row: backRank, col: 4 }, { row: backRank, col: 5 }, { row: backRank, col: 6 }]
                                       : [{ row: backRank, col: 4 }, { row: backRank, col: 3 }, { row: backRank, col: 2 }];
    for (const sq of through) {
      // Check if the king would be on `sq` and attacked
      const enemy = opposite(state.turn);
      // Build a tiny test: place the king on sq, scan for attacks.
      const test = cloneGameState(state);
      test.board[move.from.row][move.from.col] = null;
      test.board[sq.row][sq.col] = piece;
      if (squareAttacked(test, sq, enemy)) return null;
    }
  }

  // The move's own legality: must not leave own king in check
  const test = applyMoveToClone(state, matched);
  if (isInCheck(test, state.turn)) return null;

  // Annotate for history
  const finalMove = {
    ...matched,
    piece: piece.type,
    color: piece.color,
    captured: matched.isEnPassant
      ? { type: 'p', color: opposite(piece.color) }
      : (state.board[matched.to.row][matched.to.col]
          ? { ...state.board[matched.to.row][matched.to.col] }
          : null),
    san: null, // filled in by notation.js after applying
    fen: null,
  };

  // For SAN, we need the resulting state to check for check/mate.
  finalMove.san = toSAN(state, finalMove, test);
  return { state: test, move: finalMove };
}

// Legal moves for the piece at `from` in the current state.
export function legalMovesFrom(state, from) {
  const piece = state.board[from.row][from.col];
  if (!piece || piece.color !== state.turn) return [];
  const pseudo = pieceMoves(state, from);
  const legal = [];
  for (const m of pseudo) {
    // Quick filter: skip castling through check
    if (m.isCastle) {
      const backRank = m.to.row;
      const enemy = opposite(state.turn);
      const through = m.isCastle === 'K'
        ? [{ row: backRank, col: 5 }, { row: backRank, col: 6 }]
        : [{ row: backRank, col: 3 }, { row: backRank, col: 2 }];
      let blocked = false;
      for (const sq of through) {
        const test = cloneGameState(state);
        test.board[from.row][from.col] = null;
        test.board[sq.row][sq.col] = piece;
        if (squareAttacked(test, sq, enemy)) { blocked = true; break; }
      }
      if (blocked) continue;
    }
    const test = applyMoveToClone(state, m);
    if (!isInCheck(test, state.turn)) legal.push(m);
  }
  return legal;
}

// All legal moves for the side to move.
export function allLegalMoves(state, color = state.turn) {
  const out = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color === color) {
        for (const m of legalMovesFrom({ ...state, turn: color }, { row: r, col: c })) {
          out.push(m);
        }
      }
    }
  }
  return out;
}

// Game-end status from a position.
export function gameStatus(state) {
  const moves = allLegalMoves(state, state.turn);
  const inCheck = isInCheck(state, state.turn);
  if (moves.length === 0) {
    if (inCheck) return { over: true, result: 'checkmate', winner: opposite(state.turn) };
    return { over: true, result: 'stalemate', winner: null };
  }
  // Insufficient material (very basic)
  if (insufficientMaterial(state)) return { over: true, result: 'insufficient', winner: null };
  // 50-move rule
  if (state.halfmoveClock >= 100) return { over: true, result: 'fifty-move', winner: null };
  return { over: false, result: null, inCheck };
}

function insufficientMaterial(state) {
  const pieces = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = state.board[r][c];
    if (p) pieces.push(p);
  }
  if (pieces.length === 2) return true; // K vs K
  if (pieces.length === 3) {
    const np = pieces.find((p) => p.type !== 'k');
    if (np && (np.type === 'b' || np.type === 'n')) return true;
  }
  return false;
}
