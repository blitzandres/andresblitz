---
title: "RealWealth Portfolio — Live Real Estate Portfolio Dashboard (Next.js + Supabase) | Andrés Blitz"
description: "RealWealth Portfolio is the real estate portfolio manager Andrés Blitz uses for his own holdings: properties, mortgages, market data, MLS® listings and a Bitcoin sleeve in one Next.js dashboard. The live app is embedded on this page."
url: "https://andresblitz.com/projects/realwealth-portfolio/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/realwealth-portfolio/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Real estate · Live app

# RealWealth Portfolio

My real estate portfolio manager: properties, mortgages, rent and expenses in one dashboard, with market data, MLS® listings and a Bitcoin sleeve alongside the bricks. What you see below is the live app, running on my real portfolio.

Private repoTypeScriptActiveLive app

[Open full app](https://realwealth-portfolio.vercel.app/) [GitHub (private)](https://github.com/blitzandres/realwealth-portfolio) Access limited

Live apprealwealth-portfolio.vercel.app[Open full app](https://realwealth-portfolio.vercel.app/)

This is the live app, not a mock-up. It shows my real portfolio as it stands today. Scroll inside the frame to explore, or open the full app in a new tab.

## What it is

RealWealth shows my real estate portfolio as total value, equity, cash flow and allocation, instead of a pile of spreadsheets. It is a full-stack Next.js app backed by Supabase (Postgres) and deployed on Vercel.

It treats Bitcoin as its own asset class next to homes, condos and land, and pulls in market context so each decision sits next to rates and listings.

The frame above is the production app itself, embedded live, so the numbers are the real ones.

## What I built

-   Dashboard with total value, equity, monthly rent, net cash flow and allocation by type (home, condo, town home, land, commercial and Bitcoin).
-   Property management: add, edit and view holdings, with mortgage tracking, expense logging and gain/loss per property.
-   Analytics: cap rates, cash-flow analysis, a deal scatter chart and a sortable portfolio table.
-   Market context: mortgage rates, macro indicators and a live BTC price in CAD.
-   Listings: an MLS® listing map (Leaflet) fed by a scheduled CREA DDF® sync, address autocomplete and nearby homes.
-   A 3D portfolio globe (cobe), light/dark themes and a built-in error log.

**About the embed.** The source code is private, so there is no repo link, but the app itself is public: the frame above loads the production app with my real portfolio data.

## Project facts

Stack

Next.js 16 (App Router)React 19TypeScriptTailwind CSS 4Supabase / PostgresLeafletcobePython (data sync)GitHub ActionsVercel

Source

[github.com/blitzandres/realwealth-portfolio](https://github.com/blitzandres/realwealth-portfolio) (private)

Started

March 2026

Last updated

September 2026

Status

Active
