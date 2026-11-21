import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { friendsQuery, quipAdd, type Friend } from "@/lib/data";
import { computeSplit, formatINR, round2, type Kind } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({
    meta: [
      { title: "Add hisaab — The Peacekeeper" },
      { name: "description", content: "Log a debt, a due, or split a bill with your hostel friends." },
      { property: "og:title", content: "Add hisaab — The Peacekeeper" },
      { property: "og:description", content: "Log a split in seconds." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(friendsQuery),
  component: AddPage,
});

const MODES: Array<{ id: Kind; title: string; emoji: string; sub: string }> = [
  { id: "due", title: "Dues", emoji: "🤑", sub: "Usne mujhse liya — mujhe lene hai" },
  { id: "debt", title: "Debt", emoji: "😬", sub: "Maine usse liya — mujhe dene hai" },
  { id: "split", title: "Split", emoji: "🍕", sub: "Bill sabme baraabar baanto" },
];

const NOTE_CHIPS = ["Chai ☕", "Maggi 🍜", "Printout 🖨️", "Canteen 🍛", "Auto 🛺", "Recharge 📱", "Party 🎉", "Zomato 🛵"];

function AddPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: friends } = useSuspenseQuery(friendsQuery);
  const [mode, setMode] = useState<Kind>("due");
  const [friendId, setFriendId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [payer, setPayer] = useState<string>("me");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const total = Number(amount);
  const splitRows =
    mode === "split" && total > 0 ? computeSplit({ total, payer, friendIds: picked }) : [];
  const headCount = new Set([...picked, ...(payer !== "me" ? [payer] : [])]).size + 1;

  const save = useMutation({
    mutationFn: async () => {
      if (mode === "split") {
        const group_id = crypto.randomUUID();
        const rows = splitRows.map((r) => ({ ...r, kind: "split", note: note.trim(), group_id }));
        const { error } = await supabase.from("entries").insert(rows);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("entries").insert({
          friend_id: friendId!,
          kind: mode,
          direction: mode === "due" ? "they_owe" : "i_owe",
          amount: round2(total),
          note: note.trim(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(quipAdd());
      qc.invalidateQueries({ queryKey: ["entries"] });
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (!(total > 0)) return void toast.error("Amount toh daalo, ₹0 ka udhaar nahi hota 😂");
    if (mode !== "split" && !friendId) return void toast.error("Kiska hisaab hai? Dost choose karo 👆");
    if (mode === "split" && splitRows.length === 0)
      return void toast.error("Split mein kam se kam ek dost chahiye 🤷");
    save.mutate();
  }

  if (friends.length === 0) {
    return (
      <div>
        <PageHeader kicker="Add" title="Naya hisaab" sticker="✍️" />
        <EmptyState sticker="🦗" title="Pehle dost toh add karo" sub="Bina dost ke udhaar kisko doge? Khud ko?">
          <Button asChild>
            <Link to="/friends">👯 Dost add karo</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Add"
        title="Naya hisaab"
        sub="Debt, dues ya split — teen second mein likho, saal bhar yaad rakho."
        sticker="✍️"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "sticker flex items-center gap-3 p-4 text-left transition-all hover:animate-shake",
              mode === m.id ? "bg-secondary shadow-sticker-lg -translate-y-1" : "opacity-80",
            )}
          >
            <span className="text-4xl">{m.emoji}</span>
            <span>
              <span className="block font-display text-xl font-extrabold">{m.title}</span>
              <span className="block text-xs font-medium text-muted-foreground">{m.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="sticker-lg grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="amount">{mode === "split" ? "Total bill (₹)" : "Kitne paise? (₹)"}</Label>
            <Input
              id="amount"
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 120"
              className="h-14 font-display text-2xl font-bold md:text-2xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Kis cheez ka?</Label>
            <Input id="note" placeholder="2 chai, 1 samosa…" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex flex-wrap gap-2 pt-1">
              {NOTE_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNote(c)}
                  className="rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold shadow-sticker-sm hover:animate-shake"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {mode === "split" ? (
            <>
              <div className="space-y-2">
                <Label>Kisne pay kiya? 💳</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip active={payer === "me"} onClick={() => setPayer("me")}>
                    🙋 Maine
                  </Chip>
                  {friends.map((f) => (
                    <Chip key={f.id} active={payer === f.id} onClick={() => setPayer(f.id)}>
                      {f.emoji} {f.name}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kaun kaun tha? (tum toh ho hi)</Label>
                <div className="flex flex-wrap gap-2">
                  {friends.map((f) => (
                    <Chip
                      key={f.id}
                      active={picked.includes(f.id) || payer === f.id}
                      onClick={() =>
                        setPicked((p) => (p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id]))
                      }
                    >
                      {f.emoji} {f.name}
                    </Chip>
                  ))}
                </div>
              </div>
              <SplitPreview rows={splitRows} friends={friends} heads={headCount} total={total} payer={payer} />
            </>
          ) : (
            <div className="space-y-2">
              <Label>{mode === "due" ? "Kisne liya tumse? 🫵" : "Kisse liya tumne? 🙏"}</Label>
              <div className="flex flex-wrap gap-2">
                {friends.map((f) => (
                  <Chip key={f.id} active={friendId === f.id} onClick={() => setFriendId(f.id)}>
                    {f.emoji} {f.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Likh rahe hai… ✍️" : "Khaate mein likho 📒"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 border-ink px-3 py-2 text-sm font-bold transition-all hover:animate-shake",
        active ? "bg-ink text-ink-foreground shadow-sticker-sm" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}

function SplitPreview({
  rows,
  friends,
  heads,
  total,
  payer,
}: {
  rows: ReturnType<typeof computeSplit>;
  friends: Friend[];
  heads: number;
  total: number;
  payer: string;
}) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm text-muted-foreground">
        Amount daalo aur dost choose karo — preview yahan dikhega 👀
      </p>
    );
  }
  const name = (id: string) => friends.find((f) => f.id === id)?.name ?? "?";
  return (
    <div className="rounded-xl border-2 border-ink bg-accent p-4">
      <p className="text-sm font-bold">
        {formatINR(total)} ÷ {heads} log = <span className="text-primary">{formatINR(total / heads)}</span> each
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {payer === "me"
          ? rows.map((r) => (
              <li key={r.friend_id}>
                🫵 {name(r.friend_id)} tumhe <b>{formatINR(r.amount)}</b> dega
              </li>
            ))
          : rows.map((r) => (
              <li key={r.friend_id}>
                🙋 Tum {name(r.friend_id)} ko <b>{formatINR(r.amount)}</b> doge
              </li>
            ))}
      </ul>
    </div>
  );
}
