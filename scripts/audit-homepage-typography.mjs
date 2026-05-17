#!/usr/bin/env node
/**
 * Audit homepage heading computed styles at multiple viewports.
 * Usage: node scripts/audit-homepage-typography.mjs [--out label]
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const label = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'audit';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.playwright-investigation', 'home-typography', label);
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '430', width: 430, height: 932 },
  { name: '390', width: 390, height: 844 },
];

const targets = [
  {
    role: 'A-hero-h1',
    label: 'Designers who understand business',
    selector: '.hero-cntn .et_pb_text_0 h1',
  },
  {
    role: 'B-quick-note',
    label: 'A quick note before you scroll',
    selector: '.et_pb_text_2 h3',
  },
  {
    role: 'C-large-card-notch',
    label: 'Automation shipped',
    selector: '.card-kepler.card-notch h5',
  },
  {
    role: 'C-large-card-kepler',
    label: 'Machine learning existed',
    selector: '.card-kepler.card-kepler-hm h5',
  },
  {
    role: 'D-small-card-verify',
    label: 'Document review',
    selector: '.card-side-by-side3 h6, .card-side-by-side.card-side-by-side3 h6',
  },
  {
    role: 'D-small-card-pipeline',
    label: 'drag-and-drop machine learning',
    selector: '.card-side-by-side .et_pb_text_inner h6',
    pick: 'pipeline',
  },
  {
    role: 'B-mentorship',
    label: 'ROI of investing in design mentorship',
    selector: '.et_pb_text_7 h3',
  },
  {
    role: 'B-growth-system',
    label: 'Design as a growth system',
    selector: '.et_pb_text_8 h3',
  },
];

function readStyles(el) {
  if (!el) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const lineHeightPx = parseFloat(s.lineHeight);
  const fontSizePx = parseFloat(s.fontSize);
  const lines =
    lineHeightPx > 0 && fontSizePx > 0
      ? Math.max(1, Math.round(r.height / lineHeightPx))
      : null;
  return {
    selector: el.dataset.auditSelector || '',
    text: (el.innerText || '').trim().slice(0, 80),
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    fontWeight: s.fontWeight,
    letterSpacing: s.letterSpacing,
    textTransform: s.textTransform,
    fontFamily: s.fontFamily.split(',')[0],
    marginBottom: s.marginBottom,
    textShadow: s.textShadow,
    width: Math.round(r.width),
    lines,
  };
}

const report = { label, viewports: {} };
const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);

  const vpReport = {};

  for (const t of targets) {
    let el = null;
    if (t.pick === 'pipeline') {
      el = await page
        .locator('h6')
        .filter({ hasText: /drag-and-drop machine learning/i })
        .first()
        .elementHandle()
        .catch(() => null);
    } else {
      el = await page.locator(t.selector).first().elementHandle().catch(() => null);
    }
    if (el) {
      await page.evaluate(
        ({ sel }) => {
          const node = document.querySelector(sel.split(',')[0].trim());
          if (node) node.dataset.auditSelector = sel;
        },
        { sel: t.selector },
      );
    }
    const styles = await page.evaluate((sel) => {
      let node;
      if (sel.includes('pipeline')) {
        node = [...document.querySelectorAll('h6')].find((n) =>
          /drag-and-drop machine learning/i.test(n.innerText),
        );
      } else {
        node = document.querySelector(sel.split(',')[0].trim());
      }
      if (!node) return null;
      const s = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      const lineHeightPx = parseFloat(s.lineHeight);
      const fontSizePx = parseFloat(s.fontSize);
      return {
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        fontFamily: s.fontFamily.split(',')[0].replace(/"/g, ''),
        marginBottom: s.marginBottom,
        textShadow: s.textShadow,
        width: Math.round(r.width),
        lines:
          lineHeightPx > 0 && fontSizePx > 0
            ? Math.max(1, Math.round(r.height / lineHeightPx))
            : null,
        text: node.innerText.trim().slice(0, 80),
      };
    }, t.selector);

    vpReport[t.role] = { ...t, computed: styles };
  }

  report.viewports[vp.name] = vpReport;
  await page.screenshot({ path: path.join(outDir, `home-${vp.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();

writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

for (const vp of ['1280']) {
  console.log(`\n=== ${label} @ ${vp}px ===`);
  const data = report.viewports[vp];
  if (!data) continue;
  for (const [role, entry] of Object.entries(data)) {
    const c = entry.computed;
    if (!c) {
      console.log(`${role}: NOT FOUND`);
      continue;
    }
    console.log(
      `${role} | ${c.fontSize} | lh ${c.lineHeight} | w ${c.fontWeight} | ls ${c.letterSpacing} | ${c.textTransform} | mb ${c.marginBottom} | ${c.width}px ~${c.lines} lines`,
    );
  }
}
