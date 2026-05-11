/**
 * GoFamous — Step 3: channels, industry pills, creator keyword chips; persists filters.
 */
(function () {
  const STORAGE = "gofamous_campaign_v1";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return [...(root || document).querySelectorAll(sel)];
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }

  function followerFromInput(sel) {
    const el = qs(sel);
    if (!el) return null;
    const n = parseInt(String(el.value).replace(/,/g, "").trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  function gather() {
    const channels = qsa("#ch-pills .pill-ro.on").map((b) => b.textContent.trim());
    const industries = qsa("#industry-pills .cat-pill.selected").map((b) =>
      b.textContent.trim()
    );
    const keywords = qsa("#kw-tags .kw-chip").map((el) =>
      el.getAttribute("data-kw")
    );
    let followerMin = followerFromInput("#fol-min") ?? 10_000;
    let followerMax = followerFromInput("#fol-max") ?? 200_000;
    if (followerMin > followerMax) {
      const s = followerMin;
      followerMin = followerMax;
      followerMax = s;
    }
    return {
      channels,
      industries,
      keywords,
      followerMin,
      followerMax,
    };
  }

  function formatSummaryList(items, maxLen) {
    if (!items.length) return "—";
    const s = items.join(", ");
    return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
  }

  function updateSnapshot() {
    const d = gather();
    const ch = qs("#sum-ch");
    if (ch) ch.textContent = formatSummaryList(d.channels, 120);
    const ind = qs("#sum-ind");
    if (ind) ind.textContent = formatSummaryList(d.industries, 120);
    const kw = qs("#sum-kw");
    if (kw) kw.textContent = formatSummaryList(d.keywords, 140);
    save(d);
  }

  function renderKeyword(tag, container) {
    const span = document.createElement("span");
    span.className = "kw-chip";
    span.setAttribute("data-kw", tag);

    const label = document.createElement("span");
    label.textContent = tag;

    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "kw-chip-remove";
    rm.setAttribute("aria-label", `Remove keyword ${tag}`);
    rm.textContent = "×";
    rm.addEventListener("click", () => {
      span.remove();
      updateSnapshot();
    });

    span.appendChild(label);
    span.appendChild(rm);
    container.appendChild(span);
  }

  function bindChannels() {
    qsa("#ch-pills .pill-ro").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("on");
        updateSnapshot();
      });
    });
  }

  function bindIndustry() {
    qsa("#industry-pills .cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("selected");
        updateSnapshot();
      });
    });
  }

  function bindKeywords() {
    const input = qs("#kw-input");
    const container = qs("#kw-tags");
    if (!input || !container) return;

    function existingSet() {
      return new Set(qsa("#kw-tags .kw-chip").map((el) => el.getAttribute("data-kw")));
    }

    function commitTokens(tokens) {
      const seen = existingSet();
      let added = false;
      tokens.forEach((t) => {
        const key = t.trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        renderKeyword(key, container);
        added = true;
      });
      if (added) updateSnapshot();
    }

    function addFromInput() {
      const raw = input.value;
      if (!raw.trim()) return;
      const parts = raw.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
      commitTokens(parts);
      input.value = "";
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addFromInput();
      }
      if (e.key === "Backspace" && !input.value) {
        const chips = qsa("#kw-tags .kw-chip");
        if (chips.length) {
          chips[chips.length - 1].remove();
          updateSnapshot();
        }
      }
    });

    input.addEventListener("blur", () => {
      if (input.value.trim()) addFromInput();
    });
  }

  function hydrate() {
    const d = load();
    const kwBox = qs("#kw-tags");
    if (kwBox) kwBox.innerHTML = "";

    if (d.channels && d.channels.length) {
      const want = new Set(d.channels);
      qsa("#ch-pills .pill-ro").forEach((btn) => {
        btn.classList.toggle("on", want.has(btn.textContent.trim()));
      });
    }

    if (d.industries && d.industries.length) {
      const want = new Set(d.industries);
      qsa("#industry-pills .cat-pill").forEach((btn) => {
        btn.classList.toggle("selected", want.has(btn.textContent.trim()));
      });
    }

    if (d.keywords && Array.isArray(d.keywords) && kwBox) {
      d.keywords.forEach((k) => {
        if (typeof k === "string" && k.trim()) renderKeyword(k.trim(), kwBox);
      });
    }

    const minEl = qs("#fol-min");
    const maxEl = qs("#fol-max");
    if (minEl && typeof d.followerMin === "number") {
      minEl.value = Number(d.followerMin).toLocaleString("en-US");
    }
    if (maxEl && typeof d.followerMax === "number") {
      maxEl.value = Number(d.followerMax).toLocaleString("en-US");
    }

    updateSnapshot();
  }

  function bindFollowerInputs() {
    ["#fol-min", "#fol-max"].forEach((sel) => {
      const el = qs(sel);
      if (!el) return;
      ["change", "blur"].forEach((ev) => el.addEventListener(ev, updateSnapshot));
    });
  }

  function init() {
    bindChannels();
    bindIndustry();
    bindKeywords();
    bindFollowerInputs();
    hydrate();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
