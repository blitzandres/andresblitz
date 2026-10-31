---
title: "Blitz Analytics — Privacy-Minded Web Analytics | Andrés Blitz"
description: "Blitz Analytics is the small private analytics and chat backend behind andresblitz.com: a Cloudflare Worker with a D1 database, first-party visitor ids and no raw IP storage. Demo uses sample data."
url: "https://andresblitz.com/projects/blitz-analytics/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/blitz-analytics/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Infrastructure · Analytics

# Blitz Analytics

The small, private analytics and chat backend behind this site — a Cloudflare Worker with a D1 database, built so the public site stays calm and light.

Private repoJavaScriptIn production · privateMock demo

[GitHub (private)](https://github.com/blitzandres/blitz-analytics) Access limited

Demo data

Demo data: these are not this site’s real visitor numbers.

## What it is

A way to see which pages get read without a heavy third-party tracker. Blitz Analytics is a single Worker: the site loads one tiny script, and everything else happens at the edge.

## What I built

-   A tiny tracker script with engagement time that pauses when the tab is hidden, and scroll depth.
-   A first-party, opaque visitor id instead of an IP address; the fallback is a daily-salted hash, and raw IPs are never stored.
-   Page journeys, sessions with a heartbeat and coarse location from Cloudflare’s edge metadata.
-   A private dashboard with charts and a globe, plus the chat widget and inbox you can use on this site.

**About the demo.** The source is private, so this page describes the project at a high level. The visual above runs on invented sample data generated in your browser — nothing on this page comes from a real account, device, network or portfolio.

## Project facts

Stack

Cloudflare WorkersCloudflare D1 (SQLite)JavaScriptChart.jscobe

Source

[github.com/blitzandres/blitz-analytics](https://github.com/blitzandres/blitz-analytics) (private)

Started

July 2026

Last updated

September 2026

Status

In production · private
