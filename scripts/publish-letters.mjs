/**
 * publish-letters.mjs
 *
 * Pulls completed broadcasts from Kit, strips email HTML,
 * and publishes them as static /letters/[slug]/index.html pages.
 * Also regenerates /letters/index.html and updates page-sitemap.xml.
 *
 * Usage:
 *   node scripts/publish-letters.mjs           # publish all new letters
 *   node scripts/publish-letters.mjs --dry-run # preview without writing
 *   node scripts/publish-letters.mjs --force   # re-publish all (overwrite)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY   = process.env.KIT_API_KEY || readEnv('KIT_API_KEY');
const BASE_URL  = 'https://www.mrtylerwhite.com';
const DRY_RUN   = process.argv.includes('--dry-run');
const FORCE     = process.argv.includes('--force');
const MANIFEST  = path.join(ROOT, 'letters', '.manifest.json');

if (!API_KEY) {
  console.error('❌  KIT_API_KEY not found in .env');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readEnv(key) {
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : null;
  } catch { return null; }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function readManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
  catch { return {}; }
}

function writeManifest(data) {
  if (DRY_RUN) return;
  fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function isoDate(iso) {
  return new Date(iso).toISOString().split('T')[0];
}

// ── Kit API ───────────────────────────────────────────────────────────────────
async function fetchBroadcasts() {
  const broadcasts = [];
  let cursor = null;

  console.log('📬  Fetching broadcasts from Kit…');

  while (true) {
    const params = new URLSearchParams({ status: 'completed', per_page: '100' });
    if (cursor) params.set('after', cursor);

    const res = await fetch(`https://api.kit.com/v4/broadcasts?${params}`, {
      headers: { 'X-Kit-Api-Key': API_KEY, 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Kit API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    broadcasts.push(...(data.broadcasts || []));

    if (data.pagination?.has_next_page) {
      cursor = data.pagination.end_cursor;
    } else {
      break;
    }
  }

  console.log(`   Found ${broadcasts.length} completed broadcasts`);
  return broadcasts;
}

async function fetchBroadcastContent(id) {
  const res = await fetch(`https://api.kit.com/v4/broadcasts/${id}`, {
    headers: { 'X-Kit-Api-Key': API_KEY, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Kit API error for broadcast ${id}`);
  const data = await res.json();
  return data.broadcast;
}

// ── HTML extraction ───────────────────────────────────────────────────────────
function extractContent(emailHtml) {
  const root = parse(emailHtml);

  // Remove Kit footer (unsubscribe section)
  root.querySelectorAll('.ck-hide-in-public-posts').forEach(el => el.remove());

  // Remove signature block (table with avatar image)
  root.querySelectorAll('table[role="presentation"]').forEach(el => el.remove());

  // Find the main content wrapper
  const inner = root.querySelector('.ck-inner-section');
  if (!inner) return null;

  // Get the inner content div
  const contentDiv = inner.querySelector('div');
  if (!contentDiv) return null;

  // Extract the title (first h2)
  const h2 = contentDiv.querySelector('h2');
  const title = h2 ? h2.text.trim() : null;
  if (h2) h2.remove(); // we'll render title separately

  // Strip all inline styles and Kit-specific attrs from remaining elements
  const clean = stripStyles(contentDiv.innerHTML);

  return { title, html: clean };
}

function stripStyles(html) {
  return html
    // Remove inline style attributes
    .replace(/\s+style="[^"]*"/g, '')
    // Remove class attributes (Kit-specific)
    .replace(/\s+class="[^"]*"/g, '')
    // Remove font-family spans
    .replace(/<span\s*>/gi, '')
    .replace(/<\/span>/gi, '')
    // Fix Kit link color override — rewrite Kit amber links to inherit
    .replace(/style="color:#c59060"/g, '')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Page generation ───────────────────────────────────────────────────────────
function letterPage({ title, subject, html, publishedAt, slug, kitUrl }) {
  const canonical = `${BASE_URL}/letters/${slug}/`;
  const date = formatDate(publishedAt);
  const isoPublished = new Date(publishedAt).toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title} | Tyler White</title>
  <meta name="description" content="${subject}" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title} | Tyler White" />
  <meta property="og:description" content="${subject}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Mr. Tyler White" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title} | Tyler White" />
  <meta name="twitter:description" content="${subject}" />
  <meta name="twitter:site" content="@mrtylerwhite" />

  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "datePublished": isoPublished,
    "author": { "@type": "Person", "name": "Tyler White", "url": BASE_URL },
    "publisher": { "@type": "Person", "name": "Tyler White", "url": BASE_URL },
    "url": canonical,
    "mainEntityOfPage": canonical,
  })}</script>

  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-32x32.png" sizes="32x32" />
  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-192x192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-180x180.png" />

  <link rel="preload" href="/assets/fonts/instrument-serif/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/css/dist/critical.css" />
  <link rel="stylesheet" href="/assets/css/system/pages/letters.css" />
  <link rel="stylesheet" href="/assets/css/system/site-footer.css" />
</head>
<body class="letter-page">

  <div class="pr-bar" role="banner">
    <div class="pr-bar__inner">
      <a href="/" class="pr-bar__wordmark" aria-label="Back to mrtylerwhite.com">
        <img src="/wp-content/uploads/2025/12/logo-mrtylerwhite-1.svg" width="69" height="20" alt="Mr. Tyler White" />
      </a>
      <a href="/newsletter/" class="pr-bar__cta">Get the newsletter</a>
    </div>
  </div>

  <main class="letter-main">
    <article class="letter-article" itemscope itemtype="https://schema.org/Article">
      <header class="letter-header">
        <p class="letter-meta">
          <a href="/letters/" class="letter-back">Letters</a>
          <span aria-hidden="true">·</span>
          <time datetime="${isoPublished}" itemprop="datePublished">${date}</time>
        </p>
        <h1 class="letter-title" itemprop="headline">${title}</h1>
      </header>

      <div class="letter-body" itemprop="articleBody">
        ${html}
      </div>

      <footer class="letter-footer">
        <div class="letter-author">
          <img
            src="https://embed.filekitcdn.com/e/eABnbrLaps2hZ7PwXP8JhN/hMXJ7BvjaZGMijEBdB2qnC/email"
            alt="Tyler White"
            width="56"
            height="56"
            class="letter-author__avatar"
            loading="lazy"
          />
          <div>
            <p class="letter-author__name">Tyler White</p>
            <p class="letter-author__bio">Helping designers prove the ROI of their decisions.</p>
          </div>
        </div>
        <div class="letter-cta">
          <p class="letter-cta__text">Get letters like this every week.</p>
          <a href="/newsletter/" class="letter-cta__btn">Subscribe free →</a>
        </div>
      </footer>
    </article>
  </main>

  <footer class="site-footer" role="contentinfo" data-nav-theme="dark">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img class="site-footer__wordmark" src="/wp-content/uploads/2025/12/logo-mrtylerwhite-1.svg" width="69" height="20" alt="Mr. Tyler White" />
        <p class="site-footer__tagline">Product design, growth systems, and prototypes that help teams make better decisions.</p>
      </div>
      <nav class="site-footer__col" aria-label="Explore">
        <span class="site-footer__col-heading">Explore</span>
        <a href="/about/">About Me</a>
        <a href="/case-studies/">Case Studies</a>
        <a href="/newsletter/">Newsletter</a>
        <a href="https://www.designtablepodcast.com/" target="_blank" rel="noopener noreferrer">Podcast</a>
        <a href="/prototype-ready/">Builder Kickoff™</a>
      </nav>
      <nav class="site-footer__col" aria-label="Resources">
        <span class="site-footer__col-heading">Resources</span>
        <a href="/wp-content/uploads/2024/08/TylerWhite-Resume-2024.pdf" target="_blank" rel="noopener noreferrer">Download CV</a>
        <a href="https://www.linkedin.com/in/mrtylerwhite/" target="_blank" rel="noopener noreferrer">Let&#8217;s Connect</a>
        <a href="https://www.designtablepodcast.com/" target="_blank" rel="noopener noreferrer">The Design Table</a>
        <a href="/roi-case-study-template/">Free Case Study Auditor</a>
      </nav>
      <div class="site-footer__cta-block">
        <span class="site-footer__col-heading">Free Strategy Call</span>
        <p class="site-footer__cta-copy">Want help turning messy product, growth, or design problems into a clearer plan? Book a 30-minute call and we&#8217;ll figure out where the biggest leverage is.</p>
        <a href="https://cal.com/mrtylerwhite/30min" class="site-footer__cta-btn">Book a free strategy call</a>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p class="site-footer__copy">&#169; 2026 Tyler White. Made with taste, caffeine, and a suspicious number of prototypes.</p>
      <nav class="site-footer__legal" aria-label="Legal">
        <a href="/privacy-policy/">Privacy Policy</a>
      </nav>
    </div>
  </footer>

  <script src="/assets/js/gtm-defer.js" defer></script>
  <script src="/assets/js/analytics.js" defer></script>

</body>
</html>`;
}

function lettersIndex(letters) {
  const items = letters
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map(({ title, subject, slug, publishedAt }) => `
    <li class="letters-list__item">
      <a href="/letters/${slug}/" class="letters-list__link">
        <time class="letters-list__date" datetime="${new Date(publishedAt).toISOString()}">${formatDate(publishedAt)}</time>
        <h2 class="letters-list__title">${title}</h2>
        <p class="letters-list__preview">${subject}</p>
      </a>
    </li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Letters | Tyler White</title>
  <meta name="description" content="Weekly letters on product design, ROI of design decisions, and building systems that help designers influence strategy." />
  <link rel="canonical" href="${BASE_URL}/letters/" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="Letters | Tyler White" />
  <meta property="og:description" content="Weekly letters on product design, ROI of design decisions, and building systems that help designers influence strategy." />
  <meta property="og:url" content="${BASE_URL}/letters/" />
  <meta property="og:site_name" content="Mr. Tyler White" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@mrtylerwhite" />

  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-32x32.png" sizes="32x32" />
  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-192x192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-180x180.png" />

  <link rel="preload" href="/assets/fonts/instrument-serif/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/css/dist/critical.css" />
  <link rel="stylesheet" href="/assets/css/system/pages/letters.css" />
  <link rel="stylesheet" href="/assets/css/system/site-footer.css" />
</head>
<body class="letters-index">

  <div class="pr-bar" role="banner">
    <div class="pr-bar__inner">
      <a href="/" class="pr-bar__wordmark" aria-label="Back to mrtylerwhite.com">
        <img src="/wp-content/uploads/2025/12/logo-mrtylerwhite-1.svg" width="69" height="20" alt="Mr. Tyler White" />
      </a>
      <a href="/newsletter/" class="pr-bar__cta">Get the newsletter</a>
    </div>
  </div>

  <main class="letters-main">
    <header class="letters-hero">
      <p class="rcst-eyebrow">From the newsletter</p>
      <h1 class="letters-hero__title">Letters</h1>
      <p class="letters-hero__sub">Weekly writing on product design, ROI of design decisions, and what it takes to influence strategy as a designer.</p>
      <a href="/newsletter/" class="letters-hero__cta">Subscribe free →</a>
    </header>

    <section class="letters-list-section">
      <ol class="letters-list" reversed>
        ${items}
      </ol>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo" data-nav-theme="dark">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img class="site-footer__wordmark" src="/wp-content/uploads/2025/12/logo-mrtylerwhite-1.svg" width="69" height="20" alt="Mr. Tyler White" />
        <p class="site-footer__tagline">Product design, growth systems, and prototypes that help teams make better decisions.</p>
      </div>
      <nav class="site-footer__col" aria-label="Explore">
        <span class="site-footer__col-heading">Explore</span>
        <a href="/about/">About Me</a>
        <a href="/case-studies/">Case Studies</a>
        <a href="/newsletter/">Newsletter</a>
        <a href="https://www.designtablepodcast.com/" target="_blank" rel="noopener noreferrer">Podcast</a>
        <a href="/prototype-ready/">Builder Kickoff™</a>
      </nav>
      <nav class="site-footer__col" aria-label="Resources">
        <span class="site-footer__col-heading">Resources</span>
        <a href="/wp-content/uploads/2024/08/TylerWhite-Resume-2024.pdf" target="_blank" rel="noopener noreferrer">Download CV</a>
        <a href="https://www.linkedin.com/in/mrtylerwhite/" target="_blank" rel="noopener noreferrer">Let&#8217;s Connect</a>
        <a href="https://www.designtablepodcast.com/" target="_blank" rel="noopener noreferrer">The Design Table</a>
        <a href="/roi-case-study-template/">Free Case Study Auditor</a>
      </nav>
      <div class="site-footer__cta-block">
        <span class="site-footer__col-heading">Free Strategy Call</span>
        <p class="site-footer__cta-copy">Want help turning messy product, growth, or design problems into a clearer plan? Book a 30-minute call and we&#8217;ll figure out where the biggest leverage is.</p>
        <a href="https://cal.com/mrtylerwhite/30min" class="site-footer__cta-btn">Book a free strategy call</a>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p class="site-footer__copy">&#169; 2026 Tyler White. Made with taste, caffeine, and a suspicious number of prototypes.</p>
      <nav class="site-footer__legal" aria-label="Legal">
        <a href="/privacy-policy/">Privacy Policy</a>
      </nav>
    </div>
  </footer>

  <script src="/assets/js/gtm-defer.js" defer></script>
  <script src="/assets/js/analytics.js" defer></script>

</body>
</html>`;
}

// ── Sitemap update ────────────────────────────────────────────────────────────
function updateSitemap(letters) {
  const sitemapPath = path.join(ROOT, 'page-sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');

  // Remove existing letter entries so we rebuild clean
  sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/www\.mrtylerwhite\.com\/letters\/[^<]*<\/loc>[^<]*<lastmod>[^<]*<\/lastmod>\s*<\/url>/g, '');

  // Build new entries
  const entries = letters
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map(({ slug, publishedAt }) =>
      `\t<url>\n\t\t<loc>${BASE_URL}/letters/${slug}/</loc>\n\t\t<lastmod>${new Date(publishedAt).toISOString()}</lastmod>\n\t</url>`
    ).join('\n');

  // Also ensure /letters/ index is present
  const indexEntry = `\t<url>\n\t\t<loc>${BASE_URL}/letters/</loc>\n\t\t<lastmod>${new Date().toISOString()}</lastmod>\n\t</url>`;

  // Insert before </urlset>
  sitemap = sitemap.replace('</urlset>', `${indexEntry}\n${entries}\n</urlset>`);

  if (!DRY_RUN) fs.writeFileSync(sitemapPath, sitemap);
  console.log(`   Sitemap updated with ${letters.length} letter entries`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log('🔍  Dry run — no files will be written\n');

  // Ensure /letters/ dir exists
  const lettersDir = path.join(ROOT, 'letters');
  if (!DRY_RUN && !fs.existsSync(lettersDir)) fs.mkdirSync(lettersDir);

  const manifest = readManifest();
  const broadcasts = await fetchBroadcasts();
  const published = [];
  let newCount = 0;

  for (const broadcast of broadcasts) {
    const broadcastId = String(broadcast.id);

    // Skip if already published (unless --force)
    if (!FORCE && manifest[broadcastId]) {
      published.push(manifest[broadcastId]);
      continue;
    }

    // Fetch full content
    const full = await fetchBroadcastContent(broadcast.id);
    if (!full.content) { console.warn(`   ⚠️  No content for broadcast ${broadcast.id} — skipping`); continue; }

    const extracted = extractContent(full.content);
    if (!extracted || !extracted.title) {
      console.warn(`   ⚠️  Could not extract content from broadcast ${broadcast.id} — skipping`);
      continue;
    }

    const { title, html } = extracted;
    const subject = broadcast.subject;
    const publishedAt = broadcast.send_at || broadcast.published_at;
    let slug = slugify(title);

    // Handle slug collisions
    let finalSlug = slug;
    let collision = 1;
    while (published.some(p => p.slug === finalSlug) && manifest[broadcastId]?.slug !== finalSlug) {
      finalSlug = `${slug}-${collision++}`;
    }

    const entry = { id: broadcastId, slug: finalSlug, title, subject, publishedAt };
    published.push(entry);
    manifest[broadcastId] = entry;
    newCount++;

    // Write letter page
    const pageDir = path.join(lettersDir, finalSlug);
    const pageHtml = letterPage({ title, subject, html, publishedAt, slug: finalSlug });

    if (DRY_RUN) {
      console.log(`   📄  Would write /letters/${finalSlug}/index.html — "${title}"`);
    } else {
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
      console.log(`   ✅  /letters/${finalSlug}/`);
    }
  }

  // Write index page
  if (!DRY_RUN) {
    fs.writeFileSync(path.join(lettersDir, 'index.html'), lettersIndex(published));
    console.log(`\n   📋  /letters/index.html updated (${published.length} letters)`);
  } else {
    console.log(`\n   📋  Would write /letters/index.html with ${published.length} letters`);
  }

  // Update sitemap
  updateSitemap(published);

  // Save manifest
  writeManifest(manifest);

  console.log(`\n✨  Done — ${newCount} new letters published, ${published.length - newCount} already existed`);
  if (DRY_RUN) console.log('   Run without --dry-run to write files');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
