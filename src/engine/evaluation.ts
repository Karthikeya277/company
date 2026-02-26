import { Chess, Square, Move } from "chess.js";
import { PIECE_VALUES, CENTER_SQUARES } from "./constants";

/** Count how many squares a piece on `sq` attacks */
export function countAttacks(game: Chess, sq: Square): number {
  return game.moves({ square: sq, verbose: true }).length;
}

/** Assess center control for the side to move */
export function assessCenterControl(game: Chess): number {
  const board = game.board();
  const turn = game.turn();
  let control = 0;

  for (const csq of CENTER_SQUARES) {
    const file = csq.charCodeAt(0) - 97;
    const rank = 8 - parseInt(csq[1]);
    const piece = board[rank][file];

    if (piece && piece.color === turn) {
      control += 0.25;
    } else {
      // Check if the side attacks this square
      const moves = game.moves({ verbose: true });
      if (moves.some((m) => m.to === csq)) {
        control += 0.15;
      }
    }
  }
  return Math.min(1.0, control);
}

/** Assess piece development (non-pawns off back rank) */
export function assessPieceDevelopment(game: Chess): number {
  const board = game.board();
  const turn = game.turn();
  let developed = 0;
  let totalPieces = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== turn) continue;
      totalPieces++;
      if (piece.type === "p") continue;
      const rank = 8 - r; // 1-8
      if ((turn === "w" && rank > 1) || (turn === "b" && rank < 8)) {
        developed++;
      }
    }
  }
  return developed / Math.max(1, totalPieces - 8);
}

/** Calculate penalty for undefended pieces */
export function calculateUndefendedPenalty(game: Chess): number {
  // Simplified: look at material exposed
  let penalty = 0;
  const board = game.board();
  const turn = game.turn();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== turn) continue;
      // Approximate: pieces attacked by opponent get a penalty
      const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
      const opponentMoves = game.moves({ verbose: true });
      const isAttacked = opponentMoves.some((m) => m.to === sq && m.captured);
      if (isAttacked) {
        penalty += 0.05 * PIECE_VALUES[piece.type];
      }
    }
  }
  return Math.min(0.3, penalty);
}

/** Move ordering heuristic for better alpha-beta pruning */
export function moveHeuristic(game: Chess, move: Move): number {
  if (move.captured) {
    const capturedValue = PIECE_VALUES[move.captured as keyof typeof PIECE_VALUES] || 0;
    return 10 + capturedValue;
  }
  if (move.promotion) return 15;
  if (move.san.includes("+")) return 5;
  return 0;
}

/** Calculate position complexity (piece count + attack density) */
export function calculatePositionComplexity(game: Chess): number {
  const board = game.board();
  let complexity = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      complexity += 1;
      const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
      complexity += countAttacks(game, sq) * 0.2;
    }
  }
  return complexity;
}
