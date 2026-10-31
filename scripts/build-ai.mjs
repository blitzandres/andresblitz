#!/usr/bin/env node
// Generates the AI-readable layer for andresblitz.com from the public HTML.
// Usage: npm install && node scripts/build-ai.mjs   (idempotent; re-run after editing any page)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ORIGIN = 'https://andresblitz.com';
const LLMS = `${ORIGIN}/llms.txt`;
const API = 'https://andresblitz-ai-api.blitzandres.workers.dev';
const EXCLUDE = [/^dashboard\//, /^404\.html$/, /^node_modules\//, /^scripts\//, /^\.git\//, /^ai\//, /vendor\//];
const START = '<!-- ai-layer:start -->', END = '<!-- ai-layer:end -->';
const FSTART = '<!-- ai-layer-footer:start -->', FEND = '<!-- ai-layer-footer:end -->';
const FORBIDDEN = [/andres@andresblitz\.com/i, /\broly\b/i, /blimar properties/i, /tel:/i, /\+?1[ .-]?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/, /\bvictoria\b/i, /48\.4284/, /123\.3656/, /\+58[ .-]?\d/];

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE.some((r) => r.test(rel(full) + '/'))) walk(full, out); }
    else if (e.name === 'index.html' && !EXCLUDE.some((r) => r.test(rel(full)))) out.push(full);
  }
  return out;
}
const lastUpdated = (file) => {
  try { const d = execSync(`git log -1 --format=%cI --invert-grep -i --grep=ai-readable --grep=ai-layer -- "${rel(file)}"`, { cwd: ROOT }).toString().trim(); if (d) return d.slice(0, 10); } catch {}
  return new Date().toISOString().slice(0, 10);
};
const stripLayer = (html) => html
  .replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}`, 'g'), '')
  .replace(new RegExp(`${FSTART}[\\s\\S]*?${FEND}\\n?`, 'g'), '');
const yq = (s) => JSON.stringify(String(s ?? ''));
const safeJson = (o, sp) => JSON.stringify(o, null, sp).replace(/</g, '\\u003c');

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.use(gfm);
td.remove(['script', 'style', 'noscript', 'svg', 'template', 'iframe', 'canvas', 'form', 'button', 'input', 'select', 'textarea', 'video', 'audio', 'img', 'picture', 'dialog']);

function slugFor(url) { const p = new URL(url).pathname.replace(/^\/|\/$/g, ''); return p ? p.replace(/\//g, '-') : 'home'; }
function kindFor(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/projects/') return 'projects-index';
  if (/^\/projects\/[^/]+\/$/.test(pathname)) return 'project';
  if (pathname.startsWith('/projects/')) return 'project-subpage';
  return 'page';
}

const pages = [];
for (const file of walk(ROOT).sort()) {
  const original = fs.readFileSync(file, 'utf8');
  const html = stripLayer(original);
  const { document } = parseHTML(html);
  const relDir = rel(path.dirname(file));
  const fallbackUrl = `${ORIGIN}/${relDir === '' ? '' : relDir + '/'}`;
  const url = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || fallbackUrl;
  const pathname = new URL(url).pathname;
  const title = (document.querySelector('title')?.textContent || '').trim();
  const description = (document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();
  const lang = document.documentElement.getAttribute('lang') || 'en';
  const root = document.querySelector('main') || document.body;
  // absolute links
  for (const a of root.querySelectorAll('a[href]')) {
    const h = a.getAttribute('href');
    if (/^(mailto:|javascript:)/i.test(h)) continue;
    try { a.setAttribute('href', new URL(h, url).href); } catch {}
  }
  for (const el of root.querySelectorAll('img, picture, figure > img, script, style, svg, noscript, iframe, nav, footer, [aria-hidden="true"], .skip-link, .sr-only-focusable')) el.remove();
  let body = td.turndown(root.innerHTML || '').replace(/\n{3,}/g, '\n\n').trim();
  if (body.length < 40) body = description;
  const mdUrl = `${ORIGIN}${pathname}index.md`;
  pages.push({ file, html, original, url, pathname, mdUrl, title, description, lang, kind: kindFor(pathname), slug: slugFor(url), last_updated: lastUpdated(file), body, document });
}

// Extra context for special pages
const EXTRA = {
  '/70/': { topics: ['El 70', 'ganadería', 'Zulia', 'Venezuela'], geo: { place: 'La Villa del Rosario, Rosario de Perijá, Zulia, Venezuela', lat: 10.4165941, lng: -72.2108835 }, note: 'El 70 — finca ganadera (en español). La Villa del Rosario, Rosario de Perijá, Zulia. Geo: 10.4165941,-72.2108835.' },
  '/tasa-bcv/': { topics: ['Tasa BCV', 'tipo de cambio', 'Venezuela', 'Maracaibo'], geo: { place: 'Maracaibo, Zulia, Venezuela' }, note: 'Tasa BCV — tipo de cambio oficial del Banco Central de Venezuela (en español). Maracaibo, Zulia.' },
  '/dolar-argentina/': { topics: ['Dólar hoy', 'dólar blue', 'dólar MEP', 'tipo de cambio', 'Argentina'], note: 'Dólar hoy en Argentina — oficial, blue, MEP, CCL, cripto y tarjeta, con conversor ARS ↔ USD (en español).' },
};

function markdownFor(p) {
  return `---\ntitle: ${yq(p.title)}\ndescription: ${yq(p.description)}\nurl: ${yq(p.url)}\nlast_updated: ${yq(p.last_updated)}\nlang: ${yq(p.lang)}\n---\n\n> Note for AI agents: this is the clean Markdown version of ${p.url}. The site map for agents is ${LLMS} (full content: ${ORIGIN}/llms-full.txt).\n\n${/^# /m.test(p.body) ? '' : `# ${p.title}\n\n`}${p.body}\n`;
}
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

