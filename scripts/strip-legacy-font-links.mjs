#!/usr/bin/env node
/**
 * Remove legacy third-party font <link> tags from static HTML.
 * Inter loads via assets/css/system/fonts.css (imported in headings.css).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PATTERNS = [
  /<link\s+rel=['"]dns-prefetch['"]\s+href=['"]https?:\/\/fonts\.googleapis\.com[^'"]*['"][^>]*>\s*/gi,
  /<link\s+rel=['"]dns-prefetch['"]\s+href=['"]\/\/fonts\.googleapis\.com[^'"]*['"][^>]*>\s*/gi,
  /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*/gi,
  /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/gi,
  /<link\s+rel="preconnect"\s+href="https:\/\/use\.typekit\.net"[^>]*>\s*/gi,
  /<link\s+rel="stylesheet"\s+href="https:\/\/use\.typekit\.net\/kap0kcr\.css"[^>]*>\s*/gi,
  /<link\s+rel=['"]stylesheet['"]\s+id=['"]et-builder-googlefonts-cached-css['"][^>]*>\s*/gi,
  /<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Lato[^>]*>\s*/gi,
  /<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css\?family=Figtree[^>]*>\s*/gi,
  /<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Geist[^>]*>\s*/gi,
  /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Geist[^>]*>\s*/gi,
  /<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Geist[^>]*>\s*/gi,
  /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Geist[^&]*&family=Smooch[^>]*>\s*/gi,
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "wp-content") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (name.endsWith(".html")) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  for (const re of PATTERNS) html = html.replace(re, "");
  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    changed++;
    console.log("updated", path.relative(ROOT, file));
  }
}
console.log(`Done: ${changed} file(s)`);
