# ReachOut

Influencer outreach demo for AI agent companies — **multi-page static frontend** with a **linear 5-step flow** (Briefd-style step bar); backend can be added later.

## Steps

| Step | File | Purpose |
|------|------|---------|
| 1 | `index.html` | Greeting — why creators for AI agents |
| 2 | `brand.html` | Describe your agent / product (+ live preview, saved locally) |
| 3 | `mentions.html` | Mentions & competitors snapshot (Chart.js bars + table) |
| 4 | `campaign.html` | Budget, channels, filters + mock creator search |
| 5 | `outreach.html` | Customized outreach drafts (`?kol=` deep link from cards) |

Shared chrome: `nav.step-flow` + **Back / Continue** driven by `js/steps.js`.

## Scripts

- `js/common.js` — mock KOLs, shortlist storage, card helpers, toast
- `js/brand.js` — brand form + `reachout_brand_v1` in `localStorage`
- `js/mentions.js` — Chart.js init for step 3
- `js/campaign.js` — budget UI + discover grid (formerly standalone discover page)
- `js/outreach.js` — draft template; pre-fills company/product from brand storage when empty
- `js/steps.js` — step dots, labels, prev/next links

## Run locally

Open `index.html` in a browser, or serve the repo root (e.g. `python3 -m http.server`) so Chart.js CDN and relative paths resolve consistently.
