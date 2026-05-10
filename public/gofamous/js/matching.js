/**
 * GoFamous — Step 4: Creator Matching
 * Reads MatchResult[] from the Zustand persisted store (gofamous-funnel)
 * and renders creator cards using the shared CSS design system.
 */
(function () {
  const FUNNEL_STORE_KEY = "gofamous-funnel";

  /* ── Read store from localStorage ─────────────────────────── */
  function loadMatches() {
    try {
      const raw = localStorage.getItem(FUNNEL_STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.state?.matches ?? [];
    } catch {
      return [];
    }
  }

  /* ── Format numbers ───────────────────────────────────────── */
  function fmtNum(n) {
    if (!n || n === 0) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  }

  /* ── Initials from name ───────────────────────────────────── */
  function initials(name) {
    return name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /* ── Score badge class ────────────────────────────────────── */
  function scoreBadgeClass(score) {
    return score >= 80 ? "match-score-badge high" : "match-score-badge";
  }

  /* ── Render a single MatchResult as a kol-card ────────────── */
  function renderCard(match) {
    const { creator, matchScore, reasoning } = match;
    const niche = (creator.niche || []).slice(0, 3);
    const nicheHtml = niche
      .map((n) => `<span class="tag">${escapeHtml(n)}</span>`)
      .join("");

    const platformLabel = creator.platform
      ? creator.platform.charAt(0).toUpperCase() + creator.platform.slice(1)
      : "LinkedIn";

    return `
      <article class="kol-card">
        <div class="kol-card-top">
          <div class="avatar" aria-hidden="true">${escapeHtml(initials(creator.name))}</div>
          <div class="kol-meta" style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <h3 style="margin:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${escapeHtml(creator.name)}
              </h3>
              <span class="${scoreBadgeClass(matchScore)}">${matchScore}%</span>
            </div>
            <p class="kol-handle" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${escapeHtml(creator.bio || creator.handle)}
            </p>
            <div class="kol-tags">
              <span class="tag platform">${escapeHtml(platformLabel)}</span>
              ${nicheHtml}
            </div>
          </div>
        </div>

        ${reasoning ? `
        <div class="kol-why">
          <span class="kol-why-label">Why</span>
          <p class="kol-why-text">${escapeHtml(reasoning)}</p>
        </div>` : ""}

        <div class="kol-stats">
          <div class="stat">
            <div class="stat-val">${escapeHtml(fmtNum(creator.followers))}</div>
            <div class="stat-label">Connections</div>
          </div>
          <div class="stat">
            <div class="stat-val">${matchScore}/100</div>
            <div class="stat-label">Match score</div>
          </div>
          <div class="stat">
            <div class="stat-val">${escapeHtml(platformLabel)}</div>
            <div class="stat-label">Platform</div>
          </div>
        </div>

        <div class="kol-card-actions">
          <button
            type="button"
            class="btn btn-secondary btn-sm shortlist-toggle"
            data-id="${escapeHtml(creator.id)}"
          >
            Add to shortlist
          </button>
          <a
            class="btn btn-primary btn-sm"
            href="${escapeHtml(`/funnel/step5-outreach?kol=${encodeURIComponent(creator.id)}`)}"
          >
            Draft outreach
          </a>
        </div>
      </article>
    `;
  }

  /* ── Show / hide state panels ─────────────────────────────── */
  function show(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }

  /* ── Main render ──────────────────────────────────────────── */
  function render() {
    const matches = loadMatches();

    console.group("[Step4 matching.js] Creator matching results");
    console.log(`Loaded ${matches.length} match(es) from localStorage`);
    matches.forEach((m, i) => {
      console.log(
        `  [${i + 1}] ${m.creator.name} | score: ${m.matchScore} | followers: ${m.creator.followers}`
      );
      console.log(`       reason: ${m.reasoning}`);
      console.log(`       niche: ${(m.creator.niche || []).join(", ")}`);
    });
    console.groupEnd();

    hide("match-state-loading");

    if (matches.length === 0) {
      show("match-state-empty");
      return;
    }

    // Render count label
    const countEl = document.getElementById("match-count");
    if (countEl) {
      countEl.textContent = `Found ${matches.length} matching influencer${matches.length !== 1 ? "s" : ""}`;
    }

    // Render cards
    const grid = document.getElementById("kol-grid");
    if (grid) {
      grid.innerHTML = matches.map(renderCard).join("");
      bindShortlistToggles(grid, null);
    }

    show("match-results");

    // Reveal Continue button (steps.js manages its href)
    const continueBtn = document.getElementById("step-continue");
    if (continueBtn) continueBtn.classList.remove("hidden");
  }

  /* ── If no matches yet: trigger API fetch then re-render ──── */
  function maybeFetch() {
    const matches = loadMatches();
    if (matches.length > 0) return; // already have data

    // Read brand + campaign from store
    let brand, campaign;
    try {
      const raw = localStorage.getItem("gofamous-funnel");
      if (raw) {
        const parsed = JSON.parse(raw);
        brand = parsed?.state?.brand;
        campaign = parsed?.state?.campaign;
      }
    } catch { /* ignore */ }

    if (!brand?.name || !brand?.industry) {
      // No brand data yet — nothing to fetch
      hide("match-state-loading");
      show("match-state-empty");
      return;
    }

    fetch("/api/match-creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, campaign }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.matches && data.matches.length > 0) {
          // Persist into Zustand store slice via localStorage
          try {
            const raw = localStorage.getItem("gofamous-funnel");
            const parsed = raw ? JSON.parse(raw) : { state: {} };
            parsed.state.matches = data.matches;
            localStorage.setItem("gofamous-funnel", JSON.stringify(parsed));
          } catch { /* ignore */ }
          render();
        } else {
          hide("match-state-loading");
          show("match-state-empty");
        }
      })
      .catch((err) => {
        console.error("[Step4] API error:", err);
        hide("match-state-loading");
        show("match-state-empty");
      });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    const matches = loadMatches();
    if (matches.length > 0) {
      render();
    } else {
      maybeFetch();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
