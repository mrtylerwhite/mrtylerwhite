/**
 * Dark Senja cards for embeds inside a dark band.
 * Senja renders into a shadow root (data-mode="shadow"), which page CSS can't
 * reach, so this adds a small stylesheet inside that root once the cards exist.
 * Opt in by wrapping the embed in an element with [data-senja-dark].
 */
(function () {
  "use strict";

  var CSS =
    ".sj-card{background:#161616!important;box-shadow:0 0 0 1px #2a2a2a!important;color:#e8e4dd!important}" +
    ".sj-text-card .sj-endorser-name{color:#fff!important}" +
    ".sj-text-card .sj-content,.sj-text-card .sj-content *,.sj-text-card p{color:#d6d1c9!important}" +
    ".sj-avatar-container{background:rgba(255,255,255,.08)!important}";

  function apply(embed) {
    var root = embed.shadowRoot;
    if (!root || !root.querySelector(".sj-card")) return false;
    if (!root.getElementById("tw-senja-dark")) {
      var style = document.createElement("style");
      style.id = "tw-senja-dark";
      style.textContent = CSS;
      root.appendChild(style);
    }
    return true;
  }

  function watch(embed) {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (apply(embed) || tries > 200) clearInterval(timer); // up to ~60s
    }, 300);
  }

  function init() {
    var embeds = document.querySelectorAll("[data-senja-dark] .senja-embed");
    for (var i = 0; i < embeds.length; i++) watch(embeds[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
