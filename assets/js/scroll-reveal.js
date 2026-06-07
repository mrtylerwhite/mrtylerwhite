/**
 * scroll-reveal.js — design system
 *
 * Handles two sources of animated elements:
 *   1. .ds-reveal — manually classed in markup (with optional .ds-reveal-d1..d5 stagger)
 *   2. .et_animated — Divi animation stubs that have no active JS in the static export
 *      (Divi's waypoint library isn't loaded, so these stay at opacity:0 forever).
 *      We strip the Divi class and apply our own reveal instead.
 *
 * Elements reveal when they intersect the viewport (fires immediately for
 * above-fold content, lazily for below-fold).
 */
(function () {
  'use strict';

  const DIVI_CLASS    = 'et_animated';
  const REVEAL_CLASS  = 'ds-reveal';
  const DELAY_CLASSES = ['ds-reveal-d1', 'ds-reveal-d2', 'ds-reveal-d3', 'ds-reveal-d4', 'ds-reveal-d5'];
  const REVEALED      = 'ds-revealed';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealNow(el) {
    el.classList.add(REVEALED);
  }

  function observe(els) {
    if (prefersReduced) { els.forEach(revealNow); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(REVEALED);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -28px 0px' });

    els.forEach(el => io.observe(el));
  }

  function staggerGroup(els) {
    // Assign stagger delay classes within siblings that share a parent
    const byParent = new Map();
    els.forEach(el => {
      const key = el.parentElement || 'root';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(el);
    });
    byParent.forEach(siblings => {
      siblings.forEach((el, i) => {
        if (i > 0 && i <= DELAY_CLASSES.length) {
          el.classList.add(DELAY_CLASSES[i - 1]);
        }
      });
    });
  }

  function init() {
    // 1. Take over Divi et_animated elements
    const diviEls = Array.from(document.querySelectorAll('.' + DIVI_CLASS));
    diviEls.forEach(el => {
      el.classList.remove(DIVI_CLASS);
      el.classList.add(REVEAL_CLASS);
    });

    // Stagger et_animated siblings within each row
    staggerGroup(diviEls);

    // 2. Collect all ds-reveal elements (includes the ones we just converted)
    const allReveal = Array.from(document.querySelectorAll('.' + REVEAL_CLASS));
    if (allReveal.length) observe(allReveal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
