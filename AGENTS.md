# AGENTS.md

## Project Architecture & Core Conventions

- **Sign-in is name + password only**: The name is normalized and mapped to a synthetic `@peacekeeper.app` email (`src/lib/identity.ts`) with auto-confirm on in Supabase; never ask users for an email address.
- **Money logic (balances, splits, tiers)**: Lives in pure functions in `src/lib/money.ts` with unit tests (`src/lib/money.test.ts`); UI routes only consume these calculations.
- **Court messages & AI generation**: Local Hinglish templates in `src/lib/court.ts` + optional AI-crafted notices in `src/lib/ai.ts` powered by Google Gemini (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`). Direct `wa.me` WhatsApp links allow sending in one click.
- **Authentication gating**: Signed-in pages live under `src/routes/_authenticated/` (client-only gate redirecting unauthenticated users to `/`, the login page); data is read via Supabase client under Row Level Security (RLS: owner-only rows).
- **Audio & Animations**: Click sounds are synthesized with WebAudio from a single global click listener in `__root.tsx`; buttons get the playful shake animation via the shared button variant in `src/components/ui/button.tsx`.
- **Bullshit-o-Meter**: Rates roommate excuses via an authenticated server function (`src/lib/excuse.functions.ts`) using Google Gemini (`gemini-2.5-flash`) or OpenAI, falling back to the built-in deterministic local Hinglish rater in `src/lib/excuse.ts`.
- **Rate list defaults**: Defaults live in code (`src/lib/prices.ts`); `price_items` table in Supabase only stores per-user custom items and overrides, merged by `item_key`.
- **Floating Calculator**: Draggable calculator communicates with pages through `calcBus` in `src/lib/calc.ts`; pages accepting an amount subscribe in an effect.
