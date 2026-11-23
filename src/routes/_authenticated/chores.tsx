import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Dices, Share2, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { RouletteWheel, type ChoreItem } from "@/components/RouletteWheel";
import { choresQuery, friendsQuery, profileQuery, getLocalItem, setLocalItem } from "@/lib/data";
import { whatsappLink } from "@/lib/court";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chores")({
  head: () => ({
    meta: [
      { title: "Chores Roulette — The Peacekeeper" },
      {
        name: "description",
        content:
          "Hostel chores roulette wheel. Spin to decide who cleans, gets water, or gets parcels.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(choresQuery),
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(profileQuery),
    ]),
  component: ChoresPage,
});

const DEFAULT_CHORES: Omit<ChoreItem, "id">[] = [
  { label: "Jhaadu & Pocha", emoji: "🧹" },
  { label: "Kachra Phekne Jao", emoji: "🗑️" },
  { label: "20L Water Jar Bharo", emoji: "💧" },
  { label: "Amazon Parcel Lao", emoji: "📦" },
  { label: "Sabke Liye Maggi", emoji: "🍜" },
  { label: "Wi-Fi Router Reset", emoji: "📡" },
  { label: "Canteen se Chai Lao", emoji: "🍵" },
  { label: "Bartan Dhona", emoji: "🍳" },
];

