#!/usr/bin/env node
/**
 * PR 1: strip sdui + defer GTM across static HTML.
 * node scripts/apply-launch-safety-pr1.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const SDUI_STYLE =
  /\t\t<style>html\.sdui-panel-open[\s\S]*?<\/style>\n/;
const SDUI_SCRIPT =
  /\t\t<script>try\{if\(!document\.documentElement\.classList\.contains\('sdui-panel-open'\)[\s\S]*?<\/script>\n/;

const GTM_BLOCK =
  /<!-- Google tag \(gtag\.js\) snippet added by Site Kit -->\s*<!-- Google Analytics snippet added by Site Kit -->\s*<script type="text\/javascript" src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=GT-NBP3W94" id="google_gtagjs-js" async><\/script>\s*<script type="text\/javascript" id="google_gtagjs-js-after">[\s\S]*?<\/script>\s*/g;

const GTM_REPLACEMENT =
  '<!-- Google tag (gtag.js) deferred for performance -->\n<script src="/assets/js/gtm-defer.js" defer></script>\n';

function walkHtml(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name === "wp-content" || name === "wp-includes") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walkHtml(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of walkHtml(ROOT)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  s = s.replace(SDUI_STYLE, "");
  s = s.replace(SDUI_SCRIPT, "");
  s = s.replace(GTM_BLOCK, GTM_REPLACEMENT);
  if (s !== before) {
    fs.writeFileSync(file, s);
    n += 1;
    console.log("patched", path.relative(ROOT, file));
  }
}
console.log("done,", n, "files");
