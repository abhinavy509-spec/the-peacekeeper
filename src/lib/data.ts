import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Friend = Tables<"friends">;
export type Entry = Tables<"entries">;
export type Profile = Tables<"profiles">;

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

export const FRIEND_EMOJIS = ["😎", "🤓", "🐒", "🦁", "🐼", "👻", "🤠", "🧢", "🍕", "🐸", "🦄", "🥷"];

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
