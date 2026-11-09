/**
 * Prototyping Method waitlist: Kit subscribe (server-side) with launch intent.
 *
 * Upserts the subscriber with two custom fields (prototype_goal, launch_intent),
 * then tags them "Waitlist: Prototyping Method". Optionally adds them to a
 * welcome sequence ("Prototyping Method: Waitlist").
 *
 * Required env (never expose to client):
 *   KIT_API_KEY: Kit API v4 key (X-Kit-Api-Key), same key the other routes use
 * Optional env overrides:
 *   KIT_PROTO_WAITLIST_TAG_ID (default 25298270)
 *   KIT_PROTO_WAITLIST_SEQUENCE_ID (default 2953530, "Prototyping Method: Waitlist")
 */

const { checkBot, validEmail, logBlocked } = require("../_lib/bot-guard");

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
  const payload = { email_address: email };
  // Only send values we have, so existing data isn't wiped.
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

const INTENTS = { yes: "Yes, on launch day", maybe: "Maybe, show me more", curious: "Just curious" };

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
  if (body == null) body = await readJsonFromStream(req);

  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !validEmail(email)) {
    return res.status(400).json({ success: false, error: "Valid email required." });
  }

  const guard = await checkBot(req, body);
  if (!guard.ok) {
    logBlocked("prototyping-waitlist", guard);
    if (guard.silent) return res.status(200).json({ success: true });
    return res.status(guard.status).json({ success: false, error: guard.error });
  }
  // Honeypot: bots fill every field.
  if (typeof body.company === "string" && body.company.trim()) {
    return res.status(200).json({ success: true });
  }
  const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 500) : "";
  const intent = INTENTS[body.intent] || "";

  const apiKey = process.env.KIT_API_KEY;
  const tagId = process.env.KIT_PROTO_WAITLIST_TAG_ID || "25298270";
  const sequenceId = process.env.KIT_PROTO_WAITLIST_SEQUENCE_ID || "2953530";
  if (!apiKey) return res.status(503).json({ success: false, error: GENERIC_ERROR });

  const fields = {};
  if (goal) fields.prototype_goal = goal;
  if (intent) fields.launch_intent = intent;

  try {
    const subscriberRes = await upsertKitSubscriber(apiKey, email, firstName, fields);
    if (!kitRequestSucceeded(subscriberRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }
    const jobs = [addKitSubscriberTo(apiKey, "tags", tagId, email)];
    if (sequenceId) jobs.push(addKitSubscriberTo(apiKey, "sequences", sequenceId, email));
    const [tagRes] = await Promise.all(jobs);
    if (!kitRequestSucceeded(tagRes.status)) {
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }
    return res.status(200).json({ success: true });
  } catch (_) {
    return res.status(502).json({ success: false, error: GENERIC_ERROR });
  }
};
