#!/usr/bin/env node
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const pages = [
  { name: 'notch', path: '/casestudies/notch-financial/', h1: 'Solving Cash Flow' },
  { name: 'kepler-pipeline', path: '/casestudies/kepler-pipeline-builder/' },
  { name: 'kepler-prebuilt', path: '/casestudies/keplers-prebuilt-workflows/' },
  { name: 'verify', path: '/casestudies/the-innovation-of-verify/' },
  { name: 'case-studies-index', path: '/case-studies/', card: true },
  { name: 'home', path: '/', card: true },
];

const browser = await chromium.launch({ headless: true });
let ok = true;

for (const p of pages) {
  const page = await browser.newPage();
  await page.goto(`${base}${p.path}`, { waitUntil: 'domcontentloaded' });
  const heading = p.path === '/case-studies/' ? page.locator('h2').first() : page.locator('h1').first();
  const h1Transform = await heading.evaluate((el) => getComputedStyle(el).textTransform);
  const h1Text = await heading.innerText();
  const h1Pass = h1Transform === 'none' && h1Text === h1Text.replace(/[a-z]/g, (c) => c); // has lowercase if any in source
  const hasLower = /[a-z]/.test(h1Text);
  const pass = h1Transform === 'none' && hasLower;
  if (!pass) ok = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${p.name} h1 transform=${h1Transform} text="${h1Text.slice(0, 50)}..."`);

  if (p.card) {
    const cardTransform = await page
      .locator('.case-work h5, .case-work h6')
      .first()
      .evaluate((el) => getComputedStyle(el).textTransform)
      .catch(() => 'missing');
    const cardPass = cardTransform === 'uppercase';
    if (!cardPass) ok = false;
    console.log(`[${cardPass ? 'PASS' : 'FAIL'}] ${p.name} card title transform=${cardTransform}`);
  }
  await page.close();
}

await browser.close();
process.exit(ok ? 0 : 1);
