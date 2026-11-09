---
title: "Bitcoin Days in Each Price Bracket: BTC/USD Close History"
description: "Chart of how many days Bitcoin closed in each US dollar price bracket ($3k, $5k, $10k or $15k wide), from Yahoo Finance BTC-USD daily closes starting September 17, 2014, with a live price for today. Times in PT."
url: "https://andresblitz.com/bitcoin/"
last_updated: "2026-11-09"
lang: "en"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/bitcoin/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Markets · Bitcoin

# Bitcoin: days in each price bracket

How many days has Bitcoin spent at each price? This chart splits the BTC/USD price into equal brackets and counts the days Bitcoin closed inside each one. Pick a bracket size of $3,000, $5,000, $10,000 or $15,000. Today counts at the live price, so its bar can move while the day is still open.

History starts **September 17, 2014** and runs through **November 9, 2026** (4,436 daily closes). With $10,000 brackets, Bitcoin closed most often between **$0 and $10k** (1,972 days). Series high $124,753. History baked Nov 8, 2026, 5:53 p.m. PT.

## Days Bitcoin spent in each $10,000 bracket

Yahoo Finance BTC-USD daily closes

Bitcoin now (BTC/USD)—Live price loads in your browser.

Bracket size: **$10,000** 

Days by daily close, $10,000 brackets (September 17, 2014 – November 9, 2026)
| Price bracket (USD) | Days | Share |
| --- | --- | --- |
| $120k–$130k | 10 | 0.2% |
| $110k–$120k | 95 | 2.1% |
| $100k–$110k | 112 | 2.5% |
| $90k–$100k | 131 | 3.0% |
| $80k–$90k | 148 | 3.3% |
| $70k–$80k | 131 | 3.0% |
| $60k–$70k | 350 | 7.9% |
| $50k–$60k | 166 | 3.7% |
| $40k–$50k | 258 | 5.8% |
| $30k–$40k | 250 | 5.6% |
| $20k–$30k | 382 | 8.6% |
| $10k–$20k | 431 | 9.7% |
| $0–$10k | 1,972 | 44.5% |

Daily closes: [Yahoo Finance BTC-USD](https://finance.yahoo.com/quote/BTC-USD/), from September 17, 2014. Live price: [CoinGecko](https://www.coingecko.com/en/coins/bitcoin) (Coinbase public spot as fallback). Times shown in PT.

## How to read it

Each bar is a price range in US dollars, for example $70,000 to $80,000. A longer bar means Bitcoin finished more days inside that range. Lower prices sit at the bottom. Narrow brackets ($3,000) show detail; wide brackets ($15,000) show the big picture. The deeper-orange bar marked “← now” is today, counted at the live price until the UTC day closes.

## Where the numbers come from

-   Completed days use Yahoo Finance’s BTC-USD daily close, from September 17, 2014 onward. A scheduled GitHub Action stores each new close in [/bitcoin/history.json](https://andresblitz.com/bitcoin/history.json) and pre-renders the table above.
-   The live price for today is CoinGecko’s BTC/USD print, checked about once a minute. If CoinGecko rate-limits, Coinbase’s public BTC-USD spot price is used instead and named as the source.
-   If a request fails, the last good data stays on screen with its time. Nothing is estimated.

**Reference only.** Historical prices from public sources, which may be delayed. This is not financial advice: no buy or sell buttons, signals, predictions or affiliate links.

## FAQ

### What does this chart show?

Each bar is a US dollar price bracket, for example $70,000 to $80,000. Its length is the number of days Bitcoin closed inside that bracket. Use the slider to switch between $3,000, $5,000, $10,000 and $15,000 brackets.

### How is a day counted?

A completed day counts once, in the bracket that contains that day’s Yahoo Finance BTC-USD close. Days follow the Yahoo daily series. Times on the page are shown in PT.

### Why does the current bar move?

Today is not finished yet, so it is counted with the live Bitcoin price instead of a close. The page checks the price about once a minute, and if it crosses into another bracket, today’s day moves to that bar. It is shown in a deeper orange with a “← now” label until the day closes.

### Where does the data come from?

Daily closes come from Yahoo Finance’s public BTC-USD series, starting September 17, 2014 (the first day of that series). The live price for the unfinished day comes from CoinGecko’s free public API; if CoinGecko is rate-limiting, it falls back to Coinbase’s public BTC-USD spot price, and the page names whichever live source is shown.

### Why does the history start when it does?

Yahoo Finance’s public BTC-USD daily series begins on September 17, 2014. That is why the chart starts there and can show time spent from $0 up. Earlier years are not included; Bitcoin traded below $10,000 throughout that earlier period.

### Is this trading advice?

No. It is a historical reference chart only. There are no buy or sell buttons, signals, predictions or affiliate links.

## Facts

Daily closes

[Yahoo Finance](https://finance.yahoo.com/quote/BTC-USD/) (BTC-USD)

Live print

[CoinGecko](https://www.coingecko.com/en/coins/bitcoin)

Live fallback

Coinbase public spot

Brackets

$3k · $5k · $10k · $15k

History

[history.json](https://andresblitz.com/bitcoin/history.json)

Source

[bake-btc-history.mjs](https://github.com/blitzandres/andresblitz/blob/main/scripts/bake-btc-history.mjs)
