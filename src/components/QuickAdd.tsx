import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { RateListDialog } from "@/components/RateList";
import { CATEGORIES, cartTotal, mergePrices, type CartLine } from "@/lib/prices";
import { formatINR } from "@/lib/money";
import type { PriceRow } from "@/lib/data";
import { cn } from "@/lib/utils";

// Tap items from the rate list to build the bill. Every line's price stays editable.
export function QuickAdd({
  rows,
  cart,
  onChange,
}: {
  rows: PriceRow[];
  cart: CartLine[];
  onChange: (next: CartLine[]) => void;
}) {
  const items = mergePrices(rows);
  const cats = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));
  const [cat, setCat] = useState(cats[0]?.id ?? "basics");
  const visible = items.filter((i) => i.category === cat);

  const add = (key: string) => {
    const it = items.find((i) => i.key === key);
    if (!it) return;
    const existing = cart.find((l) => l.key === key);
    onChange(
      existing
        ? cart.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        : [...cart, { key, name: it.name, emoji: it.emoji, qty: 1, price: it.price }],
    );
  };
  const setQty = (key: string, qty: number) =>
    onChange(
      qty <= 0
        ? cart.filter((l) => l.key !== key)
        : cart.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  const setPrice = (key: string, price: number) =>
    onChange(cart.map((l) => (l.key === key ? { ...l, price: Math.max(0, price) } : l)));

  return (
    <section className="sticker-lg mb-6 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Quick add 🛒</h2>
          <p className="text-sm text-muted-foreground">
            Tap karo, bill khud banega. Price galat hai? Neeche edit karo.
          </p>
        </div>
        <RateListDialog rows={rows} />
      </div>

      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-2">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={cn(
              "shrink-0 rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold",
              cat === c.id ? "bg-ink text-ink-foreground" : "bg-card",
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((it) => {
          const inCart = cart.find((l) => l.key === it.key);
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => add(it.key)}
              className={cn(
                "relative flex items-center gap-2 rounded-xl border-2 border-ink p-2.5 text-left shadow-sticker-sm hover:animate-shake",
                inCart ? "bg-secondary" : "bg-card",
              )}
            >
              <span className="text-2xl">{it.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold leading-tight">{it.name}</span>
                <span className="block text-xs font-semibold text-muted-foreground">
                  ₹{it.price}
                </span>
              </span>
              {inCart && (
                <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {inCart.qty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="mt-5 rounded-xl border-2 border-ink bg-accent p-3">
          <ul className="space-y-2">
            {cart.map((l) => (
              <li key={l.key} className="flex items-center gap-2 text-sm">
                <span className="text-xl">{l.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{l.name}</span>
                <button
                  type="button"
                  aria-label="Kam karo"
                  onClick={() => setQty(l.key, l.qty - 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg border-2 border-ink bg-card"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-bold">{l.qty}</span>
                <button
                  type="button"
                  aria-label="Zyada karo"
                  onClick={() => setQty(l.key, l.qty + 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg border-2 border-ink bg-card"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <span className="text-muted-foreground">×</span>
                <Input
                  aria-label={`${l.name} price`}
                  type="number"
                  min="0"
                  value={l.price}
                  onChange={(e) => setPrice(l.key, Number(e.target.value))}
                  className="h-8 w-20 text-right"
                />
                <span className="w-16 text-right font-display font-bold">
                  {formatINR(l.qty * l.price)}
                </span>
                <button
                  type="button"
                  aria-label={`Hatao ${l.name}`}
                  onClick={() => setQty(l.key, 0)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink/40 pt-2">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-bold text-muted-foreground underline"
            >
              Cart khaali karo
            </button>
            <p className="font-display text-lg font-extrabold">
              Total: {formatINR(cartTotal(cart))}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
