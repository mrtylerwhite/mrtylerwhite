/**
 * Lead attribution → Kit custom fields, shared by the signup endpoints.
 * The underscore folder keeps Vercel from serving this file as a route.
 *
 * The browser sends `attribution: { referrer, landing_page, utm_source, ... }`
 * (assets/js/attribution.js). This keeps only the known keys, strips control
 * characters, caps lengths, and drops anything that isn't a plain http(s) URL
 * where a URL is expected. Empty values are left out, so a later signup never
 * blanks a field Kit already has.
 *
 * The Kit custom fields (same keys) were created in Kit on 22 Nov 2026.
 */

const URL_KEYS = ["referrer", "landing_page", "signup_page"];
const TEXT_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function attributionFields(body) {
  const src = body && typeof body.attribution === "object" && body.attribution ? body.attribution : {};
  const out = {};
  for (const key of URL_KEYS) {
    const v = clean(src[key], 500);
    if (v && /^https?:\/\/[^\s]+$/i.test(v)) out[key] = v;
  }
  for (const key of TEXT_KEYS) {
    const v = clean(src[key], 200);
    if (v) out[key] = v;
  }
  return out;
}

module.exports = { attributionFields };
