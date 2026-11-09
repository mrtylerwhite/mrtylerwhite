/**
 * Client half of the signup bot protection (server half: api/_lib/bot-guard.js).
 *
 *   var guard = window.MTWBotGuard.create(formElement);
 *   guard.payload().then(function (extra) {
 *     // merge extra into the JSON body: { website, formElapsedMs, turnstileToken? }
 *   });
 *   guard.reset(); // after each submit, so the next one gets a fresh token
 *
 * - Adds a hidden "website" honeypot field to the form.
 * - Measures time since the form was set up. If a fast human (autofill) submits
 *   in under 3 seconds, payload() just waits out the rest, so nobody real is
 *   ever dropped by the timing check.
 * - Cloudflare Turnstile, only when /api/turnstile-config returns a site key.
 *   Rendered on first interaction in "interaction-only" mode: invisible for
 *   almost everyone, a single checkbox only when Cloudflare is unsure.
 */
(function () {
  "use strict";

  var MIN_ELAPSED_MS = 3200; // server requires 3000; a little headroom
  var TOKEN_WAIT_MS = 15000;
  var configPromise = null;
  var scriptPromise = null;

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function config() {
    if (!configPromise) {
      configPromise = fetch("/api/turnstile-config", { headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (j) { return { siteKey: (j && typeof j.siteKey === "string" && j.siteKey) || "" }; })
        .catch(function () { return { siteKey: "" }; });
    }
    return configPromise;
  }

  function loadScript() {
    if (!scriptPromise) {
      scriptPromise = new Promise(function (resolve, reject) {
        if (window.turnstile) return resolve(window.turnstile);
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = function () { window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")); };
        s.onerror = function () { reject(new Error("turnstile")); };
        document.head.appendChild(s);
      });
    }
    return scriptPromise;
  }

  function addHoneypot(form) {
    var wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;";
    var input = document.createElement("input");
    input.type = "text";
    input.name = "website";
    input.tabIndex = -1;
    input.autocomplete = "off";
    input.value = "";
    var label = document.createElement("label");
    label.textContent = "Website";
    label.appendChild(input);
    wrap.appendChild(label);
    form.appendChild(wrap);
    return input;
  }

  function create(form) {
    var startedAt = now();
    var honeypot = addHoneypot(form);
    var widgetId = null;
    var token = "";
    var waiters = [];
    var rendering = null;

    function settle(t) {
      token = t || "";
      var w = waiters;
      waiters = [];
      w.forEach(function (fn) { fn(token); });
    }

    function render() {
      if (rendering) return rendering;
      rendering = config().then(function (cfg) {
        if (!cfg.siteKey) return false;
        return loadScript().then(function (ts) {
          var box = document.createElement("div");
          box.className = "mtw-turnstile";
          box.style.cssText = "margin-top:8px;";
          var anchor = form.querySelector('[type="submit"]');
          if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
          else form.appendChild(box);
          widgetId = ts.render(box, {
            sitekey: cfg.siteKey,
            appearance: "interaction-only",
            "refresh-expired": "auto",
            callback: function (t) { settle(t); },
            "expired-callback": function () { token = ""; },
            "error-callback": function () { settle(""); },
          });
          return true;
        });
      }).catch(function () { return false; });
      return rendering;
    }

    // Start Turnstile as soon as someone engages with the form.
    form.addEventListener("focusin", render, { once: true });
    form.addEventListener("pointerdown", render, { once: true });

    function waitForToken() {
      if (token) return Promise.resolve(token);
      return new Promise(function (resolve) {
        var done = false;
        function finish(t) { if (!done) { done = true; resolve(t || ""); } }
        waiters.push(finish);
        setTimeout(function () { finish(token); }, TOKEN_WAIT_MS);
      });
    }

    function payload() {
      var wait = Math.max(0, MIN_ELAPSED_MS - (now() - startedAt));
      var timing = new Promise(function (r) { setTimeout(r, wait); });
      var tokenP = render().then(function (on) { return on ? waitForToken() : ""; });
      return Promise.all([timing, tokenP]).then(function (res) {
        var out = {
          website: honeypot.value,
          formElapsedMs: Math.round(now() - startedAt),
        };
        if (res[1]) out.turnstileToken = res[1];
        return out;
      });
    }

    function reset() {
      token = "";
      if (widgetId !== null && window.turnstile) {
        try { window.turnstile.reset(widgetId); } catch (_) {}
      }
    }

    return { payload: payload, reset: reset };
  }

  window.MTWBotGuard = { create: create };
})();
