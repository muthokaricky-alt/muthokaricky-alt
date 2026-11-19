// Pure functions: (theme, data) -> SVG string. No I/O here.
//
// Rules every card follows, because GitHub serves these through <img>:
//  - no external fonts, scripts or images; system font stacks only
//  - the un-animated state is the finished state, so reduced motion, static renderers and
//    screenshots all show the full card; animations only ever animate *from* hidden
//  - @media (prefers-reduced-motion: reduce) switches every animation off

import { SIGNATURE, ICON_GITHUB, ICON_LINKEDIN } from './paths.mjs';

export const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0d1117',
    card: '#0f151d',
    border: '#1f2a37',
    text: '#e6edf3',
    sub: '#9da7b3',
    faint: '#6e7681',
    accent: '#39d353',
    accent2: '#22c55e',
    violet: '#8b5cf6',
    blue: '#58a6ff',
    chip: '#141c26',
    chipBorder: '#253242',
    onAccent: '#06110a',
    star: '#e6edf3',
    glow: 0.16,
    heat: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  light: {
    name: 'light',
    bg: '#ffffff',
    card: '#ffffff',
    border: '#d0d7de',
    text: '#1f2328',
    sub: '#4b5563',
    faint: '#6b7280',
    accent: '#1a7f37',
    accent2: '#2da44e',
    violet: '#7c3aed',
    blue: '#0969da',
    chip: '#f6f8fa',
    chipBorder: '#d0d7de',
    onAccent: '#ffffff',
    star: '#1f2328',
    glow: 0.08,
    heat: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";

export const LANG_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#2bb5a0', // linguist's #3572a5 is too close to TypeScript's blue at this size
  CSS: '#663399',
  HTML: '#e34c26',
  'C#': '#178600',
  Java: '#b07219',
  Dockerfile: '#384d54',
  Shell: '#89e051',
  Other: '#8b949e',
};

// ---------- helpers ----------

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const r1 = (n) => Math.round(n * 10) / 10;
// Mono advance is 0.55em (Consolas) to 0.6em (Menlo/SF Mono); size layouts for the wider one.
const monoW = (s, size) => s.length * size * 0.6;

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svg(w, h, title, body, css = '', defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}</title>
<defs>${defs}</defs>
<style>
.m{font-family:${MONO}}.s{font-family:${SANS}}
.fi{animation:fi .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes fi{from{opacity:0;transform:translateY(6px)}}
.pulse{opacity:0;transform-box:fill-box;transform-origin:center;animation:pulse 2.6s cubic-bezier(.2,.8,.2,1) infinite}
@keyframes pulse{0%{opacity:.7;transform:scale(1)}70%,100%{opacity:0;transform:scale(2.8)}}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${body}
</svg>`;
}

// Card background with a thin border that glows green at the top-left and fades to violet.
function frame(t, w, h, rx = 16) {
  const defs = `
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${t.accent}" stop-opacity="${t.name === 'dark' ? 0.75 : 0.6}"/>
  <stop offset=".45" stop-color="${t.violet}" stop-opacity="${t.name === 'dark' ? 0.4 : 0.35}"/>
  <stop offset="1" stop-color="${t.border}"/>
</linearGradient>
<radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0) scale(${w * 0.55} ${h * 0.9})">
  <stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${w} ${h}) scale(${w * 0.5} ${h * 0.9})">
  <stop offset="0" stop-color="${t.violet}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/>
</radialGradient>`;
  const body = `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="${t.card}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="url(#glowA)"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="url(#glowB)"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="none" stroke="url(#edge)"/>`;
  return { defs, body };
}

