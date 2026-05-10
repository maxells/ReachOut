/**
 * GoFamous — shared frontend demo utilities
 * Backend: replace MOCK_* with API calls; persist via your endpoints.
 */

const STORAGE_SHORTLIST = "reachout_shortlist_v1";
const STORAGE_PIPELINE = "reachout_pipeline_v1";

const MOCK_KOLS = [
  {
    id: "kol-1",
    name: "Alex Rivera",
    handle: "@alexbuildsagents",
    platform: "X",
    niche: "AI engineering",
    tags: ["LLMs", "agents", "Python"],
    followers: "128K",
    engagement: "4.2%",
    fitScore: 94,
    initials: "AR",
  },
  {
    id: "kol-2",
    name: "Morgan Chen",
    handle: "@morgan_ai",
    platform: "YouTube",
    niche: "Product & AI",
    tags: ["reviews", "tutorials", "startups"],
    followers: "340K",
    engagement: "5.1%",
    fitScore: 88,
    initials: "MC",
  },
  {
    id: "kol-3",
    name: "Jordan Kim",
    handle: "jordan.dev",
    platform: "LinkedIn",
    niche: "B2B SaaS",
    tags: ["GTM", "enterprise", "AI ops"],
    followers: "72K",
    engagement: "6.8%",
    fitScore: 91,
    initials: "JK",
  },
  {
    id: "kol-4",
    name: "Sam Okonkwo",
    handle: "@samcodes",
    platform: "X",
    niche: "Developer tools",
    tags: ["OSS", "DX", "agents"],
    followers: "56K",
    engagement: "3.9%",
    fitScore: 86,
    initials: "SO",
  },
  {
    id: "kol-5",
    name: "Priya Nair",
    handle: "AgentStudio",
    platform: "Newsletter",
    niche: "AI product",
    tags: ["strategy", "founders", "workflow"],
    subscribers: "42K",
    openRate: "48%",
    fitScore: 82,
    initials: "PN",
  },
  {
    id: "kol-6",
    name: "Chris Patel",
    handle: "@chrisp_ai",
    platform: "TikTok",
    niche: "Consumer AI",
    tags: ["short-form", "demos", "viral"],
    followers: "890K",
    engagement: "7.2%",
    fitScore: 79,
    initials: "CP",
  },
];

const MOCK_PIPELINE = {
  discovered: [
    { id: "p1", name: "Alex Rivera", note: "Flagged from search: agents + Python" },
    { id: "p2", name: "Morgan Chen", note: "High trust; long-form reviews" },
  ],
  contacted: [{ id: "p3", name: "Jordan Kim", note: "DM sent — LinkedIn" }],
  replied: [{ id: "p4", name: "Sam Okonkwo", note: "Asked for one-pager" }],
  partnered: [],
};

const MOCK_DRAFT_TEMPLATE = `Hi {{name}},

We're {{company}} — we build agentic workflows for teams shipping AI products. Your recent content on {{topic}} lines up with how our customers think about reliability and evals.

We'd love to explore a {{collab_type}} — happy to share a short deck and access for your team to try the product.

Open to a 15-min call next week?

Best,
{{sender}}`;

function loadShortlistIds() {
  try {
    const raw = localStorage.getItem(STORAGE_SHORTLIST);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveShortlistIds(set) {
  localStorage.setItem(STORAGE_SHORTLIST, JSON.stringify([...set]));
}

function loadPipelineState() {
  try {
    const raw = localStorage.getItem(STORAGE_PIPELINE);
    if (!raw) return structuredClone(MOCK_PIPELINE);
    return JSON.parse(raw);
  } catch {
    return structuredClone(MOCK_PIPELINE);
  }
}

function savePipelineState(state) {
  localStorage.setItem(STORAGE_PIPELINE, JSON.stringify(state));
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function showToast(message) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function kolById(id) {
  return MOCK_KOLS.find((k) => k.id === id);
}

function filterKols(list, query, platform) {
  const q = query.trim().toLowerCase();
  return list.filter((k) => {
    const platOk = platform === "all" || k.platform === platform;
    if (!platOk) return false;
    if (!q) return true;
    const blob = [k.name, k.handle, k.niche, ...k.tags].join(" ").toLowerCase();
    return blob.includes(q);
  });
}

/**
 * @param {object} kol
 * @param {{ shortlistIds: Set<string>, outreachHref?: string }} opts
 */
function formatKolCard(kol, opts) {
  const { shortlistIds, outreachHref } = opts;
  const inList = shortlistIds.has(kol.id);
  const reachKey = kol.subscribers ? "subscribers" : "followers";
  const reachVal = kol[reachKey];
  const secondaryKey = kol.openRate ? "openRate" : "engagement";
  const secondaryVal = kol[secondaryKey];
  const secondaryLabel = kol.openRate ? "Open rate" : "Engagement";
  const outreachLink = outreachHref ?? `outreach.html?kol=${encodeURIComponent(kol.id)}`;

  return `
    <article class="kol-card" data-id="${kol.id}">
      <div class="kol-card-top">
        <div class="avatar" aria-hidden="true">${kol.initials}</div>
        <div class="kol-meta">
          <h3>${escapeHtml(kol.name)}</h3>
          <p class="kol-handle">${escapeHtml(kol.handle)}</p>
          <div class="kol-tags">
            <span class="tag platform">${escapeHtml(kol.platform)}</span>
            <span class="tag">${escapeHtml(kol.niche)}</span>
            ${kol.tags.slice(0, 2).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="kol-stats">
        <div class="stat">
          <div class="stat-val">${escapeHtml(reachVal)}</div>
          <div class="stat-label">${reachKey}</div>
        </div>
        <div class="stat">
          <div class="stat-val">${escapeHtml(secondaryVal)}</div>
          <div class="stat-label">${secondaryLabel}</div>
        </div>
        <div class="stat">
          <div class="stat-val">${kol.fitScore}</div>
          <div class="stat-label">Fit</div>
        </div>
      </div>
      <div class="kol-card-actions">
        <button type="button" class="btn btn-secondary btn-sm shortlist-toggle" data-id="${kol.id}">
          ${inList ? "Remove from shortlist" : "Add to shortlist"}
        </button>
        <a class="btn btn-primary btn-sm" href="${outreachLink}">Draft outreach</a>
      </div>
    </article>
  `;
}

function bindShortlistToggles(root, onChange) {
  root.querySelectorAll(".shortlist-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const shortlistIds = loadShortlistIds();
      if (shortlistIds.has(id)) {
        shortlistIds.delete(id);
        showToast("Removed from shortlist");
      } else {
        shortlistIds.add(id);
        showToast("Added to shortlist");
      }
      saveShortlistIds(shortlistIds);
      if (onChange) onChange(shortlistIds);
    });
  });
}
