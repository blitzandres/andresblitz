// Builds the currency RSS feed (/rates/feed.xml) and a summary (/rates/index.json)
// from the baked country rates (<slug>/rates.json), the BCV value already baked into
// /tasa-bcv/index.html (read-only), and free keyless macro sources. Each series is
// cited with its own source and timestamp; a series that can't be fetched is skipped
// (its last good value is kept in index.json with its original timestamp, never invented).
// Usage: node scripts/bake-feed.mjs
import fs from 'node:fs';
import { COUNTRIES } from './rates/countries.mjs';

const ORIGIN = 'https://andresblitz.com';
const R = (p) => new URL(`../${p}`, import.meta.url);
const MAX_ITEMS = 50;
const get = async (u, type = 'json') => { const r = await fetch(u, { headers: { 'user-agent': 'andresblitz.com rates feed' }, signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error(`${u} ${r.status}`); return type === 'json' ? r.json() : r.text(); };
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch { return d; } };
const prevIndex = readJson('rates/index.json', { series: {} });
const series = {}; const skipped = [];

// 1. Country pages (already baked by bake-rates.mjs)
const NAMES = { 'dolar-argentina': 'Argentina', 'dolar-colombia': 'Colombia', 'dolar-mexico': 'México', 'dolar-peru': 'Perú', 'dolar-chile': 'Chile' };
const MAIN = { 'dolar-argentina': ['oficial', 'Dólar oficial'], 'dolar-colombia': ['trm', 'TRM'], 'dolar-mexico': ['ref', 'FIX'], 'dolar-peru': ['ref', 'Tipo de cambio'], 'dolar-chile': ['ref', 'Dólar observado'] };
for (const slug of Object.keys(COUNTRIES)) {
  const j = readJson(`${slug}/rates.json`, null); if (!j) continue;
  const [k, label] = MAIN[slug]; const r = j.rates[k]; if (!r) continue;
  series[slug] = { title: `${NAMES[slug]}: ${j.label || label}`, value: r.venta, unit: `${j.currency} por USD`, source: j.source, time: new Date(r.f).toISOString(), url: `${ORIGIN}/${slug}/` };
  if (slug === 'dolar-argentina' && j.rates.blue) series['dolar-argentina-blue'] = { title: 'Argentina: Dólar blue', value: j.rates.blue.venta, unit: 'ARS por USD', source: j.source, time: new Date(j.rates.blue.f).toISOString(), url: `${ORIGIN}/${slug}/` };
}
// 2. BCV (read the value scripts/bake-bcv.mjs baked into /tasa-bcv/; that page is not modified)
try {
  const fb = JSON.parse(fs.readFileSync(R('tasa-bcv/index.html'), 'utf8').match(/var FB=(\{[^}]*\});/)[1]);
  if (fb.USD > 0) series['tasa-bcv'] = { title: 'Venezuela: Tasa BCV (USD)', value: fb.USD, unit: 'VES por USD', source: 'Banco Central de Venezuela vía ve.dolarapi.com', time: new Date(fb.f).toISOString(), url: `${ORIGIN}/tasa-bcv/` };
} catch (e) { skipped.push(`tasa-bcv: ${e.message}`); }
// 2b. USDT P2P (baked by scripts/bake-crypto.mjs; stale values are not re-announced)
try {
  const cj = JSON.parse(fs.readFileSync(R('dolar-cripto/data.json'), 'utf8'));
  for (const [cc, c] of Object.entries(cj.countries || {})) if (c.usdt && !c.usdt.stale) series[`usdt-${cc.toLowerCase()}`] = { title: `${c.name}: USDT P2P (${c.fiat})`, value: c.usdt.value, unit: `${c.fiat} por USDT`, extra: c.gap != null ? `brecha ${c.gap > 0 ? '+' : ''}${c.gap} % vs. ${c.official.label}` : undefined, source: c.usdt.source, time: c.usdt.time, url: `${ORIGIN}/dolar-cripto/` };
} catch (e) { if (fs.existsSync(R('dolar-cripto/data.json'))) skipped.push(`usdt: ${e.message}`); }