// A pill: mono label with an optional dot. Returns { w, body } so callers can lay out a row.
function chip(t, x, y, label, { dot = null, size = 12, h = 26, pulse = false, delay = 0 } = {}) {
  const pad = 11;
  const dotW = dot ? 14 : 0;
  const w = Math.ceil(monoW(label, size) + pad * 2 + dotW);
  const cy = y + h / 2;
  const body = `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.chip}" stroke="${t.chipBorder}"/>
${dot ? `${pulse ? `<circle class="pulse" cx="${x + pad + 3.5}" cy="${cy}" r="3.5" fill="${dot}" style="animation-delay:${delay}s"/>` : ''}<circle cx="${x + pad + 3.5}" cy="${cy}" r="3.5" fill="${dot}"/>` : ''}
<text class="m" x="${x + pad + dotW}" y="${cy + size * 0.35}" font-size="${size}" fill="${t.sub}">${esc(label)}</text>
</g>`;
  return { w, body };
}

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${r1(pts[i][0])} ${r1(pts[i][1])} ${r1(mx)} ${r1(my)}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${r1(last[0])} ${r1(last[1])}`;
}

function sparkline(t, values, x, y, w, h, color, id, delay) {
  if (values.length < 2) {
    return `<line x1="${x}" y1="${y + h * 0.6}" x2="${x + w}" y2="${y + h * 0.6}" stroke="${color}" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>
<circle cx="${x + w}" cy="${y + h * 0.6}" r="3" fill="${color}"/>`;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [x + (i / (values.length - 1)) * w, y + h - ((v - min) / span) * h]);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>
<path class="area" style="animation-delay:${delay + 0.5}s" d="${line} L${x + w} ${y + h} L${x} ${y + h} Z" fill="url(#${id})"/>
<path class="draw" style="animation-delay:${delay}s" d="${line}" pathLength="1" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<circle class="pulse" style="animation-delay:${delay + 1.2}s" cx="${r1(last[0])}" cy="${r1(last[1])}" r="3.5" fill="${color}"/>
<circle cx="${r1(last[0])}" cy="${r1(last[1])}" r="3.5" fill="${color}"/>`;
}

const DRAW_CSS = `
.draw{stroke-dasharray:1;animation:draw 1.4s cubic-bezier(.65,0,.35,1) both}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.area{animation:fade 1s ease-out both}
@keyframes fade{from{opacity:0}}`;

export function relTime(iso, now) {
  const days = Math.floor((now - new Date(iso)) / 86400000);
  if (days <= 0) return 'updated today';
  if (days === 1) return 'updated yesterday';
  if (days < 14) return `updated ${days}d ago`;
  if (days < 60) return `updated ${Math.round(days / 7)}w ago`;
  return `updated ${Math.round(days / 30)}mo ago`;
}

const fmt = (n) => n.toLocaleString('en-US');

// ---------- hero ----------

