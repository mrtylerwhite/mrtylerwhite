# Performance notes

Summary of CSS and font performance work on the static site (Phases 1–3.5).

## Completed work

### Phase 1 — Remove dead CSS

Stripped unused render-blocking styles from HTML via `scripts/strip-dead-css-links.mjs`:

- WordPress `wp-components` CSS
- GoDaddy plugin CSS
- Mediaelement CSS/JS on pages without `<video>` or `<audio>` (Kepler and other video pages keep mediaelement)

### Phase 2 — Flatten CSS import waterfall

`scripts/build-css-bundles.mjs` concatenates the `headings.css` import chain into a single bundle:

- Output: `assets/css/dist/critical.css`
- HTML references `critical.css` instead of `headings.css` and its serial `@import`s

Run both strip and bundle together:

```bash
npm run apply:css-performance
```

### Phase 3 — Self-hosted brand fonts

- Instrument Serif and JetBrains Mono served from `assets/fonts/`
- Google Fonts `@import` removed from `assets/css/system/fonts.css`
- Build script adds `<link rel="preload">` for Instrument Serif Regular before `critical.css`

### Phase 3.5 — Homepage hero CLS

Mobile/tablet hero layout was unstable before Divi’s deferred inline CSS parsed, pushing “A quick note before you scroll” into the viewport (~0.30 lab CLS).

Fix in `assets/css/system/pages/home-hero-background.css`:

- Mobile: reserve stable hero height, hide profile image early, align `row_0` spacing with final Divi mobile layout
- Tablet (768–980px): hide profile image early and reserve stable hero height

Commit: `666e3e7` — Stabilize homepage hero CLS

## Current PageSpeed (mobile, homepage)

| Metric | Value |
|--------|-------|
| Performance | 96 |
| FCP | 1.2s |
| LCP | 2.6s |
| TBT | 10ms |
| CLS | 0.032 |

## After WordPress / Divi re-export

1. Run `npm run apply:css-performance` to re-strip dead CSS links and rebuild `critical.css`.
2. Commit `assets/css/dist/critical.css` with the HTML changes — **Vercel has no CSS build step**; the bundle must be present in the repo at deploy time.
