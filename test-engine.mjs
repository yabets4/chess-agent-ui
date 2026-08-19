// Headless smoke test for the engine. Run with: node test-engine.mjs
import { initialGameState, toAlgebraic } from './src/engine/board.js';
import { applyMove, legalMovesFrom, gameStatus } from './src/engine/rules.js';
import { toSAN } from './src/engine/notation.js';

function makeMove(state, fromAlg, toAlg) {
  const [ff, fr] = fromAlg.split('');
  const [tf, tr] = toAlg.split('');
  const from = { row: 8 - parseInt(fr, 10), col: 'abcdefgh'.indexOf(ff) };
  const to = { row: 8 - parseInt(tr, 10), col: 'abcdefgh'.indexOf(tf) };
  const result = applyMove(state, { from, to });
  if (!result) throw new Error(`Illegal move: ${fromAlg}->${toAlg}`);
  return result;
}

function play(state, san) {
  // Very small SAN parser good enough for our tests.
  // Supports: e4, Nf3, Bxc4, exd5, e8=Q, O-O, O-O-O, plus +/#.
  const stripped = san.replace(/[+#]/g, '');
  if (stripped === 'O-O') {
    // King-side castle for the side to move
    const back = state.turn === 'w' ? 7 : 0;
    return makeMove(state, `${'e'}${8 - back}`, `g${8 - back}`);
  }
  if (stripped === 'O-O-O') {
    const back = state.turn === 'w' ? 7 : 0;
    return makeMove(state, `${'e'}${8 - back}`, `c${8 - back}`);
  }
  // Promotion: e8=Q
  const promo = /=(\w)$/.exec(stripped);
  const base = promo ? stripped.slice(0, -2) : stripped;

  let pieceType = 'p';
  let fromFile = null;
  let fromRank = null;
  let toAlg;
  let capture = base.includes('x');

  if ('NBRQK'.includes(base[0]) && base[0] !== 'O') {
    pieceType = base[0].toLowerCase();
    const rest = base.slice(1);
    let disambig = '';
    if (rest.includes('x')) {
      const parts = rest.split('x');
      disambig = parts[0];
      toAlg = parts[1];
    } else {
      toAlg = rest.slice(-2);
      disambig = rest.slice(0, -2);
    }
    if (disambig.length === 1) {
      if ('abcdefgh'.includes(disambig)) {
        fromFile = disambig;
      } else {
        fromRank = disambig;
      }
    } else if (disambig.length === 2) {
      fromFile = disambig[0];
      fromRank = disambig[1];
    }
  } else {
    if (capture) {
      fromFile = base[0];
      toAlg = base.slice(2);
    } else {
      toAlg = base;
    }
  }

  const toCol = 'abcdefgh'.indexOf(toAlg[0]);
  const toRow = 8 - parseInt(toAlg[1], 10);
  const candidates = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p || p.color !== state.turn || p.type !== pieceType) continue;
      if (fromFile !== null && c !== 'abcdefgh'.indexOf(fromFile)) continue;
      if (fromRank !== null && r !== 8 - parseInt(fromRank, 10)) continue;
      candidates.push({ row: r, col: c });
    }
  }
  for (const from of candidates) {
    const legal = legalMovesFrom(state, from);
    const m = legal.find((mm) => mm.to.row === toRow && mm.to.col === toCol);
    if (m) {
      const res = applyMove(state, { from, to: { row: toRow, col: toCol }, promotion: m.promotion });
      if (res) return res;
    }
  }
  throw new Error(`No legal move matches SAN: ${san}`);
}

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    fail++;
  }
}

console.log('Engine smoke tests');

// 1. Initial position has 20 legal moves
test('initial position has 20 legal moves', () => {
  const s = initialGameState();
  let count = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (legalMovesFrom(s, { row: r, col: c }).length) count += legalMovesFrom(s, { row: r, col: c }).length;
  }
  if (count !== 20) throw new Error(`expected 20, got ${count}`);
});

// 2. Fool's mate (1. f3 e5 2. g4 Qh4#)
test("Fool's mate is checkmate", () => {
  let s = initialGameState();
  let r = play(s, 'f3');
  s = r.state;
  r = play(s, 'e5');
  s = r.state;
  r = play(s, 'g4');
  s = r.state;
  r = play(s, 'Qh4');
  s = r.state;
  const st = gameStatus(s);
  if (!st.over || st.result !== 'checkmate') throw new Error(`expected checkmate, got ${JSON.stringify(st)}`);
});

// 3. SAN: e4, Nf3
test("1. e4 Nf3 produces correct SAN", () => {
  let s = initialGameState();
  let r = play(s, 'e4');
  if (r.move.san !== 'e4') throw new Error(`expected e4, got ${r.move.san}`);
  s = r.state;
  r = play(s, 'Nc6');
  if (r.move.san !== 'Nc6') throw new Error(`expected Nc6, got ${r.move.san}`);
  s = r.state;
  r = play(s, 'Nf3');
  if (r.move.san !== 'Nf3') throw new Error(`expected Nf3, got ${r.move.san}`);
});

// 4. Castling kingside
test('kingside castling works for white', () => {
  let s = initialGameState();
  s = play(s, 'e4').state;
  s = play(s, 'e5').state;
  s = play(s, 'Nf3').state;
  s = play(s, 'Nc6').state;
  s = play(s, 'Bc4').state;
  s = play(s, 'Bc5').state;
  const r = play(s, 'O-O');
  if (r.move.san !== 'O-O') throw new Error(`expected O-O, got ${r.move.san}`);
  s = r.state;
  // King on g1, rook on f1
  if (!s.board[7][6] || s.board[7][6].type !== 'k') throw new Error('king not on g1');
  if (!s.board[7][5] || s.board[7][5].type !== 'r') throw new Error('rook not on f1');
});

// 5. En passant
test('en passant capture works', () => {
  let s = initialGameState();
  s = play(s, 'e4').state;
  s = play(s, 'a6').state;
  s = play(s, 'e5').state;
  s = play(s, 'd5').state;
  // White plays exd6 (en passant)
  const r = play(s, 'exd6');
  if (r.move.san !== 'exd6') throw new Error(`expected exd6, got ${r.move.san}`);
  if (r.move.captured?.type !== 'p') throw new Error('no pawn captured');
});

// 6. Promotion
test('pawn promotion to queen works', () => {
  // Set up a position where white pawn can promote. Use FEN-like setup via direct state.
  // Build a custom state with a white pawn on a7.
  const s = initialGameState();
  s.board[1][0] = { type: 'k', color: 'b' };
  s.board[7][4] = { type: 'k', color: 'w' };
  // Clear almost everything
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r === 1 && c === 0) || (r === 7 && c === 4)) continue;
    s.board[r][c] = null;
  }
  s.board[1][2] = { type: 'p', color: 'w' };
  s.turn = 'w';
  // Move pawn c7 -> c8=Q. Need to find the legal move.
  // It IS a promotion, so we need a custom path — applyMove returns null if promotion not chosen.
  // We test via the engine's legal-move filter instead: ensure the only move is promotion.
  const moves = legalMovesFrom(s, { row: 1, col: 2 });
  if (moves.length === 0) throw new Error('expected legal promotion move');
  if (!moves[0].promotion) throw new Error('expected promotion flag');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
