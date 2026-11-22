import { describe, expect, it } from "vitest";
import { computeSplit, netByFriend, tierFor, totals } from "./money";

describe("balances", () => {
  it("dues add, debts subtract, settled rows are ignored", () => {
    const net = netByFriend([
      { friend_id: "a", direction: "they_owe", amount: 100, settled: false },
      { friend_id: "a", direction: "i_owe", amount: "30", settled: false },
      { friend_id: "a", direction: "they_owe", amount: 500, settled: true },
      { friend_id: "b", direction: "i_owe", amount: 42, settled: false },
    ]);
    expect(net).toEqual({ a: 70, b: -42 });
    expect(totals(net)).toEqual({ toGet: 70, toGive: 42, net: 28 });
  });
});

describe("split", () => {
  it("when I pay ₹300 with 2 friends, each friend owes me ₹100", () => {
    const rows = computeSplit({ total: 300, payer: "me", friendIds: ["a", "b"] });
    expect(rows).toEqual([
      { friend_id: "a", direction: "they_owe", amount: 100 },
      { friend_id: "b", direction: "they_owe", amount: 100 },
    ]);
  });

  it("when a friend pays ₹300 for 3 people, I owe that friend ₹100", () => {
    const rows = computeSplit({ total: 300, payer: "a", friendIds: ["b"] });
    expect(rows).toEqual([{ friend_id: "a", direction: "i_owe", amount: 100 }]);
  });

  it("no friends selected means nothing to split", () => {
    expect(computeSplit({ total: 100, payer: "me", friendIds: [] })).toEqual([]);
  });
});

describe("tiers", () => {
  it("ranks by share of the biggest amount", () => {
    expect(tierFor(100, 100)).toBe("S");
    expect(tierFor(60, 100)).toBe("A");
    expect(tierFor(30, 100)).toBe("B");
    expect(tierFor(10, 100)).toBe("C");
    expect(tierFor(0, 100)).toBe("D");
  });
});

import { cibilScore } from "./money";
describe("roommate cibil", () => {
  const now = new Date("2026-11-22T00:00:00Z");
  it("no history is a 750 Fresher", () => {
    expect(cibilScore([], "they_owe", now)).toEqual({ score: 750, badge: "Fresher 🐣" });
  });
  it("always settled scores 850 (Ambani of the Hostel)", () => {
    const r = cibilScore([{ direction: "they_owe", amount: 100, settled: true, created_at: "2026-11-01T00:00:00Z" }], "they_owe", now);
    expect(r).toEqual({ score: 850, badge: "Ambani of the Hostel 👑" });
  });
  it("₹500 pending for 10 days drops to 400 (Certified Kanjoos)", () => {
    const r = cibilScore([{ direction: "they_owe", amount: 500, settled: false, created_at: "2026-11-12T00:00:00Z" }], "they_owe", now);
    expect(r.score).toBe(400);
    expect(r.badge).toBe("Certified Kanjoos 🪙");
  });
});
