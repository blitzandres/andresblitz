#!/usr/bin/env node
// Bakes /bitcoin/: daily Bitcoin closes in USD for the days-in-bracket chart.
// Daily series: Yahoo Finance BTC-USD public chart API, from 2014-09-17 (first Yahoo bar).
// That longer series is what lets the chart show time spent from $0 up.
// Live print on the page is fetched separately in the browser (CoinGecko, Coinbase fallback).
// A failed or empty response never overwrites good data (exit 0, last good file kept).
// Usage: node scripts/bake-btc-history.mjs [--force]
import fs from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname, R = (p) => ROOT + p;
const FILE = 'bitcoin/history.json', PAGE = 'bitcoin/index.html';
const UA = { 'User-Agent': 'andresblitz.com rates bot (+https://andresblitz.com/bitcoin/)', Accept: 'application/json' };
const START = '2014-09-17';
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch { return d; } };

const prev = readJson(FILE, null);
const closes = new Map((prev?.closes || []).map(([d, v]) => [d, v]));
const today = iso(Date.now()), yesterday = iso(Date.now() - 86400000);
const last = [...closes.keys()].sort().pop();
const sourceOk = prev?.source === 'Yahoo Finance' && prev?.start === START && (prev?.days || 0) > 4000;
let changed = false;

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

if (process.argv.includes('--force') || !sourceOk || !last || last < yesterday) {
  try {
    const full = process.argv.includes('--force') || !sourceOk;
    const period1 = Math.floor(Date.parse((full ? START : last) + 'T00:00:00Z') / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    const rows = await yahoo(period1, period2);
    if (!rows.length) throw new Error('empty series');
    if (full) closes.clear();
    let added = 0;
    for (const [d, p] of rows) {
      if (d < START) continue;
      const prevP = closes.get(d);
      if (prevP === p) continue;
      // Allow today's bar to update as Yahoo revises it; do not rewrite older stored days unless a full refresh.
      if (!full && prevP != null && d < today) continue;
      closes.set(d, p); added++;
    }
    console.log(`btc history: ${full ? 'full Yahoo refresh' : 'Yahoo update'} +${added} day(s)`);
    if (added) changed = true;
  } catch (e) { console.log('btc history: Yahoo failed, keeping last good data:', e.message); }
} else console.log('btc history: up to date through', last);

const rows = [...closes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
if (!rows.length) { console.log('btc history: no data'); process.exit(0); }
const out = changed || !prev || !sourceOk ? {
  source: 'Yahoo Finance', source_url: 'https://finance.yahoo.com/quote/BTC-USD/', series: 'BTC-USD daily close',
  day: 'Yahoo Finance BTC-USD daily bar date (UTC)',
  start: rows[0][0], end: rows.at(-1)[0], days: rows.length, generated: new Date().toISOString(), closes: rows,
} : prev;
if (changed || !prev || !sourceOk) fs.writeFileSync(R(FILE), JSON.stringify(out) + '\n');

const pt = (s) => new Date(s).toLocaleString('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';
const dl = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
const k = (n) => n === 0 ? '$0' : '$' + (n / 1000).toLocaleString('en-US') + 'k';
const size = 10000, counts = new Map();
let peak = 0;
for (const [, v] of out.closes) {
  const b = Math.floor(v / size) * size;
  counts.set(b, (counts.get(b) || 0) + 1);
  if (v > peak) peak = v;
}
const hi = Math.max(0, ...counts.keys());
const keys = [];
for (let b = hi; b >= 0; b -= size) keys.push(b);
const top = keys.reduce((a, b) => ((counts.get(b) || 0) > (counts.get(a) || 0) ? b : a), keys[0]);
const table = `<table class="bt"><caption>Days by daily close, $10,000 brackets (${dl(out.start)} – ${dl(out.end)})</caption><thead><tr><th scope="col">Price bracket (USD)</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th></tr></thead><tbody>${keys.filter((b) => counts.get(b)).map((b) => `<tr><td>${k(b)}–${k(b + size)}</td><td class="n">${counts.get(b).toLocaleString('en-US')}</td><td class="n">${(counts.get(b) / out.days * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`;
const meta = `History starts <strong>${dl(out.start)}</strong> and runs through <strong>${dl(out.end)}</strong> (${out.days.toLocaleString('en-US')} daily closes). With $10,000 brackets, Bitcoin closed most often between <strong>${k(top)} and ${k(top + size)}</strong> (${(counts.get(top) || 0).toLocaleString('en-US')} days). Series high $${Math.round(peak).toLocaleString('en-US')}. History baked ${pt(out.generated)}.`;
const data = JSON.stringify({ start: out.start, end: out.end, generated: out.generated, source: out.source, c: out.closes.map(([d, v]) => [d, v]) });
let html = fs.readFileSync(R(PAGE), 'utf8');
const put = (name, s) => { html = html.replace(new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`), (m, a, b) => a + s + b); };
put('btc-meta', meta); put('btc-table', table); put('btc-start', dl(out.start));
html = html.replace(/(<script type="application\/json" id="btc-data">)[\s\S]*?(<\/script>)/, (m, a, b) => a + data.replace(/</g, '\\u003c') + b);
html = html.replace(/("dateModified":")[^"]*(")/g, `$1${out.generated}$2`).replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${out.generated}$2`);
fs.writeFileSync(R(PAGE), html);
console.log(`btc page: ${out.start} → ${out.end}, ${out.days} days, peak $${Math.round(peak)}`);
