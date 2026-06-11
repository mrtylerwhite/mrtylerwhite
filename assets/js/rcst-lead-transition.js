/**
 * ROI case study lead magnet — page fade after Kit success.
 * Included on thank-you routes only (free-case-study-kit, roi-case-study-skill/thank-you).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "rcst-thank-you-enter";
  var FADE_MS = 320;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function prehideThankYouPage() {
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        document.documentElement.classList.add("rcst-thank-you-prehide");
      }
    } catch (_) {}
  }

  function enterThankYouPage() {
    if (!document.body || !document.body.classList.contains("free-case-study-kit")) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") return;
      sessionStorage.removeItem(STORAGE_KEY);
      if (prefersReducedMotion()) {
        document.documentElement.classList.remove("rcst-thank-you-prehide");
        return;
      }
      document.documentElement.classList.remove("rcst-thank-you-prehide");
      document.body.classList.add("rcst-thank-you--enter");
    } catch (_) {}
  }

  prehideThankYouPage();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enterThankYouPage);
  } else {
    enterThankYouPage();
  }

})();
