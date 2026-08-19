import { useChessGame } from './hooks/useChessGame.js';
import { Board } from './components/Board.jsx';
import { SidePanel } from './components/SidePanel.jsx';
import { PromotionDialog } from './components/PromotionDialog.jsx';

export default function App() {
  const {
    state,
    selected,
    legalForSelected,
    pendingPromotion,
    status,
    history,
    onSquareClick,
    choosePromotion,
    undo,
    canUndo,
    newGame,
    evalValue,
    
    // AI state & configuration
    gameMode,
    setGameMode,
    playerColor,
    setPlayerColor,
    minimaxDepth,
    setMinimaxDepth,
    isAiThinking,
    isTraining,
    trainingResults,

    // Checkpoint state & actions
    checkpointWhite,
    setCheckpointWhite,
    checkpointBlack,
    setCheckpointBlack,
    checkpointsList,

    // Self-play run state
    isSelfPlayRunning,
    setIsSelfPlayRunning,
  } = useChessGame();

  // Pieces captured = each capture recorded in the history. Use a flat list of pieces.
  const captures = history
    .filter((h) => h.captured)
    .map((h) => h.captured);

  return (
    <div className="min-h-full w-full flex items-center justify-center p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* Board and Evaluation Bar side-by-side container */}
        <div className="flex items-stretch gap-3 w-full max-w-[660px]">
          {/* Vertical Evaluation Bar */}
          <div className="w-5 bg-slate-900 border border-slate-700/80 rounded-md overflow-hidden flex flex-col justify-end relative shadow-2xl flex-shrink-0">
            {/* Black evaluation section at the top */}
            <div className="w-full bg-slate-950 transition-all duration-700 ease-out flex-1" />
            {/* White evaluation section at the bottom */}
            <div 
              className="w-full bg-slate-100 transition-all duration-700 ease-out" 
              style={{ height: `${((evalValue + 1.0) / 2.0) * 100}%` }}
            />
            {/* Score overlay */}
            <div className="absolute inset-0 flex flex-col justify-between items-center text-[10px] font-extrabold pointer-events-none py-1.5 mix-blend-difference text-white select-none">
              <span>B</span>
              <span className="font-mono text-[9px] tracking-tighter">
                {evalValue > 0 ? `+${evalValue.toFixed(2)}` : evalValue.toFixed(2)}
              </span>
              <span>W</span>
            </div>
          </div>

          {/* Chess Board */}
          <Board
            state={state}
            selected={selected}
            legalForSelected={legalForSelected}
            onSquareClick={onSquareClick}
            status={status}
          />
        </div>

        <SidePanel
          turn={state.turn}
          status={status}
          history={history}
          captures={captures}
          onUndo={undo}
          canUndo={canUndo}
          onNewGame={newGame}
          
          // AI props
          gameMode={gameMode}
          setGameMode={setGameMode}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          minimaxDepth={minimaxDepth}
          setMinimaxDepth={setMinimaxDepth}
          isAiThinking={isAiThinking}
          isTraining={isTraining}
          trainingResults={trainingResults}

          // Checkpoint props
          checkpointWhite={checkpointWhite}
          setCheckpointWhite={setCheckpointWhite}
          checkpointBlack={checkpointBlack}
          setCheckpointBlack={setCheckpointBlack}
          checkpointsList={checkpointsList}

          // Self-play props
          isSelfPlayRunning={isSelfPlayRunning}
          setIsSelfPlayRunning={setIsSelfPlayRunning}
        />
      </div>
      {pendingPromotion && (
        <PromotionDialog color={state.turn} onChoose={choosePromotion} />
      )}
    </div>
  );
}
