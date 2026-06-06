#!/usr/bin/env node
/**
 * Phase 1: remove unused WordPress/plugin CSS and conditional mediaelement assets.
 *
 * node scripts/strip-dead-css-links.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const STRIP_ALWAYS = [
  /<link\s+rel=['"]stylesheet['"]\s+id=['"]wp-components-css['"][^>]*>\s*/gi,
  /<link\s+rel=['"]stylesheet['"]\s+id=['"]godaddy-styles-css['"][^>]*>\s*/gi,
];

const STRIP_MEDIA = [
  /<link\s+rel=['"]stylesheet['"]\s+id=['"]mediaelement-css['"][^>]*>\s*/gi,
  /<link\s+rel=['"]stylesheet['"]\s+id=['"]wp-mediaelement-css['"][^>]*>\s*/gi,
  /<script\s+type="text\/javascript"\s+id="mediaelement-core-js-before">[\s\S]*?<\/script>\s*/gi,
  /<script\s+type="text\/javascript"\s+src="\/wp-includes\/js\/mediaelement\/mediaelement-and-player\.min\.js"[^>]*><\/script>\s*/gi,
  /<script\s+type="text\/javascript"\s+src="\/wp-includes\/js\/mediaelement\/mediaelement-migrate\.min\.js"[^>]*><\/script>\s*/gi,
  /<script\s+type="text\/javascript"\s+id="mediaelement-js-extra">[\s\S]*?<\/script>\s*/gi,
  /<script\s+type="text\/javascript"\s+src="\/wp-includes\/js\/mediaelement\/wp-mediaelement\.min\.js"[^>]*><\/script>\s*/gi,
];

function walkHtml(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "wp-content" || name === "wp-includes") {
      continue;
    }
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkHtml(full, files);
    else if (name.endsWith(".html")) files.push(full);
  }
  return files;
}

function hasMediaElement(html) {
  return /<(?:video|audio)\b/i.test(html);
}

function stripPatterns(html, patterns) {
  let out = html;
  for (const re of patterns) out = out.replace(re, "");
  return out;
}

let changed = 0;
let mediaRemoved = 0;

for (const file of walkHtml(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = stripPatterns(html, STRIP_ALWAYS);

  if (!hasMediaElement(html)) {
    const beforeMedia = html;
    html = stripPatterns(html, STRIP_MEDIA);
    if (html !== beforeMedia) mediaRemoved++;
  }

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    changed++;
    console.log("stripped", path.relative(ROOT, file));
  }
}

console.log(`Done: ${changed} HTML file(s) updated, mediaelement removed from ${mediaRemoved} page(s)`);
