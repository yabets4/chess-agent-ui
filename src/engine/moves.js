// Pseudo-legal move generation (does NOT filter moves that leave own king in check).
// Filter is applied in rules.js.

import { inBounds, opposite } from './board.js';

// Directions for sliding pieces.
const ORTHO = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
];
const DIAG = [
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];
const KING_OFFSETS = [...ORTHO, ...DIAG];

// Generate a move object.
const mv = (from, to, extra = {}) => ({ from, to, ...extra });

// Slide in a direction until blocked.
function slide(board, from, color, deltas) {
  const out = [];
  for (const [dr, dc] of deltas) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        out.push(mv(from, { row: r, col: c }));
      } else {
        if (target.color !== color) out.push(mv(from, { row: r, col: c }, { isCapture: true }));
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return out;
}

function pawnMoves(state, from, piece) {
  const { board } = state;
  const dir = piece.color === 'w' ? -1 : 1; // white moves up (toward row 0)
  const startRow = piece.color === 'w' ? 6 : 1;
  const promoRow = piece.color === 'w' ? 0 : 7;
  const out = [];

  // 1 forward
  const f1 = { row: from.row + dir, col: from.col };
  if (inBounds(f1.row, f1.col) && !board[f1.row][f1.col]) {
    if (f1.row === promoRow) {
      for (const promo of ['q', 'r', 'b', 'n']) out.push(mv(from, f1, { promotion: promo }));
    } else {
      out.push(mv(from, f1));
      // 2 forward from starting rank
      if (from.row === startRow) {
        const f2 = { row: from.row + 2 * dir, col: from.col };
        if (!board[f2.row][f2.col]) out.push(mv(from, f2, { isDoublePush: true }));
      }
    }
  }

  // diagonal captures + en passant
  for (const dc of [-1, 1]) {
    const t = { row: from.row + dir, col: from.col + dc };
    if (!inBounds(t.row, t.col)) continue;
    const target = board[t.row][t.col];
    if (target && target.color !== piece.color) {
      if (t.row === promoRow) {
        for (const promo of ['q', 'r', 'b', 'n']) out.push(mv(from, t, { promotion: promo, isCapture: true }));
      } else {
        out.push(mv(from, t, { isCapture: true }));
      }
    } else if (state.enPassantTarget && state.enPassantTarget.row === t.row && state.enPassantTarget.col === t.col) {
      out.push(mv(from, t, { isEnPassant: true, isCapture: true }));
    }
  }

  return out;
}

function knightMoves(board, from, piece) {
  const out = [];
  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of offsets) {
    const r = from.row + dr;
    const c = from.col + dc;
    if (!inBounds(r, c)) continue;
    const t = board[r][c];
    if (!t) out.push(mv(from, { row: r, col: c }));
    else if (t.color !== piece.color) out.push(mv(from, { row: r, col: c }, { isCapture: true }));
  }
  return out;
}

function bishopMoves(board, from, piece) {
  return slide(board, from, piece.color, DIAG);
}
function rookMoves(board, from, piece) {
  return slide(board, from, piece.color, ORTHO);
}
function queenMoves(board, from, piece) {
  return slide(board, from, piece.color, [...ORTHO, ...DIAG]);
}

function kingMoves(state, from, piece) {
  const { board } = state;
  const out = [];
  for (const [dr, dc] of KING_OFFSETS) {
    const r = from.row + dr;
    const c = from.col + dc;
    if (!inBounds(r, c)) continue;
    const t = board[r][c];
    if (!t) out.push(mv(from, { row: r, col: c }));
    else if (t.color !== piece.color) out.push(mv(from, { row: r, col: c }, { isCapture: true }));
  }

  // Castling: tested fully (incl. through-check) in rules.js — here we just add the
  // pseudo-legal move when squares are empty and rights are intact.
  const rights = state.castling[piece.color];
  const backRank = piece.color === 'w' ? 7 : 0;
  if (from.row === backRank && from.col === 4) {
    if (rights.K) {
      if (!board[backRank][5] && !board[backRank][6]) {
        out.push(mv(from, { row: backRank, col: 6 }, { isCastle: 'K' }));
      }
    }
    if (rights.Q) {
      if (!board[backRank][1] && !board[backRank][2] && !board[backRank][3]) {
        out.push(mv(from, { row: backRank, col: 2 }, { isCastle: 'Q' }));
      }
    }
  }
  return out;
}

// Public: pseudo-legal moves for a single piece at `from`.
export function pieceMoves(state, from) {
  const piece = state.board[from.row][from.col];
  if (!piece) return [];
  switch (piece.type) {
    case 'p': return pawnMoves(state, from, piece);
    case 'n': return knightMoves(state.board, from, piece);
    case 'b': return bishopMoves(state.board, from, piece);
    case 'r': return rookMoves(state.board, from, piece);
    case 'q': return queenMoves(state.board, from, piece);
    case 'k': return kingMoves(state, from, piece);
    default: return [];
  }
}

// All pseudo-legal moves for the side to move.
export function allPseudoLegalMoves(state, color = state.turn) {
  const out = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color === color) {
        for (const m of pieceMoves(state, { row: r, col: c })) out.push(m);
      }
    }
  }
  return out;
}

// Helpers for square-attack tests used by rules.js.
export function squareAttacked(state, sq, byColor) {
  // Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const r = sq.row + dr;
    const c = sq.col + dc;
    if (!inBounds(r, c)) continue;
    const p = state.board[r][c];
    if (p && p.color === byColor && p.type === 'n') return true;
  }
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1; // a white pawn attacks upward (dr negative)... let's be careful
  // A pawn of `byColor` attacks a square if that square is one step in its capture direction.
  // For white: attacks from below (row+1) diagonally. For black: attacks from above (row-1) diagonally.
  const pawnSources = byColor === 'w'
    ? [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }]   // white pawns live on higher row, attack lower rows
    : [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }]; // black pawns attack higher rows
  for (const { dr, dc } of pawnSources) {
    const r = sq.row + dr;
    const c = sq.col + dc;
    if (!inBounds(r, c)) continue;
    const p = state.board[r][c];
    if (p && p.color === byColor && p.type === 'p') return true;
  }
  // Sliding attacks
  const slides = [
    { type: 'r', deltas: ORTHO },
    { type: 'b', deltas: DIAG },
  ];
  for (const { type, deltas } of slides) {
    for (const [dr, dc] of deltas) {
      let r = sq.row + dr;
      let c = sq.col + dc;
      while (inBounds(r, c)) {
        const p = state.board[r][c];
        if (p) {
          if (p.color === byColor && (p.type === type || p.type === 'q')) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }
  // King adjacency
  for (const [dr, dc] of KING_OFFSETS) {
    const r = sq.row + dr;
    const c = sq.col + dc;
    if (!inBounds(r, c)) continue;
    const p = state.board[r][c];
    if (p && p.color === byColor && p.type === 'k') return true;
  }
  return false;
}
