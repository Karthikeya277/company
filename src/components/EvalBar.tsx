import { useMemo } from "react";

interface EvalBarProps {
  evalScore: number;
  /** vertical or horizontal */
  orientation?: "vertical" | "horizontal";
}

export default function EvalBar({ evalScore, orientation = "vertical" }: EvalBarProps) {
  const { whitePercent, label, labelColor } = useMemo(() => {
    // Clamp eval to -15..+15 range for visual display
    const clamped = Math.max(-15, Math.min(15, evalScore));
    // Map to 0-100 (50 = equal, 100 = white winning)
    const pct = 50 + (clamped / 15) * 50;
    const display = evalScore >= 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1);
    const color = evalScore >= 0 ? "text-foreground" : "text-background";
    return { whitePercent: pct, label: display, labelColor: color };
  }, [evalScore]);

  if (orientation === "horizontal") {
    return (
      <div className="w-full h-6 rounded-md overflow-hidden flex relative bg-[hsl(220,12%,18%)]">
        <div
          className="bg-[hsl(40,20%,88%)] transition-all duration-500 ease-out"
          style={{ width: `${whitePercent}%` }}
        />
        <div
          className="bg-[hsl(220,15%,15%)] transition-all duration-500 ease-out"
          style={{ width: `${100 - whitePercent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="w-7 rounded-md overflow-hidden flex flex-col relative bg-[hsl(220,12%,18%)]" style={{ height: "100%" }}>
      {/* Black portion (top) */}
      <div
        className="bg-[hsl(220,15%,15%)] transition-all duration-500 ease-out w-full"
        style={{ height: `${100 - whitePercent}%` }}
      />
      {/* White portion (bottom) */}
      <div
        className="bg-[hsl(40,20%,88%)] transition-all duration-500 ease-out w-full"
        style={{ height: `${whitePercent}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-primary [writing-mode:vertical-rl] rotate-180">
        {label}
      </span>
    </div>
  );
}
