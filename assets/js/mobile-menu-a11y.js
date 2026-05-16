/**
 * Mobile menu keyboard + ARIA (Divi + hamburger plugin compatible).
 * Does not change nav links or Divi open/close behavior.
 */
(function () {
  "use strict";

  function init() {
    var nav = document.querySelector("#et_mobile_nav_menu .mobile_nav");
    var toggle = document.querySelector(".mobile_menu_bar_toggle");
    if (!nav || !toggle) return;

    if (toggle.tagName === "SPAN") {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = toggle.className;
      btn.setAttribute("aria-label", "Open menu");
      btn.setAttribute("aria-controls", "mobile_menu");
      btn.setAttribute("aria-expanded", "false");
      toggle.parentNode.replaceChild(btn, toggle);
      toggle = btn;
    } else if (toggle.tagName === "BUTTON") {
      if (!toggle.getAttribute("aria-label")) {
        toggle.setAttribute("aria-label", "Open menu");
      }
      if (!toggle.hasAttribute("aria-expanded")) {
        toggle.setAttribute("aria-expanded", "false");
      }
      if (!toggle.getAttribute("aria-controls")) {
        toggle.setAttribute("aria-controls", "mobile_menu");
      }
    }

    toggle.removeAttribute("tabindex");

    function menuEl() {
      return document.getElementById("mobile_menu");
    }

    function isOpen() {
      return nav.classList.contains("opened");
    }

    var header = document.getElementById("main-header");
    var navShell = document.querySelector("#main-header .et_menu_container");
    var mobileMq = window.matchMedia("(max-width: 980px)");
    var layoutProps = [
      "--mow-nav-left",
      "--mow-nav-right",
      "--mow-nav-width",
      "--mow-nav-bottom",
      "--mow-nav-margin-left",
      "--mow-nav-margin-right",
    ];

    function clearDrawerLayout() {
      if (!header) return;
      layoutProps.forEach(function (name) {
        header.style.removeProperty(name);
      });
    }

    function syncDrawerLayout() {
      if (!header || !navShell) return;
      if (!isOpen() || !mobileMq.matches) {
        clearDrawerLayout();
        return;
      }

      var rect = navShell.getBoundingClientRect();
      header.style.setProperty("--mow-nav-left", rect.left + "px");
      header.style.setProperty("--mow-nav-right", "auto");
      header.style.setProperty("--mow-nav-width", rect.width + "px");
      header.style.setProperty("--mow-nav-bottom", rect.bottom + "px");
      header.style.setProperty("--mow-nav-margin-left", "0");
      header.style.setProperty("--mow-nav-margin-right", "0");
    }

    function scheduleDrawerLayout() {
      syncDrawerLayout();
      window.requestAnimationFrame(syncDrawerLayout);
    }

    function syncAria() {
      var open = isOpen();
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      var menu = menuEl();
      if (menu) {
        if (!menu.getAttribute("role")) {
          menu.setAttribute("role", "navigation");
        }
        if (!menu.getAttribute("aria-label")) {
          menu.setAttribute("aria-label", "Mobile menu");
        }
        toggle.setAttribute("aria-controls", "mobile_menu");
      }
      if (open) {
        scheduleDrawerLayout();
      } else {
        clearDrawerLayout();
      }
    }

    toggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle.click();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !isOpen()) return;
      e.preventDefault();
      toggle.click();
      window.requestAnimationFrame(function () {
        toggle.focus();
      });
    });

    var observer = new MutationObserver(syncAria);
    observer.observe(nav, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", scheduleDrawerLayout);
    window.addEventListener("scroll", scheduleDrawerLayout, { passive: true });
    mobileMq.addEventListener("change", scheduleDrawerLayout);

    if (navShell && typeof ResizeObserver !== "undefined") {
      var navResize = new ResizeObserver(scheduleDrawerLayout);
      navResize.observe(navShell);
    }

    var tries = 0;
    var waitMenu = window.setInterval(function () {
      syncAria();
      tries += 1;
      if (menuEl() || tries > 50) {
        window.clearInterval(waitMenu);
      }
    }, 100);

    syncAria();
  }

  function initSenja() {
    document.querySelectorAll(".senja-embed").forEach(function (el) {
      if (el.getAttribute("tabindex") === "0") {
        el.setAttribute("tabindex", "-1");
      }
    });
  }

  function onReady() {
    init();
    initSenja();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
