#!/usr/bin/env node
/**
 * Encode WebP siblings for raster images referenced on key pages.
 * Requires cwebp (brew install webp).
 */

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwebp = process.env.CWEBP || 'cwebp';
const minBytes = 8 * 1024;
const maxWidth = 1920;

if (spawnSync(cwebp, ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('cwebp not found. Install: brew install webp');
  process.exit(1);
}

const list = JSON.parse(
  readFileSync(path.join(root, 'scripts/.image-optimize-list.json'), 'utf8'),
);

function widthOf(abs) {
  const r = spawnSync('sips', ['-g', 'pixelWidth', abs], { encoding: 'utf8' });
  const m = /pixelWidth:\s*(\d+)/.exec(r.stdout || '');
  return m ? Number(m[1]) : 0;
}

function qualityFor(abs) {
  return /\.jpe?g$/i.test(abs) ? 78 : 82;
}

const manifest = [];

for (const { p } of list) {
  const abs = path.join(root, p);
  if (!existsSync(abs)) continue;
  const origSize = statSync(abs).size;
  if (origSize < minBytes) continue;

  const webpPath = p.replace(/\.(png|jpe?g)$/i, '.webp');
  const webpAbs = path.join(root, webpPath);
  const q = qualityFor(abs);
  const w = widthOf(abs);
  const args = ['-q', String(q), '-m', '6'];
  if (w > maxWidth) args.push('-resize', String(maxWidth), '0');
  args.push(abs, '-o', webpAbs);

  const r = spawnSync(cwebp, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error('Failed', p, r.stderr);
    process.exit(1);
  }
  const webpSize = statSync(webpAbs).size;
  manifest.push({
    path: p,
    webp: webpPath,
    originalBytes: origSize,
    webpBytes: webpSize,
    savedBytes: origSize - webpSize,
    quality: q,
    resized: w > maxWidth,
  });
  console.log(
    `${path.basename(p)}: ${Math.round(origSize / 1024)}KB -> ${Math.round(webpSize / 1024)}KB`,
  );
}

writeFileSync(
  path.join(root, 'scripts/.image-optimize-manifest.json'),
  JSON.stringify(manifest, null, 2),
);
const saved = manifest.reduce((s, m) => s + m.savedBytes, 0);
console.log(`\n${manifest.length} WebP files. Saved ~${Math.round(saved / 1024)} KB vs originals.`);
