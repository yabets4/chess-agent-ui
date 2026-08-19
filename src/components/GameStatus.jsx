export function GameStatus({ turn, status, onUndo, canUndo, onNewGame, isAiThinking, isTraining }) {
  let banner = null;
  let bannerClass = 'text-red-300';

  if (isAiThinking) {
    banner = "Engine is thinking...";
    bannerClass = "text-blue-400 animate-pulse font-semibold flex items-center gap-1";
  } else if (isTraining) {
    banner = "Model is learning...";
    bannerClass = "text-amber-400 animate-pulse font-semibold flex items-center gap-1";
  } else if (status.over) {
    bannerClass = "text-amber-300 font-semibold";
    if (status.result === 'checkmate') {
      banner = `Checkmate — ${status.winner === 'w' ? 'White' : 'Black'} wins`;
    } else if (status.result === 'stalemate') {
      banner = 'Stalemate — Draw';
    } else if (status.result === 'insufficient') {
      banner = 'Insufficient material — Draw';
    } else if (status.result === 'fifty-move') {
      banner = '50-move rule — Draw';
    }
  } else if (status.inCheck) {
    banner = `${turn === 'w' ? 'White' : 'Black'} is in check`;
    bannerClass = "text-red-400 font-semibold";
  }

  const turnLabel = `${turn === 'w' ? 'White' : 'Black'} to move`;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-400">Turn</div>
        <div className="text-lg font-semibold text-slate-100">{turnLabel}</div>
        {banner && (
          <div className={`mt-1 text-sm ${bannerClass}`}>
            {(isAiThinking || isTraining) && (
              <span className={`w-2 h-2 rounded-full inline-block ${isAiThinking ? 'bg-blue-400' : 'bg-amber-400'} animate-ping mr-1`} />
            )}
            {banner}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            canUndo
              ? 'bg-slate-750 hover:bg-slate-600 text-slate-100 border border-slate-600'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-40 border border-slate-800'
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium transition-colors cursor-pointer"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
