/**
 * Multi-page flow after landing: marks active/done dots, label, Back/Home/Continue.
 * Landing (`index.html`) is not a step — no step bar there; first workflow page is `brand.html`.
 */
(function () {
  const STEPS = [
    { href: "/funnel/step1-onboarding", file: "brand.html", title: "Your agent" },
    { href: "/funnel/step2-analysis", file: "mentions.html", title: "Mentions & competitors" },
    { href: "/funnel/step3-campaign", file: "campaign.html", title: "Influencer filters" },
    { href: "/funnel/step4-matching", file: "matching.html", title: "Creator matching" },
    { href: "/funnel/step5-outreach", file: "outreach.html", title: "Send messages" },
  ];

  function currentIndex() {
    const pathname = window.location.pathname.toLowerCase();
    const routeIdx = STEPS.findIndex((s) => s.href === pathname);
    if (routeIdx >= 0) return routeIdx;

    let name = (pathname.split("/").pop() || "").toLowerCase();
    if (!name || name === "") name = "index.html";
    if (!name.endsWith(".html")) name = "index.html";
    const idx = STEPS.findIndex((s) => s.file === name);
    return idx >= 0 ? idx : 0;
  }

  function init() {
    const idx = currentIndex();
    const dots = document.querySelectorAll("#step-dots .step-dot");

    dots.forEach((dot, i) => {
      dot.href = STEPS[i].href;
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
        back.href = "/";
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
