/**
 * Funnel Simulator lead magnet: Kit subscribe (server-side).
 *
 * Upserts the subscriber, tags them Funnel Simulator, and adds them to the
 * Funnel Simulator Drip sequence (3 emails, ends with the Builder Kickoff pitch).
 *
 * Required env (never expose to client):
 *   KIT_API_KEY: Kit API v4 key (X-Kit-Api-Key), same key the ROI route uses
 * Optional env overrides:
 *   KIT_FUNNEL_SIM_TAG_ID (default 24704531)
 *   KIT_FUNNEL_SIM_SEQUENCE_ID (default 2932269)
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
  // First name is optional: the capture asks for email only.

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Valid email required." });
  }

  const apiKey = process.env.KIT_API_KEY;
  const tagId = process.env.KIT_FUNNEL_SIM_TAG_ID || "24704531";
  const sequenceId = process.env.KIT_FUNNEL_SIM_SEQUENCE_ID || "2932269";

  if (!apiKey) {
    return res.status(503).json({ success: false, error: GENERIC_ERROR });
  }

  try {
    const subscriberRes = await upsertKitSubscriber(apiKey, email, firstName);
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
      console.error("funnel-simulator: tag failed", tagRes.status);
    }

    return res.status(200).json({ success: true });
  } catch (_) {
    return res.status(502).json({ success: false, error: GENERIC_ERROR });
  }
};
