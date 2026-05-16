/**
 * Latest Letter preview (newsletter landing)
 *
 * 1) Renders from JSON in #nl-latest-letter-data (fallback / manual edits).
 * 2) Optionally GETs /api/latest-broadcast (same-origin) and merges Kit fields
 *    when `data-latest-broadcast-url` is set on #nl-latest-letter-root.
 *    Kit credentials never touch the browser.
 */
(function () {
  var ROOT_ID = "nl-latest-letter-root";
  var DATA_ID = "nl-latest-letter-data";

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(root, data) {
    var eyebrow = data.eyebrow || "Latest letter";
    var title = data.title || "";
    var dateLabel = data.publishedLabel || data.publishedAt || "";
    var excerpt = data.excerpt || "";
    var bullets = Array.isArray(data.bullets) ? data.bullets : [];
    var ctaUrl = data.ctaUrl || "#";
    var ctaLabel = data.ctaLabel || "Read the issue";
    var thumb = data.thumbnailUrl || "";

    var bulletsHtml = bullets
      .slice(0, 3)
      .map(function (b) {
        return "<li>" + escapeHtml(b) + "</li>";
      })
      .join("");

    var thumbBlock = "";
    if (thumb) {
      thumbBlock =
        '<figure class="nl-preview__figure">' +
        '<img src="' +
        escapeHtml(thumb) +
        '" alt="" loading="lazy" decoding="async" width="640" height="360" />' +
        "</figure>";
    }

    root.innerHTML =
      '<article class="nl-preview-card nl-preview__card ds-card ds-card--surface ds-card--bordered ds-card--shadow ds-safe-wrap">' +
      thumbBlock +
      '<p class="ds-eyebrow nl-preview__eyebrow">' +
      escapeHtml(eyebrow) +
      "</p>" +
      '<h2 class="ds-card-title nl-preview__title">' +
      escapeHtml(title) +
      "</h2>" +
      (dateLabel
        ? '<p class="ds-caption nl-preview__date">' + escapeHtml(dateLabel) + "</p>"
        : "") +
      (excerpt
        ? '<p class="ds-body--small nl-preview__excerpt">' + escapeHtml(excerpt) + "</p>"
        : "") +
      (bulletsHtml
        ? '<ul class="nl-preview__highlights ds-body--small">' + bulletsHtml + "</ul>"
        : "") +
      '<p class="nl-preview__cta-wrap">' +
      '<a class="ds-btn ds-btn--primary nl-preview__cta" href="' +
      escapeHtml(ctaUrl) +
      '">' +
      escapeHtml(ctaLabel) +
      "</a>" +
      "</p>" +
      "</article>";
  }

  function readConfigEl() {
    var el = document.getElementById(DATA_ID);
    if (!el || !el.textContent) return null;
    try {
      return JSON.parse(el.textContent.trim());
    } catch (e) {
      return null;
    }
  }

  function mergeBroadcast(fallback, api) {
    if (!api || api.ok !== true || api.source !== "kit") return fallback;
    var m = {};
    var k;
    for (k in fallback) {
      if (Object.prototype.hasOwnProperty.call(fallback, k)) {
        m[k] = fallback[k];
      }
    }
    if (typeof api.eyebrow === "string" && api.eyebrow.trim()) {
      m.eyebrow = api.eyebrow.trim();
    }
    if (typeof api.title === "string" && api.title.trim()) {
      m.title = api.title.trim();
    }
    if (typeof api.publishedLabel === "string" && api.publishedLabel.trim()) {
      m.publishedLabel = api.publishedLabel.trim();
    }
    if (typeof api.publishedAt === "string" && api.publishedAt.trim()) {
      m.publishedAt = api.publishedAt.trim();
    }
    if (typeof api.excerpt === "string" && api.excerpt.trim()) {
      m.excerpt = api.excerpt.trim();
    }
    if (typeof api.ctaUrl === "string" && api.ctaUrl.trim()) {
      m.ctaUrl = api.ctaUrl.trim();
    }
    if (typeof api.ctaLabel === "string" && api.ctaLabel.trim()) {
      m.ctaLabel = api.ctaLabel.trim();
    }
    if (typeof api.thumbnailUrl === "string" && api.thumbnailUrl.trim()) {
      m.thumbnailUrl = api.thumbnailUrl.trim();
    }
    if (Array.isArray(api.bullets) && api.bullets.length > 0) {
      m.bullets = api.bullets.slice(0, 5);
    }
    return m;
  }

  function hydrateFromKit(root, fallback) {
    var url = (root.getAttribute("data-latest-broadcast-url") || "").trim();
    if (!url) return;

    fetch(url, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json().catch(function () {
          return null;
        });
      })
      .then(function (api) {
        if (!api || api.ok !== true) return;
        var merged = mergeBroadcast(fallback, api);
        render(root, merged);
      })
      .catch(function () {});
  }

  function init() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    var data = readConfigEl();
    if (!data || typeof data !== "object") {
      root.innerHTML =
        '<p class="ds-body--small nl-preview__excerpt">Latest issue preview is not configured.</p>';
      return;
    }

    render(root, data);
    hydrateFromKit(root, data);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
