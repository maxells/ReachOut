/**
 * campaign.html — budget & filters + discover grid (mock KOLs).
 */

const BGT_MAP = {
  1: { d: "$1,000", n: "Enough for <strong>1–2 micro-creators</strong> at ~$500–800 each.", c: "1–2", r: "280k", s: "across ~2 creators" },
  2: { d: "$2,000", n: "<strong>2–3 creators</strong> — good first experiment.", c: "2–3", r: "600k", s: "across ~3 creators" },
  3: { d: "$3,000", n: "<strong>3–4 creators</strong> with channel diversity.", c: "3–4", r: "850k", s: "across ~4 creators" },
  4: { d: "$4,000", n: "<strong>3–5 creators</strong> + room for performance bumps.", c: "3–5", r: "1.0M", s: "across ~5 creators" },
  5: { d: "$5,000", n: "<strong>4–6 micro-creators</strong> — typical first campaign.", c: "4–6", r: "1.2M", s: "across ~5 creators" },
  6: { d: "$6,000", n: "<strong>5–7 creators</strong> or one mid-tier anchor.", c: "5–7", r: "1.6M", s: "across ~6 creators" },
  7: { d: "$7,000", n: "Mix of <strong>mid-tier + micro</strong>.", c: "5–7", r: "1.9M", s: "across ~7 creators" },
  8: { d: "$8,000", n: "<strong>Mid-tier campaign</strong> — 1 anchor + micro squad.", c: "6–8", r: "2.3M", s: "across ~7 creators" },
  9: { d: "$9,000", n: "<strong>Multi-channel push</strong>.", c: "7–9", r: "2.8M", s: "across ~8 creators" },
  10: { d: "$10,000+", n: "<strong>Scale</strong> — hero creator + micro coverage.", c: "8–10+", r: "3.5M+", s: "across 9+ creators" },
};

function updateBudget(v) {
  const row = BGT_MAP[v];
  if (!row) return;
  $("#bgt-display").textContent = row.d;
  $("#bgt-note").innerHTML = row.n;
  $("#sum-bgt").textContent = row.d;
  $("#sum-creators").textContent = row.c;
  $("#est-reach").textContent = row.r;
  $("#est-sub").textContent = "Targeted impressions " + row.s;
}

function updateChannelsSummary() {
  const active = [...document.querySelectorAll("#ch-pills .pill-ro.on")].map((p) => p.textContent.trim());
  $("#sum-ch").textContent =
    active.length > 0 ? active.slice(0, 4).join(", ") + (active.length > 4 ? " +" + (active.length - 4) : "") : "—";
}

function wireBudget() {
  const slider = $("#bgt-slider");
  slider.addEventListener("input", () => updateBudget(slider.value));
  updateBudget(slider.value);
}

function wireChannelPills() {
  document.querySelectorAll("#ch-pills .pill-ro").forEach((p) => {
    p.addEventListener("click", () => {
      p.classList.toggle("on");
      updateChannelsSummary();
    });
  });
  updateChannelsSummary();
}

function renderDiscover() {
  const query = $("#search-kols").value;
  const platform = $("#filter-platform").value;
  const filtered = filterKols(MOCK_KOLS, query, platform);
  const grid = $("#kol-grid");
  const shortlistIds = loadShortlistIds();

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No matches</strong>Try different keywords or platform.</div>`;
    return;
  }

  grid.innerHTML = filtered.map((k) => formatKolCard(k, { shortlistIds })).join("");

  bindShortlistToggles(grid, () => {
    renderDiscover();
  });
}

function wireDiscover() {
  $("#search-kols").addEventListener("input", renderDiscover);
  $("#filter-platform").addEventListener("change", renderDiscover);
}

function init() {
  wireBudget();
  wireChannelPills();
  wireDiscover();
  renderDiscover();
}

document.addEventListener("DOMContentLoaded", init);
