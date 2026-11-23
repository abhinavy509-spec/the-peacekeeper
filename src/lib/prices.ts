// Default rate list: hostel basics + the canteen menu board. Users can override any price,
// hide items, or add their own (stored in price_items, merged on top of these by item_key).
export interface PriceItem {
  key: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
}

export const CATEGORIES: Array<{ id: string; label: string; emoji: string }> = [
  { id: "basics", label: "Hostel basics", emoji: "🏠" },
  { id: "chai", label: "Chai & Bun", emoji: "☕" },
  { id: "maggi", label: "Maggi", emoji: "🍜" },
  { id: "burger", label: "Burger", emoji: "🍔" },
  { id: "sandwich", label: "Sandwich", emoji: "🥪" },
  { id: "momos", label: "Momos & Rolls", emoji: "🥟" },
  { id: "fries", label: "Fries", emoji: "🍟" },
  { id: "pasta", label: "Pasta", emoji: "🍝" },
  { id: "coffee", label: "Coffee", emoji: "🧋" },
  { id: "shakes", label: "Shakes", emoji: "🥤" },
  { id: "custom", label: "Mere items", emoji: "⭐" },
];

const d = (category: string, emoji: string, list: Array<[string, number]>): PriceItem[] =>
  list.map(([name, price]) => ({
    key: `${category}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    emoji,
    category,
    price,
  }));

export const DEFAULT_PRICES: PriceItem[] = [
  ...d("basics", "🖨️", [
    ["Photocopy", 5],
    ["Printout (colour)", 10],
  ]),
  ...d("basics", "☕", [["Chai", 10]]),
  ...d("basics", "🥟", [["Samosa", 15]]),
  ...d("basics", "🍪", [["Parle-G", 10]]),
  ...d("basics", "🥔", [["Chips packet", 20]]),
  ...d("basics", "💧", [["Water bottle", 20]]),
  ...d("basics", "🍜", [["Maggi packet", 15]]),
  ...d("basics", "🛺", [["Auto ride", 20]]),
  ...d("chai", "🫖", [["Kulhad chai", 20]]),
  ...d("chai", "🍞", [
    ["Bun butter", 30],
    ["Bun butter with cheese", 45],
  ]),
  ...d("maggi", "🍜", [
    ["Veg paneer maggi", 69],
    ["Butter maggi", 79],
    ["Cheese maggi", 89],
    ["Double cheese maggi", 99],
    ["Cheese corn maggi", 99],
    ["Punjabi tadka maggi", 99],
    ["Cheese tadka maggi", 119],
  ]),
  ...d("burger", "🍔", [
    ["Veg takatak burger", 69],
    ["Classic cheese burger", 79],
    ["Double cheese burger", 99],
    ["Paneer slices burger", 89],
    ["Paneer cheese burger", 109],
    ["Double shot patty burger", 119],
  ]),
  ...d("sandwich", "🥪", [
    ["Veg sandwich", 69],
    ["Veg cheese sandwich", 89],
    ["Cheese corn sandwich", 89],
    ["Spinach corn sandwich", 99],
    ["Spinach paneer sandwich", 119],
    ["Paneer cheese sandwich", 119],
  ]),
  ...d("momos", "🥟", [
    ["Veg fry momos", 49],
    ["Veg kurkure momos", 79],
    ["Peri peri fry momos", 79],
    ["Peri peri kurkure momos", 89],
  ]),
  ...d("momos", "🌯", [
    ["Veg spring roll (2 pcs)", 89],
    ["Veg kurkure roll (2 pcs)", 119],
  ]),
  ...d("fries", "🍟", [
    ["Masala fries", 49],
    ["Peri peri fries", 89],
    ["Lemon chilli fries", 99],
    ["Peri peri cheese fries", 109],
    ["Lemon chilli cheese fries", 119],
  ]),
  ...d("fries", "🧀", [
    ["Crispy cheese ball", 99],
    ["Lemon chilli cheese ball", 119],
  ]),
  ...d("pasta", "🍝", [
    ["White sauce pasta", 119],
    ["Pink sauce pasta", 129],
  ]),
  ...d("coffee", "☕", [
    ["Hot coffee", 35],
    ["Hazelnut coffee", 49],
    ["Butter coffee", 49],
  ]),
  ...d("coffee", "🧋", [
    ["Cold coffee", 69],
    ["Hazelnut cold coffee", 89],
    ["Caramel cold coffee", 89],
    ["Cold coffee with ice cream", 89],
  ]),
  ...d("shakes", "🥤", [
    ["KitKat shake", 119],
    ["Oreo shake", 119],
    ["Brownie shake", 149],
    ["Lotus biscoff shake", 149],
  ]),
];

export interface PriceOverride {
  item_key: string;
  name: string;
  emoji: string;
  category: string;
  price: number | string;
  hidden: boolean;
}

/** Defaults with the user's overrides applied; hidden items removed; custom items appended. */
export function mergePrices(
  overrides: PriceOverride[],
): Array<PriceItem & { edited: boolean; custom: boolean }> {
  const byKey = new Map(overrides.map((o) => [o.item_key, o]));
  const out: Array<PriceItem & { edited: boolean; custom: boolean }> = [];
  for (const def of DEFAULT_PRICES) {
    const o = byKey.get(def.key);
    if (o?.hidden) continue;
    out.push(
      o
        ? { ...def, price: Number(o.price), edited: Number(o.price) !== def.price, custom: false }
        : { ...def, edited: false, custom: false },
    );
  }
  for (const o of overrides) {
    if (!o.item_key.startsWith("custom:") || o.hidden) continue;
    out.push({
      key: o.item_key,
      name: o.name,
      emoji: o.emoji,
      category: "custom",
      price: Number(o.price),
      edited: false,
      custom: true,
    });
  }
  return out;
}

export interface CartLine {
  key: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
}

export function cartTotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
}

export function cartNote(lines: CartLine[]): string {
  return lines.map((l) => `${l.qty}× ${l.name}`).join(", ");
}
