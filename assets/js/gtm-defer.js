/**
 * Defer Google tag (GT-NBP3W94) until idle or first user interaction.
 */
(function () {
  "use strict";

  var GTM_ID = "GT-NBP3W94";
  var loaded = false;

  function loadGtm() {
    if (loaded) return;
    loaded = true;
    detachInteraction();

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("set", "linker", { domains: ["mrtylerwhite.com"] });
    gtag("js", new Date());
    gtag("set", "developer_id.dZTNiMT", true);

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GTM_ID;
    script.id = "google_gtagjs-js";
    document.head.appendChild(script);
    gtag("config", GTM_ID);
  }

  function detachInteraction() {
    ["pointerdown", "keydown", "touchstart"].forEach(function (name) {
      document.removeEventListener(name, loadGtm, true);
    });
  }

  function attachInteraction() {
    ["pointerdown", "keydown", "touchstart"].forEach(function (name) {
      document.addEventListener(name, loadGtm, { capture: true, passive: true, once: true });
    });
  }

  function scheduleIdle() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadGtm, { timeout: 4000 });
    } else {
      setTimeout(loadGtm, 2500);
    }
  }

  attachInteraction();
  if (document.readyState === "complete") {
    scheduleIdle();
  } else {
    window.addEventListener("load", scheduleIdle, { once: true });
  }
})();
