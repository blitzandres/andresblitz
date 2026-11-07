#!/usr/bin/env node
// Bakes /bitcoin/: daily Bitcoin closes in USD for the days-in-bracket chart.
// Source: CoinGecko public API only (same single BTC series as the rates feed and RealWealth), keyless.
// CoinGecko's public API only serves the past 365 days, so history starts at the first day we stored and
// grows by one day per UTC day from then on. It is never backfilled from another source.
// A completed UTC day's close = CoinGecko's daily price stamped 00:00 UTC of the next day.
// Called from GitHub Actions; fetches only when a completed day is missing. A failed or empty response
// never overwrites good data (exit 0, last good file kept).
// Usage: node scripts/bake-btc-history.mjs [--force]
import fs from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname, R = (p) => ROOT + p;
const FILE = 'bitcoin/history.json', PAGE = 'bitcoin/index.html';
const UA = { 'User-Agent': 'andresblitz.com rates bot (+https://andresblitz.com/bitcoin/)', Accept: 'application/json' };
const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch { return d; } };

const prev = readJson(FILE, null);
const closes = new Map((prev?.closes || []).map(([d, v]) => [d, v]));
const today = iso(Date.now()), yesterday = iso(Date.now() - DAY);
const last = [...closes.keys()].sort().pop();
let changed = false;

if (process.argv.includes('--force') || !last || last < yesterday) {
  const gap = last ? Math.ceil((Date.parse(yesterday) - Date.parse(last)) / DAY) + 2 : 365;
  const days = Math.min(365, Math.max(2, gap));
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    let added = 0;
    for (const [t, p] of j.prices || []) {
      if (t % DAY !== 0 || !(p > 0)) continue;          // only the 00:00 UTC daily points (skip the live last point)
      const d = iso(t - DAY);                           // 00:00 UTC on D = close of D-1
      if (d >= today || closes.has(d)) continue;        // never rewrite a stored close
      const ref = closes.get(iso(t - 2 * DAY));
      if (ref && (p < ref * 0.5 || p > ref * 2)) { console.log(`btc: implausible close ${d} ${p}`); continue; }
      closes.set(d, Math.round(p * 100) / 100); added++;
    }
    console.log(`btc history: +${added} day(s)`);
    if (added) changed = true;
  } catch (e) { console.log('btc history: coingecko failed, keeping last good data:', e.message); }
} else console.log('btc history: up to date through', last);

const rows = [...closes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
if (!rows.length) { console.log('btc history: no data'); process.exit(0); }
const out = changed || !prev ? {
  source: 'CoinGecko', source_url: 'https://www.coingecko.com/en/coins/bitcoin', series: 'bitcoin / usd, daily',
  day: 'UTC calendar day; close = CoinGecko daily price at 00:00 UTC of the next day',
  start: rows[0][0], end: rows.at(-1)[0], days: rows.length, generated: new Date().toISOString(), closes: rows,
} : prev;
if (changed || !prev) fs.writeFileSync(R(FILE), JSON.stringify(out) + '\n');

// Pre-render the page so crawlers and no-JS visitors see real numbers.
const pt = (s) => new Date(s).toLocaleString('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';
const dl = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
const k = (n) => '$' + (n / 1000).toLocaleString('en-US') + 'k';
const size = 10000, counts = new Map();
for (const [, v] of out.closes) { const b = Math.floor(v / size) * size; counts.set(b, (counts.get(b) || 0) + 1); }
const keys = [...counts.keys()].sort((a, b) => b - a);
const top = keys.reduce((a, b) => (counts.get(b) > counts.get(a) ? b : a), keys[0]);
const table = `<table class="bt"><caption>Days by daily close, $10,000 brackets (${dl(out.start)} – ${dl(out.end)})</caption><thead><tr><th scope="col">Price bracket (USD)</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th></tr></thead><tbody>${keys.map((b) => `<tr><td>${k(b)}–${k(b + size)}</td><td class="n">${counts.get(b)}</td><td class="n">${(counts.get(b) / out.days * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`;
const meta = `History starts <strong>${dl(out.start)}</strong> and runs through <strong>${dl(out.end)}</strong> (${out.days} completed days). With $10,000 brackets, Bitcoin closed most often between <strong>${k(top)} and ${k(top + size)}</strong> (${counts.get(top)} days). History baked ${pt(out.generated)}.`;
const data = JSON.stringify({ start: out.start, end: out.end, generated: out.generated, c: out.closes.map(([d, v]) => [d, v]) });
let html = fs.readFileSync(R(PAGE), 'utf8');
const put = (name, s) => { html = html.replace(new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`), (m, a, b) => a + s + b); };
put('btc-meta', meta); put('btc-table', table); put('btc-start', dl(out.start));
html = html.replace(/(<script type="application\/json" id="btc-data">)[\s\S]*?(<\/script>)/, (m, a, b) => a + data.replace(/</g, '\\u003c') + b);
html = html.replace(/("dateModified":")[^"]*(")/g, `$1${out.generated}$2`).replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${out.generated}$2`);
fs.writeFileSync(R(PAGE), html);
console.log(`btc page: ${out.start} → ${out.end}, ${out.days} days`);
