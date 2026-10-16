/**
 * Floating reader avatars on the letters newsletter block
 * (markup from scripts/build-letters.mjs, styles in letters.css).
 *
 * Each bubble already bobs on a CSS loop. This adds parallax: while the block
 * is on screen, bubbles drift toward the cursor, scaled by their data-depth,
 * eased with a small lerp so they trail the pointer instead of snapping.
 */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var RANGE_X = 28; // px of travel at depth 1
  var RANGE_Y = 20;
  var EASE = 0.08;

  document.querySelectorAll("[data-signup-float]").forEach(function (block) {
    var bubbles = Array.prototype.map.call(block.querySelectorAll(".letter-signup__bubble"), function (el) {
      return { el: el, depth: parseFloat(el.getAttribute("data-depth")) || 1 };
    });
    if (!bubbles.length) return;

    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var visible = false;
    var frame = 0;

    function tick() {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      bubbles.forEach(function (b) {
        b.el.style.transform =
          "translate3d(" + (current.x * RANGE_X * b.depth).toFixed(2) + "px," + (current.y * RANGE_Y * b.depth).toFixed(2) + "px,0)";
      });
      var settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function kick() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onMove(e) {
      if (!visible) return;
      var r = block.getBoundingClientRect();
      // -1..1 from the block's centre, clamped so far-away cursors don't fling the bubbles
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      kick();
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (!visible) {
        target.x = 0;
        target.y = 0;
        kick();
      }
    }).observe(block);

    window.addEventListener("pointermove", onMove, { passive: true });
  });
})();
