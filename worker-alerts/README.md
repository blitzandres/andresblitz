# andresblitz-alerts

Email sign-ups, alerts and tagged PDFs for andresblitz.com. It is a **new, separate Worker**:
`worker/` (andresblitz-ai-api, read-only, used by agents) is not changed, and none of its
bindings or permissions are touched.

## How it works

```
Page card (assets/alerts.js) ──POST /subscribe──▶ andresblitz-alerts Worker ──▶ D1 (subs)
                                                        │  sends "confirm" email
Email link ──GET /confirm──▶ Worker marks confirmed ──▶ redirects to /alerts/?ok=…

Cron every 30 min (on Cloudflare, nothing runs on your machine):
  reads the JSON the site already bakes ── /bitcoin/history.json, /dolar-cripto/data.json,
  /rates/index.json, /api/site.json, /70/feed.xml, /notes/feed.xml ── compares with D1 state,
  sends emails only on a change.
```

| # | Topic | Trigger |
|---|-------|---------|
| 1 | `btc-bracket` | BTC daily close lands in a new bracket ($3k/5k/10k/15k) |
| 2 | `bio-pdf` | Right after confirming: download link to a tagged PDF |
| 3 | `dolar-gap` | VE/AR/CO crypto-vs-official gap crosses the person's % |
| 4 | `bcv-daily` | Every day 12:00 UTC (8:00 Caracas) |
| 5 | `rates-weekly` | Mondays 13:00 UTC, change vs last Monday |
| 6 | `guias-pdf` | Right after confirming: tagged PDF of the 5 guides |
| 7 | `new-projects` | A new `kind: project` page appears in `/api/site.json` |
| 8 | `trading-notes` | A new item in `/notes/feed.xml` (publish that feed to send) |
| 9 | `el70` | A new item in `/70/feed.xml` |
| 10 | `calc-result` | Result now, reminder 30 days later |

**Tagged PDFs:** built on request from the site's own content. Each copy gets a random tag
stored in `pdf_tags` with the email. The tag is in the PDF metadata (`Subject`, `Keywords`,
`ABCopyId`), a small footer on every page, and invisible text. Downloads are counted.
To use your own encoding library, replace `stamp()` in `src/pdf.js`.

**Safety:** double opt-in, honeypot field, 6 sign-ups per IP per hour, one-click unsubscribe
(+ `List-Unsubscribe` header), CORS limited to andresblitz.com. Calculator summaries are cut to
280 characters, stripped of HTML and links, and sent only after confirming.

## One-time setup (needs Cloudflare access, run by you or an agent with it)

```bash
cd worker-alerts && npm install
npx wrangler d1 create andresblitz-alerts          # paste the id into wrangler.toml
npx wrangler d1 execute andresblitz-alerts --remote --file schema.sql
```

Then onboard `andresblitz.com` for sending in Cloudflare Email Service (dashboard → Email →
Email Sending), so `alertas@andresblitz.com` can send. Change `FROM_EMAIL` if you prefer another
address. Then:

```bash
npx wrangler deploy
```

The site cards already point at `https://andresblitz-alerts.blitzandres.workers.dev`.
Until the Worker is deployed they show "Sign-ups are not available right now".

## Test

```bash
npm test     # in-memory SQLite + captured emails + the repo's real data files; no Cloudflare needed
```
