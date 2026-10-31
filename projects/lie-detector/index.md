---
title: "Blitz Engine — Open-Source Behavioral Signal Analyzer (lie-detector) | Andrés Blitz"
description: "Blitz Engine is an open-source behavioral signal analyzer: 40 live webcam, audio, language and pulse cues fused with Bayesian log-odds and a personal baseline. Not a lie detector — and honest about it."
url: "https://andresblitz.com/projects/lie-detector/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/lie-detector/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Research · Open source

# Blitz Engine (lie-detector)

An open-source behavioral signal analyzer: live webcam and mic cues fused with Bayesian log-odds and a personal baseline — built to be honest about what it can and can’t tell you.

Public repoPythonOn hold · 114 commitsMock demo

[View on GitHub](https://github.com/blitzandres/lie-detector)

Simulated signals

Illustration with simulated cue activity — no camera, microphone or real session data is used on this page.

## What it is

Blitz Engine analyzes live webcam and microphone input (plus text and WAV audio) for behavioral signals that research associates with stress and deception. The flagship app is the Live Consensus Overlay.

It is deliberately not a “lie detector”. Human judges score around 54% at spotting lies; the engine reports calibrated uncertainty and which cues moved, never a binary verdict.

## What I built

-   40 real-time cues across four voting families: visual (MediaPipe blendshapes, gaze, landmark geometry), audio, linguistic (live transcript) and physio (skin-aware webcam pulse).
-   Personal baseline calibration (90–180 s) instead of population thresholds — hard-gated so nothing is reported until every cue has enough samples.
-   Two-gate consensus: a flag needs at least two independent families to agree and a posterior of 0.65 or more. States go CALIBRATING → CLEAR → WATCH → FLAG.
-   An optional local-LLM content engine (Ollama) that judges each answer and cross-checks it against the cue timeline for that window.
-   A text + WAV engine with a CLI, and a research tier that runs recorded clips through facial action units and optical flow.
-   Live visualizations: a deforming enneagram, a radial cue polygon, a synchrony bell and a trust meter.

**About the demo.** The visual above runs on invented sample data generated in your browser — nothing on this page comes from a real account, device, network or portfolio.

## Project facts

Stack

PythonFastAPIWebSocketsNumPyJavaScriptMediaPipeWeb Audio APIOllamaPy-Feat (research tier)

Source

[github.com/blitzandres/lie-detector](https://github.com/blitzandres/lie-detector)

Started

March 2026

Last updated

July 2026

Status

On hold · 114 commits
