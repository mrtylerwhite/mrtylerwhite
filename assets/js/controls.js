/*
  controls.js — interactivity for .ds-tabs and .ds-segmented (no dependencies).
  Drop-in: include before </body>, or add to your existing system JS bundle.
  Markup contract:
    <div class="ds-tabs" role="tablist">
      <button class="ds-tab" role="tab" aria-selected="true" data-panel="overview">Overview</button> …
    </div>
    Optional panels: <div data-tabpanel="overview">…</div> (others get hidden).
  Same contract for .ds-segmented with .ds-segmented__item.
*/
(function () {
  function wire(group, itemSelector) {
    document.querySelectorAll(group).forEach(function (root) {
      var items = root.querySelectorAll(itemSelector);
      items.forEach(function (item) {
        item.addEventListener("click", function () {
          items.forEach(function (b) {
            b.setAttribute("aria-selected", "false");
            b.classList.remove("is-active");
          });
          item.setAttribute("aria-selected", "true");
          item.classList.add("is-active");
          var panel = item.getAttribute("data-panel");
          if (panel) {
            document.querySelectorAll("[data-tabpanel]").forEach(function (p) {
              if (root.contains(p) || p.getAttribute("data-tabgroup") === root.id) return;
            });
            // show matching panel, hide siblings sharing the same controller
            var all = document.querySelectorAll('[data-tabpanel]');
            all.forEach(function (p) {
              if (p.getAttribute("data-tabowner") && p.getAttribute("data-tabowner") !== root.id) return;
              p.hidden = p.getAttribute("data-tabpanel") !== panel;
            });
          }
        });
      });
    });
  }
  wire(".ds-tabs", ".ds-tab");
  wire(".ds-segmented", ".ds-segmented__item");
})();
