#!/usr/bin/env node
/**
 * Letters — the blog at /letters/.
 *
 * Source:  letters/_posts/*.md   (Markdown with a front-matter block)
 * Output:  letters/index.html, letters/<slug>/index.html, letters-sitemap.xml
 *
 *   npm run build:letters     (builds letters, then fills the shared partials)
 *
 * Front matter (one `key: value` per line):
 *   title        H1 on the page (the human headline)
 *   seoTitle     <title> tag, keyword first, ~60 chars max (defaults to title)
 *   description  meta description, ~155 chars max
 *   subtitle     one-line dek under the H1 and in lists
 *   slug         URL: /letters/<slug>/
 *   date         YYYY-MM-DD published
 *   updated      YYYY-MM-DD last meaningful edit (defaults to date)
 *   topic        case-studies | kickoffs | ai-workflow | career
 *   keyword      primary search term (for the record and the automation)
 *   cta          case-study | builder-kickoff | newsletter
 *   cover        optional image path; lists fall back to a typographic tile
 *   featured     true = hero on /letters/ (else the newest letter)
 *   popular      true = in the "Most popular" strip
 *   source       Kit broadcast id(s) the letter was built from
 *   draft        true = built (for preview) but noindex and left out of lists
 *
 * In the body, `<!-- newsletter -->` places the inline signup and
 * `<!-- cta -->` places the call-to-action block. Without markers the signup
 * goes before the third H2 and the CTA goes at the end.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "letters", "_posts");
const OUT_DIR = path.join(ROOT, "letters");
const SITE = "https://www.mrtylerwhite.com";
const KIT_FORM = "https://app.kit.com/forms/4969496/subscriptions";
const AUTHOR_IMG = "/assets/images/tyler-white-avatar.webp";
const DEFAULT_OG = "/assets/images/og-home.jpg";

const TOPICS = {
  "case-studies": "Case Studies",
  kickoffs: "Kickoffs & PRDs",
  "ai-workflow": "AI Workflow",
  career: "Career",
};

const CTAS = {
  "case-study": {
    eyebrow: "Free Claude Skill",
    title: "Turn your last project into a case study that shows what it was worth.",
    body: "The 15 Minute Case Study. Paste your rough notes, answer the hard questions, walk away with the business story.",
    href: "/roi-case-study-template/",
    label: "Get the 15 Minute Case Study",
  },
  "builder-kickoff": {
    eyebrow: "Builder Kickoff™ · $97",
    title: "Run the kickoff once. Walk out with the PRD and the prototype prompt.",
    body: "Seven short lessons. Record your next kickoff, and get the PRD, the business case and the prototype direction the same day.",
    href: "/prototype-ready/",
    label: "See how Builder Kickoff works",
  },
  newsletter: null,
};

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function parsePost(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${path.relative(ROOT, file)}: missing front matter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^(["'])(.*)\1$/, "$2");
    if (v === "true") v = true;
    else if (v === "false") v = false;
    meta[kv[1]] = v;
  }
  for (const key of ["title", "description", "slug", "date", "topic", "cta"]) {
    if (!meta[key]) throw new Error(`${path.relative(ROOT, file)}: front matter needs "${key}"`);
  }
  if (!TOPICS[meta.topic]) throw new Error(`${meta.slug}: unknown topic "${meta.topic}"`);
  if (!(meta.cta in CTAS)) throw new Error(`${meta.slug}: unknown cta "${meta.cta}"`);
  meta.updated = meta.updated || meta.date;
  meta.seoTitle = meta.seoTitle || meta.title;
  meta.body = m[2];
  meta.words = m[2].replace(/<!--[\s\S]*?-->/g, "").split(/\s+/).filter(Boolean).length;
  meta.readMins = Math.max(1, Math.round(meta.words / 230));
  meta.url = `${SITE}/letters/${meta.slug}/`;
  return meta;
}

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const slugifyHeading = (text) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Reader avatars from the Senja testimonials widget, saved locally at 192px.
const READERS = ["nick-groeneveld", "stav-lipman", "nidhi-arora", "laila-albuquerque", "aline-a"].map(
  (slug) => `/assets/images/readers/${slug}.webp`
);

// Wide placements get floating avatar bubbles that drift with the cursor
// (/assets/js/signup-float.js); the narrow sidebar keeps just the avatar row.
function newsletterBlock(location, { floating = true } = {}) {
  const bubbles = floating
    ? `<div class="letter-signup__float" aria-hidden="true">${READERS.map(
        (src, i) => `<span class="letter-signup__bubble letter-signup__bubble--${i + 1}" data-depth="${[0.6, 1, 0.8, 0.45, 0.9][i]}"><img src="${src}" alt="" width="96" height="96" loading="lazy" decoding="async" /></span>`
      ).join("")}</div>`
    : "";
  return `<aside class="letter-signup${floating ? " letter-signup--float" : ""}" aria-label="Newsletter"${floating ? " data-signup-float" : ""}>
  ${bubbles}
  <div class="letter-signup__inner">
    <p class="ds-eyebrow letter-signup__eyebrow">The ROI of Design</p>
    <p class="letter-signup__title">Get credit for the work you already ship.</p>
    <p class="letter-signup__body">Every Saturday: how to turn your design work into numbers execs actually fund.</p>
    <form class="letter-signup__form" data-newsletter-form data-track-location="${location}" method="post" action="${KIT_FORM}" novalidate>
      <label class="screen-reader-text" for="nl-${location}">Email address</label>
      <div class="letter-signup__field">
        <input id="nl-${location}" class="letter-signup__input" name="email_address" type="email" autocomplete="email" placeholder="Enter your email address..." required />
        <button class="letter-signup__btn" type="submit">Subscribe <span aria-hidden="true">&rarr;</span></button>
      </div>
      <p class="letter-signup__error" data-newsletter-error role="alert" aria-live="polite"></p>
    </form>
  </div>
</aside>`;
}

function ctaBlock(key) {
  const c = CTAS[key];
  if (!c) return newsletterBlock("letters_end");
  return `<aside class="letter-cta" aria-label="${esc(c.label)}">
  <p class="ds-eyebrow letter-cta__eyebrow">${esc(c.eyebrow)}</p>
  <p class="letter-cta__title">${esc(c.title)}</p>
  <p class="letter-cta__body">${esc(c.body)}</p>
  <a class="letter-cta__btn" href="${c.href}" data-track-event="letters_cta_click" data-track-location="${key}">${esc(c.label)} &rarr;</a>
</aside>`;
}

// ── Code blocks ───────────────────────────────────────────────────────────
// Fences render as Tailark's Quartz "Code Demo 4" (dark): file tabs over a
// scrolling editor with line numbers, plus a copy button.
// Name the file in the info string: ```markdown prd-template.md
// Adjacent fences with no prose between them merge into one card with a tab each.
// Behaviour lives in /assets/js/code-block.js.

// Lucide icons at Tailark's size-3: braces for data, hash for markdown, file-text otherwise.
const lucide = (paths) =>
  `<svg class="cb-tab__icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
const ICONS = {
  braces: lucide('<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'),
  hash: lucide('<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>'),
  file: lucide('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
};
const LANG_ICON = { json: "braces", js: "braces", ts: "braces", markdown: "hash", md: "hash" };
const DEFAULT_FILE = { markdown: "template.md", md: "template.md", text: "prompt.txt", txt: "prompt.txt", json: "data.json" };
const COPY_ICON = `<svg class="cb-copy__icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg class="cb-copy__done" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`;

// Light markdown highlighting: headings, list markers, "Label:" keys, [placeholders], **bold**.
function highlightLine(line, lang) {
  let s = esc(line);
  if (lang !== "markdown" && lang !== "md") {
    return s.replace(/^(\s*)(-|\d+\.)(\s)/, '$1<span class="cb-tok-mark">$2</span>$3');
  }
  if (/^#{1,6}\s/.test(line)) return `<span class="cb-tok-head">${s}</span>`;
  s = s.replace(/^(\s*)(-|\*|\d+\.)(\s)/, '$1<span class="cb-tok-mark">$2</span>$3');
  s = s.replace(/(<\/span>\s)([A-Z][A-Za-z0-9 /&;'’-]{1,40}:)(?=\s|$)/, '$1<span class="cb-tok-key">$2</span>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<span class="cb-tok-strong">**$1**</span>');
  s = s.replace(/\[([^\]]+)\]/g, '<span class="cb-tok-ph">[$1]</span>');
  return s;
}

let codeBlockSeq = 0;

function renderCodeBlock(text, info = "") {
  const [rawLang = "text", fileName] = info.trim().split(/\s+/);
  const lang = rawLang.toLowerCase();
  const file = fileName || DEFAULT_FILE[lang] || `snippet.${lang}`;
  const lines = text.replace(/\n$/, "").split("\n");
  const body = lines.map((l) => `<span class="cb-line"><span>${highlightLine(l, lang)}</span></span>`).join("");
  return {
    id: `cb-${++codeBlockSeq}`,
    tab: `${ICONS[LANG_ICON[lang] || "file"]}<span>${esc(file)}</span>`,
    html: `<pre class="cb-pre" data-lang="${esc(lang)}"><code>${body}</code></pre>`,
  };
}

function codeCardHtml(blocks) {
  const tabs = blocks
    .map(
      (b, i) =>
        `<button type="button" role="tab" class="cb-tab" id="${b.id}-tab" aria-controls="${b.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${b.tab}</button>`
    )
    .join("");
  const panels = blocks
    .map(
      (b, i) =>
        `<div class="cb-panel" role="tabpanel" id="${b.id}" aria-labelledby="${b.id}-tab"${i === 0 ? "" : " hidden"}><div class="cb-scroll" tabindex="0">${b.html}</div></div>`
    )
    .join("");
  return `<figure class="cb is-first-active" data-code-block>
  <div class="cb-bar">
    <div class="cb-tabs" role="tablist" aria-label="Code files">${tabs}</div>
    <button type="button" class="cb-copy" aria-label="Copy code">${COPY_ICON}${CHECK_ICON}<span class="cb-copy__label">Copy</span></button>
  </div>
  ${panels}
  <span class="cb-status screen-reader-text" role="status" aria-live="polite"></span>
</figure>`;
}

function renderBody(post) {
  const toc = [];
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const html = this.parser.parseInline(tokens);
    const id = slugifyHeading(html);
    if (depth === 2) toc.push({ id, html });
    return `<h${depth} id="${id}">${html}</h${depth}>\n`;
  };
  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href) && !href.startsWith(SITE);
    const t = title ? ` title="${esc(title)}"` : "";
    return external
      ? `<a href="${esc(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
      : `<a href="${esc(href)}"${t}>${text}</a>`;
  };
  const codeBlocks = [];
  renderer.code = function ({ text, lang }) {
    codeBlocks.push(renderCodeBlock(text, lang));
    return `<!--codeblock:${codeBlocks.length - 1}-->\n`;
  };
  let html = marked.parse(post.body, { renderer, gfm: true });
  // Merge runs of adjacent fences into one tabbed card, then swap in the markup.
  html = html.replace(/<!--codeblock:\d+-->(?:\s*<!--codeblock:\d+-->)*/g, (run) =>
    codeCardHtml([...run.matchAll(/codeblock:(\d+)/g)].map((m) => codeBlocks[Number(m[1])]))
  );
  // Tables sit in Tailark Mist's tray + faux-browser card (three window dots).
  html = html
    .replace(
      /<table>/g,
      '<div class="letter-table"><div class="letter-table__card"><div class="letter-table__dots" aria-hidden="true"><span></span><span></span><span></span></div><div class="letter-table__scroll"><table>'
    )
    .replace(/<\/table>/g, "</table></div></div></div>");

  if (html.includes("<!-- newsletter -->")) html = html.replace("<!-- newsletter -->", newsletterBlock("letters_inline"));
  else {
    let n = 0;
    html = html.replace(/<h2 /g, (mm) => (++n === 3 ? `${newsletterBlock("letters_inline")}\n<h2 ` : mm));
  }
  if (html.includes("<!-- cta -->")) html = html.replace("<!-- cta -->", ctaBlock(post.cta));
  else html += `\n${ctaBlock(post.cta)}`;
  return { html, toc };
}

