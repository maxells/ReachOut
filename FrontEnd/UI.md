# GoFamous — UI reference

Static multi-page demo for influencer (KOL) outreach aimed at AI agent companies. Visual language is **marketing product**: **light grey page**, **white cards**, **soft shadows**, **large corner radius (~28px)**, and a **lime accent** (`#c8f01a`) for CTAs and highlights—similar to modern fintech / consumer app landing pages.

---

## Page map

| | File | Role |
|---|------|------|
| **Landing** | `index.html` | Hero / value prop — **no** workflow step bar; **Get started** → `brand.html` |
| Step 1 | `brand.html` | Brand & agent profile |
| Step 2 | `mentions.html` | Mentions, charts, competitor table |
| Step 3 | `campaign.html` | Budget, filters, creator grid |
| Step 4 | `outreach.html` | Message drafts / outreach |

**Landing** (`index.html`): Full-screen **`.landing-splash`** (`--hero-bg-image` + typewriter → **fixed hero band**, same photo, large type), then **`#landing-app`** on **`bg-mesh`**: soft **top gradient** under the hero; **`landing-body`** has **no** extra photo/panel. **`h1.hero-animated-heading`** = headline only; sub line is a **`p`**. **`.landing-cta`**. No `steps.js`.

**Workflow pages** (`brand.html` … `outreach.html`): add **`step-flow`** (four dots), main **`panel`**, **`step-cta`** below. **`js/steps.js`** syncs dots, **`[nn/04]`** label, **← Home** (step 1) or **← Back**, **Next** / **Continue**.

---

## Global layout

- **`body`** — Full viewport, **light** background (`--bg-page`), **DM Sans** throughout. No scanlines.
- **Landing splash** (`index.html` · `.landing-splash`) — Fixed full-screen photo via **`--hero-bg-image`**, gradient overlay, typewriter headline **`h1.hero-animated-heading`** + sub line **`p.hero-animated-line--secondary`** (`js/landing-hero.js`). Rest of page is **`inert`** until the script reveals **`#landing-app`**.
- **`.bg-mesh`** — Fixed underlay: soft **radial highlights** (no pixel grid).
- **`.app`** — Max width `1280px`, centered, horizontal padding; stacks above the mesh (`z-index: 10`).
- **`.site-header`** — Brand row. **`.brand-mark`** is a rounded tile with gradient lime and the “G”; **`.brand-text`** holds the product title + tagline in dark text.

---

## Typography

| Role | Font | Typical use |
|------|------|-------------|
| **All UI** | DM Sans (`--font-prose` / `--font-display`, same stack) | Headings, body, buttons, metrics |
| **Code snippets** | `ui-monospace` stack | `code` in dev notes, inline hints |

Headings use **bold** weights and **tight negative letter-spacing**; body copy is **sentence case** with comfortable line height.

---

## Color tokens (`:root`)

| Token | Role |
|-------|------|
| `--accent` / `--neon` | Primary lime CTA fills, highlights, current step ring |
| `--accent-soft` | Muted lime backgrounds (tags, table “you” row) |
| `--black` | Near-black `#141414` (text on accent, strong contrast) |
| `--surface` / `--surface-2` | White / warm grey card fills |
| `--text` / `--text-muted` | Primary and secondary copy |
| `--border` | Light hairline borders |
| `--bg-page` | Outer page `#ecece8` |

Shadows are **soft** (`--shadow-hard`, `--shadow-card`) for depth without harsh offset blocks.

---

## Shape & borders

- **`--border-width`**: `1px` on most UI.
- **`--radius`**: ~`28px` on main panels; **`--radius-sm`** ~`16px` on nested cards; **`--pill`**: full rounding for buttons and chips.
- **Step dots**: **circles**; done = filled dark; current = lime fill + soft outer ring.

---

## Navigation & flow

- **`.landing-cta`** — Centered primary action on **`index.html`** only (e.g. **Get started** → `brand.html`).
- **`.step-flow`** — **White** card strip on workflow pages; **four** `.step-dot` links (`brand` → `outreach`) and `#step-flow-label` **`[01/04]` … `[04/04]`**.
- **`.step-cta`** — **← Home** or **← Back** + **Next** / **Continue** (hidden on last step).
- **`js/steps.js`** — Loaded only on workflow pages; first step **Back** is **Home** → `index.html`.

---

## Core components (CSS)

- **`.panel`** — White card, rounded, soft shadow. **`.panel-header`** — large `h2` + descriptive `p`.
- **`.btn`** — Pill-shaped; **primary** = lime fill + dark label; **secondary** = white + border.
- **`.kol-card`**, **`.tag`**, **`.avatar`** — Rounded, light borders; platform tag inverted (dark pill).
- **Mentions** — **`.metric-box`**, **`.chart-box`** (Chart.js uses rounded bars + DM Sans ticks in `js/mentions.js`).
- **Campaign** — **`.budget-well-ro`**, **`.reach-callout-ro`** (gradient lime callout).
- **`.ai-panel`** — Soft lime-tinted gradient panel; **`.draft-output`** — light textarea-style block.
- **`.dev-note`** — Light dashed callout for demo notes.

---

## Assets

- **Font**: [Google Fonts — DM Sans](https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap) (linked in each HTML file).
- **Stylesheet**: `css/styles.css`.
- **Scripts**: `js/steps.js` on workflow pages only; landing has no `steps.js`.

---

## Extending the UI

1. Prefer **CSS variables** in `:root` for new colors or radii.
2. New screens should reuse **`.panel`**, **`.btn`**, and the shared header / step chrome for consistency.
