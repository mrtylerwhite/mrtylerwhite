# mrtylerwhite.com (static site)

Plain HTML pages (one folder per URL) on Vercel. No framework. `api/` holds Vercel functions.
Local dev: `npm run dev` (port 4321). Deploy build: `npm run build:dist` (copies + minifies into `dist/`).

## Design system: read before building any UI

The source of truth is **`/design-system/`** (`design-system/index.html`). The look is **Tailark Dusk**
ported 1:1 to plain HTML on **Basecoat 1.1** (shadcn/ui as HTML + Tailwind v4), with three brand changes:
light sections use our warm off-white, H1–H4 use our condensed caps, and our brown is the accent.

- Tokens: `assets/css/system/tokens.css` (`--ds-dusk-*` for Basecoat pages). **Change values here only.**
- Theme mapping (token → shadcn role, light + dark): `assets/css/ds/theme.css`
- Tailwind entry (typography, button overrides, dark variant): `assets/css/ds/basecoat.input.css`
  → built to `assets/css/ds/basecoat.css` (committed)
- Basecoat JS (tabs, sidebar, dropdowns, etc.): `assets/js/vendor/basecoat.all.min.js`

### Rules for new UI
1. **Sections switch palette by class:** every `<section>` gets `class="light"` (off-white `#FCF7F4`) or
   `class="dark"` (warm charcoal `#181717`). Any element can carry it (cards, figures, footers) and nesting works.
2. **Headings:** plain `<h1>`–`<h4>` are automatically Alternate Gothic, uppercase, **one colour only**
   (no Dusk two-tone; muted spans inside headings are neutralised). Two lines are fine: `First. <br>Second.`
   Hero headline: `<h1 class="ds-display">`. **No eyebrow labels** above headings.
3. **Everything else is Dusk 1:1:** Inter body, paragraphs `text-muted-foreground` (`md:text-lg` for intros),
   feature copy `text-lg font-medium` with a `<span class="text-foreground">Bold lead-in.</span>`,
   containers `mx-auto max-w-7xl px-6`,
   section spacing `py-16 md:py-20`, hairline `border` grids, `ring-1 ring-foreground/10` cards.
4. **Buttons are always pills** (`.btn` is `rounded-full` everywhere): default = solid, `data-variant="secondary"`
   = near-page fill (`--btn-secondary-bg`, light) / Dusk 5% fill (dark) plus ring, `ghost` = text. Sizes: default 36px, `sm` 32px, `lg` 40px.
5. Colours come from theme utilities only (`bg-background`, `text-foreground`, `text-muted-foreground`,
   `bg-card`, `border`, `bg-foreground/5`, `ring-foreground/10`…). **Never hard-code hex values.**
   **Brown accent** (never on headlines): `.ds-stat` for big numbers (glossy), `text-brand` for icons and
   `.ds-check` checkmarks, `text-brand-text` for small brown text, `bg-brand-soft text-brand-text` badges,
   `.ds-gloss-fill` for progress/highlight bars. Bare text links and the focus ring are brown automatically.
   **Gloss:** big brown moments (stats, the pill label, highlight badges) use the metallic `.ds-gloss` text;
   keep small body-size brown text flat (`text-brand-text`) so it stays readable.
   Light sections use deeper browns for contrast (`--ds-color-gold-deep` / `-ink`); dark uses `#C59060`.
6. Porting Tailark blocks: keep their markup and utility classes, swap React/shadcn components for the
   Basecoat equivalents, add `light`/`dark` to the section. No React.
7. **Elevation (Dusk):** `.card` / `.ds-elev-1` for resting cards, `.ds-elev-2` for floating panels
   (add `.ds-elev-fade` for the top-down fill), `.ds-frame` inside `.ds-frame-wrap` for hero app
   screenshots, `.ds-inset` for solid-colour cards. Don't hand-roll shadows; strengths live in `theme.css`.
8. **Copy restraint (the hero lockup is the benchmark):** announcement pill ≤ 6 words · headline ≤ 6 words ·
   lede = one sentence, ≤ 2 lines (~20 words) · max 2 CTAs of 2–3 words (one solid, one ghost/secondary).
   Section intros follow the same idea: one headline, one short paragraph, then the content. Cut before adding.
   **Lockup headlines are always two balanced lines, never one:** inside a `light`/`dark` section, h1/h2 cap
   at 18ch with `text-wrap: balance` automatically. Use your own `<br>` only to choose the break point.
