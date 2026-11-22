<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Sign-in is name + password only: the name is normalized and mapped to a synthetic `@peacekeeper.app` email (`src/lib/identity.ts`) with auto-confirm on; never ask users for an email. Why: the user wants name-only login.
- Money logic (balances, splits, tiers) lives in pure functions in `src/lib/money.ts` with tests; UI routes only call them. Why: keeps the rules testable.
- Court messages are local Hinglish templates in `src/lib/court.ts`; only friend name + amount are inserted and sent via a `wa.me` link. Why: instant, no AI cost, predictable PG content.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/`, the login page); data is read with the browser client under RLS (owner-only rows).
- Click sounds are synthesized with WebAudio from one global click listener in `__root.tsx`; buttons get the shake via the shared button variant, not per-component styles.
- Bullshit-o-Meter rates excuses via an authenticated server function (`src/lib/excuse.functions.ts`, Lovable AI Gateway) and falls back to the local rater in `src/lib/excuse.ts` labelled as offline. Why: the demo must never dead-end.
- Rate list defaults live in code (`src/lib/prices.ts`); `price_items` rows only store per-user overrides, hidden defaults and custom items, merged by `item_key`. Why: defaults can change without seeding every account.
- The floating calculator hands results to pages through `calcBus` in `src/lib/calc.ts`; pages that accept an amount subscribe in an effect.
