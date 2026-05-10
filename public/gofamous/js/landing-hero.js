/**
 * Landing splash — typewriter → compact top banner → reveal page (Skip / Esc).
 */
(function () {
  const LINE1 = "Nobody is using your AI agent.";
  const LINE2 = "In an era where building is cheap. Your agent wants attention.";

  const el1 = document.getElementById("hero-anim-line1");
  const el2 = document.getElementById("hero-anim-line2");
  const c1 = document.getElementById("hero-cursor1");
  const c2 = document.getElementById("hero-cursor2");
  const root = document.getElementById("hero-animated");
  const splash = document.getElementById("landing-splash");
  const app = document.getElementById("landing-app");
  const main = app ? app.querySelector(".landing-main") : null;
  const skipBtn = document.getElementById("landing-skip");

  if (!el1 || !el2 || !root || !splash || !app) return;

  let aborted = false;
  let finalized = false;

  const msChar = 38;
  const pauseBetween = 420;
  const pauseBeforeCompact = 500;

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function showStatic() {
    el1.textContent = LINE1;
    el2.textContent = LINE2;
    if (c1) c1.setAttribute("hidden", "");
    if (c2) c2.setAttribute("hidden", "");
    root.setAttribute("aria-label", `${LINE1} ${LINE2}`);
  }

  async function typeInto(el, text) {
    el.textContent = "";
    for (let i = 0; i <= text.length; i++) {
      if (aborted) {
        el.textContent = text;
        return;
      }
      el.textContent = text.slice(0, i);
      await sleep(msChar);
    }
  }

  function measureBannerAndReveal() {
    /* Hero band joins document flow — scrolls with stats/CTA like a normal page (no fixed strip). */
    splash.classList.add("landing-splash--in-document");
    app.style.paddingTop = "0";
    document.documentElement.style.removeProperty("--landing-banner-height");

    document.body.classList.remove("has-landing-splash");
    if (main) {
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    }

    requestAnimationFrame(() => {
      app.classList.add("landing-app--visible");
      const scope = main || app;
      const first = scope.querySelector(
        "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (first) first.focus({ preventScroll: true });
    });
  }

  function waitForCompactAnimation() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1520);
    });
  }

  async function finalizeBanner(fromSkip) {
    if (finalized) return;
    finalized = true;
    if (fromSkip) showStatic();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    splash.classList.add("landing-splash--compact");

    if (reduced) {
      requestAnimationFrame(() => {
        measureBannerAndReveal();
      });
      return;
    }

    await waitForCompactAnimation();
    measureBannerAndReveal();
  }

  function onSkip() {
    if (finalized) return;
    aborted = true;
    showStatic();
    void finalizeBanner(true);
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", onSkip);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !finalized) {
      e.preventDefault();
      onSkip();
    }
  });

  async function run() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      showStatic();
      await sleep(500);
      await finalizeBanner(false);
      return;
    }

    el1.textContent = "";
    el2.textContent = "";
    if (c1) c1.removeAttribute("hidden");
    if (c2) c2.setAttribute("hidden", "");

    await typeInto(el1, LINE1);
    if (aborted) return;

    if (c1) c1.setAttribute("hidden", "");
    await sleep(pauseBetween);
    if (aborted) return;

    if (c2) c2.removeAttribute("hidden");
    await typeInto(el2, LINE2);
    if (aborted) return;

    if (c2) c2.setAttribute("hidden", "");
    root.setAttribute("aria-label", `${LINE1} ${LINE2}`);

    await sleep(pauseBeforeCompact);
    if (aborted) return;

    await finalizeBanner(false);
  }

  run();
})();
