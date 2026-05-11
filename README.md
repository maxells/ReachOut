# GoFamous — Influencer outreach for AI companies

Find, match, and reach creators smartly. AI-powered outreach built for agent-led brands.

## Marketing UI (canonical)

The **GoFamous landing and static pages** live in **`FrontEnd/`**. The landing page is **`FrontEnd/index.html`** (hero, typewriter splash, glass stats, yellow CTA, full theme in `FrontEnd/css/styles.css`).

Preview that UI without Next.js:

```bash
npm install
npm run landing
```

Open **http://127.0.0.1:4173/** — you should see `index.html` as the entry.

**`localhost` refused to connect?** That means no server is running. In a terminal at the repo root run `npm run landing` and keep that terminal open, then refresh the browser.

See **`FrontEnd/README.md`** for file layout.

## Next.js app (funnel + APIs)

The **`src/`** app is the **funnel workflow** (`/funnel/...`), Zustand store, and API routes. Its root route `/` is a simple placeholder; it is **not** a copy of `FrontEnd/index.html` unless you merge designs later.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Run the Next dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the Next app (landing stub + **Get started → `/funnel`**).

**Both at once:** use two terminals — `npm run landing` (port **4173**) for the static GoFamous UI, and `npm run dev` (port **3000**) for the funnel.

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

**Reads from store**: `brand`, `campaign`, `matches`, `analysis` (optional grounding for pitch prompt)
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

### `POST /api/generate-pitch` request body

Matches `PitchGenerationRequest` in `src/lib/outreach.ts`. Required: **`brand`**, **`campaign`**, **`match`**, **`channel`**. Optional fields improve prompt grounding.

| Field | Required | Typical source |
| ----- | -------- | -------------- |
| `brand` | ✓ | `BrandInfo`; store slice uses `brandSliceToPitchBrand` to include optional `followers_min`, `followers_max`, `creator_search_keywords` |
| `campaign` | ✓ | `CampaignConfig` — budget, channels, followerRange, creatorTone |
| `match` | ✓ | `MatchResult` from Step 4 |
| `channel` | ✓ | `linkedin` \| `email` \| `reddit` \| `youtube` |
| `productDescription` | | Value prop / audience / industry fallback |
| `brandVoice` | | Override; prompt defaults to `campaign.creatorTone` |
| `outreachGoal` | | Often derived from collaboration type |
| `callToAction` | | Often includes sender name |
| `hashtags`, `keywords`, `brandAliases` | | From `BrandSlice` when non-empty |
| `marketAnalysisSummary` | | `analysis.summary` after Step 2 |
| `analysisCoverageScore`, `analysisIndustryAverage` | | From `AnalysisReport` |
| `analysisCompetitorSummary` | | Short line from `analysis.competitors` |

Use **`buildPitchGenerationRequest({ brand, campaign, match, channel, valueProp, collaborationType, senderName, analysis })`** from Step 5 instead of hand-authored mock payloads.

## Available shadcn/ui Components

Pre-installed: `button`, `card`, `input`, `label`, `select`, `slider`, `badge`, `progress`, `textarea`, `dialog`, `tabs`, `avatar`, `separator`

To add more:
```bash
npx shadcn@latest add <component-name>
```
