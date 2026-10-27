/*
  Cookie-consent region (Vercel Edge Middleware, no dependencies).

  Sets mtw_geo on page requests so consent.js knows whether to ask first:
    mtw_geo=1  EU/EEA, UK, Switzerland or Quebec: analytics stay off until the
               visitor accepts in the consent card.
    mtw_geo=0  everywhere else: analytics on by default, opt out any time via
               "Cookie settings" in the footer.
  No cookie (local dev, unknown location) is treated as 1, the safe default.

  Only writes the cookie when it's missing or the region changed, so most
  requests pass straight through.
*/

export const config = {
  // Pages only: skip static assets, uploads and API routes.
  matcher: ["/((?!assets/|wp-content/|wp-includes/|api/|.*\\.[a-z0-9]+$).*)"],
};

const ASK_FIRST = new Set([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA, UK, Switzerland
  "IS", "LI", "NO", "GB", "CH",
]);
const COOKIE = "mtw_geo";
const MAX_AGE = 60 * 60 * 24 * 30;

export default function middleware(request) {
  const country = request.headers.get("x-vercel-ip-country");
  if (!country) return;
  const region = request.headers.get("x-vercel-ip-country-region") || "";
  const value = ASK_FIRST.has(country) || (country === "CA" && region === "QC") ? "1" : "0";

  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)mtw_geo=([01])(?:;|$)/);
  if (match && match[1] === value) return;

  const headers = new Headers();
  headers.set("x-middleware-next", "1");
  headers.append("set-cookie", `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`);
  return new Response(null, { headers });
}
