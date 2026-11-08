#!/usr/bin/env node
/**
 * Generate Letters cover drafts with the OpenAI Images API.
 *
 *   node scripts/generate-covers.mjs ux-metrics prd-vs-brd   # specific letters
 *   node scripts/generate-covers.mjs --all                    # every letter in cover-prompts.json
 *   node scripts/generate-covers.mjs --all --model gpt-image-1.5
 *
 * Prompts live in scripts/cover-prompts.json (shared style + one scene per slug).
 * Drafts land in .covers-drafts/<slug>.jpg (gitignored) for review before they
 * are swapped into assets/images/letters/.
 *
 * Needs OPENAI_API_KEY in .env.local or .env (both gitignored).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, ".covers-drafts");
const CONCURRENCY = 3;

async function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (!existsSync(p)) continue;
    const m = (await readFile(p, "utf8")).match(/^OPENAI_API_KEY=(.+)$/m);
    const key = m && m[1].trim().replace(/^["']|["']$/g, "");
    if (key && key.startsWith("PASTE_")) throw new Error(`Replace the OPENAI_API_KEY placeholder in ${f} with your key`);
    if (key) return key;
  }
  throw new Error("OPENAI_API_KEY not found in env, .env.local or .env");
}

function buildPrompt(style, c) {
  return `${style}\n\nThe idea it must communicate clearly: ${c.idea}.\n\nScene: ${c.scene}\n\n${c.text}`;
}

async function generate(key, model, slug, prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size: "1536x1024", quality: "high", output_format: "jpeg", n: 1 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.error?.message || JSON.stringify(body)}`);
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image in response");
  const out = path.join(OUT_DIR, `${slug}.jpg`);
  await writeFile(out, Buffer.from(b64, "base64"));
  return path.relative(ROOT, out);
}

async function main() {
  const args = process.argv.slice(2);
  const mi = args.indexOf("--model");
  const model = mi >= 0 ? args.splice(mi, 2)[1] : "gpt-image-2";
  const { style, covers } = JSON.parse(await readFile(path.join(ROOT, "scripts/cover-prompts.json"), "utf8"));
  const slugs = args.includes("--all") ? Object.keys(covers) : args;
  if (!slugs.length) throw new Error("Pass letter slugs or --all");
  const unknown = slugs.filter((s) => !covers[s]);
  if (unknown.length) throw new Error(`No prompt for: ${unknown.join(", ")}`);

  const key = await loadKey();
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${slugs.length} cover(s) with ${model}…`);

  const queue = [...slugs];
  let failed = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let slug; (slug = queue.shift()); ) {
        try {
          console.log(`  ✓ ${slug} → ${await generate(key, model, slug, buildPrompt(style, covers[slug]))}`);
        } catch (e) {
          failed++;
          console.error(`  ✗ ${slug}: ${e.message}`);
        }
      }
    }),
  );
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
