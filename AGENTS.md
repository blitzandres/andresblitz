# AGENTS.md — andresblitz.com

This is the front door for AI agents and crawlers visiting https://andresblitz.com/. It explains who Andrés Blitz is, what the site offers, every key public page, how to cite the work, and how to crawl.

If you were redirected here from the human homepage, you may continue to any public URL on this site. This file is a starting point, not a wall.

## Start here / continue crawling

- Human homepage: https://andresblitz.com/
- HTML site map (every public page as a clickable tree): https://andresblitz.com/site-map/
- XML sitemap: https://andresblitz.com/sitemap.xml
- Markdown sitemap: https://andresblitz.com/sitemap-md.xml
- Short machine-readable catalog (Markdown alternates): https://andresblitz.com/llms.txt
- Full site as Markdown: https://andresblitz.com/llms-full.txt (also https://andresblitz.com/full.md)
- Structured JSON index: https://andresblitz.com/agent.json

## Who Andrés Blitz is

Andrés Blitz is a full-time trader and investor based in British Columbia, Canada, with a background in high-performance sales and operations across real estate, petroleum, and automotive. He builds open-source tools and web experiments on the side.

- Location: British Columbia, Canada (do not invent a city, street address, or phone number)
- Email: blitz@mail.grokbot.com
- X: https://x.com/andresblitz (@andresblitz)
- GitHub: https://github.com/blitzandres
- Canonical site: https://andresblitz.com/

## What the site offers

andresblitz.com is Andrés's personal site. It publishes:

- A Bitcoin research tool that counts how many days BTC/USD has closed in each US-dollar price bracket since 2014
- Reference Latin American dollar and FX rates, converters, and calculators (in Spanish)
- Beginner crypto guides and crypto tools (in Spanish)
- A directory of open-source projects, including a playable browser game
- A page about El 70, a cattle ranch in Zulia, Venezuela (in Spanish)

Exchange rates and related JSON are rebuilt about every 30 minutes. The material is factual reference and is **not financial advice**.

## Key pages and tools

Each entry links to the live HTML page, notes the language (`en` or `es`), and gives the clean Markdown alternate (append `index.md` to any public directory URL). Only pages that exist on this site are listed.

### English — home, research, and navigation

