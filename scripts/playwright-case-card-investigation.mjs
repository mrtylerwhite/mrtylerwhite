/**
 * Playwright investigation: homepage Notch case study card overlap
 * Run: node scripts/playwright-case-card-investigation.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, '.playwright-investigation/case-cards');
const BASE_URL = 'http://127.0.0.1:4321/';
const WIDTHS = [1440, 1280, 1024, 900, 768, 640, 390];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const report = {
    url: BASE_URL,
    card: '.et_pb_row_4.card-kepler.card-notch',
    viewports: [],
    dom: null,
    overlapFirstAt: null,
  };

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector(report.card, { timeout: 15000 });

    const card = page.locator(report.card).first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const metrics = await page.evaluate((selector) => {
      const row = document.querySelector(selector);
      if (!row) return { error: 'card not found' };

      const textModule =
        row.querySelector('.et_pb_text_3 .et_clickable') ||
        row.querySelector('.et_pb_column_1_2 .et_clickable');
      const textInner = row.querySelector('.et_pb_text_3 .et_pb_text_inner');
      const copyBlocks = textInner
        ? [...textInner.querySelectorAll('h5, p, a.text-button')]
        : [];

      const rowRect = row.getBoundingClientRect();
      const textRect = textModule?.getBoundingClientRect();
      const rowStyle = getComputedStyle(row);
      const col = row.querySelector('.et_pb_column_1_2');
      const colStyle = col ? getComputedStyle(col) : null;
      const clickStyle = textModule ? getComputedStyle(textModule) : null;

      // Estimate background painting area (no-repeat, single image)
      const bgSize = rowStyle.backgroundSize; // e.g. "460px 470px" or "auto"
      const bgPos = rowStyle.backgroundPosition;
      const bgImage = rowStyle.backgroundImage;

      let bgWidth = 0;
      let bgHeight = 0;
      const sizeParts = bgSize.split(/\s+/);
      if (sizeParts[0] && sizeParts[0] !== 'auto') {
        bgWidth =
          sizeParts[0].includes('%')
            ? (parseFloat(sizeParts[0]) / 100) * rowRect.width
            : parseFloat(sizeParts[0]) || 0;
      }
      if (sizeParts[1] && sizeParts[1] !== 'auto') {
        bgHeight =
          sizeParts[1].includes('%')
            ? (parseFloat(sizeParts[1]) / 100) * rowRect.height
            : parseFloat(sizeParts[1]) || 0;
      } else if (sizeParts[0] && !sizeParts[1]) {
        bgHeight = bgWidth; // cover-like single value
      }

      // Parse background-position (simplified: right X% center)
      let bgLeft = rowRect.right - bgWidth;
      const posParts = bgPos.split(/\s+/);
      if (posParts[0] === 'right' && posParts[1]) {
        const xOff = parseFloat(posParts[1]);
        if (String(posParts[1]).includes('%')) {
          bgLeft = rowRect.right - bgWidth + (xOff / 100) * rowRect.width;
        }
      } else if (posParts[0]?.includes('%')) {
        const pct = parseFloat(posParts[0]);
        bgLeft = rowRect.left + (pct / 100) * rowRect.width - bgWidth / 2;
      }

      const bgTop =
        posParts.includes('center') || posParts[1] === 'center'
          ? rowRect.top + (rowRect.height - bgHeight) / 2
          : rowRect.top;

      const bgBox = {
        left: bgLeft,
        right: bgLeft + bgWidth,
        top: bgTop,
        bottom: bgTop + bgHeight,
        width: bgWidth,
        height: bgHeight,
      };

      const overlaps = [];
      for (const el of copyBlocks) {
        const r = el.getBoundingClientRect();
        const intersects =
          r.right > bgBox.left &&
          r.left < bgBox.right &&
          r.bottom > bgBox.top &&
          r.top < bgBox.bottom;
        if (intersects) {
          overlaps.push({
            tag: el.tagName,
            className: el.className,
            text: (el.textContent || '').slice(0, 80),
            rect: {
              left: Math.round(r.left),
              right: Math.round(r.right),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
            },
            overlapPx: Math.round(
              Math.min(r.right, bgBox.right) - Math.max(r.left, bgBox.left)
            ),
          });
        }
      }

      const textExtendsPastMidline = textRect
        ? textRect.right > rowRect.left + rowRect.width * 0.55
        : null;

      const hasHorizontalScroll =
        document.documentElement.scrollWidth > window.innerWidth + 1;

      const imgs = [...row.querySelectorAll('img')].map((img) => {
        const r = img.getBoundingClientRect();
        return {
          src: img.getAttribute('src')?.slice(-40),
          rect: {
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
          },
        };
      });

      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        row: {
          className: row.className,
          rect: {
            width: Math.round(rowRect.width),
            height: Math.round(rowRect.height),
            left: Math.round(rowRect.left),
          },
        },
        textColumn: textRect
          ? {
              width: Math.round(textRect.width),
              right: Math.round(textRect.right),
              paddingRight: clickStyle?.paddingRight,
            }
          : null,
        columnComputed: colStyle
          ? {
              width: colStyle.width,
              float: colStyle.float,
              position: colStyle.position,
            }
          : null,
        background: {
          image: bgImage?.slice(0, 80),
          size: bgSize,
          position: bgPos,
          repeat: rowStyle.backgroundRepeat,
          estimatedBox: {
            left: Math.round(bgBox.left),
            right: Math.round(bgBox.right),
            width: Math.round(bgBox.width),
          },
        },
        overlaps,
        overlapCount: overlaps.length,
        textExtendsPastMidline,
        hasHorizontalScroll,
        imgs,
        diviStacked: colStyle?.width === '100%' || parseFloat(colStyle?.width) >= rowRect.width * 0.95,
      };
    }, report.card);

    const shotPath = join(OUT_DIR, `notch-${width}px.png`);
    await card.screenshot({ path: shotPath });

    const entry = { width, screenshot: shotPath.replace(ROOT + '/', ''), ...metrics };
    report.viewports.push(entry);
    if (metrics.overlapCount > 0 && report.overlapFirstAt == null) {
      report.overlapFirstAt = width;
    }

    await context.close();
  }

  // DOM structure once at 1024
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  report.dom = await page.evaluate((selector) => {
    const row = document.querySelector(selector);
    if (!row) return null;
    const walk = (el, depth = 0) => {
      if (depth > 4) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className?.toString?.().slice(0, 120) || '',
        position: cs.position,
        width: cs.width,
        children: [...el.children].map((c) => walk(c, depth + 1)).filter(Boolean),
      };
    };
    return walk(row);
  }, report.card);
  await ctx.close();
  await browser.close();

  await writeFile(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
