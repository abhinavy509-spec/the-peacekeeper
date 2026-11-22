import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { entriesQuery, friendsQuery, profileQuery, quipSettle } from "@/lib/data";
import { cibilScore, formatINR, netByFriend, totals } from "@/lib/money";
import { cn } from "@/lib/utils";

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
  const t = totals(net);
  const myCibil = cibilScore(entries, "i_owe");
  const byId = Object.fromEntries(friends.map((f) => [f.id, f]));

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
    .map((f) => ({ friend: f, amount: net[f.id] ?? 0 }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  return (
    <div>
      <PageHeader
        kicker="Home"
        title={`Kya scene hai${profile ? `, ${profile.display_name}` : ""}?`}
        sub={mood.line}
        sticker={mood.emoji}
      >
        <Button asChild size="lg">
          <Link to="/add">➕ Naya hisaab</Link>
        </Button>
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

      <div className="sticker mt-5 flex flex-wrap items-center gap-4 bg-secondary p-4">
        <span className="text-4xl animate-bob">📊</span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider">Tumhara Roommate CIBIL</p>
          <p className="font-display text-2xl font-extrabold">
            {myCibil.score} <span className="text-base">· {myCibil.badge}</span>
          </p>
        </div>
        <div className="h-3 w-full max-w-xs overflow-hidden rounded-full border-2 border-ink bg-card">
          <div className="h-full bg-primary" style={{ width: `${((myCibil.score - 300) / 600) * 100}%` }} />
        </div>
        <p className="w-full text-xs font-medium sm:w-auto">Time pe udhaar chukao, score badhao 📈</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
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
              {balances.map(({ friend, amount }) => (
                <li key={friend.id} className="sticker flex items-center gap-4 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-accent text-2xl">
                    {friend.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{friend.name}</p>
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
                          ? `Tum ${formatINR(amount)} doge 😬`
                          : "Sab barabar ✌️"}
                    </p>
                  </div>
                  {amount !== 0 && (
                    <div className="flex gap-2">
                      {amount > 0 && (
                        <Button asChild variant="secondary" size="sm">
                          <Link to="/court" search={{ friend: friend.id }}>
                            ⚖️ Court
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => settleFriend.mutate(friend.id)}
                        disabled={settleFriend.isPending}
                      >
                        🤝 Barabar
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

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
              {entries.slice(0, 15).map((e) => {
                const f = byId[e.friend_id];
                return (
                  <li
                    key={e.id}
                    className={cn("sticker flex items-center gap-3 p-3", e.settled && "opacity-55")}
                  >
                    <span className="text-2xl">{f?.emoji ?? "❔"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {e.direction === "they_owe" ? `${f?.name ?? "?"} → tum` : `Tum → ${f?.name ?? "?"}`}
                        <span className="ml-2 rounded-md border border-ink/30 bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                          {KIND_LABEL[e.kind as keyof typeof KIND_LABEL]}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.note || "bina note ke 🤷"} ·{" "}
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-display font-bold",
                        e.settled ? "line-through" : e.direction === "they_owe" ? "text-gain" : "text-loss",
                      )}
                    >
                      {formatINR(Number(e.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={e.settled ? "Wapas pending karo" : "Settled mark karo"}
                      onClick={() => toggleEntry.mutate({ id: e.id, settled: !e.settled })}
                    >
                      <Check />
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