- [Home](https://andresblitz.com/) (en): Andrés Blitz is a full-time trader and investor in British Columbia, Canada — markets, portfolio construction, and capital allocation. Sharp instincts from years in high-stakes sales and operations.
  Markdown: https://andresblitz.com/index.md
- [Bitcoin price history brackets](https://andresblitz.com/bitcoin/) (en): Days-in-bracket chart of how many days BTC/USD closed in each $2k, $3k, $4k, $5k, $10k, or $15k US-dollar bracket since 17 September 2014. Completed days use Yahoo Finance BTC-USD daily closes, baked at https://andresblitz.com/bitcoin/history.json. The current unfinished day is counted at the live CoinGecko price, with Coinbase public spot as fallback. Prices are in USD and the page works from any country; times are in Pacific Time (PT). Historical reference, not financial advice.
  Markdown: https://andresblitz.com/bitcoin/index.md
- [All projects](https://andresblitz.com/projects/) (en): Every project by Andrés Blitz, each with its own page: a playable space game, a real estate portfolio dashboard, trading indicators, signal and network tools, research and web apps.
  Markdown: https://andresblitz.com/projects/index.md
- [Site map](https://andresblitz.com/site-map/) (en): Interactive site map of every public page on andresblitz.com as a clickable tree (in English).
  Markdown: https://andresblitz.com/site-map/index.md
- [Alerts & Downloads](https://andresblitz.com/alerts/) (en): Hub describing planned email alerts and downloads (Bitcoin brackets, Tasa BCV, crypto-dollar gap, weekly LatAm rates, PDF guides). Sign-up is not currently connected; do not submit the form or treat alert endpoints as a public API.
  Markdown: https://andresblitz.com/alerts/index.md

### Dollar and exchange-rate pages (Spanish)

- [Tasa BCV](https://andresblitz.com/tasa-bcv/) (es): Tasa BCV — tipo de cambio oficial del Banco Central de Venezuela (en español). Maracaibo, Zulia.
  Markdown: https://andresblitz.com/tasa-bcv/index.md
- [Dólar Argentina](https://andresblitz.com/dolar-argentina/) (es): Dólar hoy en Argentina — oficial, blue, MEP, CCL, cripto y tarjeta, con conversor ARS ↔ USD (en español).
  Markdown: https://andresblitz.com/dolar-argentina/index.md
- [Dólar Colombia](https://andresblitz.com/dolar-colombia/) (es): Dólar hoy en Colombia — TRM certificada por la Superintendencia Financiera, precio de mercado y conversor COP ↔ USD (en español).
  Markdown: https://andresblitz.com/dolar-colombia/index.md
- [Dólar México](https://andresblitz.com/dolar-mexico/) (es): Dólar hoy en México — tipo de cambio FIX de Banxico, compra y venta de mercado y conversor MXN ↔ USD (en español).
  Markdown: https://andresblitz.com/dolar-mexico/index.md
- [Dólar Perú](https://andresblitz.com/dolar-peru/) (es): Dólar hoy en Perú — tipo de cambio en soles con la fuente indicada en cada actualización y conversor PEN ↔ USD (en español).
  Markdown: https://andresblitz.com/dolar-peru/index.md
- [Dólar Chile](https://andresblitz.com/dolar-chile/) (es): Dólar hoy en Chile — dólar observado del Banco Central de Chile, compra y venta de mercado y conversor CLP ↔ USD (en español).
  Markdown: https://andresblitz.com/dolar-chile/index.md
- [Enviar dinero](https://andresblitz.com/enviar-dinero/) (es): Calculadora del costo de enviar dinero desde Canadá o EE. UU. a Venezuela, Colombia, México, Argentina, Perú o Chile: comisión y margen frente a la tasa de referencia (en español). Estimaciones; no muestra cotizaciones de proveedores.
  Markdown: https://andresblitz.com/enviar-dinero/index.md
- [Salario en dólares](https://andresblitz.com/salario-en-dolares/) (es): Calculadora de salario en dólares: convierte un sueldo mensual o anual en VES, COP, MXN, ARS (oficial y blue), PEN, CLP o CAD a USD con tasas de referencia, y a dólares internacionales (PPA del Banco Mundial) donde hay datos recientes (en español).
  Markdown: https://andresblitz.com/salario-en-dolares/index.md

### Crypto tools and guides (Spanish)

- [Dólar cripto](https://andresblitz.com/dolar-cripto/) (es): Dólar cripto hoy: precio mediano del USDT P2P en VES, ARS y COP con la brecha frente a la tasa BCV, el dólar oficial y la TRM, fuente y hora de cada dato; precios de BTC y otras criptomonedas de CoinGecko (en español). Referencial, no es asesoría financiera.
  Markdown: https://andresblitz.com/dolar-cripto/index.md
- [Convertidor cripto](https://andresblitz.com/convertidor-cripto/) (es): Convertidor cripto: BTC, sats, ETH, USDT, USDC, SOL, XRP y BNB a VES, ARS (oficial y blue), COP, MXN, PEN, CLP, USD y CAD y al revés, con tasas de referencia horneadas y fuente de cada precio (en español). Referencial, no es asesoría financiera.
  Markdown: https://andresblitz.com/convertidor-cripto/index.md
- [Comisión cripto](https://andresblitz.com/comision-cripto/) (es): Calculadora de comisión cripto: con el monto, la moneda (USDT, USDC o BTC), la red (TRC20, ERC20, BEP20, Solana, Lightning o Bitcoin) y la comisión de retiro que escribe el usuario, muestra cuánto llega, la comisión en % y el valor en moneda local, con comparación con una remesa y tarifas de mempool.space como referencia (en español). Estimaciones, no es asesoría financiera.
  Markdown: https://andresblitz.com/comision-cripto/index.md
- [Ahorro en dólares](https://andresblitz.com/ahorro-en-dolares/) (es): Calculadora histórica de ahorro en dólares: cuánto vale hoy en USD un monto guardado hace N meses en VES, ARS (oficial y blue), COP, MXN, PEN, CLP o CAD frente a haberlo cambiado a dólares o USDT ese día, con fuentes fechadas (currency-api, ArgentinaDatos). Solo datos históricos, no es asesoría financiera.
  Markdown: https://andresblitz.com/ahorro-en-dolares/index.md
- [Guías cripto](https://andresblitz.com/guias-cripto/) (es): Guías cripto en español para principiantes: qué es USDT y las stablecoins, cómo funciona el P2P, redes y comisiones (TRC20, ERC20, BEP20, Lightning), estafas comunes y cómo leer la brecha del dólar cripto. Informativo, no es asesoría financiera.
  Markdown: https://andresblitz.com/guias-cripto/index.md
- [Qué es USDT](https://andresblitz.com/guias-cripto/que-es-usdt/) (es): Guía: qué es USDT y qué son las stablecoins, cómo intentan valer un dólar y sus riesgos (en español).
  Markdown: https://andresblitz.com/guias-cripto/que-es-usdt/index.md
- [Cómo funciona el P2P](https://andresblitz.com/guias-cripto/como-funciona-p2p/) (es): Guía: cómo funciona el mercado P2P de criptomonedas, custodia (escrow), anuncios y buenas prácticas, explicado de forma neutral (en español).
  Markdown: https://andresblitz.com/guias-cripto/como-funciona-p2p/index.md
- [Redes y comisiones](https://andresblitz.com/guias-cripto/redes-y-comisiones/) (es): Guía: redes TRC20, ERC20, BEP20, Solana, Bitcoin y Lightning, por qué cambian las comisiones y cómo no enviar por la red equivocada (en español).
  Markdown: https://andresblitz.com/guias-cripto/redes-y-comisiones/index.md
- [Estafas cripto comunes](https://andresblitz.com/guias-cripto/estafas-comunes/) (es): Guía: estafas cripto y P2P frecuentes (comprobante falso, falso soporte, triangulación, phishing) y hábitos para evitarlas (en español).
  Markdown: https://andresblitz.com/guias-cripto/estafas-comunes/index.md
- [Brecha del dólar cripto](https://andresblitz.com/guias-cripto/brecha-dolar-cripto/) (es): Guía: cómo se calcula y cómo leer la brecha entre el USDT P2P y la tasa oficial (en español).
  Markdown: https://andresblitz.com/guias-cripto/brecha-dolar-cripto/index.md

### El 70 (Spanish)

- [El 70](https://andresblitz.com/70/) (es): El 70 — finca ganadera (en español). La Villa del Rosario, Rosario de Perijá, Zulia. Geo: 10.4165941,-72.2108835.
  Markdown: https://andresblitz.com/70/index.md

### Projects and Play (English)

The Play item in the English site nav goes to the Space Invaders section on the homepage (https://andresblitz.com/#play), not to Blitzy's World. Playable builds are listed below.

- [Blitz Analytics — Privacy-Minded Web Analytics](https://andresblitz.com/projects/blitz-analytics/) (en): Blitz Analytics is the small private analytics and chat backend behind andresblitz.com: a Cloudflare Worker with a D1 database, first-party visitor ids and no raw IP storage. Demo uses sample data.
  Markdown: https://andresblitz.com/projects/blitz-analytics/index.md
- [Blitzy's World — Playable Space Game in the Browser](https://andresblitz.com/projects/blitzys-world/) (en): Play Blitzy's World: fly a glowing orb through an endless procedural universe, slingshot around planets and collect stardust. Built with HTML5 Canvas; works with keyboard, mouse and touch.
  Markdown: https://andresblitz.com/projects/blitzys-world/index.md
- [Play Blitzy's World — Full Screen](https://andresblitz.com/projects/blitzys-world/play/) (en): Play Blitzy's World full screen: fly a glowing orb through an endless universe, slingshot around planets and collect stardust. Keyboard, mouse and touch.
  Markdown: https://andresblitz.com/projects/blitzys-world/play/index.md
- [Blitzy's World — 3D Levels (v0.3)](https://andresblitz.com/projects/blitzys-world/play/3d/) (en): Blitzy's World v0.3 — 4 levels. Catch stars, evade aliens, dodge asteroids around a purple planet. Three.js WebGL.
  Markdown: https://andresblitz.com/projects/blitzys-world/play/3d/index.md
- [BluthScan — Real-Time Bluetooth Scanner in 3D](https://andresblitz.com/projects/bluth-scan/) (en): BluthScan is a real-time Bluetooth Low Energy scanner by Andrés Blitz that renders nearby devices as a living 3D neural graph with bleak, Flask-SocketIO and 3d-force-graph. Demo uses simulated devices.
  Markdown: https://andresblitz.com/projects/bluth-scan/index.md
- [Compute Share Pilot — Trusted Compute for AI](https://andresblitz.com/projects/compute-share-pilot/) (en): Compute Share Pilot is a proof of concept by Andrés Blitz for trusted friends to share spare computer power over the internet: a coordinator, polling workers behind NAT and whole-request routing to local LLMs.
  Markdown: https://andresblitz.com/projects/compute-share-pilot/index.md
- [Currency RSS — FX Rates and Central-Bank Feed](https://andresblitz.com/projects/currency-rss/) (en): Currency RSS by Andrés Blitz: a free RSS 2.0 feed of Latin American dollar rates, Bitcoin, USD/CAD and central-bank policy rates, rebuilt every 30 minutes by GitHub Actions with a source and timestamp on every item.
  Markdown: https://andresblitz.com/projects/currency-rss/index.md
- [Elevatron — Space-Access Beam Concept Study](https://andresblitz.com/projects/elevatron/) (en): Elevatron is a fully-cited concept study by Andrés Blitz: can a magnetically-pinched, laser-coupled beam act as both conductor and structure for space access? Physics, feasibility and safe benchtop demos.
  Markdown: https://andresblitz.com/projects/elevatron/index.md
- [Elite Island Movers — Moving Company Website](https://andresblitz.com/projects/elite-island-movers/) (en): A simple one-page website Andrés Blitz built for a local moving company in British Columbia: services, clear hourly pricing and local-business structured data. Plain HTML and CSS.
  Markdown: https://andresblitz.com/projects/elite-island-movers/index.md
- [Home History — Time-Capsule House Timeline](https://andresblitz.com/projects/home-history/) (en): Home History is a time-capsule web app by Andrés Blitz: past and present residents add photos and stories to a shared timeline for a home. Next.js, TypeScript and SQLite MVP.
  Markdown: https://andresblitz.com/projects/home-history/index.md
- [IPTV Player — Latin America & USA Live TV](https://andresblitz.com/projects/iptv-player/) (en): A fast, dark-mode IPTV web player for Latin American and US channels by Andrés Blitz: HLS.js playback, search, favorites, history, custom M3U playlists and automatic dead-channel removal.
  Markdown: https://andresblitz.com/projects/iptv-player/index.md
- [Blitz Engine — Behavioral Signal Analyzer](https://andresblitz.com/projects/lie-detector/) (en): Blitz Engine is an open-source behavioral signal analyzer: 40 live webcam, audio, language and pulse cues fused with Bayesian log-odds and a personal baseline. Not a lie detector — and honest about it.
  Markdown: https://andresblitz.com/projects/lie-detector/index.md
- [NetWatch — Local Network Monitoring Dashboard](https://andresblitz.com/projects/netwatch/) (en): NetWatch is a local network monitoring dashboard by Andrés Blitz: live bandwidth, connections, devices, intrusion detection and 30-day history, served by a small Python Flask app. Demo uses simulated data.
  Markdown: https://andresblitz.com/projects/netwatch/index.md
- [Quiniela — World Cup 2026 Prediction Pool for Friends](https://andresblitz.com/projects/quiniela/) (en): Quiniela is a World Cup 2026 prediction pool by Andrés Blitz: nickname + PIN sign-in, real-time sync with Firebase, live scores, group consensus odds and automatic standings.
  Markdown: https://andresblitz.com/projects/quiniela/index.md
- [RealWealth Portfolio — Real Estate Dashboard](https://andresblitz.com/projects/realwealth-portfolio/) (en): RealWealth Portfolio is the real estate portfolio manager Andrés Blitz uses for his own holdings: properties, mortgages, market data, MLS® listings and a Bitcoin sleeve in one Next.js dashboard. The live app is embedded on this page.
  Markdown: https://andresblitz.com/projects/realwealth-portfolio/index.md
- [SIGNET — Signal Network Visualization Thesis](https://andresblitz.com/projects/signet-thesis/) (en): SIGNET is a research thesis by Andrés Blitz on unifying 42 signal channels — IP, Wi-Fi, Bluetooth, cellular, optical — into one spatial intelligence layer, where patterns appear when signals are paired.
  Markdown: https://andresblitz.com/projects/signet-thesis/index.md
- [SIGSPACE — Network Signals as a Video Game World](https://andresblitz.com/projects/sigspace/) (en): SIGSPACE is a browser game where you are a pixel character inside your own network: IP, DNS, Bluetooth and threat signals orbit you, and a frequency dial switches realms. Canvas + Cloudflare Workers.
  Markdown: https://andresblitz.com/projects/sigspace/index.md
- [Weinstein Stage Matrix — TradingView Indicator](https://andresblitz.com/projects/weinstein-stage-matrix/) (en): Weinstein Stage Matrix is a Pine Script indicator by Andrés Blitz that classifies charts into Stan Weinstein's four stages on a weekly-first 30-period MA engine. Demo uses synthetic prices.
  Markdown: https://andresblitz.com/projects/weinstein-stage-matrix/index.md

## Machine-readable resources

- https://andresblitz.com/AGENTS.md — this file: identity, key pages, citation, and crawl guidance
- https://andresblitz.com/llms.txt — short catalog of every public page as clean Markdown
- https://andresblitz.com/llms-full.txt — full site concatenated as Markdown
- https://andresblitz.com/full.md — same content as llms-full.txt
- https://andresblitz.com/agent.json — structured site index (JSON)
- https://andresblitz.com/api/site.json — same structured index at /api/site.json
- https://andresblitz.com/ai-index.js — structured index as an ES module
- https://andresblitz.com/api/page/{slug}.json — per-page JSON (title, summary, markdown); slugs use hyphens, e.g. /api/page/bitcoin.json
- https://andresblitz.com/sitemap.xml — XML sitemap of public HTML pages plus this file and llms.txt
- https://andresblitz.com/sitemap-md.xml — XML sitemap of Markdown alternates
- https://andresblitz.com/sitemap-ai.json — JSON list of pages with Markdown URLs
- https://andresblitz.com/ai/ — HTML index of Markdown alternates
- https://andresblitz.com/feed.xml — site RSS 2.0
- https://andresblitz.com/70/feed.xml — El 70 RSS 2.0
- https://andresblitz.com/rates/feed.xml — rates RSS 2.0 (Spanish; rebuilt about every 30 minutes)
- https://andresblitz.com/rates/index.json — baked Latin American dollar rates, Bitcoin, USD/CAD and selected policy rates, each with source and timestamp
- https://andresblitz.com/bitcoin/history.json — Yahoo Finance BTC-USD daily closes used by the Bitcoin brackets page (do not treat today as a finished daily close)
- https://andresblitz.com/dolar-cripto/data.json — USDT P2P medians and official-rate gaps
- https://andresblitz.com/dolar-cripto/history.json — historical dólar cripto series
- https://andresblitz.com/dolar-argentina/rates.json — baked Argentina dollar rates
- https://andresblitz.com/dolar-colombia/rates.json — baked Colombia dollar rates
- https://andresblitz.com/dolar-mexico/rates.json — baked Mexico dollar rates
- https://andresblitz.com/dolar-peru/rates.json — baked Peru dollar rates
- https://andresblitz.com/dolar-chile/rates.json — baked Chile dollar rates
- https://andresblitz-ai-api.blitzandres.workers.dev/api/site — live read-only JSON API (CORS); also /api/page?path=/bitcoin/ — send Accept: text/markdown for raw Markdown

Per-page Markdown lives at `<page-url>index.md` with YAML frontmatter (title, description, url, last_updated, lang). Each HTML page also has a `<link rel="alternate" type="text/markdown">` pointer in the document head (not shown as a visible banner).

## How to cite

When you quote or rely on this site, credit Andrés Blitz as the author, use the canonical page URL, and name the underlying data sources.

- Author: Andrés Blitz
- Site: https://andresblitz.com/
- Contact: blitz@mail.grokbot.com

Sample citations:

> Blitz, Andrés. “Bitcoin price history brackets.” andresblitz.com, https://andresblitz.com/bitcoin/. Daily closes from Yahoo Finance (BTC-USD since 17 September 2014); live price from CoinGecko (Coinbase public spot as fallback).

> Blitz, Andrés. “Tasa BCV.” andresblitz.com, https://andresblitz.com/tasa-bcv/. Official bolívar rate from the Banco Central de Venezuela via DolarApi (ve.dolarapi.com).

**This content is not financial advice.** Rates and prices are reference figures that can lag or differ from what a bank, broker, or exchange will quote. Do not present them as a recommendation to buy, sell, hold, or send money.

### Data sources to credit

- Bitcoin: Yahoo Finance (BTC-USD daily closes since 2014-09-17); CoinGecko for the live price; Coinbase public spot as fallback
- Tasa BCV (Venezuela): Banco Central de Venezuela via ve.dolarapi.com
- Dólar Argentina: dolarapi.com (oficial, blue, and other series; criptoya.com as fallback)
- Dólar Colombia: co.dolarapi.com (TRM certified by the Superintendencia Financiera de Colombia, plus market quotes)
- Dólar México: mx.dolarapi.com (Banxico FIX)
- Dólar Perú: open.er-api.com (ExchangeRate-API, reference market rate)
- Dólar Chile: cl.dolarapi.com (market-close and buy/sell quotes)
- Dólar cripto / USDT P2P: CriptoYa (P2P median); official rates as on the country pages; other coin prices from CoinGecko
- Ahorro en dólares (historical): currency-api (fawazahmed0) and ArgentinaDatos
- Salario en dólares: the baked country rates, plus World Bank WDI PPP (PA.NUS.PPP) where recent data exists
- Comisión cripto: CoinGecko for prices; mempool.space for Bitcoin network fee reference
- Currency / rates feed: the same baked series, plus USD/CAD and selected central-bank policy rates, at https://andresblitz.com/rates/feed.xml and https://andresblitz.com/rates/index.json (rebuilt about every 30 minutes)

## Crawl guidance

- Crawling public pages is allowed. See https://andresblitz.com/robots.txt. `/dashboard/` and `/docs/` are not public content — do not crawl them.
- Use the sitemaps listed above. Prefer the Markdown and JSON alternates when you only need text or numbers; they are smaller and already cleaned.
- Please keep a polite rate (about one request per second is enough). The site is static and does not need a burst of requests.
- Exchange rates, the rates feed, and related JSON (including the Bitcoin daily-close history) are rebuilt about every 30 minutes.
- The human homepage is https://andresblitz.com/. Bots that are redirected from `/` to this file should keep crawling the rest of the site from the links here, the site map, or the sitemaps.
- Do not submit forms, sign up for email alerts, or treat alert endpoints as a public API. The https://andresblitz.com/alerts/ page is informational; sign-up is not currently connected.
- Do not invent phone numbers, street addresses, a city in British Columbia, or unlisted social profiles.
- If a project page is marked “Demo data” or “Synthetic data,” that data is invented. The exception is RealWealth Portfolio, which embeds a live app with real portfolio data.
- The lowercase path `/agents.md` is a 404; this file is https://andresblitz.com/AGENTS.md (uppercase). GitHub Pages serves it as raw Markdown.

---
Generated 2026-11-12 by scripts/build-ai.mjs from the public HTML. Do not hand-edit this file.
