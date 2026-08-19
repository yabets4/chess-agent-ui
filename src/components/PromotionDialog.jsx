import { Piece } from './Piece.jsx';

const PIECES = ['q', 'r', 'b', 'n'];

export function PromotionDialog({ color, onChoose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
        <h2 className="text-white text-lg font-semibold mb-4 text-center">Choose promotion</h2>
        <div className="flex gap-2">
          {PIECES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChoose(p)}
              className="w-16 h-16 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
            >
              <Piece piece={{ type: p, color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
