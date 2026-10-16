/**
 * Letter videos: click-to-load YouTube embeds.
 * The page ships only a thumbnail; the YouTube player (and its ~500KB of JS)
 * loads when someone presses play. Uses youtube-nocookie for privacy.
 */
(function () {
  "use strict";
  document.querySelectorAll(".letter-video[data-video-id]").forEach(function (fig) {
    var btn = fig.querySelector(".letter-video__play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var id = fig.getAttribute("data-video-id");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
      iframe.title = btn.getAttribute("aria-label") || "Video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.className = "letter-video__iframe";
      btn.replaceWith(iframe);
      fig.classList.add("is-playing");
      if (typeof window.trackEvent === "function") {
        window.trackEvent("letters_video_play", { video_id: id, page: window.location.pathname });
      }
    });
  });
})();
