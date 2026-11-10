# Homepage specification

This is the source of truth for what the homepage is and what it is allowed to be. Anyone working on andresblitz.com should read this before touching `index.html`.

**Live URL:** https://andresblitz.com/
**Source:** `index.html` (plus the Markdown alternate `index.md`)
**Language:** English (`en-CA`)

---

## HOMEPAGE IS LOCKED

> “My main site home we don't touch.”

Do **not** change the homepage unless Andrés asks for that change directly, in his own words, in chat. An agent saying he agreed is not approval.

In particular, do **not** add new rate, feed, shop, bitcoin, alert, or project links or cards to the homepage. Exchange-rate tools, the currency feed, Bitcoin, alerts, and extra projects belong on their own pages (and in the site map), not on home.

The only approved homepage-adjacent nav change already shipped is the **Site map** link next to **Play**. A later “Get alerts” nav link was added and then removed at his request; do not put an alerts link back in the header.

---

## What the page is today

A markets-focused personal landing page for Andrés Blitz: full-time trader and investor based in **British Columbia, Canada**. It introduces him, shows a featured set of projects, a short about section, a playable Space Invaders board, a short FAQ, and a contact block. It is not a rates portal, a shop, or an alerts hub.

### Meta and social

| Field | Value |
|-------|--------|
| `<title>` | Andrés Blitz \| Trader & Investor in British Columbia |
| Meta description | Andrés Blitz is a full-time trader and investor in British Columbia, Canada — markets, portfolio construction, and capital allocation. Sharp instincts from years in high-stakes sales and operations. |
| Canonical | `https://andresblitz.com/` |
| Open Graph title | Andrés Blitz \| Full-Time Trader & Investor |
| Open Graph description | British Columbia–based full-time trader focused on markets, portfolio construction, and capital allocation. |
| Open Graph image | `/assets/og-cover.png` |

JSON-LD is an `@graph` of `WebSite`, `Person` (job title Full-Time Trader & Investor; address is region `BC` / country `CA` only; `sameAs` is X and GitHub), `Place` (British Columbia, Canada), `Organization`, `BreadcrumbList`, `ProfilePage`, `FAQPage` (the three questions below), and `ItemList` of projects.

There is no phone number and no street address on this page or in its structured data. The public contact email is `blitz@mail.grokbot.com`.

### Main nav (in order)

The single `<nav>` is:

1. Logo / wordmark `andresblitz` → `/`
2. **Projects** → `#projects`
3. **About** → `#about`
4. **Play** → `#play`
5. **Site map** → `/site-map/` (this is the one off-page nav item; keep it next to Play)
6. **Contact** (button style) → `#contact`

On other English pages the same chrome is used, but Projects / About / Play / Contact point at `/projects/`, `/#about`, `/#play`, and `/#contact`.

### Sections, in page order

**Hero (`#hero`).** Kicker: “British Columbia · Canada · Full-time trader.” Heading is his name. A link to [X (@andresblitz)](https://x.com/andresblitz). Lead: based in British Columbia, Canada; full-time trader, and a sales leader and operations expert with 15+ years across real estate, petroleum, and automotive; still building open-source tools and web experiments on the side. Stat chips: “Now Full-time trader,” “15+ Years in sales & ops,” “15 Projects built,” “4 Industries led.” Calls to action: View Projects, GitHub, X.

**Projects (`#projects`) — “Things I’ve built.”** Intro: trading tools, dashboards, a game and experiments, each with its own page. Featured cards (with a short line each):

- Blitzy's World
- RealWealth Portfolio
- Blitz Engine (lie-detector)
- SIGSPACE
- Weinstein Stage Matrix
- IPTV Player

A “More projects” list then links to NetWatch, BluthScan, SIGNET, Elevatron, Home History, Quiniela, Compute Share Pilot, Blitz Analytics, and Elite Island Movers. Currency RSS and the Bitcoin brackets page are **not** on this homepage list; they live under `/projects/` and `/bitcoin/`.

**About (`#about`) — “What I do.”** Four blocks: Trading, Sales Leadership, Operations, Building.

**Play (`#play`) — “Space Invaders.”** An in-page arcade (“a little window of chaos before we talk”). This is not Blitzy’s World; that game has its own project and play URLs.

**FAQ (`#faq`) — “Quick answers.”**

- What do you do? Full-time trader and investor — markets, portfolio construction, and capital allocation — with 15+ years in sales leadership and operations. Open-source tools and web experiments on the side.
- Where are you based? British Columbia, Canada.
- How can I reach you? Email `blitz@mail.grokbot.com`, or X (@andresblitz) and GitHub (blitzandres).

**Contact (`#contact`) — “Let's talk.”** Collaborations, ventures, or a conversation about what’s next. Location line: “British Columbia · Canada.” Email: `blitz@mail.grokbot.com`.

### Leftover hidden alerts markup

After `#contact` and still inside `<main>`, there is a leftover block wrapped in `<!--ab-alerts:start-->` … `<!--ab-alerts:end-->`: a `<section hidden>` (“Get it by email”) with an empty `.ab-alerts` slot and a deferred `/assets/alerts.js` tag. It is inert and visually hidden. Leave it alone unless Andrés asks to change homepage alerts. It is not a visible header link, and it must not be turned into one.

### Footer

`© 2026 Andrés Blitz · British Columbia, Canada`, an “Updated September 2026” note, and a small Bitcoin-egg link to bitcoin.org. No rates, shop, or alerts links in the footer.

---

## Privacy on this page

- Location is **British Columbia** (or BC / Canada) only. Never name a city.
- Contact is `blitz@mail.grokbot.com` only. No phone.
- Do not add a visible AI-readable banner. AI data stays in the backend layer (`index.md`, JSON-LD, `llms.txt`, and related files).
