import { PieceSymbol } from "chess.js";

// Model checkpoints (reference paths from original Python codebase)
export const ADAPTIVE_MODEL_PATH = "hybrid_checkpoint.pth";
export const HYPERBOLIC_MODEL_CHECKPOINT = "HuggingFaceTB/SmolLM-360M";

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

// Center squares for positional evaluation
export const CENTER_SQUARES = ["e4", "d4", "e5", "d5"] as const;
