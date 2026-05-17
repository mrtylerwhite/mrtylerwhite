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
  'hero-video-fix',
);
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '1280', width: 1280, height: 900, expectVideo: true },
  { name: '1024', width: 1024, height: 768, expectVideo: true },
  { name: '768', width: 768, height: 1024, expectVideo: true },
  { name: '430', width: 430, height: 932, expectVideo: false },
  { name: '390', width: 390, height: 844, expectVideo: false },
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
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => {
    const section = document.querySelector('.hero-cntn.et_pb_section_video');
    const video = section?.querySelector('video');
    const wrap = section?.querySelector('.et_pb_section_video_bg');
    const wrapStyle = wrap ? getComputedStyle(wrap) : null;
    return {
      src: video?.querySelector('source')?.getAttribute('src') || '',
      preload: video?.getAttribute('preload') || '',
      wrapDisplay: wrapStyle?.display,
      videoVisible: video ? video.offsetWidth > 0 && video.offsetHeight > 0 : false,
      playing: video ? !video.paused && video.readyState >= 2 : false,
      currentTime: video?.currentTime || 0,
    };
  });

  const legacy = media.some((u) => /712465_Palm-Swaying-Background/.test(u) && !/-optimized/.test(u));
  const optimized = media.some((u) => /Palm-Swaying-optimized/.test(u));
  const videoOk = vp.expectVideo
    ? state.wrapDisplay !== 'none' && (state.playing || state.currentTime > 0 || optimized)
    : state.wrapDisplay === 'none' || !state.videoVisible;

  const pass =
    videoOk &&
    !legacy &&
    state.src.includes('Palm-Swaying-optimized.mp4') &&
    state.preload === 'metadata';

  if (!pass) ok = false;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${vp.name}px video=${state.playing} wrap=${state.wrapDisplay} legacy=${legacy} optimizedReq=${optimized}`,
  );

  await page.screenshot({ path: path.join(outDir, `home-hero-${vp.name}.png`), fullPage: false });
  await page.close();
}

await browser.close();
process.exit(ok ? 0 : 1);
