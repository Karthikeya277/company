import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import type { MoveRecord } from "@/engine/types";

interface GameAnalysisProps {
  moveHistory: MoveRecord[];
  mode: "human" | "aivai";
}

const chartTooltipStyle = {
  backgroundColor: "hsl(220, 15%, 13%)",
  border: "1px solid hsl(220, 12%, 20%)",
  borderRadius: 8,
  fontSize: 11,
  color: "hsl(40, 20%, 90%)",
};

const axisStyle = { fill: "hsl(220, 10%, 55%)", fontSize: 10 };
const gridStroke = "hsl(220, 12%, 20%)";

export default function GameAnalysis({ moveHistory, mode }: GameAnalysisProps) {
  if (moveHistory.length === 0) return null;

  const evalData = moveHistory.map((m, i) => ({
    move: i + 1,
    eval: parseFloat(m.evalScore.toFixed(2)),
    player: m.player,
    san: m.san,
  }));

  const skillData = moveHistory
    .filter((m) => m.skillLevel !== undefined || m.adaptiveSkill !== undefined)
    .map((m, i) => ({
      move: i + 1,
      skill: parseFloat((m.skillLevel ?? m.adaptiveSkill ?? 5).toFixed(1)),
    }));

  const timeData = moveHistory
    .filter((m) => m.timeTaken !== undefined)
    .map((m, i) => ({
      move: i + 1,
      time: parseFloat((m.timeTaken ?? 0).toFixed(3)),
      player: m.player,
    }));

  // Game summary stats
  const totalMoves = moveHistory.length;
  const whiteMoves = moveHistory.filter((m) => m.player === "white");
  const blackMoves = moveHistory.filter((m) => m.player === "black");
  const avgWhiteTime = whiteMoves.length > 0
    ? (whiteMoves.reduce((s, m) => s + (m.timeTaken ?? 0), 0) / whiteMoves.length)
    : 0;
  const avgBlackTime = blackMoves.length > 0
    ? (blackMoves.reduce((s, m) => s + (m.timeTaken ?? 0), 0) / blackMoves.length)
    : 0;

  // Eval swings
  const swings: number[] = [];
  for (let i = 1; i < moveHistory.length; i++) {
    swings.push(Math.abs(moveHistory[i].evalScore - moveHistory[i - 1].evalScore));
  }
  const maxSwing = swings.length > 0 ? Math.max(...swings) : 0;
  const avgSwing = swings.length > 0 ? swings.reduce((a, b) => a + b, 0) / swings.length : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Live Analysis
      </h3>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-card border border-border p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Moves</p>
          <p className="text-lg font-mono font-bold text-foreground">{totalMoves}</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Swing</p>
          <p className="text-lg font-mono font-bold text-primary">{maxSwing.toFixed(1)}</p>
        </div>
        {mode === "aivai" && (
          <>
            <div className="rounded-lg bg-card border border-border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">⬜ Avg Time</p>
              <p className="text-sm font-mono font-bold text-foreground">{avgWhiteTime.toFixed(3)}s</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">⬛ Avg Time</p>
              <p className="text-sm font-mono font-bold text-foreground">{avgBlackTime.toFixed(3)}s</p>
            </div>
          </>
        )}
      </div>

      {/* Evaluation area chart */}
      <div className="rounded-lg bg-card border border-border p-3">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
          Material Balance
        </p>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={evalData}>
            <defs>
              <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="move" tick={axisStyle} stroke={gridStroke} />
            <YAxis tick={axisStyle} stroke={gridStroke} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number, _name: string, props: any) => [
                `${value > 0 ? "+" : ""}${value}`,
                `${props.payload.san} (${props.payload.player})`,
              ]}
            />
            <ReferenceLine y={0} stroke="hsl(220, 10%, 40%)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="eval"
              stroke="hsl(38, 90%, 55%)"
              strokeWidth={2}
              fill="url(#evalGradient)"
              dot={{ r: 2, fill: "hsl(38, 90%, 55%)" }}
              name="Evaluation"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Skill level chart */}
      {skillData.length > 0 && (
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[hsl(150,60%,50%)] rounded-full inline-block" />
            {mode === "human" ? "Estimated Player Skill" : "Adaptive AI Skill Level"}
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={skillData}>
              <defs>
                <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150, 60%, 50%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(150, 60%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="move" tick={axisStyle} stroke={gridStroke} />
              <YAxis domain={[0, 11]} tick={axisStyle} stroke={gridStroke} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="skill"
                stroke="hsl(150, 60%, 50%)"
                strokeWidth={2}
                fill="url(#skillGradient)"
                dot={{ r: 2, fill: "hsl(150, 60%, 50%)" }}
                name="Skill Level"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Move time chart */}
      {timeData.length > 0 && (
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[hsl(200,70%,55%)] rounded-full inline-block" />
            Move Computation Time
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="move" tick={axisStyle} stroke={gridStroke} />
              <YAxis tick={axisStyle} stroke={gridStroke} unit="s" />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => [`${value}s`, "Time"]}
              />
              <Bar
                dataKey="time"
                radius={[3, 3, 0, 0]}
                name="Time"
                fill="hsl(200, 70%, 55%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
