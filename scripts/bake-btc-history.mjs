#!/usr/bin/env node
// Bakes /bitcoin/: daily Bitcoin closes in USD for the days-in-bracket chart.
// Daily series: Yahoo Finance BTC-USD public chart API, from 2014-09-17 (first Yahoo bar).
// That longer series is what lets the chart show time spent from $0 up.
// Live print on the page is fetched separately in the browser (CoinGecko, Coinbase fallback).
// Only completed UTC days are stored. Each run re-reads the last 7 days from Yahoo so a close that was
// still moving (or missing) when first seen is corrected; older stored days are only rewritten on a full refresh.
// A failed or empty response never overwrites good data (exit 0, last good file kept).
// Then it pre-renders the static numbers on /bitcoin/ (table, last close, explainer), the share image,
// the generated /bitcoin/* pages and the sitemap lastmod, all from history.json.
// Usage: node scripts/bake-btc-history.mjs [--force] [--offline]   (--offline: re-render from the stored history only)
import fs from 'node:fs';
import { bake as bakeExtraPages } from './lib/btc-extra-pages.mjs';
import { R, iso, esc, num, usd, k, pct, dl, pt, stats, sitemapLastmod, writeOg, OG, firstUnlocks, ERA_NAMES } from './lib/btc-common.mjs';
const FILE = 'bitcoin/history.json', PAGE = 'bitcoin/index.html';
const UA = { 'User-Agent': 'andresblitz.com rates bot (+https://andresblitz.com/bitcoin/)', Accept: 'application/json' };
const START = '2014-09-17', REVISE_DAYS = 7;
const force = process.argv.includes('--force'), offline = process.argv.includes('--offline');
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch { return d; } };

const prev = readJson(FILE, null);
const closes = new Map((prev?.closes || []).map(([d, v]) => [d, v]));
const today = iso(Date.now()), reviseFrom = iso(Date.now() - REVISE_DAYS * 864e5);
const sourceOk = prev?.source === 'Yahoo Finance' && prev?.start === START && (prev?.days || 0) > 4000;
let changed = false;
// Today's bar is not a close yet: never keep it in the stored history.
for (const d of [...closes.keys()]) if (d >= today) { closes.delete(d); changed = true; }
const last = [...closes.keys()].sort().pop();

async function yahoo(period1, period2) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const res = j.chart?.result?.[0];
  const ts = res?.timestamp || [];
  const px = res?.indicators?.quote?.[0]?.close || [];
  const rows = [];
  for (let i = 0; i < ts.length; i++) {
    const p = px[i];
    if (!(p > 0)) continue;
    rows.push([iso(ts[i] * 1000), Math.round(p * 100) / 100]);
  }
  return rows;
}

if (!offline) try {
  const full = force || !sourceOk || !last;
  const from = full ? START : (last < reviseFrom ? last : reviseFrom);
  const rows = await yahoo(Math.floor(Date.parse(from + 'T00:00:00Z') / 1000), Math.floor(Date.now() / 1000));
  if (!rows.length) throw new Error('empty series');
  if (full) closes.clear();
  let added = 0;
  for (const [d, p] of rows) {
    if (d < START || d >= today) continue;
    if (!full && d < reviseFrom && closes.has(d)) continue;
    if (closes.get(d) === p) continue;
    closes.set(d, p); added++;
  }
  console.log(`btc history: ${full ? 'full Yahoo refresh' : 'Yahoo update from ' + from} +${added} day(s) written`);
  if (added) changed = true;
} catch (e) { console.log('btc history: Yahoo failed, keeping last good data:', e.message); }

