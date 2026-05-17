#!/usr/bin/env node
/**
 * Verify self-hosted Inter (no Google Fonts requests).
 * Run: node scripts/investigate-inter-fonts.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../.playwright-investigation/inter-fonts');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';

const PAGES = [
  { name: 'homeHero', path: '/', selector: '.hero-cntn h1, .et_pb_text_0 h1' },
  { name: 'newsletter', path: '/newsletter/', selector: '.nl-saasify-headline' },
  { name: 'caseCard', path: '/', selector: '.card-kepler.card-notch h5' },
];

async function inspectPage(page, { name, path, selector }) {
  const fontRequests = [];
  const consoleErrors = [];
  page.on('request', (req) => {
    const u = req.url();
    if (/fonts\.(googleapis|gstatic)\.com|typekit|use\.typekit/i.test(u)) {
      fontRequests.push(u);
    }
    if (/\/assets\/fonts\/inter\//i.test(u)) {
      fontRequests.push(u);
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  const data = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { error: `missing ${sel}` };
    const cs = getComputedStyle(el);
    const usesInter = /inter/i.test(cs.fontFamily);
    const localInterLoaded = [...document.fonts].some(
      (f) => /inter/i.test(f.family) && f.status === 'loaded'
    );
    return {
      selector: sel,
      computed: {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        letterSpacing: cs.letterSpacing,
      },
      usesInter,
      localInterLoaded,
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
    };
  }, selector);

  const external = fontRequests.filter((u) => /googleapis|gstatic|typekit/i.test(u));
  const local = fontRequests.filter((u) => /\/assets\/fonts\/inter\//i.test(u));

  return {
    page: name,
    url: BASE + path,
    externalFontRequests: [...new Set(external)],
    localFontRequests: [...new Set(local)],
    consoleErrors: consoleErrors.filter((e) => !e.includes('favicon')),
    pass: external.length === 0 && data.usesInter && data.localInterLoaded && !data.error,
    ...data,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of [
    { name: 'desktop', width: 1280 },
    { name: 'mobile', width: 390 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: 900 } });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      results.push({ viewport: vp.name, ...(await inspectPage(page, p)) });
    }
    await ctx.close();
  }

  await browser.close();

  const report = { base: BASE, results, generatedAt: new Date().toISOString() };
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  let ok = true;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) ok = false;
    console.log(`[${status}] ${r.viewport} ${r.page}`);
    if (r.error) console.log('  ', r.error);
    console.log('  family:', r.computed?.fontFamily);
    console.log('  external:', r.externalFontRequests.length, r.externalFontRequests[0] || '');
    console.log('  local:', r.localFontRequests.length, r.localFontRequests[0] || '');
  }

  console.log(`\nWrote ${join(OUT, 'report.json')}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