export function hero(t, p) {
  const W = 840;
  const H = 300;
  const f = frame(t, W, H, 20);
  const rand = rng(11);

  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = r1(rand() * W);
    const y = r1(rand() * H);
    const r = r1(0.4 + rand() * 0.9);
    const o = r1(0.12 + rand() * 0.4);
    const tw = i % 3 === 0 ? ` class="tw" style="animation-delay:${r1(rand() * 5)}s;animation-duration:${r1(3 + rand() * 4)}s"` : '';
    stars += `<circle${tw} cx="${x}" cy="${y}" r="${r}" fill="${t.star}" opacity="${o}"/>`;
  }

  // Signature: each outline sub-path draws in left to right, then the filled glyphs fade in on top.
  const S = 0.84;
  const sx = 38;
  const sy = 74;
  const subs = SIGNATURE.d.split(/(?=M)/).filter(Boolean);
  const order = subs
    .map((d) => ({ d, x: Math.min(...[...d.matchAll(/[MLQCZ]?(-?[\d.]+) (-?[\d.]+)/g)].map((m) => +m[1])) }))
    .sort((a, b) => a.x - b.x);
  const strokes = order
    .map((s, i) => `<path class="sigs" style="animation-delay:${r1(0.25 + (i / order.length) * 1.7)}s" d="${s.d}" pathLength="1"/>`)
    .join('');

  const chips = [];
  let cx = 360;
  [
    ['Building', t.accent],
    ['Learning', t.blue],
    ['Shipping', t.violet],
  ].forEach(([label, color], i) => {
    const c = chip(t, cx, 220, label, { dot: color, pulse: true, delay: i * 0.8 });
    chips.push(`<g class="fi" style="animation-delay:${1.5 + i * 0.12}s">${c.body}</g>`);
    cx += c.w + 10;
  });

  const pillLabel = 'OPEN TO INTERNSHIPS';
  const pillW = Math.ceil(pillLabel.length * 11 * 0.6 + pillLabel.length * 0.8 + 40);
  const pillX = W - 24 - pillW;

  const css = `
.tw{animation:tw 4s ease-in-out infinite}
@keyframes tw{50%{opacity:.04}}
.sigs{fill:none;stroke:${t.accent};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0;animation:sig .9s cubic-bezier(.65,0,.35,1) both}
@keyframes sig{from{stroke-dashoffset:1}}
.sigf{animation:sigf .9s ease-out 1.9s both}
@keyframes sigf{from{opacity:0}}
.swash{stroke-dasharray:1;animation:sig 1s cubic-bezier(.65,0,.35,1) 2s both}
${DRAW_CSS}`;

  const defs = `${f.defs}
<filter id="soft" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="${t.name === 'dark' ? 3 : 1.5}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="div" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.border}" stop-opacity="0"/><stop offset=".5" stop-color="${t.border}"/><stop offset="1" stop-color="${t.border}" stop-opacity="0"/></linearGradient>
<linearGradient id="ink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>`;

  const body = `${f.body}
<g>${stars}</g>
<g filter="url(#soft)">
  <g transform="translate(${sx} ${sy}) scale(${S})">
    ${strokes}
    <path class="sigf" d="${SIGNATURE.d}" fill="url(#ink)"/>
  </g>
  <path class="swash" pathLength="1" d="M${sx + 6} ${sy + 152} C ${sx + 90} ${sy + 138}, ${sx + 190} ${sy + 146}, ${sx + 272} ${sy + 128}" fill="none" stroke="${t.violet}" stroke-width="2" stroke-linecap="round" stroke-opacity=".8"/>
</g>
<rect x="334" y="64" width="1" height="190" fill="url(#div)"/>

<g class="fi" style="animation-delay:.2s">
  <rect x="${pillX}" y="22" width="${pillW}" height="28" rx="14" fill="${t.accent}" fill-opacity=".12" stroke="${t.accent}" stroke-opacity=".55"/>
  <circle class="pulse" cx="${pillX + 16}" cy="36" r="4" fill="${t.accent}"/>
  <circle cx="${pillX + 16}" cy="36" r="4" fill="${t.accent}"/>
  <text class="m" x="${pillX + 28}" y="40" font-size="11" font-weight="700" letter-spacing=".8" fill="${t.accent}">${pillLabel}</text>
</g>

<text class="m fi" style="animation-delay:.5s" x="360" y="88" font-size="13" fill="${t.accent}">$ whoami</text>
<text class="s fi" style="animation-delay:.7s" x="358" y="134" font-size="38" font-weight="800" letter-spacing="-.5" fill="${t.text}">${esc(p.name)}</text>
<text class="s fi" style="animation-delay:.9s" x="360" y="166" font-size="18" fill="${t.sub}">${esc(p.title)}</text>
<text class="s fi" style="animation-delay:1.1s" x="360" y="196" font-size="15" fill="${t.text}" fill-opacity=".85">${esc(p.pitch)}</text>
${chips.join('\n')}
<text class="m fi" style="animation-delay:1.9s" x="360" y="276" font-size="12" fill="${t.faint}">${esc(p.location)} · github.com/${esc(p.login)}</text>`;

  return svg(W, H, `${p.name}. ${p.title}. ${p.pitch} Open to internships.`, body, css, defs);
}

// ---------- terminal ----------

const MONOGRAM = [
  '██████╗ ███╗   ███╗',
  '██╔══██╗████╗ ████║',
  '██████╔╝██╔████╔██║',
  '██╔══██╗██║╚██╔╝██║',
  '██║  ██║██║ ╚═╝ ██║',
  '╚═╝  ╚═╝╚═╝     ╚═╝',
];