export function ChoresPage() {
  const qc = useQueryClient();
  const { data: dbChores } = useSuspenseQuery(choresQuery);
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);

  // Fallback to local default chores if DB is empty
  const [localChores, setLocalChores] = useState<ChoreItem[]>(() => {
    return DEFAULT_CHORES.map((c, i) => ({ id: `default-${i}`, ...c }));
  });

  const activeChores: ChoreItem[] =
    dbChores.length > 0
      ? dbChores.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))
      : localChores;

  // New chore inputs
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧹");

  // Spin result state
  const [winnerResult, setWinnerResult] = useState<{
    chore: ChoreItem;
    assignedFriend: string;
  } | null>(null);

  // Selected target victim / friend for spin
  const [selectedFriendId, setSelectedFriendId] = useState<string>("sab");

  const addChore = useMutation({
    mutationFn: async () => {
      const label = newLabel.trim();
      if (!label) throw new Error("Chore ka naam toh likho!");

      const { data: u } = await supabase.auth.getUser();
      try {
        if (u.user) {
          const { error } = await supabase.from("chores").insert({
            owner_id: u.user.id,
            label,
            emoji: newEmoji,
          });
          if (error) throw error;
        } else {
          throw new Error("No user");
        }
      } catch {
        const local = getLocalItem<ChoreItem[]>(
          "peacekeeper_local_chores",
          DEFAULT_CHORES.map((c, i) => ({ id: `default-${i}`, ...c })),
        );
        local.push({ id: crypto.randomUUID(), label, emoji: newEmoji });
        setLocalItem("peacekeeper_local_chores", local);
        setLocalChores(local);
      }
    },
    onSuccess: () => {
      toast.success("Naya chore wheel mein jud gaya! 🎡");
      setNewLabel("");
      qc.invalidateQueries({ queryKey: ["chores"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteChore = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from("chores").delete().eq("id", id);
        if (error) throw error;
      } catch {
        const local = getLocalItem<ChoreItem[]>(
          "peacekeeper_local_chores",
          DEFAULT_CHORES.map((c, i) => ({ id: `default-${i}`, ...c })),
        );
        const next = local.filter((c) => c.id !== id);
        setLocalItem("peacekeeper_local_chores", next);
        setLocalChores(next);
      }
    },
    onSuccess: () => {
      toast("Chore hata diya gaya 🗑️");
      qc.invalidateQueries({ queryKey: ["chores"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSpinFinish(chore: ChoreItem) {
    const friendObj = friends.find((f) => f.id === selectedFriendId);
    const assignedName =
      selectedFriendId === "sab"
        ? "Poori gang (Random Lucky Winner)"
        : selectedFriendId === "me"
          ? "Tumhari baari (Moye Moye)"
          : (friendObj?.name ?? "Roommate");

    setWinnerResult({ chore, assignedFriend: assignedName });
  }

  const shareText = winnerResult
    ? `🚨 HOSTEL ROULETTE KA FAISLA 🚨\nKaam: ${winnerResult.chore.emoji} ${winnerResult.chore.label}\nKisko karna hai: ${winnerResult.assignedFriend} 🫵\nPeacekeeper Court ke faisle ko challenge nahi kiya ja sakta! ⚖️`
    : "";

  return (
    <div>
      <PageHeader
        kicker="Roommate Fun"
        title="Chores Roulette"
        sub="Ladaai band, chakra shuru! Spin karo aur kismat par chhod do ki aaj jhaadu kaun lagayega ya paani kaun layega."
        sticker="🎡"
      />

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: Interactive Wheel */}
        <div className="sticker-lg flex flex-col items-center justify-center p-6 bg-secondary/30">
          <div className="mb-4 w-full flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Kiska faisla ho raha hai?
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFriendId("sab")}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition-transform",
                  selectedFriendId === "sab"
                    ? "border-ink bg-ink text-ink-foreground shadow-sticker-sm"
                    : "border-transparent bg-muted",
                )}
              >
                👥 Random
              </button>
              <button
                type="button"
                onClick={() => setSelectedFriendId("me")}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition-transform",
                  selectedFriendId === "me"
                    ? "border-ink bg-ink text-ink-foreground shadow-sticker-sm"
                    : "border-transparent bg-muted",
                )}
              >
                🙋 Main
              </button>
              {friends.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFriendId(f.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-bold transition-transform",
                    selectedFriendId === f.id
                      ? "border-ink bg-ink text-ink-foreground shadow-sticker-sm"
                      : "border-transparent bg-muted",
                  )}
                >
                  {f.emoji} {f.name}
                </button>
              ))}
            </div>
          </div>

          <RouletteWheel chores={activeChores} onFinish={handleSpinFinish} />
        </div>

        {/* Right: Customize Chores List */}
        <div className="space-y-6">
          <div className="sticker-lg p-6 space-y-4">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Dices className="h-6 w-6 text-primary" /> Chores Customize Karo
            </h2>
            <p className="text-xs text-muted-foreground">
              Apne room ke mutabiq chores add ya remove karo. Wheel turant update hoga!
            </p>

            {/* Add Chore Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addChore.mutate();
              }}
              className="space-y-3 rounded-xl border-2 border-dashed border-ink p-3 bg-muted/60"
            >
              <div className="flex gap-2">
                <Input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-14 text-center text-xl"
                  maxLength={4}
                  title="Emoji"
                />
                <Input
                  placeholder="e.g. Canteen se Cold Drink lao"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 font-medium"
                />
                <Button type="submit" disabled={addChore.isPending}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </form>

            {/* Active Chores List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {activeChores.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm font-bold shadow-sticker-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <span>{c.label}</span>
                  </span>
                  {activeChores.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteChore.mutate(c.id)}
                      aria-label="Remove chore"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Result Modal */}
      {winnerResult && (
        <Dialog open={Boolean(winnerResult)} onOpenChange={() => setWinnerResult(null)}>
          <DialogContent className="sticker-lg max-w-sm border-2 border-ink bg-card p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-foreground">
                🎉 FAISLA HO GAYA!
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground">
                Kismat ka chakra ruk gaya hai.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border-4 border-ink bg-secondary p-5 shadow-sticker-lg animate-pop">
                <span className="text-6xl animate-wiggle block">{winnerResult.chore.emoji}</span>
                <p className="mt-3 text-2xl font-black text-foreground">
                  {winnerResult.chore.label}
                </p>
                <div className="mt-2 inline-block rounded-full border-2 border-ink bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">
                  Zimmedaari: {winnerResult.assignedFriend} 🫵
                </div>
              </div>

              <p className="text-xs font-bold text-muted-foreground">
                Hostel Niyam: Roulette ke faisle ko challenge karne par CIBIL mein 50 pts katenge!
                😂
              </p>

              <div className="flex gap-2">
                <Button asChild variant="whatsapp" className="flex-1 font-bold shadow-sticker-sm">
                  <a href={whatsappLink("", shareText)} target="_blank" rel="noreferrer">
                    <Share2 className="mr-2 h-4 w-4" /> WhatsApp Group pe Daalo
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setWinnerResult(null)}>
                  Done 👍
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
