/**
 * brand.html — agent profile + live preview; persists to localStorage for outreach step (GoFamous demo).
 */
function $(sel, root = document) {
  return root.querySelector(sel);
}

const STORAGE_BRAND = "reachout_brand_v1";

const AUD_LABELS = {
  1: "Indie / solo builders",
  2: "Seed–Series A teams",
  3: "Growth-stage product orgs",
  4: "Enterprise pilot programs",
};

function loadBrand() {
  try {
    const raw = localStorage.getItem(STORAGE_BRAND);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBrand(data) {
  localStorage.setItem(STORAGE_BRAND, JSON.stringify(data));
}

function getSelectedAud() {
  const sel = document.querySelector(".aud-chip.selected");
  return sel ? sel.getAttribute("data-aud") : "2";
}

function gatherForm() {
  return {
    url: $("#url-in").value.trim(),
    name: $("#name-in").value.trim(),
    agentDesc: $("#agent-desc").value.trim(),
    tw: $("#tw-in").value.trim(),
    yt: $("#yt-in").value.trim(),
    aud: getSelectedAud(),
  };
}

function applyToPreview() {
  const d = gatherForm();
  $("#pv-name").textContent = d.name || "Your agent product";
  $("#pv-url").textContent = d.url || "youragent.dev";
  $("#pv-av").textContent = d.name ? d.name.substring(0, 2).toUpperCase() : "—";
  $("#pv-desc").textContent =
    d.agentDesc || "Describe what your AI agent does for users — helps match creators who speak that language.";
  $("#pv-aud").textContent = AUD_LABELS[d.aud] || AUD_LABELS[2];

  const handles = [];
  if (d.tw) handles.push({ c: "#1da1f2", l: d.tw.startsWith("@") ? d.tw : "@" + d.tw });
  if (d.yt) handles.push({ c: "#ff4d4d", l: d.yt.startsWith("@") ? d.yt : "@" + d.yt });
  const hEl = $("#pv-handles");
  hEl.innerHTML =
    handles.length > 0
      ? handles.map((h) => `<span class="tag platform">${escapeHtml(h.l)}</span>`).join(" ")
      : `<span class="tag tag--preview-muted">social handles</span>`;

  saveBrand({
    ...d,
    categories: [...document.querySelectorAll(".cat-pill.selected")].map((e) => e.textContent),
  });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function bindCats() {
  document.querySelectorAll(".cat-pill").forEach((p) => {
    p.addEventListener("click", () => {
      p.classList.toggle("selected");
      updateCatTags();
      applyToPreview();
    });
  });
}

function bindAudChips() {
  document.querySelectorAll(".aud-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".aud-chip").forEach((b) => {
        b.classList.remove("selected");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");
      applyToPreview();
    });
    btn.setAttribute("role", "radio");
    btn.setAttribute(
      "aria-checked",
      btn.classList.contains("selected") ? "true" : "false"
    );
  });
}

function updateCatTags() {
  const sel = [...document.querySelectorAll(".cat-pill.selected")].map((e) => e.textContent);
  const el = $("#pv-tags");
  el.innerHTML =
    sel.length > 0
      ? sel.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")
      : `<span class="tag tag--preview-muted">categories</span>`;
}

function hydrate() {
  const d = loadBrand();
  if (d.url) $("#url-in").value = d.url;
  if (d.name) $("#name-in").value = d.name;
  if (d.agentDesc) $("#agent-desc").value = d.agentDesc;
  if (d.tw) $("#tw-in").value = d.tw;
  if (d.yt) $("#yt-in").value = d.yt;
  const audKey = d.aud != null && d.aud !== "" ? String(d.aud) : "2";
  let matched = false;
  document.querySelectorAll(".aud-chip").forEach((btn) => {
    const on = btn.getAttribute("data-aud") === audKey;
    btn.classList.toggle("selected", on);
    if (on) matched = true;
  });
  if (!matched) {
    document.querySelectorAll(".aud-chip").forEach((btn) => {
      const on = btn.getAttribute("data-aud") === "2";
      btn.classList.toggle("selected", on);
    });
  }
  if (d.categories && d.categories.length) {
    d.categories.forEach((label) => {
      document.querySelectorAll(".cat-pill").forEach((p) => {
        if (p.textContent === label) p.classList.add("selected");
      });
    });
  }
  updateCatTags();
  applyToPreview();
}

function wire() {
  ["url-in", "name-in", "agent-desc", "tw-in", "yt-in"].forEach((id) => {
    $(`#${id}`).addEventListener("input", applyToPreview);
  });
  bindAudChips();
  bindCats();
}

function init() {
  hydrate();
  wire();
}

document.addEventListener("DOMContentLoaded", init);
