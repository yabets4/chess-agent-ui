import { GameStatus } from './GameStatus.jsx';
import { MoveHistory } from './MoveHistory.jsx';
import { CapturedPieces } from './CapturedPieces.jsx';

export function SidePanel({
  turn,
  status,
  history,
  captures,
  onUndo,
  canUndo,
  onNewGame,
  
  // AI props
  gameMode,
  setGameMode,
  playerColor,
  setPlayerColor,
  minimaxDepth,
  setMinimaxDepth,
  isAiThinking,
  isTraining,
  trainingResults,

  // Checkpoint props
  checkpointWhite,
  setCheckpointWhite,
  checkpointBlack,
  setCheckpointBlack,
  checkpointsList,

  // Self-play props
  isSelfPlayRunning,
  setIsSelfPlayRunning,
}) {
  return (
    <aside className="w-full md:w-80 flex-shrink-0 bg-slate-800/60 rounded-lg p-4 flex flex-col md:h-[640px] space-y-4 overflow-y-auto">
      <GameStatus
        turn={turn}
        status={status}
        onUndo={onUndo}
        canUndo={canUndo}
        onNewGame={onNewGame}
        isAiThinking={isAiThinking}
        isTraining={isTraining}
      />

      {/* Game Mode Selector */}
      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Game Mode</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setGameMode('pvp')}
            className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer text-center ${
              gameMode === 'pvp'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            Pass & Play (PvP)
          </button>
          <button
            onClick={() => setGameMode('pve')}
            className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer text-center ${
              gameMode === 'pve'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            Play vs RL Model (PvE)
          </button>
          {/* Minimax mode button (commented out)
          <button
            onClick={() => setGameMode('minimax')}
            className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer text-center ${
              gameMode === 'minimax'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            Play vs Minimax (Alpha-Beta)
          </button>
          */}
          <button
            onClick={() => {
              setGameMode('self_play');
              onNewGame();
            }}
            className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer text-center ${
              gameMode === 'self_play'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            Model Self-Play (EvE)
          </button>
        </div>

        {gameMode === 'pve' && (
          <div className="space-y-2 animate-fadeIn pt-1 border-t border-slate-700/30">
            <div className="text-xs font-medium text-slate-400">Your Color:</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPlayerColor('w');
                  onNewGame();
                }}
                className={`flex-1 py-1 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  playerColor === 'w'
                    ? 'bg-slate-100 text-slate-900 shadow'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                White
              </button>
              <button
                onClick={() => {
                  setPlayerColor('b');
                  onNewGame();
                }}
                className={`flex-1 py-1 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  playerColor === 'b'
                    ? 'bg-slate-900 text-slate-100 shadow border border-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                Black
              </button>
            </div>
          </div>
        )}

        {/* Minimax depth picker (commented out)
        {gameMode === 'minimax' && (
          <div className="space-y-2 animate-fadeIn pt-1 border-t border-slate-700/30">
            <div className="text-xs font-medium text-slate-400">Search Depth:</div>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setMinimaxDepth(d)}
                  className={`flex-1 py-1 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    minimaxDepth === d
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400">
              Depth 2 = fast, Depth 5 = strongest but slower (GPU-batched eval)
            </div>
          </div>
        )}
        */}
      </div>

      {/* Checkpoints Configuration Section */}
      {gameMode === 'self_play' && (
        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 space-y-3 animate-fadeIn">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engine Checkpoints</h3>
          
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">White Player (AI):</label>
            <select
              value={checkpointWhite}
              onChange={(e) => setCheckpointWhite(e.target.value)}
              className="w-full bg-slate-700 text-slate-100 text-xs rounded p-1.5 border border-slate-600 focus:outline-none cursor-pointer"
            >
              {checkpointsList.map((cp) => (
                <option key={cp} value={cp}>
                  {cp === 'latest' ? 'Active Model (Latest)' : cp === 'model_checkpoint_0.pth' ? 'model_checkpoint_0.pth (Pristine)' : cp}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">Black Player (AI):</label>
            <select
              value={checkpointBlack}
              onChange={(e) => setCheckpointBlack(e.target.value)}
              className="w-full bg-slate-700 text-slate-100 text-xs rounded p-1.5 border border-slate-600 focus:outline-none cursor-pointer"
            >
              {checkpointsList.map((cp) => (
                <option key={cp} value={cp}>
                  {cp === 'latest' ? 'Active Model (Latest)' : cp === 'model_checkpoint_0.pth' ? 'model_checkpoint_0.pth (Pristine)' : cp}
                </option>
              ))}
            </select>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsSelfPlayRunning(!isSelfPlayRunning)}
            disabled={status.over}
            className={`w-full mt-2 py-2 px-4 rounded text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              status.over
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : isSelfPlayRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
            }`}
          >
            {isSelfPlayRunning ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
                Pause Self-Play
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                Start Self-Play
              </>
            )}
          </button>
        </div>
      )}

      {gameMode === 'pve' && (
        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 space-y-2 animate-fadeIn">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engine Checkpoint</h3>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">
              {playerColor === 'w' ? 'Black Player (AI):' : 'White Player (AI):'}
            </label>
            <select
              value={playerColor === 'w' ? checkpointBlack : checkpointWhite}
              onChange={(e) => {
                if (playerColor === 'w') {
                  setCheckpointBlack(e.target.value);
                } else {
                  setCheckpointWhite(e.target.value);
                }
              }}
              className="w-full bg-slate-700 text-slate-100 text-xs rounded p-1.5 border border-slate-600 focus:outline-none cursor-pointer"
            >
              {checkpointsList.map((cp) => (
                <option key={cp} value={cp}>
                  {cp === 'latest' ? 'Active Model (Latest)' : cp === 'model_checkpoint_0.pth' ? 'model_checkpoint_0.pth (Pristine)' : cp}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Training Result Notification */}
      {trainingResults && !isTraining && (
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-xs animate-fadeIn">
          <div className="text-emerald-400 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              ✓ Model successfully updated!
            </div>
            <div className="text-[10px] text-slate-400">
              Moves trained: <span className="text-slate-200">{trainingResults.moves_trained}</span><br />
              Avg policy loss: <span className="text-slate-200">{trainingResults.avg_policy_loss?.toFixed(4)}</span><br />
              Avg value loss: <span className="text-slate-200">{trainingResults.avg_value_loss?.toFixed(4)}</span><br />
              Games completed: <span className="text-slate-200 font-semibold">{trainingResults.total_games_trained}</span>
              {trainingResults.checkpoint_saved && (
                <div className="mt-1.5 text-amber-300 font-medium border-t border-slate-700/50 pt-1">
                  💾 Checkpoint saved: {trainingResults.checkpoint_name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-shrink-0">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Captured</h3>
        <div className="min-h-[4.5rem] bg-slate-100 rounded p-2 shadow-inner border border-slate-200/50">
          <CapturedPieces captures={captures} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Moves</h3>
        <div className="flex-1 overflow-y-auto pr-1 bg-slate-900/20 rounded p-2 min-h-0">
          <MoveHistory history={history} />
        </div>
      </div>
    </aside>
  );
}
