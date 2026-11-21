import type { Meme } from "@/lib/memes";
import { cn } from "@/lib/utils";

export function MemeCard({ meme, className }: { meme: Meme; className?: string }) {
  if (meme.kind === "drake") {
    return (
      <div className={cn("sticker-lg overflow-hidden animate-pop", className)}>
        <div className="grid grid-cols-[88px_1fr] border-b-2 border-ink">
          <div className="flex items-center justify-center bg-loss-soft text-5xl">🙅‍♂️</div>
          <p className="p-4 font-display text-lg font-bold leading-tight">{meme.no}</p>
        </div>
        <div className="grid grid-cols-[88px_1fr]">
          <div className="flex items-center justify-center bg-gain-soft text-5xl">👉😏</div>
          <p className="p-4 font-display text-lg font-bold leading-tight">{meme.yes}</p>
        </div>
      </div>
    );
  }
  if (meme.kind === "chat") {
    return (
      <div className={cn("sticker-lg relative space-y-3 bg-accent p-5 animate-pop", className)}>
        {meme.lines.map((l, i) => (
          <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl border-2 border-ink px-4 py-2 shadow-sticker-sm",
                i % 2 ? "rounded-br-sm bg-secondary" : "rounded-bl-sm bg-card",
              )}
            >
              <p className="text-xs font-bold text-muted-foreground">{l.who}</p>
              <p className="font-medium">{l.text}</p>
            </div>
          </div>
        ))}
        <span className="absolute -bottom-5 -right-3 text-6xl animate-wiggle">{meme.sticker}</span>
      </div>
    );
  }
  return (
    <div className={cn("sticker-lg overflow-hidden bg-ink text-ink-foreground animate-pop", className)}>
      <p className="px-5 pt-5 text-center font-display text-xl font-extrabold uppercase leading-tight">
        {meme.top}
      </p>
      <div className="py-4 text-center text-7xl animate-bob">{meme.sticker}</div>
      <p className="px-5 pb-5 text-center font-display text-xl font-extrabold uppercase leading-tight text-secondary">
        {meme.bottom}
      </p>
    </div>
  );
}
