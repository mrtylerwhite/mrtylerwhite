#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.playwright-investigation',
  'homepage-visual-fix',
);
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '430', width: 430, height: 932 },
  { name: '390', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
let ok = true;

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const media = [];
  page.on('response', (r) => {
    if (/\.mp4/i.test(r.url())) media.push(r.url());
  });

  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  const checks = await page.evaluate(() => {
    const cta = document.querySelector('.case-work a.text-button.brand-link');
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    const eyebrow = document.querySelector('.hero-cntn .ds-eyebrow');
    const eyebrowStyle = eyebrow ? getComputedStyle(eyebrow) : null;
    const heroSection = document.querySelector('.hero-cntn.et_pb_section_0');
    const heroVideo = heroSection?.querySelector('video');
    const heroAfterBg = heroSection
      ? getComputedStyle(heroSection, '::after').backgroundImage
      : '';
    const cardTitle = document.querySelector('.case-work h5');
    return {
      ctaTextDecoration: ctaStyle?.textDecorationLine,
      ctaBorderRadius: ctaStyle?.borderRadius,
      ctaMinHeight: cta ? cta.offsetHeight : 0,
      eyebrowColor: eyebrowStyle?.color,
      eyebrowTransform: eyebrowStyle?.textTransform,
      eyebrowWeight: eyebrowStyle?.fontWeight,
      heroHasVideo: !!heroVideo,
      heroPosterBg: heroAfterBg.includes('Palm-Swaying-poster.jpg'),
      cardTransform: cardTitle ? getComputedStyle(cardTitle).textTransform : null,
      cardLetterSpacing: cardTitle ? getComputedStyle(cardTitle).letterSpacing : null,
    };
  });

  const legacy = media.some((u) => /712465_Palm-Swaying-Background/.test(u));
  const palmMp4 = media.some((u) => /Palm-Swaying.*\.mp4/i.test(u));
  const pass =
    checks.ctaTextDecoration === 'none' &&
    parseFloat(checks.ctaBorderRadius) >= 20 &&
    checks.ctaMinHeight >= 40 &&
    checks.eyebrowTransform === 'none' &&
    parseInt(checks.eyebrowWeight, 10) <= 500 &&
    checks.cardTransform === 'none' &&
    !legacy &&
    !palmMp4 &&
    !checks.heroHasVideo &&
    checks.heroPosterBg;

  if (!pass) ok = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${vp.name}px`, checks, legacy ? 'LEGACY_VIDEO' : '');

  await page.screenshot({ path: path.join(outDir, `home-${vp.name}.png`) });
  await page.locator('.case-work').first().scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: path.join(outDir, `cards-${vp.name}.png`) });
  await page.close();
}

await browser.close();
process.exit(ok ? 0 : 1);
