// Generated /bitcoin/* data pages. Rewritten by scripts/bake-btc-history.mjs on every bake from bitcoin/history.json.
// Do not hand-edit the output pages; edit this file. Reference only: no signals, predictions or advice.
import fs from 'node:fs';
import { R, ORIGIN, OG, esc, num, usd, k, pct, dl, ds, dlEs, numEs, usdEs, pctEs, daysBetween, above } from './btc-common.mjs';

const BASE = `${ORIGIN}/bitcoin/`;
const LEVELS = [50000, 70000, 90000, 100000];
const PUBLISHED = '2026-11-11';
const OGALT = 'Bar chart of days Bitcoin closed in each $10,000 US-dollar price bracket since September 17, 2014';
const person = { '@type': 'Person', name: 'Andrés Blitz', url: `${ORIGIN}/` };
const j = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const lvl = (t) => '$' + num(t);
const slugOf = (t) => `above-${t / 1000}k`;

const STYLE = `.btc{background:#FFFBF6;color:#292524;border:1px solid #E7E5E4;border-radius:1rem;padding:clamp(16px,3vw,28px);margin:0 0 1.5rem}
.btc a{color:#C2410C}.btc h2{margin:0 0 .5rem;font-size:clamp(1.1rem,3vw,1.35rem);font-weight:600;color:#1C1917}
.btc .big{font-family:'Archivo',sans-serif;font-size:clamp(2rem,7vw,3rem);font-weight:700;color:#1C1917;letter-spacing:-.02em;margin:0;font-variant-numeric:tabular-nums}
.btc .big small{font-size:.4em;font-weight:500;color:#78716C;letter-spacing:0}
.btc p{color:#44403C}.btc .nota{font-size:.85rem;color:#78716C}
.bar{height:12px;border-radius:3px;background:#F59E0B;display:block;min-width:2px}.bar.cur{background:#EA580C}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}.tw:focus-visible{outline:2px solid #C2410C}
table.bt{width:100%;border-collapse:collapse;font-size:.9rem;font-variant-numeric:tabular-nums;margin-top:.85rem;color:#44403C}
table.bt caption{text-align:left;color:#78716C;font-size:.82rem;padding-bottom:.4rem}
table.bt th,table.bt td{border-bottom:1px solid #E7E5E4;padding:.4rem .5rem;text-align:left}table.bt .n{text-align:right}
table.bt th{color:#1C1917;font-weight:600}table.bt tr.cur td{color:#9A3412;font-weight:600;background:#FFEDD5}
table.yr{font-size:.82rem}table.yr td.z{color:#A8A29E}table.yr th,table.yr td{white-space:nowrap;padding:.35rem .4rem}
.rel{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.5rem;list-style:none;padding:0;margin:.5rem 0 0}
.rel a{display:block;padding:.6rem .8rem;border:1px solid var(--border,#2a3350);border-radius:.6rem;text-decoration:none}
.rel a[aria-current=page]{opacity:.6;pointer-events:none}
.explain{font-size:1.02rem;max-width:46rem}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
nav.site .links a.btn{background:#2F62CC}nav.site .links a.btn:hover{background:#3563D6}
details{border-bottom:1px solid var(--border);padding:.6rem 0}summary{cursor:pointer;font-weight:600}summary h3{display:inline;font-size:1rem;margin:0}details p{margin:.4rem 0 0}`;

const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap';
const LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>';
const ANALYTICS = `<script>
(function(){var b='https://blitz-analytics.andres-491.workers.dev';
function add(f){var s=document.createElement('script');s.src=b+'/'+f;s.defer=true;s.setAttribute('data-endpoint',b);document.body.appendChild(s)}
add('t.js');function late(){(window.requestIdleCallback||setTimeout)(function(){add('chat.js')},{timeout:3000})}
if(document.readyState==='complete')late();else addEventListener('load',late);})();
</script>`;

