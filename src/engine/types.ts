export interface MoveRecord {
  san: string;
  player: "white" | "black";
  evalScore: number;
  skillLevel?: number;
  timeTaken?: number;
  adaptiveSkill?: number;
}
