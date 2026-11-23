/**
 * Lead attribution for mrtylerwhite.com.
 *
 * Signups reach Kit through our server (or Kit's form endpoint), so Kit never
 * sees the referrer or UTMs. This script works out where a visitor came from
 * and hands it to the forms, which pass it on as Kit custom fields:
 *   referrer, landing_page, utm_source, utm_medium, utm_campaign, utm_term,
 *   utm_content, signup_page
 *
 * Consent follows the same rule as Google Analytics (consent.js analyticsOn):
 * - Storage allowed (accepted, or no choice yet outside the EU/EEA, UK,
 *   Switzerland and Quebec, i.e. mtw_geo=0): the first entry ever is stored as
 *   first-touch and never overwritten; every later entry (a visit from outside
 *   the site or with UTMs) is stored as latest-touch. Forms send first-touch.
 * - Storage not allowed (declined, or no choice yet in those regions): nothing
 *   is stored. At submit time the form sends what the current page knows
 *   (external referrer, this page's URL and its UTMs), so a visitor who lands
 *   on a form page still gets attributed.
 * - Declining later deletes anything stored.
 *
 * URLs are trimmed to origin + path (plus utm_* on the landing page) so query
 * strings with personal data never reach Kit.
 *
 * API: window.MTWAttribution.fields() → { referrer, landing_page, utm_*, signup_page }
 * with empty values left out.
 */
(function () {
  "use strict";

  var CONSENT_KEY = "mtw-consent";
  var CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // same as consent.js
  var FIRST_KEY = "mtw-attr-first";
  var LATEST_KEY = "mtw-attr-latest";
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function clip(v, n) {
    return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, n);
  }

  function sameSite(host) {
    return host.replace(/^www\./, "") === window.location.hostname.replace(/^www\./, "");
  }

  // document.referrer if it's another site, as origin + path; "" otherwise.
  function externalReferrer() {
    try {
      if (!document.referrer) return "";
      var u = new URL(document.referrer);
      if (!/^https?:$/.test(u.protocol) || sameSite(u.hostname)) return "";
      return clip(u.origin + u.pathname, 500);
    } catch (_) {
      return "";
    }
  }

  function internalNavigation() {
    try {
      return !!document.referrer && sameSite(new URL(document.referrer).hostname);
    } catch (_) {
      return false;
    }
  }

  // What this page view knows about the visit.
  function currentTouch() {
    var params = new URLSearchParams(window.location.search);
    var t = { referrer: externalReferrer() };
    var keep = new URLSearchParams();
    UTM.forEach(function (k) {
      var v = clip(params.get(k), 200);
      if (v) {
        t[k] = v;
        keep.set(k, v);
      }
    });
    var q = keep.toString();
    t.landing_page = clip(window.location.origin + window.location.pathname + (q ? "?" + q : ""), 500);
    return t;
  }

  function hasUtm(t) {
    return UTM.some(function (k) { return !!t[k]; });
  }

  // An entry: arrived from outside, typed the URL / bookmark, or tagged with UTMs.
  function isEntry(t) {
    return hasUtm(t) || !!t.referrer || !internalNavigation();
  }

  // Same as consent.js analyticsOn(): a stored choice wins; with no choice,
  // storage is on by default only where mtw_geo=0 (set by middleware.js).
  function consentGranted() {
    try {
      if (window.mtwConsent && typeof window.mtwConsent.analyticsOn === "function") {
        return window.mtwConsent.analyticsOn();
      }
      var c = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || "null");
      if (c && (c.v === "granted" || c.v === "denied") && c.t && Date.now() - c.t <= CONSENT_MAX_AGE_MS) {
        return c.v === "granted";
      }
      return /(?:^|;\s*)mtw_geo=0(?:;|$)/.test(document.cookie);
    } catch (_) {
      return false;
    }
  }

  function read(key) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key) || "null");
      return v && typeof v === "object" ? v : null;
    } catch (_) {
      return null;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* private mode or blocked storage: submit-time capture still works */
    }
  }

  function forget() {
    try {
      window.localStorage.removeItem(FIRST_KEY);
      window.localStorage.removeItem(LATEST_KEY);
    } catch (_) {}
  }

  var touch = currentTouch();
  touch.t = Date.now();

  function persist() {
    if (!consentGranted() || !isEntry(touch)) return;
    if (!read(FIRST_KEY)) write(FIRST_KEY, touch);
    write(LATEST_KEY, touch);
  }

  persist();

  // Accepting later stores this visit; declining deletes what's stored.
  document.addEventListener("mtw:consent", function (e) {
    if (e && e.detail && e.detail.analytics) persist();
    else forget();
  });

  function fields() {
    var src = (consentGranted() && read(FIRST_KEY)) || currentTouch();
    var out = {};
    ["referrer", "landing_page"].concat(UTM).forEach(function (k) {
      var v = clip(src[k], k === "referrer" || k === "landing_page" ? 500 : 200);
      if (v) out[k] = v;
    });
    out.signup_page = clip(window.location.origin + window.location.pathname, 500);
    return out;
  }

  window.MTWAttribution = {
    fields: fields,
    firstTouch: function () { return consentGranted() ? read(FIRST_KEY) : null; },
    latestTouch: function () { return consentGranted() ? read(LATEST_KEY) : null; },
  };
})();
