#!/usr/bin/env node
/**
 * Shared HTML partials (nav, footer) for the static site.
 *
 * Edit the source in partials/*.html, then run:
 *   npm run build:partials          rewrite every page that uses a partial
 *   npm run build:partials -- --check   exit 1 if any page is out of date
 *
 * In a page, a partial is a marked region. Everything between the markers is
 * generated, so don't hand-edit it:
 *   <!-- partial:header -->…<!-- /partial:header -->
 *   <!-- partial:footer hide="case-study" theme="dark" -->…<!-- /partial:footer -->
 *
 * Marker attributes become flags: hide="a b" → hide-a, hide-b; theme="dark" → theme-dark.
 *
 * Template syntax inside partials/*.html:
 *   {{#flag}}…{{/flag}}        keep only when the flag is set
 *   {{^flag}}…{{/flag}}        keep only when the flag is NOT set
 *   {{aria /path/}}            ` aria-current="page"` on that page
 *   {{current /path/ "text"}}  `text` on that page (e.g. an active class)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PARTIALS_DIR = path.join(ROOT, "partials");
const SKIP_DIRS = new Set(["node_modules", ".git", "wp-content", "wp-includes", "partials"]);

const MARKER_RE = /<!-- partial:([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->[\s\S]*?<!-- \/partial:\1 -->/g;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const SECTION_RE = /\{\{([#^])([\w-]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g;
const ARIA_RE = /\{\{aria (\S+)\}\}/g;
const CURRENT_RE = /\{\{current (\S+) "([^"]*)"\}\}/g;

const partialCache = new Map();

function loadPartial(name) {
  if (!partialCache.has(name)) {
    const file = path.join(PARTIALS_DIR, `${name}.html`);
    if (!fs.existsSync(file)) throw new Error(`Unknown partial "${name}" (expected ${path.relative(ROOT, file)})`);
    partialCache.set(name, fs.readFileSync(file, "utf8").trimEnd());
  }
  return partialCache.get(name);
}

function parseFlags(attrString) {
  const flags = new Set();
  for (const [, key, value] of attrString.matchAll(ATTR_RE)) {
    for (const v of value.split(/\s+/).filter(Boolean)) flags.add(`${key}-${v}`);
  }
  return flags;
}

/** about/index.html → /about/, index.html → / */
function pageUrl(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  return "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "/");
}

function render(name, flags, url) {
  const out = loadPartial(name)
    .replace(SECTION_RE, (_, kind, flag, body) => ((kind === "#") === flags.has(flag) ? body : ""))
    .replace(ARIA_RE, (_, p) => (p === url ? ' aria-current="page"' : ""))
    .replace(CURRENT_RE, (_, p, text) => (p === url ? text : ""));
  const leftover = out.match(/\{\{[^}]*\}\}/);
  if (leftover) throw new Error(`Unhandled template tag ${leftover[0]} in partial "${name}"`);
  return out;
}

function walkHtml(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkHtml(full, files);
    else if (name.endsWith(".html")) files.push(full);
  }
  return files;
}

const check = process.argv.includes("--check");
let changed = 0;
let pagesUsing = 0;

for (const file of walkHtml(ROOT)) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes("<!-- partial:")) continue;
  pagesUsing++;
  const url = pageUrl(file);
  const next = html.replace(MARKER_RE, (_, name, attrs) => {
    const open = `<!-- partial:${name}${attrs} -->`;
    return `${open}\n${render(name, parseFlags(attrs), url)}\n<!-- /partial:${name} -->`;
  });
  if (next !== html) {
    changed++;
    const rel = path.relative(ROOT, file);
    if (check) console.log("  out of date →", rel);
    else {
      fs.writeFileSync(file, next, "utf8");
      console.log("  updated →", rel);
    }
  }
}

if (check) {
  console.log(changed ? `${changed} page(s) out of date. Run: npm run build:partials` : `All ${pagesUsing} page(s) up to date.`);
  process.exit(changed ? 1 : 0);
}
console.log(`Updated ${changed} of ${pagesUsing} page(s) using partials.`);
