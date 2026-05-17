/**
 * Homepage hero background video: ensure muted autoplay on tablet/desktop.
 * Mobile poster fallback is handled in home-hero-video.css.
 */
(function () {
  var section = document.querySelector('.hero-cntn.et_pb_section_video');
  if (!section) return;

  var video = section.querySelector('video');
  if (!video) return;

  var desktop = window.matchMedia('(min-width: 768px)');

  function shouldPlay() {
    return desktop.matches;
  }

  function reveal() {
    section.classList.remove('et_pb_preload');
    var wrap = section.querySelector('.et_pb_section_video_bg');
    if (wrap) {
      wrap.style.opacity = '1';
      wrap.style.visibility = 'visible';
    }
  }

  function playHeroVideo() {
    if (!shouldPlay()) return;
    video.muted = true;
    var attempt = video.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(function () {
          reveal();
        })
        .catch(function () {
          /* Autoplay blocked; poster remains visible */
        });
    } else {
      reveal();
    }
  }

  video.addEventListener('loadeddata', playHeroVideo);
  video.addEventListener('canplay', playHeroVideo);

  if (shouldPlay()) {
    if (video.preload === 'none') {
      video.preload = 'metadata';
    }
    if (video.readyState < 2) {
      video.load();
    } else {
      playHeroVideo();
    }
  }

  desktop.addEventListener('change', function () {
    if (shouldPlay()) {
      playHeroVideo();
    } else {
      video.pause();
    }
  });
})();
