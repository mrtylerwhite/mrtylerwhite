#!/usr/bin/env node
/**
 * Point key page HTML/CSS at WebP via <picture> and background URLs.
 * Keeps PNG/JPG on <img> as fallback; WebP in <source> and CSS backgrounds.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(root, 'scripts/.image-optimize-manifest.json'), 'utf8'),
);

const webpByOrig = new Map(manifest.map((m) => [m.path, m.webp]));

const pages = [
  'index.html',
  'case-studies/index.html',
  'casestudies/notch-financial/index.html',
  'casestudies/kepler-pipeline-builder/index.html',
  'casestudies/keplers-prebuilt-workflows/index.html',
  'casestudies/the-innovation-of-verify/index.html',
  'about/index.html',
];

const extraCss = ['wp-content/et-cache/global/et-divi-customizer-global.min.css'];

function normalize(u) {
  let p = u.replace(/^https?:\/\/[^/]+/i, '').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  return p.split('?')[0];
}

function toWebpPath(u) {
  const abs = normalize(u);
  if (webpByOrig.has(abs)) return webpByOrig.get(abs);
  if (/\.(png|jpe?g)$/i.test(abs)) {
    const guess = abs.replace(/\.(png|jpe?g)$/i, '.webp');
    if (existsSync(path.join(root, guess))) return guess;
  }
  return null;
}

function webpSrcset(srcset) {
  return srcset
    .split(',')
    .map((part) => {
      const bits = part.trim().split(/\s+/);
      const url = bits[0];
      const w = bits[1] || '';
      const webp = toWebpPath(url);
      if (!webp) return part.trim();
      const out = webp.startsWith('/') ? webp : `/${webp}`;
      return w ? `${out} ${w}` : out;
    })
    .join(', ');
}

function replaceBackgroundUrls(html) {
  return html.replace(/url\(([^)]+)\)/gi, (full, inner) => {
    const raw = inner.replace(/["']/g, '').trim();
    const webp = toWebpPath(raw);
    if (!webp) return full;
    return `url(${webp})`;
  });
}

function wrapImages(html) {
  return html.replace(/<img\s+([^>]*?)\/?>/gi, (full, attrs) => {
    if (!/\bsrc=["'][^"']+\.(?:png|jpe?g)/i.test(attrs)) return full;
    const srcM = /\bsrc=["']([^"']+)["']/i.exec(attrs);
    const webp = toWebpPath(srcM[1]);
    if (!webp) return full;

    const srcsetM = /\bsrcset=["']([^"']+)["']/i.exec(attrs);
    const sizesM = /\bsizes=["']([^"']+)["']/i.exec(attrs);
    const webpSet = srcsetM ? webpSrcset(srcsetM[1]) : webp;
    const sizes = sizesM ? ` sizes="${sizesM[1]}"` : '';
    const source = `<source type="image/webp" srcset="${webpSet}"${sizes}>`;
    return `<picture>${source}<img ${attrs}></picture>`;
  });
}

let changed = 0;
for (const rel of [...pages, ...extraCss]) {
  const file = path.join(root, rel);
  if (!existsSync(file)) continue;
  const before = readFileSync(file, 'utf8');
  let after = replaceBackgroundUrls(before);
  if (rel.endsWith('.html')) after = wrapImages(after);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
    console.log('updated', rel);
  }
}

console.log(`\n${changed} files updated.`);
