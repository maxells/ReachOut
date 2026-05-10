/**
 * Multi-page flow after landing: marks active/done dots, label, Back/Home/Continue.
 * Landing (`index.html`) is not a step — no step bar there; first workflow page is `brand.html`.
 */
(function () {
  const STEPS = [
    { href: "brand.html", title: "Your agent" },
    { href: "mentions.html", title: "Mentions & competitors" },
    { href: "campaign.html", title: "Budget & filters" },
    { href: "outreach.html", title: "Send messages" },
  ];

  function currentIndex() {
    let name = (window.location.pathname.split("/").pop() || "").toLowerCase();
    if (!name || name === "") name = "index.html";
    if (!name.endsWith(".html")) name = "index.html";
    const idx = STEPS.findIndex((s) => s.href === name);
    return idx >= 0 ? idx : 0;
  }

  function init() {
    const idx = currentIndex();
    const dots = document.querySelectorAll("#step-dots .step-dot");

    dots.forEach((dot, i) => {
      dot.classList.toggle("done", i < idx);
      dot.removeAttribute("aria-current");
      if (i === idx) dot.setAttribute("aria-current", "page");
    });

    const labelEl = document.getElementById("step-flow-label");
    if (labelEl) {
      const n = String(idx + 1).padStart(2, "0");
      const tot = String(STEPS.length).padStart(2, "0");
      labelEl.textContent = `[${n}/${tot}] ${STEPS[idx].title}`;
    }

    const back = document.getElementById("step-back");
    const next = document.getElementById("step-continue");

    if (back) {
      if (idx === 0) {
        back.textContent = "← Home";
        back.href = "index.html";
        back.classList.remove("hidden");
      } else {
        back.textContent = "← Back";
        back.href = STEPS[idx - 1].href;
        back.classList.remove("hidden");
      }
    }

    if (next) {
      if (idx >= STEPS.length - 1) {
        next.classList.add("hidden");
        next.removeAttribute("href");
      } else {
        next.classList.remove("hidden");
        next.href = STEPS[idx + 1].href;
        next.textContent = idx === STEPS.length - 2 ? "Continue" : "Next";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
