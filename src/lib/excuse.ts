// Bullshit-o-Meter shared bits + an offline fallback rater.
export const PENALTIES = [
  "1 hafte ki chai duty ☕",
  "3 din dustbin duty 🗑️",
  "Hostel group pe public apology 📢",
  "Poore room ko Maggi party 🍜",
  "Room ki safai, weekend pe 🧹",
  "Agli canteen run tumhare paise se 🛵",
  "Sabke liye samosa 🥟",
  "Ek din ka 'Haan bhai' servant mode 🙇",
];

export const QUICK_EXCUSES = [
  "UPI down tha bhai 📵",
  "Ghar se paise nahi aaye abhi",
  "Kal pakka de dunga 🤞",
  "Wallet room pe reh gaya",
  "Maine toh bhej diya tha, tere paas nahi aaya?",
  "Bhai tu bhi toh pichli baar ka bhool gaya",
];

export interface Verdict {
  score: number;
  verdict: string;
  penalty: string;
  source: "ai" | "local";
}

const SUSPECT: Array<[RegExp, number]> = [
  [/kal|tomorrow|pakka/i, 3],
  [/upi|server|network|down/i, 3],
  [/bhej diya|sent|already/i, 3],
  [/wallet|room pe|bhool/i, 2],
  [/ghar|papa|mummy|home/i, 1],
  [/promise|kasam|swear/i, 2],
  [/tu bhi|you also|pichli/i, 2],
];

export function localVerdict(excuse: string, rng: () => number = Math.random): Verdict {
  let score = 3;
  for (const [re, w] of SUSPECT) if (re.test(excuse)) score += w;
  if (excuse.length > 120) score += 1;
  score = Math.max(1, Math.min(10, Math.round(score + (rng() * 2 - 1))));
  const verdict =
    score >= 8
      ? "Court ne suna, court hans diya. Ye bahana Netflix original lagta hai 🎬"
      : score >= 5
        ? "Thoda sach, thoda masala. Court ko shaq hai 🤨"
        : "Bahana believable hai. Court thodi dayaa dikhayega 🙏";
  const penalty = PENALTIES[Math.floor(rng() * PENALTIES.length)] ?? PENALTIES[0]!;
  return { score, verdict, penalty, source: "local" };
}
