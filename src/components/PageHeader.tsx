import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  sub,
  sticker,
  children,
}: {
  kicker: string;
  title: string;
  sub?: string;
  sticker?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{kicker}</p>
        <h1 className="mt-1 flex items-center gap-3 text-4xl font-extrabold md:text-5xl">
          {title}
          {sticker && <span className="inline-block animate-wiggle text-4xl">{sticker}</span>}
        </h1>
        {sub && <p className="mt-2 max-w-xl text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ sticker, title, sub, children }: { sticker: string; title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="sticker flex flex-col items-center gap-2 p-10 text-center">
      <span className="text-6xl animate-bob">{sticker}</span>
      <h3 className="mt-2 text-xl font-bold">{title}</h3>
      <p className="max-w-sm text-muted-foreground">{sub}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
