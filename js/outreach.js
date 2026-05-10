/**
 * outreach.html — AI-assisted draft (mock template)
 */

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function generateDraft() {
  const kolId = $("#outreach-kol").value;
  const kol = kolById(kolId);
  const company = $("#field-company").value.trim() || "your AI agents company";
  const product = $("#field-product").value.trim() || "agent orchestration for product teams";
  const sender = $("#field-sender").value.trim() || "Your Name";
  const collab = $("#field-collab").value;

  const topic = kol ? kol.tags[0] || kol.niche : "AI agents";
  const name = kol ? kol.name : "there";

  let text = MOCK_DRAFT_TEMPLATE.replace(/\{\{name\}\}/g, name)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{topic\}\}/g, topic)
    .replace(/\{\{collab_type\}\}/g, collab)
    .replace(/\{\{sender\}\}/g, sender);

  text += `\n\n---\nContext for backend: personalize with product="${product}" and KOL id=${kolId || "(none)"}.`;

  $("#draft-body").textContent = text;
}

function hydrateFromBrand() {
  try {
    const raw = localStorage.getItem("reachout_brand_v1");
    if (!raw) return;
    const b = JSON.parse(raw);
    const co = $("#field-company");
    const pr = $("#field-product");
    if (b.name && co && !co.value) co.value = b.name;
    if (b.agentDesc && pr && !pr.value) pr.value = b.agentDesc;
  } catch {
    /* ignore */
  }
}

function initOutreachForm() {
  hydrateFromBrand();
  const sel = $("#outreach-kol");
  const shortlistIds = loadShortlistIds();

  const shortlistKols = [...shortlistIds].map(kolById).filter(Boolean);
  const pool = shortlistKols.length ? shortlistKols : MOCK_KOLS;

  sel.innerHTML = [
    `<option value="">Select a KOL…</option>`,
    ...pool.map((k) => `<option value="${k.id}">${escapeHtml(k.name)} (${escapeHtml(k.platform)})</option>`),
  ].join("");

  const fromUrl = getQueryParam("kol");
  if (fromUrl && kolById(fromUrl)) {
    sel.value = fromUrl;
  } else {
    const preferred = [...shortlistIds][0];
    if (preferred) sel.value = preferred;
  }

  $("#field-company").addEventListener("input", generateDraft);
  $("#field-product").addEventListener("input", generateDraft);
  $("#field-sender").addEventListener("input", generateDraft);
  $("#field-collab").addEventListener("change", generateDraft);
  $("#outreach-kol").addEventListener("change", generateDraft);
  $("#btn-regenerate").addEventListener("click", () => {
    generateDraft();
    showToast("Draft refreshed (demo)");
  });
  $("#btn-copy").addEventListener("click", async () => {
    const text = $("#draft-body").textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Copy failed — select text manually");
    }
  });

  generateDraft();
}

document.addEventListener("DOMContentLoaded", initOutreachForm);