function headCommon({ title, description, canonical, ogImage, ogType, noindex, jsonld, extraHead = "" }) {
  const img = ogImage.startsWith("http") ? ogImage : SITE + ogImage;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
${noindex ? '  <meta name="robots" content="noindex" />\n' : ""}
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Mr. Tyler White" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${img}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@mrtylerwhite" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${img}" />
  <link rel="alternate" type="application/rss+xml" title="Letters · Tyler White" href="${SITE}/letters/feed.xml" />
${jsonld.map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}

  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-32x32.png" sizes="32x32" />
  <link rel="icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-192x192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/wp-content/uploads/2025/05/cropped-Favicon-2-180x180.png" />

  <link rel="preload" href="/assets/fonts/instrument-serif/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/wp-content/et-cache/global/et-divi-customizer-global.min.css" />
  <link rel="stylesheet" href="/wp-content/plugins/divi-100-hamburger-menu/assets/css/style.css" />
  <link rel="preconnect" href="https://use.typekit.net" crossorigin />
  <link rel="stylesheet" href="https://use.typekit.net/fks5kmr.css" />
  <link rel="stylesheet" href="/assets/css/dist/critical.css" />
  <link rel="stylesheet" href="/assets/css/system/nav-standalone.css" />
  <link rel="stylesheet" href="/assets/css/system/pages/letters.css" />
  <link rel="stylesheet" href="/assets/css/system/site-footer.css" />
${extraHead}<!-- partial:head -->
<!-- /partial:head -->
</head>`;
}

const BODY_CLASSES =
  "ds-standalone-nav et_fixed_nav et_show_nav et_header_style_left et_pb_svg_logo et_divi_100_custom_hamburger_menu et_divi_100_custom_hamburger_menu--style-2 et_divi_100_custom_hamburger_menu--type-1 et_button_no_icon et_button_custom_icon et_pb_button_helper_class";

const shellOpen = (extraClass) => `<body class="${extraClass} ${BODY_CLASSES}">
<div id="page-container">
<!-- partial:header -->
<!-- /partial:header -->`;

const shellClose = `<!-- partial:footer -->
<!-- /partial:footer -->
</div>
<script src="/assets/js/mobile-menu-a11y.js" defer></script>
<script src="/assets/js/newsletter-form.js" defer></script>
<script src="/assets/js/signup-float.js" defer></script>
<script src="/assets/js/gtm-defer.js" defer></script>
<script src="/assets/js/analytics.js" defer></script>
<script src="/assets/js/hotjar.js" defer></script>
</body>
</html>
`;

function tile(post, cls) {
  return post.cover
    ? `<img class="${cls}" src="${esc(post.cover)}" alt="" loading="lazy" width="320" height="200" />`
    : `<span class="${cls} letters-tile letters-tile--${post.topic}" aria-hidden="true"><span>${esc(TOPICS[post.topic])}</span></span>`;
}

function postPage(post, related) {
  const { html, toc } = renderBody(post);
  const canonical = post.url;
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated,
      image: SITE + (post.cover || DEFAULT_OG),
      mainEntityOfPage: canonical,
      url: canonical,
      keywords: post.keyword || undefined,
      wordCount: post.words,
      author: { "@type": "Person", name: "Tyler White", url: `${SITE}/about/`, jobTitle: "Director of Product Design" },
      publisher: { "@type": "Person", name: "Tyler White", url: `${SITE}/` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Letters", item: `${SITE}/letters/` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    },
  ];

  const tocHtml = toc.length >= 3
    ? `<nav class="letter-toc" aria-label="In this letter">
        <p class="letter-toc__label">In this letter</p>
        <ol>${toc.map((t) => `<li><a href="#${t.id}">${t.html}</a></li>`).join("")}</ol>
      </nav>`
    : "";

  const relatedHtml = related.length
    ? `<section class="letters-related" aria-labelledby="related-heading">
        <h2 id="related-heading" class="letters-label">Keep reading</h2>
        <ul class="letters-list">${related.map(listItem).join("")}</ul>
      </section>`
    : "";

  return `${headCommon({
    title: `${post.seoTitle} | Tyler White`,
    description: post.description,
    canonical,
    ogImage: post.cover || DEFAULT_OG,
    ogType: "article",
    noindex: post.draft === true,
    jsonld,
    extraHead: html.includes("data-code-block")
      ? `  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap" />
`
      : "",
  })}
${shellOpen("letters-page letter-page")}
<main class="letter" id="main-content">
  <article class="letter__article">
    <header class="letter__header">
      <h1 class="letter__title ds-enter ds-enter-d1">${esc(post.title)}</h1>
      ${post.subtitle ? `<p class="letter__subtitle ds-enter ds-enter-d1">${esc(post.subtitle)}</p>` : ""}
      <div class="letter__byline ds-enter ds-enter-d2">
        <img class="letter__avatar" src="${AUTHOR_IMG}" alt="" width="36" height="36" />
        <p><a href="/about/" rel="author">Tyler White</a><time datetime="${post.date}">${fmtDate(post.date)}</time></p>
      </div>
      <div class="letter__bar ds-enter ds-enter-d2">
        <span>${post.readMins} min read · <a href="/letters/#${post.topic}">${esc(TOPICS[post.topic])}</a></span>
        <button type="button" class="letter__share" data-share-url="${canonical}">Share</button>
      </div>
    </header>
    ${post.cover ? `<img class="letter__cover" src="${esc(post.cover)}" alt="" width="1200" height="630" />` : ""}
    ${tocHtml}
    <div class="letter__body">
${html}
    </div>
    <footer class="letter__author">
      <img class="letter__avatar letter__avatar--lg" src="${AUTHOR_IMG}" alt="" width="64" height="64" loading="lazy" />
      <div>
        <p class="letter__author-name">Tyler White</p>
        <p class="letter__author-bio">Director of Product Design. 16 years in B2B SaaS, writing about how design decisions turn into revenue, retention and the seat at the table. Creator of Builder Kickoff™.</p>
      </div>
    </footer>
  </article>
  ${relatedHtml}
</main>
<script>
(function () {
  var btn = document.querySelector("[data-share-url]");
  if (!btn) return;
  btn.addEventListener("click", async function () {
    var url = btn.getAttribute("data-share-url");
    try {
      if (navigator.share) { await navigator.share({ title: document.title, url: url }); return; }
      await navigator.clipboard.writeText(url);
      btn.textContent = "Link copied";
      setTimeout(function () { btn.textContent = "Share"; }, 2000);
    } catch (_) {}
  });
})();
</script>
${html.includes("data-code-block") ? '<script src="/assets/js/code-block.js" defer></script>\n' : ""}${shellClose}`;
}

function listItem(post) {
  return `<li class="letters-list__item" data-topic="${post.topic}">
  <a class="letters-list__link" href="/letters/${post.slug}/">
    <span class="letters-list__text">
      <span class="letters-list__title">${esc(post.title)}</span>
      ${post.subtitle ? `<span class="letters-list__sub">${esc(post.subtitle)}</span>` : ""}
      <span class="letters-list__meta"><time datetime="${post.date}">${fmtDate(post.date)}</time> · ${esc(TOPICS[post.topic])}</span>
    </span>
    ${tile(post, "letters-list__thumb")}
  </a>
</li>`;
}

function indexPage(posts) {
  const featured = posts.find((p) => p.featured === true) || posts[0];
  // The featured letter only appears once; the strip and list show everything else.
  const rest = posts.filter((p) => p !== featured);
  const popular = rest.filter((p) => p.popular === true).slice(0, 4);
  const topicsUsed = Object.keys(TOPICS).filter((t) => posts.some((p) => p.topic === t));
  const description =
    "Letters from Tyler White on proving what design is worth: PRDs and kickoffs, case studies that show impact, and AI workflows for product designers.";

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Letters · Tyler White",
      url: `${SITE}/letters/`,
      description,
      author: { "@type": "Person", name: "Tyler White", url: `${SITE}/about/` },
      blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: p.url, datePublished: p.date })),
    },
  ];

  return `${headCommon({
    title: "Letters: Product Design, PRDs and Design ROI | Tyler White",
    description,
    canonical: `${SITE}/letters/`,
    ogImage: DEFAULT_OG,
    ogType: "website",
    noindex: false,
    jsonld,
  })}
${shellOpen("letters-page letters-index")}
<main class="letters" id="main-content">
  <h1 class="screen-reader-text">Letters</h1>



  ${featured ? `<a class="letters-feature ds-enter ds-enter-d2" href="/letters/${featured.slug}/">
    ${tile(featured, "letters-feature__art")}
    <span class="letters-feature__text">
      <span class="letters-feature__eyebrow"><time datetime="${featured.date}">${fmtDate(featured.date)}</time> · ${esc(TOPICS[featured.topic])}</span>
      <span class="letters-feature__title">${esc(featured.title)}</span>
      ${featured.subtitle ? `<span class="letters-feature__sub">${esc(featured.subtitle)}</span>` : ""}
      <span class="letters-feature__cta"><span class="letters-feature__arrow" aria-hidden="true">&rarr;</span>Read the latest</span>
    </span>
  </a>` : ""}

  ${popular.length ? `<section class="letters-popular" aria-labelledby="popular-heading">
    <div class="letters-row-head">
      <h2 id="popular-heading" class="letters-label">Most popular</h2>
      <a class="letters-viewall" href="#latest-heading">View all</a>
    </div>
    <ul class="letters-popular__grid">${popular.map((p) => `<li><a href="/letters/${p.slug}/">
      ${tile(p, "letters-popular__thumb")}
      <span class="letters-popular__text">
        <span class="letters-popular__title">${esc(p.title)}</span>
        <span class="letters-popular__cat">${esc(TOPICS[p.topic])}</span>
      </span></a></li>`).join("")}</ul>
  </section>` : ""}

  ${rest.length ? `<div class="letters-columns">
    <section class="letters-latest" aria-labelledby="latest-heading">
      <div class="letters-latest__head">
        <h2 id="latest-heading" class="letters-label">Latest</h2>
      </div>
      ${topicsUsed.length > 1 ? `<div class="letters-chips ds-enter ds-enter-d2" role="tablist" aria-label="Filter by topic">
    <button type="button" role="tab" aria-selected="true" data-topic-filter="all">All</button>
    <span class="letters-chips__divider" aria-hidden="true"></span>
    ${topicsUsed.map((t) => `<button type="button" role="tab" aria-selected="false" data-topic-filter="${t}" id="${t}">${esc(TOPICS[t])}</button>`).join("")}
  </div>` : ""}
      <ul class="letters-list">${featured ? listItem(featured).replace('<li class="letters-list__item"', '<li class="letters-list__item" data-featured hidden') : ""}${rest.map(listItem).join("")}</ul>
      <p class="letters-empty" hidden>No letters match that yet.</p>
    </section>
    <aside class="letters-sidebar">
      ${newsletterBlock("letters_sidebar", { floating: false })}
    </aside>
  </div>` : `<div class="letters-solo">${newsletterBlock("letters_sidebar", { floating: false })}</div>`}
</main>
<script>
(function () {
  var tabs = document.querySelectorAll("[data-topic-filter]");
  var items = document.querySelectorAll(".letters-latest .letters-list__item");
  var page = document.querySelector(".letters");
  var empty = document.querySelector(".letters-empty");
  var latestLabel = document.getElementById("latest-heading");
  var topic = "all";
  function apply() {
    var filtering = topic !== "all";
    page.classList.toggle("is-filtering", filtering);
    if (latestLabel) latestLabel.textContent = filtering ? "Results" : "Latest";
    var shown = 0;
    items.forEach(function (li) {
      var okTopic = topic === "all" || li.dataset.topic === topic;
      var hideFeatured = li.hasAttribute("data-featured") && !filtering;
      li.hidden = !okTopic || hideFeatured;
      if (!li.hidden) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
  }
  function setTopic(t) {
    topic = t;
    tabs.forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.topicFilter === t)); });
    apply();
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { setTopic(b.dataset.topicFilter); history.replaceState(null, "", b.dataset.topicFilter === "all" ? location.pathname : "#" + b.dataset.topicFilter); }); });
  var hash = location.hash.slice(1);
  if (hash && document.querySelector('[data-topic-filter="' + hash + '"]')) setTopic(hash);
})();
</script>
${shellClose}`;
}

function feed(posts) {
  const items = posts
    .map(
      (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${p.url}</link>
    <guid isPermaLink="true">${p.url}</guid>
    <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
  </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Letters · Tyler White</title>
  <link>${SITE}/letters/</link>
  <atom:link href="${SITE}/letters/feed.xml" rel="self" type="application/rss+xml" />
  <description>Tyler White on proving what design is worth: PRDs and kickoffs, case studies that show impact, and AI workflows for product designers.</description>
${items}
</channel>
</rss>
`;
}

