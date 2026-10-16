/**
 * Code blocks in letters (markup from scripts/build-letters.mjs).
 * Tabs (click + arrow keys), copy to clipboard, edge fades while scrolling.
 */
(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function sourceText(panel) {
    var lines = panel.querySelectorAll(".cb-line");
    return Array.prototype.map.call(lines, function (l) { return l.textContent; }).join("\n");
  }

  document.querySelectorAll("[data-code-block]").forEach(function (card) {
    var tabs = Array.prototype.slice.call(card.querySelectorAll('[role="tab"]'));
    var copyBtn = card.querySelector(".cb-copy");
    var label = card.querySelector(".cb-copy__label");
    var status = card.querySelector(".cb-status");
    var timer;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      // The first tab joins the editor's square top-left corner.
      card.classList.toggle("is-first-active", tab === tabs[0]);
      updateFades();
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    copyBtn.addEventListener("click", function () {
      var source = card.querySelector(".cb-panel:not([hidden])");
      copyText(sourceText(source)).then(
        function () {
          card.classList.add("is-copied");
          label.textContent = "Copied";
          status.textContent = "Copied to clipboard";
          clearTimeout(timer);
          timer = setTimeout(function () {
            card.classList.remove("is-copied");
            label.textContent = "Copy";
            status.textContent = "";
          }, 2000);
          if (window.dataLayer) window.dataLayer.push({ event: "letters_code_copy", location: location.pathname });
        },
        function () {
          label.textContent = "Press ⌘C";
          clearTimeout(timer);
          timer = setTimeout(function () { label.textContent = "Copy"; }, 3000);
          var sel = window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(source.querySelector("code"));
          sel.removeAllRanges();
          sel.addRange(range);
        }
      );
    });

    // Fade the top/bottom edge only while there is more code that way.
    function updateFades() {
      card.querySelectorAll(".cb-scroll").forEach(function (el) {
        el.classList.toggle("fade-top", el.scrollTop > 2);
        el.classList.toggle("fade-bottom", el.scrollTop + el.clientHeight < el.scrollHeight - 2);
      });
    }
    card.querySelectorAll(".cb-scroll").forEach(function (el) {
      el.addEventListener("scroll", updateFades, { passive: true });
    });
    window.addEventListener("resize", updateFades);
    updateFades();
  });
})();
