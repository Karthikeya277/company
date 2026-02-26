import { useNavigate } from "react-router-dom";
import { Crown, Swords, Bot } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="text-primary" size={36} />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight mb-3">
          <span className="text-gradient">Adaptive</span> Chess
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          Experience chess against an AI that learns your style — or watch two AIs battle it out.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl w-full">
        <button
          onClick={() => navigate("/play")}
          className="group glow-border card-hover rounded-xl bg-card p-8 text-left animate-fade-in-delay"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center mb-5">
            <Swords className="text-primary" size={22} />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Human vs Adaptive AI
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Play against an AI that adapts to your skill level and playing style in real time.
          </p>
        </button>

        <button
          onClick={() => navigate("/watch")}
          className="group glow-border card-hover rounded-xl bg-card p-8 text-left animate-fade-in-delay-2"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center mb-5">
            <Bot className="text-primary" size={22} />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Adaptive vs Hyperbolic AI
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Watch two AI engines with different strategies compete against each other.
          </p>
        </button>
      </div>

      <p className="text-muted-foreground/50 text-xs mt-16 font-mono">
        Drag & drop pieces • Only legal moves • Real-time AI response
      </p>
    </div>
  );
}
