// Tiny 4-function calculator state machine (no eval).
export type Op = "+" | "-" | "×" | "÷";

export interface CalcState {
  display: string;
  acc: number | null;
  op: Op | null;
  fresh: boolean; // next digit starts a new number
  error: string | null;
}

export const initialCalc: CalcState = {
  display: "0",
  acc: null,
  op: null,
  fresh: true,
  error: null,
};

function apply(a: number, b: number, op: Op): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? null : a / b;
  }
}

const fmt = (n: number) => String(Math.round(n * 1e8) / 1e8);

export function pressDigit(s: CalcState, digit: string): CalcState {
  if (s.error) s = initialCalc;
  if (s.fresh) return { ...s, display: digit, fresh: false };
  if (s.display === "0") return { ...s, display: digit };
  if (s.display.replace(/[-.]/g, "").length >= 12) return s;
  return { ...s, display: s.display + digit };
}

export function pressDot(s: CalcState): CalcState {
  if (s.error) s = initialCalc;
  if (s.fresh) return { ...s, display: "0.", fresh: false };
  if (s.display.includes(".")) return s;
  return { ...s, display: s.display + "." };
}

export function pressOp(s: CalcState, op: Op): CalcState {
  if (s.error) return s;
  const cur = Number(s.display);
  if (s.acc !== null && s.op && !s.fresh) {
    const r = apply(s.acc, cur, s.op);
    if (r === null) return { ...initialCalc, display: "Error", error: "Bhai 0 se divide? 🤯" };
    return { display: fmt(r), acc: r, op, fresh: true, error: null };
  }
  return { ...s, acc: cur, op, fresh: true };
}

export function pressEquals(s: CalcState): CalcState {
  if (s.error || s.acc === null || !s.op) return s;
  const r = apply(s.acc, Number(s.display), s.op);
  if (r === null) return { ...initialCalc, display: "Error", error: "Bhai 0 se divide? 🤯" };
  return { display: fmt(r), acc: null, op: null, fresh: true, error: null };
}

export function pressBack(s: CalcState): CalcState {
  if (s.error || s.fresh) return s;
  const next = s.display.slice(0, -1);
  return { ...s, display: next === "" || next === "-" ? "0" : next };
}

/** The 9 digit keys 1–9 in a fresh random order (0 stays put). */
export function shuffledDigits(rng: () => number = Math.random): string[] {
  const a = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// Lets the floating calculator hand its result to whichever page is listening (Add, Court).
type Listener = (n: number) => void;
const listeners = new Set<Listener>();
export const calcBus = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  hasListeners: () => listeners.size > 0,
  emit: (n: number) => listeners.forEach((fn) => fn(n)),
};
