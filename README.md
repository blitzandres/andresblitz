# andresblitz.com

Personal website of **Andrés Blitz** — full-time trader and investor based in Victoria, British Columbia, Canada.

**Live:** [https://andresblitz.com/](https://andresblitz.com/) · **X:** [@andresblitz](https://x.com/andresblitz) · **GitHub:** [blitzandres](https://github.com/blitzandres)

## What’s here

- Markets-focused personal landing page (bio, trading focus, sales & ops background)
- Project pages under `/projects/<slug>/` for tools, games and experiments
- Playable demos (e.g. Blitzy’s World) hosted on GitHub Pages
- SEO pack: titles, meta descriptions, canonical/hreflang, Open Graph, Twitter cards, JSON-LD, `robots.txt`, sitemap

## Tech stack

| Layer | Choice |
|-------|--------|
| Site | Static HTML / CSS / JS |
| Hosting | GitHub Pages (custom domain `andresblitz.com`) |
| Analytics | Private Cloudflare Worker ([blitz-analytics](https://github.com/blitzandres/blitz-analytics)) |

## Local preview

```bash
# from repo root — any static server; do not leave it running
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`. Prefer short-lived previews; production is always GitHub Pages.

## Projects

See [andresblitz.com/projects](https://andresblitz.com/projects/) for the full list and write-ups.

## License

Content © Andrés Blitz. Individual project repos may carry their own licenses.