// Drawn as shapes, not text, so it lines up identically in every font.
function monogram(t, x0, y0, cw, ch) {
  const lines = [];
  let blocks = '';
  MONOGRAM.forEach((row, r) => {
    // merge each run of full blocks into one rect so there are no hairline seams between cells
    for (const m of row.matchAll(/█+/g)) blocks += `<rect x="${x0 + m.index * cw}" y="${y0 + r * ch - 0.25}" width="${m[0].length * cw}" height="${ch + 0.5}"/>`;
    [...row].forEach((c, i) => {
      const x = x0 + i * cw;
      const y = y0 + r * ch;
      const mx = x + cw / 2;
      const my = y + ch / 2;
      if (c === '═') lines.push(`M${x} ${my}H${x + cw}`);
      else if (c === '║') lines.push(`M${mx} ${y}V${y + ch}`);
      else if (c === '╔') lines.push(`M${x + cw} ${my}H${mx}V${y + ch}`);
      else if (c === '╗') lines.push(`M${x} ${my}H${mx}V${y + ch}`);
      else if (c === '╚') lines.push(`M${mx} ${y}V${my}H${x + cw}`);
      else if (c === '╝') lines.push(`M${mx} ${y}V${my}H${x}`);
    });
  });
  return `<path d="${lines.join('')}" fill="none" stroke="${t.violet}" stroke-opacity=".7" stroke-width="1.4"/>
<g fill="url(#mono)">${blocks}</g>`;
}

export function terminal(t, info) {
  const W = 840;
  const H = 372;
  const f = frame(t, W, H, 14);
  const cmd = 'neofetch --live';

  // Typing: each character appears on its own beat. fill-opacity (not opacity) because it works on <tspan>.
  const typed = [...cmd]
    .map((c, i) => `<tspan class="k" style="animation-delay:${r1(0.5 + i * 0.07)}s">${esc(c)}</tspan>`)
    .join('');
  const typedEnd = 0.5 + cmd.length * 0.07;

  const rows = [
    ['Subject', info.subject],
    ['Handle', info.handle],
    ['Role', info.role],
    ['Status', info.status],
    ['Stack', info.stack],
    ['Uptime', info.uptime],
    ['Activity', info.activity],
    ['Repos', info.repos],
    ['Contact', info.contact],
  ];
  const X = 276;
  const VX = 370;
  const out = rows
    .map(
      ([k, v], i) => `<g class="fi" style="animation-delay:${r1(typedEnd + 0.35 + i * 0.07)}s">
  <text class="m" x="${X}" y="${152 + i * 21}" font-size="13" font-weight="700" fill="${k === 'Status' ? t.accent : t.blue}">${k}</text>
  <text class="m" x="${VX}" y="${152 + i * 21}" font-size="13" fill="${k === 'Status' ? t.accent : t.text}">${esc(v)}</text>
</g>`,
    )
    .join('\n');

  const palette = [t.heat[1], t.heat[2], t.heat[3], t.accent, t.blue, t.violet, '#f78166', '#e3b341']
    .map((c, i) => `<rect x="${X + i * 26}" y="${338}" width="22" height="12" rx="3" fill="${c}"/>`)
    .join('');

  const css = `
.k{fill-opacity:1;animation:k .01s steps(1) both}
@keyframes k{from{fill-opacity:0}}
.cur{animation:k .01s steps(1) ${r1(typedEnd)}s both,blink 1.1s steps(1) ${r1(typedEnd)}s infinite}
@keyframes blink{50%{fill-opacity:0}}`;

  const defs = `${f.defs}
<linearGradient id="mono" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>`;

  const art = monogram(t, 30, 160, 11, 20);
  const body = `${f.body}
<rect x="1" y="1" width="${W - 2}" height="34" rx="13" fill="${t.chip}" fill-opacity=".7"/>
<rect x="1" y="34" width="${W - 2}" height="1" fill="${t.border}"/>
<circle cx="22" cy="18" r="6" fill="#ff5f57"/><circle cx="42" cy="18" r="6" fill="#febc2e"/><circle cx="62" cy="18" r="6" fill="#28c840"/>
<text class="m" x="${W / 2}" y="22" font-size="12" text-anchor="middle" fill="${t.faint}">rick@github: ~</text>

<text class="m" x="28" y="70" font-size="14" xml:space="preserve"><tspan fill="${t.accent}" font-weight="700">rick@github</tspan><tspan fill="${t.blue}"> ~ </tspan><tspan fill="${t.text}">$ </tspan><tspan fill="${t.text}">${typed}</tspan><tspan class="cur" fill="${t.accent}"> ▋</tspan></text>

<g class="fi" style="animation-delay:${r1(typedEnd + 0.2)}s">${art}</g>

<g class="fi" style="animation-delay:${r1(typedEnd + 0.3)}s">
  <text class="m" x="${X}" y="112" font-size="14" font-weight="700"><tspan fill="${t.accent}">rick</tspan><tspan fill="${t.text}">@</tspan><tspan fill="${t.accent}">github</tspan></text>
  <rect x="${X}" y="122" width="120" height="1.5" fill="${t.border}"/>
</g>
${out}
<g class="fi" style="animation-delay:${r1(typedEnd + 1.1)}s">${palette}</g>`;

  const title = `neofetch: ${rows.map(([k, v]) => `${k}: ${v}`).join('. ')}`;
  return svg(W, H, title, body, css, defs);
}

