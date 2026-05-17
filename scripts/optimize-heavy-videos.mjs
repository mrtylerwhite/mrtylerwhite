#!/usr/bin/env node
/**
 * Re-encode heavy site videos with ffmpeg (requires ffmpeg on PATH).
 * Originals are kept; outputs use *-optimized.mp4 naming beside sources.
 *
 * Usage: node scripts/optimize-heavy-videos.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploads = path.join(root, 'wp-content/uploads');

const jobs = [
  {
    label: 'Notch Payment Portal',
    in: path.join(uploads, '2024/08/Payment-Portal-Jul3.mp4'),
    out: path.join(uploads, '2024/08/Payment-Portal-Jul3-optimized.mp4'),
    args: [
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '28',
      '-movflags', '+faststart', '-an',
    ],
  },
  {
    label: 'Kepler teaser',
    in: path.join(uploads, '2022/11/TylerWhite-KeplerTeaser.mp4'),
    out: path.join(uploads, '2022/11/TylerWhite-KeplerTeaser-optimized.mp4'),
    args: [
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '28',
      '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k',
    ],
  },
  {
    label: 'Homepage palm hero',
    in: path.join(
      uploads,
      '2025/12/712465_Palm-Swaying-Background-Tranquil_By_Omri_Ohana_Artlist_HD.mp4',
    ),
    out: path.join(uploads, '2025/12/Palm-Swaying-optimized.mp4'),
    args: [
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '32',
      '-movflags', '+faststart', '-an',
    ],
  },
];

const poster = path.join(uploads, '2025/12/Palm-Swaying-poster.jpg');
const palmSrc = path.join(
  uploads,
  '2025/12/712465_Palm-Swaying-Background-Tranquil_By_Omri_Ohana_Artlist_HD.mp4',
);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('ffmpeg not found on PATH');
  process.exit(1);
}

for (const job of jobs) {
  if (!existsSync(job.in)) {
    console.error('Missing input:', job.in);
    process.exit(1);
  }
  console.log(`\n==> ${job.label}`);
  run('ffmpeg', ['-y', '-i', job.in, ...job.args, job.out]);
}

if (existsSync(palmSrc) && !existsSync(poster)) {
  console.log('\n==> Palm hero poster frame');
  run('ffmpeg', [
    '-y', '-i', palmSrc, '-ss', '00:00:01', '-vframes', '1', '-q:v', '3',
    '-update', '1', poster,
  ]);
}

console.log('\nDone. Update HTML src attributes to *-optimized.mp4 files.');
