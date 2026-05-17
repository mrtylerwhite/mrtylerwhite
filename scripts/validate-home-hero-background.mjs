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
  'hero-background-fix',
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
  page.on('response', (res) => {
    const u = res.url();
    if (/\.mp4(\?|$)/i.test(u)) media.push(u);
  });

  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => {
    const section = document.querySelector('.hero-cntn.et_pb_section_0');
    const video = section?.querySelector('video');
    const videoWrap = section?.querySelector('.et_pb_section_video_bg');
    const afterStyle = section ? getComputedStyle(section, '::after') : null;
    return {
      hasVideo: !!video,
      hasVideoWrap: !!videoWrap,
      posterBg: afterStyle?.backgroundImage || '',
    };
  });

  const legacy = media.some((u) => /712465_Palm-Swaying-Background/.test(u));
  const palmMp4 = media.some((u) => /Palm-Swaying.*\.mp4/i.test(u));
  const posterRequested = media.some((u) => /Palm-Swaying-poster\.jpg/i.test(u));

  const pass =
    !state.hasVideo &&
    !state.hasVideoWrap &&
    state.posterBg.includes('Palm-Swaying-poster.jpg') &&
    !legacy &&
    !palmMp4;

  if (!pass) ok = false;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${vp.name}px video=${state.hasVideo} palmMp4=${palmMp4} posterBg=${state.posterBg.includes('poster')}`,
  );

  await page.screenshot({ path: path.join(outDir, `home-hero-${vp.name}.png`), fullPage: false });
  await page.close();
}

await browser.close();
process.exit(ok ? 0 : 1);
