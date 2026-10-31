#!/usr/bin/env node
// Bakes /dolar-cripto/: USDT P2P price in VES/ARS/COP (median) vs. our official rates, plus coin prices.
// Sources (keyless, called only from GitHub Actions, never from visitors' browsers):
//   1) CriptoYa  2) Binance P2P public search (p2p.binance.com, NOT api.binance.com)  3) Yadio
// A failed, empty or implausible response never overwrites good data: the last good value is kept, marked stale.
// BTC reuses the feed's CoinGecko series (same source as RealWealth); other coins come from CoinGecko (attributed).
// Usage: node scripts/bake-crypto.mjs [--probe]   (--probe tries every source and prints results, writes nothing)
import fs from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname, R = (p) => ROOT + p;
const PROBE = process.argv.includes('--probe');
const UA = { 'User-Agent': 'andresblitz.com rates bot (+https://andresblitz.com/dolar-cripto/)', Accept: 'application/json' };
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(R(p), 'utf8')); } catch { return d; } };
const get = async (url, opt = {}) => { const r = await fetch(url, { ...opt, headers: { ...UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
const median = (a) => { a = a.filter((x) => Number.isFinite(x) && x > 0).sort((x, y) => x - y); if (!a.length) return NaN; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

export const COUNTRIES = {
  VE: { fiat: 'VES', name: 'Venezuela', official: 'tasa-bcv', officialLabel: 'Tasa BCV', page: '/tasa-bcv/' },
  AR: { fiat: 'ARS', name: 'Argentina', official: 'dolar-argentina', officialLabel: 'Dólar oficial', page: '/dolar-argentina/' },
  CO: { fiat: 'COP', name: 'Colombia', official: 'dolar-colombia', officialLabel: 'TRM', page: '/dolar-colombia/' },
};
const SOURCES = [
  { id: 'criptoya', label: 'CriptoYa (mediana P2P)', url: 'https://criptoya.com', async fetch(fiat) {
    const j = await get(`https://criptoya.com/api/usdt/${fiat.toLowerCase()}/1`);
    const vals = []; let t = 0;
    for (const [k, v] of Object.entries(j || {})) if (/p2p$/.test(k) && v && v.ask > 0 && v.bid > 0) { vals.push((v.ask + v.bid) / 2); t = Math.max(t, v.time || 0); }
    if (vals.length < 2) throw new Error(`only ${vals.length} P2P venues`);
    return { value: median(vals), n: vals.length, time: t ? new Date(t * 1000).toISOString() : new Date().toISOString() };
  } },
  { id: 'binancep2p', label: 'Binance P2P (mediana de anuncios)', url: 'https://p2p.binance.com', async fetch(fiat) {
    const vals = [];
    for (const tradeType of ['BUY', 'SELL']) {
      const j = await get('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fiat, asset: 'USDT', tradeType, page: 1, rows: 10, payTypes: [], publisherType: null }) });
      for (const a of j?.data || []) vals.push(+a.adv.price);
    }
    if (vals.length < 5) throw new Error(`only ${vals.length} ads`);
    return { value: median(vals), n: vals.length, time: new Date().toISOString() };
  } },
  { id: 'yadio', label: 'Yadio', url: 'https://yadio.io', async fetch(fiat) {
    const j = await get(`https://api.yadio.io/rate/${fiat}/USD`);
    if (!(j?.rate > 0)) throw new Error('no rate');
    return { value: j.rate, n: 1, time: new Date(j.timestamp || Date.now()).toISOString() };
  } },
];

const idx = readJson('rates/index.json', { series: {} });
const prev = readJson('dolar-cripto/data.json', { countries: {}, coins: {} });
const hist = readJson('dolar-cripto/history.json', {});
const now = new Date().toISOString();
const out = { generated: now, countries: {}, coins: prev.coins || {}, coinsFetched: prev.coinsFetched || null, notes: [] };

for (const [cc, c] of Object.entries(COUNTRIES)) {
  const off = idx.series[c.official];
  const old = prev.countries?.[cc];
  let got = null;
  for (const s of SOURCES) {
    try {
      const r = await s.fetch(c.fiat);
      const ref = old?.usdt?.value || off?.value; // plausibility: 0.5x–4x of last good value / official
      if (!(r.value > 0) || (ref && (r.value < ref * 0.5 || r.value > ref * 4))) throw new Error(`implausible ${r.value}`);
      console.log(`${cc} ${s.id}: ${r.value.toFixed(4)} (${r.n} quotes)`);
      if (!got) got = { ...r, source: s.label, sourceUrl: s.url };
      if (!PROBE) break;
    } catch (e) { console.log(`${cc} ${s.id} failed: ${e.message}`); }
  }
  if (PROBE) continue;
  const usdt = got ? { value: +got.value.toPrecision(8), source: got.source, sourceUrl: got.sourceUrl, time: got.time, quotes: got.n } : old?.usdt ? { ...old.usdt, stale: true } : null;
  if (!got) out.notes.push(`${cc}: todas las fuentes fallaron; se mantiene el último dato`);
  const official = off && typeof off.value === 'number' ? { value: off.value, source: off.source, time: off.time, label: c.officialLabel } : old?.official || null;
  const gap = usdt && official ? +(((usdt.value / official.value) - 1) * 100).toFixed(2) : null;
  out.countries[cc] = { ...c, usdt, official, gap };
  if (got) {
    const h = hist[cc] || [], last = h[h.length - 1], t = now.slice(0, 16) + 'Z';
    if (!last || Date.parse(t) - Date.parse(last.t) >= 25 * 60e3) h.push({ t, u: usdt.value, o: official?.value ?? null });
    hist[cc] = h.slice(-336); // ~7 days at 30-min cadence
  }
}

const COINS = { ethereum: 'ETH', tether: 'USDT', 'usd-coin': 'USDC', solana: 'SOL', ripple: 'XRP', binancecoin: 'BNB' };
if (PROBE || !out.coinsFetched || Date.now() - Date.parse(out.coinsFetched) >= 60e3) {
  try {
    const j = await get(`https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(COINS).join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
    const coins = {};
    for (const [id, sym] of Object.entries(COINS)) { const v = j?.[id]; if (v?.usd > 0) coins[sym] = { usd: v.usd, change24h: v.usd_24h_change != null ? +v.usd_24h_change.toFixed(2) : null, time: new Date(v.last_updated_at * 1000).toISOString(), source: 'CoinGecko' }; }
    console.log('coingecko:', Object.keys(coins).join(' ') || 'empty');
    if (Object.keys(coins).length) { out.coins = { ...out.coins, ...coins }; out.coinsFetched = now; } else out.notes.push('CoinGecko sin datos; se mantienen los anteriores');
  } catch (e) { console.log('coingecko failed:', e.message); }
}
const btc = idx.series.bitcoin; // CoinGecko via the feed bake (same source as RealWealth)
if (btc && typeof btc.value === 'number') { const { BTC, ...rest } = out.coins; out.coins = { BTC: { usd: btc.value, change24h: btc.change24h ?? null, time: btc.time, source: 'CoinGecko' }, ...rest }; }
if (PROBE) process.exit(0);

// ---------- server render (numbers + chips are static HTML; charts draw client-side into fixed-height boxes) ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = (v, d = 2) => v == null ? '—' : v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
const dfmt = (s) => s ? new Date(s).toLocaleString('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UTC' : '—';
const tone = (g) => g == null ? 'n' : Math.abs(g) < 5 ? 'ok' : Math.abs(g) < 20 ? 'mid' : 'hi';
const cards = Object.entries(out.countries).map(([cc, c]) => `<article class="cc ${tone(c.gap)}" data-cc="${cc}" aria-labelledby="h-${cc}">
  <header><h3 id="h-${cc}">${esc(c.name)}</h3><span class="chip">USDT/${c.fiat}</span></header>
  <div class="row"><div class="gauge" data-gauge="${c.gap ?? ''}" role="img" aria-label="Brecha ${c.gap == null ? 'no disponible' : nf(c.gap) + ' %'}"></div>
  <dl class="nums"><div><dt>USDT P2P</dt><dd class="v">${nf(c.usdt?.value)}</dd><dd class="why">lo que se paga por un dólar digital entre personas</dd></div><div><dt>${esc(c.official?.label || 'Oficial')}</dt><dd><a href="${c.page}">${nf(c.official?.value)}</a></dd><dd class="why">la referencia de bancos y trámites</dd></div><div><dt>Brecha</dt><dd class="g">${c.gap == null ? '—' : (c.gap > 0 ? '+' : '') + nf(c.gap) + ' %'}</dd><dd class="why">cuánto más cuesta el dólar fuera del canal oficial</dd></div></dl></div>
  <svg class="spk" data-spark="${cc}" width="300" height="40" stroke-width="2" aria-label="Tendencia de USDT/${c.fiat}, 7 días"></svg>
  <div class="chips"><a class="chip src" href="${c.usdt?.sourceUrl || '#'}" rel="noopener">${esc(c.usdt?.source || 'sin datos')}</a><time class="chip" datetime="${c.usdt?.time || ''}">${dfmt(c.usdt?.time)}</time>${c.usdt?.stale ? '<span class="chip warn">dato anterior</span>' : ''}<span class="chip">Oficial: ${esc(c.official?.source)}</span></div>
</article>`).join('\n');
const coins = `<table class="coins"><thead><tr><th>Moneda</th><th class="n">USD</th><th class="n">24 h</th></tr></thead><tbody>${Object.entries(out.coins).map(([s, v]) => `<tr><td>${s}</td><td class="n">${nf(v.usd, v.usd < 10 ? 4 : 2)}</td><td class="n ${v.change24h > 0 ? 'up' : v.change24h < 0 ? 'dn' : ''}">${v.change24h == null ? '—' : (v.change24h > 0 ? '+' : '') + nf(v.change24h) + ' %'}</td></tr>`).join('')}</tbody></table><p class="nota">Precios: <a href="https://www.coingecko.com/es" rel="noopener">CoinGecko</a> · actualizado ${dfmt(out.coinsFetched || btc?.time)}.</p>`;
function summary(cc, c) {
  if (c.gap == null) return `${c.name}: sin datos suficientes por ahora.`;
  const pos = c.gap >= 0, head = `En ${c.name}, USDT está ${nf(Math.abs(c.gap), 1)} % ${pos ? 'sobre' : 'bajo'} ${c.official.label === 'TRM' ? 'la TRM' : c.official.label === 'Tasa BCV' ? 'la tasa BCV' : 'el dólar oficial'} hoy`;
  const h = (hist[cc] || []).filter((p) => p.u > 0 && p.o > 0), nowT = Date.now();
  const wk = h.filter((p) => nowT - Date.parse(p.t) >= 6 * 864e5).pop(), base = wk || (h.length && nowT - Date.parse(h[0].t) >= 20 * 36e5 ? h[0] : null);
  if (!base) return `${head}; aún no hay historial suficiente para comparar.`;
  const then = (base.u / base.o - 1) * 100, when = wk ? 'la semana pasada' : 'al inicio del historial', d = c.gap - then;
  return `${head}, ${Math.abs(d) < 0.5 ? 'casi igual que' : d > 0 ? 'más alto que' : 'más bajo que'} ${when} (${nf(then, 1)} %).`;
}
const sum = `<ul class="sum">${Object.entries(out.countries).map(([cc, c]) => `<li class="${tone(c.gap)}">${esc(summary(cc, c))}</li>`).join('')}</ul>`;
const table = `<table class="tbl"><caption class="sr">USDT P2P frente a la tasa oficial</caption><thead><tr><th scope="col">País</th><th scope="col" class="n">USDT P2P</th><th scope="col" class="n">Oficial</th><th scope="col" class="n">Brecha</th><th scope="col">Fuente y hora</th></tr></thead><tbody>${Object.values(out.countries).map((c) => `<tr><th scope="row">${esc(c.name)} <small>${c.fiat}</small></th><td class="n">${nf(c.usdt?.value)}</td><td class="n"><a href="${c.page}">${nf(c.official?.value)}</a> <small>${esc(c.official?.label)}</small></td><td class="n">${c.gap == null ? '—' : (c.gap > 0 ? '+' : '') + nf(c.gap) + ' %'}</td><td><small>${esc(c.usdt?.source)} · ${dfmt(c.usdt?.time)}${c.usdt?.stale ? ' · dato anterior' : ''}<br>Oficial: ${esc(c.official?.source)} · ${dfmt(c.official?.time)}</small></td></tr>`).join('')}</tbody></table>`;
const chartData = { h: hist, c: Object.fromEntries(Object.entries(out.countries).map(([k, v]) => [k, { n: v.name, f: v.fiat, g: v.gap }])) };

fs.writeFileSync(R('dolar-cripto/data.json'), JSON.stringify(out, null, 1) + '\n');
fs.writeFileSync(R('dolar-cripto/history.json'), JSON.stringify(hist) + '\n');
const P = R('dolar-cripto/index.html');
if (fs.existsSync(P)) {
  const h = fs.readFileSync(P, 'utf8')
    .replace(/<!--cards:start-->[\s\S]*?<!--cards:end-->/, () => `<!--cards:start-->\n${cards}\n<!--cards:end-->`)
    .replace(/<!--sum:start-->[\s\S]*?<!--sum:end-->/, () => `<!--sum:start-->${sum}<!--sum:end-->`)
    .replace(/<!--table:start-->[\s\S]*?<!--table:end-->/, () => `<!--table:start-->${table}<!--table:end-->`)
    .replace(/<!--coins:start-->[\s\S]*?<!--coins:end-->/, () => `<!--coins:start-->${coins}<!--coins:end-->`)
    .replace(/<!--upd:start-->[\s\S]*?<!--upd:end-->/, () => `<!--upd:start--><time datetime="${now}">${dfmt(now)}</time><!--upd:end-->`)
    .replace(/<script type="application\/json" id="cd">[\s\S]*?<\/script>/, () => `<script type="application/json" id="cd">${JSON.stringify(chartData).replace(/</g, '\\u003c')}</script>`)
    .replace(/("dateModified":)"[^"]*"/, `$1"${now}"`)
    .replace(/(<meta property="article:modified_time" content=")[^"]*/, `$1${now}`);
  fs.writeFileSync(P, h);
}
console.log(`crypto: ${Object.keys(out.countries).length} countries, ${Object.keys(out.coins).length} coins${out.notes.length ? '; ' + out.notes.join(' | ') : ''}`);
