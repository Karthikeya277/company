interface MoveListProps {
  moves: string[];
}

export default function MoveList({ moves }: MoveListProps) {
  const pairs: Array<{ num: number; white: string; black?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="rounded-lg bg-card border border-border p-4 h-full">
      <h3 className="font-display text-sm font-semibold text-foreground mb-3">Moves</h3>
      <div className="max-h-[360px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {pairs.length === 0 && (
          <p className="text-muted-foreground text-xs italic">No moves yet</p>
        )}
        {pairs.map((p, i) => (
          <div
            key={i}
            className={`grid grid-cols-[2rem_1fr_1fr] gap-1 text-xs font-mono rounded px-1.5 py-0.5 ${
              i === pairs.length - 1 ? "bg-primary/10" : ""
            }`}
          >
            <span className="text-muted-foreground">{p.num}.</span>
            <span className="text-foreground">{p.white}</span>
            <span className="text-foreground/70">{p.black ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
