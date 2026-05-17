/**
 * Reserve Senja embed space and load platform.js near viewport (CLS).
 */
(function () {
  "use strict";

  var loaded = {};

  function scriptUrl(widgetId) {
    return "https://widget.senja.io/widget/" + widgetId + "/platform.js";
  }

  function loadWidget(widgetId) {
    if (loaded[widgetId]) return;
    loaded[widgetId] = true;
    var script = document.createElement("script");
    script.src = scriptUrl(widgetId);
    script.async = true;
    document.head.appendChild(script);
  }

  function prepEmbed(el) {
    if (el.getAttribute("tabindex") === "0") {
      el.setAttribute("tabindex", "-1");
    }
    el.classList.add("senja-embed--reserved");
    el.setAttribute("data-lazyload", "true");
  }

  function observe(el) {
    var widgetId = el.getAttribute("data-id");
    if (!widgetId) return;

    if (typeof IntersectionObserver === "undefined") {
      loadWidget(widgetId);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          loadWidget(widgetId);
          observer.disconnect();
        });
      },
      { rootMargin: "240px 0px", threshold: 0.01 }
    );
    observer.observe(el);
  }

  function init() {
    document.querySelectorAll(".senja-embed").forEach(function (el) {
      prepEmbed(el);
      observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
