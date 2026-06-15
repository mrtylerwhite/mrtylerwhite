/**
 * Tabbed workshop card — static port of Tailark Pro notes-2 interaction pattern.
 * No React/Tailwind; vanilla JS for aria tablist behavior.
 */
(function () {
  var card = document.querySelector(".workshop-card");
  if (!card) return;

  var tabs = Array.prototype.slice.call(
    card.querySelectorAll(".workshop-card__tab")
  );
  var panels = Array.prototype.slice.call(
    card.querySelectorAll(".workshop-card__panel")
  );

  function activateTab(tab) {
    var panelId = tab.getAttribute("aria-controls");
    tabs.forEach(function (t) {
      var isActive = t === tab;
      t.classList.toggle("workshop-card__tab--active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
      t.tabIndex = isActive ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var isVisible = panel.id === panelId;
      panel.classList.toggle("workshop-card__panel--hidden", !isVisible);
      panel.hidden = !isVisible;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });

    tab.addEventListener("keydown", function (event) {
      var next = -1;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === -1) return;
      event.preventDefault();
      tabs[next].focus();
      activateTab(tabs[next]);
    });
  });

  tabs.forEach(function (tab, index) {
    tab.tabIndex = index === 0 ? 0 : -1;
  });
  panels.forEach(function (panel, index) {
    if (index > 0) panel.hidden = true;
  });
})();
