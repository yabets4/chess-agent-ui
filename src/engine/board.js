// Board representation and helpers.
//
// Coordinates: { row, col } with row 0 = rank 8 (top of screen) and row 7 = rank 1.
// So initial position places black back rank at row 0, white back rank at row 7.
//
// Board is an 8x8 array; each cell is either null or { type, color }.

export const ROWS = 8;
export const COLS = 8;

export const initialBoard = () => {
  const emptyRow = () => Array.from({ length: 8 }, () => null);
  const back = (color) => [
    { type: 'r', color }, { type: 'n', color }, { type: 'b', color }, { type: 'q', color },
    { type: 'k', color }, { type: 'b', color }, { type: 'n', color }, { type: 'r', color },
  ];
  const pawns = (color) => Array.from({ length: 8 }, () => ({ type: 'p', color }));
  return [
    back('b'),
    pawns('b'),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    pawns('w'),
    back('w'),
  ];
};

export const initialGameState = () => ({
  board: initialBoard(),
  turn: 'w', // 'w' or 'b'
  // Castling rights. Each side has kingside (K) and queenside (Q) rights.
  castling: { w: { K: true, Q: true }, b: { K: true, Q: true } },
  // Square that is empty but a pawn just skipped over; only valid for one ply.
  enPassantTarget: null, // { row, col }
  // Halfmove clock (for 50-move rule) and fullmove number — tracked for completeness.
  halfmoveClock: 0,
  fullmoveNumber: 1,
  // History of moves (each entry has the move + captured piece for undo).
  history: [],
});

export const cloneBoard = (board) => board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

export const cloneGameState = (s) => ({
  board: cloneBoard(s.board),
  turn: s.turn,
  castling: {
    w: { K: s.castling.w.K, Q: s.castling.w.Q },
    b: { K: s.castling.b.K, Q: s.castling.b.Q },
  },
  enPassantTarget: s.enPassantTarget ? { ...s.enPassantTarget } : null,
  halfmoveClock: s.halfmoveClock,
  fullmoveNumber: s.fullmoveNumber,
  history: s.history.map((h) => ({ ...h })),
});

export const inBounds = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

export const opposite = (color) => (color === 'w' ? 'b' : 'w');

// Convert (row, col) to algebraic like "e4". Row 0 = rank 8.
export const toAlgebraic = ({ row, col }) => `${'abcdefgh'[col]}${8 - row}`;

// "e4" -> { row: 4, col: 4 }
export const fromAlgebraic = (sq) => {
  const col = 'abcdefgh'.indexOf(sq[0]);
  const row = 8 - parseInt(sq[1], 10);
  return { row, col };
};

// Convert the game state to FEN string
export function toFEN(state) {
  const { board, turn, castling, enPassantTarget, halfmoveClock, fullmoveNumber } = state;
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const letter = p.type === 'p' ? 'p' : p.type.toUpperCase();
        rowStr += p.color === 'w' ? letter.toUpperCase() : letter.toLowerCase();
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }
  const boardPart = rows.join('/');
  
  // Castling
  let castlingStr = '';
  if (castling.w.K) castlingStr += 'K';
  if (castling.w.Q) castlingStr += 'Q';
  if (castling.b.K) castlingStr += 'k';
  if (castling.b.Q) castlingStr += 'q';
  if (castlingStr === '') castlingStr = '-';

  // En passant
  let epStr = '-';
  if (enPassantTarget) {
    epStr = toAlgebraic(enPassantTarget);
  }

  return `${boardPart} ${turn} ${castlingStr} ${epStr} ${halfmoveClock} ${fullmoveNumber}`;
}
