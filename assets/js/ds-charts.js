/*
  ds-charts.js — dependency-free SVG charts in the Apple Health / Stocks / Fitness idiom,
  themed with the design-system tokens. No build step.

    <figure class="ds-chart" data-ds-chart="line">
      <script type="application/json">{ …data… }</script>
    </figure>
    <script src="/assets/js/ds-charts.js" defer></script>

  Apple patterns (HIG "Charts" + WWDC22 "Design an effective chart"):
    • Summary header above the plot: kicker · big value + unit · date range. Scrubbing the
      plot updates the header to the selected point (no floating tooltip).
    • Y-axis on the trailing (right) edge, ~4 light gridlines, familiar tick steps.
    • The whole plot is the hit target; arrow keys step through points.
    • Bars: zero-based, rounded tops; selection dims the other bars.
    • Lines: smooth monotone curve, soft gradient fill fading to the baseline.

  Types and data:
    line    { title, kicker, unit, range, labels[], series:[{name, values[], color}], marker:{index,label}, min,
              ranges:[{id, range, labels[], series[], marker}] }   // optional time-range switcher (Stocks)
    bars    { title, kicker, unit, range, labels[], values[], color, goal }   // Health-style bars
    compare { title, kicker, unit, categories[], series:[{name, values[], color}] }  // before / after
    ring    { value, goal, unit, label, color }                 // Activity-style goal ring
    spark   { values[], color }

  Colours: --chart-1…3, --chart-muted, --chart-grid. The header shows the average unless
  data.summary is given. Every chart also renders a "View as table" twin.
*/
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  const svgEl = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const h = (tag, cls, parent, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const cvar = (c) => `var(--chart-${c || '1'})`;
  const num = (v) => (Math.abs(v) >= 10000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'K' : (+v.toFixed(1)).toLocaleString('en-CA'));
  const withUnit = (v, unit) => (unit === '%' ? num(v) + '%' : unit === '$' ? '$' + num(v) : num(v));
  const unitSuffix = (unit) => (unit && unit !== '%' && unit !== '$' ? unit : '');
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const niceStep = (span) => {
    const raw = span / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
    return 10 * p;
  };
  const roundTop = (bx, by, bw, bh) => {
    const r = Math.min(bw / 2, 6, bh);
    return `M${bx} ${by + bh} V${by + r} Q${bx} ${by} ${bx + r} ${by} H${bx + bw - r} Q${bx + bw} ${by} ${bx + bw} ${by + r} V${by + bh} Z`;
  };
  // Monotone cubic (Fritsch–Carlson): smooth, never overshoots the data
  const monotonePath = (pts) => {
    const n = pts.length;
    if (n < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    const dx = [], dy = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const c1x = pts[i][0] + dx[i] / 3, c1y = pts[i][1] + (t[i] * dx[i]) / 3;
      const c2x = pts[i + 1][0] - dx[i] / 3, c2y = pts[i + 1][1] - (t[i + 1] * dx[i]) / 3;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
    }
    return d;
  };

  /* ── Header: kicker · value + unit · range (updates on scrub) ─── */
  function header(fig, data) {
    const existing = fig.querySelector('.ds-chart-head');
    if (existing) return existing._api;
    const head = h('div', 'ds-chart-head', null);
    if (data.title) h('div', 'ds-chart-title', head, data.title);
    const kicker = h('div', 'ds-chart-kicker', head);
    const row = h('div', 'ds-chart-valuerow', head);
    const value = h('span', 'ds-chart-value', row);
    const unit = h('span', 'ds-chart-unit', row);
    const range = h('div', 'ds-chart-range', head);
    head.setAttribute('aria-live', 'polite');
    fig.querySelector('.ds-chart-plot').before(head);
    head._api = { set(k, v, u, r) { kicker.textContent = k || ''; value.textContent = v; unit.textContent = u || ''; range.textContent = r || ''; } };
    return head._api;
  }

  function legend(fig, series, kind) {
    if (series.length < 2 || fig.querySelector('.ds-chart-legend')) return;
    const ul = h('ul', 'ds-chart-legend', null);
    series.forEach((s) => {
      const li = h('li', '', ul);
      h('span', kind === 'line' ? 'ds-chart-key-line' : 'ds-chart-key-box', li).style.background = cvar(s.color);
      li.appendChild(document.createTextNode(s.name));
    });
    fig.querySelector('.ds-chart-plot').before(ul);
  }

  function tableView(fig, headRow, rows) {
    fig.querySelector('.ds-chart-table')?.remove();
    const d = h('details', 'ds-chart-table', fig);
    h('summary', '', d, 'View as table');
    const t = h('table', 'table', h('div', 'table-container', d));
    const tr = h('tr', '', h('thead', '', t));
    headRow.forEach((x) => h('th', '', tr, x));
    const tb = h('tbody', '', t);
    rows.forEach((r) => { const row = h('tr', '', tb); r.forEach((c) => h('td', '', row, c)); });
  }

  // y-axis on the trailing edge, 4 gridlines, familiar steps
  function yAxis(svg, lo, step, x0, x1, y, unit) {
    for (let k = 0; k <= 4; k++) {
      const v = lo + step * k, yy = y(v);
      svgEl('line', { x1: x0, x2: x1, y1: yy, y2: yy, class: k ? 'ds-chart-grid' : 'ds-chart-axis' }, svg);
      svgEl('text', { x: x1 + 8, y: yy + 4, class: 'ds-chart-tick' }, svg).textContent = withUnit(v, unit);
    }
  }

  // Scrub layer: whole plot is the target; arrows step; header follows
  function scrub(svg, { x0, x1, top, bottom, n, xAt, onSelect, onClear }) {
    const hit = svgEl('rect', { x: x0, y: top, width: Math.max(0, x1 - x0), height: Math.max(0, bottom - top), fill: 'transparent', tabindex: 0, class: 'ds-chart-hit' }, svg);
    let cur = n - 1;
    const pick = (e) => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      const px = ((e.clientX - r.left) / r.width) * vb.width;
      let best = 0, bd = Infinity;
      for (let i = 0; i < n; i++) { const d = Math.abs(xAt(i) - px); if (d < bd) { bd = d; best = i; } }
      cur = best; onSelect(cur);
    };
    hit.addEventListener('pointermove', pick);
    hit.addEventListener('pointerdown', pick);
    hit.addEventListener('focus', () => onSelect(cur));
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') cur = Math.max(0, cur - 1); else if (e.key === 'ArrowRight') cur = Math.min(n - 1, cur + 1); else return;
      e.preventDefault(); onSelect(cur);
    });
    hit.addEventListener('pointerleave', onClear); hit.addEventListener('blur', onClear);
  }

  /* ── Line (Stocks) ─────────────────────────────────────────────── */
  function line(fig, data, w) {
    const H = 240, m = { t: 10, r: 44, b: 26, l: 2 };
    const iw = w - m.l - m.r, ih = H - m.t - m.b, n = data.labels.length;
    const all = data.series.flatMap((s) => s.values);
    const lo = data.min ?? 0, step = niceStep(Math.max(...all) - lo), hi = lo + 4 * step;
    const x = (i) => m.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: 'img', 'aria-label': data.title || 'Line chart' });
    yAxis(svg, lo, step, m.l, w - m.r, y, data.unit);
    const every = Math.ceil(n / Math.max(2, Math.floor(iw / 70)));
    data.labels.forEach((l, i) => {
      if (i % every && i !== n - 1) return;
      svgEl('text', { x: x(i), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', class: 'ds-chart-tick' }, svg).textContent = l;
    });
    if (data.marker) {
      const mx = x(data.marker.index);
      svgEl('line', { x1: mx, x2: mx, y1: m.t, y2: m.t + ih, class: 'ds-chart-marker' }, svg);
      svgEl('text', { x: mx + 6, y: m.t + 12, class: 'ds-chart-marker-label' }, svg).textContent = data.marker.label;
    }
    const id = 'dsg' + ++uid, defs = svgEl('defs', {}, svg);
    data.series.forEach((s, si) => {
      const d = monotonePath(s.values.map((v, i) => [x(i), y(v)]));
      if (si === 0) {
        const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        svgEl('stop', { offset: '0', style: `stop-color:${cvar(s.color)};stop-opacity:.28` }, g);
        svgEl('stop', { offset: '1', style: `stop-color:${cvar(s.color)};stop-opacity:0` }, g);
        svgEl('path', { d: `${d} L${x(n - 1)} ${m.t + ih} L${x(0)} ${m.t + ih} Z`, fill: `url(#${id})` }, svg);
      }
      svgEl('path', { d, fill: 'none', stroke: cvar(s.color), 'stroke-width': 2.25, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    });
    const ind = svgEl('g', { class: 'ds-chart-indicator', visibility: 'hidden' }, svg);
    const rule = svgEl('line', { y1: m.t, y2: m.t + ih, class: 'ds-chart-cross' }, ind);
    const dots = data.series.map((s) => svgEl('circle', { r: 5, fill: cvar(s.color), class: 'ds-chart-dot' }, ind));
    const head = header(fig, data), lead = data.series[0];
    const rest = () => head.set(data.kicker || 'Average', withUnit(data.summary ?? avg(lead.values), data.unit), unitSuffix(data.unit), data.range);
    rest();
    scrub(svg, {
      x0: m.l, x1: w - m.r, top: m.t, bottom: m.t + ih, n, xAt: x,
      onSelect: (i) => {
        ind.setAttribute('visibility', 'visible'); rule.setAttribute('x1', x(i)); rule.setAttribute('x2', x(i));
        data.series.forEach((s, si) => { dots[si].setAttribute('cx', x(i)); dots[si].setAttribute('cy', y(s.values[i])); });
        head.set(data.labels[i], withUnit(lead.values[i], data.unit), unitSuffix(data.unit), data.series.length > 1 ? data.series.map((s) => `${s.name} ${withUnit(s.values[i], data.unit)}`).join(' · ') : lead.name);
      },
      onClear: () => { ind.setAttribute('visibility', 'hidden'); rest(); },
    });
    legend(fig, data.series, 'line');
    fig.querySelector('.ds-chart-plot').prepend(svg);
    tableView(fig, ['', ...data.series.map((s) => s.name)], data.labels.map((l, i) => [l, ...data.series.map((s) => withUnit(s.values[i], data.unit))]));
  }

  /* ── Bars (Health) ─────────────────────────────────────────────── */
  function bars(fig, data, w) {
    const H = 220, m = { t: 10, r: 44, b: 26, l: 2 };
    const iw = w - m.l - m.r, ih = H - m.t - m.b, n = data.values.length;
    const step = niceStep(Math.max(...data.values, data.goal || 0)), hi = 4 * step;
    const band = iw / n, bw = Math.max(3, Math.min(24, band * 0.62));
    const xc = (i) => m.l + band * i + band / 2;
    const y = (v) => m.t + ih - (v / hi) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: 'img', 'aria-label': data.title || 'Bar chart' });
    yAxis(svg, 0, step, m.l, w - m.r, y, data.unit);
    if (data.goal) {
      svgEl('line', { x1: m.l, x2: w - m.r, y1: y(data.goal), y2: y(data.goal), class: 'ds-chart-goal' }, svg);
      svgEl('text', { x: m.l + 2, y: y(data.goal) - 6, class: 'ds-chart-marker-label' }, svg).textContent = 'Goal ' + withUnit(data.goal, data.unit);
    }
    const every = Math.ceil(n / Math.max(2, Math.floor(iw / 44)));
    const g = svgEl('g', { class: 'ds-chart-bars' }, svg);
    const marks = data.values.map((v, i) => {
      const bx = xc(i) - bw / 2, by = y(v), bh = m.t + ih - by;
      if (i % every === 0 || i === n - 1) svgEl('text', { x: xc(i), y: H - 6, 'text-anchor': 'middle', class: 'ds-chart-tick' }, svg).textContent = data.labels[i];
      return svgEl('path', { d: roundTop(bx, by, bw, bh), fill: cvar(data.color), class: 'ds-chart-bar' }, g);
    });
    const head = header(fig, data);
    const rest = () => { g.classList.remove('is-scrubbing'); marks.forEach((b) => b.classList.remove('is-on')); head.set(data.kicker || 'Daily average', withUnit(data.summary ?? avg(data.values), data.unit), unitSuffix(data.unit), data.range); };
    rest();
    scrub(svg, {
      x0: m.l, x1: w - m.r, top: m.t, bottom: m.t + ih, n, xAt: xc,
      onSelect: (i) => { g.classList.add('is-scrubbing'); marks.forEach((b, j) => b.classList.toggle('is-on', j === i)); head.set(data.labels[i], withUnit(data.values[i], data.unit), unitSuffix(data.unit), data.range); },
      onClear: rest,
    });
    fig.querySelector('.ds-chart-plot').prepend(svg);
    tableView(fig, ['', data.title || 'Value'], data.labels.map((l, i) => [l, withUnit(data.values[i], data.unit)]));
  }

  /* ── Compare (before / after, grouped) ─────────────────────────── */
  function compare(fig, data, w) {
    const H = 220, m = { t: 22, r: 44, b: 26, l: 2 };
    const iw = w - m.l - m.r, ih = H - m.t - m.b, ns = data.series.length, nc = data.categories.length;
    const step = niceStep(Math.max(...data.series.flatMap((s) => s.values))), hi = 4 * step;
    const band = iw / nc, bw = Math.min(22, (band * 0.55) / ns), gap = 4, group = ns * bw + (ns - 1) * gap;
    const y = (v) => m.t + ih - (v / hi) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, role: 'img', 'aria-label': data.title || 'Comparison chart' });
    yAxis(svg, 0, step, m.l, w - m.r, y, data.unit);
    const g = svgEl('g', { class: 'ds-chart-bars' }, svg), groups = [];
    const pts = data.unit === '%';
    data.categories.forEach((c, ci) => {
      const cx = m.l + band * ci + band / 2, set = [];
      svgEl('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'ds-chart-tick' }, svg).textContent = c;
      data.series.forEach((s, si) => {
        const v = s.values[ci], bx = cx - group / 2 + si * (bw + gap), by = y(v), bh = m.t + ih - by;
        set.push(svgEl('path', { d: roundTop(bx, by, bw, bh), fill: cvar(s.color), class: 'ds-chart-bar' }, g));
        if (si === ns - 1) svgEl('text', { x: bx + bw / 2, y: by - 7, 'text-anchor': 'middle', class: 'ds-chart-label' }, svg).textContent = withUnit(v, data.unit);
      });
      groups.push(set);
    });
    const head = header(fig, data), after = data.series[ns - 1], before = data.series[0];
    const lift = (i) => after.values[i] - before.values[i];
    const liftTxt = (v) => '+' + (pts ? num(v) : withUnit(v, data.unit));
    const rest = () => { g.classList.remove('is-scrubbing'); g.querySelectorAll('.is-on').forEach((b) => b.classList.remove('is-on')); head.set(data.kicker || 'Average lift', liftTxt(avg(data.categories.map((_, i) => lift(i)))), pts ? 'pts' : unitSuffix(data.unit), `${before.name} → ${after.name}`); };
    rest();
    scrub(svg, {
      x0: m.l, x1: w - m.r, top: m.t, bottom: m.t + ih, n: nc, xAt: (i) => m.l + band * i + band / 2,
      onSelect: (i) => { g.classList.add('is-scrubbing'); groups.forEach((set, j) => set.forEach((b) => b.classList.toggle('is-on', j === i))); head.set(data.categories[i], withUnit(after.values[i], data.unit), '', `${before.name} ${withUnit(before.values[i], data.unit)} · ${liftTxt(lift(i))}${pts ? ' pts' : ''}`); },
      onClear: rest,
    });
    legend(fig, data.series, 'bars');
    fig.querySelector('.ds-chart-plot').prepend(svg);
    tableView(fig, ['', ...data.series.map((s) => s.name)], data.categories.map((c, i) => [c, ...data.series.map((s) => withUnit(s.values[i], data.unit))]));
  }

  /* ── Ring (Activity) ───────────────────────────────────────────── */
  function ring(fig, data) {
    const S = 132, sw = 16, r = (S - sw) / 2, c = 2 * Math.PI * r, pct = Math.min(data.value / data.goal, 1);
    const id = 'dsr' + ++uid;
    const svg = svgEl('svg', { viewBox: `0 0 ${S} ${S}`, width: S, height: S, role: 'img', 'aria-label': `${data.label}: ${withUnit(data.value, data.unit)} of ${withUnit(data.goal, data.unit)} goal` });
    const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, svgEl('defs', {}, svg));
    svgEl('stop', { offset: '0', style: `stop-color:${cvar(data.color)};stop-opacity:.75` }, g);
    svgEl('stop', { offset: '1', style: `stop-color:${cvar(data.color)}` }, g);
    svgEl('circle', { cx: S / 2, cy: S / 2, r, fill: 'none', 'stroke-width': sw, class: 'ds-ring-track' }, svg);
    svgEl('circle', { cx: S / 2, cy: S / 2, r, fill: 'none', stroke: `url(#${id})`, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-dasharray': `${c * pct} ${c}`, transform: `rotate(-90 ${S / 2} ${S / 2})`, class: 'ds-ring-arc' }, svg);
    const plot = fig.querySelector('.ds-chart-plot');
    plot.classList.add('ds-ring');
    plot.prepend(svg);
    const txt = h('div', 'ds-ring-text', plot);
    h('span', 'ds-ring-value', txt, Math.round((data.value / data.goal) * 100) + '%');
    h('span', 'ds-ring-label', txt, data.label);
  }

  /* ── Sparkline ─────────────────────────────────────────────────── */
  function spark(fig, data, w) {
    const H = 36, v = data.values, n = v.length, lo = Math.min(...v), hi = Math.max(...v);
    const x = (i) => 3 + (i * (w - 10)) / (n - 1), y = (d) => 5 + (H - 10) * (1 - (d - lo) / (hi - lo || 1));
    const svg = svgEl('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, 'aria-hidden': 'true' });
    svgEl('path', { d: monotonePath(v.map((d, i) => [x(i), y(d)])), fill: 'none', stroke: 'var(--chart-muted)', 'stroke-width': 1.75, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { cx: x(n - 1), cy: y(v[n - 1]), r: 3.5, fill: cvar(data.color), class: 'ds-chart-dot' }, svg);
    fig.querySelector('.ds-chart-plot').prepend(svg);
  }

  const TYPES = { line, bars, compare, ring, spark };

  // Stocks-style segmented time-range switcher (1M · 3M · 1Y…)
  function rangeControl(fig, data, redraw) {
    if (!data.ranges) return;
    const nav = h('div', 'ds-chart-ranges', null);
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Time range');
    const apply = (r) => Object.assign(data, { labels: r.labels, series: r.series, range: r.range, marker: r.marker });
    data.ranges.forEach((r, i) => {
      const b = h('button', '', nav, r.id);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(i === data.ranges.length - 1));
      b.addEventListener('click', () => {
        nav.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        apply(r); redraw(true);
      });
    });
    fig.querySelector('.ds-chart-plot').before(nav);
    apply(data.ranges[data.ranges.length - 1]);
  }

  function mount(fig) {
    const src = fig.querySelector('script[type="application/json"]');
    const type = fig.dataset.dsChart;
    if (!src || !TYPES[type] || fig.dataset.dsMounted) return;
    fig.dataset.dsMounted = '1';
    const data = JSON.parse(src.textContent);
    let plot = fig.querySelector('.ds-chart-plot');
    if (!plot) { plot = h('div', 'ds-chart-plot', null); src.before(plot); }
    let lastW = 0;
    const draw = (force) => {
      const w = Math.floor(plot.clientWidth);
      if (type !== 'ring' && (w < 80 || (w === lastW && force !== true))) return;
      lastW = w;
      plot.querySelectorAll('svg, .ds-ring-text').forEach((n) => n.remove());
      TYPES[type](fig, data, w);
    };
    rangeControl(fig, data, draw);
    draw(true);
    if (type !== 'ring') new ResizeObserver(() => draw()).observe(plot);
  }

  const init = () => document.querySelectorAll('[data-ds-chart]').forEach(mount);
  window.dsCharts = { init, mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
