#!/usr/bin/env node
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.playwright-investigation',
  'image-optimize',
);
mkdirSync(outDir, { recursive: true });

const pages = [
  { name: 'home', path: '/' },
  { name: 'case-studies', path: '/case-studies/' },
  { name: 'notch', path: '/casestudies/notch-financial/' },
  { name: 'kepler-pipeline', path: '/casestudies/kepler-pipeline-builder/' },
  { name: 'verify', path: '/casestudies/the-innovation-of-verify/' },
];

const results = [];
const browser = await chromium.launch({ headless: true });

for (const p of pages) {
  const page = await browser.newPage();
  const raster = [];
  const broken = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\.(png|jpe?g|webp)(\?|$)/i.test(url)) return;
    raster.push({ url, status: res.status(), type: url.split('.').pop().split('?')[0] });
    if (res.status() >= 400) broken.push(url);
  });
  await page.goto(`${base}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  const imgs = await page.locator('img').evaluateAll((nodes) =>
    nodes.map((n) => ({
      src: n.currentSrc || n.src,
      w: n.naturalWidth,
      h: n.naturalHeight,
      loading: n.loading,
    })),
  );
  const zero = imgs.filter((i) => i.w === 0 && i.src && !i.src.endsWith('.svg'));
  results.push({ ...p, rasterCount: raster.length, webp: raster.filter((r) => r.type === 'webp').length, broken, zero });
  console.log(
    `[${broken.length || zero.length ? 'FAIL' : 'PASS'}] ${p.name} webp=${raster.filter((r) => r.type === 'webp').length} raster=${raster.length} broken=${broken.length} zeroDim=${zero.length}`,
  );
  await page.close();
}

await browser.close();
writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
process.exit(results.some((r) => r.broken.length || r.zero.length) ? 1 : 0);
