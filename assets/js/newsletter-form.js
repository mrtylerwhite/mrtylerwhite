/**
 * newsletter-form.js — shared newsletter signup
 *
 * Any <form data-newsletter-form> posting to a Kit form URL gets the same flow
 * as the /newsletter/ page: browser POST straight to app.kit.com (a server
 * proxy trips Kit's bot guards), then redirect to /newsletter-confirmation/.
 *
 * If that background request fails (privacy blockers and in-app browsers such
 * as LinkedIn's can reject it), the form falls back to a normal full-page
 * POST to Kit instead of showing an error, so the signup still lands.
 *
 * Markup:
 *   <form data-newsletter-form data-track-location="letters_inline"
 *         method="post" action="https://app.kit.com/forms/4969496/subscriptions">
 *     <input type="email" name="email_address" required>
 *     <button type="submit">Subscribe</button>
 *     <p data-newsletter-error role="alert" aria-live="polite"></p>
 *   </form>
 */
(function () {
  "use strict";

  var thankYouUrl = new URL("/newsletter-confirmation/", window.location.origin).href;

  function track(name, props) {
    if (typeof window.trackEvent === "function") window.trackEvent(name, props);
  }

  // Coarse browser bucket for diagnosing failed submits (no fingerprinting).
  function browserKind() {
    var ua = navigator.userAgent || "";
    if (/LinkedInApp/i.test(ua)) return "linkedin_app";
    if (/Instagram|FBAN|FBAV|Twitter/i.test(ua)) return "social_app";
    if (/Brave/i.test(ua) || (navigator.brave && true)) return "brave";
    if (/Safari/i.test(ua) && !/Chrome|Chromium|Android/i.test(ua)) return "safari";
    return "other";
  }

  function wire(form) {
    var btn = form.querySelector('[type="submit"]');
    var input = form.querySelector('input[type="email"]');
    var err = form.querySelector("[data-newsletter-error]");
    var location = form.getAttribute("data-track-location") || "unknown";

    // Background submit failed: record why, then post the form normally so the
    // visitor still gets subscribed (Kit shows its own confirmation page).
    function fallBack(reason) {
      track("newsletter_submit_error", { location: location, reason: reason, browser: browserKind() });
      track("newsletter_submit_fallback", { location: location, reason: reason });
      if (btn) btn.textContent = "Subscribing…";
      HTMLFormElement.prototype.submit.call(form);
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (err) err.textContent = "";
      var email = input ? String(input.value).trim() : "";
      if (!email) {
        if (err) err.textContent = "Please enter your email.";
        if (input) input.focus();
        return;
      }
      if (btn) btn.disabled = true;
      try {
        // Record where the signup came from in Kit (Signup Source field): location + page path
        var src = form.querySelector("[data-signup-source]");
        if (src && src.value.indexOf("/") === -1) src.value = src.value + " " + window.location.pathname;
        var res = await fetch(form.action, {
          method: "POST",
          body: new URLSearchParams(new FormData(form)),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          redirect: "manual",
          mode: "cors",
        });
        var ok = res.type === "opaqueredirect" || res.status === 0 || (res.status >= 200 && res.status < 400);
        if (!ok) return fallBack("http_" + res.status);
        track("newsletter_submit_success", { location: location });
        window.location.assign(thankYouUrl);
      } catch (_) {
        fallBack("network");
      }
    });
  }

  document.querySelectorAll("form[data-newsletter-form]").forEach(wire);
})();
