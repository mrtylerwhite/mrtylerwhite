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

  /**
   * Hide the "from N reviews" count. The widget renders in an open shadow root,
   * so a rule in senja-embed.css (light DOM) can't reach it — inject the
   * override into the shadow root once Senja attaches it. Touches nothing else.
   */
  function hideReviewCount(el) {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      var sr = el.shadowRoot;
      if (sr) {
        if (!sr.querySelector("style[data-mow-hide-review-count]")) {
          var style = document.createElement("style");
          style.setAttribute("data-mow-hide-review-count", "");
          style.textContent = ".sj-summary-text{display:none !important;}";
          sr.appendChild(style);
        }
        clearInterval(timer);
      } else if (attempts > 100) {
        clearInterval(timer);
      }
    }, 100);
  }

  function observe(el) {
    var widgetId = el.getAttribute("data-id");
    if (!widgetId) return;

    if (typeof IntersectionObserver === "undefined") {
      loadWidget(widgetId);
      hideReviewCount(el);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          loadWidget(widgetId);
          hideReviewCount(el);
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
