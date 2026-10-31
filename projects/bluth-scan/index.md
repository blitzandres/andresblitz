---
title: "BluthScan — Real-Time Bluetooth Scanner with 3D Graph Visualization | Andrés Blitz"
description: "BluthScan is a real-time Bluetooth Low Energy scanner by Andrés Blitz that renders nearby devices as a living 3D neural graph with bleak, Flask-SocketIO and 3d-force-graph. Demo uses simulated devices."
url: "https://andresblitz.com/projects/bluth-scan/"
last_updated: "2026-10-29"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/bluth-scan/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Signals · Bluetooth

# BluthScan

A real-time Bluetooth scanner that turns nearby devices into a living 3D neural graph.

Public repoPythonPrototypeMock demo

[View on GitHub](https://github.com/blitzandres/bluth-scan)

Simulated devices

A 2D sketch of the 3D view with made-up device names and signal strengths.

## What it is

BluthScan scans for Bluetooth Low Energy devices and pushes each discovery to the browser the moment it appears, where it becomes a glowing node connected to a central hub.

## What I built

-   Cross-platform BLE scanning with bleak.
-   Instant push of new devices over WebSockets (Flask-SocketIO).
-   A 3D force graph (Three.js / WebGL): node colour follows signal strength, particles flow along the links.
-   A Python 3.14 compatibility fix; next up are node actions, RSSI history and graph export.

**About the demo.** The visual above runs on invented sample data generated in your browser — nothing on this page comes from a real account, device, network or portfolio.

## Project facts

Stack

PythonbleakFlaskFlask-SocketIOWebSockets3d-force-graphThree.js

Source

[github.com/blitzandres/bluth-scan](https://github.com/blitzandres/bluth-scan)

Started

March 2026

Last updated

March 2026

Status

Prototype
