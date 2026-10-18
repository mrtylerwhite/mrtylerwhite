/* Whole-card clicks that Divi's scripts.min.js used to handle. */
document.addEventListener("click", function (e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (e.target.closest("a, button, input, textarea, select, label")) return;

  var options = window.et_link_options_data;
  if (options && options.length) {
    var best = null;
    var bestEl = null;
    for (var i = 0; i < options.length; i++) {
      var item = options[i];
      if (!item || !item.class || !item.url) continue;
      var el = e.target.closest("." + item.class);
      if (!el) continue;
      if (!bestEl || bestEl.contains(el)) {
        best = item;
        bestEl = el;
      }
    }
    if (best) {
      if (best.target === "_blank") window.open(best.url, "_blank", "noopener");
      else location.href = best.url;
      return;
    }
  }

  var card = e.target.closest(".et_clickable");
  if (!card) return;
  var link = card.querySelector("a[href]");
  if (link) location.href = link.href;
});
