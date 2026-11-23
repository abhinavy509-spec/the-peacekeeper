import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, Users, Wallet, Receipt, Trash2 } from "lucide-react";

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
import { PageHeader, EmptyState } from "@/components/PageHeader";
import {
  gallaQuery,
  getLocalItem,
  profileQuery,
  setLocalItem,
  friendsQuery,
  type Galla,
  type GallaEntry,
  type GallaMember,
} from "@/lib/data";
import { formatINR, round2 } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/galla")({
  head: () => ({
    meta: [
      { title: "Room ka Galla — The Peacekeeper" },
      {
        name: "description",
        content: "Communal petty cash ledger for room expenses like Wi-Fi, water jars, and broom.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(gallaQuery),
      context.queryClient.ensureQueryData(profileQuery),
      context.queryClient.ensureQueryData(friendsQuery),
    ]),
  component: GallaPage,
});

function GallaPage() {
  const qc = useQueryClient();
  const { data: gallaData } = useSuspenseQuery(gallaQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: friends } = useSuspenseQuery(friendsQuery);

  const { galla: gallaList, entries: gallaEntries, members } = gallaData;
  const currentGalla = gallaList[0] ?? null;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState<"contribute" | "expense" | null>(null);

  // Form states
  const [newGallaName, setNewGallaName] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");

  // Create Galla
  const createGalla = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Not authenticated");
      const name = newGallaName.trim() || "Room Petty Cash 🏺";
      try {
        const { data, error } = await supabase
          .from("galla")
          .insert({ name, owner_id: profile.id })
          .select()
          .single();
        if (error) throw error;

        // Add self as member
        await supabase.from("galla_members").insert({
          galla_id: data.id,
          user_id: profile.id,
        });
      } catch {
        const local = getLocalItem<{
          galla: Galla[];
          entries: GallaEntry[];
          members: GallaMember[];
        }>("peacekeeper_local_galla", {
          galla: [],
          entries: [],
          members: [],
        });
        local.galla.unshift({
          id: crypto.randomUUID(),
          name,
          owner_id: profile.id,
          created_at: new Date().toISOString(),
        } as Galla);
        setLocalItem("peacekeeper_local_galla", local);
      }
    },
    onSuccess: () => {
      toast.success("Galla ban gaya! Ab sab paise pool karo 🏺");
      setShowCreateModal(false);
      setNewGallaName("");
      qc.invalidateQueries({ queryKey: ["galla"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add Entry (contribute or expense)
  const addGallaEntry = useMutation({
    mutationFn: async () => {
      if (!currentGalla || !showEntryModal || !profile) return;
      const amt = Number(entryAmount);
      if (!(amt > 0)) throw new Error("Valid amount daalo");

      const entryPayload = {
        galla_id: currentGalla.id,
        user_id: profile.id,
        amount: round2(amt),
        note: entryNote.trim() || (showEntryModal === "contribute" ? "Cash pool" : "Room kharcha"),
        type: showEntryModal,
      };

      try {
        const { error } = await supabase.from("galla_entries").insert(entryPayload);
        if (error) throw error;
      } catch {
        const local = getLocalItem<{
          galla: Galla[];
          entries: GallaEntry[];
          members: GallaMember[];
        }>("peacekeeper_local_galla", {
          galla: [],
          entries: [],
          members: [],
        });
        local.entries.unshift({
          id: crypto.randomUUID(),
          ...entryPayload,
          created_at: new Date().toISOString(),
        } as GallaEntry);
        setLocalItem("peacekeeper_local_galla", local);
      }
    },
    onSuccess: () => {
      toast.success(
        showEntryModal === "contribute"
          ? "Galle mein paise jama ho gaye! 📥"
          : "Kharcha darj ho gaya! 📤",
      );
      setShowEntryModal(null);
      setEntryAmount("");
      setEntryNote("");
      qc.invalidateQueries({ queryKey: ["galla"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete transaction
  const deleteGallaEntry = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from("galla_entries").delete().eq("id", id);
        if (error) throw error;
      } catch {
        const local = getLocalItem<{
          galla: Galla[];
          entries: GallaEntry[];
          members: GallaMember[];
        }>("peacekeeper_local_galla", {
          galla: [],
          entries: [],
          members: [],
        });
        local.entries = local.entries.filter((e: GallaEntry) => e.id !== id);
        setLocalItem("peacekeeper_local_galla", local);
      }
    },
    onSuccess: () => {
      toast("Transaction hata diya gaya 🗑️");
      qc.invalidateQueries({ queryKey: ["galla"] });
    },
  });

  // Compute metrics for current galla
  const thisEntries = currentGalla
    ? gallaEntries.filter((e) => e.galla_id === currentGalla.id)
    : [];

  const totalContributed = thisEntries
    .filter((e) => e.type === "contribute")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalSpent = thisEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const potBalance = round2(totalContributed - totalSpent);

  return (
    <div>
      <PageHeader
        kicker="Room Fund"
        title="Room ka Galla"
        sub="Communal petty cash pot — Wi-Fi bill, paani ke jar, jhaadu, pocha, aur communal maggi ka hisaab."
        sticker="🏺"
      >
        {!currentGalla ? (
          <Button size="lg" onClick={() => setShowCreateModal(true)}>
            🏺 Naya Galla Shuru Karo
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="lg"
              className="bg-gain font-bold text-gain-foreground hover:bg-gain/90 shadow-sticker-sm"
              onClick={() => setShowEntryModal("contribute")}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" /> Paise Daalo
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="font-bold shadow-sticker-sm"
              onClick={() => setShowEntryModal("expense")}
            >
              <MinusCircle className="mr-1.5 h-4 w-4" /> Kharcha Likho
            </Button>
          </div>
        )}
      </PageHeader>

      {!currentGalla ? (
        <EmptyState
          sticker="🏺"
          title="Abhi koi Galla active nahi hai"
          sub="Apne room ka common galla banao taaki Wi-Fi aur paani ke jar ke time sabko alag-alag na maangna pade."
        >
          <Button size="lg" onClick={() => setShowCreateModal(true)}>
            Room 214 Fund Banao ✍️
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {/* Main Pot Metrics Banner */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sticker-lg relative overflow-hidden bg-secondary p-6">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Galle ka Current Balance 🏺
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold text-foreground">
                {formatINR(potBalance)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {potBalance > 0
                  ? "Bacha hua communal cash 💵"
                  : potBalance < 0
                    ? "Galla deficit mein hai! Paise daalo 🚨"
                    : "Khali galla 🪙"}
              </p>
            </div>

            <div className="sticker-lg relative overflow-hidden bg-gain-soft p-6">
              <p className="text-xs font-black uppercase tracking-wider text-gain">
                Total Pool Hua (Contributed) 📥
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold text-gain">
                {formatINR(totalContributed)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Roommates dwara jama kiya gaya cash
              </p>
            </div>

            <div className="sticker-lg relative overflow-hidden bg-loss-soft p-6">
              <p className="text-xs font-black uppercase tracking-wider text-loss">
                Total Kharcha Hua (Expenses) 📤
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold text-loss">
                {formatINR(totalSpent)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Wi-Fi, Jar, cleaning supplies etc.
              </p>
            </div>
          </div>

          {/* Quick Expense Suggestion Chips */}
          <div className="rounded-2xl border-2 border-ink bg-muted/70 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Aam Hostel Communal Kharcha (Quick Notes) ⚡
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Wi-Fi Recharge 📡",
                "2x Water Jar 💧",
                "Broom / Jhaadu 🧹",
                "All Out / GoodKnight 🦟",
                "Dish Soap 🧼",
                "Night Maggi Bulk 🍜",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setEntryNote(item);
                    setShowEntryModal("expense");
                  }}
                  className="rounded-xl border border-ink bg-card px-3 py-1.5 text-xs font-bold transition-transform hover:-rotate-1 active:scale-95"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger History & Transactions */}
          <div className="sticker-lg space-y-4 p-6">
            <h2 className="text-2xl font-extrabold flex items-center justify-between">
              <span>{currentGalla.name} — Kaand & Hisaab 📜</span>
              <span className="text-xs font-bold text-muted-foreground">
                {thisEntries.length} entries
              </span>
            </h2>

            {thisEntries.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
                Abhi koi transaction nahi hua hai. &quot;Paise Daalo&quot; se shuru karo! 🏺
              </p>
            ) : (
              <div className="divide-y-2 divide-ink/20">
                {thisEntries.map((e) => {
                  const isContribution = e.type === "contribute";
                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-xl border-2 border-ink text-xl",
                            isContribution ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss",
                          )}
                        >
                          {isContribution ? "📥" : "📤"}
                        </span>
                        <div>
                          <p className="font-bold text-sm">
                            {e.note || (isContribution ? "Contribution" : "Kharcha")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isContribution ? "Pool mein jama kiya" : "Common kharcha nikala"} ·{" "}
                            {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "font-display text-lg font-extrabold",
                            isContribution ? "text-gain" : "text-loss",
                          )}
                        >
                          {isContribution ? "+" : "−"}
                          {formatINR(Number(e.amount))}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteGallaEntry.mutate(e.id)}
                          aria-label="Delete galla entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Galla Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sticker-lg max-w-sm border-2 border-ink bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">🏺 Room ka Galla Banao</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Apne room ya flat ka communal petty cash ledger shuru karo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gname">Galle ka Naam</Label>
              <Input
                id="gname"
                placeholder="e.g. Room 214 Petty Cash"
                value={newGallaName}
                onChange={(e) => setNewGallaName(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              className="w-full font-bold"
              onClick={() => createGalla.mutate()}
              disabled={createGalla.isPending}
            >
              {createGalla.isPending ? "Ban raha hai..." : "Galla Shuru Karo 🏺"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Modal (Contribute or Expense) */}
      <Dialog
        open={Boolean(showEntryModal)}
        onOpenChange={(open) => !open && setShowEntryModal(null)}
      >
        <DialogContent className="sticker-lg max-w-sm border-2 border-ink bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
              {showEntryModal === "contribute" ? "📥 Paise Pool Karo" : "📤 Kharcha Note Karo"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {showEntryModal === "contribute"
                ? "Tumne galle mein kitne paise daale?"
                : "Galle se kis cheez ke kitne paise kharch hue?"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="entry-amt">Amount (₹)</Label>
              <Input
                id="entry-amt"
                type="number"
                min="1"
                placeholder="e.g. 200"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                className="font-display text-2xl font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entry-note">Note / Kis cheez ka?</Label>
              <Input
                id="entry-note"
                placeholder={
                  showEntryModal === "contribute" ? "e.g. March pool cash" : "e.g. 2x Water jar"
                }
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              className={cn(
                "w-full font-bold",
                showEntryModal === "contribute"
                  ? "bg-gain text-gain-foreground hover:bg-gain/90"
                  : "bg-loss text-loss-foreground hover:bg-loss/90",
              )}
              onClick={() => addGallaEntry.mutate()}
              disabled={addGallaEntry.isPending}
            >
              {addGallaEntry.isPending ? "Likh rahe hai..." : "Galle mein darj karo ✍️"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
