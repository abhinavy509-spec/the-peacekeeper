import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { localVerdict, PENALTIES, type Verdict } from "./excuse";
import { judgeExcuseWithAi, generateCourtMessageWithAi } from "./ai";

const RateInput = z.object({
  excuse: z.string().trim().min(2).max(400),
  friendName: z.string().trim().min(1).max(60),
  amount: z.number().nonnegative().max(1_000_000),
  judge: z.string().max(40),
});

const NoticeInput = z.object({
  friendName: z.string().trim().min(1).max(60),
  amount: z.number().nonnegative().max(1_000_000),
  judge: z.string().max(40),
});

const JUDGES: Record<string, string> = {
  chacha: "a dramatic, warm Kanpuriya Chacha who speaks Kanpur-style Hinglish",
  bestie: "a passive-aggressive toxic bestie who speaks Gen-Z Hinglish",
  service: "an overly formal, polite Indian customer-service agent speaking Hinglish",
  warden: "a strict hostel warden, clear and firm, speaking Hinglish",
};

// Rates a roommate's excuse 1–10 with a funny PG verdict.
// Supports Gemini API (GEMINI_API_KEY) and OpenAI API (OPENAI_API_KEY),
// with an automatic offline fallback to localVerdict.
export const rateExcuse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RateInput.parse(d))
  .handler(async ({ data }): Promise<Verdict> => {
    const systemPrompt = `You are the judge of "Roommate Court" in an Indian college hostel app. You are ${
      JUDGES[data.judge] ?? JUDGES["chacha"]
    }. Rate how much of a bullshit excuse it is for not repaying money, from 1 (totally genuine) to 10 (pure bakwaas). Write a short, funny verdict in Hinglish (max 2 sentences, 1-2 emojis). Keep it PG, friendly, no insults about family, caste, religion, body or gender. Pick a friendly penalty, preferably one of: ${PENALTIES.join(
      "; ",
    )}. Respond in strict JSON format: {"score": number, "verdict": string, "penalty": string}.`;

    const userPrompt = `Accused: ${data.friendName}. Pending amount: ₹${data.amount}. Excuse: "${data.excuse}"`;

    const aiVerdict = await judgeExcuseWithAi(systemPrompt, userPrompt);
    if (aiVerdict) {
      return {
        ...aiVerdict,
        source: "ai",
      };
    }

    // Default fast, deterministic offline PG rater:
    return localVerdict(data.excuse);
  });

// Generates a custom Hinglish court notice message with Gemini or OpenAI
export const generateAiCourtNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NoticeInput.parse(d))
  .handler(async ({ data }): Promise<{ message: string | null }> => {
    const persona = JUDGES[data.judge] ?? JUDGES["chacha"];
    const message = await generateCourtMessageWithAi(persona, data.friendName, data.amount);
    return { message };
  });
