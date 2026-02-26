import { Chess, Square } from "chess.js";
import { PIECE_VALUES, ADAPTIVE_MODEL_PATH } from "./constants";
import {
  assessCenterControl,
  assessPieceDevelopment,
  calculateUndefendedPenalty,
  moveHeuristic,
} from "./evaluation";

/**
 * Adaptive Chess AI — Adapts to opponent skill & style
 * Model reference: hybrid_checkpoint.pth
 *
 * CHANGE LOG:
 * - Replaced flat skill→depth mapping with `getDepthForOpponent()`.
 * - Depth now scales directly with `opponentSkillEstimate` (1–10):
 *     skill 1–2  → depth 1  (very weak, barely looks ahead)
 *     skill 3    → depth 2
 *     skill 4    → depth 3
 *     skill 5    → depth 4  (mid-range, default opening estimate)
 *     skill 6    → depth 5
 *     skill 7    → depth 6
 *     skill 8    → depth 7
 *     skill 9    → depth 8
 *     skill 10   → depth 9  (strongest — deep search)
 * - Position complexity still reduces depth to keep the browser responsive.
 * - Low-skill move sampling is preserved for weaker play simulation.
 */
export class AdaptiveChessAI {
  modelPath = ADAPTIVE_MODEL_PATH;
  opponentSkillEstimate = 5;
  opponentStyle: "unknown" | "aggressive" | "defensive" | "balanced" = "unknown";
  adaptiveFactor = 0.8;
  history: Array<{
    skillEstimate: number;
    style: string;
    qualityScore: number;
    styleScore: number;
  }> = [];

  // ---- Opponent assessment ----

  updateOpponentAssessment(game: Chess, moveSan: string, timeTaken: number) {
    const qualityScore = this.analyzeMoveQuality(game, moveSan);
    const styleScore = this.analyzeMoveStyle(game, moveSan);
    const skillAdjustment = qualityScore * (1.0 / (timeTaken + 0.5));

    this.opponentSkillEstimate =
      (1 - this.adaptiveFactor) * this.opponentSkillEstimate +
      this.adaptiveFactor * Math.min(10, Math.max(1, skillAdjustment * 10));

    if (styleScore > 0.6) this.opponentStyle = "aggressive";
    else if (styleScore < -0.6) this.opponentStyle = "defensive";
    else this.opponentStyle = "balanced";

    this.history.push({
      skillEstimate: this.opponentSkillEstimate,
      style: this.opponentStyle,
      qualityScore,
      styleScore,
    });
  }

  analyzeMoveQuality(game: Chess, moveSan: string): number {
    const legalMoves = game.moves();
    if (!legalMoves.includes(moveSan)) return 0.1;

    const clone = new Chess(game.fen());
    clone.move(moveSan);

    let quality = 0.5;
    if (clone.inCheck()) quality += 0.3;
    if (clone.isCheckmate()) return 1.0;
    if (moveSan.includes("x")) quality += 0.2;

    const centerControl = assessCenterControl(clone);
    const pieceDev = assessPieceDevelopment(clone);
    quality += (centerControl + pieceDev) / 4;

    quality -= calculateUndefendedPenalty(clone);

    return Math.min(1.0, Math.max(0.1, quality));
  }

