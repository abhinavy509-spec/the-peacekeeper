import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { entriesQuery, FRIEND_EMOJIS, friendsQuery, pick } from "@/lib/data";
import { cibilScore, formatINR, netByFriend } from "@/lib/money";
import { normalizePhone } from "@/lib/court";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Dost & Peers — The Peacekeeper" },
      { name: "description", content: "Add your roommates and wing-mates with their WhatsApp numbers." },
      { property: "og:title", content: "Dost & Peers — The Peacekeeper" },
      { property: "og:description", content: "Manage the friends you split money with." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(friendsQuery),
      context.queryClient.ensureQueryData(entriesQuery),
    ]),
  component: FriendsPage,
});

const ADD_LINES = [
  "{n} ab official hisaab mein hai 📒",
  "{n} ko add kiya. Ab bach ke dikhaye 😏",
  "Welcome {n}! Udhaar lene se pehle soch lena 🤔",
];

function FriendsPage() {
  const qc = useQueryClient();
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const { data: entries } = useSuspenseQuery(entriesQuery);
  const net = netByFriend(entries);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emoji, setEmoji] = useState(FRIEND_EMOJIS[0]!);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("friends")
        .insert({ name: name.trim(), phone: phone.trim(), emoji });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(pick(ADD_LINES).replace("{n}", name.trim()));
      setName("");
      setPhone("");
      setEmoji(pick(FRIEND_EMOJIS));
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("friends").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast("Dosti khatam, hisaab bhi khatam 💔");
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (name.trim().length < 2) return void toast.error("Naam toh likho bhai 🙄");
    if (phone.trim() && !normalizePhone(phone))
      return void toast.error("Number thoda gadbad lag raha hai 📵 (10 digit daalo)");
    add.mutate();
  }

  return (
    <div>
      <PageHeader
        kicker="Dost & Peers"
        title="Tumhari gang"
        sub="Roomies, wing-mates, canteen buddies — sabko add karo. Number daaloge toh Court se seedha WhatsApp kar paoge."
        sticker="👯"
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="sticker-lg tape h-fit space-y-4 p-6">
          <h2 className="text-2xl font-extrabold">Naya dost ➕</h2>
          <div className="space-y-2">
            <Label htmlFor="fname">Naam</Label>
            <Input id="fname" placeholder="e.g. Rohit (Room 214)" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fphone">WhatsApp number</Label>
            <Input
              id="fphone"
              inputMode="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Inka vibe kya hai?</Label>
            <div className="grid grid-cols-6 gap-2">
              {FRIEND_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  aria-label={`Emoji ${em}`}
                  onClick={() => setEmoji(em)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-xl border-2 text-2xl transition-transform hover:animate-shake",
                    emoji === em ? "border-ink bg-secondary shadow-sticker-sm" : "border-transparent bg-muted",
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={add.isPending}>
            {add.isPending ? "Add ho raha hai…" : "Gang mein daalo 🤝"}
          </Button>
        </form>

        <section>
          {friends.length === 0 ? (
            <EmptyState
              sticker="🧍"
              title="Akele ho kya?"
              sub="Hostel mein koi toh hoga jo tumse chai udhaar leta hai. Usse add karo!"
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {friends.map((f, i) => {
                const amt = net[f.id] ?? 0;
                const cibil = cibilScore(entries.filter((e) => e.friend_id === f.id), "they_owe");
                return (
                  <li
                    key={f.id}
                    className={cn("sticker p-5 transition-transform hover:-rotate-1", i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]")}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-3xl">
                        {f.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-extrabold">{f.name}</p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {f.phone || "number nahi diya"}
                        </p>
                      </div>
                      {confirmId === f.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => remove.mutate(f.id)}>
                            Pakka
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
                            Nahi
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setConfirmId(f.id)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-ink bg-muted px-3 py-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Roommate CIBIL</span>
                      <span className="text-sm font-extrabold">
                        {cibil.score} · {cibil.badge}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-bold",
                        amt > 0 && "border-gain text-gain",
                        amt < 0 && "border-loss text-loss",
                        amt === 0 && "border-ink/30 text-muted-foreground",
                      )}
                    >
                      {amt > 0 ? `Inhe tumhe ${formatINR(amt)} dene hai 🤑` : amt < 0 ? `Tumhe inko ${formatINR(amt)} dene hai 😬` : "Hisaab clean ✨"}
                    </p>
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
