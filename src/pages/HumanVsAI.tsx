import { useState, useCallback, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useNavigate } from "react-router-dom";
import { AdaptiveChessAI } from "@/engine/chessAI";
import GameStatusBar from "@/components/GameStatusBar";
import MoveList from "@/components/MoveList";
import GameAnalysis from "@/components/GameAnalysis";
import EvalBar from "@/components/EvalBar";
import type { MoveRecord } from "@/engine/types";
import { ArrowLeft, RotateCcw, Brain, Cpu } from "lucide-react";

export default function HumanVsAI() {
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentEval, setCurrentEval] = useState(0);
  const aiRef = useRef(new AdaptiveChessAI());
  const moveStartTime = useRef(Date.now());

  const checkGameOver = useCallback((g: Chess) => {
    if (g.isGameOver()) {
      setGameOver(true);
      if (g.isCheckmate()) {
        setResult(g.turn() === "w" ? "Black wins by checkmate!" : "White wins by checkmate!");
      } else if (g.isDraw()) {
        setResult("Draw!");
      } else if (g.isStalemate()) {
        setResult("Stalemate!");
      } else {
        setResult("Game over!");
      }
      return true;
    }
    return false;
  }, []);

  const getEval = (g: Chess) => {
    const ev = aiRef.current.evaluateBoard(g);
    setCurrentEval(ev);
    return ev;
  };

  const makeAIMove = useCallback(
    (currentGame: Chess) => {
      if (currentGame.isGameOver()) return;
      setThinking(true);

      setTimeout(() => {
        const start = Date.now();
        const moveSan = aiRef.current.getMove(currentGame);
        const timeTaken = (Date.now() - start) / 1000;
        if (moveSan) {
          currentGame.move(moveSan);
          setGame(new Chess(currentGame.fen()));
          setMoves((prev) => [...prev, moveSan]);
          setMoveHistory((prev) => [
            ...prev,
            {
              san: moveSan,
              player: "black",
              evalScore: getEval(currentGame),
              skillLevel: aiRef.current.opponentSkillEstimate,
              timeTaken,
            },
          ]);
          checkGameOver(currentGame);
        }
        setThinking(false);
        moveStartTime.current = Date.now();
      }, 400 + Math.random() * 300);
    },
    [checkGameOver]
  );

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    if (thinking || gameOver || game.turn() !== "w") return false;

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (!move) return false;

      const timeTaken = (Date.now() - moveStartTime.current) / 1000;
      aiRef.current.updateOpponentAssessment(game, move.san, timeTaken);

      setGame(new Chess(gameCopy.fen()));
      setMoves((prev) => [...prev, move.san]);
      setMoveHistory((prev) => [
        ...prev,
        {
          san: move.san,
          player: "white",
          evalScore: getEval(gameCopy),
          skillLevel: aiRef.current.opponentSkillEstimate,
          timeTaken,
        },
      ]);

      if (!checkGameOver(gameCopy)) {
        makeAIMove(gameCopy);
      }
      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    setGame(new Chess());
    setMoves([]);
    setMoveHistory([]);
    setGameOver(false);
    setResult(null);
    setThinking(false);
    setCurrentEval(0);
    aiRef.current = new AdaptiveChessAI();
    moveStartTime.current = Date.now();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">
          Human vs <span className="text-gradient">Adaptive AI</span>
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
          {/* Board + Eval Bar */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex gap-2 animate-fade-in">
              <div className="hidden sm:block" style={{ height: "min(520px, calc(100vw - 80px))" }}>
                <EvalBar evalScore={currentEval} orientation="vertical" />
              </div>
              <div className="glow-border rounded-lg overflow-hidden" style={{ width: "min(520px, calc(100vw - 80px))" }}>
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={(src, tgt) => onDrop(src as Square, tgt as Square)}
                  animationDuration={200}
                  arePiecesDraggable={!thinking && !gameOver && game.turn() === "w"}
                  customBoardStyle={{ borderRadius: "0" }}
                  customDarkSquareStyle={{ backgroundColor: "hsl(25, 20%, 42%)" }}
                  customLightSquareStyle={{ backgroundColor: "hsl(35, 30%, 75%)" }}
                />
              </div>
            </div>
            <div className="sm:hidden">
              <EvalBar evalScore={currentEval} orientation="horizontal" />
            </div>
            <GameStatusBar game={game} gameOver={gameOver} result={result} thinking={thinking} />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 animate-fade-in-delay space-y-4">
            {/* AI Info Card */}
            <div className="rounded-lg bg-card border border-border p-4">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Brain size={14} className="text-primary" />
                Adaptive AI Engine
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Your Skill Estimate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(aiRef.current.opponentSkillEstimate / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-foreground font-mono w-8 text-right">
                      {aiRef.current.opponentSkillEstimate.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detected Style</span>
                  <span className="text-foreground font-mono capitalize px-2 py-0.5 rounded bg-secondary text-[10px]">
                    {aiRef.current.opponentStyle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moves Analyzed</span>
                  <span className="text-foreground font-mono">{aiRef.current.history.length}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                    <Cpu size={10} />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                  </p>
                </div>
              </div>
            </div>

            <MoveList moves={moves} />
            <GameAnalysis moveHistory={moveHistory} mode="human" />
          </div>
        </div>
      </main>
    </div>
  );
}
