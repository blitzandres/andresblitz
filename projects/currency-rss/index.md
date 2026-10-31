---
title: "Currency RSS — Exchange-rate and central-bank feed (RSS 2.0) | Andrés Blitz"
description: "Currency RSS by Andrés Blitz: a free RSS 2.0 feed of Latin American dollar rates, Bitcoin, USD/CAD and central-bank policy rates, rebuilt every 30 minutes by GitHub Actions with a source and timestamp on every item."
url: "https://andresblitz.com/projects/currency-rss/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/currency-rss/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Markets · Data feeds

# Currency RSS

One free RSS 2.0 feed for Latin American dollar rates, Bitcoin, USD/CAD and central-bank policy rates, with a source and timestamp on every item.

Public repoJavaScriptLive

[Subscribe (RSS)](https://andresblitz.com/rates/feed.xml) [Source](https://github.com/blitzandres/andresblitz/blob/main/scripts/bake-feed.mjs)

Feed: [/rates/feed.xml](https://andresblitz.com/rates/feed.xml)

## What it is

A scheduled GitHub Action rebuilds [/rates/feed.xml](https://andresblitz.com/rates/feed.xml) about every 30 minutes. It adds an item each time a series changes value or publication time, and it keeps the latest 50 items. The same run updates [/rates/index.json](https://andresblitz.com/rates/index.json), which powers the “Feed de tasas” widget on this site. The feed is in Spanish, like the rate pages it summarizes.

## What’s in the feed

-   Dollar rates: [Venezuela (BCV)](https://andresblitz.com/tasa-bcv/), [Argentina (official and blue)](https://andresblitz.com/dolar-argentina/), [Colombia (TRM)](https://andresblitz.com/dolar-colombia/), [Mexico (Banxico FIX)](https://andresblitz.com/dolar-mexico/), [Peru](https://andresblitz.com/dolar-peru/) and [Chile (dólar observado)](https://andresblitz.com/dolar-chile/).
-   Bitcoin in USD (CoinGecko), with the 24-hour change.
-   USD/CAD and the Bank of Canada policy rate (Bank of Canada Valet API).
-   Bank of England Bank Rate (Bank of England Database, IUDBEDR).
-   US federal funds target range (Federal Reserve Bank of New York Markets API).
-   China’s 1-year and 5-year Loan Prime Rate (China Foreign Exchange Trade System).

## How it works

-   Static output on GitHub Pages: no server, no database, no API keys, all on free tiers.
-   Each country rate is first baked into its own page so search engines see real values. The feed then reads those files.
-   Fallback sources are named honestly. If a series can’t be fetched, it’s skipped and the last good value keeps its original timestamp. Values are never estimated.
-   Bitcoin is fetched by the build, never by visitors’ browsers, and cached for at least 60 seconds to respect CoinGecko’s rate limits.

**Reference only.** Rates come from the public sources named in each item and may be delayed. This is not financial advice.

## Project facts

Stack

Node.jsGitHub ActionsRSS 2.0GitHub Pages

Feed

[andresblitz.com/rates/feed.xml](https://andresblitz.com/rates/feed.xml)

Source

[scripts/bake-feed.mjs](https://github.com/blitzandres/andresblitz/blob/main/scripts/bake-feed.mjs)

Started

October 2026

Status

Live
