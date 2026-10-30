/* Letters FAQ accordion: one question open at a time, with a soft ~400ms reveal.
   Native <details name="letter-faq"> already keeps one open without JS; this
   adds the height + fade animation and tracks which questions people open. */
(function () {
  var items = document.querySelectorAll(".letter-faq__item");
  if (!items.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  var OPEN_MS = 420, CLOSE_MS = 360;

  function track(item) {
    if (typeof window.trackEvent !== "function") return;
    var q = item.querySelector(".letter-faq__q span");
    window.trackEvent("letters_faq_open", {
      location: "letter_faq",
      label: q ? q.textContent.trim().slice(0, 100) : item.id,
    });
  }

  function animateOpen(item) {
    var body = item.querySelector(".letter-faq__a");
    item.open = true;
    if (reduce || !body || !body.animate) return;
    var h = body.scrollHeight;
    body.animate(
      [{ height: "0px", opacity: 0, transform: "translateY(-4px)" }, { height: h + "px", opacity: 1, transform: "none" }],
      { duration: OPEN_MS, easing: EASE }
    );
  }

  function animateClose(item) {
    var body = item.querySelector(".letter-faq__a");
    if (reduce || !body || !body.animate) { item.open = false; return; }
    if (item._closing) return;
    item._closing = true;
    var anim = body.animate(
      [{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: CLOSE_MS, easing: EASE }
    );
    anim.onfinish = anim.oncancel = function () { item.open = false; item._closing = false; };
  }

  Array.prototype.forEach.call(items, function (item) {
    var summary = item.querySelector(".letter-faq__q");
    if (!summary) return;
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (item.open && !item._closing) { animateClose(item); return; }
      Array.prototype.forEach.call(items, function (other) {
        if (other !== item && other.open) animateClose(other);
      });
      animateOpen(item);
      track(item);
    });
  });
})();
