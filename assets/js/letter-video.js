/**
 * Letter videos: click-to-load YouTube embeds that keep people on the page.
 * - Ships only a thumbnail; the player (~500KB of YouTube JS) loads on play.
 * - youtube-nocookie, rel=0 (related videos limited to our own channel),
 *   no annotations, no keyboard-free links we can control.
 * - When the video ends, the player is swapped back to the thumbnail so the
 *   YouTube end screen of recommended videos never shows.
 */
(function () {
  "use strict";
  var ORIGINS = ["https://www.youtube-nocookie.com", "https://www.youtube.com"];

  function arm(fig) {
    var btn = fig.querySelector(".letter-video__play");
    if (!btn) return;
    var template = btn.cloneNode(true);
    btn.addEventListener("click", function () { play(fig, btn, template); });
  }

  function play(fig, btn, template) {
    var id = fig.getAttribute("data-video-id");
    var iframe = document.createElement("iframe");
    var params = "autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&enablejsapi=1&origin=" +
      encodeURIComponent(window.location.origin);
    iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?" + params;
    iframe.title = btn.getAttribute("aria-label") || "Video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.className = "letter-video__iframe";
    btn.replaceWith(iframe);
    fig.classList.add("is-playing");

    // Ask the player to report state changes, then reset on "ended" (state 0).
    iframe.addEventListener("load", function () {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: id, channel: "widget" }), "*");
      } catch (_) {}
    });
    function onMessage(e) {
      if (ORIGINS.indexOf(e.origin) === -1 || e.source !== iframe.contentWindow) return;
      var data;
      try { data = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (_) { return; }
      if (!data) return;
      var state = data.event === "onStateChange" ? data.info
        : data.event === "infoDelivery" && data.info ? data.info.playerState : null;
      if (state === 0) {
        window.removeEventListener("message", onMessage);
        var fresh = template.cloneNode(true);
        iframe.replaceWith(fresh);
        fig.classList.remove("is-playing");
        fresh.addEventListener("click", function () { play(fig, fresh, template); });
        if (typeof window.trackEvent === "function") {
          window.trackEvent("letters_video_complete", { video_id: id, page: window.location.pathname });
        }
      }
    }
    window.addEventListener("message", onMessage);

    if (typeof window.trackEvent === "function") {
      window.trackEvent("letters_video_play", { video_id: id, page: window.location.pathname });
    }
  }

  document.querySelectorAll(".letter-video[data-video-id]").forEach(arm);
})();
