import { Chess, Square } from "chess.js";
import { PIECE_VALUES, HYPERBOLIC_MODEL_CHECKPOINT } from "./constants";
import { countAttacks, calculatePositionComplexity } from "./evaluation";

/**
 * Hyperbolic Chess AI — Hyper-aggressive style
 * Model reference: HuggingFaceTB/SmolLM-360M
 */
export class HyperbolicChessAI {
  modelCheckpoint = HYPERBOLIC_MODEL_CHECKPOINT;
  temperature = 1.2;
  riskFactor = 0.7;
  style = "hyper-aggressive";

  evaluateBoard(game: Chess): number {
    let evaluation = 0;
    let attackBonus = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let value = PIECE_VALUES[piece.type];
        const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;

        // Mobility bonus scaled by temperature
        const mobility = countAttacks(game, sq);
        value += mobility * 0.05 * this.temperature;

        // Attack bonus: value of enemy pieces we attack
        const moves = game.moves({ square: sq, verbose: true });
        let attackedValue = 0;
        for (const m of moves) {
          if (m.captured) {
            attackedValue += PIECE_VALUES[m.captured as keyof typeof PIECE_VALUES] * 0.1;
          }
        }
        attackBonus += attackedValue * this.riskFactor;

        if (piece.color === "w") evaluation += value;
        else evaluation -= value;
      }
    }

    // Non-linear scaling for aggressive play
    evaluation = Math.sign(evaluation) * Math.pow(Math.abs(evaluation), 1.2);
    evaluation += attackBonus;
    return evaluation;
  }

  applyHyperbolicTransform(score: number): number {
    return Math.sign(score) * Math.pow(Math.abs(score), 1.3);
  }

  getMove(game: Chess): string | null {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    const complexity = calculatePositionComplexity(game);
    const timeFactor = Math.min(1.0, complexity / 20.0);

    let bestMove = moves[0];
    let bestScore = game.turn() === "w" ? -Infinity : Infinity;

    for (const move of moves) {
      const clone = new Chess(game.fen());
      clone.move(move.san);
      let score = this.evaluateBoard(clone);
      score = this.applyHyperbolicTransform(score);
      score += (Math.random() - 0.5) * this.temperature;

      if (
        (game.turn() === "w" && score > bestScore) ||
        (game.turn() === "b" && score < bestScore)
      ) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove.san;
  }
}