// 3. Macro series, each optional
const macro = {
  async bitcoin() {
    // CoinGecko is rate-limited: reuse the previous value if it was fetched < 60 s ago.
    const p = prevIndex.series.bitcoin; if (p && Date.now() - Date.parse(p.fetched) < 60e3) return [['bitcoin', p]];
    const b = (await get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,cad&include_24hr_change=true&include_last_updated_at=true')).bitcoin;
    if (!(b?.usd > 0)) throw new Error('no price');
    return [['bitcoin', { title: 'Bitcoin (BTC/USD)', value: b.usd, unit: 'USD', change24h: Math.round(b.usd_24h_change * 100) / 100, extra: `CAD ${b.cad}`, source: 'CoinGecko', time: new Date(b.last_updated_at * 1000).toISOString(), url: 'https://www.coingecko.com/es/monedas/bitcoin', fetched: new Date().toISOString() }]];
  },
  async bankOfCanada() {
    const j = await get('https://www.bankofcanada.ca/valet/observations/FXUSDCAD,V39079/json?recent=5');
    const obs = [...j.observations].sort((a, b) => b.d.localeCompare(a.d)); // Valet doesn't guarantee order
    const last = (k) => obs.find((o) => o[k]?.v);
    const fx = last('FXUSDCAD'), pr = last('V39079'); const out = [];
    if (fx) out.push(['usdcad', { title: 'USD/CAD (Banco de Canadá)', value: Number(fx.FXUSDCAD.v), unit: 'CAD por USD', source: 'Bank of Canada Valet API (FXUSDCAD)', time: `${fx.d}T16:30:00-04:00`, url: 'https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/' }]);
    if (pr) out.push(['boc-policy', { title: 'Tasa de política: Banco de Canadá', value: Number(pr.V39079.v), unit: '%', source: 'Bank of Canada Valet API (V39079)', time: `${pr.d}T12:00:00-04:00`, url: 'https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/' }]);
    return out;
  },
  async bankOfEngland() {
    const from = new Date(Date.now() - 20 * 864e5); const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const csv = await get(`https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=${String(from.getUTCDate()).padStart(2, '0')}/${M[from.getUTCMonth()]}/${from.getUTCFullYear()}&Dateto=now&SeriesCodes=IUDBEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N`, 'text');
    const row = csv.trim().split('\n').filter((l) => /^\d{2} \w{3} \d{4},[\d.]+$/.test(l)).pop(); if (!row) throw new Error('no rows');
    const [d, v] = row.split(','); const [dd, mon, yy] = d.split(' ');
    return [['boe-bank-rate', { title: 'Tasa de política: Banco de Inglaterra (Bank Rate)', value: Number(v), unit: '%', source: 'Bank of England Database (IUDBEDR)', time: `${yy}-${String(M.indexOf(mon) + 1).padStart(2, '0')}-${dd}T12:00:00Z`, url: 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate' }]];
  },
  async fed() {
    const r = (await get('https://markets.newyorkfed.org/api/rates/unsecured/effr/last/1.json')).refRates[0];
    if (!(r.targetRateTo > 0)) throw new Error('no target');
    return [['fed-funds-target', { title: 'Tasa de política: Reserva Federal (rango objetivo)', value: `${r.targetRateFrom.toFixed(2)}–${r.targetRateTo.toFixed(2)}`.replace(/\./g, ','), unit: '%', extra: `EFFR ${r.percentRate}%`, source: 'Federal Reserve Bank of New York Markets API (EFFR)', time: `${r.effectiveDate}T12:00:00-04:00`, url: 'https://www.newyorkfed.org/markets/reference-rates/effr' }]];
  },
  async pboc() {
    const j = await get('https://www.chinamoney.com.cn/r/cms/www/chinamoney/data/currency/bk-lpr.json');
    const one = j.records?.find((x) => x.termCode === '1Y'), five = j.records?.find((x) => x.termCode === '5Y');
    if (!(Number(one?.shibor) > 0)) throw new Error('no 1Y LPR');
    return [['pboc-lpr', { title: 'China: Loan Prime Rate (LPR) 1 año', value: Number(one.shibor), unit: '%', extra: five ? `LPR 5 años ${five.shibor}%` : undefined, source: 'China Foreign Exchange Trade System (chinamoney.com.cn)', time: (() => { const [d, t] = j.data.showDateCN.split(' '); const [h, m] = t.split(':'); return new Date(`${d}T${h.padStart(2, '0')}:${m}:00+08:00`).toISOString(); })(), url: 'https://www.chinamoney.com.cn/english/bmklpr/' }]];
  },
};
for (const [name, fn] of Object.entries(macro)) {
  try { for (const [k, v] of await fn()) series[k] = { ...v, time: new Date(v.time).toISOString() }; }
  catch (e) { skipped.push(`${name}: ${e.message}`); }
}
// keep last good values (with their original timestamps) for series that failed this run
for (const [k, v] of Object.entries(prevIndex.series)) if (!series[k]) series[k] = { ...v, stale: true };

// 4. Feed items: one per series whenever its value or timestamp changes
const items = readJson('rates/items.json', []);
for (const [k, s] of Object.entries(series)) {
  if (s.stale) continue;
  const guid = `${k}:${s.time}:${s.value}`;
  if (items.some((i) => i.guid === guid)) continue;
  items.unshift({ guid, key: k, ...s });
}
items.sort((a, b) => b.time.localeCompare(a.time) || a.key.localeCompare(b.key));
items.splice(MAX_ITEMS);

const fmt = (s) => (typeof s.value === 'number' ? s.value.toLocaleString('es-ES', { minimumFractionDigits: s.unit === '%' ? 2 : 0, maximumFractionDigits: 4, useGrouping: 'always' }) : s.value) + (s.unit === '%' ? ' %' : ` ${s.unit}`);
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const newest = items[0]?.time || new Date().toISOString();
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Feed de tasas · andresblitz.com</title>
<link>${ORIGIN}/projects/currency-rss/</link>
<atom:link href="${ORIGIN}/rates/feed.xml" rel="self" type="application/rss+xml"/>
<description>Tipos de cambio de Venezuela, Argentina, Colombia, México, Perú y Chile, bitcoin, USD/CAD y tasas de política monetaria, con fuente y hora de cada dato.</description>
<language>es</language>
<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>
<ttl>30</ttl>
${items.map((i) => `<item>
<title>${esc(`${i.title}: ${fmt(i)}`)}</title>
<link>${esc(i.url)}</link>
<guid isPermaLink="false">${esc(i.guid)}</guid>
<pubDate>${new Date(i.time).toUTCString()}</pubDate>
<description>${esc(`${i.title}: ${fmt(i)}${i.change24h != null ? ` (${i.change24h > 0 ? '+' : ''}${i.change24h} % en 24 h)` : ''}${i.extra ? ` · ${i.extra}` : ''}. Fuente: ${i.source}. Dato del ${new Date(i.time).toISOString().replace('.000Z', 'Z')}.`)}</description>
<source url="${ORIGIN}/rates/feed.xml">${esc(i.source)}</source>
</item>`).join('\n')}
</channel>
</rss>
`;
const strip = (o) => JSON.stringify({ ...o, generated: undefined });
const index = { feed: `${ORIGIN}/rates/feed.xml`, generated: new Date().toISOString(), skipped, series };
const changed = strip(index) !== strip(prevIndex) || JSON.stringify(items) !== JSON.stringify(readJson('rates/items.json', []));
if (changed || !fs.existsSync(R('rates/feed.xml'))) {
  fs.writeFileSync(R('rates/items.json'), JSON.stringify(items, null, 1) + '\n');
  fs.writeFileSync(R('rates/index.json'), JSON.stringify(index, null, 1) + '\n');
  fs.writeFileSync(R('rates/feed.xml'), xml);
}
console.log(`feed: ${Object.keys(series).length} series, ${items.length} items${skipped.length ? `; skipped: ${skipped.join(' | ')}` : ''}`);

// Bake the reference (mid-market) rates into the remittance calculator so it works without fetching.
for (const page of ['enviar-dinero/index.html', 'salario-en-dolares/index.html', 'convertidor-cripto/index.html', 'comision-cripto/index.html', 'ahorro-en-dolares/index.html']) {
  const CALC = R(page);
  if (!fs.existsSync(CALC)) continue;
  const MAP = { VE: 'tasa-bcv', CO: 'dolar-colombia', MX: 'dolar-mexico', AR: 'dolar-argentina', ARB: 'dolar-argentina-blue', PE: 'dolar-peru', CL: 'dolar-chile', CAD: 'usdcad' };
  const mid = {};
  for (const [k, s] of Object.entries(MAP)) if (typeof series[s]?.value === 'number') mid[k] = { value: series[s].value, source: series[s].source, time: series[s].time };
  const html = fs.readFileSync(CALC, 'utf8');
  const cur = (html.match(/var MID=(\{.*?\});\/\*mid\*\//) || [])[1];
  const next = JSON.stringify(mid);
  if (cur !== next && Object.keys(mid).length) {
    const now = index.generated;
    fs.writeFileSync(CALC, html.replace(/var MID=\{.*?\};\/\*mid\*\//, () => `var MID=${next};/*mid*/`)
      .replace(/("dateModified":)"[^"]*"/, `$1"${now}"`)
      .replace(/(<meta property="article:modified_time" content=")[^"]*/, `$1${now}`));
    console.log(`${page}: reference rates updated`);
  }
}

// Bake coin prices (BTC from the feed's CoinGecko series, others from dolar-cripto/data.json) + USDT P2P into the crypto converter.
for (const CPAGE of ['convertidor-cripto', 'comision-cripto']) try {
  const CF = R(`${CPAGE}/index.html`);
  if (fs.existsSync(CF)) {
    const cj = readJson('dolar-cripto/data.json', {});
    const co = {};
    for (const [k, c] of Object.entries(cj.coins || {})) if (c.usd > 0) co[k] = { usd: c.usd, source: c.source || 'CoinGecko', time: c.time };
    const b = series.bitcoin; if (typeof b?.value === 'number' && b.value > 0) co.BTC = { usd: b.value, source: b.source, time: b.time };
    if (!co.BTC) throw new Error('no BTC price');
    const p2p = {};
    for (const [cc, c] of Object.entries(cj.countries || {})) if (c.usdt?.value > 0 && !c.usdt.stale) p2p[cc.toLowerCase()] = { value: c.usdt.value, source: c.usdt.source, time: c.usdt.time };
    co.p2p = p2p; co.generated = index.generated;
    const html = fs.readFileSync(CF, 'utf8');
    const mid = JSON.parse((html.match(/var MID=(\{.*?\});\/\*mid\*\//) || [, '{}'])[1]);
    const FI = [['VE', 'VES', 'Bolívares (tasa BCV)'], ['AR', 'ARS', 'Pesos argentinos (oficial)'], ['ARB', 'ARS', 'Pesos argentinos (blue)'], ['CO', 'COP', 'Pesos colombianos (TRM)'], ['MX', 'MXN', 'Pesos mexicanos (FIX)'], ['PE', 'PEN', 'Soles peruanos'], ['CL', 'CLP', 'Pesos chilenos'], ['USD', 'USD', 'Dólares estadounidenses'], ['CAD', 'CAD', 'Dólares canadienses']];
    const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const rows = FI.map(([k, cur, n]) => { const r = k === 'USD' ? 1 : mid[k]?.value; const v = r ? co.BTC.usd * r : null; const two = ['USD', 'CAD', 'PE'].includes(k);
      return `<tr><td>${n}</td><td class="n">${v == null ? '—' : v.toLocaleString('es', { maximumFractionDigits: two ? 2 : 0 })} ${cur}</td><td>${k === 'USD' ? '—' : esc(mid[k]?.source || 'sin dato')}</td></tr>`; }).join('');
    const prevCo = JSON.parse((html.match(/var CO=(\{.*?\});\/\*coins\*\//) || [, '{}'])[1]);
    const same = JSON.stringify({ ...prevCo, generated: 0 }) === JSON.stringify({ ...co, generated: 0 });
    if (!same) {
      fs.writeFileSync(CF, html.replace(/var CO=\{.*?\};\/\*coins\*\//, () => `var CO=${JSON.stringify(co)};/*coins*/`)
        .replace(/<!--ref:start-->[\s\S]*?<!--ref:end-->/, () => `<!--ref:start-->${rows}<!--ref:end-->`)
        .replace(/(<time id="upd" datetime=")[^"]*(">)[^<]*/, `$1${index.generated}$2${new Date(index.generated).toLocaleString('es', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC`)
        .replace(/("dateModified":)"[^"]*"/, `$1"${index.generated}"`)
        .replace(/(<meta property="article:modified_time" content=")[^"]*/, `$1${index.generated}`));
      console.log(`${CPAGE}: coin prices updated`);
    }
  }
} catch (e) { console.warn(`${CPAGE}: kept previous prices:`, e.message); }

// Bitcoin network fee levels from mempool.space (keyless), informational only on /comision-cripto/. Failure keeps the previous values.
try {
  const MF = R('comision-cripto/index.html');
  if (fs.existsSync(MF)) {
    const m = await get('https://mempool.space/api/v1/fees/recommended');
    const keys = ['fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'minimumFee'];
    if (!keys.every((k) => Number.isFinite(m[k]) && m[k] > 0 && m[k] < 5000)) throw new Error('bad mempool data');
    const mp = Object.fromEntries(keys.map((k) => [k, m[k]]));
    const html = fs.readFileSync(MF, 'utf8');
    const prev = JSON.parse((html.match(/var MP=(\{.*?\});\/\*mempool\*\//) || [, '{}'])[1]);
    if (keys.some((k) => prev[k] !== mp[k]) || !prev.time) {
      mp.time = new Date().toISOString();
      const btc = readJson('rates/index.json', { series: {} }).series?.bitcoin?.value || series.bitcoin?.value;
      const L = [['Rápida (~10 min)', 'fastestFee'], ['Media (~30 min)', 'halfHourFee'], ['Normal (~1 h)', 'hourFee'], ['Económica', 'economyFee']];
      const rows = L.map(([n, k]) => { const sats = mp[k] * 140; return `<tr><td>${n}</td><td class="n">${mp[k]}</td><td class="n">${sats.toLocaleString('es')} sats${btc ? ` ≈ ${(sats / 1e8 * btc).toLocaleString('es', { maximumFractionDigits: 2 })} USD` : ''}</td></tr>`; }).join('');
      fs.writeFileSync(MF, html.replace(/var MP=\{.*?\};\/\*mempool\*\//, () => `var MP=${JSON.stringify(mp)};/*mempool*/`)
        .replace(/<!--mp:start-->[\s\S]*?<!--mp:end-->/, () => `<!--mp:start-->${rows}<!--mp:end-->`)
        .replace(/(<time id="mpt" datetime=")[^"]*(">)[^<]*/, `$1${mp.time}$2${new Date(mp.time).toLocaleString('es', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC`));
      console.log('comision-cripto: mempool fees updated');
    }
  }
} catch (e) { console.warn('comision-cripto: kept previous mempool fees:', e.message); }
