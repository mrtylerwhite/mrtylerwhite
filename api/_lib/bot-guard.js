/**
 * Bot protection shared by every signup endpoint (api/subscribe/*).
 * The underscore folder keeps Vercel from serving this file as a route.
 *
 * Checks, cheapest first:
 *   1. Honeypot: `website` must be empty. Real people never see the field.
 *   2. Timing: `formElapsedMs` (ms between the form rendering and the submit,
 *      measured on the visitor's own clock) must be at least MIN_ELAPSED_MS.
 *      Scripts that POST straight to the API don't send it at all.
 *   3. Name sanity: a first name that is clearly not a name (a URL, an email,
 *      keyboard-mash like "xKqLwPzRt"). Deliberately conservative.
 *   4. Cloudflare Turnstile: when TURNSTILE_SECRET_KEY is set, the token in
 *      `turnstileToken` must verify. Fails closed. With no secret, this check
 *      is skipped so signups keep working before the keys exist.
 *
 * Checks 1-3 fail silently: the caller returns a fake success, so a bot learns
 * nothing. Turnstile failures return a real error, because the person on the
 * other end may be human (a blocked script, an expired token).
 *
 * Usage in a handler, after the body is parsed and before calling Kit:
 *   const guard = await checkBot(req, body);
 *   if (guard.silent) return res.status(200).json({ success: true });
 *   if (guard.error) return res.status(guard.status).json({ success: false, error: guard.error });
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MIN_ELAPSED_MS = 3000;

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[A-Za-z]{2,}$/;

function validEmail(email) {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email);
}

// Only flags names a human would never type. Mixed case like "McDonald",
// "DeAndre" or "MacKenzie" passes; so do accents, hyphens and apostrophes.
function suspiciousName(name) {
  if (!name) return false;
  if (name.length > 60) return true;
  if (/https?:|www\.|@|\.(com|net|org|ru|xyz|io)\b/i.test(name)) return true;
  if (/\d{3,}/.test(name)) return true;
  for (const word of name.split(/[\s\-']+/)) {
    const letters = word.replace(/[^A-Za-z]/g, "");
    if (letters.length < 8) continue;
    // 3+ capitals after the first letter in one word: "xKqLwPzRt", "AbCdEfGh".
    const innerCaps = (letters.slice(1).match(/[A-Z]/g) || []).length;
    if (innerCaps >= 3) return true;
    // Long words with no vowels at all: "Bcdfghjkl".
    if (!/[aeiouyAEIOUY]/.test(letters)) return true;
  }
  return false;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || "";
}

async function verifyTurnstile(secret, token, ip) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set("remoteip", ip);
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json().catch(() => ({}));
    return data && data.success === true;
  } catch (_) {
    return false; // fail closed
  }
}

async function checkBot(req, body) {
  const b = body && typeof body === "object" ? body : {};

  if (typeof b.website === "string" && b.website.trim() !== "") {
    return { silent: true, reason: "honeypot" };
  }

  const elapsed = Number(b.formElapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) {
    return { silent: true, reason: "too_fast" };
  }

  const firstName = typeof b.firstName === "string" ? b.firstName.trim() : "";
  if (suspiciousName(firstName)) {
    return { silent: true, reason: "name" };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const ok = await verifyTurnstile(secret, b.turnstileToken, clientIp(req));
    if (!ok) {
      return {
        status: 403,
        error: "We couldn't confirm you're not a bot. Refresh the page and try again.",
        reason: "turnstile",
      };
    }
  }

  return { ok: true };
}

function logBlocked(route, guard) {
  // Shows up in Vercel function logs; no email or name, just the reason.
  console.warn(`[bot-guard] ${route} blocked: ${guard.reason}`);
}

module.exports = { checkBot, validEmail, suspiciousName, logBlocked, MIN_ELAPSED_MS };
