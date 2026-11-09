# Email alerts: Google Sheet + Apps Script

All the logic is one file: [`alerts.gs`](alerts.gs). It runs inside a Google Sheet, under your
Google account. Nothing runs on your computer, on Cloudflare or on GitHub, and no agent wakes up.

- **Sign-ups** from the site cards (`assets/alerts.js`) land as rows in the Sheet.
- **The cron:** a 30-minute time trigger calls `cron()`. It reads the JSON the site already
  publishes (`/bitcoin/history.json`, `/dolar-cripto/data.json`, `/rates/index.json`,
  `/api/site.json`, `/70/feed.xml`, `/notes/feed.xml`) and emails people only when something
  changed.
- **Email** goes out through Gmail as `info@andresblitz.com`.
- **PDFs** (bio, crypto guides) are built from the site's own content, tagged with a code per
  email, attached to the email, and logged in the `pdfs` tab.

The site cards stay hidden until `API` in `assets/alerts.js` holds the web app URL, so the
live site does not change before this is connected.

## 1. Email address info@andresblitz.com

**Receive:** in Cloudflare, go to andresblitz.com → Email → Email Routing. Turn it on, then
add the custom address `info@andresblitz.com` and forward it to your Gmail. Cloudflare adds the
MX and SPF records for you. If the domain already has MX records for another mail service,
stop and check first.

**Send:** in Gmail, go to Settings → Accounts and Import → Send mail as → Add another email
address.

- Name: `Andrés Blitz`. Email: `info@andresblitz.com`. Keep "Treat as an alias" checked.
- SMTP server: `smtp.gmail.com`, port `587`, TLS.
- Username: your Gmail address.
- Password: an App Password. To make one, go to Google Account → Security, turn on 2-Step
  Verification, then open App passwords.
- Gmail sends a code to info@, which reaches you through the forward. Enter it to verify.

**DNS (Cloudflare → DNS):**

| Type | Name | Content |
|------|------|---------|
| TXT | `andresblitz.com` | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` (one SPF record only; merge if one exists) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@andresblitz.com` |

A personal Gmail signs mail with gmail.com, not andresblitz.com, so some emails may land in
spam. For full domain signing (DKIM), use Google Workspace or another sender later; only
`send_()` in `alerts.gs` needs to change.

**Limits:** a free Gmail account sends about 100 emails a day from scripts. Google Workspace
sends 1,500.

## 2. The Sheet and the script

1. Open the Gmail account from step 1 and create a Google Sheet named `andresblitz alerts`.
2. Go to Extensions → Apps Script, delete the sample code, paste all of `alerts.gs` and save.
3. Pick `setup` in the function menu and click Run, then approve the permissions. This creates
   the tabs (`subs`, `pdfs`, `state`, `log`) and the 30-minute trigger.
4. Go to Deploy → New deployment → type Web app. Set "Execute as" to Me and "Who has access" to
   Anyone. Deploy and copy the URL that ends in `/exec`.
5. Paste that URL into `var API = ''` in `assets/alerts.js` and push. The cards then appear on
   all 22 pages and on `/alerts/`.

To change the script later, edit it in Apps Script, then go to Deploy → Manage deployments →
edit → New version. That keeps the same URL.

## Test locally

```bash
node google-sheets/test.mjs   # fake Sheet + Gmail, real site data, all 10 topics
```
