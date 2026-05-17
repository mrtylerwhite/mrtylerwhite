#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const video = path.join(
  root,
  'wp-content/uploads/2024/08/Payment-Portal-Jul3-optimized.mp4',
);
const base = process.env.BASE_URL || 'http://127.0.0.1:4321';

const probe = spawnSync(
  'ffprobe',
  ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', video],
  { encoding: 'utf8' },
);
const hasAudio = probe.stdout.trim() === 'aac';
console.log(`[${hasAudio ? 'PASS' : 'FAIL'}] ffprobe audio stream: ${probe.stdout.trim() || 'none'}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const media = [];
page.on('response', (res) => {
  if (/Payment-Portal-Jul3.*\.mp4/.test(res.url())) {
    media.push({ url: res.url(), status: res.status() });
  }
});

await page.goto(`${base}/casestudies/notch-financial/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const preload = await page.locator('video').first().getAttribute('preload');
const src = await page.locator('video source').first().getAttribute('src');
const earlyFetch = media.some((m) => m.url.includes('-optimized.mp4'));

console.log(`[${preload === 'none' ? 'PASS' : 'FAIL'}] preload="${preload}"`);
console.log(`[${src?.includes('-optimized.mp4') ? 'PASS' : 'FAIL'}] src=${src}`);
console.log(`[${!earlyFetch ? 'PASS' : 'FAIL'}] no optimized mp4 on initial load`);

await page.locator('video').first().click();
await page.waitForTimeout(500);
const hasAudioTrack = await page.locator('video').first().evaluate((v) => {
  const tracks = v.audioTracks;
  if (tracks && tracks.length > 0) return tracks.length > 0;
  return v.mozHasAudio === true || Boolean(v.webkitAudioDecodedByteCount) || (v.duration > 0 && !v.muted);
});
// More reliable: check audioTracks or decoded bytes after play
const audioInfo = await page.locator('video').first().evaluate(async (v) => {
  try {
    await v.play();
  } catch {
    /* user gesture simulated via click */
  }
  await new Promise((r) => setTimeout(r, 300));
  return {
    muted: v.muted,
    volume: v.volume,
    audioTracks: v.audioTracks?.length ?? null,
    webkitBytes: v.webkitAudioDecodedByteCount || 0,
  };
});
const browserAudio =
  audioInfo.audioTracks > 0 || audioInfo.webkitBytes > 0 || !audioInfo.muted;
console.log(`[${browserAudio ? 'PASS' : 'FAIL'}] browser audio signals`, audioInfo);

await browser.close();
process.exit(hasAudio && preload === 'none' && src?.includes('-optimized') && browserAudio ? 0 : 1);
