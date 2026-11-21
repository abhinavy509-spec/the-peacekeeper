import { useEffect, useState } from "react";
import { FLOATERS } from "@/lib/memes";

interface Floater {
  id: number;
  text: string;
  left: number;
  delay: number;
  duration: number;
  rot: number;
  big: boolean;
}

// Background stickers drifting upward. Generated after mount to avoid hydration mismatch.
export function FloatingMemes({ count = 14 }: { count?: number }) {
  const [items, setItems] = useState<Floater[]>([]);
  useEffect(() => {
    const shuffled = [...FLOATERS].sort(() => Math.random() - 0.5).slice(0, count);
    setItems(
      shuffled.map((text, i) => ({
        id: i,
        text,
        left: Math.random() * 92,
        delay: -Math.random() * 30,
        duration: 22 + Math.random() * 18,
        rot: Math.random() * 30 - 15,
        big: text.length <= 3,
      })),
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {items.map((f) => (
        <span
          key={f.id}
          className={
            f.big
              ? "absolute top-0 text-4xl opacity-40 animate-float"
              : "absolute top-0 whitespace-nowrap rounded-full border-2 border-ink/30 bg-card/70 px-3 py-1 font-hand text-xl text-foreground/50 animate-float"
          }
          style={
            {
              left: `${f.left}%`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
              "--r": `${f.rot}deg`,
            } as React.CSSProperties
          }
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}