for (const p of pages) { p.markdown = markdownFor(p); write(p.pathname.slice(1) + 'index.md', p.markdown); }

const projects = pages.filter((p) => p.kind === 'project').map((p) => ({ name: p.title.split('|')[0].trim(), url: p.url, md: p.mdUrl, summary: p.description }));
const site = {
  name: 'Andrés Blitz', url: `${ORIGIN}/`, description: pages.find((p) => p.kind === 'home')?.description || '',
  contact: { email: 'blitz@mail.grokbot.com', x: 'https://x.com/andresblitz', github: 'https://github.com/blitzandres' },
  location: 'British Columbia, Canada',
  ai_layer: { status: 'active', llms: LLMS, llms_full: `${ORIGIN}/llms-full.txt`, full_md: `${ORIGIN}/full.md`, agent_json: `${ORIGIN}/agent.json`, ai_index_js: `${ORIGIN}/ai-index.js`, api_site: `${ORIGIN}/api/site.json`, api_page: `${ORIGIN}/api/page/{slug}.json`, sitemap_ai: `${ORIGIN}/sitemap-ai.json`, sitemap_md: `${ORIGIN}/sitemap-md.xml`, entry: `${ORIGIN}/ai/`, feed: `${ORIGIN}/feed.xml`, feed_el70: `${ORIGIN}/70/feed.xml`, api: { site: `${API}/api/site`, page: `${API}/api/page?path={path}`, accept_markdown: true, cors: '*', read_only: true } },
  topics: ['trading', 'investing', 'capital allocation', 'open-source tools', 'web experiments', 'El 70 (Zulia, Venezuela)', 'Tasa BCV'],
  pages: pages.map((p) => ({ slug: p.slug, title: p.title, url: p.url, md: p.mdUrl, json: `${ORIGIN}/api/page/${p.slug}.json`, kind: p.kind, lang: p.lang, summary: p.description, last_updated: p.last_updated, ...(EXTRA[p.pathname] ? { topics: EXTRA[p.pathname].topics, geo: EXTRA[p.pathname].geo } : {}) })),
  projects,
  generated: new Date().toISOString().slice(0, 10),
};

