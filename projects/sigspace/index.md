---
title: "SIGSPACE — Network Signals as a Video Game World | Andrés Blitz"
description: "SIGSPACE is a browser game where you are a pixel character inside your own network: IP, DNS, Bluetooth and threat signals orbit you, and a frequency dial switches realms. Canvas + Cloudflare Workers."
url: "https://andresblitz.com/projects/sigspace/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/sigspace/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Signals · Game

# SIGSPACE

A video game where you exist as a pixel character inside your own network. Signals float around you in cyberspace; tune the frequency dial to switch dimensions.

Public repoHTMLLive · 17 commitsMock demo

[Open the live game](https://blitzandres.github.io/sigspace/) [View on GitHub](https://github.com/blitzandres/sigspace)

Simulated data

Illustration with simulated nodes and placeholder names — not a capture of any real network.

## What it is

SIGSPACE is the playful companion to my SIGNET research: instead of dashboards, each kind of signal becomes a realm you can fly through.

Local realms read from companion apps (NetWatch and BluthScan) when they are running on your own machine; otherwise every realm falls back to simulated data, so the game is safe to leave open.

## What I built

-   A canvas game engine with a pixel character, an isometric terminal, orbital nodes with particle trails and a glitchy frequency-dial transition.
-   Five realms: CARRIER (IP geolocation), TOPOLOGY (live connections), STREAM (DNS lookups as meteors via DNS-over-HTTPS), BLUETOOTH (BLE devices as nodes) and THREAT (reputation checks with a heuristic fallback).
-   A Cloudflare Worker proxy, so third-party API keys stay in Worker secrets and never ship to the browser.
-   An idle-safe preview mode and a lighter, more professional HUD in the latest pass.

**About the demo.** The visual above runs on invented sample data generated in your browser — nothing on this page comes from a real account, device, network or portfolio.

## Project facts

Stack

HTML5 CanvasJavaScriptCloudflare WorkersDNS-over-HTTPSip-api / ipinfoAbuseIPDBGitHub Pages

Source

[github.com/blitzandres/sigspace](https://github.com/blitzandres/sigspace)

Started

May 2026

Last updated

September 2026

Status

Live · 17 commits
