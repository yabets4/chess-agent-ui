// React state hook that owns the chess game state.
// Components stay presentational; this hook is the source of truth.

import { useCallback, useMemo, useState, useEffect } from 'react';
import { initialGameState, opposite, toFEN, fromAlgebraic, toAlgebraic } from '../engine/board.js';
import { legalMovesFrom, applyMove, gameStatus } from '../engine/rules.js';
import { toSAN } from '../engine/notation.js';
import { API_BASE } from '../api.js';

export function useChessGame() {
  const [state, setState] = useState(() => initialGameState());
  const [pastStates, setPastStates] = useState([]);
  const [selected, setSelected] = useState(null); // { row, col }
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }

  // Game configuration & AI state
  const [gameMode, setGameMode] = useState('pve'); // 'pvp', 'pve', 'minimax', or 'self_play'
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [minimaxDepth, setMinimaxDepth] = useState(3); // search depth for minimax mode
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [hasTrained, setHasTrained] = useState(false);
  const [trainingResults, setTrainingResults] = useState(null);
  const [evalValue, setEvalValue] = useState(0.0);
  const [checkpointWhite, setCheckpointWhite] = useState('latest');
  const [checkpointBlack, setCheckpointBlack] = useState('latest');
  const [checkpointsList, setCheckpointsList] = useState(['latest']);
  const [isSelfPlayRunning, setIsSelfPlayRunning] = useState(false);

  const status = useMemo(() => gameStatus(state), [state]);
  const legalForSelected = useMemo(() => {
    if (!selected) return [];
    return legalMovesFrom(state, selected);
  }, [state, selected]);

  // List of moves the side to move can play (for SAN formatting, with disambiguation context).
  const allLegal = useMemo(() => {
    const out = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p && p.color === state.turn) {
          for (const m of legalMovesFrom(state, { row: r, col: c })) {
            out.push({ from: { row: r, col: c }, ...m });
          }
        }
      }
    }
    return out;
  }, [state]);

  const commitMove = useCallback((from, to, promotion = undefined) => {
    setState((prev) => {
      const result = applyMove(prev, { from, to, promotion });
      if (!result) return prev;
      setPastStates((past) => [...past, prev]);
      // Compute SAN using the state *before* the move as reference.
      const moveWithPromo = { ...result.move, promotion };
      const san = toSAN(prev, moveWithPromo, result.state);
      const newHistory = [...prev.history, { ...moveWithPromo, san, fenBefore: toFEN(prev) }];
      return { ...result.state, history: newHistory };
    });
    setSelected(null);
  }, []);

  const onSquareClick = useCallback((row, col) => {
    if (status.over) return;
    if (pendingPromotion) return; // wait for promotion choice
    if (gameMode === 'self_play') return; // wait for AI in self-play
    if ((gameMode === 'pve' || gameMode === 'minimax') && state.turn !== playerColor) return; // wait for AI move

    const piece = state.board[row][col];

    // If we have a selection, try to move there
    if (selected) {
      const target = legalForSelected.find((m) => m.to.row === row && m.to.col === col);
      if (target) {
        // Promotion?
        if (target.promotion) {
          setPendingPromotion({ from: selected, to: { row, col } });
          return;
        }
        commitMove(selected, { row, col });
        return;
      }
      // Clicking another own piece switches the selection
      if (piece && piece.color === state.turn) {
        setSelected({ row, col });
        return;
      }
      // Otherwise clear
      setSelected(null);
      return;
    }

    // No selection — select an own piece
    if (piece && piece.color === state.turn) {
      setSelected({ row, col });
    }
  }, [state, selected, legalForSelected, status.over, pendingPromotion, gameMode, playerColor, commitMove]);

  const choosePromotion = useCallback((piece) => {
    if (!pendingPromotion) return;
    setState((prev) => {
      const result = applyMove(prev, { from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      if (!result) return prev;
      setPastStates((past) => [...past, prev]);
      const moveWithPromo = { ...result.move, promotion: piece };
      const san = toSAN(prev, moveWithPromo, result.state);
      const newHistory = [...prev.history, { ...moveWithPromo, san, fenBefore: toFEN(prev) }];
      return { ...result.state, history: newHistory };
    });
    setPendingPromotion(null);
    setSelected(null);
  }, [pendingPromotion]);

  const undo = useCallback(() => {
    setPastStates((past) => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setState(previous);
      return past.slice(0, -1);
    });
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  const newGame = useCallback(() => {
    setState(initialGameState());
    setPastStates([]);
    setSelected(null);
    setPendingPromotion(null);
    setIsAiThinking(false);
    setIsTraining(false);
    setHasTrained(false);
    setTrainingResults(null);
    setEvalValue(0.0);
    setIsSelfPlayRunning(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Checkpoints fetching callback
  // ---------------------------------------------------------------------------
  const fetchCheckpoints = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/checkpoints`);
      if (res.ok) {
        const data = await res.json();
        setCheckpointsList(data.checkpoints || ['latest']);
      }
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
    }
  }, []);

  // Fetch checkpoints on component mount
  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  // ---------------------------------------------------------------------------
  // AI Move fetching side effect
  // ---------------------------------------------------------------------------
  const fetchAiMove = useCallback(async (currentFen) => {
    setIsAiThinking(true);
    const startTime = Date.now();
    try {
      const temp = gameMode === 'self_play' ? 1.0 : 0.7;
      const targetCheckpoint = state.turn === 'w' ? checkpointWhite : checkpointBlack;

      let res;
      if (gameMode === 'minimax') {
        // Depth-limited minimax with alpha-beta pruning (GPU-batched leaf eval)
        res = await fetch(`${API_BASE}/minimax/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: currentFen, depth: minimaxDepth, backend: 'gpu' })
        });
      } else {
        res = await fetch(`${API_BASE}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fen: currentFen, 
            temperature: temp, 
            checkpoint: targetCheckpoint 
          })
        });
      }
      if (!res.ok) {
        throw new Error(`Model server returned ${res.status}`);
      }
      const data = await res.json();
      const uci = data.move;
      const from = fromAlgebraic(uci.slice(0, 2));
      const to = fromAlgebraic(uci.slice(2, 4));
      const promo = uci.length > 4 ? uci[4] : undefined;
      
      // Enforce a minimum delay of 3500ms (3.5 seconds) for comfortable viewing
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 3500 - elapsed);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      commitMove(from, to, promo);
    } catch (err) {
      console.error('Error fetching AI move:', err);
    } finally {
      setIsAiThinking(false);
    }
  }, [commitMove, gameMode, state.turn, checkpointWhite, checkpointBlack, minimaxDepth]);

  useEffect(() => {
    const isAiTurn = (gameMode === 'pve' || gameMode === 'minimax') && state.turn !== playerColor ||
      (gameMode === 'self_play' && isSelfPlayRunning);
    if (isAiTurn && !status.over && !pendingPromotion && !isAiThinking) {
      const currentFen = toFEN(state);
      fetchAiMove(currentFen);
    }
  }, [gameMode, state, playerColor, status.over, pendingPromotion, isAiThinking, fetchAiMove, isSelfPlayRunning]);

  // ---------------------------------------------------------------------------
  // End-of-game RL model training side effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const shouldTrain = (gameMode === 'pve' || gameMode === 'self_play') && status.over && !hasTrained && !isTraining && state.history.length > 0;
    if (shouldTrain) {
      const trainModel = async () => {
        setIsTraining(true);
        try {
          const fens = state.history.map((m) => m.fenBefore).filter(Boolean);
          const moves = state.history.map((m) => toAlgebraic(m.from) + toAlgebraic(m.to) + (m.promotion || ''));
          
          if (fens.length !== moves.length) {
            console.error('FEN and Move lengths mismatch; cannot train.');
            return;
          }

          let outcome = 0.0; // Draw
          if (status.result === 'checkmate') {
            outcome = status.winner === 'w' ? 1.0 : -1.0;
          }

          console.log(`Sending game to RL model for training... Outcome (White's perspective): ${outcome}`);
          const res = await fetch(`${API_BASE}/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fens, moves, outcome })
          });

          if (!res.ok) {
            throw new Error(`Training server returned ${res.status}`);
          }

          const data = await res.json();
          setTrainingResults(data);
          setHasTrained(true);
          console.log('RL training complete!', data);
          fetchCheckpoints(); // Refresh checkpoints list
        } catch (err) {
          console.error('Error training RL model:', err);
        } finally {
          setIsTraining(false);
        }
      };

      trainModel();
    }
  }, [gameMode, status, hasTrained, isTraining, state.history, fetchCheckpoints]);

  // ---------------------------------------------------------------------------
  // Sync evaluation bar with current FEN and game status
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (status.over) {
      if (status.result === 'checkmate') {
        setEvalValue(status.winner === 'w' ? 1.0 : -1.0);
      } else {
        setEvalValue(0.0);
      }
      return;
    }

    const fetchEval = async () => {
      try {
        const currentFen = toFEN(state);
        const targetCheckpoint = state.turn === 'w' ? checkpointWhite : checkpointBlack;

        let res;
        if (gameMode === 'minimax') {
          res = await fetch(`${API_BASE}/minimax/eval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen: currentFen })
          });
          if (res.ok) {
            const data = await res.json();
            // /api/minimax/eval already returns from White's perspective.
            setEvalValue(data.value);
          }
          return;
        }

        res = await fetch(`${API_BASE}/eval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: currentFen, checkpoint: targetCheckpoint })
        });
        if (res.ok) {
          const data = await res.json();
          // Convert current player perspective value to White perspective:
          const val = state.turn === 'w' ? data.value : -data.value;
          setEvalValue(val);
        }
      } catch (err) {
        console.error('Error fetching evaluation:', err);
      }
    };

    fetchEval();
  }, [state, status, checkpointWhite, checkpointBlack, gameMode]);

  return {
    state,
    evalValue,
    selected,
    legalForSelected,
    pendingPromotion,
    status,
    history: state.history,
    canUndo: pastStates.length > 0,
    onSquareClick,
    choosePromotion,
    undo,
    newGame,
    
    // AI configuration and state
    gameMode,
    setGameMode,
    playerColor,
    setPlayerColor,
    minimaxDepth,
    setMinimaxDepth,
    isAiThinking,
    isTraining,
    trainingResults,

    // Checkpoints state & actions
    checkpointWhite,
    setCheckpointWhite,
    checkpointBlack,
    setCheckpointBlack,
    checkpointsList,
    fetchCheckpoints,

    // Self-play run state
    isSelfPlayRunning,
    setIsSelfPlayRunning,
  };
}