9. **Charts & illustrations (we're the ROI of design, so show the numbers):**
   - **Charts follow Apple's Health/Stocks idiom** (HIG "Charts"): summary header above the plot (kicker · big
     value + unit · range) that follows the scrubber, y-axis on the right, 4 light gridlines, the whole plot is the
     hit target, arrow keys step. Load `/assets/js/ds-charts.js` (defer) and use
     `<figure class="ds-chart" data-ds-chart="line|bars|compare|ring|spark">` with a JSON `<script type="application/json">`
     inside; see the Data & illustration section of `/design-system/` for each schema.
     `line` = Stocks (smooth curve, gradient, optional `ranges` switcher, `marker` for the ship date, `min`);
     `bars` = Health (zero-based, rounded tops, `goal` line, others dim on select); `compare` = before/after;
     `ring` = Activity goal ring; `spark` for stat tiles (`.ds-tile`); part-to-whole = `.ds-seg`.
   - Brown (`--chart-1`) is always the result / "after"; `--chart-muted` is "before"; slate/sage only for a 2nd/3rd
     series. Max 3 coloured series, never a dual axis. The palette is validated with the dataviz six-checks script
     (light + dark, all pairs); re-run it if you change any `--chart-*` value.
   - **Illustrations come from Tailark's illustration library** (see rule 10); Dusk's feature compositions stay
     empty (rule 11). Feature lists use **Lucide** icons inline (`size-4`, stroke 2) before a bold lead-in.
10. **Bento (Tailark Quartz bento-1 / bento-2):** `<section class="light|dark @container">` → `.ds-bento` grid
   (2 → 6 columns via container query) of `.ds-bento-card` tiles with `@3xl:col-span-2|3|4`. Each tile = a plain
   `<h3>` (sentence case, not caps) + `<p>` and an illustration area with `.ds-stripes` behind it. Illustrations
   are Tailark's illustration-library pieces rebuilt in HTML on the `bg-illustration` / `ring-border-illustration`
   surface (`.ds-illo-card`): file/report, value-by-source docs, reply, timeline, impact breakdown, dotted map
   (`.ds-map`, regenerate with `node scripts/build-dotted-map.mjs`). Tailark's purple `primary` accent is always
   swapped for our brand brown; never use real people's photos (initials `.ds-avatar` instead).
   Source code for more Tailark blocks/illustrations: tailark.com (Tyler's account), Quartz Pro kit + /illustrations.
11. **Tailark fidelity — port, don't invent.** Before adding or changing any Tailark-derived pattern, open its
   source while logged in (tailark.com → Code view; Dusk landing = `pages/dusk/dusk/landing`, bento = Quartz
   `blocks/quartz/bento`, illustrations = `/illustrations`) and match its markup/classes 1:1. Only these brand
   deviations are allowed: caps two-line headlines (single colour), pill buttons, brown accent + gloss (stats,
   checks, pill label), our elevation/shadows, warm palette, ROI copy, initials instead of photos.
   **Never put charts, stats or decoration inside Dusk's abstract feature shapes** — they are empty on purpose;
   replace a shape only with a real screenshot. Don't add rings, badges, gaps or extra plans the source doesn't have.
12. If a component or section is missing, add it to `/design-system/` first, then use it.

### Using Basecoat on a page
- Link `/assets/css/ds/basecoat.css` and `/assets/js/vendor/basecoat.all.min.js` (defer), plus the
  Adobe Fonts kit `https://use.typekit.net/fks5kmr.css`.
- Add the page to `@source` in `assets/css/ds/basecoat.input.css`, then run `npm run build:ds`
  (or `npm run dev:ds` to watch while editing).
- Don't mix with the legacy Divi CSS (`assets/css/system/index.css`, `wp-content/...`) on the same page:
  Tailwind's reset clashes with it. Migrate pages one at a time.

## Legacy
Older pages still use the Divi/WordPress-export CSS in `assets/css/system/`. The previous design system
reference lives at `/design-system/legacy/`. Leave those pages alone unless migrating them.
