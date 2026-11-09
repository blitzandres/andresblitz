# Email alerts: Google Sheet + Apps Script

All the logic is one file: [`alerts.gs`](alerts.gs) (manifest: [`appsscript.json`](appsscript.json)).
It runs as a free Google Apps Script under Andrés's Google account. Nothing runs on Cloudflare, on
GitHub or on the computer, and no paid service is used.

- **Sheet:** "andresblitz alerts" in Drive, id `1_euDXSIqZqgVkJneCbKasuOdbDYiE27QrBAmfNoaF18`,
  tabs `subs`, `pdfs`, `state`, `log`. `CONFIG.SHEET_ID` points at it, so the script works as a
  standalone project or bound to the Sheet.
- **Script:** "andresblitz alerts script" in Drive (a copy of `alerts.gs` + `appsscript.json`).
- **Sign-ups** from the small "Get alert" links (`assets/alerts.js`) land as rows in `subs`, and
  the person gets a confirm link by email. Only confirmed rows get alerts.
- **The cron:** a 30-minute time trigger calls `cron()`. It reads the JSON the site already
  publishes (`/bitcoin/history.json`, `/dolar-cripto/data.json`, `/rates/index.json`,
  `/api/site.json`, `/70/feed.xml`, `/notes/feed.xml`) and emails people only when something
  changed. Every email has an unsubscribe link.

## Sender

Mail goes out through Gmail of the account that owns the script, named "andresblitz.com Alerts",
with **Reply-To `blitz@mail.grokbot.com`** (replies reach the Grok Bot inbox).

- The From address is the account's own address, or `info@andresblitz.com` if that is added as an
  alias of the account (Google Workspace Admin → Users → the user → Alternate email addresses).
  Same domain, so no SMTP password is needed, and Workspace signs it for andresblitz.com.
- `blitz@mail.grokbot.com` **cannot** be the From address: `mail.grokbot.com` publishes
  `DMARC p=reject` and its SPF only allows Amazon SES, so Gmail-sent mail claiming that From would
  be rejected, and Gmail would need that domain's SMTP login to add it as an alias.
- Limits: Google Workspace sends about 1,500 script emails a day (a free Gmail about 100).

## Turn it on (one time, about 3 minutes)

1. Open the "andresblitz alerts script" project in Drive (script.google.com).
2. Pick `setup` in the function menu and click Run, then approve the permissions. This formats
   the tabs and creates the 30-minute trigger.
3. Deploy → New deployment → type Web app. "Execute as": Me. "Who has access": Anyone. Deploy and
   copy the URL that ends in `/exec`.
4. Paste that URL into `var API = ''` in `assets/alerts.js` and push. The links then appear.

To change the script later, edit it in Apps Script, then Deploy → Manage deployments → edit →
New version. That keeps the same URL.

## Test locally

```bash
node google-sheets/test.mjs   # fake Sheet + Gmail, real site data, all topics
```
