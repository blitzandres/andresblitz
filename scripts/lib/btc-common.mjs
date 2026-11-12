// Shared helpers for the /bitcoin/ bake: stats from history.json, formatting, the share image and sitemap lastmod.
// Every number on the Bitcoin pages comes from bitcoin/history.json (Yahoo Finance BTC-USD daily closes).
import fs from 'node:fs';
export const ROOT = new URL('../..', import.meta.url).pathname;
export const R = (p) => ROOT + p;
export const ORIGIN = 'https://andresblitz.com';
export const OG = `${ORIGIN}/bitcoin/og.png`;
export const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const num = (n) => n.toLocaleString('en-US');
export const usd = (n, d = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const k = (n) => n === 0 ? '$0' : '$' + (n / 1000).toLocaleString('en-US') + 'k';
export const pct = (a, b) => (b ? a / b * 100 : 0).toFixed(1) + '%';
export const dl = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
export const ds = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
export const dlEs = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('es-ES', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
export const numEs = (n) => n.toLocaleString('es-ES', { useGrouping: 'always' });
export const usdEs = (n, d = 0) => 'US$' + n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
export const pctEs = (a, b) => (b ? a / b * 100 : 0).toFixed(1).replace('.', ',') + ' %';
export const pt = (s) => new Date(s).toLocaleString('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

// Completed days only: a bar dated today (UTC) or later is never counted, same rule as /bitcoin/app.js.
export function stats(out, size = 10000) {
  const today = iso(Date.now());
  const rows = out.closes.filter(([d, v]) => d < today && v > 0).sort((a, b) => a[0].localeCompare(b[0]));
  const n = rows.length, counts = new Map();
  let peak = rows[0], low = rows[0];
  for (const r of rows) {
    const b = Math.floor(r[1] / size) * size;
    counts.set(b, (counts.get(b) || 0) + 1);
    if (r[1] > peak[1]) peak = r;
    if (r[1] < low[1]) low = r;
  }
  const hi = Math.max(0, ...counts.keys()), keys = [];
  for (let b = hi; b >= 0; b -= size) keys.push(b);
  const last = rows.at(-1);
  const top = keys.reduce((a, b) => ((counts.get(b) || 0) > (counts.get(a) || 0) ? b : a), keys[0]);
  return { rows, n, counts, keys, size, first: rows[0], last, peak, low, top, lastBracket: Math.floor(last[1] / size) * size };
}

export function above(s, t) {
  const hits = s.rows.filter((r) => r[1] > t);
  let best = 0, run = 0, bestEnd = null, cur = 0;
  // Longest run of consecutive stored daily closes above the level.
  for (const r of s.rows) { if (r[1] > t) { run++; if (run > best) { best = run; bestEnd = r[0]; } } else run = 0; }
  for (let i = s.rows.length - 1; i >= 0 && s.rows[i][1] > t; i--) cur++;
  const years = new Map();
  for (const r of hits) { const y = r[0].slice(0, 4); years.set(y, (years.get(y) || 0) + 1); }
  let bestStart = null;
  if (bestEnd) { const i = s.rows.findIndex((r) => r[0] === bestEnd); bestStart = s.rows[i - best + 1][0]; }
  return { t, days: hits.length, first: hits[0] || null, recent: hits.at(-1) || null, best, bestStart, bestEnd, cur, years };
}

// Sitemap: lastmod of /bitcoin/ pages follows the last completed daily close in history.json.
export function sitemapLastmod(date) {
  const f = R('sitemap.xml');
  const s = fs.readFileSync(f, 'utf8');
  const o = s.replace(/(<loc>https:\/\/andresblitz\.com\/bitcoin\/[^<]*<\/loc>\s*<lastmod>)[^<]*(<\/lastmod>)/g, `$1${date}$2`);
  if (o !== s) fs.writeFileSync(f, o);
}

// 1200x630 share image (cream paper, amber bars, deeper orange for the bracket of the last close).
export function ogSvg(s) {
  const W = 1200, H = 630, left = 176, right = 250, top = 168, bottom = 566;
  const keys = s.keys, nRows = keys.length;
  const rowH = Math.min(34, (bottom - top) / nRows), bh = Math.max(10, rowH - 9);
  const maxD = Math.max(...keys.map((b) => s.counts.get(b) || 0));
  const plotW = W - left - right;
  let bars = '';
  keys.forEach((b, i) => {
    const d = s.counts.get(b) || 0, cy = top + i * rowH + rowH / 2, w = d ? Math.max(3, d / maxD * plotW) : 0, cur = b === s.lastBracket;
    bars += `<text x="${left - 14}" y="${cy + 6}" text-anchor="end" font-size="18" fill="#44403C">${esc(k(b) + '–' + k(b + s.size))}</text>`;
    if (w) bars += `<rect x="${left}" y="${cy - bh / 2}" width="${w.toFixed(1)}" height="${bh}" rx="3" fill="${cur ? '#EA580C' : '#F59E0B'}"/>`;
    if (d) bars += `<text x="${left + w + 10}" y="${cy + 6}" font-size="18" fill="#44403C">${num(d)} days · ${pct(d, s.n)}${cur ? '<tspan dx="12" fill="#EA580C" font-weight="700">‹ last close</tspan>' : ''}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Archivo">
<rect width="${W}" height="${H}" fill="#FFFBF6"/>
<rect x="0" y="0" width="${W}" height="8" fill="#F59E0B"/>
<text x="64" y="86" font-size="46" font-weight="700" fill="#1C1917">Bitcoin: days spent at each price</text>
<text x="64" y="128" font-size="22" fill="#57534E">Days BTC/USD closed in each $10,000 bracket · ${esc(ds(s.first[0]))} – ${esc(ds(s.last[0]))} · ${num(s.n)} daily closes</text>
${bars}
<line x1="64" y1="${H - 46}" x2="${W - 64}" y2="${H - 46}" stroke="#E7E5E4" stroke-width="2"/>
<text x="64" y="${H - 16}" font-size="20" font-weight="700" fill="#C2410C">andresblitz.com/bitcoin</text>
<text x="${W - 64}" y="${H - 16}" text-anchor="end" font-size="18" fill="#57534E">Yahoo Finance BTC-USD daily closes · last close ${esc(usd(s.last[1]))} on ${esc(ds(s.last[0]))}</text>
</svg>`;
}

export async function writeOg(s, force) {
  const file = R('bitcoin/og.png');
  if (!force && fs.existsSync(file)) return false;
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const fonts = [R('scripts/fonts/Archivo-400.ttf'), R('scripts/fonts/Archivo-700.ttf')];
    const png = new Resvg(ogSvg(s), { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Archivo' }, fitTo: { mode: 'width', value: 1200 } }).render().asPng();
    fs.writeFileSync(file, png);
    return true;
  } catch (e) { console.log('btc og image: skipped,', e.message); return false; }
}
