import { formatINR } from "./money";

export type Tone = "chacha" | "bestie" | "service" | "warden";

export const TONES: Array<{ id: Tone; label: string; emoji: string; blurb: string }> = [
  { id: "chacha", label: "Kanpuriya Chacha", emoji: "👴🏽", blurb: "Gyaan + drama, full Kanpur style" },
  { id: "bestie", label: "Toxic Bestie", emoji: "💅", blurb: "Just checking… but louder" },
  { id: "service", label: "Service Center Wale", emoji: "🎧", blurb: "Formal, polite, thoda creepy" },
  { id: "warden", label: "Strict Warden", emoji: "👮🏽", blurb: "Clear. Firm. No loopholes." },
];

const TEMPLATES: Record<Tone, string[]> = {
  warden: [
    "NOTICE 📢 {name}, aap par {amount} ka bakaya hai. 24 ghante mein clear karo, warna gate pass cancel. — Warden 👮🏽",
    "{name}! Room inspection mein {amount} ka udhaar mila hai. Ye hostel hai, dharamshala nahi. Turant jama karo. 🚨",
    "Attention {name}: {amount} pending. Koi bahana nahi chalega — na UPI down, na wallet room pe. Aaj hi. ⏰",
    "{name}, ye pehli aur aakhri warning hai. {amount} wapas karo, warna mess mein naam announce hoga. 📋",
    "Hostel rule no. 420: udhaar 7 din se zyada nahi. {name}, aapka {amount} overdue hai. Action liya jayega. 🛑",
  ],
  chacha: [
    "Arre {name} bhaiya, ka haal chaal? 👴🏽 Suno, {amount} ab tak nahi lautaye ho. Hum toh kehte hai — paisa lautana sanskaar hai, warna bhaukaal khatam! 😤",
    "E {name}! Jhaade rehna… {amount} udhaar pe baithe ho, aur chai pe chai uda rahe ho? Pehle hisaab saaf karo, phir Ganga nahao. 🙏",
    "Dekho {name}, hum gussa nahi hote. Bas {amount} wapas kar do, warna poore hostel mein dhinchak announcement karwa denge. 📢",
    "{name} babua, {amount} ka mamla hai. Kanpur mein toh itne mein poora thaggu ke laddu ka dabba aa jaata! Jaldi bhejo. 🍬",
    "Ka {name}, bhool gaye ka? {amount}! Humre zamane mein log udhaar lekar raat ko so nahi paate the. Tum toh kharrate maar rahe ho! 😴",
    "Arre {name}, hum seedhi baat karte hai — {amount} UPI karo, ya phir chacha khud aa rahe hai, chappal leke. 🩴",
    "{name} beta, {amount} pending hai. Ye paisa nahi, izzat ka sawaal hai. Aur izzat hum free mein nahi dete! 💯",
  ],
  bestie: [
    "heyyy {name} 💅 just checking… woh {amount} yaad hai na? no pressure. bas meri saari memories mein tum aur woh {amount} hi ho. 🙂",
    "{name} babe, I'm not saying you're a kanjoos… but {amount} abhi tak pending hai and main bol bhi nahi rahi, bas likh rahi hoon. 💀",
    "omg {name} tumhari story dekhi, cafe mein the? cute ☕ toh {amount} bhi bhej do na, since paise toh hai clearly. 😌",
    "not me waiting for {amount} from {name} like it's a situationship 😭 bhej do yaar, closure chahiye.",
    "{name} bestie, {amount}. that's it. that's the message. 🫠",
    "reminder: {name} owes me {amount} 🔔 ye message auto-delete nahi hoga, jaise tumhara udhaar nahi hota. ✨",
    "{name} main toh bas pooch rahi thi… {amount} ka plan kya hai? kyunki mera plan hai sabko batana. 🙃",
  ],
  service: [
    "Namaskar {name} ji 🙏 Aapka account humare records mein {amount} se overdue dikha raha hai. Kripya jald se jald bhugtaan karein. Aapka din shubh ho. 📋",
    "Dear {name}, aapki call humare liye mahatvapurn hai. ☎️ Aapka pending amount {amount} hai. Bhugtaan ke liye 1 dabayein. Bahane ke liye kripya line par bane rahein. 🎵",
    "Respected {name} Sir/Ma'am, ticket no. #UDHAAR{rand} ke anusaar {amount} abhi tak unresolved hai. Hum aapki seva mein hamesha tatpar hain — aur paise ke intezaar mein bhi. 🎧",
    "Priya grahak {name}, aapka {amount} ka udhaar 'Pending' status mein hai. Is message ka uttar na dene par agla reminder aur zyada politely bheja jayega. 🙂",
    "Hello {name} ji, main Peacekeeper Customer Care se bol raha hoon. 🎧 Aapke {amount} ki EMI aaj due hai. Kya main aapka keemti samay le sakta hoon? Paise ke saath? 💳",
    "Shubh sandhya {name} ji. Ye ek automated reminder hai: {amount} bakaya hai. Aapka sahyog hi humari prerna hai. Dhanyavaad. 🤖",
  ],
};

export function generateMessage(
  tone: Tone,
  name: string,
  amount: number,
  rng: () => number = Math.random,
  avoid?: string,
): string {
  const list = TEMPLATES[tone];
  let idx = Math.floor(rng() * list.length);
  let msg = "";
  for (let tries = 0; tries < 5; tries++) {
    const tpl = list[idx % list.length] ?? list[0]!;
    msg = tpl
      .replaceAll("{name}", name)
      .replaceAll("{amount}", formatINR(amount))
      .replaceAll("{rand}", String(1000 + Math.floor(rng() * 9000)));
    if (!avoid || msg !== avoid) break;
    idx++;
  }
  return msg;
}

/** Digits only; a bare 10-digit Indian number gets +91. Returns "" if unusable. */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 11 && d.length <= 15 ? d : "";
}

export function whatsappLink(phone: string, text: string): string {
  const p = normalizePhone(phone);
  const base = p ? `https://wa.me/${p}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
