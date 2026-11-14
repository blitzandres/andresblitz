---
title: "Blitzy's World — Playable Space Game in the Browser | Andrés Blitz"
description: "Play Blitzy's World: fly a glowing orb through an endless procedural universe, slingshot around planets and collect stardust. Built with HTML5 Canvas; works with keyboard, mouse and touch."
url: "https://andresblitz.com/projects/blitzys-world/"
last_updated: "2026-11-14"
lang: "en-CA"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/projects/blitzys-world/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

Game · Playable

# Blitzy's World

A glowing orb cruising through an endless universe. Fly it, slingshot around planets and collect stardust — right here in the browser.

Local prototypeJavaScriptPlayable · v1.0

[Play Odyssey (3D)](https://andresblitz.com/projects/blitzys-world/play/3d/) [Classic 2D](https://andresblitz.com/projects/blitzys-world/play/) Ships with andresblitz.com

Click or tap the board to play. W A S D or arrow keys to fly, Shift or Space to boost, T to erase the trace, H to go home. On a phone, drag anywhere to steer.

## What it is

Blitzy's World started with one image: before Blitzy has a body, Blitzy is a circle of light — an energy orb — drifting through deep space. The first prototype (v0.1) was a Three.js scene with a purple planet, nebula mist, fourteen thousand stars and a trace of light that follows the orb.

Version 0.2 keeps that idea and turns it into something you can actually cruise around in: an endless 2D universe, drawn on a plain canvas, that runs on phones as well as desktops.

## What I built

-   An endless, procedurally generated universe — planets, rings, nebulae and stardust are generated deterministically as you travel, so the same places are still there when you fly back.
-   Gentle gravity: planets pull on Blitzy, so you can slingshot past them, skim the surface or settle into an orbit.
-   The purple-to-cyan light trace from the original prototype, fading over a few seconds (press T to erase it).
-   Controls for every device: W A S D or arrows, hold-to-steer with the mouse, a virtual joystick on touch screens, and a boost.
-   Framerate-independent physics, a three-layer parallax starfield, auto-pause when you switch tabs, and a calmer mode for reduced-motion settings.
-   The 3D build now has four levels: collect stars, evade aliens, dodge asteroids, and a professional HUD (v0.3).

## Odyssey (v1.0, 3D)

The 3D build was rebuilt from scratch as an eight-sector campaign. Each sector is built around one real space phenomenon, and every pixel and every sound is generated in the browser: there are no image or audio files.

-   Eight sectors: gravity assists around the home planet, the rings of a gas giant, a dense asteroid belt, comets you can surf, a binary star that overheats you, a pulsar sweeping beams of radiation, three star systems linked by wormholes, and a black hole with gravitational lensing and time dilation.
-   Real gravity from every body, so slingshots and orbits work. Near misses, slingshots and combos pay score; a three-star rating per sector rewards a clean, fast run.
-   An energy system: boost drains it, stardust and comet tails refill it, and a Pulse shockwave shatters rocks and stuns hunters so you can ram them.
-   Procedural shaders for planets, suns, rings, nebulae, the accretion disk and the warp gate, with a hand-written HDR pipeline: bloom, lensing, hyperspace streaks, chromatic aberration, tone mapping and film grain.
-   A generative soundtrack and sound effects synthesised live with the Web Audio API, in a different key for each sector.
-   Keyboard and mouse, touch (twin thumbs, boost and pulse buttons) and gamepad with rumble. Resolution adapts on the fly to hold the frame rate.

## What was broken in v0.1

-   The camera spawned _inside_ the planet, so the first thing you saw was a murky purple blur instead of the world.
-   Movement only worked while the mouse pointer was locked. Touch devices can't lock the pointer, and Chrome refuses to re-lock right after Esc, so the game often got stuck on its start screen.
-   Erasing the trace called an object that didn't exist and threw an error.
-   It loaded Three.js from a CDN at runtime and had framerate-dependent drag.
-   v0.2 is a dependency-free rebuild of the same idea; the original is fixed too (camera, controls with or without pointer lock, touch, the trace bug, and a bundled copy of Three.js).

## Project facts

Stack

HTML5 CanvasJavaScript (no dependencies)Pointer EventsThree.js / WebGL 2GLSL shadersWeb Audio APIGamepad API

Source

Bundled on [github.com/blitzandres/andresblitz](https://github.com/blitzandres/andresblitz) (site repo)

Started

June 2026

Last updated

November 2026

Status

Playable · v1.0 · 8 sectors
