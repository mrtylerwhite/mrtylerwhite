/* Letters inline figures: play each figure's entrance once it scrolls into view.
   Without JS (or with reduced motion) the figures render in their final state. */
(function () {
  var figs = document.querySelectorAll(".letter-fig");
  if (!figs.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  Array.prototype.forEach.call(figs, function (f) {
    f.classList.add("lf-armed");
    io.observe(f);
  });
})();