const rows = [...closes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
if (!rows.length) { console.log('btc history: no data'); process.exit(0); }
const write = changed || !prev || !sourceOk;
const out = write ? {
  source: 'Yahoo Finance', source_url: 'https://finance.yahoo.com/quote/BTC-USD/', series: 'BTC-USD daily close',
  day: 'Yahoo Finance BTC-USD daily bar date (UTC); completed days only',
  start: rows[0][0], end: rows.at(-1)[0], days: rows.length, generated: new Date().toISOString(), closes: rows,
} : prev;
if (write) fs.writeFileSync(R(FILE), JSON.stringify(out) + '\n');

// ---- Static numbers on /bitcoin/ (visible without JavaScript; app.js redraws them after history.json loads)
const s = stats(out);
const top = s.top, below10 = s.counts.get(0) || 0;
const { unlock } = firstUnlocks(s.rows, s.size);
const reached = (b) => { const u = unlock.get(b); return u ? `${dl(u.day)} (${ERA_NAMES[u.era]})` : ''; };
const table = `<table class="bt"><caption>Days by daily close, $10,000 brackets (${dl(s.first[0])} – ${dl(s.last[0])}, ${num(s.n)} completed days)</caption><thead><tr><th scope="col">Price bracket (USD)</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th><th scope="col">First reached</th></tr></thead><tbody>${s.keys.filter((b) => s.counts.get(b)).map((b) => `<tr><td>${k(b)}–${k(b + s.size)}</td><td class="n">${num(s.counts.get(b))}</td><td class="n">${pct(s.counts.get(b), s.n)}</td><td>${reached(b)}</td></tr>`).join('')}</tbody></table>`;
const meta = `History starts <strong>${dl(s.first[0])}</strong> and runs through <strong>${dl(s.last[0])}</strong> (${num(s.n)} completed daily closes). With $10,000 brackets, Bitcoin closed most often between <strong>${k(top)} and ${k(top + s.size)}</strong> (${num(s.counts.get(top) || 0)} days). Highest close ${usd(s.peak[1], 2)} on ${dl(s.peak[0])}. History baked ${pt(out.generated)}.`;
const lastLine = `Last close: <strong>${usd(s.last[1], 2)}</strong> on ${dl(s.last[0])} (<a href="https://finance.yahoo.com/quote/BTC-USD/" rel="noopener">Yahoo Finance BTC-USD</a>).`;
const explain = `In plain English: Bitcoin has ${num(s.n)} daily closes on record since ${dl(s.first[0])}, and this page sorts every one of them into US-dollar price ranges and counts the days in each. That shows where the price has actually spent its time: ${pct(below10, s.n)} of those days closed below $10,000, and ${num(s.counts.get(s.lastBracket) || 0)} closed in the ${k(s.lastBracket)}–${k(s.lastBracket + s.size)} range where the last close sits. It is a record of the past only, with no forecasts.`;
const chartLabel = `Horizontal bar chart of days Bitcoin closed in each $10,000 USD price bracket from ${dl(s.first[0])} to ${dl(s.last[0])}. The longest bar is ${k(top)}–${k(top + s.size)} with ${num(s.counts.get(top) || 0)} days (${pct(s.counts.get(top) || 0, s.n)}). Each bar is one color for the halving period when Bitcoin first reached that price. The same numbers are in the table below.`;
let html = fs.readFileSync(R(PAGE), 'utf8');
const put = (name, v) => { html = html.replace(new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`), (m, a, b) => a + v + b); };
put('btc-meta', meta); put('btc-table', table); put('btc-start', dl(s.first[0])); put('btc-last', lastLine); put('btc-explain', explain);
html = html.replace(/(<div id="chart" role="img" aria-label=")[^"]*(")/, (m, a, b) => a + esc(chartLabel) + b);
html = html.replace(/("dateModified":")[^"]*(")/g, `$1${out.generated}$2`).replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${out.generated}$2`);
fs.writeFileSync(R(PAGE), html);

if (await writeOg(s, write)) console.log('btc og image: wrote', OG);
bakeExtraPages(out, s);
sitemapLastmod(s.last[0]);
console.log(`btc page: ${s.first[0]} → ${s.last[0]}, ${s.n} completed days, high ${usd(s.peak[1], 2)} on ${s.peak[0]}, last ${usd(s.last[1], 2)}`);
