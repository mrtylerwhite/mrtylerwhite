/**
 * Defer Google tag (GT-NBP3W94) until idle or first user interaction.
 *
 * Never loads on local/dev hosts (localhost, 127.0.0.1, LAN IPs, .local) —
 * without this guard, running `npm run dev` / `vercel dev` sends real
 * events straight into the production GA4 property.
 */
(function () {
  "use strict";

  var host = window.location.hostname;
  var isLocalDev =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /\.local$/.test(host);
  if (isLocalDev) return;

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