// JSON / JS indexes
write('agent.json', safeJson(site, 2) + '\n');
write('api/site.json', safeJson(site, 2) + '\n');
write('ai-index.js', `// AI index for andresblitz.com — generated by scripts/build-ai.mjs\nexport const site = ${safeJson(site, 2)};\nexport default site;\n`);
for (const p of pages) write(`api/page/${p.slug}.json`, safeJson({ slug: p.slug, title: p.title, url: p.url, md: p.mdUrl, summary: p.description, last_updated: p.last_updated, markdown: p.markdown }, 2) + '\n');

// Full concatenation
const full = `# Andrés Blitz — full site content\n\n> Every public page of ${ORIGIN}/ as clean Markdown, concatenated. Site map: ${LLMS}\n\n` + pages.map((p) => p.markdown).join('\n\n---\n\n');
write('llms-full.txt', full); write('full.md', full);

// Sitemaps
write('sitemap-ai.json', safeJson({ site: `${ORIGIN}/`, generated: site.generated, pages: pages.map((p) => ({ url: p.url, md: p.mdUrl, title: p.title, summary: p.description, lastmod: p.last_updated })) }, 2) + '\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
write('sitemap-md.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + [...pages.map((p) => [p.mdUrl, p.last_updated]), [`${ORIGIN}/ai/index.md`, site.generated], [`${ORIGIN}/full.md`, site.generated]].map(([u, d]) => `  <url><loc>${esc(u)}</loc><lastmod>${d}</lastmod></url>`).join('\n') + '\n</urlset>\n');

// llms.txt
const line = (p, label) => `- [${label || p.title}](${p.mdUrl}): ${p.description}`;
const byPath = (x) => pages.find((p) => p.pathname === x);
const llms = `# Andrés Blitz

> Full-time trader and investor based in British Columbia, Canada. Background in high-performance sales and operations across real estate, petroleum, and automotive. Builds open-source tools and web experiments on the side.

- Canonical site: ${ORIGIN}/
- Location: British Columbia, Canada
- Email: blitz@mail.grokbot.com
- X: https://x.com/andresblitz
- GitHub: https://github.com/blitzandres

Every link below points to the clean Markdown version of the page (append \`index.md\` to any public directory URL).

## Main pages

${line(byPath('/'), 'Home')}
${line(byPath('/projects/'), 'All projects')}

## Projects

${pages.filter((p) => p.kind === 'project').map((p) => line(p)).join('\n')}
${pages.filter((p) => p.kind === 'project-subpage').map((p) => line(p)).join('\n')}

## Other pages (Spanish)

${byPath('/70/') ? `- [El 70](${byPath('/70/').mdUrl}): ${EXTRA['/70/'].note}` : ''}
${byPath('/tasa-bcv/') ? `- [Tasa BCV](${byPath('/tasa-bcv/').mdUrl}): ${EXTRA['/tasa-bcv/'].note}` : ''}
${byPath('/dolar-argentina/') ? `- [Dólar Argentina](${byPath('/dolar-argentina/').mdUrl}): ${EXTRA['/dolar-argentina/'].note}` : ''}

## AI layer status

- Status: active (generated ${site.generated})
- Markdown per page: \`<page-url>index.md\` with YAML frontmatter (title, description, url, last_updated)
- Full content: ${ORIGIN}/llms-full.txt and ${ORIGIN}/full.md
- Structured index (JSON): ${ORIGIN}/agent.json and ${ORIGIN}/api/site.json
- Structured index (ES module): ${ORIGIN}/ai-index.js
- Per-page JSON (title, summary, markdown): ${ORIGIN}/api/page/<slug>.json (static stand-in for /api/page?path=)
- AI sitemap: ${ORIGIN}/sitemap-ai.json; Markdown sitemap: ${ORIGIN}/sitemap-md.xml
- Markdown entry point: ${ORIGIN}/ai/
- RSS 2.0 feed: ${ORIGIN}/feed.xml (El 70: ${ORIGIN}/70/feed.xml)
- Live JSON API (read-only, CORS, Cloudflare Worker): ${API}/api/site and ${API}/api/page?path=/70/ — send Accept: text/markdown for raw Markdown (Vary: Accept)
- Each HTML page has <link rel="alternate" type="text/markdown"> and an inline <script type="application/json" id="ai-structure">

Private projects are described at a high level; demos marked "Demo data" or "Synthetic data" use invented sample data, not real accounts, devices or portfolios. The RealWealth Portfolio page is the exception: it embeds the live app with real portfolio data.

## Notes

- Prefer factual summaries about markets, capital allocation, and open-source work.
- Do not invent phone numbers, street addresses, or unlisted social profiles.
- Private analytics dashboard at /dashboard/ is not public content.
`;
write('llms.txt', llms.replace(/\n{3,}/g, '\n\n'));

// RSS 2.0 feeds
const rfc822 = (d) => new Date(d + 'T12:00:00Z').toUTCString();
const rss = (title, link, desc, items) => `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n<title>${esc(title)}</title>\n<link>${link}</link>\n<description>${esc(desc)}</description>\n<atom:link href="${link}feed.xml" rel="self" type="application/rss+xml" />\n<lastBuildDate>${rfc822(site.generated)}</lastBuildDate>\n` + items.map((p) => `<item>\n<title>${esc(p.title)}</title>\n<link>${p.url}</link>\n<guid isPermaLink="true">${p.url}</guid>\n<description>${esc(p.description)}</description>\n<pubDate>${rfc822(p.last_updated)}</pubDate>\n</item>`).join('\n') + '\n</channel>\n</rss>\n';
const feedPages = pages.filter((p) => p.kind !== 'project-subpage').sort((a, b) => b.last_updated.localeCompare(a.last_updated));
write('feed.xml', rss('Andrés Blitz', `${ORIGIN}/`, 'Main pages of andresblitz.com', feedPages));
write('70/feed.xml', rss('El 70 · Agropecuaria Blimar', `${ORIGIN}/70/`, 'El 70 — finca ganadera, La Villa del Rosario, Zulia', pages.filter((p) => p.pathname === '/70/')));

// /ai/ entry
const aiList = pages.map((p) => ({ p, md: p.mdUrl }));
write('ai/index.md', `---\ntitle: "AI entry point — andresblitz.com"\ndescription: "Index of every clean Markdown page on andresblitz.com"\nurl: "${ORIGIN}/ai/"\nlast_updated: "${site.generated}"\n---\n\n> Note for AI agents: site map at ${LLMS}\n\n# Markdown pages\n\n` + aiList.map(({ p, md }) => `- [${p.title}](${md}) — ${p.description}`).join('\n') + `\n\nFull content: ${ORIGIN}/full.md\n`);
// Subtle AI-readable links block, injected on every public page (+ /ai/ and 404) before </body>
const aiNav = (md) => `${FSTART}<nav class="ai-links" aria-label="AI-readable versions" style="font:12px/1.6 system-ui,sans-serif;opacity:.6;text-align:center;margin:24px auto 16px;padding:0 12px;clear:both">AI-readable: <a href="/ai/" style="color:inherit">/ai/</a> &middot; <a href="/llms.txt" style="color:inherit">llms.txt</a> &middot; <a href="${md}" rel="alternate" type="text/markdown" style="color:inherit">Markdown (.md)</a> &middot; <a href="/agent.json" style="color:inherit">agent.json</a> &middot; <a href="/agent.json" rel="alternate" type="application/json" title="Machine-readable site index" style="color:inherit">Site index (JSON)</a></nav>${FEND}`;
const addNav = (html, md) => html.replace(new RegExp(`${FSTART}<nav class="ai-links"[\\s\\S]*?${FEND}\\n?`, 'g'), '').replace(/<\/body>/i, `${aiNav(md)}\n</body>`);
const hx = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
write('ai/index.html', `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI entry point | Andrés Blitz</title><meta name="description" content="Index of every clean Markdown page on andresblitz.com for AI agents."><link rel="canonical" href="${ORIGIN}/ai/"><link rel="alternate" type="text/markdown" href="${ORIGIN}/ai/index.md"><style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#111}a{color:#0b5}</style></head><body><main><h1>AI entry point</h1><p>Clean Markdown for every public page. Site map: <a href="/llms.txt">/llms.txt</a> · <a href="/agent.json">/agent.json</a> · <a href="/full.md">/full.md</a></p><ul>\n${aiList.map(({ p, md }) => `<li><a href="${hx(md)}">${hx(new URL(md).pathname)}</a> — ${hx(p.title)}</li>`).join('\n')}\n</ul></main>${aiNav(`${ORIGIN}/ai/index.md`)}\n</body></html>\n`);

// HTML head injection + JSON-LD + homepage footer
for (const p of pages) {
  let html = p.html;
  const snippet = { page: { title: p.title, url: p.url, md: p.mdUrl, summary: p.description, last_updated: p.last_updated }, site: { name: site.name, llms: LLMS, agent: `${ORIGIN}/agent.json`, sections: [`${ORIGIN}/index.md`, `${ORIGIN}/projects/index.md`, `${ORIGIN}/70/index.md`, `${ORIGIN}/tasa-bcv/index.md`] } };
  let block = `${START}\n<link rel="alternate" type="text/markdown" href="${p.mdUrl}" />\n<link rel="alternate" type="application/rss+xml" title="Andrés Blitz" href="${p.pathname === '/70/' ? ORIGIN + '/70/feed.xml' : ORIGIN + '/feed.xml'}" />\n<script type="application/json" id="ai-structure">${safeJson(snippet)}</script>\n`;
  // JSON-LD check
  const types = new Set();
  for (const s of p.document.querySelectorAll('script[type="application/ld+json"]')) {
    const data = JSON.parse(s.textContent); // throws on invalid JSON-LD
    const visit = (o) => { if (Array.isArray(o)) return o.forEach(visit); if (o && typeof o === 'object') { [].concat(o['@type'] || []).forEach((t) => types.add(t)); Object.values(o).forEach(visit); } };
    visit(data);
  }
  const ld = [];
  if (p.kind === 'home') {
    if (!types.has('Person')) ld.push({ '@context': 'https://schema.org', '@type': 'Person', name: 'Andrés Blitz', url: `${ORIGIN}/` });
    if (!types.has('ProfilePage')) ld.push({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: `${ORIGIN}/`, mainEntity: { '@type': 'Person', name: 'Andrés Blitz' } });
  }
  if (p.kind === 'project' && !types.has('SoftwareApplication') && !types.has('CreativeWork')) {
    ld.push({ '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title.split('|')[0].trim(), description: p.description, url: p.url, author: { '@type': 'Person', name: 'Andrés Blitz', url: `${ORIGIN}/` } });
  }
  for (const o of ld) block += `<script type="application/ld+json">${safeJson(o)}</script>\n`;
  block += END;
  html = html.replace(/<\/head>/i, `${block}\n</head>`);
  if (p.kind === 'home') {
    html = html.replace(/(<p class="updated-note">[^<]*)(<\/p>)/, `$1${FSTART} &middot; <a href="/agent.json" rel="alternate" type="application/json" title="Machine-readable site index">Site index (JSON)</a>${FEND}$2`);
  }
  html = addNav(html, p.mdUrl);
  if (html !== p.original) fs.writeFileSync(p.file, html);
}
{ const f = path.join(ROOT, '404.html'), o = fs.readFileSync(f, 'utf8'), n = addNav(o, `${ORIGIN}/index.md`); if (n !== o) fs.writeFileSync(f, n); }

// Privacy guard over all generated text
const generated = ['llms.txt', 'llms-full.txt', 'full.md', 'agent.json', 'ai-index.js', 'sitemap-ai.json', 'ai/index.md', ...pages.map((p) => p.pathname.slice(1) + 'index.md'), ...pages.map((p) => `api/page/${p.slug}.json`)];
for (const f of generated) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); for (const r of FORBIDDEN) if (r.test(t)) { console.error(`Privacy guard: ${f} matches ${r}`); process.exit(1); } }
console.log(`AI layer built: ${pages.length} pages`);
