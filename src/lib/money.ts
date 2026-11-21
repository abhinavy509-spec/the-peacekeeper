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
