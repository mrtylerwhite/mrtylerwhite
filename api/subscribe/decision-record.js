/**
 * The 10 Minute Decision Record lead magnet: Kit subscribe (server-side).
 * Same flow as prd-template.js: upsert the subscriber, tag them "Lead magnet:
 * Decision Record", and add them to the Decision Record Drip sequence, whose
 * first email delivers the .skill download. No Kit form, so no confirmation
 * email or double opt-in, and no form ID to configure in Vercel.
 *
 * Required env (never expose to client):
 *   KIT_API_KEY: Kit API v4 key (X-Kit-Api-Key), same key the other routes use
 * Optional env overrides:
 *   KIT_DECISION_RECORD_TAG_ID (default 26280350)
 *   KIT_DECISION_RECORD_SEQUENCE_ID (default 2981696)
 */

const { checkBot, validEmail, logBlocked } = require("../_lib/bot-guard");
const { attributionFields } = require("../_lib/attribution");

const KIT_API_BASE = "https://api.kit.com/v4";
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

async function upsertKitSubscriber(apiKey, email, firstName, fields) {
  // Only send first_name / fields when we have them, so existing values aren't wiped.
  const payload = { email_address: email };
  if (firstName) payload.first_name = firstName;
  if (fields && Object.keys(fields).length) payload.fields = fields;
  return fetch(`${KIT_API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

async function addKitSubscriberTo(apiKey, kind, id, email) {
  return fetch(
    `${KIT_API_BASE}/${kind}/${encodeURIComponent(id)}/subscribers`,
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
  // First name is optional; only sent to Kit when given.

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !validEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Valid email required." });
  }

  const guard = await checkBot(req, body);
  if (!guard.ok) {
    logBlocked("decision-record", guard);
    if (guard.silent) return res.status(200).json({ success: true });
    return res.status(guard.status).json({ success: false, error: guard.error });
  }

  const apiKey = process.env.KIT_API_KEY;
  const tagId = process.env.KIT_DECISION_RECORD_TAG_ID || "26280350";
  const sequenceId = process.env.KIT_DECISION_RECORD_SEQUENCE_ID || "2981696";

  if (!apiKey) {
    return res.status(503).json({ success: false, error: GENERIC_ERROR });
  }

  try {
    const subscriberRes = await upsertKitSubscriber(apiKey, email, firstName, attributionFields(body));
    if (!kitRequestSucceeded(subscriberRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }

    const [tagRes, seqRes] = await Promise.all([
      addKitSubscriberTo(apiKey, "tags", tagId, email),
      addKitSubscriberTo(apiKey, "sequences", sequenceId, email),
    ]);
    if (!kitRequestSucceeded(seqRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }
    if (!kitRequestSucceeded(tagRes.status)) {
      console.error("decision-record: tag failed", tagRes.status);
    }

    return res.status(200).json({ success: true });
  } catch (_) {
    return res.status(502).json({ success: false, error: GENERIC_ERROR });
  }
};
