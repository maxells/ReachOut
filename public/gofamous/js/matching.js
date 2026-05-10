/**
 * GoFamous — Step 4: Creator Matching
 *
 * Reads brand data from reachout_brand_v1 (written by brand.js in step 1)
 * and campaign data from gofamous_campaign_v1 (written by campaign.js in step 3).
 * Sends to /api/match-creators, then renders kol-cards using the shared CSS.
 * Results are cached in gofamous_matches_v1.
 */
(function () {
  const BRAND_KEY = "reachout_brand_v1";
  const CAMPAIGN_KEY = "gofamous_campaign_v1";
  const MATCHES_KEY = "gofamous_matches_v1";

  /* ── Read cached matches ──────────────────────────────────── */
  function loadMatches() {
    try {
      const raw = localStorage.getItem(MATCHES_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function saveMatches(matches) {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  }

  /* ── Build API payload from HTML localStorage keys ────────── */
  function buildPayload() {
    let brandRaw = {};
    let campaignRaw = {};
    try {
      const b = localStorage.getItem(BRAND_KEY);
      if (b) brandRaw = JSON.parse(b);
    } catch { /* ignore */ }
    try {
      const c = localStorage.getItem(CAMPAIGN_KEY);
      if (c) campaignRaw = JSON.parse(c);
    } catch { /* ignore */ }

    // Map HTML fields → API BrandSlice shape
    const industry =
      (campaignRaw.industries && campaignRaw.industries[0]) ||
      (brandRaw.categories && brandRaw.categories[0]) ||
      "";
    const keywords = campaignRaw.keywords || [];
    const brand = {
      name: brandRaw.name || "",
      url: brandRaw.url || "",
      industry: industry,
      targetAudience: "",
      socials: {
        linkedin: brandRaw.li || undefined,
        twitter: brandRaw.tw || undefined,
        youtube: brandRaw.yt || undefined,
      },
      hashtags: [],
      keywords: keywords,
      brandAliases: [],
    };

    // Map HTML fields → API CampaignConfig shape
    const channelMap = {
      YouTube: "youtube",
      X: "twitter",
      TikTok: "tiktok",
      Newsletter: "newsletter",
      LinkedIn: "linkedin",
      Podcast: "podcast",
    };
    const channels = (campaignRaw.channels || []).map(
      (ch) => channelMap[ch] || ch.toLowerCase()
    );

    // Read follower range from the DOM inputs (they are in campaign.html)
    let folMin = 10000;
    let folMax = 200000;
    try {
      const minEl = document.getElementById("fol-min");
      const maxEl = document.getElementById("fol-max");
      if (minEl) folMin = parseInt(minEl.value.replace(/,/g, ""), 10) || 10000;
      if (maxEl) folMax = parseInt(maxEl.value.replace(/,/g, ""), 10) || 200000;
    } catch { /* use defaults */ }

    const campaign = {
      budget: 5000,
      channels: channels,
      followerRange: [folMin, folMax],
      creatorTone: "educator",
    };

    return { brand, campaign };
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

  /* ── Render cached results ────────────────────────────────── */
  function render(matches) {
    hide("match-state-loading");
    hide("match-state-empty");

    if (!matches || matches.length === 0) {
      show("match-state-empty");
      return;
    }

    console.group("[Step4] Influencer results");
    matches.forEach((m, i) => {
      console.log(
        `[${i + 1}] ${m.creator.name} | score: ${m.matchScore} | followers: ${m.creator.followers} | handle: ${m.creator.handle}`
      );
      console.log(`     reason: ${m.reasoning}`);
      console.log(`     niche: ${(m.creator.niche || []).join(", ")}`);
    });
    console.groupEnd();

    const countEl = document.getElementById("match-count");
    if (countEl) {
      countEl.textContent = `Found ${matches.length} matching influencer${matches.length !== 1 ? "s" : ""}`;
    }

    const grid = document.getElementById("kol-grid");
    if (grid) {
      grid.innerHTML = matches.map(renderCard).join("");
      bindShortlistToggles(grid, null);
    }

    show("match-results");

    const continueBtn = document.getElementById("step-continue");
    if (continueBtn) continueBtn.classList.remove("hidden");
  }

  /* ── Fetch from API ───────────────────────────────────────── */
  function fetchMatches() {
    const payload = buildPayload();

    console.group("[Step4] Calling /api/match-creators");
    console.log("brand:", payload.brand);
    console.log("campaign:", payload.campaign);
    console.groupEnd();

    if (!payload.brand.name && !payload.brand.industry) {
      console.warn("[Step4] No brand data found — please complete step 1 and step 3 first");
      hide("match-state-loading");
      show("match-state-empty");
      return;
    }

    fetch("/api/match-creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("[Step4] API returned error:", data.error);
          hide("match-state-loading");
          show("match-state-empty");
          return;
        }
        const matches = data.matches || [];
        console.log(`[Step4] API returned ${matches.length} match(es)`);
        if (matches.length > 0) {
          saveMatches(matches);
        }
        render(matches);
      })
      .catch((err) => {
        console.error("[Step4] API fetch failed:", err);
        hide("match-state-loading");
        show("match-state-empty");
      });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    const cached = loadMatches();
    if (cached.length > 0) {
      console.log("[Step4] Using cached matches (" + cached.length + ")");
      render(cached);
    } else {
      fetchMatches();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
