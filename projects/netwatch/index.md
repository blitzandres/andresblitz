---
title: "NetWatch — Local Network Monitoring Dashboard (Python + Flask) | Andrés Blitz"
description: "NetWatch is a local network monitoring dashboard by Andrés Blitz: live bandwidth, connections, devices, intrusion detection and 30-day history, served by a small Python Flask app. Demo uses simulated data."
url: "https://andresblitz.com/projects/netwatch/"
last_updated: "2026-10-16"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/netwatch/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Signals · Network

# NetWatch

A local network monitoring dashboard: live bandwidth, connections, devices and threats on your own network, served by a small Flask app.

Public repoPythonPrototypeMock demo

[View on GitHub](https://github.com/blitzandres/netwatch)

Demo data

Demo data: hosts use reserved example domains and every number is simulated. NetWatch itself only runs locally.

## What it is

NetWatch runs on your own machine and answers a simple question: what is my network doing right now? It is the working prototype behind the SIGNET thesis.

## What I built

-   A Flask backend with background workers for traffic capture, intrusion detection and automatic blocking.
-   SQLite persistence with 30 days of history, CSV export and an optional Google Sheets export.
-   A tool belt in one page: terminal, port scan, processes, Wi-Fi devices and channels, world map, speed test, IP info, DNS benchmark, HTTP headers and a subnet calculator.
-   Repository intelligence with a commit heatmap, and a feature-preservation plan for the “NetWatch Next” migration.

**About the demo.** The visual above runs on invented sample data generated in your browser — nothing on this page comes from a real account, device, network or portfolio.

## Project facts

Stack

PythonFlaskpsutilSQLiteJavaScriptChart libraries

Source

[github.com/blitzandres/netwatch](https://github.com/blitzandres/netwatch)

Started

April 2026

Last updated

April 2026

Status

Prototype
