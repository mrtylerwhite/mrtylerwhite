/* Letters inline figures: play each figure's entrance once it scrolls into view.
   Without JS (or with reduced motion) the figures render in their final state. */
(function () {
  var figs = document.querySelectorAll(".letter-fig");
  if (!figs.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function countUp(fig) {
    Array.prototype.forEach.call(fig.querySelectorAll("[data-count]"), function (el) {
      var end = parseInt(el.getAttribute("data-count"), 10);
      var prefix = el.getAttribute("data-prefix") || "";
      if (!end) return;
      var t0 = null, dur = 1100;
      el.textContent = prefix + "0";
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(end * eased).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      }
      setTimeout(function () { requestAnimationFrame(step); }, 250);
    });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  Array.prototype.forEach.call(figs, function (f) {
    f.classList.add("lf-armed");
    io.observe(f);
  });
})();
