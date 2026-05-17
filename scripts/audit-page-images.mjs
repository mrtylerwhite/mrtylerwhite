#!/usr/bin/env node
/**
 * List raster images referenced on key pages, sorted by file size.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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

const urlRe =
  /(?:src|href)=["']([^"']+\.(?:png|jpe?g))["']|url\(([^)]+\.(?:png|jpe?g))[^)]*\)/gi;

function normalize(u) {
  let p = u.replace(/^https?:\/\/[^/]+/i, '').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  return p.split('?')[0];
}

const byPath = new Map();

for (const rel of pages) {
  const file = path.join(root, rel);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  let m;
  while ((m = urlRe.exec(html)) !== null) {
    const p = normalize(m[1] || m[2]);
    if (!byPath.has(p)) byPath.set(p, new Set());
    byPath.get(p).add(rel);
  }
}

function dims(abs) {
  const r = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', abs], {
    encoding: 'utf8',
  });
  if (r.status !== 0) return null;
  const w = /pixelWidth:\s*(\d+)/.exec(r.stdout)?.[1];
  const h = /pixelHeight:\s*(\d+)/.exec(r.stdout)?.[1];
  return w && h ? `${w}x${h}` : null;
}

const rows = [];
for (const [webPath, pageSet] of byPath) {
  const abs = path.join(root, webPath);
  if (!existsSync(abs)) continue;
  const st = statSync(abs);
  rows.push({
    path: webPath,
    kb: Math.round(st.size / 1024),
    dims: dims(abs),
    pages: [...pageSet],
  });
}

rows.sort((a, b) => b.kb - a.kb);

console.log('path\tkb\tdims\tpages');
for (const r of rows) {
  console.log(`${r.path}\t${r.kb}\t${r.dims || '?'}\t${r.pages.join(', ')}`);
}
console.log(`\nTotal: ${rows.length} files, ${Math.round(rows.reduce((s, r) => s + r.kb, 0))} KB`);
