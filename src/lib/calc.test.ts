import { describe, expect, it } from "vitest";
import {
  initialCalc,
  pressDigit,
  pressEquals,
  pressOp,
  shuffledDigits,
  type CalcState,
  type Op,
} from "./calc";
import { cartNote, cartTotal, DEFAULT_PRICES, mergePrices } from "./prices";

const run = (keys: string[]): CalcState =>
  keys.reduce<CalcState>((s, k) => {
    if (/^\d$/.test(k)) return pressDigit(s, k);
    if (k === "=") return pressEquals(s);
    return pressOp(s, k as Op);
  }, initialCalc);

describe("calculator", () => {
  it("does + − × ÷", () => {
    expect(run(["1", "2", "+", "8", "="]).display).toBe("20");
    expect(run(["5", "0", "-", "8", "="]).display).toBe("42");
    expect(run(["6", "×", "7", "="]).display).toBe("42");
    expect(run(["9", "0", "÷", "4", "="]).display).toBe("22.5");
  });
  it("refuses divide by zero", () => {
    expect(run(["5", "÷", "0", "="]).error).toBeTruthy();
  });
  it("shuffles exactly the digits 1–9", () => {
    expect([...shuffledDigits()].sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });
});

describe("rate list", () => {
  it("photocopy defaults to ₹5 and chai to ₹10", () => {
    expect(DEFAULT_PRICES.find((p) => p.name === "Photocopy")?.price).toBe(5);
    expect(DEFAULT_PRICES.find((p) => p.name === "Chai")?.price).toBe(10);
  });
  it("user price overrides the default", () => {
    const merged = mergePrices([
      {
        item_key: "basics:chai",
        name: "Chai",
        emoji: "☕",
        category: "basics",
        price: 12,
        hidden: false,
      },
    ]);
    expect(merged.find((p) => p.key === "basics:chai")?.price).toBe(12);
  });
  it("cart total and note", () => {
    const lines = [
      { key: "a", name: "Chai", emoji: "☕", qty: 2, price: 10 },
      { key: "b", name: "Samosa", emoji: "🥟", qty: 1, price: 15 },
    ];
    expect(cartTotal(lines)).toBe(35);
    expect(cartNote(lines)).toBe("2× Chai, 1× Samosa");
  });
});
