import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Friend = Tables<"friends">;
export type Entry = Tables<"entries">;
export type Profile = Tables<"profiles">;
export type Notice = Tables<"notices">;
export type Galla = Tables<"galla">;
export type GallaMember = Tables<"galla_members">;
export type GallaEntry = Tables<"galla_entries">;
export type Chore = Tables<"chores">;
export type PriceRow = Tables<"price_items">;

export function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalItem<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async (): Promise<Profile | null> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const friendsQuery = queryOptions({
  queryKey: ["friends"],
  queryFn: async (): Promise<Friend[]> => {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const entriesQuery = queryOptions({
  queryKey: ["entries"],
  queryFn: async (): Promise<Entry[]> => {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const noticesQuery = queryOptions({
  queryKey: ["notices"],
  queryFn: async (): Promise<Notice[]> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .or(`receiver_id.eq.${u.user.id},sender_id.eq.${u.user.id}`)
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    } catch {
      // fallback to local storage
    }
    return getLocalItem<Notice[]>("peacekeeper_local_notices", []);
  },
});

export const choresQuery = queryOptions({
  queryKey: ["chores"],
  queryFn: async (): Promise<Chore[]> => {
    try {
      const { data, error } = await supabase
        .from("chores")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch {
      // fallback to local storage
    }
    return getLocalItem<Chore[]>("peacekeeper_local_chores", []);
  },
});

export const gallaQuery = queryOptions({
  queryKey: ["galla"],
  queryFn: async (): Promise<{ galla: Galla[]; entries: GallaEntry[]; members: GallaMember[] }> => {
    try {
      const { data: gallaList, error: gError } = await supabase
        .from("galla")
        .select("*")
        .order("created_at", { ascending: false });

      if (!gError && gallaList) {
        const { data: entriesList } = await supabase
          .from("galla_entries")
          .select("*")
          .order("created_at", { ascending: false });
        const { data: membersList } = await supabase.from("galla_members").select("*");
        return {
          galla: gallaList,
          entries: entriesList ?? [],
          members: membersList ?? [],
        };
      }
    } catch {
      // fallback to local storage
    }

    return getLocalItem("peacekeeper_local_galla", {
      galla: [],
      entries: [],
      members: [],
    });
  },
});

export const priceItemsQuery = queryOptions({
  queryKey: ["price_items"],
  queryFn: async (): Promise<PriceRow[]> => {
    const { data, error } = await supabase.from("price_items").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
});

export const FRIEND_EMOJIS = [
  "😎",
  "🤓",
  "🐒",
  "🦁",
  "🐼",
  "👻",
  "🤠",
  "🧢",
  "🍕",
  "🐸",
  "🦄",
  "🥷",
];

const QUIPS_ADD = [
  "Likh liya! Ab bhaagega kahan 🏃‍♂️",
  "Hisaab mein daal diya ✍️ Chitragupt bhi proud hai",
  "Done! Ye udhaar ab itihaas mein darj hai 📜",
  "Noted bhai, court mein kaam aayega ⚖️",
];
const QUIPS_SETTLE = [
  "Hisaab barabar! Dosti bach gayi 🤝",
  "Settled! Aaj raat chain ki neend 😴",
  "Paise aa gaye?! Chamatkar 🙏",
];
export const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
export const quipAdd = () => pick(QUIPS_ADD);
export const quipSettle = () => pick(QUIPS_SETTLE);
