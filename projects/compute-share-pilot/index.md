---
title: "Compute Share Pilot — Trusted Compute for AI | Andrés Blitz"
description: "Compute Share Pilot is a proof of concept by Andrés Blitz for trusted friends to share spare computer power over the internet: a coordinator, polling workers behind NAT and whole-request routing to local LLMs."
url: "https://andresblitz.com/projects/compute-share-pilot/"
last_updated: "2026-10-31"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/compute-share-pilot/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Experiment · AI infra

# Compute Share Pilot

A tiny proof of concept for trusted friends to share spare computer power over the internet — one coordinator, workers behind home NAT, whole AI requests routed to one machine.

Public repoPythonPilot

[View on GitHub](https://github.com/blitzandres/compute-share-pilot)

Simulation

Simulation of the job flow with placeholder worker names.

## What it is

Could a friend in another country run AI work for me on their idle machine? This pilot tests the practical version of that idea before anyone builds a business around it.

## What I built

-   A coordinator with an in-memory worker registry and job queue.
-   Polling workers that sit behind home NAT (no port forwarding) and run either a mock response or a local Ollama model.
-   A small client for submitting prompts, preferring a given model tag.
-   A viability write-up on why routing whole requests beats sharding one model across continents, plus the security work needed before going beyond friends.

## Project facts

Stack

Python (standard library)Ollama

Source

[github.com/blitzandres/compute-share-pilot](https://github.com/blitzandres/compute-share-pilot)

Started

April 2026

Last updated

April 2026

Status

Pilot
