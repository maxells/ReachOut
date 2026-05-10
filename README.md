# ReachOut — AI-Powered Influencer Outreach Platform

Find, match, and reach out to the perfect creators for your brand. Our AI agent acts as your strategist — not just a database.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** — global state management
- **Vercel AI SDK** + **OpenAI** — AI features
- **Storage**: JSON files (creator data) + localStorage (user progress)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   ├── funnel/
│   │   ├── layout.tsx                 # Funnel layout (progress bar)
│   │   ├── step1-onboarding/          # [Member 1] Brand info form
│   │   ├── step2-analysis/            # [Member 1] Market analysis display
│   │   ├── step3-campaign/            # [Member 1] Campaign params form
│   │   ├── step4-matching/            # [Member 2] Creator matching results
│   │   └── step5-outreach/            # [Member 3] Outreach management
│   └── api/
│       ├── analyze-brand/             # [Member 1] Brand analysis API
│       ├── match-creators/            # [Member 2] Creator matching API
│       ├── generate-pitch/            # [Member 3] Pitch generation API
│       └── send-outreach/             # [Member 3] Send outreach API
├── components/
│   ├── ui/                            # shadcn/ui components (shared)
│   ├── funnel/                        # Shared funnel components
│   ├── input/                         # [Member 1] Input module components
│   ├── scraping/                      # [Member 2] Scraping module components
│   └── outreach/                      # [Member 3] Outreach module components
├── lib/
│   ├── types.ts                       # Shared type definitions (CONTRACT)
│   ├── store.ts                       # Zustand store (CONTRACT)
│   ├── constants.ts                   # Shared constants
│   ├── utils.ts                       # Shared utilities
│   ├── creators.ts                    # [Member 2] Creator data utils
│   └── outreach.ts                    # [Member 3] Outreach utils
└── data/
    ├── creators.json                  # Mock creator database (50 entries)
    ├── industries.json                # Industry categories
    └── benchmarks.json                # Competitor benchmarks
```

## Team Assignments

### Member 1 — Input (Brand Info + Campaign Setup)

**Owns**: Step 1, Step 2, Step 3, `components/input/`, `api/analyze-brand/`

Tasks:
- Build the brand onboarding form (Step 1)
- Display AI market analysis report (Step 2)
- Build campaign parameter form with budget, channels, follower range, creator tone (Step 3)
- Implement `/api/analyze-brand` endpoint

**Reads from store**: `analysis` (for Step 2 display)
**Writes to store**: `brand`, `campaign`

### Member 2 — Scraping (Creator Data + Matching)

**Owns**: Step 4, `components/scraping/`, `api/match-creators/`, `lib/creators.ts`, `data/`

Tasks:
- Implement creator filtering and ranking logic in `lib/creators.ts`
- Build creator matching results page with cards, scores, and AI reasoning (Step 4)
- Implement `/api/match-creators` endpoint

**Reads from store**: `brand`, `campaign`
**Writes to store**: `analysis`, `matches`

### Member 3 — Outreach (AI Pitches + Campaign Launch)

**Owns**: Step 5, `components/outreach/`, `api/generate-pitch/`, `api/send-outreach/`, `lib/outreach.ts`

Tasks:
- Build pitch preview/editor components
- Implement streaming AI pitch generation (Step 5)
- Build outreach status tracking
- Implement `/api/generate-pitch` and `/api/send-outreach` endpoints

**Reads from store**: `matches`, `brand`
**Writes to store**: `outreach`

## Development Rules (Avoid Merge Conflicts)

1. **Only edit files in your module** — never touch another member's folders
2. **Shared files are append-only** — `constants.ts`, `utils.ts` — only add, never modify existing code
3. **types.ts is frozen** — if you need new types, define them locally in your module
4. **Add shadcn components via CLI** — `npx shadcn@latest add <component>`, don't edit `ui/` manually
5. **Use separate branches** — `feat/input`, `feat/scraping`, `feat/outreach`, rebase on main regularly

## Store Contract

The Zustand store in `lib/store.ts` is the data contract between modules:

```
Member 1 writes: brand, campaign    → Member 2 reads these
Member 2 writes: analysis, matches  → Member 1 reads analysis (step2), Member 3 reads matches
Member 3 writes: outreach           → No other module reads this
```

## Available shadcn/ui Components

Pre-installed: `button`, `card`, `input`, `label`, `select`, `slider`, `badge`, `progress`, `textarea`, `dialog`, `tabs`, `avatar`, `separator`

To add more:
```bash
npx shadcn@latest add <component-name>
```