function related(cur, es) {
  const items = [
    ['/bitcoin/', es ? 'Gráfico interactivo (inglés): días en cada rango' : 'Interactive chart: days in each price bracket'],
    ...LEVELS.map((t) => [`/bitcoin/${slugOf(t)}/`, es ? `Días sobre ${usdEs(t)} (inglés)` : `Days Bitcoin closed above ${lvl(t)}`]),
    ['/bitcoin/highest-close/', es ? 'Cierre más alto del bitcoin (inglés)' : 'Bitcoin’s highest close ever'],
    ['/bitcoin/by-year/', es ? 'Días por rango y por año (inglés)' : 'Days in each bracket by year'],
    ['/bitcoin/es/', es ? 'Días del bitcoin en cada precio (español)' : 'Días del bitcoin en cada precio (Spanish)'],
  ];
  return `<section aria-labelledby="h-rel"><h2 id="h-rel">${es ? 'Más datos del bitcoin' : 'More Bitcoin price history'}</h2><ul class="rel">${items.map(([p, n]) => `<li><a href="${p}"${p === cur ? ' aria-current="page"' : ''}>${esc(n)}</a></li>`).join('')}</ul></section>`;
}

function faqBlock(faq, es) {
  return `<section id="faq" aria-labelledby="h-faq"><h2 id="h-faq">${es ? 'Preguntas frecuentes' : 'FAQ'}</h2>\n${faq.map(([q, a]) => `  <details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('\n')}\n</section>`;
}

function page({ path, title, desc, h1, crumb, body, faq, out, es = false, alt }) {
  const url = ORIGIN + path;
  const crumbs = [[es ? 'Inicio' : 'Home', `${ORIGIN}/`], [es ? 'Bitcoin' : 'Bitcoin price brackets', BASE], ...(path === '/bitcoin/' ? [] : [[crumb, url]])];
  const graph = [
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description: desc, inLanguage: es ? 'es' : 'en', isPartOf: { '@type': 'WebSite', name: 'andresblitz.com', url: `${ORIGIN}/` }, primaryImageOfPage: { '@type': 'ImageObject', url: OG, width: 1200, height: 630, caption: OGALT }, datePublished: PUBLISHED, dateModified: out.generated, author: person, about: { '@id': BASE + '#dataset' }, isBasedOn: 'https://finance.yahoo.com/quote/BTC-USD/', breadcrumb: { '@id': url + '#breadcrumb' } },
    { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
  ];
  const faqld = faq?.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': url + '#faq', inLanguage: es ? 'es' : 'en', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null;
  const hreflang = alt
    ? `<link rel="alternate" hreflang="es" href="${alt.es}">\n<link rel="alternate" hreflang="en" href="${alt.en}">\n<link rel="alternate" hreflang="x-default" href="${alt.en}">`
    : `<link rel="alternate" hreflang="en" href="${url}">\n<link rel="alternate" hreflang="x-default" href="${url}">`;
  const nav = es
    ? '<a class="keep" href="/projects/">Proyectos</a>\n      <a href="/bitcoin/">Bitcoin (inglés)</a>\n      <a href="/site-map/">Mapa del sitio</a>\n      <a class="btn" href="/#contact">Contacto</a>'
    : '<a class="keep" href="/projects/">Projects</a>\n      <a href="/bitcoin/">Bitcoin brackets</a>\n      <a href="/site-map/">Site map</a>\n      <a class="btn" href="/#contact">Contact</a>';
  return `<!doctype html>
