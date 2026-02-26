import { Chess } from "chess.js";

interface GameStatusBarProps {
  game: Chess;
  gameOver: boolean;
  result: string | null;
  thinking: boolean;
}

export default function GameStatusBar({ game, gameOver, result, thinking }: GameStatusBarProps) {
  const getStatusText = () => {
    if (gameOver && result) return result;
    if (thinking) return "AI is thinking…";
    if (game.inCheck()) return "Check!";
    return game.turn() === "w" ? "White to move" : "Black to move";
  };

  const isCheck = game.inCheck() && !gameOver;
  const isOver = gameOver;

  return (
    <div
      className={`rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
        isOver
          ? "bg-primary/20 text-primary"
          : isCheck
          ? "bg-destructive/20 text-destructive"
          : thinking
          ? "bg-secondary text-muted-foreground"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      {getStatusText()}
    </div>
  );
}
