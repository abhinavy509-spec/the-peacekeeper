import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Dices } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { entriesQuery, friendsQuery } from "@/lib/data";
import { formatINR, netByFriend } from "@/lib/money";
import { generateMessage, normalizePhone, TONES, whatsappLink, type Tone } from "@/lib/court";
import { cn } from "@/lib/utils";
import { BullshitMeter } from "@/components/BullshitMeter";
import { calcBus } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/court")({
  validateSearch: (s: Record<string, unknown>): { friend?: string } =>
    typeof s["friend"] === "string" ? { friend: s["friend"] } : {},
  head: () => ({
    meta: [
      { title: "Roommate Court — The Peacekeeper" },
      { name: "description", content: "Send funny Hinglish WhatsApp reminders to friends who owe you." },
      { property: "og:title", content: "Roommate Court — The Peacekeeper" },
      { property: "og:description", content: "Excuses meet their match. Kanpuriya Chacha is watching." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(entriesQuery),
    ]),
  component: CourtPage,
});

function CourtPage() {
  const search = Route.useSearch();
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: entries } = useSuspenseQuery(entriesQuery);
  const net = netByFriend(entries);

  const [friendId, setFriendId] = useState<string | null>(search.friend ?? null);
  const [tone, setTone] = useState<Tone>("chacha");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const friend = friends.find((f) => f.id === friendId) ?? null;
  const owed = friend ? Math.max(net[friend.id] ?? 0, 0) : 0;
  const amt = Number(amount);

  // Pre-fill the amount from the balance when a friend is picked.
  useEffect(() => {
    if (friend && owed > 0) setAmount(String(owed));
  }, [friendId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (friend && amt > 0) setMessage(generateMessage(tone, friend.name, amt));
    else setMessage("");
  }, [tone, friendId, amount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => calcBus.subscribe((n) => setAmount(String(n))), []);

  const reroll = () => friend && amt > 0 && setMessage((m) => generateMessage(tone, friend.name, amt, Math.random, m));

  if (friends.length === 0) {
    return (
      <div>
        <PageHeader kicker="Court" title="Roommate Court" sticker="⚖️" />
        <EmptyState sticker="👨‍⚖️" title="Court mein koi mujrim nahi" sub="Pehle dost add karo, phir case daalo.">
          <Button asChild>
            <Link to="/friends">👯 Dost add karo</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const sorted = [...friends].sort((a, b) => (net[b.id] ?? 0) - (net[a.id] ?? 0));
  const hasPhone = friend ? Boolean(normalizePhone(friend.phone)) : false;

  return (
    <div>
      <PageHeader
        kicker="Roommate Court"
        title="Excuses meet their match"
        sub="Mujrim chuno, judge chuno, amount daalo. Baaki kaam humara funny message karega — seedha WhatsApp pe."
        sticker="⚖️"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-7">
          <section>
            <h2 className="mb-3 text-lg font-extrabold">1. Mujrim kaun hai? 🫵</h2>
            <div className="flex flex-wrap gap-2">
              {sorted.map((f) => {
                const v = net[f.id] ?? 0;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFriendId(f.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-left hover:animate-shake",
                      friendId === f.id ? "bg-ink text-ink-foreground shadow-sticker-sm" : "bg-card",
                    )}
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <span>
                      <span className="block text-sm font-bold leading-tight">{f.name}</span>
                      <span className="block text-[11px] font-semibold opacity-70">
                        {v > 0 ? `${formatINR(v)} pending` : "kuch pending nahi"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold">2. Judge ka tone 🎭</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "sticker p-4 text-left transition-all hover:animate-shake",
                    tone === t.id ? "bg-secondary shadow-sticker-lg -translate-y-1" : "",
                  )}
                >
                  <span className="text-4xl">{t.emoji}</span>
                  <span className="mt-2 block font-display font-extrabold leading-tight">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.blurb}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="max-w-xs space-y-2">
            <Label htmlFor="camount" className="text-lg font-extrabold">
              3. Kitna wasool karna hai? 💰
            </Label>
            <Input
              id="camount"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="₹ amount"
              className="h-14 font-display text-2xl font-bold md:text-2xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </section>
        </div>

        <section className="sticker-lg h-fit overflow-hidden">
          <div className="flex items-center gap-3 border-b-2 border-ink bg-ink px-5 py-3 text-ink-foreground">
            <span className="text-2xl">{friend?.emoji ?? "❔"}</span>
            <div className="flex-1">
              <p className="font-bold leading-tight">{friend?.name ?? "Koi mujrim nahi chuna"}</p>
              <p className="text-xs opacity-70">{friend?.phone || "number nahi hai"}</p>
            </div>
            <span className="text-xl">{TONES.find((t) => t.id === tone)?.emoji}</span>
          </div>
          <div className="min-h-[240px] bg-accent p-5">
            {message ? (
              <div className="ml-auto max-w-[90%] animate-pop rounded-2xl rounded-br-sm border-2 border-ink bg-gain-soft p-4 shadow-sticker-sm">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message}</p>
                <p className="mt-2 text-right text-[10px] font-bold text-muted-foreground">✓✓ abhi</p>
              </div>
            ) : (
              <div className="grid h-[200px] place-items-center text-center">
                <p className="font-hand text-2xl text-muted-foreground">
                  Mujrim chuno aur amount daalo,
                  <br />
                  message yahan banega 👨‍⚖️
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 border-t-2 border-ink p-4">
            <Button variant="outline" onClick={reroll} disabled={!message}>
              <Dices /> Naya message
            </Button>
            <Button
              variant="outline"
              disabled={!message}
              onClick={async () => {
                await navigator.clipboard.writeText(message);
                toast.success("Copy ho gaya 📋");
              }}
            >
              <Copy /> Copy
            </Button>
            <Button asChild variant="whatsapp" className={cn("flex-1", !message && "pointer-events-none opacity-50")}>
              <a
                href={message && friend ? whatsappLink(friend.phone, message) : "#"}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!message}
                onClick={() => message && toast("Notice bhej diya gaya ⚖️ Ab dekhte hai kya bahana aata hai")}
              >
                💬 WhatsApp pe bhejo
              </a>
            </Button>
          </div>
          {friend && !hasPhone && (
            <p className="border-t-2 border-dashed border-ink/40 px-4 py-3 text-xs text-muted-foreground">
              ⚠️ {friend.name} ka number save nahi hai — WhatsApp khulega, contact tumhe khud chunna padega.
            </p>
          )}
        </section>
      </div>

      <BullshitMeter friend={friend} amount={amt} tone={tone} />
    </div>
  );
}