<html lang="${es ? 'es' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${hreflang}
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="format-detection" content="telephone=no">
<meta name="author" content="Andrés Blitz">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#05070f">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="article">
<meta property="og:locale" content="${es ? 'es_ES' : 'en_US'}">
<meta property="og:site_name" content="andresblitz.com">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${esc(OGALT)}">
<meta property="article:published_time" content="${PUBLISHED}">
<meta property="article:modified_time" content="${out.generated}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG}">
<meta name="twitter:image:alt" content="${esc(OGALT)}">
<script type="application/ld+json">${j({ '@context': 'https://schema.org', '@graph': graph })}</script>
${faqld ? `<script type="application/ld+json">${j(faqld)}</script>\n` : ''}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="${FONTS}" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/assets/projects.css">
<style>
${STYLE}
</style>
</head>
<body>
<a class="skip-link" href="#main">${es ? 'Saltar al contenido' : 'Skip to content'}</a>
<nav class="site" aria-label="${es ? 'Principal' : 'Main'}">
  <div class="inner">
    <a class="logo" href="/" aria-label="andresblitz home">${LOGO} andresblitz</a>
    <div class="links">
      ${nav}
    </div>
  </div>
</nav>
<main id="main">
<div class="container">
  <nav class="crumbs" aria-label="${es ? 'Ruta' : 'Breadcrumb'}"><ol>${crumbs.map(([n, u], i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${u.replace(ORIGIN, '')}">${esc(n)}</a></li>`).join('')}</ol></nav>
${body}
  <div class="p-body" style="padding-top:1rem;display:block">
    <section><div class="callout"><strong>${es ? 'Solo referencia.' : 'Reference only.'}</strong> ${es ? 'Precios históricos de fuentes públicas, que pueden tener retraso. No es asesoría financiera: sin botones de compra o venta, señales, predicciones ni enlaces de afiliados.' : 'Historical prices from public sources, which may be delayed. This is not financial advice: no buy or sell buttons, signals, predictions or affiliate links.'}</div></section>
    ${faq?.length ? faqBlock(faq, es) : ''}
    ${related(path, es)}
    <p class="nota">${es ? 'Fuente' : 'Source'}: <a href="https://finance.yahoo.com/quote/BTC-USD/" rel="noopener">Yahoo Finance BTC-USD</a> ${es ? 'cierres diarios (día UTC), solo días completos, desde' : 'daily closes (UTC day), completed days only, from'} ${es ? dlEs(out.start) : dl(out.start)}. ${es ? 'Datos' : 'Data'}: <a href="/bitcoin/history.json">history.json</a>. ${es ? 'Actualizado' : 'Updated'} ${es ? 'con cada horneado (unos 30 min); horas en PT.' : 'by the scheduled bake (about every 30 minutes); times in PT.'}</p>
  </div>
</div>
</main>
<footer class="site">
  <div class="container">&copy; 2026 Andr&eacute;s Blitz &middot; British Columbia, Canada<br />
    <a href="/">Home</a> &middot; <a href="/bitcoin/">Bitcoin price brackets</a> &middot; <a href="/bitcoin/es/">Bitcoin en español</a> &middot; <a href="/projects/">Projects</a> &middot; <a href="/site-map/">Site map</a> &middot; <a href="https://github.com/blitzandres" target="_blank" rel="noopener">GitHub</a> &middot; <a href="https://x.com/andresblitz" target="_blank" rel="noopener">X</a> &middot; <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a>
  </div>
</footer>
${ANALYTICS}
</body>
</html>
`;
}

function head(kicker, h1, explain) {
  return `  <header class="p-head">
    <p class="kicker">${esc(kicker)}</p>
    <h1>${esc(h1)}</h1>
    <p class="explain">${explain}</p>
  </header>`;
}

function abovePage(out, s, t) {
  const a = above(s, t), all = LEVELS.map((x) => above(s, x));
  const lastAbove = s.last[1] > t;
  const title = `How Many Days Has Bitcoin Closed Above ${lvl(t)}? (${num(a.days)} Days)`;
  const desc = a.days
    ? `Bitcoin has closed above ${lvl(t)} on ${num(a.days)} of ${num(s.n)} days since ${ds(s.first[0])} (${pct(a.days, s.n)}). First close above: ${ds(a.first[0])}. Most recent: ${ds(a.recent[0])}. Yahoo Finance BTC-USD daily closes.`
    : `Bitcoin has not closed above ${lvl(t)} in ${num(s.n)} daily closes since ${ds(s.first[0])}. Yahoo Finance BTC-USD daily closes.`;
  const latest = lastAbove
    ? `The latest close, ${usd(s.last[1], 2)} on ${dl(s.last[0])}, is above ${lvl(t)}${a.cur > 1 ? `, and Bitcoin has now closed above it ${num(a.cur)} days in a row` : ''}.`
    : `The latest close, ${usd(s.last[1], 2)} on ${dl(s.last[0])}, is ${((1 - s.last[1] / t) * 100).toFixed(1)}% below ${lvl(t)}.`;
  const explain = a.days
    ? `<strong>${num(a.days)} days.</strong> Bitcoin closed above ${lvl(t)} on ${num(a.days)} of the ${num(s.n)} completed daily closes since ${dl(s.first[0])}, which is ${pct(a.days, s.n)} of all days. The first close above ${lvl(t)} was ${usd(a.first[1], 2)} on ${dl(a.first[0])}; the most recent was ${usd(a.recent[1], 2)} on ${dl(a.recent[0])}. ${latest}`
    : `Bitcoin has not closed above ${lvl(t)} in ${num(s.n)} completed daily closes since ${dl(s.first[0])}. ${latest}`;
  const facts = [
    ['Days closed above ' + lvl(t), num(a.days)],
    ['Share of all completed days', pct(a.days, s.n)],
    ['Days in the record', num(s.n)],
    ['First close above', a.first ? `${dl(a.first[0])} (${usd(a.first[1], 2)})` : '—'],
    ['Most recent close above', a.recent ? `${dl(a.recent[0])} (${usd(a.recent[1], 2)})` : '—'],
    ['Longest run of closes above', a.best ? `${num(a.best)} days (${ds(a.bestStart)} – ${ds(a.bestEnd)})` : '—'],
    ['Current run above', lastAbove ? `${num(a.cur)} days` : `0 (latest close ${usd(s.last[1], 2)})`],
  ];
  const years = [...new Set(s.rows.map((r) => r[0].slice(0, 4)))];
  const yearTotal = (y) => s.rows.filter((r) => r[0].startsWith(y)).length;
  const yrRows = years.filter((y) => a.years.get(y)).map((y) => `<tr><td>${y}</td><td class="n">${num(a.years.get(y))}</td><td class="n">${num(yearTotal(y))}</td><td class="n">${pct(a.years.get(y), yearTotal(y))}</td></tr>`).join('');
  const body = `${head('Markets · Bitcoin', `How many days has Bitcoin closed above ${lvl(t)}?`, explain)}
  <section class="btc" aria-labelledby="h-ans">
    <h2 id="h-ans">Days Bitcoin closed above ${lvl(t)}</h2>
    <p class="big">${num(a.days)} <small>of ${num(s.n)} days · ${pct(a.days, s.n)}</small></p>
    <table class="bt"><caption>Bitcoin daily closes above ${lvl(t)}, ${dl(s.first[0])} – ${dl(s.last[0])}</caption><tbody>${facts.map(([q, v]) => `<tr><th scope="row">${esc(q)}</th><td class="n">${esc(v)}</td></tr>`).join('')}</tbody></table>
    ${yrRows ? `<table class="bt"><caption>Closes above ${lvl(t)} by calendar year</caption><thead><tr><th scope="col">Year</th><th scope="col" class="n">Days above</th><th scope="col" class="n">Days in data</th><th scope="col" class="n">Share</th></tr></thead><tbody>${yrRows}</tbody></table>` : ''}
    <table class="bt"><caption>Other levels (same data)</caption><thead><tr><th scope="col">Closed above</th><th scope="col" class="n">Days</th><th scope="col" class="n">Share</th><th scope="col" class="n">Most recent</th></tr></thead><tbody>${all.map((x) => `<tr${x.t === t ? ' class="cur"' : ''}><td>${x.t === t ? lvl(x.t) : `<a href="/bitcoin/${slugOf(x.t)}/">${lvl(x.t)}</a>`}</td><td class="n">${num(x.days)}</td><td class="n">${pct(x.days, s.n)}</td><td class="n">${x.recent ? ds(x.recent[0]) : '—'}</td></tr>`).join('')}</tbody></table>
    <p class="nota">A day counts when that day’s Yahoo Finance BTC-USD close is above ${lvl(t)}. Today is left out until its close is final. See every range on the <a href="/bitcoin/">interactive bracket chart</a>.</p>
  </section>`;
  const faq = [
    [`How many days has Bitcoin closed above ${lvl(t)}?`, a.days ? `${num(a.days)} of ${num(s.n)} completed daily closes from ${dl(s.first[0])} to ${dl(s.last[0])} (${pct(a.days, s.n)}), using Yahoo Finance BTC-USD daily closes.` : `None of the ${num(s.n)} completed daily closes from ${dl(s.first[0])} to ${dl(s.last[0])}.`],
    [`When did Bitcoin first close above ${lvl(t)}?`, a.first ? `On ${dl(a.first[0])}, at ${usd(a.first[1], 2)}. The most recent close above ${lvl(t)} was on ${dl(a.recent[0])}.` : `It has not closed above ${lvl(t)} in this record.`],
    ['How is a day counted?', 'Each completed UTC day counts once, using the Yahoo Finance BTC-USD daily close. A day counts here only if that close is above the level. Today is not counted until it closes. The page is rebuilt from the stored history by a scheduled job about every 30 minutes.'],
  ];
  return page({ path: `/bitcoin/${slugOf(t)}/`, title, desc, crumb: `Above ${lvl(t)}`, body, faq, out });
}

function highestPage(out, s) {
  const p = s.peak, since = daysBetween(p[0], s.last[0]), below = (1 - s.last[1] / p[1]) * 100, isLast = p[0] === s.last[0];
  const top10 = [...s.rows].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const years = new Map();
  for (const r of s.rows) { const y = r[0].slice(0, 4), c = years.get(y); if (!c || r[1] > c[1]) years.set(y, r); }
  const title = `Bitcoin’s Highest Close Ever: ${usd(p[1], 2)} on ${dl(p[0])}`;
  const desc = `Bitcoin’s highest daily close is ${usd(p[1], 2)} on ${ds(p[0])} (Yahoo Finance BTC-USD). As of ${ds(s.last[0])}: ${num(since)} days since, latest close ${usd(s.last[1], 2)}, ${below.toFixed(1)}% below it.`;
  const explain = isLast
    ? `Bitcoin’s highest daily close is <strong>${usd(p[1], 2)}</strong>, set on ${dl(p[0])}, which is also the latest close in the record.`
    : `Bitcoin’s highest daily close is <strong>${usd(p[1], 2)}</strong> on ${dl(p[0])}. As of ${dl(s.last[0])}, that was <strong>${num(since)} days</strong> ago, and the latest close of ${usd(s.last[1], 2)} is ${below.toFixed(1)}% below it. This counts closing prices only, not intraday highs.`;
  const body = `${head('Markets · Bitcoin', 'Bitcoin’s highest close ever', explain)}
  <section class="btc" aria-labelledby="h-ath">
    <h2 id="h-ath">Highest daily close (Yahoo Finance BTC-USD)</h2>
    <p class="big">${usd(p[1], 2)} <small>${dl(p[0])}</small></p>
    <table class="bt"><caption>As of ${dl(s.last[0])} (last completed close)</caption><tbody>
      <tr><th scope="row">Highest close</th><td class="n">${usd(p[1], 2)}</td></tr>
      <tr><th scope="row">Date of highest close</th><td class="n">${dl(p[0])}</td></tr>
      <tr><th scope="row">Days since the highest close</th><td class="n">${num(since)}</td></tr>
      <tr><th scope="row">Latest close</th><td class="n">${usd(s.last[1], 2)} (${dl(s.last[0])})</td></tr>
      <tr><th scope="row">Latest close vs. highest close</th><td class="n">${isLast ? 'at the high' : `${below.toFixed(1)}% below (${usd(p[1] - s.last[1], 2)})`}</td></tr>
      <tr><th scope="row">Lowest close in the record</th><td class="n">${usd(s.low[1], 2)} (${dl(s.low[0])})</td></tr>
    </tbody></table>
    <table class="bt"><caption>Ten highest daily closes</caption><thead><tr><th scope="col">Rank</th><th scope="col">Date</th><th scope="col" class="n">Close (USD)</th></tr></thead><tbody>${top10.map((r, i) => `<tr${i === 0 ? ' class="cur"' : ''}><td>${i + 1}</td><td>${dl(r[0])}</td><td class="n">${usd(r[1], 2)}</td></tr>`).join('')}</tbody></table>
    <table class="bt"><caption>Highest close in each calendar year${s.first[0].startsWith('2014') ? ' (2014 starts September 17)' : ''}</caption><thead><tr><th scope="col">Year</th><th scope="col">Date</th><th scope="col" class="n">Highest close (USD)</th></tr></thead><tbody>${[...years.entries()].reverse().map(([y, r]) => `<tr><td>${y}</td><td>${ds(r[0])}</td><td class="n">${usd(r[1], 2)}</td></tr>`).join('')}</tbody></table>
    <p class="nota">Closing prices only (the UTC daily close), not intraday highs, so other sites that quote intraday highs show a higher number. “Days since” counts calendar days from the highest close to the last completed close.</p>
  </section>`;
  const faq = [
    ['What is Bitcoin’s highest close ever?', `${usd(p[1], 2)} on ${dl(p[0])}, using Yahoo Finance BTC-USD daily closes since ${dl(s.first[0])}.`],
    ['How many days since Bitcoin’s highest close?', isLast ? 'The latest close is the highest close.' : `${num(since)} days as of ${dl(s.last[0])}. The latest close then was ${usd(s.last[1], 2)}, ${below.toFixed(1)}% below the high.`],
    ['Why is this lower than the all-time high I see elsewhere?', 'This page uses daily closing prices. Intraday highs are usually higher than any daily close, so an all-time high quoted from intraday trading will be a larger number.'],
  ];
  return page({ path: '/bitcoin/highest-close/', title, desc, crumb: 'Highest close', body, faq, out });
}

function byYearPage(out, s) {
  const years = [...new Set(s.rows.map((r) => r[0].slice(0, 4)))];
  const keys = [...s.keys].reverse(); // $0 first
  const grid = new Map(years.map((y) => [y, new Map()]));
  const yrStats = new Map();
  for (const r of s.rows) {
    const y = r[0].slice(0, 4), b = Math.floor(r[1] / s.size) * s.size, m = grid.get(y);
    m.set(b, (m.get(b) || 0) + 1);
    const st = yrStats.get(y) || { n: 0, lo: r, hi: r, last: r };
    st.n++; if (r[1] < st.lo[1]) st.lo = r; if (r[1] > st.hi[1]) st.hi = r; st.last = r; yrStats.set(y, st);
  }
  const lastY = years.at(-1), firstY = years[0];
  const mostCommon = (y) => { const m = grid.get(y); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]; };
  const title = `Bitcoin Days in Each $10,000 Price Bracket by Year (${firstY}–${lastY})`;
  const desc = `How many days Bitcoin closed in each $10,000 USD bracket, year by year from ${ds(s.first[0])} to ${ds(s.last[0])}, with each year’s low, high and most common range. Yahoo Finance BTC-USD daily closes.`;
  const cur = yrStats.get(lastY);
  const explain = `Each row is a calendar year and each column a $10,000 price range; the number is how many days that year Bitcoin closed inside the range. ${firstY} starts on ${dl(s.first[0])}, the first day of the Yahoo Finance series, and ${lastY} runs through ${dl(s.last[0])} (${num(cur.n)} days so far), with most of its closes in the ${k(mostCommon(lastY))}–${k(mostCommon(lastY) + s.size)} range.`;
  const head2 = keys.map((b) => `<th scope="col" class="n">${k(b)}–${k(b + s.size)}</th>`).join('');
  const rows = years.map((y) => `<tr><th scope="row">${y}</th>${keys.map((b) => { const v = grid.get(y).get(b) || 0; return `<td class="n${v ? '' : ' z'}">${v ? num(v) : '·'}</td>`; }).join('')}<td class="n"><strong>${num(yrStats.get(y).n)}</strong></td></tr>`).join('');
  const sum = years.map((y) => { const st = yrStats.get(y), mc = mostCommon(y); return `<tr><td>${y}</td><td class="n">${num(st.n)}</td><td class="n">${usd(st.lo[1], 0)}</td><td class="n">${usd(st.hi[1], 0)}</td><td class="n">${usd(st.last[1], 0)}</td><td>${k(mc)}–${k(mc + s.size)} (${num(grid.get(y).get(mc))} d)</td></tr>`; }).join('');
  const body = `${head('Markets · Bitcoin', 'Bitcoin days in each $10,000 bracket, by year', explain)}
  <section class="btc" aria-labelledby="h-grid">
    <h2 id="h-grid">Days per $10,000 bracket per year</h2>
    <div class="tw" tabindex="0" role="region" aria-label="Days per bracket per year table, scrolls sideways"><table class="bt yr"><caption>Days Bitcoin closed in each $10,000 USD bracket, by calendar year (“·” = no days)</caption><thead><tr><th scope="col">Year</th>${head2}<th scope="col" class="n">Days</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="tw" tabindex="0" role="region" aria-label="Each year at a glance table, scrolls sideways"><table class="bt yr"><caption>Each year at a glance (daily closes, USD)</caption><thead><tr><th scope="col">Year</th><th scope="col" class="n">Days</th><th scope="col" class="n">Low</th><th scope="col" class="n">High</th><th scope="col" class="n">Last</th><th scope="col">Most common range</th></tr></thead><tbody>${sum}</tbody></table></div>
    <p class="nota">${firstY} is partial (from ${dl(s.first[0])}) and ${lastY} is year to date (through ${dl(s.last[0])}). “Last” is the year’s final close, or the latest close for the current year.</p>
  </section>`;
  const faq = [
    ['Which year did Bitcoin spend the most days above $100,000?', (() => { const c = years.map((y) => [y, [...grid.get(y).entries()].filter(([b]) => b >= 100000).reduce((a, [, v]) => a + v, 0)]).sort((a, b) => b[1] - a[1])[0]; return c[1] ? `${c[0]}, with ${num(c[1])} daily closes at $100,000 or higher.` : 'No year in the record has a close at $100,000 or higher.'; })()],
    ['Why does 2014 have fewer days?', `The Yahoo Finance BTC-USD daily series starts on ${dl(s.first[0])}, so ${firstY} only has ${num(yrStats.get(firstY).n)} days.`],
  ];
  return page({ path: '/bitcoin/by-year/', title, desc, crumb: 'By year', body, faq, out });
}

function esPage(out, s) {
  const top = s.top, below10 = s.counts.get(0) || 0, a100 = above(s, 100000);
  const title = 'Días del bitcoin en cada precio: historial en dólares desde 2014';
  const desc = `Cuántos días cerró el bitcoin en cada rango de US$10.000 desde el ${dlEs(s.first[0])}: ${numEs(s.n)} cierres diarios de Yahoo Finance (BTC-USD). Tabla, último cierre y fuentes.`;
  const explain = `En pocas palabras: el bitcoin tiene ${numEs(s.n)} cierres diarios registrados desde el ${dlEs(s.first[0])}. Esta página los agrupa por rangos de precio en dólares y cuenta los días de cada rango: el ${pctEs(below10, s.n)} de esos días cerró por debajo de US$10.000 y en ${numEs(a100.days)} días cerró por encima de US$100.000. Es solo un registro del pasado, sin pronósticos.`;
  const table = `<table class="bt"><caption>Días por cierre diario, rangos de US$10.000 (${dlEs(s.first[0])} – ${dlEs(s.last[0])}, ${numEs(s.n)} días completos)</caption><thead><tr><th scope="col">Rango de precio (USD)</th><th scope="col" class="n">Días</th><th scope="col" class="n">Porcentaje</th><th scope="col"><span class="sr-only">Barra</span></th></tr></thead><tbody>${s.keys.filter((b) => s.counts.get(b)).map((b) => { const d = s.counts.get(b), mx = s.counts.get(top); return `<tr${b === s.lastBracket ? ' class="cur"' : ''}><td>${usdEs(b)}–${usdEs(b + s.size)}${b === s.lastBracket ? ' (último cierre)' : ''}</td><td class="n">${numEs(d)}</td><td class="n">${pctEs(d, s.n)}</td><td style="width:35%"><span class="bar${b === s.lastBracket ? ' cur' : ''}" style="width:${(d / mx * 100).toFixed(1)}%"></span></td></tr>`; }).join('')}</tbody></table>`;
  const body = `${head('Mercados · Bitcoin', 'Días del bitcoin en cada precio', explain)}
  <section class="btc" aria-labelledby="h-tabla">
    <h2 id="h-tabla">Días que el bitcoin cerró en cada rango de US$10.000</h2>
    <p>Último cierre: <strong>${usdEs(s.last[1], 2)}</strong> el ${dlEs(s.last[0])} (<a href="https://finance.yahoo.com/quote/BTC-USD/" rel="noopener">Yahoo Finance BTC-USD</a>). Cierre más alto: ${usdEs(s.peak[1], 2)} el ${dlEs(s.peak[0])}.</p>
    ${table}
    <p class="nota">Cada día completo cuenta una vez, en el rango que contiene su cierre diario (día UTC). Hoy no se cuenta hasta que cierre. Para rangos de US$2.000, US$3.000, US$4.000, US$5.000 o US$15.000 y el precio en vivo, usa el <a href="/bitcoin/">gráfico interactivo (en inglés)</a>.</p>
  </section>`;
  const faq = [
    ['¿Qué muestra esta tabla?', `Cuántos días cerró el bitcoin dentro de cada rango de US$10.000, desde el ${dlEs(s.first[0])} hasta el ${dlEs(s.last[0])}, con los cierres diarios BTC-USD de Yahoo Finance.`],
    ['¿Los precios están en dólares?', 'Sí. Se usa el precio global BTC/USD en dólares estadounidenses, el mismo en cualquier país. No es una cotización en moneda local.'],
    ['¿Es una recomendación de inversión?', 'No. Es un registro histórico de referencia, sin señales, predicciones ni enlaces de afiliados.'],
  ];
  return page({ path: '/bitcoin/es/', title, desc, crumb: 'Días en cada precio', body, faq, out, es: true, alt: { es: `${BASE}es/`, en: BASE } });
}

export function bake(out, s) {
  const pages = [
    ...LEVELS.map((t) => [`bitcoin/${slugOf(t)}/index.html`, abovePage(out, s, t)]),
    ['bitcoin/highest-close/index.html', highestPage(out, s)],
    ['bitcoin/by-year/index.html', byYearPage(out, s)],
    ['bitcoin/es/index.html', esPage(out, s)],
  ];
  for (const [f, html] of pages) {
    fs.mkdirSync(R(f.replace(/index\.html$/, '')), { recursive: true });
    // Keep the AI-layer head block that build-ai.mjs adds, so an unchanged page stays byte-identical.
    let prev = ''; try { prev = fs.readFileSync(R(f), 'utf8'); } catch {}
    const layer = prev.match(/<!-- ai-layer:start -->[\s\S]*?<!-- ai-layer:end -->\n/);
    const next = layer ? html.replace('</head>', layer[0] + '</head>') : html;
    if (next !== prev) fs.writeFileSync(R(f), next);
  }
  console.log(`btc pages: ${pages.length} generated pages`);
}
