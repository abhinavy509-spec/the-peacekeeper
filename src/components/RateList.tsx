import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, RotateCcw, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CATEGORIES, DEFAULT_PRICES, mergePrices } from "@/lib/prices";
import type { PriceRow } from "@/lib/data";

// Edit the rate list: change any price, hide defaults, add your own items.
export function RateListDialog({ rows }: { rows: PriceRow[] }) {
  const qc = useQueryClient();
  const items = mergePrices(rows);
  const hiddenCount = rows.filter((r) => r.hidden).length;
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧾");

  const refresh = () => qc.invalidateQueries({ queryKey: ["price_items"] });

  const upsert = useMutation({
    mutationFn: async (row: { item_key: string; name: string; emoji: string; category: string; price: number; hidden?: boolean }) => {
      const { error } = await supabase
        .from("price_items")
        .upsert({ hidden: false, ...row }, { onConflict: "owner_id,item_key" });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: async (item_key: string) => {
      const { error } = await supabase.from("price_items").delete().eq("item_key", item_key);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const unhideAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("price_items").delete().eq("hidden", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saare chhupe items wapas aa gaye 👀");
      refresh();
    },
  });

  function savePrice(key: string, value: string) {
    const price = Number(value);
    const item = items.find((i) => i.key === key);
    if (!item || !(price >= 0) || price === item.price) return;
    upsert.mutate(
      { item_key: key, name: item.name, emoji: item.emoji, category: item.category, price },
      { onSuccess: () => toast.success(`${item.name} ab ₹${price} ka 💸`) },
    );
  }

  function addCustom(e: React.FormEvent): void {
    e.preventDefault();
    const price = Number(newPrice);
    if (newName.trim().length < 2 || !(price > 0)) return void toast.error("Naam aur price dono daalo 🙄");
    upsert.mutate(
      { item_key: `custom:${crypto.randomUUID()}`, name: newName.trim(), emoji: newEmoji || "🧾", category: "custom", price },
      {
        onSuccess: () => {
          toast.success(`${newName.trim()} rate list mein add ⭐`);
          setNewName("");
          setNewPrice("");
        },
      },
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">✏️ Rates edit karo</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-2 border-ink shadow-sticker-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Rate list 📋</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Canteen ne rate badha diya? Yahan badlo. Price box se bahar click karte hi save ho jaata hai.
          </p>
        </DialogHeader>

        <form onSubmit={addCustom} className="grid grid-cols-[56px_1fr_100px_auto] gap-2 rounded-xl border-2 border-dashed border-ink/50 p-3">
          <Input aria-label="Emoji" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="text-center" />
          <Input aria-label="Item ka naam" placeholder="e.g. Bread omelette" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input aria-label="Price" type="number" min="0" placeholder="₹" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          <Button type="submit" size="default">➕</Button>
        </form>

        {hiddenCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => unhideAll.mutate()}>
            <RotateCcw /> {hiddenCount} chhupe items wapas lao
          </Button>
        )}

        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const list = items.filter((i) => i.category === cat.id);
            if (!list.length) return null;
            return (
              <div key={cat.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                  {cat.emoji} {cat.label}
                </p>
                <ul className="space-y-1.5">
                  {list.map((it) => (
                    <li key={it.key} className="flex items-center gap-2">
                      <span className="w-7 text-center text-xl">{it.emoji}</span>
                      <span className="flex-1 truncate text-sm font-semibold">
                        {it.name}
                        {it.edited && <span className="ml-1 text-[10px] font-bold text-primary">(edited)</span>}
                      </span>
                      <Input
                        key={`${it.key}-${it.price}`}
                        aria-label={`${it.name} price`}
                        type="number"
                        min="0"
                        defaultValue={it.price}
                        onBlur={(e) => savePrice(it.key, e.target.value)}
                        className="h-9 w-24 text-right"
                      />
                      {it.edited && (
                        <Button variant="ghost" size="icon" aria-label={`Reset ${it.name}`} onClick={() => reset.mutate(it.key)}>
                          <RotateCcw />
                        </Button>
                      )}
                      {it.custom ? (
                        <Button variant="ghost" size="icon" aria-label={`Delete ${it.name}`} onClick={() => reset.mutate(it.key)}>
                          <Trash2 />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hide ${it.name}`}
                          onClick={() => {
                            const def = DEFAULT_PRICES.find((d) => d.key === it.key)!;
                            upsert.mutate({ item_key: it.key, name: def.name, emoji: def.emoji, category: def.category, price: it.price, hidden: true });
                          }}
                        >
                          <EyeOff />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