function sitemap(posts) {
  const latest = posts.reduce((a, p) => (p.updated > a ? p.updated : a), "1970-01-01");
  const urls = [
    `\t<url>\n\t\t<loc>${SITE}/letters/</loc>\n\t\t<lastmod>${latest}</lastmod>\n\t</url>`,
    ...posts.map((p) => `\t<url>\n\t\t<loc>${p.url}</loc>\n\t\t<lastmod>${p.updated}</lastmod>\n\t</url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function registerSitemap(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  const xml = fs.readFileSync(p, "utf8");
  if (xml.includes("/letters-sitemap.xml")) return;
  const entry = `\t<sitemap>\n\t\t<loc>${SITE}/letters-sitemap.xml</loc>\n\t</sitemap>\n`;
  fs.writeFileSync(p, xml.replace("</sitemapindex>", `${entry}</sitemapindex>`));
  console.log(`  registered letters-sitemap.xml in ${file}`);
}

function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  console.log("  wrote", rel);
}

// ── Build ─────────────────────────────────────────────────────────────────
const all = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => parsePost(path.join(POSTS_DIR, f)))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const slugs = new Set();
for (const p of all) {
  if (slugs.has(p.slug)) throw new Error(`Duplicate slug "${p.slug}"`);
  slugs.add(p.slug);
}

const published = all.filter((p) => p.draft !== true);

// Remove generated folders for letters that no longer exist.
for (const name of fs.readdirSync(OUT_DIR)) {
  const dir = path.join(OUT_DIR, name);
  if (name.startsWith("_") || !fs.statSync(dir).isDirectory() || slugs.has(name)) continue;
  if (fs.existsSync(path.join(dir, "index.html"))) {
    fs.rmSync(dir, { recursive: true });
    console.log("  removed stale", `letters/${name}/`);
  }
}

for (const post of all) {
  const related = published.filter((p) => p.slug !== post.slug && p.topic === post.topic).slice(0, 3);
  write(`letters/${post.slug}/index.html`, postPage(post, related));
}
write("letters/index.html", indexPage(published));
write("letters/feed.xml", feed(published));
write("letters-sitemap.xml", sitemap(published));
registerSitemap("sitemap.xml");
registerSitemap("sitemap_index.xml");

console.log(`Built ${all.length} letter(s) (${published.length} published).`);
