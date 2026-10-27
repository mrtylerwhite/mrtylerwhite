/**
 * Cookie consent for mrtylerwhite.com.
 *
 * Google Analytics (gtm-defer.js) and Hotjar (hotjar.js) are the only
 * non-essential trackers.
 *
 * Visitors in the EU/EEA, UK, Switzerland and Quebec (mtw_geo=1, set by
 * middleware.js, or no cookie at all) are asked first, and both trackers stay
 * off until they accept: GA runs in Google Consent Mode "denied" (cookieless
 * pings) and Hotjar doesn't load. Everyone else (mtw_geo=0) gets analytics on
 * by default and can opt out from the footer.
 *
 * To keep friction low the card waits for the first scroll or 3 seconds, uses
 * shorter copy on phones, and steps aside while the mobile menu is open.
 *
 * The choice lives in localStorage ("mtw-consent") for 12 months, then the
 * card asks again. Any element with [data-cookie-settings] (the footer link)
 * reopens it. Changes fire a "mtw:consent" event on document.
 */
(function () {
  "use strict";

  var KEY = "mtw-consent";
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  function read() {
    try {
      var c = JSON.parse(window.localStorage.getItem(KEY) || "null");
      if (!c || (c.v !== "granted" && c.v !== "denied")) return null;
      if (!c.t || Date.now() - c.t > MAX_AGE_MS) return null;
      return c.v;
    } catch (_) {
      return null;
    }
  }

  function write(value) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: value, t: Date.now() }));
    } catch (_) {
      /* private mode: the choice holds for this page view only */
    }
  }

  // Removing consent also removes what GA and Hotjar already stored.
  function clearTrackingCookies() {
    var host = window.location.hostname;
    var domains = ["", host, "." + host, "." + host.replace(/^www\./, "")];
    document.cookie.split(";").forEach(function (part) {
      var name = part.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|_hj)/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie =
          name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "") + "; SameSite=Lax";
      });
    });
  }

  var current = read();

  // No region cookie (local dev, unknown location) counts as ask-first.
  function askFirst() {
    return !/(?:^|;\s*)mtw_geo=0(?:;|$)/.test(document.cookie);
  }

  function analyticsOn() {
    return current ? current === "granted" : !askFirst();
  }

  function set(value) {
    var wasOn = analyticsOn();
    current = value;
    write(value);
    if (value === "denied") clearTrackingCookies();
    document.dispatchEvent(new CustomEvent("mtw:consent", { detail: { analytics: value === "granted" } }));
    close();
    // Hotjar can't be unloaded once running; a reload leaves the page clean.
    if (wasOn && value === "denied") window.location.reload();
  }

  window.mtwConsent = {
    // "granted" | "denied" | null (no choice stored yet)
    status: function () {
      return current;
    },
    analyticsOn: analyticsOn,
    set: set,
    open: function () {
      open();
    },
  };

  // ── Card ──────────────────────────────────────────────────────────────────
  var CSS =
    ".mtw-consent{position:fixed;z-index:100000;left:16px;bottom:16px;width:min(380px,calc(100vw - 32px));" +
    // Dark frosted glass, matching the mobile menu
    "padding:20px;border-radius:20px;background:rgba(28,24,21,.72);color:#fcf7f4;" +
    "-webkit-backdrop-filter:blur(24px) saturate(1.5);backdrop-filter:blur(24px) saturate(1.5);" +
    "box-shadow:0 24px 64px rgba(0,0,0,.28);outline:1px solid rgba(255,255,255,.06);outline-offset:-1px;" +
    "font-family:var(--ds-font-body,Inter,system-ui,sans-serif);font-size:14px;line-height:1.45;letter-spacing:.0107em;" +
    "opacity:0;translate:0 8px;transition:opacity .3s cubic-bezier(.215,.61,.355,1),translate .4s cubic-bezier(.215,.61,.355,1)}" +
    ".mtw-consent[data-shown]{opacity:1;translate:none}" +
    ".mtw-consent__label{margin:0 0 12px;font-family:var(--ds-font-mono,'JetBrains Mono',ui-monospace,monospace);font-size:12px;line-height:16px;" +
    "letter-spacing:.1667em;text-transform:uppercase;color:rgba(252,247,244,.5)}" +
    ".mtw-consent__text{margin:0 0 16px;padding:0}" +
    ".mtw-consent__text a{color:inherit;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(252,247,244,.35)}" +
    ".mtw-consent__actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
    ".mtw-consent__btn{appearance:none;border:0;cursor:pointer;min-height:44px;padding:10px 16px;border-radius:999px;" +
    "font:500 14px/1.2 var(--ds-font-body,Inter,system-ui,sans-serif);letter-spacing:.0107em;transition:background-color .2s,scale .15s}" +
    ".mtw-consent__btn:active{scale:.98}" +
    ".mtw-consent__btn:focus-visible{outline:2px solid #fcf7f4;outline-offset:2px}" +
    ".mtw-consent__btn--no{background:rgba(255,255,255,.12);color:#fcf7f4;box-shadow:inset 0 1px 0 rgba(255,255,255,.15)}" +
    ".mtw-consent__btn--no:hover{background:rgba(255,255,255,.16)}" +
    ".mtw-consent__btn--yes{background:#fcf7f4;color:#1f1a16}" +
    ".mtw-consent__btn--yes:hover{background:#fff}" +
    ".mtw-consent__short{display:none}" +
    "@media (max-width:767px){.mtw-consent{left:12px;right:12px;bottom:12px;width:auto;padding:14px 14px 12px;border-radius:18px}" +
    ".mtw-consent__label,.mtw-consent__long{display:none}.mtw-consent__short{display:inline}" +
    ".mtw-consent__text{margin:0 0 10px;font-size:13px}.mtw-consent__btn{min-height:40px;padding:8px 14px}}" +
    "body:has(#main-header .mobile_nav.opened) .mtw-consent{opacity:0;translate:0 8px;pointer-events:none}" +
    "@media (prefers-reduced-motion:reduce){.mtw-consent{transition:none}}";

  var card = null;
  var lastFocus = null;

  function build() {
    var style = document.createElement("style");
    style.id = "mtw-consent-style";
    style.textContent = CSS;
    document.head.appendChild(style);

    card = document.createElement("section");
    card.className = "mtw-consent";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "false");
    card.setAttribute("aria-labelledby", "mtw-consent-label");
    card.innerHTML =
      '<p class="mtw-consent__label" id="mtw-consent-label">Cookies, briefly</p>' +
      '<p class="mtw-consent__text"><span class="mtw-consent__long">I use Google Analytics and Hotjar to see which pages help and where people get stuck. ' +
      "No ads, and your data is never sold. OK to turn them on?</span>" +
      '<span class="mtw-consent__short">Analytics cookies help me see what&#8217;s useful. No ads.</span> ' +
      '<a href="/privacy-policy/#cookies">Privacy policy</a></p>' +
      '<div class="mtw-consent__actions">' +
      '<button type="button" class="mtw-consent__btn mtw-consent__btn--no" data-consent="denied">No thanks</button>' +
      '<button type="button" class="mtw-consent__btn mtw-consent__btn--yes" data-consent="granted">Accept</button>' +
      "</div>";
    card.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (btn) set(btn.getAttribute("data-consent"));
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && current) close();
    });
    document.body.appendChild(card);
  }

  function open() {
    if (!card) build();
    lastFocus = document.activeElement;
    card.hidden = false;
    window.requestAnimationFrame(function () {
      card.setAttribute("data-shown", "");
    });
  }

  function close() {
    if (!card) return;
    card.removeAttribute("data-shown");
    window.setTimeout(function () {
      if (!card.hasAttribute("data-shown")) card.hidden = true;
    }, 300);
    if (lastFocus && card.contains(document.activeElement)) lastFocus.focus();
  }

  function init() {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-cookie-settings]");
      if (!trigger) return;
      e.preventDefault();
      open();
      var focusTarget = card.querySelector("[data-consent]");
      if (focusTarget) focusTarget.focus();
    });
    if (!current && askFirst()) openWhenReady();
  }

  // Wait for intent: first real scroll or 3 seconds, whichever comes first.
  function openWhenReady() {
    var done = false;
    var timer = window.setTimeout(go, 3000);
    function onScroll() {
      if ((window.scrollY || document.documentElement.scrollTop || 0) > 24) go();
    }
    function go() {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      if (!current) open();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
