export type Direction = "they_owe" | "i_owe";
export type Kind = "debt" | "due" | "split";

export interface EntryLike {
  friend_id: string;
  direction: Direction | (string & {});
  amount: number | string;
  settled: boolean;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatINR(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return `₹${s}`;
}

/** Net balance per friend: positive = they owe you, negative = you owe them. Settled rows ignored. */
export function netByFriend(entries: EntryLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (e.settled) continue;
    const amt = Number(e.amount);
    const sign = e.direction === "they_owe" ? 1 : -1;
    out[e.friend_id] = round2((out[e.friend_id] ?? 0) + sign * amt);
  }
  return out;
}

export function totals(net: Record<string, number>) {
  let toGet = 0;
  let toGive = 0;
  for (const v of Object.values(net)) {
    if (v > 0) toGet += v;
    else toGive += -v;
  }
  return { toGet: round2(toGet), toGive: round2(toGive), net: round2(toGet - toGive) };
}

export interface SplitInput {
  total: number;
  /** "me" or a friend id */
  payer: string;
  /** friend ids who shared the expense (you are always included) */
  friendIds: string[];
}

export interface SplitRow {
  friend_id: string;
  direction: Direction;
  amount: number;
}

/**
 * Equal split between you + selected friends.
 * If you paid: every selected friend owes you one share.
 * If a friend paid: you owe that friend one share (other friends' shares are their business).
 */
export function computeSplit({ total, payer, friendIds }: SplitInput): SplitRow[] {
  const people = new Set(friendIds);
  if (payer !== "me") people.add(payer);
  const count = people.size + 1; // + you
  if (total <= 0 || people.size === 0) return [];
  const share = round2(total / count);
  if (payer === "me") {
    return [...people].map((id) => ({ friend_id: id, direction: "they_owe", amount: share }));
  }
  return [{ friend_id: payer, direction: "i_owe", amount: share }];
}

export type Tier = "S" | "A" | "B" | "C" | "D";

/** Tier by share of the biggest amount: S ≥ 80%, A ≥ 55%, B ≥ 30%, C > 0, D = nothing pending. */
export function tierFor(amount: number, max: number): Tier {
  if (amount <= 0 || max <= 0) return "D";
  const r = amount / max;
  if (r >= 0.8) return "S";
  if (r >= 0.55) return "A";
  if (r >= 0.3) return "B";
  return "C";
}

export interface CibilEntry {
  direction: Direction | (string & {});
  amount: number | string;
  settled: boolean;
  created_at: string;
}

export interface Cibil {
  score: number;
  badge: string;
}

/**
 * Roommate CIBIL (300–900) for how reliably someone pays back.
 * `owedDirection` picks which rows count as "their" debts: "they_owe" for a friend, "i_owe" for you.
 * No such rows → 750 "Fresher". Otherwise start at 750, +/- up to 100 for settled ratio,
 * minus pending amount (0.4 per ₹, max 200) and age of oldest pending (5/day, max 150).
 */
export function cibilScore(
  entries: CibilEntry[],
  owedDirection: Direction,
  now: Date = new Date(),
): Cibil {
  const rows = entries.filter((e) => e.direction === owedDirection);
  if (rows.length === 0) return { score: 750, badge: "Fresher 🐣" };
  const settled = rows.filter((e) => e.settled).length;
  const pending = rows.filter((e) => !e.settled);
  const pendingAmt = pending.reduce((s, e) => s + Number(e.amount), 0);
  const oldest = pending.reduce(
    (m, e) => Math.min(m, new Date(e.created_at).getTime()),
    Number.POSITIVE_INFINITY,
  );
  const days = Number.isFinite(oldest) ? Math.max(0, (now.getTime() - oldest) / 86_400_000) : 0;
  let score = 750 + (settled / rows.length - 0.5) * 200;
  score -= Math.min(200, pendingAmt * 0.4);
  score -= Math.min(150, days * 5);
  score = Math.round(Math.max(300, Math.min(900, score)));
  return { score, badge: cibilBadge(score) };
}

export function cibilBadge(score: number): string {
  if (score >= 800) return "Ambani of the Hostel 👑";
  if (score >= 650) return "Bharosemand 🤝";
  if (score >= 500) return "Kal Pakka Wala 🤞";
  return "Certified Kanjoos 🪙";
}
