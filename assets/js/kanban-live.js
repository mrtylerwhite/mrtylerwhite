/* Builder Kickoff "Before Figma" board: start the loops once it scrolls into view,
   and tick the comment count up so the board feels live. Decorative only. */
(function () {
  var board = document.querySelector(".pr-kanban3");
  if (!board) return;
  board.classList.add("kb-armed");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function start() {
    board.classList.add("is-live");
    if (reduce) return;
    var count = null;
    Array.prototype.forEach.call(board.querySelectorAll(".pr-kanban3__stats span"), function (s) {
      if (!count && /\d/.test(s.textContent)) count = s;
    });
    if (!count) return;
    var node = null;
    Array.prototype.forEach.call(count.childNodes, function (n) { if (n.nodeType === 3 && /\d/.test(n.textContent)) node = n; });
    if (!node) return;
    var base = parseInt(node.textContent, 10) || 4, n = base;
    setInterval(function () {
      n = n >= base + 3 ? base : n + 1;
      node.textContent = node.textContent.replace(/\d+/, n);
      count.classList.remove("is-bump"); void count.offsetWidth; count.classList.add("is-bump");
    }, 2600);
  }
  if (!("IntersectionObserver" in window)) return start();
  var io = new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { start(); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(board);
})();
