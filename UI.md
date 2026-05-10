# ReachOut — UI reference

Static multi-page demo for influencer (KOL) outreach aimed at AI agent companies. Visual language mixes a **dark terminal field** with **cream “CRT window” panels**, **neon lime chrome**, and **square geometry** (no pill radii in the design tokens).

---

## Page map

| Step | File | Role |
|------|------|------|
| 1 | `index.html` | Greeting / value prop |
| 2 | `brand.html` | Brand & agent profile |
| 3 | `mentions.html` | Mentions, charts, competitor table |
| 4 | `campaign.html` | Budget, filters, creator grid |
| 5 | `outreach.html` | Message drafts / outreach |

Shared chrome on every page: `bg-mesh`, `site-header`, `step-flow`, `step-cta`, then a main `panel` (or split layouts). `js/steps.js` runs on all pages to sync step dots, the `[nn/05] …` label, and Back / Continue targets.

---

## Global layout

- **`body`** — Full viewport, dark background (`--bg-page`), DM Sans for copy. Subtle **scanlines** via `body::after` (fixed overlay, low opacity).
- **`.bg-mesh`** — Fixed underlay: radial green glow + **16px grid** of faint lime lines (`::after`).
- **`.app`** — Max width `1280px`, centered, horizontal padding; stacks above the mesh (`z-index: 10`).
- **`.site-header`** — Brand row only (no bottom border). **`.brand-mark`** is a square tile with the “R” logotype; **`.brand-text`** holds the product title + tagline.

---

## Typography

| Role | Font | Typical use |
|------|------|-------------|
| **Prose** | DM Sans (`--font-prose`) | Body, descriptions, labels, tables, sidebar copy, step label text |
| **Display / terminal** | VT323 (`--font-display`) | Product `h1`, panel titles, stat numerals, metric values, **all buttons** (`.btn`) |
| **Decorative mono** | VT323 (`--mono`) | ASCII line on greeting panel (`.panel-greet::before`) |

Inline **code** in dev notes uses `ui-monospace` stack, not VT323.

Important titles often use **uppercase + tracking** on the main brand `h1`; subtext is **sentence case**, normal spacing. Base body size is ~`1.125rem` with comfortable line height for reading.

---

## Color tokens (`:root`)

| Token | Role |
|-------|------|
| `--neon` | Primary accent (lime), borders on step bar, primary button text on black |
| `--neon-dim` | Secondary green accent |
| `--black` / `--border` | Outlines, primary button fill |
| `--white` | Near-white (cream tint) |
| `--surface` / `--surface-2` | Light panel fills (cream / gray-cream) |
| `--text` / `--text-muted` | Panel text and muted meta |
| `--bg-page` | Outer page background (near black) |
| `--chrome-muted` | Header tagline on dark area |

Shadows are **hard / offset** (`--shadow-hard`, `--shadow-neon`), not soft blurs—reinforces the flat, terminal look.

---

## Shape & borders

- **`--border-width`**: `2px` on major UI.
- **`--radius` / `--pill`**: `0` — panels, inputs, and chips are **square** or minimally rounded only where overridden (e.g. small radii on a few inner elements).
- **Step dots**: `14×14` squares, neon border; **done** state uses a diagonal stripe fill; **current** is solid neon.

---

## Navigation & flow

- **`.step-flow`** — Dark strip, neon border, contains `.step-dots` (links) and `#step-flow-label`.
- **`.step-cta`** — Back (`#step-back`, `.btn-secondary`) and Continue (`#step-continue`, `.btn-primary`). Hidden state uses `.hidden` (Continue hidden on last step).
- **`js/steps.js`** — Drives label text, `aria-current` on the active dot, `.done` on previous dots, and `href` / visibility for CTAs.

---

## Core components (CSS)

- **`.panel`** — Main cream “window”: border, hard shadow, padding. **`.panel-header`** — `h2` (display) + `p` (prose).
- **`.btn`**, **`.btn-primary`**, **`.btn-secondary`**, **`.btn-ghost`**, **`.btn-danger`**, **`.btn-sm`** — VT323, chunky borders, offset shadow; primary = black fill, neon label.
- **Forms** — `input`, `select`, `textarea`, **`.form-label`**; surfaces use `--surface-2`.
- **`.card-grid` / `.kol-card`** — Creator cards: avatar block, name (`h3` display), handle, **`.tag`** chips, **`.stat` / `.stat-val` / `.stat-label`**, actions row.
- **`.nav-tabs` / `.nav-tab`** — Optional tab row (pill-shaped container but square tabs in spirit).
- **`.toolbar`** — Search + filters row.
- **Mentions** — **`.metric-box`**, **`.chart-box`** + Chart.js canvas wrapper; **`.comp-table-ro`**; **`.insight-ro`** callout.
- **Campaign** — **`.campaign-split`**, **`.budget-num-ro`**, **`.pill-ro`** toggles, **`.sum-card-ro`** sticky snapshot.
- **Outreach** — **`.outreach-grid`**, **`.ai-panel`**, **`.draft-output`** (preformatted draft area).
- **`.dev-note`** — Dashed border note at bottom of some pages.
- **`.toast`** — Fixed bottom-right transient message (used when JS shows feedback).

---

## Step 1 greeting (`panel-greet`)

Centered hero inside a panel: **`.greet-eyebrow`**, **`.greet-title`** with **`.greet-em`** highlight, **`.greet-lead`**, **`.greet-strip`** of three **`.greet-stat`** blocks (big **`.greet-stat-num`**, **`.greet-stat-desc`**), **`.greet-foot`**. A single-line ASCII frame is drawn with **`::before`** (mono).

---

## Assets

- **Fonts** (Google Fonts, linked in each HTML file): **DM Sans** 400–700, **VT323**.
- **Stylesheet**: `css/styles.css` (single source of truth for tokens and components).
- **Scripts**: `js/steps.js` (global navigation); page-specific `brand.js`, `mentions.js`, `campaign.js`, `outreach.js`; `common.js` for shared mocks and KOL rendering.

---

## Accessibility notes

- Step dots are real **`<a>`** elements with **`aria-label`** per step.
- Active step uses **`aria-current="page"`** on the current dot.
- Keep focus styles if extending components (many controls are custom-styled; verify keyboard focus when adding features).

---

## Extending the UI

1. Prefer **CSS variables** in `:root` for new colors or border weight so the theme stays coherent.
2. Use **DM Sans** for new paragraphs and helper text; **VT323** for new hero headings or “machine” chrome.
3. New screens should include the same **header + step-flow + step-cta** skeleton and load **`js/steps.js`** if they belong in the five-step flow.