  analyzeMoveStyle(game: Chess, moveSan: string): number {
    if (!game.moves().includes(moveSan)) return 0.0;

    const clone = new Chess(game.fen());
    clone.move(moveSan);

    const board = clone.board();
    const turn = clone.turn();
    let attackScore = 0;
    let defenseScore = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== turn) continue;
        const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
        const pieceMoves = clone.moves({ square: sq, verbose: true });
        for (const m of pieceMoves) {
          if (m.captured) attackScore++;
        }
        defenseScore += pieceMoves.filter((m) => !m.captured).length * 0.1;
      }
    }

    if (attackScore + defenseScore === 0) return 0;
    return (attackScore - defenseScore) / Math.max(1, attackScore + defenseScore);
  }

  // ---- Skill & depth ----

  getSkillLevel(): number {
    const adjustment = Math.random() * 1.5 - 0.5;
    let skill = Math.min(10, Math.max(1, this.opponentSkillEstimate + adjustment));
    if (this.history.length > 10) skill = Math.min(10, skill + 1);
    return skill;
  }

  /**
   * Map the current opponent skill estimate to a search depth.
   *
   * The idea: the stronger the opponent, the harder the AI must think
   * to stay competitive.  Depth grows roughly linearly with skill,
   * starting at 1 for very weak players and reaching 9 for the best.
   *
   * A small random jitter (±1) is added so the AI doesn't feel robotic.
   */
  getDepthForOpponent(): number {
    const skill = Math.round(this.opponentSkillEstimate); // 1–10

    // Base depth table keyed by skill level
    const depthTable: Record<number, number> = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 6,
      8: 7,
      9: 8,
      10: 9,
    };

    let depth = depthTable[Math.min(10, Math.max(1, skill))] ?? 4;

    // Small random jitter so the AI feels less mechanical
    depth += Math.random() < 0.3 ? 1 : 0;
    depth -= Math.random() < 0.3 ? 1 : 0;

    return Math.max(1, depth);
  }

  // ---- Board evaluation ----

  evaluateBoard(game: Chess): number {
    let evalScore = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const value = PIECE_VALUES[piece.type];
        if (piece.color === "w") evalScore += value;
        else evalScore -= value;
      }
    }

    if (this.opponentStyle === "aggressive") {
      evalScore += this.calculateDefenseBonus(game) * (game.turn() === "b" ? 1 : -1);
    } else if (this.opponentStyle === "defensive") {
      evalScore += this.calculateAttackBonus(game) * (game.turn() === "b" ? 1 : -1);
    }

    return evalScore;
  }

  calculateDefenseBonus(game: Chess): number {
    const board = game.board();
    const turn = game.turn();
    let defenseScore = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== turn) continue;
        const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
        const defenders = game.moves({ square: sq, verbose: true }).length;
        defenseScore += defenders * 0.05;
      }
    }
    return defenseScore;
  }

  calculateAttackBonus(game: Chess): number {
    const board = game.board();
    const turn = game.turn();
    let attackScore = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color === turn) continue;
        const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
        const ourMoves = game.moves({ verbose: true });
        const attackers = ourMoves.filter((m) => m.to === sq && m.captured).length;
        attackScore += attackers * 0.08;
      }
    }
    return attackScore;
  }

  // ---- Minimax with alpha-beta ----

  minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean,
    skillLevel: number
  ): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluateBoard(game);
    }

    let moves = game.moves({ verbose: true });

    if (skillLevel < 5 && Math.random() < 0.3) {
      moves = moves.sort(() => Math.random() - 0.5);
    } else if (skillLevel >= 5) {
      moves.sort((a, b) => moveHeuristic(game, b) - moveHeuristic(game, a));
    }

    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const clone = new Chess(game.fen());
        clone.move(move.san);
        const ev = this.minimax(clone, depth - 1, alpha, beta, false, skillLevel);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const clone = new Chess(game.fen());
        clone.move(move.san);
        const ev = this.minimax(clone, depth - 1, alpha, beta, true, skillLevel);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  getMove(game: Chess): string | null {
    const skillLevel = this.getSkillLevel();

    // ✅ FIXED: depth now comes from opponent skill estimate, not a flat table
    let depth = this.getDepthForOpponent();

    // Reduce depth for complex positions to keep the browser responsive
    const pieceCount = game
      .board()
      .flat()
      .filter((p) => p !== null).length;
    if (pieceCount > 20) depth = Math.max(1, depth - 2);
    else if (pieceCount > 10) depth = Math.max(1, depth - 1);

    let moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Low skill: sample fewer moves to simulate weaker play
    if (skillLevel < 5) {
      moves = moves.sort(() => Math.random() - 0.5).slice(0, 5);
    } else if (skillLevel < 8) {
      moves = moves.sort(() => Math.random() - 0.5).slice(0, 15);
    }

    if (skillLevel >= 5) {
      moves.sort((a, b) => moveHeuristic(game, b) - moveHeuristic(game, a));
    }

    let bestMove = moves[0];
    let bestValue = game.turn() === "w" ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of moves) {
      const clone = new Chess(game.fen());
      clone.move(move.san);
      const ev = this.minimax(
        clone,
        depth - 1,
        alpha,
        beta,
        game.turn() === "b",
        skillLevel
      );

      if (game.turn() === "w") {
        if (ev > bestValue) {
          bestValue = ev;
          bestMove = move;
        }
        alpha = Math.max(alpha, ev);
      } else {
        if (ev < bestValue) {
          bestValue = ev;
          bestMove = move;
        }
        beta = Math.min(beta, ev);
      }

      if (
        (game.turn() === "w" && bestValue >= 100) ||
        (game.turn() === "b" && bestValue <= -100)
      ) {
        break;
      }
    }

    return bestMove.san;
  }
}