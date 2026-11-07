/**
 * PRD Template lead magnet: Kit subscribe (server-side). Same flow as
 * roi-case-study.js: upsert the subscriber, then add them to a form.
 * The template itself is delivered on /free-prd-template/thank-you/, so no
 * incentive email is required.
 *
 * Required env (never expose to client):
 *   KIT_API_KEY: Kit API v4 key (X-Kit-Api-Key), same key the ROI route uses
 * Optional env:
 *   KIT_PRD_TEMPLATE_FORM_ID: a dedicated Kit form for this lead magnet.
 *     Falls back to KIT_FORM_ID (the Weekly Newsletter form, 4969496).
 *   KIT_PRD_TEMPLATE_TAG_ID: tag to apply as well (skipped when unset).
 *
 * https://developers.kit.com/api-reference/subscribers/create-a-subscriber
 * https://developers.kit.com/api-reference/forms/add-subscriber-to-form-by-email-address
 */

const KIT_API_BASE = "https://api.kit.com/v4";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Something went wrong. Please try again.";

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

function kitRequestSucceeded(status) {
  return status >= 200 && status < 300;
}

async function upsertKitSubscriber(apiKey, email, firstName) {
  return fetch(`${KIT_API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    // Only send first_name when we have one, so an existing name isn't wiped.
    body: JSON.stringify(
      firstName ? { email_address: email, first_name: firstName } : { email_address: email }
    ),
  });
}

async function addKitSubscriberToForm(apiKey, formId, email) {
  return fetch(
    `${KIT_API_BASE}/forms/${encodeURIComponent(formId)}/subscribers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email_address: email,
      }),
    }
  );
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: GENERIC_ERROR });
  }

  let body = alreadyParsedBody(req);
  if (body == null) {
    body = await readJsonFromStream(req);
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  // First name is optional: the capture asks for email only.

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Valid email required." });
  }

  const apiKey = process.env.KIT_API_KEY;
  const formId =
    process.env.KIT_PRD_TEMPLATE_FORM_ID || process.env.KIT_FORM_ID || "4969496";
  const tagId = process.env.KIT_PRD_TEMPLATE_TAG_ID;

  if (!apiKey || !formId) {
    return res.status(503).json({ success: false, error: GENERIC_ERROR });
  }

  try {
    const subscriberRes = await upsertKitSubscriber(apiKey, email, firstName);
    if (!kitRequestSucceeded(subscriberRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }

    const formRes = await addKitSubscriberToForm(apiKey, formId, email);
    if (!kitRequestSucceeded(formRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }

    if (tagId) {
      const tagRes = await fetch(
        `${KIT_API_BASE}/tags/${encodeURIComponent(tagId)}/subscribers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey },
          body: JSON.stringify({ email_address: email }),
        }
      );
      if (!kitRequestSucceeded(tagRes.status)) {
        console.error("prd-template: tag failed", tagRes.status);
      }
    }

    return res.status(200).json({ success: true });
  } catch (_) {
    return res.status(502).json({ success: false, error: GENERIC_ERROR });
  }
};
