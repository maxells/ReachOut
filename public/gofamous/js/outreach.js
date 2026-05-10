/**
 * GoFamous — Step 5: Outreach draft composer.
 * Reads brand data from localStorage, populates creator select,
 * and generates personalised draft previews.
 */
(function () {
  const STORAGE_BRAND = "reachout_brand_v1";
  const STORAGE_OUTREACH = "gofamous_outreach_v1";

  /* ── Helpers ──────────────────────────────────────────────── */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function loadBrand() {
    try {
      const raw = localStorage.getItem(STORAGE_BRAND);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function loadOutreachState() {
    try {
      const raw = localStorage.getItem(STORAGE_OUTREACH);
      return raw ? JSON.parse(raw) : { sent: [] };
    } catch {
      return { sent: [] };
    }
  }

  function saveOutreachState(state) {
    localStorage.setItem(STORAGE_OUTREACH, JSON.stringify(state));
  }

  /* ── Draft template ───────────────────────────────────────── */
  function buildDraft(kol, company, product, sender, collabType) {
    const name = kol ? kol.name.split(" ")[0] : "there";
    const topic = kol ? kol.niche : "your space";
    const c = company || "our company";
    const p = product || "what we build";
    const s = sender || "the team";
    const ct = collabType || "collaboration";

    return `Hi ${name},

I came across your work on ${topic} — really enjoyed your perspective.

I'm ${s} from ${c}. We help teams ${p}.

We'd love to explore a ${ct} with you. Given your audience and what we're building, I think there's a genuine fit here.

Would you be open to a quick 15-min call this week to explore ideas?

Best,
${s}`;
  }

  /* ── Populate creator select ──────────────────────────────── */
  function populateSelect(selectEl, preselectedId) {
    selectEl.innerHTML = "";

    MOCK_KOLS.forEach((kol) => {
      const opt = document.createElement("option");
      opt.value = kol.id;
      opt.textContent = `${kol.name} — ${kol.platform} (${kol.niche})`;
      if (kol.id === preselectedId) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  /* ── Render draft preview ─────────────────────────────────── */
  function renderDraft() {
    const selectEl = qs("#outreach-kol");
    const draftEl = qs("#draft-body");
    if (!draftEl) return;

    const kol = kolById(selectEl ? selectEl.value : null);
    const company = (qs("#field-company") || {}).value || "";
    const product = (qs("#field-product") || {}).value || "";
    const sender = (qs("#field-sender") || {}).value || "";
    const collabType = (qs("#field-collab") || {}).value || "";

    const text = buildDraft(kol, company, product, sender, collabType);
    draftEl.innerHTML = text
      .split("\n")
      .map((line) => (line ? `<p style="margin:0 0 0.5em">${escapeHtml(line)}</p>` : "<br>"))
      .join("");
  }

  /* ── Pre-fill fields from brand storage ──────────────────── */
  function prefillFromBrand() {
    const brand = loadBrand();

    const companyEl = qs("#field-company");
    if (companyEl && !companyEl.value && brand.name) {
      companyEl.value = brand.name;
    }

    const senderEl = qs("#field-sender");
    if (senderEl && !senderEl.value && brand.name) {
      senderEl.value = `the ${brand.name} team`;
    }

    const productEl = qs("#field-product");
    if (productEl && !productEl.value && brand.tagline) {
      productEl.value = brand.tagline;
    }
  }

  /* ── Copy to clipboard ────────────────────────────────────── */
  function copyDraft() {
    const draftEl = qs("#draft-body");
    if (!draftEl) return;

    const text = draftEl.innerText || draftEl.textContent || "";
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Draft copied to clipboard!"))
      .catch(() => {
        // Fallback for non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Draft copied!");
      });

    // Record in outreach state
    const state = loadOutreachState();
    const selectEl = qs("#outreach-kol");
    const kol = kolById(selectEl ? selectEl.value : null);
    if (kol) {
      const already = state.sent.some((s) => s.kolId === kol.id);
      if (!already) {
        state.sent.push({ kolId: kol.id, name: kol.name, sentAt: new Date().toISOString() });
        saveOutreachState(state);
      }
    }
  }

  /* ── Wire up events ───────────────────────────────────────── */
  function bindEvents() {
    const selectEl = qs("#outreach-kol");
    if (selectEl) selectEl.addEventListener("change", renderDraft);

    ["#field-company", "#field-product", "#field-sender"].forEach((sel) => {
      const el = qs(sel);
      if (el) el.addEventListener("input", renderDraft);
    });

    const collabEl = qs("#field-collab");
    if (collabEl) collabEl.addEventListener("change", renderDraft);

    const regenBtn = qs("#btn-regenerate");
    if (regenBtn) regenBtn.addEventListener("click", renderDraft);

    const copyBtn = qs("#btn-copy");
    if (copyBtn) copyBtn.addEventListener("click", copyDraft);
  }

  /* ── Read ?kol= param from URL ────────────────────────────── */
  function getKolParam() {
    try {
      return new URLSearchParams(window.location.search).get("kol") || null;
    } catch {
      return null;
    }
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    const selectEl = qs("#outreach-kol");
    const preselected = getKolParam();

    if (selectEl) populateSelect(selectEl, preselected);

    prefillFromBrand();
    bindEvents();
    renderDraft();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
