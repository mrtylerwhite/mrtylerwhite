#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'index.html',
  'case-studies/index.html',
  'casestudies/notch-financial/index.html',
  'casestudies/kepler-pipeline-builder/index.html',
  'casestudies/keplers-prebuilt-workflows/index.html',
  'casestudies/the-innovation-of-verify/index.html',
  'about/index.html',
];

const paths = new Set();
const raster = /\.(png|jpe?g)(\?|$)/i;

function add(raw, page) {
  if (!raw || !raster.test(raw)) return;
  let p = raw.replace(/^https?:\/\/[^/]+/i, '').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.split('?')[0];
  paths.add(p);
}

for (const rel of pages) {
  const file = path.join(root, rel);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) add(m[1], rel);
  for (const m of html.matchAll(/url\(([^)]+)\)/gi)) {
    const u = m[1].replace(/["']/g, '').trim();
    add(u, rel);
  }
  for (const m of html.matchAll(/\ssrcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      add(part.trim().split(/\s+/)[0], rel);
    }
  }
}

const list = [...paths]
  .map((p) => {
    const abs = path.join(root, p);
    if (!existsSync(abs)) return null;
    return { p, size: statSync(abs).size };
  })
  .filter(Boolean)
  .sort((a, b) => b.size - a.size);

console.log(JSON.stringify(list, null, 2));
