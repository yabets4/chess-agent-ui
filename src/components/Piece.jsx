// Renders a single chess piece using Unicode glyphs (no image assets).

const GLYPHS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function Piece({ piece }) {
  if (!piece) return null;
  const ch = GLYPHS[piece.color][piece.type];
  const colorClass = piece.color === 'w' ? 'piece-white text-white' : 'text-slate-900';
  return (
    <span
      className={`select-none leading-none text-[clamp(2rem,8vmin,4rem)] ${colorClass}`}
      aria-hidden
    >
      {ch}
    </span>
  );
}
