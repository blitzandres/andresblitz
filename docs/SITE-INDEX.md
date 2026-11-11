# Site index — andresblitz.com

A page-by-page map of the public site so anyone working on it knows what each page is, where it lives, and what must not change. For the locked homepage itself, read [HOMEPAGE.md](HOMEPAGE.md) first.

The live site is GitHub Pages from [`blitzandres/andresblitz`](https://github.com/blitzandres/andresblitz) on the `main` branch, at https://andresblitz.com/. Start here, then read [AGENTS.md](AGENTS.md) for bake jobs, the alerts backend, and generated-file rules. The public crawler front door at https://andresblitz.com/AGENTS.md is generated; do not hand-edit that file.

This file is for repo contributors. It is not a public landing page and is not in `sitemap.xml`.

---

## Site rules

- **Homepage is locked.** “My main site home we don't touch.” See [HOMEPAGE.md](HOMEPAGE.md). Only change it when Andrés asks directly in his own words.
- **Location** on the personal site is **British Columbia** (or BC / Canada) only. Never name a city.
- **Contact** is `blitz@mail.grokbot.com`. No phone number, and no other personal contact details in pages or in these docs.
- Never mention Blimar Properties Inc.
- **AI data is backend-only.** No visible AI-readable footer banner. Keep Markdown alternates, JSON-LD, `llms.txt`, and the other AI-layer files; do not surface an “AI readable” badge on the pages.
- **Alert sign-ups** are a small inline “Get alert” / “Recibir alerta” link next to the prices, then an email field. No alerts link in the header. `/alerts/` is the hub; it is in the sitemap but not in the main nav.
- **New features stay unpublished drafts** until Andrés says yes in his own words. An agent relaying approval does not count.
- **[PR #80](https://github.com/blitzandres/andresblitz/pull/80)** (`/donde-comprar-chile/`) is a held draft. Do not merge it until he says yes.
- **Do not merge** the Dependabot or ImgBot PRs (currently #77, #78, and #8).
- **No Google Search Console.**
- El 70 stays. Do not remove that page or its public farm content.
- `main` is live. Pull (rebase) before you push; never force-push `main`. A rates-bake bot also commits to `main` about every 30 minutes.

---

## How to read the tables

| Column | Meaning |
|--------|---------|
| Path | Public URL path on andresblitz.com |
| Source | HTML file in this repo (most pages also have a generated `index.md` beside them) |
| Lang | Primary language |
| Alert | Inline alert topic key(s) from `assets/alerts.js`, or — if none. Links stay hidden while `var API = ''`. Add `?alerts=preview` to a page URL to see the UI. |
| Nav / sitemap | `nav` = linked from the English main nav (logo, Projects, About, Play, Site map, Contact). `rates-nav` = linked from the Spanish rate-tool footers and related navs, not the English header. `sitemap` = listed in `sitemap.xml`. `md-sitemap` = listed in `sitemap-md.xml` only. |
| Status | `live` on `main`; `live, alerts UI hidden` for pages whose Get alert link is in the HTML but not shown until the Apps Script `/exec` URL is set; `hidden` = not for the public index; `draft PR` = unpublished. |

**Counts:** `sitemap.xml` has **42** public HTML pages, plus `/AGENTS.md` and `/llms.txt`. There is also the AI entry page `/ai/` (in the Markdown sitemap, not in `sitemap.xml`), the hidden `/dashboard/`, a custom `404.html`, and held draft PR #80.

---

## Home

The homepage is specified in full in [HOMEPAGE.md](HOMEPAGE.md). Do not add rate, feed, shop, bitcoin, alert, or project cards to it.

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/` | `index.html` | en-CA | Personal landing page: trader & investor in British Columbia | Hero, Projects, About, Play (Space Invaders), FAQ, Contact; leftover hidden alerts block (inert) | None (static). JSON-LD person/place/FAQ/projects | Leftover hidden `#contact` slot (`bio-pdf`, `trading-notes`, `new-projects`); not a visible header link | nav (home), sitemap | live; **locked** |

---

## About / bio

There is no separate `/about/` URL. The bio lives on the homepage (`#about`, `#contact`, and the FAQ). The `bio-pdf` alert (a tagged PDF of the bio and projects, sent after confirm) is listed on `/alerts/`.

---

## Exchange-rate country pages

Live quotes are baked into each page and into `/rates/` by `.github/workflows/rates.yml` (about every 30 minutes). Spanish pages use their own in-page nav and a related-tools footer back to home; they are not in the English header.

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/tasa-bcv/` | `tasa-bcv/index.html` | es-VE | Official BCV dollar (and euro) in bolívares | Tasas hoy, convertidor, comprar BTC, préstamos, brecha, IVA 16%, historial, medios de pago, Maracaibo y Zulia, Toyotas, delivery, predicciones, preguntas | Banco Central de Venezuela vía ve.dolarapi.com; CoinGecko and Polymarket on some widgets. Baked: `rates/index.json` series `tasa-bcv`. Own `tasa-bcv/sitemap.xml` | `bcv-daily` (picker also offers `dolar-gap`, `rates-weekly`); country `VE` | rates-nav, sitemap | live, alerts UI hidden |
| `/dolar-argentina/` | `dolar-argentina/index.html` | es-AR | Dólar hoy in Argentina | Cotizaciones, conversor, explicación of oficial / blue / MEP / CCL / cripto / tarjeta, FAQ, other tools | dolarapi.com (fallback criptoya.com). Baked: `dolar-argentina/rates.json`, rates series `dolar-argentina` and `dolar-argentina-blue` | `dolar-gap` (picker also `rates-weekly`); country `AR` | rates-nav, sitemap | live, alerts UI hidden |
| `/dolar-colombia/` | `dolar-colombia/index.html` | es-CO | Dólar hoy in Colombia (TRM) | Cotización TRM, mercado, conversor, explicación, FAQ, other tools | Superintendencia Financiera vía datos.gov.co; mercado vía co.dolarapi.com. Baked: `dolar-colombia/rates.json` | `dolar-gap` (picker also `rates-weekly`); country `CO` | rates-nav, sitemap | live, alerts UI hidden |
| `/dolar-mexico/` | `dolar-mexico/index.html` | es-MX | Dólar hoy in Mexico (FIX) | FIX, compra/venta, conversor, explicación, FAQ, other tools | mx.dolarapi.com (FIX de Banxico); fallback Rates By Exchange Rate API. Baked: `dolar-mexico/rates.json` | `rates-weekly` | rates-nav, sitemap | live, alerts UI hidden |
| `/dolar-peru/` | `dolar-peru/index.html` | es-PE | Dólar hoy in Peru | Tipo de cambio in soles, conversor, explicación, FAQ, other tools | open.er-api.com (ExchangeRate-API, reference market rate); fallback Rates By Exchange Rate API. Baked: `dolar-peru/rates.json` | `rates-weekly` | rates-nav, sitemap | live, alerts UI hidden |
| `/dolar-chile/` | `dolar-chile/index.html` | es-CL | Dólar hoy in Chile | Dólar observado, compra/venta, conversor, explicación, FAQ, other tools | mindicador.cl (dólar observado, Banco Central de Chile). Baked: `dolar-chile/rates.json` | `rates-weekly` | rates-nav, sitemap | live, alerts UI hidden |
| `/enviar-dinero/` | `enviar-dinero/index.html` | es | Cost of sending money from Canada or the US to VE, CO, MX, AR, PE, or CL | Calculator of fee plus margin vs the reference rate; estimates only, no provider quotes | Same baked country rates as above (`rates/index.json`) | — | rates-nav, sitemap | live |
| `/salario-en-dolares/` | `salario-en-dolares/index.html` | es | Convert a monthly or annual salary in VES, COP, MXN, ARS (oficial and blue), PEN, CLP, or CAD to USD, and to international dollars where PPP exists | Calculator, reference-rate table, PPP note | Country rates from the bake; PPP from World Bank WDI `PA.NUS.PPP` | — | rates-nav, sitemap | live |

**Held draft (not on `main`, not in the sitemap):** [PR #80](https://github.com/blitzandres/andresblitz/pull/80) would add `/donde-comprar-chile/`, a “where to shop in Chile” landing page, and a link from `/dolar-chile/`. Leave it unpublished until Andrés says yes.

---

## Crypto tools and guides

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/dolar-cripto/` | `dolar-cripto/index.html` | es | USDT P2P “dólar cripto” in VE, AR, and CO, with the gap vs the official rate | Country cards and gap, chart, table, other coins, how-it-works, FAQ, other tools | Official rates as on the country pages; USDT P2P median from CriptoYa (Binance P2P or Yadio as available); coins from CoinGecko. Baked: `dolar-cripto/data.json`, `dolar-cripto/history.json` | `dolar-gap` (picker also `rates-weekly`) | rates-nav, sitemap | live, alerts UI hidden |
| `/convertidor-cripto/` | `convertidor-cripto/index.html` | es | Convert BTC, sats, ETH, USDT, USDC, SOL, XRP, BNB to VES, ARS (oficial and blue), COP, MXN, PEN, CLP, USD, CAD and back | Converter, per-rate source and time | CoinGecko for crypto; country rates from the bake | — | rates-nav, sitemap | live |
| `/comision-cripto/` | `comision-cripto/index.html` | es | Estimate how much arrives when sending USDT, USDC, or BTC on a given network | Calculator (user types the withdrawal fee), % fee, local-currency value, remittance comparison | CoinGecko for prices; mempool.space for Bitcoin network fee reference | — | rates-nav, sitemap | live |
| `/ahorro-en-dolares/` | `ahorro-en-dolares/index.html` | es | Historical “what would those bolívares or pesos be worth in USD today” calculator | Horizon picker, comparison vs having changed to USD/USDT that day; dated sources, no forecasts | History: currency-api (fawazahmed0) and ArgentinaDatos; “today” rates from the bake (`scripts/bake-ahorro.mjs`) | — | rates-nav, sitemap | live |
| `/guias-cripto/` | `guias-cripto/index.html` | es | Beginner crypto guides in Spanish (informational, not advice) | Hub linking the five guides below | Static | — | rates-nav, sitemap | live |
| `/guias-cripto/que-es-usdt/` | `guias-cripto/que-es-usdt/index.html` | es | What USDT and stablecoins are | Explainer | Static | — | sitemap | live |
| `/guias-cripto/como-funciona-p2p/` | `guias-cripto/como-funciona-p2p/index.html` | es | How P2P crypto markets work | Explainer (escrow, ads, good practice) | Static | — | sitemap | live |
| `/guias-cripto/redes-y-comisiones/` | `guias-cripto/redes-y-comisiones/index.html` | es | Networks and fees (TRC20, ERC20, BEP20, Solana, Bitcoin, Lightning) | Explainer | Static | — | sitemap | live |
| `/guias-cripto/estafas-comunes/` | `guias-cripto/estafas-comunes/index.html` | es | Common crypto / P2P scams and how to avoid them | Explainer | Static | — | sitemap | live |
| `/guias-cripto/brecha-dolar-cripto/` | `guias-cripto/brecha-dolar-cripto/index.html` | es | How to read the crypto-dollar gap vs the official rate | Explainer pointing at `/dolar-cripto/` | Static | — | sitemap | live |

The `guias-pdf` alert (all five guides as one tagged PDF, sent after confirm) is offered on `/alerts/`, not as an inline bell on each guide.

---

## Bitcoin

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/bitcoin/` | `bitcoin/index.html` | en (hreflang `en` + `x-default`; worldwide, not a country) | Days Bitcoin closed in each USD price bracket, with a live bar for today. Prices in USD, usable from any country. | Bracket-size control ($3k / $5k / $10k / $15k), chart, table, FAQ (including worldwide/USD). Times in PT. JSON-LD: WebPage, WebApplication (`areaServed` Worldwide), Dataset (`spatialCoverage` Earth), FAQPage, BreadcrumbList. No `geo.region` / city tags. | Completed days: Yahoo Finance BTC-USD daily closes from 2014-09-17, baked to `bitcoin/history.json` by `scripts/bake-btc-history.mjs`. Live price for the open day: CoinGecko, Coinbase public spot as fallback | `btc-bracket` | English chrome nav (not a header item of its own), sitemap, `/projects/`, crypto tool footers | live, alerts UI hidden |

This page is also listed from `/projects/` as “Bitcoin price brackets,” and from the Spanish crypto tool footers (`/dolar-cripto/`, `/convertidor-cripto/`, `/comision-cripto/`). It is not featured on the locked homepage. There is no Spanish translation of `/bitcoin/` itself; do not invent an alternate URL. Targeting is worldwide (`areaServed` Worldwide, `spatialCoverage` Earth). Owner location, if shown, stays “British Columbia, Canada” in the footer only — never a city.

---

## Projects and Play / Blitzy’s World

English project pages use the shared chrome nav (Projects, About, Play, Site map, Contact) and `assets/projects.css`. The Play nav item on these pages jumps to the homepage `#play` (Space Invaders), not to Blitzy’s World.

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/projects/` | `projects/index.html` | en-CA | Directory of tools, games, and experiments | Card list of every project below, plus a link to `/bitcoin/` and Currency RSS | Static | — | nav, sitemap | live |
| `/projects/blitzys-world/` | `projects/blitzys-world/index.html` | en-CA | Project page for the playable space game | Write-up and links into the playable builds | Static / game assets | — | sitemap | live |
| `/projects/blitzys-world/play/` | `projects/blitzys-world/play/index.html` | en-CA | Full-screen Blitzy’s World (2D) | Playable canvas game | Game itself | — | sitemap | live |
| `/projects/blitzys-world/play/3d/` | `projects/blitzys-world/play/3d/index.html` | en-CA | Blitzy’s World v0.3, 3D levels | Playable Three.js / WebGL levels | Game itself | — | sitemap | live |
| `/projects/realwealth-portfolio/` | `projects/realwealth-portfolio/index.html` | en-CA | Live real-estate portfolio dashboard | Write-up; embeds the live app (real portfolio data — the exception to “demo data” on project pages) | Live embedded app | — | sitemap | live |
| `/projects/lie-detector/` | `projects/lie-detector/index.html` | en-CA | Blitz Engine, an open-source behavioral signal analyzer | Write-up and demo notes | Demo / project repo | — | sitemap | live |
| `/projects/sigspace/` | `projects/sigspace/index.html` | en-CA | Network signals rendered as a browser game world | Write-up and playable demo | Demo / Cloudflare Workers in the project | — | sitemap | live |
| `/projects/weinstein-stage-matrix/` | `projects/weinstein-stage-matrix/index.html` | en-CA | TradingView Pine indicator for Stan Weinstein’s four stages | Write-up; demo uses synthetic prices | Synthetic demo data | — | sitemap | live |
| `/projects/iptv-player/` | `projects/iptv-player/index.html` | en-CA | Latin America and USA live-TV player | Write-up | Project repo | — | sitemap | live |
| `/projects/netwatch/` | `projects/netwatch/index.html` | en-CA | Local network monitoring dashboard | Write-up | Demo / project repo | — | sitemap | live |
| `/projects/bluth-scan/` | `projects/bluth-scan/index.html` | en-CA | Real-time Bluetooth scanner as a 3D graph | Write-up | Demo / project repo | — | sitemap | live |
| `/projects/signet-thesis/` | `projects/signet-thesis/index.html` | en-CA | SIGNET: thesis on unifying many signal channels | Write-up | Static | — | sitemap | live |
| `/projects/elevatron/` | `projects/elevatron/index.html` | en-CA | Cited concept study of a beam to space | Write-up | Static | — | sitemap | live |
| `/projects/home-history/` | `projects/home-history/index.html` | en-CA | Time-capsule timeline for a house | Write-up | Demo / project repo | — | sitemap | live |
| `/projects/quiniela/` | `projects/quiniela/index.html` | en-CA | World Cup 2026 prediction pool for friends | Write-up | Project repo | — | sitemap | live |
| `/projects/compute-share-pilot/` | `projects/compute-share-pilot/index.html` | en-CA | Trusted compute sharing for remote AI jobs | Write-up | Project repo | — | sitemap | live |
| `/projects/blitz-analytics/` | `projects/blitz-analytics/index.html` | en-CA | Privacy-minded web analytics behind this site (public write-up) | Write-up. The private dashboard is `/dashboard/`, not this page | Static write-up | — | sitemap | live |
| `/projects/elite-island-movers/` | `projects/elite-island-movers/index.html` | en-CA | One-page site for a local moving company | Write-up | Static / project | — | sitemap | live |
| `/projects/currency-rss/` | `projects/currency-rss/index.html` | en-CA | Explains the LatAm / Bitcoin / central-bank rates RSS feed | Write-up and feed links | The baked `/rates/feed.xml` (and `/rates/index.json`) | — | sitemap | live |

---

## El 70

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/70/` | `70/index.html` | es-VE | Public page for the El 70 cattle farm in Zulia, Venezuela (Agropecuaria Blimar C.A.) | La finca, dairy, beef, gallery, infrastructure, land, employment, contact, messages | Static page content; updates also appear in `/70/feed.xml`. Own `70/sitemap.xml` | `el70` is offered on `/alerts/` (new items in `/70/feed.xml`), not as an inline bell on this page | Linked from rate-page footers and the site map; sitemap | live |

---

## Site map and alerts hub

| Path | Source | Lang | Purpose | Main content / sections | Data sources | Alert | Nav / sitemap | Status |
|------|--------|------|---------|-------------------------|--------------|-------|---------------|--------|
| `/site-map/` | `site-map/index.html` | en-CA | Clickable tree of every public page | Interactive tree grouped in the page script (`SECTIONS` / `GROUPS`): Projects, Dólar hoy, Calculadoras, Guías cripto, Bitcoin, El 70 | Built at run time from `api/site.json` | — | nav (next to Play), sitemap | live |
| `/alerts/` | `alerts/index.html` | en-CA | Hub listing every email-alert topic | Intro, one card per topic (Bitcoin brackets, daily Tasa BCV, crypto-dollar gap, weekly LatAm rates, new projects, monthly trading notes, El 70 news, bio PDF, guías PDF), privacy note | Front end only; sign-ups go to the Apps Script backend (see below). The page still carries a short “open here soon” line until the `/exec` URL is wired | Each topic uses `data-open` so the email field shows on the card (still hidden while `API` is empty) | sitemap only — **not** in the main nav | live, alerts UI hidden |

---

## Notes

There is **no** `/notes/` page or `/notes/feed.xml` in the repo yet. The `trading-notes` alert topic (monthly market view with a Weinstein stage summary) is listed on `/alerts/` and will read `/notes/feed.xml` once that feed exists. Do not invent the notes section until Andrés asks for it.

---

## Hidden, utility, and non-indexed pages

| Path | Source | Lang | Purpose | Notes | Status |
|------|--------|------|---------|-------|--------|
| `/dashboard/` | `dashboard/index.html` | en-CA | Private analytics dashboard for this site | `robots.txt` disallows it; the page is `noindex, nofollow`. Data is written daily by `.github/workflows/analytics.yml` into `dashboard/data/`. Not in any sitemap. No `index.md` | hidden |
| `/404.html` (any missing URL) | `404.html` | en | Custom “Page not found” | Not in the sitemap | live utility |
| `/donde-comprar-chile/` | branch `feat/donde-comprar-chile` (PR #80) | es | “Where to shop in Chile” landing (draft) | Unpublished. Do not merge until Andrés says yes | draft PR |

---

## AI layer (backend; do not hand-edit)

These are generated by `scripts/build-ai.mjs` during the rates bake (and whenever that script is run). Change the generator or the source page, not the output files. There is no visible “AI readable” banner on the HTML pages.

| Path / file | What it is |
|-------------|------------|
| `/ai/` (`ai/index.html`, `ai/index.md`) | Markdown entry point listing every clean `.md` page |
| `/llms.txt` | Agent site map (summaries and links) |
| `/llms-full.txt` and `/full.md` | Full Markdown dump |
| `/agent.json`, `/ai-index.js`, `/api/site.json` | Structured site index |
| `/api/page/<slug>.json` | Per-page title, summary, and Markdown |
| `/sitemap-ai.json`, `/sitemap-md.xml` | AI and Markdown sitemaps (`robots.txt` advertises `sitemap-md.xml`) |
| `*/index.md` next to each public HTML page | Clean Markdown alternate; each HTML page also has `<link rel="alternate" type="text/markdown">` and an inline `<script type="application/json" id="ai-structure">` |
| `/feed.xml`, `/70/feed.xml`, `/rates/feed.xml` | RSS 2.0 feeds (site, El 70, and the rates feed) |
| Live read-only JSON API | Cloudflare Worker `andresblitz-ai-api` (see `worker/`). Leave existing worker bindings alone |

`/ai/` is public and listed in `sitemap-md.xml`, but not in `sitemap.xml`.

---

## Shared assets and backends

### Front end

- `assets/projects.css` — shared tokens, nav, and footer for English pages.
- `assets/alerts.js` — inline Get alert UI. `var API = ''` means the links stay hidden. `?alerts=preview` shows the UI for review. When the Apps Script web app is deployed, paste the `/exec` URL into `API` and push; steps are in [google-sheets/README.md](../google-sheets/README.md).
- `assets/vendor/` — uPlot, svg-gauge, sparkline, d3-hierarchy (see its README).
- Topic keys (front end and `google-sheets/alerts.gs` must stay in sync): `btc-bracket`, `bio-pdf`, `dolar-gap`, `bcv-daily`, `rates-weekly`, `guias-pdf`, `new-projects`, `trading-notes`, `el70`, `calc-result` (`calc-result` has no on-page link yet).

### Rates cron (GitHub Actions)

`.github/workflows/rates.yml` runs about every 30 minutes: `scripts/bake-rates.mjs`, `bake-crypto.mjs`, `bake-btc-history.mjs`, `bake-ahorro.mjs`, `bake-feed.mjs`, then `scripts/build-ai.mjs`, and commits if anything changed. Published data includes `/rates/index.json`, `/rates/items.json`, `/rates/feed.xml`, per-country `rates.json`, `/dolar-cripto/data.json`, `/bitcoin/history.json`, and the AI-layer files above.

`/rates/index.json` also carries USD/CAD and selected policy rates (Bank of Canada, Bank of England, New York Fed effective funds, PBOC LPR) for the rates feed. Those series are not homepage cards.

### Email alerts backend

A Google Sheet in Andrés’s Drive plus a Google Apps Script with a free 30-minute time trigger. The script handles sign-up, confirm, unsubscribe, and the cron. Nothing paid, and Cloudflare is not used for this. Details, sender rules, and the one-time deploy steps are in [google-sheets/README.md](../google-sheets/README.md) (do not copy private Drive URLs out of that file). Reply-To and the public contact address are `blitz@mail.grokbot.com`.

### Sitemaps and IndexNow

- HTML sitemap: `/sitemap.xml` (42 public HTML pages, plus `/AGENTS.md` and `/llms.txt`). Also `/70/sitemap.xml` and `/tasa-bcv/sitemap.xml`. All three, plus `/sitemap-md.xml`, are listed in `robots.txt`.
- Do **not** add `docs/` (this folder) to any sitemap.
- IndexNow verification key is the public file `/2227d3fcc4a8431390efd4e8bc45dbbd.txt` at the repo root. There is no IndexNow ping script in this repo today.
- `robots.txt` disallows `/dashboard/` and `/docs/`. It allows the usual AI crawlers to the rest of the site. Do not add Google Search Console setup.

### Other repo docs

- [AGENTS.md](AGENTS.md) — contributor index: moving parts, bake jobs, alerts implementation. (The public `/AGENTS.md` is a separate, generated crawler front door.)
- [README.md](../README.md) — short public-repo readme.
- [CLAUDE.md](../CLAUDE.md) — pointer at docs/AGENTS.md and these docs.
- [google-sheets/README.md](../google-sheets/README.md) — alerts Sheet + Apps Script.

---

## What this folder is

`docs/` is contributor documentation only (`SITE-INDEX.md`, `HOMEPAGE.md`, and `AGENTS.md`). GitHub Pages may serve the raw Markdown if someone opens the URL; that is fine. Do not add a public HTML index here, and do not list `docs/` in `sitemap.xml`. `robots.txt` already disallows `/docs/`.
