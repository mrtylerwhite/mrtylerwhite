/**
 * Defer below-fold case study decorative backgrounds until near viewport.
 */
(function () {
  "use strict";

  if (!document.body.classList.contains("home")) return;

  var targets = document.querySelectorAll("[data-lazy-bg]");
  if (!targets.length) return;

  function applyBg(el) {
    var url = el.getAttribute("data-lazy-bg");
    if (!url || el.classList.contains("is-lazy-bg-loaded")) return;
    el.style.backgroundImage = "url(" + url + ")";
    el.classList.add("is-lazy-bg-loaded");
    el.removeAttribute("data-lazy-bg");
  }

  if (typeof IntersectionObserver === "undefined") {
    targets.forEach(applyBg);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        applyBg(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "240px 0px", threshold: 0.01 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();
