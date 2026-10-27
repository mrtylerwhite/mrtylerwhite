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

    // Pages built without Divi's legacy scripts.min.js (the modern rebuilds,
    // e.g. /about/) never get the hamburger-plugin's icon bars or its click
    // handler, since both are injected by that jQuery-dependent script. On
    // those pages, do the same two things ourselves in vanilla JS: inject
    // the icon's bar divs and toggle the drawer open/closed on click.
    var hasLegacyToggleScript = !!document.getElementById("divi-custom-script-js");
    if (!hasLegacyToggleScript) {
      var iconClass = "et_divi_100_custom_hamburger_menu__icon";
      var iconToggledClass = iconClass + "--toggled";
      if (!toggle.classList.contains(iconClass)) {
        toggle.classList.add(iconClass);
        toggle.innerHTML = "<div></div><div></div><div></div>";
      }

      // Divi's core script also clones #top-menu into #mobile_menu for the
      // drawer's contents; replicate that here since it's absent too.
      if (!document.getElementById("mobile_menu")) {
        var sourceMenu = document.getElementById("top-menu");
        if (sourceMenu) {
          var menuClone = sourceMenu.cloneNode(true);
          menuClone.id = "mobile_menu";
          menuClone.classList.add("et_mobile_menu");
          nav.appendChild(menuClone);
        }
      }

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        nav.classList.toggle("opened");
        nav.classList.toggle("closed");
        toggle.classList.toggle(iconToggledClass);
      });
    }

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
      "--mow-nav-top",
      "--mow-nav-height",
      "--mow-nav-margin-left",
      "--mow-nav-margin-right",
    ];

    // Backdrop blur can't reach through the Divi header, so the menu's frosted
    // glass is a separate layer on <body>, kept under the card (see
    // mobile-open-menu.css: .mow-backdrop).
    var veil = document.createElement("div");
    veil.className = "mow-backdrop";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    function syncVeil() {
      var menu = menuEl();
      if (!menu) return;
      var r = menu.getBoundingClientRect();
      veil.style.left = r.left + "px";
      veil.style.top = r.top + "px";
      veil.style.width = r.width + "px";
      veil.style.height = r.height + "px";
    }

    // Social links (the site's own profiles), inserted before the CTA buttons.
    var socialLinks = [
      ["LinkedIn", "https://www.linkedin.com/in/mrtylerwhite/"],
      ["Instagram", "https://www.instagram.com/mrtylerwhite"],
    ];

    function ensureSocial() {
      var menu = menuEl();
      if (!menu || menu.querySelector(".mow-social")) return;
      var li = document.createElement("li");
      li.className = "mow-social";
      var label = document.createElement("p");
      label.className = "mow-social__label";
      label.textContent = "Social";
      li.appendChild(label);
      socialLinks.forEach(function (item) {
        var a = document.createElement("a");
        a.href = item[1];
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = item[0];
        li.appendChild(a);
      });
      var firstCta = menu.querySelector(":scope > li.site-nav-workshop, :scope > li.et_pb_button");
      menu.insertBefore(li, firstCta);
    }

    function clearDrawerLayout() {
      if (!header) return;
      layoutProps.forEach(function (name) {
        header.style.removeProperty(name);
      });
    }

    function syncDrawerLayout() {
      if (!header || !navShell) return;
      if (!mobileMq.matches) {
        clearDrawerLayout();
        return;
      }
      // Keep the last measurement while closed so the card doesn't jump
      // during its close animation; the next open re-measures.
      if (!isOpen()) return;

      var rect = navShell.getBoundingClientRect();
      header.style.setProperty("--mow-nav-left", rect.left + "px");
      header.style.setProperty("--mow-nav-right", "auto");
      header.style.setProperty("--mow-nav-width", rect.width + "px");
      header.style.setProperty("--mow-nav-bottom", rect.bottom + "px");
      header.style.setProperty("--mow-nav-top", rect.top + "px");
      header.style.setProperty("--mow-nav-height", rect.height + "px");
      header.style.setProperty("--mow-nav-margin-left", "0");
      header.style.setProperty("--mow-nav-margin-right", "0");
      syncVeil();
    }

    function scheduleDrawerLayout() {
      syncDrawerLayout();
      window.requestAnimationFrame(syncDrawerLayout);
    }

    // While the card animates closed, keep the pill un-blurred (see
    // mobile-open-menu.css) so the fixed card isn't re-anchored mid-animation.
    var wasOpen = false;
    var closingTimer = null;
    function markClosing(open) {
      if (!header) return;
      if (open) {
        window.clearTimeout(closingTimer);
        header.removeAttribute("data-menu-closing");
      } else if (wasOpen) {
        header.setAttribute("data-menu-closing", "");
        window.clearTimeout(closingTimer);
        closingTimer = window.setTimeout(function () {
          header.removeAttribute("data-menu-closing");
        }, 350);
      }
      wasOpen = open;
    }

    function syncAria() {
      var open = isOpen();
      markClosing(open);
      ensureSocial();
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
