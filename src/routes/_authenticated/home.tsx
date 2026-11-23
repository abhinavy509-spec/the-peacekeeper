import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Edit3,
  MessageSquare,
  QrCode,
  Trash2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import {
  entriesQuery,
  friendsQuery,
  profileQuery,
  quipSettle,
  type Friend,
  type Entry,
} from "@/lib/data";
import { cibilScore, disputedByFriend, formatINR, netByFriend, totals } from "@/lib/money";
import { cn } from "@/lib/utils";
import { UpiPayModal } from "@/components/UpiPayModal";
import { DisputeModal } from "@/components/DisputeModal";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — The Peacekeeper" },
      { name: "description", content: "Dekho kisne kitna dena hai aur tumne kitna." },
      { property: "og:title", content: "Home — The Peacekeeper" },
      { property: "og:description", content: "Your hostel balances at a glance." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(entriesQuery),
      context.queryClient.ensureQueryData(profileQuery),
    ]),
  component: HomePage,
});

const KIND_LABEL = { debt: "Debt 😬", due: "Due 🤑", split: "Split 🍕" } as const;

function HomePage() {
  const qc = useQueryClient();
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: entries } = useSuspenseQuery(entriesQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const net = netByFriend(entries);
  const disputed = disputedByFriend(entries);
  const t = totals(net);
  const myCibil = cibilScore(entries, "i_owe");
  const byId = Object.fromEntries(friends.map((f) => [f.id, f]));

  // State for UPI Pay modal
  const [payTarget, setPayTarget] = useState<{ friend: Friend; amount: number } | null>(null);

  // State for Dispute modal
  const [disputeTarget, setDisputeTarget] = useState<{
    id: string;
    amount: number;
    note: string;
    friendName: string;
  } | null>(null);

  // State for editing own UPI ID
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [myUpiInput, setMyUpiInput] = useState(profile?.upi_id ?? "");

  const updateProfileUpi = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase
        .from("profiles")
        .update({ upi_id: myUpiInput.trim() })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("UPI ID update ho gaya! Ab sab scan & pay kar sakte hai ✨");
      setIsEditingUpi(false);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settleFriend = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase
        .from("entries")
        .update({ settled: true })
        .eq("friend_id", friendId)
        .eq("settled", false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(quipSettle());
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEntry = useMutation({
    mutationFn: async ({ id, settled }: { id: string; settled: boolean }) => {
      const { error } = await supabase.from("entries").update({ settled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });

  const confirmEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entries").update({ status: "confirmed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry confirm ho gayi! 'Sahi Hai 👍' 🤝");
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDispute = async (id: string, reason: string) => {
    const entryObj = entries.find((e) => e.id === id);
    const { error } = await supabase
      .from("entries")
      .update({ status: "disputed", dispute_reason: reason })
      .eq("id", id);
    if (error) throw error;

    // Send dispute notice to the friend if linked
    const friend = friends.find((f) => f.id === entryObj?.friend_id);
    if (friend?.friend_user_id && profile) {
      await supabase.from("notices").insert({
        sender_id: profile.id,
        receiver_id: friend.friend_user_id,
        type: "dispute",
        amount: entryObj ? Number(entryObj.amount) : null,
        entry_id: id,
        message: `${profile.display_name} ne entry dispute ki: "${reason}" 🚩`,
      });
    }

    qc.invalidateQueries({ queryKey: ["entries"] });
    qc.invalidateQueries({ queryKey: ["notices"] });
  };

  const resolveDispute = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entries")
        .update({ status: "confirmed", dispute_reason: "" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dispute sulajh gaya! Entry wapas active hai ✨");
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast("Entry uda di 🗑️ Sabooth mitaa diya!");
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  const mood =
    t.net > 0
      ? { emoji: "🤑", line: "Duniya tumhari karzdaar hai. Ambani vibes!" }
      : t.net < 0
        ? { emoji: "🥲", line: "Thoda udhaar chuka do, izzat badhegi." }
        : { emoji: "😇", line: "Sab barabar. Ekdum shaant hostel life." };

  const balances = friends
    .map((f) => ({ friend: f, amount: net[f.id] ?? 0, disputedAmt: disputed[f.id] ?? 0 }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  return (
    <div>
      <PageHeader
        kicker="Home"
        title={`Kya scene hai${profile ? `, ${profile.display_name}` : ""}?`}
        sub={mood.line}
        sticker={mood.emoji}
      >
        <div className="flex gap-2">
          <Button asChild size="lg">
            <Link to="/add">➕ Naya hisaab</Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Tumhe milne hai" value={formatINR(t.toGet)} emoji="📥" tone="gain" />
        <StatCard label="Tumhe dene hai" value={formatINR(t.toGive)} emoji="📤" tone="loss" />
        <StatCard
          label="Net scene"
          value={`${t.net < 0 ? "−" : t.net > 0 ? "+" : ""}${formatINR(t.net)}`}
          emoji="🧮"
          tone="ink"
        />
      </div>

      {/* CIBIL Score & UPI Setting Bar */}
      <div className="sticker mt-5 flex flex-wrap items-center justify-between gap-4 bg-secondary p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bob">📊</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Tumhara Roommate CIBIL</p>
            <p className="font-display text-2xl font-extrabold">
              {myCibil.score} <span className="text-base">· {myCibil.badge}</span>
            </p>
          </div>
        </div>

        <div className="h-3 w-full max-w-xs overflow-hidden rounded-full border-2 border-ink bg-card">
          <div
            className="h-full bg-primary"
            style={{ width: `${((myCibil.score - 300) / 600) * 100}%` }}
          />
        </div>

        {/* UPI ID Pill */}
        <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold">
          <QrCode className="h-4 w-4 text-primary" />
          {isEditingUpi ? (
            <div className="flex items-center gap-1">
              <Input
                value={myUpiInput}
                onChange={(e) => setMyUpiInput(e.target.value)}
                placeholder="tumhara@upi"
                className="h-7 w-36 text-xs font-mono"
              />
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => updateProfileUpi.mutate()}
                disabled={updateProfileUpi.isPending}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs"
                onClick={() => setIsEditingUpi(false)}
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>
                UPI:{" "}
                <span className="font-mono text-primary">{profile?.upi_id || "Set nahi hai"}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMyUpiInput(profile?.upi_id ?? "");
                  setIsEditingUpi(true);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Edit UPI ID"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Friend-wise Ledger */}
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Dost-wise hisaab</h2>
          {friends.length === 0 ? (
            <EmptyState
              sticker="🦗"
              title="Koi dost hi nahi?"
              sub="Pehle apne roomies aur wing-mates add karo, phir unka hisaab rakhte hai."
            >
              <Button asChild>
                <Link to="/friends">👯 Dost add karo</Link>
              </Button>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {balances.map(({ friend, amount, disputedAmt }) => (
                <li key={friend.id} className="sticker flex flex-wrap items-center gap-4 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-accent text-2xl">
                    {friend.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-bold">
                      {friend.name}
                      {friend.friend_user_id && (
                        <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[9px] font-black uppercase">
                          ⚡ App
                        </span>
                      )}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        amount > 0 && "text-gain",
                        amount < 0 && "text-loss",
                        amount === 0 && "text-muted-foreground",
                      )}
                    >
                      {amount > 0
                        ? `Tumhe ${formatINR(amount)} dega 🤑`
                        : amount < 0
                          ? `Tum ${formatINR(Math.abs(amount))} doge 😬`
                          : "Sab barabar ✌️"}
                    </p>
                    {disputedAmt > 0 && (
                      <p className="text-[11px] font-bold text-destructive">
                        🚩 {formatINR(disputedAmt)} case pending (frozen)
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pay Button for negative balance (Scan & Settle) */}
                    {amount < 0 && (
                      <Button
                        size="sm"
                        className="bg-loss font-bold text-loss-foreground shadow-sticker-sm hover:bg-loss/90"
                        onClick={() => setPayTarget({ friend, amount })}
                      >
                        💸 Pay {formatINR(Math.abs(amount))}
                      </Button>
                    )}

                    {amount > 0 && (
                      <Button asChild variant="secondary" size="sm">
                        <Link to="/court" search={{ friend: friend.id }}>
                          ⚖️ Court
                        </Link>
                      </Button>
                    )}

                    <Button asChild variant="outline" size="sm">
                      <Link to="/chat" search={{ friend: friend.id }}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {amount !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => settleFriend.mutate(friend.id)}
                        disabled={settleFriend.isPending}
                      >
                        🤝 Barabar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Kaand / Ledger Entries */}
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Recent kaand</h2>
          {entries.length === 0 ? (
            <EmptyState
              sticker="📒"
              title="Khaata khaali hai"
              sub="Abhi tak koi udhaar nahi. Ya toh tum saint ho, ya abhi shuru kiya hai."
            />
          ) : (
            <ul className="space-y-2">
              {entries.slice(0, 20).map((e) => {
                const f = byId[e.friend_id];
                const isDisputed = e.status === "disputed";
                const isPending = e.status === "pending";

                return (
                  <li
                    key={e.id}
                    className={cn(
                      "sticker flex flex-wrap items-center gap-3 p-3 transition-colors",
                      e.settled && "opacity-55",
                      isDisputed && "border-destructive bg-loss-soft/30",
                    )}
                  >
                    <span className="text-2xl">{f?.emoji ?? "❔"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-bold">
                          {e.direction === "they_owe"
                            ? `${f?.name ?? "?"} → tum`
                            : `Tum → ${f?.name ?? "?"}`}
                        </p>
                        <span className="rounded-md border border-ink/30 bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                          {KIND_LABEL[e.kind as keyof typeof KIND_LABEL]}
                        </span>

                        {isDisputed && (
                          <span className="rounded bg-destructive text-destructive-foreground px-1.5 py-0.5 text-[10px] font-black uppercase">
                            🚩 Jhooth Hai!
                          </span>
                        )}

                        {isPending && !e.settled && (
                          <span className="rounded bg-yellow-400/90 text-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                            ⏳ Review
                          </span>
                        )}

                        {e.proof_url && (
                          <button
                            type="button"
                            onClick={() => alert(`🧾 Proof / Ref Note:\n${e.proof_url}`)}
                            className="rounded border border-primary/50 bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold"
                          >
                            🧾 Bill
                          </button>
                        )}
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {e.note || "bina note ke 🤷"}
                        {isDisputed && e.dispute_reason
                          ? ` · Reason: "${e.dispute_reason}"`
                          : ""} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "font-display font-bold",
                        e.settled
                          ? "line-through opacity-60"
                          : isDisputed
                            ? "text-muted-foreground line-through decoration-destructive"
                            : e.direction === "they_owe"
                              ? "text-gain"
                              : "text-loss",
                      )}
                    >
                      {formatINR(Number(e.amount))}
                    </span>

                    {/* Dispute & Confirm Controls for linked entries */}
                    {!e.settled && (
                      <div className="flex items-center gap-1">
                        {isDisputed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-bold"
                            onClick={() => resolveDispute.mutate(e.id)}
                            disabled={resolveDispute.isPending}
                          >
                            Suljhao 🤝
                          </Button>
                        ) : (
                          <>
                            {isPending && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-1.5 text-xs text-gain hover:bg-gain-soft"
                                onClick={() => confirmEntry.mutate(e.id)}
                                title="Sahi Hai (Confirm)"
                              >
                                👍
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-1.5 text-xs text-loss hover:bg-loss-soft"
                              onClick={() =>
                                setDisputeTarget({
                                  id: e.id,
                                  amount: Number(e.amount),
                                  note: e.note,
                                  friendName: f?.name ?? "Dost",
                                })
                              }
                              title="Jhooth Hai! (Dispute)"
                            >
                              🚩
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={e.settled ? "Wapas pending karo" : "Settled mark karo"}
                      onClick={() => toggleEntry.mutate({ id: e.id, settled: !e.settled })}
                    >
                      <Check className={cn(e.settled && "text-gain")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete entry"
                      onClick={() => deleteEntry.mutate(e.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Pay Modal */}
      {payTarget && (
        <UpiPayModal
          isOpen={Boolean(payTarget)}
          onClose={() => setPayTarget(null)}
          friendName={payTarget.friend.name}
          phone={payTarget.friend.phone}
          amount={payTarget.amount}
          onSettle={() => settleFriend.mutate(payTarget.friend.id)}
        />
      )}

      {/* Dispute Modal */}
      {disputeTarget && (
        <DisputeModal
          isOpen={Boolean(disputeTarget)}
          onClose={() => setDisputeTarget(null)}
          entry={disputeTarget}
          onDispute={handleDispute}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
  tone,
}: {
  label: string;
  value: string;
  emoji: string;
  tone: "gain" | "loss" | "ink";
}) {
  return (
    <div
      className={cn(
        "sticker-lg relative overflow-hidden p-6",
        tone === "gain" && "bg-gain-soft",
        tone === "loss" && "bg-loss-soft",
        tone === "ink" && "bg-ink text-ink-foreground",
      )}
    >
      <p className="text-sm font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 font-display text-4xl font-extrabold">{value}</p>
      <span className="absolute -right-2 -top-2 text-6xl opacity-90 animate-wiggle">{emoji}</span>
    </div>
  );
}
