import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { EmptyState, PageHeader } from "@/components/PageHeader";
import { entriesQuery, friendsQuery } from "@/lib/data";
import { cibilScore, formatINR, netByFriend, tierFor, type Tier } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Tier List — The Peacekeeper" },
      { name: "description", content: "Hostel tier list: who owes you the most, and who you owe the most." },
      { property: "og:title", content: "Tier List — The Peacekeeper" },
      { property: "og:description", content: "Certified Kanjoos se Ambani of the Hostel tak." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(entriesQuery),
    ]),
  component: LeaderboardPage,
});

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];
const TIER_BG: Record<Tier, string> = {
  S: "bg-tier-s",
  A: "bg-tier-a",
  B: "bg-tier-b",
  C: "bg-tier-c",
  D: "bg-tier-d",
};
const LABELS = {
  owes: {
    S: "Certified Kanjoos 🪙",
    A: "EMI pe zindagi 💳",
    B: "Kal pakka wale 🤞",
    C: "Chillar chor 🍬",
    D: "Ambani of the Hostel 👑",
  },
  lent: {
    S: "Tumhara personal bank 🏦",
    A: "Sahukaar ji 🧔",
    B: "Udhaar-daata 🙏",
    C: "Chhota-mota lender 🍪",
    D: "Koi lena-dena nahi 😇",
  },
} as const;

function LeaderboardPage() {
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: entries } = useSuspenseQuery(entriesQuery);
  const [view, setView] = useState<"owes" | "lent" | "cibil">("owes");
  const net = netByFriend(entries);

  const rows = friends.map((f) => {
    const v = net[f.id] ?? 0;
    return { friend: f, amount: view === "lent" ? Math.max(-v, 0) : Math.max(v, 0) };
  });
  const max = Math.max(0, ...rows.map((r) => r.amount));
  const ranked = [...rows].filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <PageHeader
        kicker="Leaderboard"
        title="Hostel Tier List"
        sub="Kaun hai asli kanjoos, aur kaun hai tumhara sahukaar? Data jhooth nahi bolta 📊"
        sticker="🏆"
      />

      <div className="mb-6 inline-grid grid-cols-3 gap-2 rounded-2xl border-2 border-ink bg-card p-1.5 shadow-sticker">
        <button
          type="button"
          onClick={() => setView("owes")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-bold",
            view === "owes" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          🫵 Sabse zyada dues
        </button>
        <button
          type="button"
          onClick={() => setView("lent")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-bold",
            view === "lent" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          🏦 Sabse zyada debt
        </button>
        <button
          type="button"
          onClick={() => setView("cibil")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-bold",
            view === "cibil" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          📊 CIBIL score
        </button>
      </div>

      {view === "cibil" && friends.length > 0 ? (
        <CibilBoard
          rows={friends
            .map((f) => ({ friend: f, ...cibilScore(entries.filter((e) => e.friend_id === f.id), "they_owe") }))
            .sort((a, b) => b.score - a.score)}
        />
      ) : friends.length === 0 ? (
        <EmptyState sticker="🏟️" title="Stadium khaali hai" sub="Dost add karo aur hisaab likho, tab ranking banegi." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="sticker-lg overflow-hidden">
            {TIERS.map((tier) => {
              const people = rows.filter((r) => tierFor(r.amount, max) === tier);
              return (
                <div key={tier} className="grid grid-cols-[92px_1fr] border-b-2 border-ink last:border-b-0">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center border-r-2 border-ink p-2 text-center",
                      TIER_BG[tier],
                    )}
                  >
                    <span className="font-display text-4xl font-extrabold text-ink">{tier}</span>
                    <span className="text-[10px] font-bold leading-tight text-ink">{LABELS[view === "lent" ? "lent" : "owes"][tier]}</span>
                  </div>
                  <div className="flex min-h-[92px] flex-wrap items-center gap-2 p-3">
                    {people.length === 0 ? (
                      <span className="font-hand text-lg text-muted-foreground">yahan koi nahi… abhi tak 👀</span>
                    ) : (
                      people.map(({ friend, amount }) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-3 py-2 shadow-sticker-sm hover:animate-shake"
                        >
                          <span className="text-2xl">{friend.emoji}</span>
                          <span>
                            <span className="block text-sm font-bold leading-tight">{friend.name}</span>
                            {amount > 0 && (
                              <span className="block text-xs font-semibold text-muted-foreground">
                                {formatINR(amount)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-extrabold">
              {view === "owes" ? "Hall of Shame 🫣" : "Hall of Karz 🙇"}
            </h2>
            {ranked.length === 0 ? (
              <EmptyState
                sticker={view === "owes" ? "😇" : "🕊️"}
                title={view === "owes" ? "Koi kuch nahi deta tumhe" : "Tum kisi ke karzdaar nahi"}
                sub={view === "owes" ? "Ya toh sab imaandaar hai, ya tum dete hi nahi 😂" : "Bilkul clean record. Respect 🫡"}
              />
            ) : (
              <ol className="space-y-3">
                {ranked.map((r, i) => (
                  <li key={r.friend.id} className="sticker flex items-center gap-4 p-4">
                    <span className="w-8 text-center font-display text-2xl font-extrabold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span className="text-2xl">{r.friend.emoji}</span>
                    <span className="flex-1 font-bold">{r.friend.name}</span>
                    <span className={cn("font-display text-lg font-extrabold", view === "owes" ? "text-gain" : "text-loss")}>
                      {formatINR(r.amount)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CibilBoard({
  rows,
}: {
  rows: Array<{ friend: { id: string; name: string; emoji: string }; score: number; badge: string }>;
}) {
  return (
    <div className="sticker-lg p-6">
      <p className="mb-5 text-sm text-muted-foreground">
        300 se 900 tak. Time pe paise lautao toh score upar, "kal pakka" bolte raho toh neeche 📉
      </p>
      <ul className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.friend.id} className="grid grid-cols-[32px_40px_1fr_auto] items-center gap-3">
            <span className="font-display text-lg font-extrabold">#{i + 1}</span>
            <span className="text-3xl">{r.friend.emoji}</span>
            <div>
              <p className="font-bold">
                {r.friend.name} <span className="text-xs font-semibold text-muted-foreground">· {r.badge}</span>
              </p>
              <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-ink bg-muted">
                <div
                  className={cn(
                    "h-full",
                    r.score >= 800 ? "bg-gain" : r.score >= 650 ? "bg-tier-c" : r.score >= 500 ? "bg-secondary" : "bg-primary",
                  )}
                  style={{ width: `${((r.score - 300) / 600) * 100}%` }}
                />
              </div>
            </div>
            <span className="font-display text-2xl font-extrabold">{r.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
