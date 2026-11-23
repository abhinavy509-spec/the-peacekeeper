// PG hostel memes built from emoji stickers — no image files, always loads.
export type Meme =
  | { kind: "classic"; sticker: string; top: string; bottom: string }
  | { kind: "drake"; no: string; yes: string }
  | { kind: "chat"; lines: Array<{ who: string; text: string }>; sticker: string };

export const MEMES: Meme[] = [
  { kind: "classic", sticker: "🤡", top: "Bhai kal pakka de dunga", bottom: "— 47 kal pehle" },
  { kind: "drake", no: "Paise waapas maangna", yes: "Chai pe chai pilwate rehna" },
  {
    kind: "chat",
    sticker: "💀",
    lines: [
      { who: "Aman", text: "bro woh ₹42 Tuesday wale?" },
      { who: "Rohit", text: "konsa Tuesday? 🤔" },
    ],
  },
  {
    kind: "classic",
    sticker: "📵",
    top: "Jab udhaar maango",
    bottom: "Toh UPI achanak down ho jaata hai",
  },
  { kind: "drake", no: "Split karna Splitwise pe", yes: "Peacekeeper pe court case" },
  {
    kind: "classic",
    sticker: "🦗",
    top: "Group mein: 'kaun kaun maggi khayega?'",
    bottom: "Bill ke time: *crickets*",
  },
  {
    kind: "chat",
    sticker: "😭",
    lines: [
      { who: "Me", text: "₹500 kab doge?" },
      { who: "Roomie", text: "seen 2:14 AM" },
    ],
  },
  {
    kind: "classic",
    sticker: "🧘",
    top: "Main: chill hoon yaar",
    bottom: "Also main: har ₹10 ka hisaab yaad hai",
  },
  { kind: "drake", no: "Apne paise se Maggi", yes: "Roommate ke stock se 'bas ek packet'" },
  {
    kind: "classic",
    sticker: "🕵️",
    top: "Wallet 'room pe reh gaya'",
    bottom: "Room: tum hi ho bhai",
  },
  { kind: "classic", sticker: "🍵", top: "₹10 ki chai", bottom: "₹10,000 ki dosti khatam" },
  {
    kind: "chat",
    sticker: "🫠",
    lines: [
      { who: "Hostel GC", text: "printout kisne nikale?" },
      { who: "Everyone", text: "*left the chat*" },
    ],
  },
  { kind: "drake", no: "Seedha paise maangna", yes: "Status pe 'kuch log' wali shayari" },
  {
    kind: "classic",
    sticker: "📈",
    top: "Mere udhaar ka graph",
    bottom: "Sensex se tez bhaag raha hai",
  },
];

export function randomMeme(except?: Meme): Meme {
  const pool = except ? MEMES.filter((m) => m !== except) : MEMES;
  return pool[Math.floor(Math.random() * pool.length)] ?? MEMES[0]!;
}

export const FLOATERS = [
  "🤡",
  "💸",
  "🍵",
  "🧾",
  "😭",
  "🪙",
  "🫠",
  "📵",
  "🍜",
  "🤝",
  "💀",
  "🧐",
  "kal pakka 🤞",
  "UPI down hai 📵",
  "bhai ₹20 de",
  "wallet room pe 👛",
  "split karte hai na",
  "chai on me (jhooth) ☕",
  "seen 2AM 👀",
  "Maggi ka hisaab 🍜",
];
