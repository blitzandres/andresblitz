---
title: "Bitcoin Days in Each Price Bracket: BTC/USD Close History"
description: "Chart of how many days Bitcoin closed in each US dollar price bracket ($3k, $5k, $10k or $15k wide), from CoinGecko daily closes, with a live price for today. Times in PT."
url: "https://andresblitz.com/bitcoin/"
last_updated: "2026-11-07"
lang: "en"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/bitcoin/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Markets · Bitcoin

# Bitcoin: days in each price bracket

How many days has Bitcoin spent at each price? This chart splits the BTC/USD price into equal brackets and counts the days Bitcoin closed inside each one. Pick a bracket size of $3,000, $5,000, $10,000 or $15,000. Today counts at the live price, so its bar can move while the day is still open.

History starts **November 7, 2025** and runs through **November 6, 2026** (365 completed days). With $10,000 brackets, Bitcoin closed most often between **$60k and $70k** (118 days). History baked Nov 7, 2026, 7:42 a.m. PT.

## Days in each price bracket

Bitcoin now (BTC/USD)—Live price loads in your browser.

Bracket size: **$10,000** 

Days by daily close, $10,000 brackets (November 7, 2025 – November 6, 2026)
| Price bracket (USD) | Days | Share |
| --- | --- | --- |
| $100k–$110k | 6 | 1.6% |
| $90k–$100k | 39 | 10.7% |
| $80k–$90k | 94 | 25.8% |
| $70k–$80k | 103 | 28.2% |
| $60k–$70k | 118 | 32.3% |
| $50k–$60k | 5 | 1.4% |

Daily closes and live price: [CoinGecko](https://www.coingecko.com/en/coins/bitcoin) (free public API). History from November 7, 2025; not backfilled from other sources. Days are UTC calendar days; times shown in PT.

## How to read it

Each bar is a price range in US dollars, for example $70,000 to $80,000. A longer bar means Bitcoin finished more days inside that range. Lower prices sit at the bottom. Narrow brackets ($3,000) show detail; wide brackets ($15,000) show the big picture. The deeper-orange bar marked “← now” is today, counted at the live price until the UTC day closes.

## Where the numbers come from

-   Completed days use CoinGecko’s daily Bitcoin price in USD, stamped 00:00 UTC (the close of the previous UTC day). A scheduled GitHub Action stores each new close in [/bitcoin/history.json](https://andresblitz.com/bitcoin/history.json) and pre-renders the table above, so the chart works even if CoinGecko is slow.
-   The live price is the same CoinGecko BTC/USD series used by the [Currency RSS](https://andresblitz.com/projects/currency-rss/) feed, checked about once a minute. If CoinGecko rate-limits, Coinbase’s public BTC-USD spot price is used instead and named as the source.
-   If a request fails, the last good data stays on screen with its time. Nothing is estimated.

**Reference only.** Historical prices from public sources, which may be delayed. This is not financial advice: no buy or sell buttons, signals, predictions or affiliate links.

## FAQ

### What does this chart show?

Each bar is a US dollar price bracket, for example $70,000 to $80,000. Its length is the number of days Bitcoin closed inside that bracket. Use the slider to switch between $3,000, $5,000, $10,000 and $15,000 brackets.

### How is a day counted?

Days are UTC calendar days. A completed day counts once, in the bracket that contains its close. The close is CoinGecko’s daily Bitcoin price stamped 00:00 UTC of the next day, which is 4 PM PT in winter and 5 PM PT in summer.

### Why does the current bar move?

Today is not finished yet, so it is counted with the live Bitcoin price instead of a close. The page checks the price about once a minute, and if it crosses into another bracket, today’s day moves to that bar. It is shown in a deeper orange with a “← now” label until the day closes.

### Where does the data come from?

Daily closes and the live price both come from CoinGecko’s free public API, the same Bitcoin series used by the site’s rates feed. If CoinGecko is rate-limiting, the live price falls back to Coinbase’s public BTC-USD spot price, and the page names whichever source is shown. Only one live price is ever shown.

### Why does the history start when it does?

CoinGecko’s free public API only serves the last 365 days of daily prices. The history starts at the first day this site stored and grows by one day each day. Older years are not filled in from other sources, so the start date is shown on the page.

### Is this trading advice?

No. It is a historical reference chart only. There are no buy or sell buttons, signals, predictions or affiliate links.

## Facts

Data

[CoinGecko](https://www.coingecko.com/en/coins/bitcoin) (BTC/USD)

Live fallback

Coinbase public spot

Brackets

$3k · $5k · $10k · $15k

History

[history.json](https://andresblitz.com/bitcoin/history.json)

Source

[bake-btc-history.mjs](https://github.com/blitzandres/andresblitz/blob/main/scripts/bake-btc-history.mjs)
