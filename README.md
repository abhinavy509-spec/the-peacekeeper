# The Peacekeeper — Hostel ka Hisaab ⚖️🍕

> **"Because roommate drama needs a judge."**  
> An interactive, witty, and minimal debt-tracking and bill-splitting web app tailored for college students living in hostel environments.

---

## 🌟 Overview & Hackathon Vision

College hostel life revolves around shared expenses: late-night Maggi parties, canteen chai runs, split auto rides, and emergency midnight supplies. But asking friends to return ₹40 or ₹150 is always awkward.

**Hostel Hisaab (The Peacekeeper)** solves this with humor, culture, and extreme simplicity:

- **No Email Hassle**: Zero-friction login with just a **Name** and **Password** (no email verification emails or phone OTP bottlenecks).
- **Zero-Friction Balance Ledger**: Know instantly whether _"Tu dega"_ (you owe) or _"Tujhe milega"_ (they owe you).
- **Hisaab Barabar in One Click**: Settle debts with a single tap accompanied by funny congratulatory quips.
- **Canteen Rate List**: Pre-populated with typical hostel items (Chai ₹10, Samosa ₹15, Maggi ₹30, Auto Fare ₹40, etc.) with custom rate overrides.
- **Floating Calculator**: Draggable calculator with a real-time event bus that sends calculated totals straight into payment forms.
- **Roommate Court & WhatsApp Reminder Generator**: Generates custom Hinglish reminder messages in 4 distinct tones:
  - 👴🏽 **Kanpuriya Chacha**: Drama, gyaan, and pure Kanpur swag.
  - 💅 **Toxic Bestie**: Passive-aggressive Gen-Z guilt-tripping.
  - 🎧 **Service Center Agent**: Overly formal, polite, yet relentless customer-service banter.
  - 👮🏽 **Strict Hostel Warden**: Firm warnings with gate pass threats.
- **Bullshit-o-Meter**: Rates roommate excuses on a scale of 1 to 10 (from "Sach lag raha hai" to "Pure Bollywood script") and assigns hilarious hostel penalties (e.g., _"1 hafte ki chai duty"_, _"Poore room ko Maggi party"_). Works both with AI and 100% offline!
- **Friend Tier List / Leaderboard**: CIBIL-style score and rankings for friends from _Bhadrakali (Sabse bada denadaar)_ to _Vipul Bhai (Solid payer)_.
- **Meme Engine & Playful UX**: Floating emoji sticker memes, meme of the day, button wiggle animations, and WebAudio synthesized click sounds.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React with SSR & file-based routing)
- **UI & Components**: React 19, [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Data & State**: [@tanstack/react-query](https://tanstack.com/query) v5
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security and Auth)
- **Schema & Migrations**: Drizzle ORM / Raw SQL migrations
- **Audio & Animations**: Native WebAudio API synthesizer, CSS Sticker effects

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js** (v20+ recommended)
- **npm**, **pnpm**, or **bun**

### 2. Clone and Install

```sh
git clone https://github.com/abhinavy509-spec/hostel-hisaab.git
cd hostel-hisaab
npm install
```

### 3. Setup Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open [`supabase-schema.sql`](./supabase-schema.sql) from this repository, paste the entire SQL code, and click **Run**.
   - This sets up the `profiles`, `friends`, `entries`, and `price_items` tables along with Row Level Security (RLS) policies and the user-registration trigger.
4. Disable "Confirm email" in Supabase:
   - Go to **Authentication** -> **Providers** -> **Email**.
   - Turn **OFF** _Confirm email_ (since sign-in generates a synthetic `@peacekeeper.app` email for pure name+password auth).

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI Configuration (Google Gemini or OpenAI)\r\nGEMINI_API_KEY="your-gemini-api-key"\r\nGEMINI_MODEL="gemini-2.5-flash"\r\n# Optional fallback: OPENAI_API_KEY="sk-..."
```

### 5. Run Locally

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
hostel-hisaab/
├── src/
│   ├── components/           # UI components (Calculator, BullshitMeter, MemeCard, RateList, etc.)
│   │   └── ui/               # Radix UI primitives with playful sticker styling
│   ├── integrations/
│   │   └── supabase/         # Supabase client, SSR admin client, and auth middleware
│   ├── lib/
│   │   ├── calc.ts           # Floating calculator bus & math evaluation
│   │   ├── court.ts          # WhatsApp Hinglish templates & generator
│   │   ├── data.ts           # TanStack Query options for friends, entries, and profiles
│   │   ├── error-reporting.ts# Clean client runtime error logger
│   │   ├── excuse.ts         # Offline excuse analyzer & penalty pool
│   │   ├── excuse.functions.ts# Server function with OpenAI / offline fallback
│   │   ├── identity.ts       # Name normalization to synthetic @peacekeeper.app email
│   │   ├── memes.ts          # Emoji sticker meme collection
│   │   ├── money.ts          # Pure accounting logic, balance calculation & CIBIL score
│   │   ├── prices.ts         # Hostel canteen defaults
│   │   └── sound.ts          # WebAudio sound synthesizer
│   ├── routes/
│   │   ├── __root.tsx        # App shell, audio listeners & meta tags
│   │   ├── index.tsx         # Sign-in / Sign-up landing page with meme of the day
│   │   └── _authenticated/   # Protected routes:
│   │       ├── home.tsx      # Balances dashboard & transaction list
│   │       ├── add.tsx       # Add debt, due, or split bill with canteen rate list
│   │       ├── friends.tsx   # Friend directory & individual ledgers
│   │       ├── leaderboard.tsx# Friend tier list ranking
│   │       └── court.tsx     # Roommate Court & Bullshit-o-Meter
│   ├── router.tsx            # TanStack Router configuration
│   ├── server.ts             # SSR error normalizer and entry point
│   ├── start.ts              # TanStack Start configuration with auth middleware
│   └── styles.css            # Tailwind CSS styling and sticker utilities
├── supabase-schema.sql       # 1-click database setup script for Supabase
├── vite.config.ts            # Vite & TanStack Start build configuration
└── package.json              # Standalone dependencies
```

---

## 🎯 Architecture Highlights

1. **Pure Business Logic**: All balance calculations, split division, rounding, and CIBIL score tier calculations are isolated in pure functions with test coverage in `src/lib/money.test.ts`.
2. **Deterministic Offline Fallbacks**: Bullshit-o-Meter and Roommate Court never crash if an external API is down. The app includes local rule-based Hinglish scoring.
3. **Synthetic Identity Engine**: Users only enter `Name` and `Password`. The backend maps names deterministically to `<username>@peacekeeper.app` under the hood.
4. **Sticker Aesthetics**: Designed with playful brutalist borders (`border-ink`), sticker shadows (`shadow-sticker`), and floating emoji memes.
