/**
 * ChatLeadCapture — conversational Kit opt-in for lead magnet pages.
 *
 * Server POST via data-subscribe-api (default /api/subscribe/roi-case-study).
 * Optional data-success-redirect on root (default /roi-case-study-skill/thank-you/).
 */
(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var RCST_THANK_YOU_KEY = "rcst-thank-you-enter";
  var RCST_FADE_MS = 320;
  var INTRO_MESSAGES = [
    "Most portfolios show the process. The best ones show the value.",
    "Let's turn your project notes into a business-impact story.",
    "What's your first name?",
  ];
  var INTRO_START_DELAY = 1200;
  var INTRO_MESSAGE_GAP = 350;
  var REPLY_MESSAGE_GAP = 225;
  var VISIBILITY_FOCUS_THRESHOLD = 0.75;

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function track(name, props) {
    if (typeof window.trackEvent === "function") {
      window.trackEvent(name, props || {});
    }
  }

  function redirectAfterKitSuccess(url) {
    track("roi_skill_redirect_thank_you", { page: window.location.pathname });
    try {
      sessionStorage.setItem(RCST_THANK_YOU_KEY, "1");
    } catch (_) {}

    if (prefersReducedMotion()) {
      window.location.assign(url);
      return;
    }

    if (document.body) {
      document.body.classList.add("rcst-page--exit");
    }

    window.setTimeout(function () {
      window.location.assign(url);
    }, RCST_FADE_MS);
  }

  function ChatLeadCapture(root) {
    this.root = root;
    this.messagesEl = root.querySelector("[data-chat-messages]");
    this.input = root.querySelector("[data-chat-input]");
    this.submitBtn = root.querySelector("[data-chat-submit]");
    this.errorEl = root.querySelector("[data-chat-error]");
    this.composerEl = root.querySelector("[data-chat-composer]");
    this.idleHintEl = root.querySelector("[data-chat-idle-hint]");
    this.subscribeApi =
      root.getAttribute("data-subscribe-api") || "/api/subscribe/roi-case-study/";
    this.successRedirect =
      root.getAttribute("data-success-redirect") || "/roi-case-study-skill/thank-you/";

    this.state = "idle";
    this.firstName = "";
    this.busy = false;
    this.introToken = 0;
    this.chatEngaged = false;
    this.visibilityFocusConsumed = false;
    this.externalFieldActive = false;
    this.visibilityFocusArmed = false;
    this.userHasScrolled = false;
    this.visibilityObserver = null;
    this._visibilityScrollListener = null;
    this._guidedScrollActive = false;

    this.bind();
    this.scheduleAutoIntro();
  }

  ChatLeadCapture.prototype.bind = function () {
    var self = this;

    if (this.submitBtn) {
      this.submitBtn.addEventListener("click", function () {
        self.handleSubmit();
      });
    }

    if (this.input) {
      this.input.addEventListener("focus", function () {
        self.consumeVisibilityFocus();
        if (self.chatEngaged || self.input.disabled) return;
        self.chatEngaged = true;
        track("roi_skill_chat_start", { page: window.location.pathname });
      });

      this.input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          self.handleSubmit();
        }
      });
    }

    document.querySelectorAll("[data-start-chat]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (btn.tagName === "A" && btn.getAttribute("href") === "#chat-capture") {
          e.preventDefault();
        }
        self.scrollToChat(function () {
          self.highlightChat();
          self.handleHeaderCta();
        });
      });
    });

    document.querySelectorAll("[data-scroll-chat]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (btn.tagName === "A" && btn.getAttribute("href") === "#chat-capture") {
          e.preventDefault();
        }
        self.scrollToChat(function () {
          self.highlightChat();
          self.handleHeaderCta();
        });
      });
    });

    this.bindVisibilityFocus();
  };

  ChatLeadCapture.prototype.bindVisibilityFocus = function () {
    var self = this;

    if (!("IntersectionObserver" in window) || !this.composerEl) return;

    document.addEventListener("focusin", function (e) {
      var t = e.target;
      if (!t || t === self.input || self.root.contains(t)) return;
      if (
        t.matches &&
        t.matches("input, textarea, select, button[type='submit'], [contenteditable='true']")
      ) {
        self.externalFieldActive = true;
        self.stopVisibilityFocusObserver();
      }
    });

    window.matchMedia("(max-width: 767px)").addEventListener("change", function () {
      if (isMobileViewport()) self.stopVisibilityFocusObserver();
    });
  };

  ChatLeadCapture.prototype.consumeVisibilityFocus = function () {
    this.visibilityFocusConsumed = true;
    this.stopVisibilityFocusObserver();
  };

  ChatLeadCapture.prototype.armVisibilityFocus = function () {
    if (
      this.visibilityFocusConsumed ||
      this.externalFieldActive ||
      isMobileViewport() ||
      !this.composerEl ||
      (this.state !== "name" && this.state !== "email")
    ) {
      return;
    }

    this.visibilityFocusArmed = true;

    if (this.userHasScrolled) {
      this.startVisibilityFocusObserver();
      return;
    }

    if (this._visibilityScrollListener) return;

    var self = this;
    this._visibilityScrollListener = function () {
      self.userHasScrolled = true;
      if (self.visibilityFocusArmed && !self.visibilityFocusConsumed) {
        self.startVisibilityFocusObserver();
      }
    };
    window.addEventListener("scroll", this._visibilityScrollListener, { passive: true });
  };

  ChatLeadCapture.prototype.startVisibilityFocusObserver = function () {
    if (
      this.visibilityFocusConsumed ||
      this.externalFieldActive ||
      isMobileViewport() ||
      !this.composerEl ||
      !("IntersectionObserver" in window) ||
      (this.state !== "name" && this.state !== "email")
    ) {
      return;
    }

    this.stopVisibilityFocusObserver();

    var self = this;
    this.visibilityObserver = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry || !entry.isIntersecting) return;
        if (entry.intersectionRatio < VISIBILITY_FOCUS_THRESHOLD) return;
        if (!self.userHasScrolled) return;
        self.tryVisibilityAutoFocus();
      },
      { threshold: [VISIBILITY_FOCUS_THRESHOLD] }
    );

    this.visibilityObserver.observe(this.composerEl);
  };

  ChatLeadCapture.prototype.stopVisibilityFocusObserver = function () {
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
      this.visibilityObserver = null;
    }
  };

  ChatLeadCapture.prototype.tryVisibilityAutoFocus = function () {
    if (this.visibilityFocusConsumed) return;
    if (this._guidedScrollActive) return;
    if (this.externalFieldActive) return;
    if (!this.userHasScrolled) return;
    if (isMobileViewport()) return;
    if (this.state !== "name" && this.state !== "email") return;
    if (!this.input || this.input.disabled) return;
    if (
      this.composerEl &&
      this.composerEl.classList.contains("rcst-chat__composer--hidden")
    ) {
      return;
    }
    if (document.activeElement === this.input) {
      this.consumeVisibilityFocus();
      return;
    }

    this.consumeVisibilityFocus();
    this.focusInput({ preventScroll: true, desktopOnly: true });
  };

  ChatLeadCapture.prototype.afterScrollEnd = function (cb, maxMs) {
    var finished = false;
    var maxTimer;
    var settleTimer;

    function done() {
      if (finished) return;
      finished = true;
      window.removeEventListener("scroll", onScroll);
      clearTimeout(maxTimer);
      clearTimeout(settleTimer);
      cb();
    }

    function onScroll() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(done, 120);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    maxTimer = setTimeout(done, maxMs || 1200);
  };

  ChatLeadCapture.prototype.getChatScrollTop = function (target) {
    var rect = target.getBoundingClientRect();
    var targetTop = window.scrollY + rect.top;
    var centeredTop = targetTop - (window.innerHeight - rect.height) / 2;
    return Math.max(0, Math.round(centeredTop));
  };

  ChatLeadCapture.prototype.highlightChat = function () {
    var shell = document.getElementById("chat-capture");
    if (!shell) return;
    shell.classList.add("rcst-chat-shell--guided");
    if (prefersReducedMotion()) return;
    window.setTimeout(function () {
      shell.classList.remove("rcst-chat-shell--guided");
    }, 1400);
  };

  ChatLeadCapture.prototype.scrollToChat = function (cb) {
    var target = document.getElementById("chat-capture");
    if (!target) {
      if (cb) cb();
      return;
    }

    var reduced = prefersReducedMotion();
    var top = this.getChatScrollTop(target);
    var startY = window.scrollY;
    var needsScroll = Math.abs(startY - top) > 8;
    this._guidedScrollActive = true;

    if (reduced || !needsScroll) {
      window.scrollTo({ top: top, left: 0, behavior: "auto" });
      this._guidedScrollActive = false;
      if (cb) cb();
      return;
    }

    var self = this;
    window.scrollTo({ top: top, left: 0, behavior: "smooth" });
    this.afterScrollEnd(function () {
      self._guidedScrollActive = false;
      if (cb) cb();
    });
  };

  ChatLeadCapture.prototype.handleHeaderCta = function () {
    if (this.state === "intro" || this.state === "idle") {
      this.completeIntroImmediately();
    }

    if (this.state === "name" || this.state === "email") {
      this.focusInput({ preventScroll: true, desktopOnly: true });
    }
  };

  ChatLeadCapture.prototype.scheduleAutoIntro = function () {
    this.runIntroSequence();
  };

  ChatLeadCapture.prototype.runIntroSequence = async function () {
    if (this.busy || (this.state !== "idle" && this.state !== "success")) return;

    var token = ++this.introToken;
    this.busy = true;
    this.state = "intro";
    this.firstName = "";
    this.clearError();
    this.root.classList.add("rcst-chat--active");
    this.root.classList.remove("rcst-chat--success");

    if (this.messagesEl) this.messagesEl.innerHTML = "";

    this.setComposer({
      disabled: true,
      hideComposer: true,
      buttonText: "…",
      placeholder: "",
    });

    if (!prefersReducedMotion()) {
      await delay(INTRO_START_DELAY);
    }
    if (token !== this.introToken) return;

    for (var i = 0; i < INTRO_MESSAGES.length; i++) {
      if (i > 0 && !prefersReducedMotion()) {
        await delay(INTRO_MESSAGE_GAP);
      }
      if (token !== this.introToken) return;
      this.addMessage("assistant", INTRO_MESSAGES[i]);
    }

    if (token !== this.introToken) return;
    this.openNameComposer();
    this.busy = false;
  };

  ChatLeadCapture.prototype.completeIntroImmediately = function () {
    if (this.state !== "intro" && this.state !== "idle") return;

    this.introToken++;
    this.busy = true;
    this.state = "intro";
    this.root.classList.add("rcst-chat--active");
    this.root.classList.remove("rcst-chat--success");

    var existing = this.messagesEl ? this.messagesEl.children.length : 0;
    for (var i = existing; i < INTRO_MESSAGES.length; i++) {
      this.addMessage("assistant", INTRO_MESSAGES[i]);
    }

    this.openNameComposer();
    this.busy = false;
  };

  ChatLeadCapture.prototype.openNameComposer = function () {
    this.state = "name";
    this.setComposer({
      label: "First name",
      type: "text",
      placeholder: "Start with your first name",
      ariaLabel: "Start with your first name",
      buttonText: "Continue",
      disabled: false,
      hideComposer: false,
    });
    this.markChatEngaged();
    this.armVisibilityFocus();
  };

  ChatLeadCapture.prototype.markChatEngaged = function () {
    if (this.chatEngaged) return;
    this.chatEngaged = true;
    track("roi_skill_chat_start", { page: window.location.pathname });
  };

  ChatLeadCapture.prototype.focusInput = function (opts) {
    opts = opts || {};
    if (!this.input || this.input.disabled) return;
    if (opts.desktopOnly && isMobileViewport()) return;

    try {
      if (opts.preventScroll) {
        this.input.focus({ preventScroll: true });
      } else {
        this.input.focus();
      }
    } catch (_) {
      this.input.focus();
    }
  };

  ChatLeadCapture.prototype.focusInputIfDesktop = function () {
    this.focusInput({ desktopOnly: true });
  };

  ChatLeadCapture.prototype.setComposer = function (opts) {
    var label = this.root.querySelector("[data-chat-label]");
    if (label) label.textContent = opts.label || "";
    if (this.input) {
      this.input.type = opts.type || "text";
      this.input.placeholder = opts.placeholder || "";
      this.input.value = "";
      this.input.disabled = !!opts.disabled;
      this.input.setAttribute("aria-label", opts.ariaLabel || opts.label || "");
      this.input.autocomplete = opts.autocomplete || (opts.type === "email" ? "email" : "name");
    }
    if (this.submitBtn) {
      this.submitBtn.setAttribute("aria-label", opts.buttonText || "Continue");
      this.submitBtn.disabled = !!opts.disabled;
      this.submitBtn.hidden = !!opts.hideButton;
    }
    if (this.composerEl) {
      this.composerEl.classList.toggle("rcst-chat__composer--hidden", !!opts.hideComposer);
    }
    if (opts.hideComposer) {
      this.stopVisibilityFocusObserver();
      this.visibilityFocusArmed = false;
    }
    if (this.idleHintEl) {
      this.idleHintEl.hidden = this.root.classList.contains("rcst-chat--active");
    }
  };

  ChatLeadCapture.prototype.clearError = function () {
    if (this.errorEl) {
      this.errorEl.textContent = "";
      this.errorEl.hidden = true;
    }
  };

  ChatLeadCapture.prototype.showError = function (msg) {
    var bubble = this.addMessage("assistant", msg);
    if (bubble) bubble.classList.add("rcst-chat__msg--error");
    if (this.errorEl) {
      this.errorEl.textContent = msg;
      this.errorEl.hidden = true;
    }
  };

  ChatLeadCapture.prototype.scrollThreadToBottom = function () {
    if (!this.messagesEl) return;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  };

  ChatLeadCapture.prototype.addMessage = function (role, text) {
    if (!this.messagesEl || !text) return null;
    var msg = document.createElement("div");
    msg.className =
      "rcst-chat__msg rcst-chat__msg--" + (role === "user" ? "user" : "assistant");
    msg.setAttribute("role", role === "user" ? "status" : "log");

    if (role === "assistant") {
      var timeAbove = document.createElement("span");
      timeAbove.className = "rcst-chat__time rcst-chat__time--above";
      timeAbove.textContent = "Now";
      msg.appendChild(timeAbove);
    }

    var bubble = document.createElement("p");
    bubble.className = "rcst-chat__bubble-text";
    bubble.textContent = text;
    msg.appendChild(bubble);

    if (role === "user") {
      var time = document.createElement("span");
      time.className = "rcst-chat__time";
      time.textContent = "Now";
      msg.appendChild(time);
    }

    this.messagesEl.appendChild(msg);
    this.scrollThreadToBottom();
    return msg;
  };

  ChatLeadCapture.prototype.addMessages = async function (lines, gap) {
    var pause = gap == null ? REPLY_MESSAGE_GAP : gap;
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) await delay(pause);
      this.addMessage("assistant", lines[i]);
    }
  };

  ChatLeadCapture.prototype.handleSubmit = async function () {
    if (this.busy || this.state === "submitting" || this.state === "success") return;
    this.clearError();

    if (this.state === "name") {
      var name = this.input ? String(this.input.value).trim() : "";
      if (!name) {
        this.showError("Please enter your first name.");
        this.focusInputIfDesktop();
        return;
      }
      this.firstName = name;
      track("roi_skill_name_submitted", { page: window.location.pathname });
      this.addMessage("user", name);
      this.busy = true;
      this.setComposer({ disabled: true, placeholder: "One moment…" });

      await delay(300);
      await this.addMessages([
        "Nice to meet you, " + name + ".",
        "I'll send you the free Case Study Auditor & Generator.",
        "Where should I send it?",
      ]);

      this.state = "email";
      this.setComposer({
        label: "Email address",
        type: "email",
        placeholder: "you@company.com",
        ariaLabel: "Your email address",
        buttonText: "Get the free auditor",
        disabled: false,
      });
      this.armVisibilityFocus();
      this.focusInputIfDesktop();
      this.busy = false;
      return;
    }

    if (this.state === "email") {
      var email = this.input ? String(this.input.value).trim() : "";
      if (!email) {
        this.showError("Please enter your email address.");
        this.focusInputIfDesktop();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        this.showError("That email doesn't look right. Try again?");
        this.focusInputIfDesktop();
        return;
      }

      track("roi_skill_email_submitted", { page: window.location.pathname });
      this.addMessage("user", email);
      await this.submitToKit(email);
    }
  };

  ChatLeadCapture.prototype.resetEmailComposer = function () {
    this.setComposer({
      label: "Email address",
      type: "email",
      placeholder: "you@company.com",
      ariaLabel: "Your email address",
      buttonText: "Get the free auditor",
      disabled: false,
    });
    this.armVisibilityFocus();
    this.focusInputIfDesktop();
  };

  ChatLeadCapture.prototype.submitToKit = async function (email) {
    this.state = "submitting";
    this.busy = true;
    this.setComposer({
      disabled: true,
      placeholder: "Sending…",
      buttonText: "Sending…",
    });

    try {
      var res = await fetch(this.subscribeApi, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          firstName: this.firstName,
          email: email,
        }),
      });

      var data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }

      if (res.ok && data && data.success === true) {
        track("roi_skill_submit_success", { page: window.location.pathname });
        this.state = "success";
        this.root.classList.add("rcst-chat--success");
        this.setComposer({ hideComposer: true });
        await delay(400);
        this.addMessage(
          "assistant",
          "Done. Check your inbox. The Case Study Auditor & Generator is on its way."
        );
        await delay(750);
        redirectAfterKitSuccess(this.successRedirect);
        this.busy = false;
        return;
      }

      track("roi_skill_submit_error", {
        page: window.location.pathname,
        reason: res.ok ? "api_rejected" : "http_" + res.status,
      });

      var errMsg =
        data && typeof data.error === "string" && data.error.trim()
          ? data.error.trim()
          : "Something went wrong. Please try again.";

      this.state = "email";
      this.showError(errMsg);
      this.resetEmailComposer();
    } catch (_) {
      track("roi_skill_submit_error", { page: window.location.pathname, reason: "network" });
      this.state = "email";
      this.showError("Something went wrong. Please try again.");
      this.resetEmailComposer();
    }
    this.busy = false;
  };

  function init() {
    document.querySelectorAll("[data-chat-lead-capture]").forEach(function (el) {
      new ChatLeadCapture(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
