/**
 * newsletter-form.js — shared newsletter signup
 *
 * Any <form data-newsletter-form> posting to a Kit form URL gets the same flow
 * as the /newsletter/ page: browser POST straight to app.kit.com (a server
 * proxy trips Kit's bot guards), then redirect to /newsletter-confirmation/.
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

  function wire(form) {
    var btn = form.querySelector('[type="submit"]');
    var input = form.querySelector('input[type="email"]');
    var err = form.querySelector("[data-newsletter-error]");
    var location = form.getAttribute("data-track-location") || "unknown";

    function fail(message, reason) {
      if (err) err.textContent = message;
      track("newsletter_submit_error", { location: location, reason: reason });
      if (btn) btn.disabled = false;
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
        var res = await fetch(form.action, {
          method: "POST",
          body: new URLSearchParams(new FormData(form)),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          redirect: "manual",
          mode: "cors",
        });
        var ok = res.type === "opaqueredirect" || res.status === 0 || (res.status >= 200 && res.status < 400);
        if (!ok) return fail("Something went wrong. Please try again in a moment.", "http_" + res.status);
        track("newsletter_submit_success", { location: location });
        window.location.assign(thankYouUrl);
      } catch (_) {
        fail("Network error. Check your connection and try again.", "network");
      }
    });
  }

  document.querySelectorAll("form[data-newsletter-form]").forEach(wire);
})();
