import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rateExcuse } from "@/lib/excuse.functions";
import { QUICK_EXCUSES, type Verdict } from "@/lib/excuse";
import { TONES, whatsappLink, type Tone } from "@/lib/court";
import { formatINR } from "@/lib/money";
import type { Friend } from "@/lib/data";
import { cn } from "@/lib/utils";

const LEVELS = [
  { max: 3, label: "Sach lag raha hai 😇" },
  { max: 6, label: "Thoda masala hai 🌶️" },
  { max: 8, label: "Bakwaas detected 🚨" },
  { max: 10, label: "Pure Bollywood script 🎬" },
];

export function BullshitMeter({
  friend,
  amount,
  tone,
}: {
  friend: Friend | null;
  amount: number;
  tone: Tone;
}) {
  const rate = useServerFn(rateExcuse);
  const [excuse, setExcuse] = useState("");
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState<Verdict | null>(null);

  async function judge(): Promise<void> {
    if (!friend) return void toast.error("Pehle upar se mujrim chuno 🫵");
    if (excuse.trim().length < 2) return void toast.error("Bahana toh likho jo usne diya 🙄");
    setBusy(true);
    setV(null);
    try {
      const res = await rate({
        data: {
          excuse: excuse.trim(),
          friendName: friend.name,
          amount: amount > 0 ? amount : 0,
          judge: tone,
        },
      });
      setV(res);
    } catch {
      toast.error("Judge sahab chai pe gaye hai ☕ Thodi der mein try karo.");
    } finally {
      setBusy(false);
    }
  }

  const score = v?.score ?? 0;
  const angle = -90 + (score / 10) * 180;
  const level = LEVELS.find((l) => score <= l.max) ?? LEVELS[3]!;
  const judgeInfo = TONES.find((t) => t.id === tone);
  const shareText =
    v && friend
      ? `⚖️ ROOMMATE COURT VERDICT\nMujrim: ${friend.name}\nBahana: "${excuse.trim()}"\nBullshit-o-Meter: ${v.score}/10\n${v.verdict}\nSaza: ${v.penalty}${amount > 0 ? `\nBakaya: ${formatINR(amount)}` : ""}`
      : "";

  return (
    <section className="sticker-lg mt-10 grid gap-6 p-6 md:grid-cols-[1fr_320px] md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Bullshit-o-Meter
        </p>
        <h2 className="mt-1 text-3xl font-extrabold">Bahana sunao, court decide karega 🧐</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {friend ? `${friend.name} ne kya excuse diya?` : "Upar se mujrim chuno."} Judge:{" "}
          {judgeInfo?.emoji} {judgeInfo?.label}. AI 1–10 rate karega aur friendly saza dega.
        </p>
        <Textarea
          className="mt-4 min-h-24 rounded-xl border-2 border-ink bg-card shadow-sticker-sm"
          placeholder="e.g. Bhai UPI down tha, kal pakka bhej dunga 🤞"
          maxLength={400}
          value={excuse}
          onChange={(e) => setExcuse(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_EXCUSES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setExcuse(q)}
              className="rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold shadow-sticker-sm hover:animate-shake"
            >
              {q}
            </button>
          ))}
        </div>
        <Button className="mt-4" size="lg" onClick={judge} disabled={busy}>
          {busy ? "Judge soch rahe hai… 🤔" : "Faisla sunao 🔨"}
        </Button>
      </div>

      <div className="flex flex-col items-center rounded-2xl border-2 border-ink bg-ink p-5 text-ink-foreground">
        <svg
          viewBox="0 0 200 120"
          className="w-full max-w-[260px]"
          role="img"
          aria-label={`Bullshit score ${score} out of 10`}
        >
          <path d="M20 100 A80 80 0 0 1 73 25" fill="none" stroke="var(--gain)" strokeWidth="18" />
          <path
            d="M73 25 A80 80 0 0 1 127 25"
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="18"
          />
          <path
            d="M127 25 A80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="18"
          />
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 900ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke="var(--ink-foreground)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <circle cx="100" cy="100" r="9" fill="var(--ink-foreground)" />
        </svg>
        <p className={cn("mt-1 font-display text-5xl font-extrabold", busy && "animate-shake")}>
          {v ? `${v.score}/10` : busy ? "…" : "?/10"}
        </p>
        <p className="text-sm font-bold text-secondary">
          {v ? level.label : "Bahana daalo, meter ghoomega"}
        </p>
      </div>

      {v && (
        <div className="animate-pop md:col-span-2">
          <div className="rounded-2xl border-2 border-ink bg-secondary p-5 shadow-sticker">
            <p className="text-lg font-bold">
              {judgeInfo?.emoji} “{v.verdict}”
            </p>
            <p className="mt-2 font-display text-xl font-extrabold">Saza: {v.penalty}</p>
            {v.source === "local" && (
              <p className="mt-1 text-xs text-muted-foreground">
                (AI judge busy tha, ye offline faisla hai)
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(friend?.phone ?? "", shareText)}
                target="_blank"
                rel="noreferrer"
              >
                💬 Faisla WhatsApp karo
              </a>
            </Button>
            <Button variant="outline" onClick={judge} disabled={busy}>
              🔁 Appeal (dobara judge karo)
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
