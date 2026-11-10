# AGENTS.md: index for agents working on andresblitz.com

Read [docs/SITE-INDEX.md](docs/SITE-INDEX.md) and [docs/HOMEPAGE.md](docs/HOMEPAGE.md) first. They list every public page and the locked homepage rules.

Then read this file. It lists every moving part of the site, where it lives, and the rules for
changing it. Several agents work on this repo, so keep this file up to date when you add or
move something.

## Ground rules

- `main` is live. GitHub Pages publishes it to https://andresblitz.com within minutes.
- A bot commits to `main` every ~30 minutes (rates bake). Always `git pull --rebase origin main`
  right before you push, and never force-push `main`.
- Do not change access, permissions, secrets or the bindings of existing workers. Add new things
  next to them instead.
- Do not hand-edit generated files (see "AI layer") or the regions between bake markers
  (`<!--name:start--> … <!--name:end-->`, `var FB=…/*fb*/`, `var H=…/*hist*/`).
- The site's sending address is `info@andresblitz.com`. Do not send site mail from the
  grokbot.com address.

## Map

| Area | Where | What it is |
|------|-------|------------|
| Pages | `*/index.html` + `*/index.md` | Static HTML. English: home, `/projects/`, `/bitcoin/`. Spanish: rates, calculators, guides, `/70/` |
| Shared styles | `assets/projects.css` | Tokens (`--bg`, `--accent` …), nav and footer |
| Vendored libs | `assets/vendor/` | uPlot, svg-gauge, sparkline, d3-hierarchy (see its README) |
| Site map page | `site-map/index.html` | Clickable tree built from `api/site.json`. Grouping lives in `SECTIONS` and `GROUPS` in the page script |
| Email alerts (front end) | `assets/alerts.js`, `alerts/index.html` | Sign-up cards + the `/alerts/` hub |
| Email alerts (brain) | `google-sheets/alerts.gs` | Google Apps Script in a Google Sheet: sign-ups, cron, emails, PDFs |
| AI API worker | `worker/` | Cloudflare Worker `andresblitz-ai-api`. Read-only and used by agents; leave as is |
| Analytics dashboard | `dashboard/` | Data written daily by `.github/workflows/analytics.yml` |

## Automation (GitHub Actions)

| Workflow | When | Does |
|----------|------|------|
| `rates.yml` | every ~30 min | `scripts/bake-rates.mjs`, `bake-crypto.mjs`, `bake-btc-history.mjs`, `bake-ahorro.mjs`, `bake-feed.mjs`, `build-ai.mjs`, then commits |
| `analytics.yml` | daily 06:00 UTC | GitHub traffic → `dashboard/data/` |
| `crypto-probe.yml` | PRs touching `bake-crypto.mjs` | Checks the crypto sources; writes nothing |

Data those jobs publish, which other parts read:
`/rates/index.json`, `/dolar-cripto/data.json`, `/bitcoin/history.json`, `/api/site.json`,
`/feed.xml`, `/70/feed.xml`, `/rates/feed.xml`.

## AI layer (generated, do not hand-edit)

`scripts/build-ai.mjs` writes `llms.txt`, `llms-full.txt`, `full.md`, `agent.json`,
`api/site.json`, `api/page/*.json`, `sitemap-ai.json`, `sitemap-md.xml` and `ai/index.html`.
To change them, change the script or the page it reads from.

## Email alerts

**How it works:** a small "🔔 Recibir alerta / Get alert" link sits right under the prices on
`/tasa-bcv/`, `/dolar-argentina/`, `/dolar-colombia/`, `/dolar-mexico/`, `/dolar-peru/`,
`/dolar-chile/`, `/dolar-cripto/` and `/bitcoin/` (and every topic is listed on `/alerts/`, which is
not in the nav). Clicking it opens one email field (plus a tiny picker where it applies). It posts
to the Apps Script web app, which saves a row in the "andresblitz alerts" Google Sheet
(id `1_euDXSIqZqgVkJneCbKasuOdbDYiE27QrBAmfNoaF18`, in Andrés's Drive) and emails a confirm link.
Every 30 minutes a free Apps Script time trigger runs `cron()`, which reads the site's JSON and
emails confirmed people only when something changed. Mail goes out from Andrés's Google account
(as `info@andresblitz.com` if that is an alias), named "andresblitz.com Alerts", with Reply-To
`blitz@mail.grokbot.com`.

**Status:** the Sheet and the Apps Script project ("andresblitz alerts script" in Drive) exist.
Links stay hidden while `var API = ''` in `assets/alerts.js` is empty; add `?alerts=preview` to a
page URL to see the UI. To go live, deploy the script as a web app and paste its `/exec` URL into
`API` (steps in `google-sheets/README.md`).

**Topics** (same keys in `alerts.gs` and `alerts.js`):

| Key | Sends when | Data |
|-----|------------|------|
| `btc-bracket` | BTC daily close enters a new bracket | `/bitcoin/history.json` |
| `bio-pdf` | Right after confirm (PDF attached, tagged) | `/api/site.json` |
| `dolar-gap` | VE/AR/CO gap crosses the person's % | `/dolar-cripto/data.json` |
| `bcv-daily` | Daily from 12:00 UTC | `/rates/index.json` |
| `rates-weekly` | Mondays from 13:00 UTC | `/rates/index.json` |
| `guias-pdf` | Right after confirm (PDF attached, tagged) | `/guias-cripto/*/index.md` |
| `new-projects` | New `kind: project` page | `/api/site.json` |
| `trading-notes` | New item in `/notes/feed.xml` (not created yet) | `/notes/feed.xml` |
| `el70` | New item in `/70/feed.xml` | `/70/feed.xml` |
| `calc-result` | Right after confirm, plus a reminder 30 days later | the calculator's `.res` text |

**Where links appear:** `<p class="ab-bell" data-topic="…" data-choice="…" data-country="VE" hidden></p>`
plus `<script src="/assets/alerts.js" defer></script>`. `data-choice` adds a tiny topic picker,
`data-open` shows the form without the link (used on `/alerts/`). The language follows the
nearest `lang` attribute. `calc-result` stays in `alerts.gs` but has no link on the site now.
To add a topic, add it to `TOPICS` in `alerts.gs` and `names()` in `alerts.js`, then run the test.

**Sheet tabs:** `subs` (sign-ups), `pdfs` (who received which tagged copy), `state` (what the
cron already saw), `log` (sends and errors).

**PDF tags:** the code is in the file name, a footer line and hidden text (`ab-copy:<tag>`).
To use a different encoding library, replace `stampHtml_()` in `alerts.gs`.

**Test:** `node google-sheets/test.mjs` runs the script against fake Google services and the
repo's real data.
