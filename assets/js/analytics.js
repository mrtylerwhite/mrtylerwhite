/**
 * Lightweight GA4 event helper for mrtylerwhite.com (GT-NBP3W94 via gtm-defer.js).
 * No PII — never send names, emails, or form field values.
 */
(function () {
  "use strict";

  var BLOCKED_KEYS = /^(email|name|first_?name|last_?name|message|phone|body|content)$/i;
  var EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  window.dataLayer = window.dataLayer || [];
  var pending = [];

  function sanitize(props) {
    if (!props || typeof props !== "object") return {};
    var out = {};
    Object.keys(props).forEach(function (key) {
      if (BLOCKED_KEYS.test(key)) return;
      var val = props[key];
      if (val == null || val === "") return;
      if (typeof val === "string" && EMAIL_LIKE.test(val.trim())) return;
      out[key] = typeof val === "string" ? val.slice(0, 120) : val;
    });
    return out;
  }

  function flush() {
    if (typeof window.gtag !== "function") return;
    while (pending.length) {
      var item = pending.shift();
      window.gtag("event", item.name, item.props);
    }
  }

  function trackEvent(eventName, properties) {
    if (!eventName || typeof eventName !== "string") return;
    try {
      var props = sanitize(properties);
      window.dataLayer.push(Object.assign({ event: eventName }, props));
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, props);
      } else {
        pending.push({ name: eventName, props: props });
      }
    } catch (_) {
      /* never break the page */
    }
  }

  window.trackEvent = trackEvent;

  function path() {
    var p = window.location.pathname || "/";
    return p.endsWith("/") ? p : p + "/";
  }

  function pageViews() {
    var p = path();
    if (p === "/roi-case-study-template/") trackEvent("roi_skill_page_view", { page: p });
    if (p === "/roi-case-study-skill/thank-you/") trackEvent("roi_skill_thank_you_view", { page: p });
    if (p === "/free-case-study-kit/") trackEvent("free_case_study_kit_thank_you_view", { page: p });
    if (p === "/prototype-ready/") trackEvent("builder_kickoff_page_view", { page: p });
  }

  function linkLocation(el) {
    if (!el) return "unknown";
    if (el.closest(".pr-bar")) return "header";
    if (el.closest(".rcst-hero__actions")) return "hero";
    if (el.closest(".workshop-card")) return "card";
    if (el.closest(".pr-ticket")) return "card";
    if (el.closest(".fck-next")) return "roi_skill_thank_you";
    if (el.closest(".site-footer")) return "footer";
    if (el.closest(".fck-nav")) return "header";
    if (el.closest(".pr-final")) return "footer";
    if (el.closest(".pr-hero")) return "hero";
    return el.getAttribute("data-track-location") || "unknown";
  }

  function destinationDomain(href) {
    try {
      return new URL(href, window.location.origin).hostname.replace(/^www\./, "");
    } catch (_) {
      return "";
    }
  }

  function caseStudySlug(href) {
    try {
      var u = new URL(href, window.location.origin);
      var m = u.pathname.match(/\/casestudies\/([^/]+)\//);
      return m ? m[1] : "";
    } catch (_) {
      return "";
    }
  }

  function onClick(e) {
    var el = e.target && e.target.closest ? e.target.closest("a, button") : null;
    if (!el) return;

    var explicit = el.getAttribute("data-track-event");
    if (explicit) {
      trackEvent(explicit, {
        location: el.getAttribute("data-track-location") || linkLocation(el),
        label: el.getAttribute("data-track-label") || undefined,
      });
      return;
    }

    var href = el.getAttribute("href") || "";

    if (el.matches("[data-start-chat]")) {
      trackEvent("roi_skill_cta_click", { location: linkLocation(el) });
      return;
    }

    if (href.indexOf("saasifyos.kit.com/products/live-builder-kickoff") !== -1) {
      trackEvent("builder_kickoff_checkout_click", { location: linkLocation(el) });
      return;
    }

    if (
      (href === "/prototype-ready/" || href.indexOf("/prototype-ready/#") === 0) &&
      el.closest(".fck-next")
    ) {
      trackEvent("builder_kickoff_upsell_click", { location: linkLocation(el) });
      return;
    }

    if (href === "/prototype-ready/" || href.indexOf("/prototype-ready/#") === 0) {
      trackEvent("builder_kickoff_cta_click", { location: linkLocation(el) });
      return;
    }

    if (href.indexOf("cal.com/") !== -1) {
      trackEvent("contact_cta_click", {
        location: linkLocation(el),
        destination: destinationDomain(href),
      });
      return;
    }

    if (href.indexOf("linkedin.com/in/mrtylerwhite") !== -1) {
      trackEvent("contact_cta_click", {
        location: linkLocation(el),
        destination: "linkedin.com",
      });
      return;
    }

    if (href.indexOf("designtablepodcast.com") !== -1) {
      trackEvent("podcast_click", { location: linkLocation(el) });
      trackEvent("outbound_link_click", {
        destination_domain: "designtablepodcast.com",
        label: "podcast",
      });
      return;
    }

    if (href.indexOf("TylerWhite-Resume") !== -1 || /resume.*\.pdf/i.test(href)) {
      trackEvent("download_cv_click", { location: linkLocation(el) });
      return;
    }

    if (href.indexOf(".skill") !== -1) {
      trackEvent("roi_skill_download_click", { location: linkLocation(el) });
      return;
    }

    var slug = caseStudySlug(href);
    if (slug) {
      trackEvent("case_study_click", { case_study_slug: slug, location: linkLocation(el) });
      return;
    }

    if (
      href === "/prototype-ready/" &&
      (el.closest("#menu-item-4000") || el.closest(".fck-nav") || el.closest(".site-footer") || el.closest("#top-menu"))
    ) {
      trackEvent("workshop_nav_click", { location: linkLocation(el) });
    }
  }

  function bindNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    var btn = document.getElementById("subscribe-btn");
    if (btn) {
      btn.addEventListener(
        "click",
        function () {
          trackEvent("newsletter_cta_click", { location: "newsletter_page" });
        },
        true
      );
    }
    form.addEventListener("submit", function () {
      /* success/error tracked after fetch in page inline script via trackEvent */
    });
  }

  function observeBuilderPrice() {
    if (path() !== "/prototype-ready/") return;
    var nodes = document.querySelectorAll(".workshop-card__price-tag, .pr-ticket__price");
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    var seen = false;
    var io = new IntersectionObserver(
      function (entries) {
        if (seen) return;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            seen = true;
            trackEvent("builder_kickoff_price_seen", { page: path() });
            io.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  function init() {
    pageViews();
    bindNewsletter();
    observeBuilderPrice();
    document.addEventListener("click", onClick, true);
    var flushTimer = window.setInterval(function () {
      flush();
      if (typeof window.gtag === "function") window.clearInterval(flushTimer);
    }, 500);
    window.setTimeout(function () {
      window.clearInterval(flushTimer);
    }, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
