/**
 * Latest public Kit broadcast (read-only, server-side).
 * https://developers.kit.com/api-reference/broadcasts/list-broadcasts
 *
 * Auth: Kit API v4 uses header `X-Kit-Api-Key` (see OpenAPI on developers.kit.com).
 *
 * Required env (Vercel → Environment Variables):
 *   KIT_BROADCAST_API_KEY — secret API key with read access; never expose to the browser.
 */

const KIT_BROADCASTS_URL = "https://api.kit.com/v4/broadcasts";
const MAX_PAGES = 8;
const PER_PAGE = 100;
const EXCERPT_MAX = 240;

function stripHtml(html) {
  if (html == null || typeof html !== "string") return "";
  const noTags = html.replace(/<[^>]*>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}

function truncateExcerpt(text) {
  if (!text) return "";
  const t = text.trim();
  if (t.length <= EXCERPT_MAX) return t;
  return t.slice(0, EXCERPT_MAX - 1).trimEnd() + "…";
}

function excerptFromBroadcast(b) {
  const preview =
    typeof b.preview_text === "string" && b.preview_text.trim()
      ? b.preview_text.trim()
      : "";
  if (preview) return truncateExcerpt(preview);
  const desc = stripHtml(b.description || "");
  return truncateExcerpt(desc);
}

function formatPublishedLabel(iso) {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

async function fetchBroadcastPage(apiKey, after) {
  const url = new URL(KIT_BROADCASTS_URL);
  url.searchParams.set("per_page", String(PER_PAGE));
  if (after) url.searchParams.set("after", after);

  const kitRes = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Kit-Api-Key": apiKey,
      Accept: "application/json",
    },
  });

  const data = await kitRes.json().catch(() => ({}));
  return { ok: kitRes.ok, status: kitRes.status, data };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.KIT_BROADCAST_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    return res.status(503).json({
      ok: false,
      error:
        "Latest broadcast is not configured. Add KIT_BROADCAST_API_KEY to the deployment environment.",
    });
  }

  const collected = [];
  let after = null;
  let pages = 0;

  try {
    while (pages < MAX_PAGES) {
      pages += 1;
      const { ok, status, data } = await fetchBroadcastPage(apiKey, after);

      if (!ok) {
        const msg =
          (data &&
            Array.isArray(data.errors) &&
            data.errors[0] &&
            String(data.errors[0])) ||
          data.message ||
          "Kit request failed";
        const outStatus = status === 401 || status === 403 ? status : 502;
        return res.status(outStatus).json({
          ok: false,
          error: msg,
          details:
            process.env.VERCEL_ENV === "production" ? undefined : data,
        });
      }

      const list = Array.isArray(data.broadcasts) ? data.broadcasts : [];
      collected.push(...list);

      const pag = data.pagination || {};
      if (!pag.has_next_page || !pag.end_cursor) break;
      after = pag.end_cursor;
    }
  } catch {
    return res.status(502).json({
      ok: false,
      error: "Network error while contacting Kit.",
    });
  }

  const candidates = collected.filter(function (b) {
    if (!b || b.public !== true) return false;
    const url = b.public_url;
    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url.trim()))
      return false;
    if (!b.published_at || typeof b.published_at !== "string") return false;
    return true;
  });

  if (!candidates.length) {
    return res.status(404).json({
      ok: false,
      error: "No public broadcast with a web URL was found.",
    });
  }

  candidates.sort(function (a, b) {
    const ta = Date.parse(a.published_at) || 0;
    const tb = Date.parse(b.published_at) || 0;
    return tb - ta;
  });

  const b = candidates[0];
  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  if (!subject) {
    return res.status(404).json({
      ok: false,
      error: "Latest public broadcast has no subject.",
    });
  }

  const publishedAt = b.published_at;
  const publishedLabel = formatPublishedLabel(publishedAt);
  const excerpt = excerptFromBroadcast(b);
  const thumb =
    typeof b.thumbnail_url === "string" && /^https?:\/\//i.test(b.thumbnail_url.trim())
      ? b.thumbnail_url.trim()
      : "";

  const body = {
    ok: true,
    source: "kit",
    eyebrow: "Latest letter",
    title: subject,
    publishedLabel,
    publishedAt,
    excerpt,
    bullets: [],
    ctaUrl: String(b.public_url).trim(),
    ctaLabel: "Read the issue",
    thumbnailUrl: thumb,
  };

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return res.status(200).json(body);
};
