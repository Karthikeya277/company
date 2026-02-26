import { useState, useRef, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useNavigate } from "react-router-dom";
import { AdaptiveChessAI, HyperbolicChessAI } from "@/engine/chessAI";
import GameStatusBar from "@/components/GameStatusBar";
import MoveList from "@/components/MoveList";
import GameAnalysis from "@/components/GameAnalysis";
import EvalBar from "@/components/EvalBar";
import type { MoveRecord } from "@/engine/types";
import { ArrowLeft, Play, Pause, RotateCcw, Cpu, Zap } from "lucide-react";

export default function AIvsAI() {
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentEval, setCurrentEval] = useState(0);
  const adaptiveRef = useRef(new AdaptiveChessAI());
  const hyperbolicRef = useRef(new HyperbolicChessAI());
  const gameRef = useRef(new Chess());
  const playingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const checkGameOver = (g: Chess) => {
    if (g.isGameOver()) {
      setGameOver(true);
      if (g.isCheckmate()) {
        setResult(g.turn() === "w" ? "Hyperbolic AI wins!" : "Adaptive AI wins!");
      } else {
        setResult("Draw!");
      }
      setPlaying(false);
      return true;
    }
    return false;
  };

  const playNextMove = useCallback(() => {
    if (!playingRef.current) return;
    const g = gameRef.current;
    if (g.isGameOver()) return;

    const isWhite = g.turn() === "w";
    const start = Date.now();

    const moveSan = isWhite
      ? adaptiveRef.current.getMove(g)
      : hyperbolicRef.current.getMove(g);

    const timeTaken = (Date.now() - start) / 1000;

    if (moveSan) {
      g.move(moveSan);
      gameRef.current = new Chess(g.fen());
      setGame(new Chess(g.fen()));
      setMoves((prev) => [...prev, moveSan]);

      const evalScore = adaptiveRef.current.evaluateBoard(g);
      setCurrentEval(evalScore);
      setMoveHistory((prev) => [
        ...prev,
        {
          san: moveSan,
          player: isWhite ? "white" : "black",
          evalScore,
          timeTaken,
          adaptiveSkill: adaptiveRef.current.opponentSkillEstimate,
        },
      ]);

      if (!checkGameOver(g)) {
        timeoutRef.current = window.setTimeout(playNextMove, 600);
      }
    }
  }, []);

  function startPlaying() {
    setPlaying(true);
    setTimeout(playNextMove, 300);
  }

  function pausePlaying() {
    setPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function resetGame() {
    setPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const fresh = new Chess();
    gameRef.current = fresh;
    setGame(fresh);
    setMoves([]);
    setMoveHistory([]);
    setGameOver(false);
    setResult(null);
    setCurrentEval(0);
    adaptiveRef.current = new AdaptiveChessAI();
    hyperbolicRef.current = new HyperbolicChessAI();
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => { pausePlaying(); navigate("/"); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">
          <span className="text-gradient">Adaptive</span> vs Hyperbolic AI
        </h1>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start max-w-6xl w-full">
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex gap-2 animate-fade-in">
              <div className="hidden sm:block" style={{ height: "min(520px, calc(100vw - 80px))" }}>
                <EvalBar evalScore={currentEval} orientation="vertical" />
              </div>
              <div className="glow-border rounded-lg overflow-hidden" style={{ width: "min(520px, calc(100vw - 80px))" }}>
                <Chessboard
                  position={game.fen()}
                  animationDuration={300}
                  arePiecesDraggable={false}
                  customBoardStyle={{ borderRadius: "0" }}
                  customDarkSquareStyle={{ backgroundColor: "hsl(25, 20%, 42%)" }}
                  customLightSquareStyle={{ backgroundColor: "hsl(35, 30%, 75%)" }}
                />
              </div>
            </div>
            <div className="sm:hidden">
              <EvalBar evalScore={currentEval} orientation="horizontal" />
            </div>
            <GameStatusBar
              game={game}
              gameOver={gameOver}
              result={result}
              thinking={playing && !gameOver}
            />
            {!gameOver && (
              <button
                onClick={playing ? pausePlaying : startPlaying}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? "Pause" : "Play"}
              </button>
            )}
          </div>

          <div className="w-full lg:w-80 animate-fade-in-delay space-y-4">
            {/* Match Engine Info */}
            <div className="rounded-lg bg-card border border-border p-4">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3">Engine Match</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-2 rounded bg-secondary/50">
                  <Cpu size={14} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">White — Adaptive AI</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded bg-secondary/50">
                  <Zap size={14} className="text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Black — Hyperbolic AI</p>
                  </div>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Total Moves</span>
                  <span className="text-foreground font-mono">{moves.length}</span>
                </div>
              </div>
            </div>

            <MoveList moves={moves} />
            <GameAnalysis moveHistory={moveHistory} mode="aivai" />
          </div>
        </div>
      </main>
    </div>
  );
}
