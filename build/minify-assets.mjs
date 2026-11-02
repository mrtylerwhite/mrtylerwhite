#!/usr/bin/env node
/**
 * Vercel build step: copy the site into dist/ and minify every CSS and JS file
 * on the way. The repo keeps the readable sources; only the deployed copy is
 * minified. Runs automatically on every deploy (vercel.json buildCommand).
 *
 * Local test:  npm run build:dist   then serve dist/
 *
 * Lives in build/ (not scripts/) because .vercelignore keeps scripts/ out of
 * the upload. Files ending in .min.css / .min.js are copied as they are.
 * If a file fails to minify, the original is kept and the build carries on.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "esbuild";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, "dist");

// Never part of the served site.
const SKIP = new Set(["node_modules", ".git", ".vercel", "dist", "build", ".claude", ".playwright-investigation", ".backups"]);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(css|js)$/.test(name) && !/\.min\.(css|js)$/.test(name)) files.push(full);
  }
  return files;
}

// api/ and middleware.js are Vercel functions, not static files.
const files = walk(OUT).filter((f) => {
  const rel = path.relative(OUT, f).split(path.sep).join("/");
  return !rel.startsWith("api/") && rel !== "middleware.js";
});

let before = 0, after = 0, failed = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  try {
    const { code } = await transform(src, {
      loader: file.endsWith(".css") ? "css" : "js",
      minify: true,
      legalComments: "none",
      charset: "utf8",
    });
    fs.writeFileSync(file, code);
    before += src.length;
    after += code.length;
  } catch (err) {
    failed++;
    console.warn(`  kept original (could not minify): ${path.relative(OUT, file)}\n    ${err.message.split("\n")[0]}`);
  }
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";
console.log(`Minified ${files.length - failed} of ${files.length} CSS/JS files: ${kb(before)} → ${kb(after)}`);
