# Generates the /bitcoin/ page shell. Run from repo root: python3 scripts/rates/gen-bitcoin.py
# Then: node scripts/bake-btc-history.mjs (fills the baked numbers) and node scripts/build-ai.mjs (AI layer).
import json, html
U = 'https://andresblitz.com/bitcoin/'
T = 'Bitcoin Price History Brackets: Days Spent at Each Price'
D = 'Days Bitcoin spent at each USD price since 2014, in $2k, $3k, $4k, $5k, $10k or $15k brackets. BTC/USD close history. Prices in US dollars, usable from any country.'
faq = [
 ('What does this chart show?', 'Each bar is a US dollar price bracket, for example $70,000 to $80,000. Its length is the number of days Bitcoin closed inside that bracket since September 17, 2014. Use the slider to switch between $2,000, $3,000, $4,000, $5,000, $10,000 and $15,000 bitcoin price history brackets.'),
 ('How is a day counted?', 'A completed day counts once, in the bracket that contains that day\u2019s Yahoo Finance BTC-USD close. Days follow the Yahoo daily series. Times on the page are shown in PT.'),
 ('Why does the current bar move?', 'Today is not finished yet, so it is counted with the live Bitcoin price instead of a close. The page checks the price about once a minute, and if it crosses into another bracket, today\u2019s day moves to that bar. It is shown in a deeper orange with a “← now” label until the day closes.'),
 ('Where does the data come from?', 'Daily closes come from Yahoo Finance\u2019s public BTC-USD series, starting September 17, 2014 (the first day of that series). The live price for the unfinished day comes from CoinGecko\u2019s free public API; if CoinGecko is rate-limiting, it falls back to Coinbase\u2019s public BTC-USD spot price, and the page names whichever live source is shown.'),
 ('Why does the history start when it does?', 'Yahoo Finance\u2019s public BTC-USD daily series begins on September 17, 2014. That is why the chart starts there and can show time spent from $0 up. Earlier years are not included; Bitcoin traded below $10,000 throughout that earlier period.'),
 ('Is this trading advice?', 'No. It is a historical reference chart only. There are no buy or sell buttons, signals, predictions or affiliate links.'),
 ('Can I use this chart from any country?', 'Yes. It uses the global BTC/USD market price in US dollars, not a local-currency quote, so it is the same for visitors in any country. Times are shown in Pacific Time (PT) so everyone sees the same clock.'),
]
faqld = {'@context':'https://schema.org','@type':'FAQPage','@id':U+'#faq','inLanguage':'en','url':U+'#faq','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faq]}
earth = {'@type':'Place','name':'Earth','sameAs':'https://www.wikidata.org/wiki/Q2'}
person = {'@type':'Person','name':'Andrés Blitz','url':'https://andresblitz.com/'}
pageld = {'@context':'https://schema.org','@graph':[
 {'@type':'WebPage','@id':U+'#webpage','url':U,'name':T,'description':D,'inLanguage':'en','isPartOf':{'@type':'WebSite','name':'andresblitz.com','url':'https://andresblitz.com/'},'primaryImageOfPage':{'@type':'ImageObject','url':'https://andresblitz.com/assets/og-cover.png','width':1200,'height':630,'caption':'Bitcoin price history brackets — days spent at each USD price'},'datePublished':'2026-11-07','dateModified':'2026-11-07','author':person,'about':{'@id':U+'#dataset'},'mainEntity':{'@id':U+'#app'},'spatialCoverage':earth},
 {'@type':'WebApplication','@id':U+'#app','name':T,'url':U,'description':D,'applicationCategory':'FinanceApplication','operatingSystem':'Any','browserRequirements':'Requires JavaScript','offers':{'@type':'Offer','price':'0','priceCurrency':'USD','areaServed':'Worldwide'},'areaServed':'Worldwide','inLanguage':'en','isAccessibleForFree':True,'datePublished':'2026-11-07','dateModified':'2026-11-07','author':person,'isBasedOn':'https://finance.yahoo.com/quote/BTC-USD/','isPartOf':{'@id':U+'#webpage'}},
 {'@type':'Dataset','@id':U+'#dataset','name':'Bitcoin price history brackets: days spent at each USD range','description':D,'url':U,'creator':person,'inLanguage':'en','keywords':['bitcoin price history brackets','days bitcoin spent at each price','bitcoin price range days since 2014','BTC/USD','Bitcoin'],'temporalCoverage':'2014-09-17/..','spatialCoverage':earth,'variableMeasured':['BTC/USD daily close','days in price bracket'],'measurementTechnique':'Yahoo Finance BTC-USD daily closes; CoinGecko BTC/USD for the unfinished day (Coinbase public spot as fallback)','distribution':{'@type':'DataDownload','encodingFormat':'application/json','contentUrl':'https://andresblitz.com/bitcoin/history.json'},'isBasedOn':'https://finance.yahoo.com/quote/BTC-USD/','license':'https://andresblitz.com/bitcoin/','isAccessibleForFree':True},
 {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://andresblitz.com/'},{'@type':'ListItem','position':2,'name':'Projects','item':'https://andresblitz.com/projects/'},{'@type':'ListItem','position':3,'name':'Bitcoin days in each price bracket','item':U}]}]}
j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',',':')).replace('</','<\\/')
e = html.escape
faqhtml = '\n'.join(f'  <details><summary><h3>{e(q)}</h3></summary><p>{e(a)}</p></details>' for q,a in faq)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(T)}</title>
<meta name="description" content="{e(D)}">
<link rel="canonical" href="{U}">
<link rel="alternate" hreflang="en" href="{U}">
<link rel="alternate" hreflang="x-default" href="{U}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="format-detection" content="telephone=no">
<meta name="author" content="Andrés Blitz">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#05070f">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="andresblitz.com">
<meta property="og:title" content="{e(T)}">
<meta property="og:description" content="{e(D)}">
<meta property="og:url" content="{U}">
<meta property="og:image" content="https://andresblitz.com/assets/og-cover.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Bitcoin price history brackets — days spent at each USD price">
<meta property="article:modified_time" content="2026-11-07">
<link rel="alternate" type="application/rss+xml" title="Feed de tasas" href="https://andresblitz.com/rates/feed.xml">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(T)}">
<meta name="twitter:description" content="{e(D)}">
<meta name="twitter:image" content="https://andresblitz.com/assets/og-cover.png">
<meta name="twitter:image:alt" content="Bitcoin price history brackets — days spent at each USD price">
<script type="application/ld+json">{j(pageld)}</script>
<script type="application/ld+json">{j(faqld)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/projects.css">
<style>
.btc{{background:#FFFBF6;color:#292524;border:1px solid #E7E5E4;border-radius:1rem;padding:clamp(16px,3vw,28px);margin:0 0 1.5rem}}
.btc a{{color:#C2410C}}
#chartTitle{{margin:0 0 .35rem;font-size:clamp(1.15rem,3vw,1.45rem);font-weight:600;color:#1C1917;letter-spacing:-.02em;text-align:left}}
.chart-sub{{margin:0 0 1rem;font-size:.88rem;color:#78716C}}
.live{{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem 1rem}}
.live .v{{font-family:'Archivo',sans-serif;font-size:clamp(1.8rem,6vw,2.6rem);font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.02em;color:#1C1917}}
.live .s,.nota{{font-size:.85rem;color:#78716C}}
.ctl{{margin:1rem 0 .5rem}}.ctl label{{display:block;font-size:.85rem;color:#78716C;margin-bottom:.35rem}}
.ctl input[type=range]{{width:100%;max-width:26rem;accent-color:#F59E0B;min-height:32px}}
.ticks{{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:nowrap;gap:0 .15rem;max-width:26rem;font-size:.78rem;color:#A8A29E;font-variant-numeric:tabular-nums}}
.ticks button{{background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:4px 2px;white-space:nowrap}}.ticks button[aria-pressed=true]{{color:#1C1917;font-weight:600}}
@media (max-width:400px){{.ticks{{font-size:.7rem;gap:0}}.ticks button{{padding:4px 0}}}}
#chart{{margin:1rem 0 .25rem;overflow:visible}}
.now{{margin:.75rem 0 0;font-size:.88rem;color:#78716C}}
table.bt{{width:100%;border-collapse:collapse;font-size:.9rem;font-variant-numeric:tabular-nums;margin-top:.85rem;color:#44403C}}
table.bt caption{{text-align:left;color:#78716C;font-size:.82rem;padding-bottom:.4rem}}
table.bt th,table.bt td{{border-bottom:1px solid #E7E5E4;padding:.4rem .5rem;text-align:left}}table.bt .n{{text-align:right}}
table.bt tr.cur td{{color:#9A3412;font-weight:600;background:#FFEDD5}}
details{{border-bottom:1px solid var(--border);padding:.6rem 0}}summary{{cursor:pointer;font-weight:600}}summary h3{{display:inline;font-size:1rem;margin:0}}details p{{margin:.4rem 0 0}}
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<nav class="site" aria-label="Main">
  <div class="inner">
    <a class="logo" href="/" aria-label="Andrés Blitz home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> andresblitz</a>
    <div class="links">
      <a class="keep" href="/projects/">Projects</a>
      <a href="/#about">About</a>
      <a href="/#play">Play</a>
      <a href="/site-map/">Site map</a>
      <a class="btn" href="/#contact">Contact</a>
    </div>
  </div>
</nav>
<main id="main">
<div class="container">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/projects/">Projects</a></li><li aria-current="page">Bitcoin price brackets</li></ol></nav>
  <header class="p-head">
    <p class="kicker">Markets · Bitcoin</p>
    <h1>Bitcoin: days spent at each price</h1>
    <p class="lede">How many days has Bitcoin spent at each price? This chart splits the BTC/USD price into equal brackets and counts the days Bitcoin closed inside each one, from September 17, 2014. Pick a bracket size of $2,000, $3,000, $4,000, $5,000, $10,000 or $15,000. Today counts at the live price, so its bar can move while the day is still open. Prices are in US dollars and the chart can be used from any country.</p>
    <p class="nota" id="meta"><!--btc-meta:start--><!--btc-meta:end--></p>
  </header>

  <section class="btc" aria-labelledby="chartTitle">
    <h2 id="chartTitle">Days Bitcoin spent in each $10,000 bracket</h2>
    <p class="chart-sub" id="chartSub">Yahoo Finance BTC-USD daily closes</p>
    <div class="live" aria-live="polite"><span class="s">Bitcoin now (BTC/USD)</span><span class="v" id="px">—</span><span class="s" id="pxs">Live price loads in your browser.</span></div>
    <p class="ab-bell" data-topic="btc-bracket" hidden></p>
    <div class="ctl">
      <label for="size">Bracket size: <strong id="sizeLabel">$10,000</strong></label>
      <input type="range" id="size" min="0" max="5" step="1" value="4" aria-valuetext="$10,000" list="sizes">
      <datalist id="sizes"><option value="0" label="$2k"></option><option value="1" label="$3k"></option><option value="2" label="$4k"></option><option value="3" label="$5k"></option><option value="4" label="$10k"></option><option value="5" label="$15k"></option></datalist>
      <div class="ticks" role="group" aria-label="Bracket size presets"><button type="button" data-i="0">$2k</button><button type="button" data-i="1">$3k</button><button type="button" data-i="2">$4k</button><button type="button" data-i="3">$5k</button><button type="button" data-i="4">$10k</button><button type="button" data-i="5">$15k</button></div>
    </div>
    <div id="chart" role="img" aria-label="Bar chart of days Bitcoin spent in each USD price bracket since 2014"></div>
    <p class="now" id="now"></p>
    <div id="tbl"><!--btc-table:start--><!--btc-table:end--></div>
    <p class="nota">Daily closes: <a href="https://finance.yahoo.com/quote/BTC-USD/" rel="noopener">Yahoo Finance BTC-USD</a>, from <!--btc-start:start--><!--btc-start:end-->. Live price: <a href="https://www.coingecko.com/en/coins/bitcoin" rel="noopener">CoinGecko</a> (Coinbase public spot as fallback). Prices are in USD and the chart is usable from any country. Times shown in PT.</p>
  </section>

  <div class="p-body" style="padding-top:1rem">
    <div>
      <section><h2>How to read the Bitcoin price range days</h2><p>Each bar is a price range in US dollars, for example $70,000 to $80,000. A longer bar means Bitcoin finished more days inside that range since 2014. Lower prices sit at the bottom. Narrow brackets ($2,000) show detail; wide brackets ($15,000) show the big picture. The deeper-orange bar marked “← now” is today, counted at the live price until the UTC day closes. This bitcoin price history is in USD and is the same worldwide.</p></section>
      <section><h2>Where the numbers come from</h2><ul class="built">
        <li>Completed days use Yahoo Finance’s BTC-USD daily close, from September 17, 2014 onward. A scheduled GitHub Action stores each new close in <a href="/bitcoin/history.json">/bitcoin/history.json</a> and pre-renders the table above.</li>
        <li>The live price for today is CoinGecko’s BTC/USD print, checked about once a minute. If CoinGecko rate-limits, Coinbase’s public BTC-USD spot price is used instead and named as the source.</li>
        <li>If a request fails, the last good data stays on screen with its time. Nothing is estimated.</li>
      </ul></section>
      <section><div class="callout"><strong>Reference only.</strong> Historical prices from public sources, which may be delayed. This is not financial advice: no buy or sell buttons, signals, predictions or affiliate links.</div></section>
      <section id="faq" aria-labelledby="h-faq"><h2 id="h-faq">FAQ</h2>
{faqhtml}
      </section>
    </div>
    <aside class="facts" aria-label="Page facts">
      <h2>Facts</h2>
      <dl>
        <div><dt>Daily closes</dt><dd><a href="https://finance.yahoo.com/quote/BTC-USD/" rel="noopener">Yahoo Finance</a> (BTC-USD)</dd></div>
        <div><dt>Live print</dt><dd><a href="https://www.coingecko.com/en/coins/bitcoin" rel="noopener">CoinGecko</a></dd></div>
        <div><dt>Live fallback</dt><dd>Coinbase public spot</dd></div>
        <div><dt>Brackets</dt><dd>$2k · $3k · $4k · $5k · $10k · $15k</dd></div>
        <div><dt>Coverage</dt><dd>Worldwide · prices in USD</dd></div>
        <div><dt>History</dt><dd><a href="/bitcoin/history.json">history.json</a></dd></div>
        <div><dt>Source</dt><dd><a href="https://github.com/blitzandres/andresblitz/blob/main/scripts/bake-btc-history.mjs" target="_blank" rel="noopener">bake-btc-history.mjs</a></dd></div>
      </dl>
    </aside>
  </div>
  <nav class="pn" aria-label="More tools">
    <a class="prev" href="/dolar-cripto/"><small>← Live tool (Spanish)</small><b>Dólar cripto hoy</b></a>
    <a class="next" href="/convertidor-cripto/"><small>Live tool (Spanish) →</small><b>Convertidor cripto</b></a>
  </nav>
</div>
</main>
<footer class="site">
  <div class="container">&copy; 2026 Andr&eacute;s Blitz &middot; British Columbia, Canada<br />
    <a href="/">Home</a> &middot; <a href="/projects/">Projects</a> &middot; <a href="/dolar-cripto/">Dólar cripto</a> &middot; <a href="/convertidor-cripto/">Convertidor cripto</a> &middot; <a href="/projects/currency-rss/">Rates feed (RSS)</a> &middot; <a href="https://github.com/blitzandres" target="_blank" rel="noopener">GitHub</a> &middot; <a href="https://x.com/andresblitz" target="_blank" rel="noopener">X</a> &middot; <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a>
  </div>
</footer>
<script type="application/json" id="btc-data">{{}}</script>
<script src="/bitcoin/app.js" defer></script>
<script src="/assets/alerts.js" defer></script>
<script>
(function(){{var b='https://blitz-analytics.andres-491.workers.dev';
function add(f){{var s=document.createElement('script');s.src=b+'/'+f;s.defer=true;s.setAttribute('data-endpoint',b);document.body.appendChild(s)}}
add('t.js');function late(){{(window.requestIdleCallback||setTimeout)(function(){{add('chat.js')}},{{timeout:3000}})}}
if(document.readyState==='complete')late();else addEventListener('load',late);}})();
</script>
</body>
</html>
'''
open('bitcoin/index.html','w').write(page)
print('wrote bitcoin/index.html')