// ---------- stats ----------

export function stats(t, tiles) {
  const W = 840;
  const H = 156;
  const gap = 12;
  const tw = (W - gap * 3) / 4;
  const colors = [t.accent, t.blue, '#e3b341', t.violet];
  let defs = '';
  let body = '';
  tiles.forEach((tile, i) => {
    const x = i * (tw + gap);
    const c = colors[i];
    const f = frame(t, tw, H, 14);
    // each tile is its own nested <svg> so the frame's gradient ids don't need renaming
    defs += '';
    body += `<svg x="${r1(x)}" y="0" width="${r1(tw)}" height="${H}" viewBox="0 0 ${r1(tw)} ${H}" overflow="visible">
<defs>${f.defs.replace(/id="(edge|glowA|glowB)"/g, `id="$1${i}"`)}</defs>
${f.body.replace(/url\(#(edge|glowA|glowB)\)/g, `url(#$1${i})`)}
<g class="fi" style="animation-delay:${r1(0.1 + i * 0.1)}s">
  <circle cx="20" cy="24" r="4" fill="${c}"/>
  <text class="m" x="32" y="28" font-size="11" letter-spacing=".8" fill="${t.faint}">${esc(tile.label.toUpperCase())}</text>
  <text class="s" x="16" y="66" font-size="32" font-weight="800" letter-spacing="-.5" fill="${t.text}">${esc(fmt(tile.value))}</text>
  <text class="m" x="16" y="86" font-size="11" fill="${t.sub}">${esc(tile.caption)}</text>
</g>
${sparkline(t, tile.series, 16, 100, tw - 32, 38, c, `sp${i}`, 0.4 + i * 0.12)}
</svg>`;
  });
  const title = tiles.map((x) => `${x.label}: ${fmt(x.value)} (${x.caption})`).join('. ');
  return svg(W, H, title, body, DRAW_CSS, defs);
}

// ---------- heatmap ----------

export function heatmap(t, h) {
  const W = 840;
  const H = 214;
  const f = frame(t, W, H, 16);
  const x0 = 52;
  const step = r1((W - 24 - x0) / Math.ceil((h.days.length + new Date(h.days[0].date + 'T00:00:00Z').getUTCDay()) / 7));
  const cell = r1(step - 3);
  const y0 = 72;

  // Columns are weeks starting on Sunday, like GitHub's own graph.
  const first = new Date(h.days[0].date + 'T00:00:00Z');
  const lead = first.getUTCDay();
  let cells = '';
  let months = '';
  let lastMonth = -1;
  const cols = Math.ceil((h.days.length + lead) / 7);
  for (let c = 0; c < cols; c++) {
    let col = '';
    for (let r = 0; r < 7; r++) {
      const idx = c * 7 + r - lead;
      if (idx < 0 || idx >= h.days.length) continue;
      const d = h.days[idx];
      col += `<rect x="${x0 + c * step}" y="${y0 + r * step}" width="${cell}" height="${cell}" rx="2.5" fill="${t.heat[d.level]}"><title>${d.count} on ${d.date}</title></rect>`;
      const m = new Date(d.date + 'T00:00:00Z').getUTCMonth();
      if (r === 0 || idx === 0) {
        if (m !== lastMonth && c < cols - 1) {
          if (lastMonth !== -1 || new Date(d.date + 'T00:00:00Z').getUTCDate() <= 7)
            months += `<text class="m" x="${x0 + c * step}" y="${y0 - 10}" font-size="10" fill="${t.faint}">${new Date(d.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`;
          lastMonth = m;
        }
      }
    }
    cells += `<g class="col" style="animation-delay:${r1(0.2 + c * 0.018)}s">${col}</g>`;
  }
  const dayLabels = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(([r, l]) => `<text class="m" x="20" y="${y0 + r * step + 9}" font-size="10" fill="${t.faint}">${l}</text>`)
    .join('');

  const legendX = W - 24 - (5 * step + 64);
  const legend =
    `<text class="m" x="${legendX}" y="${y0 + 7 * step + 22}" font-size="10" fill="${t.faint}">less</text>` +
    t.heat.map((c, i) => `<rect x="${legendX + 32 + i * step}" y="${y0 + 7 * step + 13}" width="${cell}" height="${cell}" rx="2.5" fill="${c}"/>`).join('') +
    `<text class="m" x="${legendX + 32 + 5 * step + 4}" y="${y0 + 7 * step + 22}" font-size="10" fill="${t.faint}">more</text>`;

  const facts = `longest streak ${h.longest}d · current ${h.current}d · best day ${h.best}`;
  const css = `.col{animation:fade .5s ease-out both}@keyframes fade{from{opacity:0}}`;
  const body = `${f.body}
<g class="fi">
  <text class="s" x="24" y="36" font-size="17" font-weight="700" fill="${t.text}">${fmt(h.total)} contributions <tspan fill="${t.sub}" font-weight="400">in the last year</tspan></text>
  <text class="m" x="${W - 24}" y="36" font-size="11" text-anchor="end" fill="${t.sub}">${esc(facts)}</text>
</g>
${months}${dayLabels}
${cells}
${legend}
<text class="m" x="24" y="${y0 + 7 * step + 22}" font-size="10" fill="${t.faint}">${esc(h.note)}</text>`;
  return svg(W, H, `${fmt(h.total)} contributions in the last year. ${facts}.`, body, css, f.defs);
}

// ---------- languages ----------

export function languages(t, langs, repoCount) {
  const W = 840;
  const rowsPerCol = Math.ceil(langs.length / 2);
  const H = 100 + rowsPerCol * 32 + 6;
  const f = frame(t, W, H, 16);
  const bx = 24;
  const bw = W - 48;

  let acc = 0;
  const segs = langs
    .map((l, i) => {
      const w = Math.max(l.pct * bw, 2);
      const s = `<rect class="grow" style="animation-delay:${r1(0.2 + i * 0.08)}s" x="${r1(bx + acc)}" y="58" width="${r1(w)}" height="10" fill="${l.color}"/>`;
      acc += l.pct * bw;
      return s;
    })
    .join('');

  const colW = (W - 48 - 32) / 2;
  const rows = langs
    .map((l, i) => {
      const col = Math.floor(i / rowsPerCol);
      const row = i % rowsPerCol;
      const x = 24 + col * (colW + 32);
      const y = 104 + row * 32;
      const pct = `${(l.pct * 100).toFixed(1)}%`;
      const barX = x + 120;
      const barW = colW - 120 - 56;
      return `<g class="fi" style="animation-delay:${r1(0.5 + i * 0.07)}s">
  <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${l.color}"/>
  <text class="s" x="${x + 18}" y="${y}" font-size="14" fill="${t.text}">${esc(l.name)}</text>
  <rect x="${barX}" y="${y - 8}" width="${r1(barW)}" height="6" rx="3" fill="${t.chip}" stroke="${t.chipBorder}" stroke-width=".5"/>
  <rect class="grow" style="animation-delay:${r1(0.7 + i * 0.07)}s" x="${barX}" y="${y - 8}" width="${r1(Math.max(barW * (l.pct / langs[0].pct), 3))}" height="6" rx="3" fill="${l.color}"/>
  <text class="m" x="${x + colW}" y="${y}" font-size="12" text-anchor="end" fill="${t.sub}">${pct}</text>
</g>`;
    })
    .join('\n');

  const css = `.grow{transform-box:fill-box;transform-origin:left;animation:grow .9s cubic-bezier(.2,.8,.2,1) both}
@keyframes grow{from{transform:scaleX(0)}}`;
  const defs = `${f.defs}<clipPath id="bar"><rect x="${bx}" y="58" width="${bw}" height="10" rx="5"/></clipPath>`;
  const body = `${f.body}
<g class="fi">
  <text class="s" x="24" y="38" font-size="17" font-weight="700" fill="${t.text}">Languages</text>
  <text class="m" x="${W - 24}" y="38" font-size="11" text-anchor="end" fill="${t.sub}">each of my ${repoCount} original repos weighted equally</text>
</g>
<g clip-path="url(#bar)"><rect x="${bx}" y="58" width="${bw}" height="10" fill="${t.chip}"/>${segs}</g>
${rows}`;
  const title = `Languages across ${repoCount} original repos, each repo weighted equally: ${langs.map((l) => `${l.name} ${(l.pct * 100).toFixed(1)}%`).join(', ')}.`;
  return svg(W, H, title, body, css, defs);
}

// ---------- project cards ----------

const GLYPHS = {
  ball: `<circle cx="20" cy="20" r="10"/><path d="M20 15.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" fill="currentColor"/><path d="M20 10v5.5M24.3 18.6l5.2-1.7M22.7 23.6l3.2 4.3M17.3 23.6l-3.2 4.3M15.7 18.6l-5.2-1.7"/>`,
  play: `<rect x="10" y="11" width="20" height="18" rx="4"/><path d="M18 16v8l6.5-4z" fill="currentColor"/>`,
  pitch: `<rect x="9" y="12" width="22" height="16" rx="2"/><path d="M20 12v16"/><circle cx="20" cy="20" r="3.2"/><path d="M9 16.5h3.5v7H9M31 16.5h-3.5v7H31"/>`,
  seat: `<path d="M13 10.5h14v9H13z"/><path d="M11 19.5h18v4H11zM13.5 23.5V30M26.5 23.5V30"/>`,
  bridge: `<path d="M8 25h24M11 25v5M29 25v5M20 25v5M10 25c3-9 17-9 20 0"/><path d="M14 21.2V25M26 21.2V25M20 19v6"/>`,
  more: `<rect x="11" y="11" width="7" height="7" rx="2"/><rect x="22" y="11" width="7" height="7" rx="2"/><rect x="11" y="22" width="7" height="7" rx="2"/><rect x="22" y="22" width="7" height="7" rx="2"/>`,
};

function iconTile(t, x, y, glyph) {
  return `<g transform="translate(${x} ${y})">
<rect width="40" height="40" rx="11" fill="url(#tile)"/>
<g fill="none" stroke="${t.onAccent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="${t.onAccent}">${GLYPHS[glyph]}</g>
</g>`;
}

const TILE_DEF = (t) =>
  `<linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.name === 'dark' ? '#7c5cf0' : t.violet}"/></linearGradient>`;

export function projectCard(t, p, now) {
  const W = 420;
  const H = 230;
  const f = frame(t, W, H, 16);
  const lines = wrap(p.desc, 46).slice(0, 2);

  // chips: as many as fit on one row
  let cx = 20;
  const chips = [];
  for (const s of p.stack) {
    const w = Math.ceil(monoW(s, 11) + 18);
    if (cx + w > W - 20) break;
    chips.push(`<rect x="${cx}" y="186" width="${w}" height="24" rx="12" fill="${t.chip}" stroke="${t.chipBorder}"/>
<text class="m" x="${cx + 9}" y="202" font-size="11" fill="${t.sub}">${esc(s)}</text>`);
    cx += w + 6;
  }

  const live = p.demo
    ? `<g>
  <rect x="${W - 20 - 60}" y="20" width="60" height="22" rx="11" fill="${t.accent}" fill-opacity=".12" stroke="${t.accent}" stroke-opacity=".5"/>
  <circle class="pulse" cx="${W - 20 - 60 + 13}" cy="31" r="3.5" fill="${t.accent}"/>
  <circle cx="${W - 20 - 60 + 13}" cy="31" r="3.5" fill="${t.accent}"/>
  <text class="m" x="${W - 20 - 60 + 22}" y="35" font-size="10.5" font-weight="700" letter-spacing=".8" fill="${t.accent}">LIVE</text>
</g>`
    : '';

  const meta = [p.stars > 0 ? `★ ${p.stars}` : null, relTime(p.pushedAt, now)].filter(Boolean).join(' · ');

  const body = `${f.body}
<g class="fi">
  ${iconTile(t, 20, 20, p.icon)}
  <text class="s" x="72" y="37" font-size="20" font-weight="700" fill="${t.text}">${esc(p.name)}</text>
  <text class="m" x="72" y="56" font-size="11" fill="${t.faint}">${esc(p.kind)}</text>
  ${live}
</g>
<g class="fi" style="animation-delay:.15s">
  ${lines.map((l, i) => `<text class="s" x="20" y="${92 + i * 21}" font-size="15" fill="${t.text}" fill-opacity=".88">${esc(l)}</text>`).join('')}
  ${p.highlight ? `<text class="m" x="20" y="158" font-size="11.5" fill="${t.accent}">${esc('› ' + p.highlight)}</text>` : ''}
</g>
<g class="fi" style="animation-delay:.3s">${chips.join('')}</g>
<text class="m" x="${W - 20}" y="${p.demo ? 60 : 36}" font-size="11" text-anchor="end" fill="${t.faint}">${esc(meta)}</text>`;

  const title = `${p.name}: ${p.desc} ${p.highlight || ''}. Built with ${p.stack.join(', ')}.${p.demo ? ' Live demo available.' : ''} ${meta}.`;
  return svg(W, H, title, body, '', f.defs + TILE_DEF(t));
}

export function moreCard(t, info) {
  const W = 420;
  const H = 230;
  const f = frame(t, W, H, 16);
  // wrap on the separators so a two-word name never splits across lines
  const lines = [];
  for (const n of info.names) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' · ' + n).length <= 42) lines[lines.length - 1] = cur + ' · ' + n;
    else lines.push(n);
  }
  lines.splice(3);
  const body = `${f.body}
<g class="fi">
  ${iconTile(t, 20, 20, 'more')}
  <text class="s" x="72" y="37" font-size="20" font-weight="700" fill="${t.text}">${info.count} public repos</text>
  <text class="m" x="72" y="56" font-size="11" fill="${t.faint}">${info.original} original projects, plus forks</text>
</g>
<g class="fi" style="animation-delay:.15s">
  <text class="m" x="20" y="92" font-size="11" fill="${t.faint}">ALSO WORTH A LOOK</text>
  ${lines.map((l, i) => `<text class="s" x="20" y="${118 + i * 21}" font-size="15" fill="${t.text}" fill-opacity=".88">${esc(l)}</text>`).join('')}
</g>
<g class="fi" style="animation-delay:.3s">
  <rect x="20" y="186" width="148" height="24" rx="12" fill="${t.accent}" fill-opacity=".12" stroke="${t.accent}" stroke-opacity=".5"/>
  <text class="m" x="32" y="202" font-size="11" font-weight="700" fill="${t.accent}">Browse all repos →</text>
</g>`;
  return svg(W, H, `${info.count} public repositories. Also worth a look: ${info.names.join(', ')}.`, body, '', f.defs + TILE_DEF(t));
}

// ---------- contact buttons ----------

const MAIL = `<path d="M3 6.5h18v11H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 7l8.5 6.5L20.5 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`;

export function button(t, kind) {
  const W = 176;
  const H = 44;
  const icon = { github: `<path d="${ICON_GITHUB}" fill="currentColor"/>`, linkedin: `<path d="${ICON_LINKEDIN}" fill="currentColor"/>`, email: MAIL }[kind];
  const label = { github: 'GitHub', linkedin: 'LinkedIn', email: 'Email me' }[kind];
  const primary = kind === 'email';
  const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${H / 2}" fill="${primary ? t.accent : t.card}" fill-opacity="${primary ? (t.name === 'dark' ? 0.14 : 0.1) : 1}" stroke="${primary ? t.accent : t.chipBorder}" stroke-opacity="${primary ? 0.7 : 1}"/>
<g transform="translate(22 12) scale(.83)" color="${primary ? t.accent : t.text}">${icon}</g>
<text class="m" x="52" y="27" font-size="14" font-weight="600" fill="${primary ? t.accent : t.text}">${label}</text>`;
  return svg(W, H, label, body);
}
