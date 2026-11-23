import { z } from "zod";

export interface AiJudgeVerdict {
  score: number;
  verdict: string;
  penalty: string;
}

const VerdictSchema = z.object({
  score: z.number(),
  verdict: z.string(),
  penalty: z.string(),
});

/**
 * Rates a roommate excuse using Google Gemini API or OpenAI API.
 * Prioritizes GEMINI_API_KEY, then OPENAI_API_KEY.
 * Returns null if no API key is provided or calls fail (triggering local fallback).
 */
export async function judgeExcuseWithAi(
  systemPrompt: string,
  userPrompt: string,
): Promise<AiJudgeVerdict | null> {
  // 1. Google Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                verdict: { type: "STRING" },
                penalty: { type: "STRING" },
              },
              required: ["score", "verdict", "penalty"],
            },
            temperature: 0.8,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = VerdictSchema.parse(JSON.parse(text));
          return {
            score: Math.max(1, Math.min(10, Math.round(parsed.score))),
            verdict: parsed.verdict,
            penalty: parsed.penalty,
          };
        }
      } else {
        const err = await res.text();
        console.warn(`[Gemini API] Error ${res.status}:`, err);
      }
    } catch (err) {
      console.warn("[Gemini API] Call failed, attempting fallback:", err);
    }
  }

  // 2. OpenAI API
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = VerdictSchema.parse(JSON.parse(content));
          return {
            score: Math.max(1, Math.min(10, Math.round(parsed.score))),
            verdict: parsed.verdict,
            penalty: parsed.penalty,
          };
        }
      } else {
        const err = await res.text();
        console.warn(`[OpenAI API] Error ${res.status}:`, err);
      }
    } catch (err) {
      console.warn("[OpenAI API] Call failed:", err);
    }
  }

  return null;
}

/**
 * Optional AI generator to create a witty custom Hinglish WhatsApp reminder.
 */
export async function generateCourtMessageWithAi(
  judgePersona: string,
  friendName: string,
  amount: number,
): Promise<string | null> {
  const systemPrompt = `You are an Indian college hostel peer writing a hilarious WhatsApp debt reminder notice in Hinglish. You are speaking as: ${judgePersona}.
Guidelines:
- 1 to 2 sentences maximum.
- Use 1-2 funny relevant emojis.
- Keep it PG, friendly, funny hostel banter (no insults about caste, religion, body or family).
- Return ONLY the message text itself, no quotes, no extra formatting.`;

  const userPrompt = `Accused friend name: ${friendName}. Pending amount: ₹${amount}.`;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.9 },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // Fall through
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.9,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      // Fall through
    }
  }

  return null;
}
