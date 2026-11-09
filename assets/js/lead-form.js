/**
 * Lead magnet form: first name + email, posted to a Kit subscribe API.
 *
 * Markup: <form data-lead-form data-subscribe-api="…" data-success-redirect="…"
 *               data-track-prefix="roi_skill">
 *   [data-lead-first-name] [data-lead-email] [data-lead-error] [data-lead-submit]
 *
 * Same contract as chat-lead-capture.js: POST {firstName?, email} as JSON,
 * expect {success: true}, then fade out and redirect to the thank-you page.
 * Events: <prefix>_form_start, _email_submitted, _submit_success,
 * _submit_error, _redirect_thank_you, plus generate_lead.
 * Any [data-start-chat] link scrolls to the form and focuses the first field.
 */
(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var THANK_YOU_KEY = "rcst-thank-you-enter"; // read by the thank-you page's enter animation
  var FADE_MS = 320;

  function track(name, props) {
    if (typeof window.trackEvent === "function") window.trackEvent(name, props || {});
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function redirect(url, prefix) {
    track(prefix + "_redirect_thank_you", { page: location.pathname });
    try {
      sessionStorage.setItem(THANK_YOU_KEY, "1");
    } catch (_) {}
    if (reducedMotion()) return location.assign(url);
    document.body.classList.add("rcst-page--exit");
    setTimeout(function () {
      location.assign(url);
    }, FADE_MS);
  }

  function LeadForm(form) {
    var nameEl = form.querySelector("[data-lead-first-name]");
    var emailEl = form.querySelector("[data-lead-email]");
    var errorEl = form.querySelector("[data-lead-error]");
    var submitEl = form.querySelector("[data-lead-submit]");
    var api = form.getAttribute("data-subscribe-api");
    var next = form.getAttribute("data-success-redirect") || "/roi-case-study-skill/thank-you/";
    var prefix = form.getAttribute("data-track-prefix") || "roi_skill";
    var label = submitEl.textContent;
    var started = false;
    var guard = window.MTWBotGuard ? window.MTWBotGuard.create(form) : null; // assets/js/bot-guard.js
    var busy = false;

    function showError(msg, field) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      if (field) {
        field.setAttribute("aria-invalid", "true");
        field.focus();
      }
    }

    function clearError() {
      errorEl.hidden = true;
      errorEl.textContent = "";
      emailEl.removeAttribute("aria-invalid");
    }

    function setBusy(on) {
      busy = on;
      submitEl.disabled = on;
      nameEl.disabled = on;
      emailEl.disabled = on;
      submitEl.textContent = on ? "Sending…" : label;
      form.classList.toggle("rcst-form--busy", on);
    }

    form.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      track(prefix + "_form_start", { page: location.pathname });
    });

    emailEl.addEventListener("input", function () {
      if (!errorEl.hidden) clearError();
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (busy) return;
      clearError();

      var firstName = nameEl.value.trim();
      var email = emailEl.value.trim();
      if (!email) return showError("Please enter your email address.", emailEl);
      if (!EMAIL_RE.test(email)) return showError("That email doesn't look right. Try again?", emailEl);

      track(prefix + "_email_submitted", { page: location.pathname, has_first_name: !!firstName });
      setBusy(true);

      try {
        var body = firstName ? { firstName: firstName, email: email } : { email: email };
        if (guard) Object.assign(body, await guard.payload());
        var res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (guard) guard.reset();
        var data = null;
        try {
          data = await res.json();
        } catch (_) {}

        if (res.ok && data && data.success === true) {
          track(prefix + "_submit_success", { page: location.pathname });
          track("generate_lead", { page: location.pathname });
          form.classList.add("rcst-form--success");
          submitEl.textContent = "Done. Check your inbox.";
          redirect(next, prefix);
          return;
        }

        track(prefix + "_submit_error", {
          page: location.pathname,
          reason: res.ok ? "api_rejected" : "http_" + res.status,
        });
        setBusy(false);
        showError(
          data && typeof data.error === "string" && data.error.trim()
            ? data.error.trim()
            : "Something went wrong. Please try again.",
          emailEl
        );
      } catch (_) {
        if (guard) guard.reset();
        track(prefix + "_submit_error", { page: location.pathname, reason: "network" });
        setBusy(false);
        showError("Something went wrong. Please try again.", emailEl);
      }
    });

    return { focus: function () { nameEl.focus({ preventScroll: true }); } };
  }

  function init() {
    var forms = Array.prototype.map.call(document.querySelectorAll("[data-lead-form]"), LeadForm);
    if (!forms.length) return;
    document.querySelectorAll("[data-start-chat]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
        setTimeout(forms[0].focus, reducedMotion() ? 0 : 450);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
