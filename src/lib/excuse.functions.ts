import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { localVerdict, PENALTIES, type Verdict } from "./excuse";

const Input = z.object({
  excuse: z.string().trim().min(2).max(400),
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

// Rates a roommate's excuse 1–10 with a funny PG verdict. Falls back to a local rating if AI fails.
export const rateExcuse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<Verdict> => {
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You are the judge of "Roommate Court" in an Indian college hostel app. You are ${JUDGES[data.judge] ?? JUDGES["chacha"]}. Rate how much of a bullshit excuse it is for not repaying money, from 1 (totally genuine) to 10 (pure bakwaas). Write a short, funny verdict in Hinglish (max 2 sentences, 1-2 emojis). Keep it PG, friendly, no insults about family, caste, religion, body or gender. Pick a friendly penalty, preferably one of: ${PENALTIES.join("; ")}.`,
        input: [
          {
            role: "user",
            content: `Accused: ${data.friendName}. Pending amount: ₹${data.amount}. Excuse: "${data.excuse}"`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "verdict",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                score: { type: "integer", minimum: 1, maximum: 10 },
                verdict: { type: "string" },
                penalty: { type: "string" },
              },
              required: ["score", "verdict", "penalty"],
            },
          },
        },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") {
          for (const c of item.content) if (c.type === "output_text") text += c.text;
        }
      }
      const parsed = z
        .object({ score: z.number(), verdict: z.string(), penalty: z.string() })
        .parse(JSON.parse(text));
      return {
        score: Math.max(1, Math.min(10, Math.round(parsed.score))),
        verdict: parsed.verdict,
        penalty: parsed.penalty,
        source: "ai",
      };
    } catch (err) {
      console.error("rateExcuse AI failed", err);
      return localVerdict(data.excuse);
    }
  });
