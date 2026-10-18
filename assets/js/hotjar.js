// Hotjar waits until the visitor scrolls or clicks, so it does not compete
// with the first load (the script is about 64 KB).
(function (h, o, t, j, a, r) {
  var loaded = false;

  function detach() {
    o.removeEventListener("pointerdown", load, true);
    o.removeEventListener("keydown", load, true);
    o.removeEventListener("touchstart", load, true);
    h.removeEventListener("scroll", onScroll, true);
  }

  function load() {
    if (loaded) return;
    loaded = true;
    detach();
    h.hj =
      h.hj ||
      function () {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
    h._hjSettings = { hjid: 6738251, hjsv: 6 };
    a = o.getElementsByTagName("head")[0];
    r = o.createElement("script");
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  }

  function onScroll() {
    if ((h.scrollY || o.documentElement.scrollTop || 0) < 24) return;
    load();
  }

  o.addEventListener("pointerdown", load, { capture: true, passive: true });
  o.addEventListener("keydown", load, { capture: true, passive: true });
  o.addEventListener("touchstart", load, { capture: true, passive: true });
  h.addEventListener("scroll", onScroll, { capture: true, passive: true });
})(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
