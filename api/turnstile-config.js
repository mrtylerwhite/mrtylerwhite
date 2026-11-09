/**
 * Tells signup forms whether Cloudflare Turnstile is on, and with which site
 * key. Read at runtime (not baked into the build) so the browser and the
 * server always agree: the moment TURNSTILE_SECRET_KEY is enforced, forms
 * already render the widget, with no stale cached JS in between.
 *
 * Env: TURNSTILE_SITE_KEY (public). Turnstile is only reported as on when
 * TURNSTILE_SECRET_KEY is set too.
 */
module.exports = function handler(req, res) {
  const siteKey = process.env.TURNSTILE_SITE_KEY || "";
  const enabled = Boolean(siteKey && process.env.TURNSTILE_SECRET_KEY);
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  return res.status(200).json({ siteKey: enabled ? siteKey : "" });
};
