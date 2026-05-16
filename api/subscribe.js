/**
 * Proxies newsletter signups to Kit (ConvertKit) native form endpoint so
 * double-opt-in / incentive (confirmation) emails are sent — same as
 * https://app.kit.com/forms/{id}/subscriptions on SaaSifyOS.
 *
 * Required env:
 *   KIT_FORM_ID — numeric form ID (e.g. 4969496 for Weekly Newsletter)
 *
 * KIT_API_KEY / KIT_BROADCAST_API_KEY are not used here (only for other /api/* routes).
 */

const KIT_FORM_SUBSCRIBE_BASE = "https://app.kit.com/forms";

function alreadyParsedBody(req) {
  const b = req.body;
  if (b == null) return null;
  if (typeof b === "string") {
    try {
      return JSON.parse(b || "{}");
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(b)) {
    try {
      return JSON.parse(b.toString("utf8") || "{}");
    } catch {
      return {};
    }
  }
  if (typeof b === "object") return b;
  return null;
}

function readJsonFromStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function kitFormSubscribeSucceeded(status) {
  return status === 302 || status === 200 || status === 201;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = alreadyParsedBody(req);
  if (body == null) {
    body = await readJsonFromStream(req);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const formId = process.env.KIT_FORM_ID;
  if (!formId) {
    return res.status(503).json({
      error:
        "Newsletter signup is not configured. Add KIT_FORM_ID to the deployment environment.",
    });
  }

  const params = new URLSearchParams({ email_address: email });
  const referrer =
    typeof body.referrer === "string" && body.referrer.trim()
      ? body.referrer.trim()
      : typeof req.headers.referer === "string"
        ? req.headers.referer
        : "";
  if (referrer) {
    params.set("referrer", referrer);
  }

  try {
    const kitRes = await fetch(
      `${KIT_FORM_SUBSCRIBE_BASE}/${encodeURIComponent(formId)}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "text/html,application/xhtml+xml",
        },
        body: params.toString(),
        redirect: "manual",
      }
    );

    const location = kitRes.headers.get("location") || "";
    if (
      kitFormSubscribeSucceeded(kitRes.status) &&
      location.includes("/forms/guards/")
    ) {
      return res.status(502).json({
        error:
          "Kit blocked this server-side signup. Use the newsletter form on /newsletter/ (browser submits directly to Kit).",
      });
    }

    if (kitFormSubscribeSucceeded(kitRes.status)) {
      return res.status(200).json({
        success: true,
        kit_status: kitRes.status,
        redirect: location || null,
      });
    }

    const errText = await kitRes.text().catch(() => "");
    return res.status(
      kitRes.status >= 400 && kitRes.status < 600 ? kitRes.status : 502
    ).json({
      error: "Subscription failed",
      details:
        process.env.VERCEL_ENV === "production"
          ? undefined
          : { status: kitRes.status, body: errText.slice(0, 500) },
    });
  } catch (err) {
    return res.status(502).json({
      error: "Subscription failed",
      details:
        process.env.VERCEL_ENV === "production"
          ? undefined
          : String(err?.message || err),
    });
  }
};
