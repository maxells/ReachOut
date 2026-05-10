# GoFamous — static marketing UI

This folder holds the **canonical product UI**: HTML, CSS, and scripts for the GoFamous landing and workflow pages.

| File | Purpose |
|------|---------|
| **`index.html`** | **Landing page** (hero, splash, stats, CTA) |
| `brand.html`, `campaign.html`, `mentions.html`, `outreach.html` | Workflow steps (legacy static flow) |
| `css/styles.css` | Global styles (theme, glass cards, hero photo, etc.) |
| `js/` | Page behavior (e.g. `landing-hero.js` typewriter splash) |

## Preview locally

From the **repository root**:

```bash
npm run landing
```

Then open **http://localhost:4173** (or the URL printed in the terminal).

Alternatively (Python):

```bash
cd FrontEnd && python3 -m http.server 4173 --bind 127.0.0.1
```

Then open **http://127.0.0.1:4173/**.

## Note on `FrontEnd/src/`

There is also a nested Next.js app under `FrontEnd/src/`. The **designed marketing experience** you ship from this folder is primarily **`index.html` + `css/` + `js/`**. The nested Next tree is optional/experimental unless your team standardizes on it.
