#!/usr/bin/env node
/**
 * Smoke-test optimized video URLs and lazy-loading attributes.
 * Requires local dev server (npm run dev:api).
 */

import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.playwright-investigation',
  'video-optimize',
);
mkdirSync(outDir, { recursive: true });

const pages = [
  {
    name: 'home',
    path: '/',
    expectSrc: /Palm-Swaying-optimized\.mp4/,
    expectPreload: 'metadata',
    deferUntilPlay: false,
  },
  {
    name: 'notch',
    path: '/casestudies/notch-financial/',
    expectSrc: /Payment-Portal-Jul3-optimized\.mp4/,
    expectPreload: 'none',
    deferUntilPlay: true,
  },
  {
    name: 'kepler-pipeline',
    path: '/casestudies/kepler-pipeline-builder/',
    expectSrc: /TylerWhite-KeplerTeaser-optimized\.mp4/,
    expectPreload: 'none',
    deferUntilPlay: true,
  },
];

const results = [];

async function auditPage(browser, pageDef, mobile = false) {
  const context = await browser.newContext(
    mobile ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 900 } },
  );
  const page = await context.newPage();
  const media = [];
  page.on('response', (res) => {
    const url = res.url();
    if (/\.mp4(\?|$)/i.test(url)) media.push({ url, status: res.status() });
  });

  const key = `${mobile ? 'mobile' : 'desktop'}-${pageDef.name}`;
  await page.goto(`${base}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const video = page.locator('video').first();
  const count = await video.count();
  const info =
    count > 0
      ? {
          src: await video.locator('source').first().getAttribute('src').catch(() => null),
          preload: await video.getAttribute('preload'),
          poster: await video.getAttribute('poster'),
          controls: await video.getAttribute('controls'),
          autoplay: await video.getAttribute('autoplay'),
          muted: await video.getAttribute('muted'),
        }
      : null;

  const legacyHits = media.filter(
    (m) =>
      /Payment-Portal-Jul3\.mp4|TylerWhite-KeplerTeaser\.mp4|712465_Palm-Swaying-Background/.test(
        m.url,
      ) && !/-optimized\.mp4/.test(m.url),
  );

  const pass =
    info &&
    pageDef.expectSrc.test(info.src || '') &&
    info.preload === pageDef.expectPreload &&
    legacyHits.length === 0 &&
    (!pageDef.deferUntilPlay || media.every((m) => !pageDef.expectSrc.test(m.url) || m.status === 200));

  results.push({
    key,
    pass,
    info,
    mediaRequests: media,
    legacyHits,
  });

  await context.close();
  return pass;
}

const browser = await chromium.launch({ headless: true });
let allPass = true;
for (const p of pages) {
  for (const mobile of [false, true]) {
    const ok = await auditPage(browser, p, mobile);
    allPass &&= ok;
    const r = results[results.length - 1];
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${r.key}`);
    if (!ok) console.log(JSON.stringify(r, null, 2));
  }
}
await browser.close();

writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ base, results }, null, 2));
process.exit(allPass ? 0 : 1);
