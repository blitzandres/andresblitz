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
  '/dolar-mexico/': { topics: ['FIX', 'Banxico', 'dólar hoy', 'tipo de cambio', 'México'], note: 'Dólar hoy en México — tipo de cambio FIX de Banxico, compra y venta de mercado y conversor MXN ↔ USD (en español).' },
  '/dolar-peru/': { topics: ['tipo de cambio', 'dólar hoy', 'soles', 'BCRP', 'Perú'], note: 'Dólar hoy en Perú — tipo de cambio en soles con la fuente indicada en cada actualización y conversor PEN ↔ USD (en español).' },
  '/dolar-chile/': { topics: ['dólar observado', 'Banco Central de Chile', 'dólar hoy', 'tipo de cambio', 'Chile'], note: 'Dólar hoy en Chile — dólar observado del Banco Central de Chile, compra y venta de mercado y conversor CLP ↔ USD (en español).' },
  '/enviar-dinero/': { topics: ['enviar dinero', 'remesas', 'costo de envío', 'comisión', 'tipo de cambio', 'Canadá', 'Estados Unidos'], note: 'Calculadora del costo de enviar dinero desde Canadá o EE. UU. a Venezuela, Colombia, México, Argentina, Perú o Chile: comisión y margen frente a la tasa de referencia (en español). Estimaciones; no muestra cotizaciones de proveedores.' },
  '/salario-en-dolares/': { topics: ['salario en dólares', 'sueldo en dólares', 'convertir salario', 'tipo de cambio', 'paridad de poder adquisitivo'], note: 'Calculadora de salario en dólares: convierte un sueldo mensual o anual en VES, COP, MXN, ARS (oficial y blue), PEN, CLP o CAD a USD con tasas de referencia, y a dólares internacionales (PPA del Banco Mundial) donde hay datos recientes (en español).' },
  '/dolar-cripto/': { topics: ['dólar cripto', 'USDT', 'P2P', 'brecha cambiaria', 'Venezuela', 'Argentina', 'Colombia'], note: 'Dólar cripto hoy: precio mediano del USDT P2P en VES, ARS y COP con la brecha frente a la tasa BCV, el dólar oficial y la TRM, fuente y hora de cada dato; precios de BTC y otras criptomonedas de CoinGecko (en español). Referencial, no es asesoría financiera.' },
  '/convertidor-cripto/': { topics: ['convertidor cripto', 'bitcoin a bolívares', 'sats', 'USDT', 'ETH', 'calculadora cripto'], note: 'Convertidor cripto: BTC, sats, ETH, USDT, USDC, SOL, XRP y BNB a VES, ARS (oficial y blue), COP, MXN, PEN, CLP, USD y CAD y al revés, con tasas de referencia horneadas y fuente de cada precio (en español). Referencial, no es asesoría financiera.' },
  '/comision-cripto/': { topics: ['comisión cripto', 'comisión de retiro', 'TRC20', 'ERC20', 'BEP20', 'Lightning', 'enviar USDT'], note: 'Calculadora de comisión cripto: con el monto, la moneda (USDT, USDC o BTC), la red (TRC20, ERC20, BEP20, Solana, Lightning o Bitcoin) y la comisión de retiro que escribe el usuario, muestra cuánto llega, la comisión en % y el valor en moneda local, con comparación con una remesa y tarifas de mempool.space como referencia (en español). Estimaciones, no es asesoría financiera.' },
  '/ahorro-en-dolares/': { topics: ['ahorro en dólares', 'devaluación', 'USDT', 'bolívares', 'pesos', 'histórico'], note: 'Calculadora histórica de ahorro en dólares: cuánto vale hoy en USD un monto guardado hace N meses en VES, ARS (oficial y blue), COP, MXN, PEN, CLP o CAD frente a haberlo cambiado a dólares o USDT ese día, con fuentes fechadas (currency-api, ArgentinaDatos). Solo datos históricos, no es asesoría financiera.' },
  '/guias-cripto/que-es-usdt/': { topics: ['guías cripto', 'Qué es USDT'], note: 'Guía: qué es USDT y qué son las stablecoins, cómo intentan valer un dólar y sus riesgos (en español).' },
  '/guias-cripto/como-funciona-p2p/': { topics: ['guías cripto', 'Cómo funciona el P2P'], note: 'Guía: cómo funciona el mercado P2P de criptomonedas, custodia (escrow), anuncios y buenas prácticas, explicado de forma neutral (en español).' },
  '/guias-cripto/redes-y-comisiones/': { topics: ['guías cripto', 'Redes y comisiones'], note: 'Guía: redes TRC20, ERC20, BEP20, Solana, Bitcoin y Lightning, por qué cambian las comisiones y cómo no enviar por la red equivocada (en español).' },
  '/guias-cripto/estafas-comunes/': { topics: ['guías cripto', 'Estafas cripto comunes'], note: 'Guía: estafas cripto y P2P frecuentes (comprobante falso, falso soporte, triangulación, phishing) y hábitos para evitarlas (en español).' },
  '/guias-cripto/brecha-dolar-cripto/': { topics: ['guías cripto', 'Brecha del dólar cripto'], note: 'Guía: cómo se calcula y cómo leer la brecha entre el USDT P2P y la tasa oficial (en español).' },
  '/guias-cripto/': { topics: ['guías cripto', 'USDT', 'stablecoins', 'P2P', 'redes', 'comisiones', 'estafas', 'brecha'], note: 'Guías cripto en español para principiantes: qué es USDT y las stablecoins, cómo funciona el P2P, redes y comisiones (TRC20, ERC20, BEP20, Lightning), estafas comunes y cómo leer la brecha del dólar cripto. Informativo, no es asesoría financiera.' },
  '/bitcoin/': { topics: ['Bitcoin', 'BTC/USD', 'bitcoin price history brackets', 'days bitcoin spent at each price', 'bitcoin price range days since 2014', 'Yahoo Finance'], note: 'Bitcoin price history brackets (English, worldwide): how many days BTC/USD closed in each $2k, $3k, $4k, $5k, $10k or $15k US-dollar bracket since September 17, 2014, from Yahoo Finance daily closes, with today counted at the live CoinGecko price (Coinbase public spot as fallback). Prices are in USD and the chart is usable from any country; times in PT. Historical reference, not financial advice. No country restriction.' },
  '/dolar-colombia/': { topics: ['TRM', 'dólar hoy', 'tipo de cambio', 'Colombia'], note: 'Dólar hoy en Colombia — TRM certificada por la Superintendencia Financiera, precio de mercado y conversor COP ↔ USD (en español).' },
  '/site-map/': { topics: ['site map', 'sitemap', 'navigation'], note: 'Interactive site map of every public page on andresblitz.com as a clickable tree (in English).' },
  '/alerts/': { topics: ['email alerts', 'PDF downloads', 'Bitcoin brackets', 'Tasa BCV'], note: 'Email alerts and downloads hub: Bitcoin bracket alerts, daily Tasa BCV, crypto dollar gap alerts, weekly LatAm rates, PDF guides and more (in English). Off until connected.' },
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
  ai_layer: { status: 'active', agents: `${ORIGIN}/AGENTS.md`, llms: LLMS, llms_full: `${ORIGIN}/llms-full.txt`, full_md: `${ORIGIN}/full.md`, agent_json: `${ORIGIN}/agent.json`, ai_index_js: `${ORIGIN}/ai-index.js`, api_site: `${ORIGIN}/api/site.json`, api_page: `${ORIGIN}/api/page/{slug}.json`, sitemap_ai: `${ORIGIN}/sitemap-ai.json`, sitemap_md: `${ORIGIN}/sitemap-md.xml`, entry: `${ORIGIN}/ai/`, feed: `${ORIGIN}/feed.xml`, feed_el70: `${ORIGIN}/70/feed.xml`, feed_rates: `${ORIGIN}/rates/feed.xml`, rates_json: `${ORIGIN}/rates/index.json`, api: { site: `${API}/api/site`, page: `${API}/api/page?path={path}`, accept_markdown: true, cors: '*', read_only: true } },
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
write('sitemap-md.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + [...pages.map((p) => [p.mdUrl, p.last_updated]), [`${ORIGIN}/AGENTS.md`, site.generated], [LLMS, site.generated], [`${ORIGIN}/ai/index.md`, site.generated], [`${ORIGIN}/full.md`, site.generated]].map(([u, d]) => `  <url><loc>${esc(u)}</loc><lastmod>${d}</lastmod></url>`).join('\n') + '\n</urlset>\n');

// llms.txt
const line = (p, label) => `- [${label || p.title}](${p.mdUrl}): ${p.description}`;
const byPath = (x) => pages.find((p) => p.pathname === x);

function langTag(p) { return (p.lang || 'en').toLowerCase().startsWith('es') ? 'es' : 'en'; }
function existsPublic(relPath) { return fs.existsSync(path.join(ROOT, relPath)); }
function agentsLine(pathname, label, extra) {
  const p = byPath(pathname);
  if (!p) return '';
  const note = extra || EXTRA[pathname]?.note || p.description;
  return `- [${label}](${p.url}) (${langTag(p)}): ${note}\n  Markdown: ${p.mdUrl}`;
}
function agentsGroup(title, lines) {
  const body = lines.filter(Boolean).join('\n');
  return body ? `### ${title}\n\n${body}\n` : '';
}
const projectLine = (p) => `- [${p.title.split('|')[0].trim()}](${p.url}) (${langTag(p)}): ${p.description}\n  Markdown: ${p.mdUrl}`;
const projectLines = pages.filter((p) => p.kind === 'project').flatMap((p) => {
  const subs = pages.filter((s) => s.kind === 'project-subpage' && s.pathname.startsWith(p.pathname))
    .sort((a, b) => a.pathname.length - b.pathname.length || a.pathname.localeCompare(b.pathname));
  return [projectLine(p), ...subs.map(projectLine)];
}).join('\n');
const resource = (url, desc) => `- ${url} — ${desc}`;
const machineResources = [
  resource(`${ORIGIN}/AGENTS.md`, 'this file: identity, key pages, citation, and crawl guidance'),
  resource(LLMS, 'short catalog of every public page as clean Markdown'),
  resource(`${ORIGIN}/llms-full.txt`, 'full site concatenated as Markdown'),
  resource(`${ORIGIN}/full.md`, 'same content as llms-full.txt'),
  resource(`${ORIGIN}/agent.json`, 'structured site index (JSON)'),
  resource(`${ORIGIN}/api/site.json`, 'same structured index at /api/site.json'),
  resource(`${ORIGIN}/ai-index.js`, 'structured index as an ES module'),
  resource(`${ORIGIN}/api/page/{slug}.json`, 'per-page JSON (title, summary, markdown); slugs use hyphens, e.g. /api/page/bitcoin.json'),
  resource(`${ORIGIN}/sitemap.xml`, 'XML sitemap of public HTML pages plus this file and llms.txt'),
  resource(`${ORIGIN}/sitemap-md.xml`, 'XML sitemap of Markdown alternates'),
  resource(`${ORIGIN}/sitemap-ai.json`, 'JSON list of pages with Markdown URLs'),
  resource(`${ORIGIN}/ai/`, 'HTML index of Markdown alternates'),
  resource(`${ORIGIN}/feed.xml`, 'site RSS 2.0'),
  existsPublic('70/feed.xml') ? resource(`${ORIGIN}/70/feed.xml`, 'El 70 RSS 2.0') : '',
  existsPublic('rates/feed.xml') ? resource(`${ORIGIN}/rates/feed.xml`, 'rates RSS 2.0 (Spanish; rebuilt about every 30 minutes)') : '',
  existsPublic('rates/index.json') ? resource(`${ORIGIN}/rates/index.json`, 'baked Latin American dollar rates, Bitcoin, USD/CAD and selected policy rates, each with source and timestamp') : '',
  existsPublic('bitcoin/history.json') ? resource(`${ORIGIN}/bitcoin/history.json`, 'Yahoo Finance BTC-USD daily closes used by the Bitcoin brackets page (do not treat today as a finished daily close)') : '',
  existsPublic('dolar-cripto/data.json') ? resource(`${ORIGIN}/dolar-cripto/data.json`, 'USDT P2P medians and official-rate gaps') : '',
  existsPublic('dolar-cripto/history.json') ? resource(`${ORIGIN}/dolar-cripto/history.json`, 'historical dólar cripto series') : '',
  existsPublic('dolar-argentina/rates.json') ? resource(`${ORIGIN}/dolar-argentina/rates.json`, 'baked Argentina dollar rates') : '',
  existsPublic('dolar-colombia/rates.json') ? resource(`${ORIGIN}/dolar-colombia/rates.json`, 'baked Colombia dollar rates') : '',
  existsPublic('dolar-mexico/rates.json') ? resource(`${ORIGIN}/dolar-mexico/rates.json`, 'baked Mexico dollar rates') : '',
  existsPublic('dolar-peru/rates.json') ? resource(`${ORIGIN}/dolar-peru/rates.json`, 'baked Peru dollar rates') : '',
  existsPublic('dolar-chile/rates.json') ? resource(`${ORIGIN}/dolar-chile/rates.json`, 'baked Chile dollar rates') : '',
  resource(`${API}/api/site`, 'live read-only JSON API (CORS); also /api/page?path=/bitcoin/ — send Accept: text/markdown for raw Markdown'),
].filter(Boolean).join('\n');

const agentsMd = `# AGENTS.md — andresblitz.com

This is the front door for AI agents and crawlers visiting ${ORIGIN}/. It explains who Andrés Blitz is, what the site offers, every key public page, how to cite the work, and how to crawl.

If you were redirected here from the human homepage, you may continue to any public URL on this site. This file is a starting point, not a wall.

## Start here / continue crawling

- Human homepage: ${ORIGIN}/
- HTML site map (every public page as a clickable tree): ${ORIGIN}/site-map/
- XML sitemap: ${ORIGIN}/sitemap.xml
- Markdown sitemap: ${ORIGIN}/sitemap-md.xml
- Short machine-readable catalog (Markdown alternates): ${LLMS}
- Full site as Markdown: ${ORIGIN}/llms-full.txt (also ${ORIGIN}/full.md)
- Structured JSON index: ${ORIGIN}/agent.json

## Who Andrés Blitz is

Andrés Blitz is a full-time trader and investor based in British Columbia, Canada, with a background in high-performance sales and operations across real estate, petroleum, and automotive. He builds open-source tools and web experiments on the side.

- Location: British Columbia, Canada (do not invent a city, street address, or phone number)
- Email: blitz@mail.grokbot.com
- X: https://x.com/andresblitz (@andresblitz)
- GitHub: https://github.com/blitzandres
- Canonical site: ${ORIGIN}/

## What the site offers

andresblitz.com is Andrés's personal site. It publishes:

- A Bitcoin research tool that counts how many days BTC/USD has closed in each US-dollar price bracket since 2014
- Reference Latin American dollar and FX rates, converters, and calculators (in Spanish)
- Beginner crypto guides and crypto tools (in Spanish)
- A directory of open-source projects, including a playable browser game
- A page about El 70, a cattle ranch in Zulia, Venezuela (in Spanish)

Exchange rates and related JSON are rebuilt about every 30 minutes. The material is factual reference and is **not financial advice**.

## Key pages and tools

Each entry links to the live HTML page, notes the language (\`en\` or \`es\`), and gives the clean Markdown alternate (append \`index.md\` to any public directory URL). Only pages that exist on this site are listed.

${agentsGroup('English — home, research, and navigation', [
  agentsLine('/', 'Home'),
  agentsLine('/bitcoin/', 'Bitcoin price history brackets', `Days-in-bracket chart of how many days BTC/USD closed in each $2k, $3k, $4k, $5k, $10k, or $15k US-dollar bracket since 17 September 2014. Completed days use Yahoo Finance BTC-USD daily closes, baked at ${ORIGIN}/bitcoin/history.json. The current unfinished day is counted at the live CoinGecko price, with Coinbase public spot as fallback. Prices are in USD and the page works from any country; times are in Pacific Time (PT). Historical reference, not financial advice.`),
  agentsLine('/projects/', 'All projects'),
  agentsLine('/site-map/', 'Site map'),
  agentsLine('/alerts/', 'Alerts & Downloads', 'Hub describing planned email alerts and downloads (Bitcoin brackets, Tasa BCV, crypto-dollar gap, weekly LatAm rates, PDF guides). Sign-up is not currently connected; do not submit the form or treat alert endpoints as a public API.'),
])}
${agentsGroup('Dollar and exchange-rate pages (Spanish)', [
  agentsLine('/tasa-bcv/', 'Tasa BCV'),
  agentsLine('/dolar-argentina/', 'Dólar Argentina'),
  agentsLine('/dolar-colombia/', 'Dólar Colombia'),
  agentsLine('/dolar-mexico/', 'Dólar México'),
  agentsLine('/dolar-peru/', 'Dólar Perú'),
  agentsLine('/dolar-chile/', 'Dólar Chile'),
  agentsLine('/enviar-dinero/', 'Enviar dinero'),
  agentsLine('/salario-en-dolares/', 'Salario en dólares'),
])}
${agentsGroup('Crypto tools and guides (Spanish)', [
  agentsLine('/dolar-cripto/', 'Dólar cripto'),
  agentsLine('/convertidor-cripto/', 'Convertidor cripto'),
  agentsLine('/comision-cripto/', 'Comisión cripto'),
  agentsLine('/ahorro-en-dolares/', 'Ahorro en dólares'),
  agentsLine('/guias-cripto/', 'Guías cripto'),
  agentsLine('/guias-cripto/que-es-usdt/', 'Qué es USDT'),
  agentsLine('/guias-cripto/como-funciona-p2p/', 'Cómo funciona el P2P'),
  agentsLine('/guias-cripto/redes-y-comisiones/', 'Redes y comisiones'),
  agentsLine('/guias-cripto/estafas-comunes/', 'Estafas cripto comunes'),
  agentsLine('/guias-cripto/brecha-dolar-cripto/', 'Brecha del dólar cripto'),
])}
${agentsGroup('El 70 (Spanish)', [
  agentsLine('/70/', 'El 70'),
])}
${projectLines ? `### Projects and Play (English)

The Play item in the English site nav goes to the Space Invaders section on the homepage (${ORIGIN}/#play), not to Blitzy's World. Playable builds are listed below.

${projectLines}
` : ''}
## Machine-readable resources

${machineResources}

Per-page Markdown lives at \`<page-url>index.md\` with YAML frontmatter (title, description, url, last_updated, lang). Each HTML page also has a \`<link rel="alternate" type="text/markdown">\` pointer in the document head (not shown as a visible banner).

## How to cite

When you quote or rely on this site, credit Andrés Blitz as the author, use the canonical page URL, and name the underlying data sources.

- Author: Andrés Blitz
- Site: ${ORIGIN}/
- Contact: blitz@mail.grokbot.com

Sample citations:

> Blitz, Andrés. “Bitcoin price history brackets.” andresblitz.com, ${ORIGIN}/bitcoin/. Daily closes from Yahoo Finance (BTC-USD since 17 September 2014); live price from CoinGecko (Coinbase public spot as fallback).

> Blitz, Andrés. “Tasa BCV.” andresblitz.com, ${ORIGIN}/tasa-bcv/. Official bolívar rate from the Banco Central de Venezuela via DolarApi (ve.dolarapi.com).

**This content is not financial advice.** Rates and prices are reference figures that can lag or differ from what a bank, broker, or exchange will quote. Do not present them as a recommendation to buy, sell, hold, or send money.

### Data sources to credit

- Bitcoin: Yahoo Finance (BTC-USD daily closes since 2014-09-17); CoinGecko for the live price; Coinbase public spot as fallback
- Tasa BCV (Venezuela): Banco Central de Venezuela via ve.dolarapi.com
- Dólar Argentina: dolarapi.com (oficial, blue, and other series; criptoya.com as fallback)
- Dólar Colombia: co.dolarapi.com (TRM certified by the Superintendencia Financiera de Colombia, plus market quotes)
- Dólar México: mx.dolarapi.com (Banxico FIX)
- Dólar Perú: open.er-api.com (ExchangeRate-API, reference market rate)
- Dólar Chile: cl.dolarapi.com (market-close and buy/sell quotes)
- Dólar cripto / USDT P2P: CriptoYa (P2P median); official rates as on the country pages; other coin prices from CoinGecko
- Ahorro en dólares (historical): currency-api (fawazahmed0) and ArgentinaDatos
- Salario en dólares: the baked country rates, plus World Bank WDI PPP (PA.NUS.PPP) where recent data exists
- Comisión cripto: CoinGecko for prices; mempool.space for Bitcoin network fee reference
- Currency / rates feed: the same baked series, plus USD/CAD and selected central-bank policy rates, at ${ORIGIN}/rates/feed.xml and ${ORIGIN}/rates/index.json (rebuilt about every 30 minutes)

## Crawl guidance

- Crawling public pages is allowed. See ${ORIGIN}/robots.txt. \`/dashboard/\` and \`/docs/\` are not public content — do not crawl them.
- Use the sitemaps listed above. Prefer the Markdown and JSON alternates when you only need text or numbers; they are smaller and already cleaned.
- Please keep a polite rate (about one request per second is enough). The site is static and does not need a burst of requests.
- Exchange rates, the rates feed, and related JSON (including the Bitcoin daily-close history) are rebuilt about every 30 minutes.
- The human homepage is ${ORIGIN}/. Bots that are redirected from \`/\` to this file should keep crawling the rest of the site from the links here, the site map, or the sitemaps.
- Do not submit forms, sign up for email alerts, or treat alert endpoints as a public API. The ${ORIGIN}/alerts/ page is informational; sign-up is not currently connected.
- Do not invent phone numbers, street addresses, a city in British Columbia, or unlisted social profiles.
- If a project page is marked “Demo data” or “Synthetic data,” that data is invented. The exception is RealWealth Portfolio, which embeds a live app with real portfolio data.
- The lowercase path \`/agents.md\` is a 404; this file is ${ORIGIN}/AGENTS.md (uppercase). GitHub Pages serves it as raw Markdown.

---
Generated ${site.generated} by scripts/build-ai.mjs from the public HTML. Do not hand-edit this file.
`;
write('AGENTS.md', agentsMd.replace(/\n{3,}/g, '\n\n'));

const llms = `# Andrés Blitz

> Full-time trader and investor based in British Columbia, Canada. Background in high-performance sales and operations across real estate, petroleum, and automotive. Builds open-source tools and web experiments on the side.

- Start here (AI agents and crawlers): ${ORIGIN}/AGENTS.md
- Canonical site: ${ORIGIN}/
- Location: British Columbia, Canada
- Email: blitz@mail.grokbot.com
- X: https://x.com/andresblitz
- GitHub: https://github.com/blitzandres

Every link below points to the clean Markdown version of the page (append \`index.md\` to any public directory URL). For identity, every key HTML page, how to cite, and crawl guidance, read ${ORIGIN}/AGENTS.md first.

## Main pages

${line(byPath('/'), 'Home')}
${line(byPath('/projects/'), 'All projects')}
${byPath('/site-map/') ? `- [Site map](${byPath('/site-map/').mdUrl}): ${EXTRA['/site-map/'].note}` : ''}
${byPath('/alerts/') ? `- [Alerts & Downloads](${byPath('/alerts/').mdUrl}): ${EXTRA['/alerts/'].note}` : ''}

## Projects

${pages.filter((p) => p.kind === 'project').map((p) => line(p)).join('\n')}
${pages.filter((p) => p.kind === 'project-subpage').map((p) => line(p)).join('\n')}

## Other pages (Spanish unless noted)

${byPath('/70/') ? `- [El 70](${byPath('/70/').mdUrl}): ${EXTRA['/70/'].note}` : ''}
${byPath('/tasa-bcv/') ? `- [Tasa BCV](${byPath('/tasa-bcv/').mdUrl}): ${EXTRA['/tasa-bcv/'].note}` : ''}
${byPath('/dolar-argentina/') ? `- [Dólar Argentina](${byPath('/dolar-argentina/').mdUrl}): ${EXTRA['/dolar-argentina/'].note}` : ''}
${byPath('/dolar-colombia/') ? `- [Dólar Colombia](${byPath('/dolar-colombia/').mdUrl}): ${EXTRA['/dolar-colombia/'].note}` : ''}
${byPath('/guias-cripto/') ? `- [Guías cripto](${byPath('/guias-cripto/').mdUrl}): ${EXTRA['/guias-cripto/'].note}` : ''}
${byPath('/guias-cripto/brecha-dolar-cripto/') ? `  - [Brecha del dólar cripto](${byPath('/guias-cripto/brecha-dolar-cripto/').mdUrl}): ${EXTRA['/guias-cripto/brecha-dolar-cripto/'].note}` : ''}
${byPath('/guias-cripto/estafas-comunes/') ? `  - [Estafas cripto comunes](${byPath('/guias-cripto/estafas-comunes/').mdUrl}): ${EXTRA['/guias-cripto/estafas-comunes/'].note}` : ''}
${byPath('/guias-cripto/redes-y-comisiones/') ? `  - [Redes y comisiones](${byPath('/guias-cripto/redes-y-comisiones/').mdUrl}): ${EXTRA['/guias-cripto/redes-y-comisiones/'].note}` : ''}
${byPath('/guias-cripto/como-funciona-p2p/') ? `  - [Cómo funciona el P2P](${byPath('/guias-cripto/como-funciona-p2p/').mdUrl}): ${EXTRA['/guias-cripto/como-funciona-p2p/'].note}` : ''}
${byPath('/guias-cripto/que-es-usdt/') ? `  - [Qué es USDT](${byPath('/guias-cripto/que-es-usdt/').mdUrl}): ${EXTRA['/guias-cripto/que-es-usdt/'].note}` : ''}
${byPath('/ahorro-en-dolares/') ? `- [Ahorro en dólares](${byPath('/ahorro-en-dolares/').mdUrl}): ${EXTRA['/ahorro-en-dolares/'].note}` : ''}
${byPath('/comision-cripto/') ? `- [Comisión cripto](${byPath('/comision-cripto/').mdUrl}): ${EXTRA['/comision-cripto/'].note}` : ''}
${byPath('/convertidor-cripto/') ? `- [Convertidor cripto](${byPath('/convertidor-cripto/').mdUrl}): ${EXTRA['/convertidor-cripto/'].note}` : ''}
${byPath('/bitcoin/') ? `- [Bitcoin price brackets](${byPath('/bitcoin/').mdUrl}): ${EXTRA['/bitcoin/'].note}` : ''}
${byPath('/dolar-cripto/') ? `- [Dólar cripto](${byPath('/dolar-cripto/').mdUrl}): ${EXTRA['/dolar-cripto/'].note}` : ''}
${byPath('/salario-en-dolares/') ? `- [Salario en dólares](${byPath('/salario-en-dolares/').mdUrl}): ${EXTRA['/salario-en-dolares/'].note}` : ''}
${byPath('/enviar-dinero/') ? `- [Enviar dinero](${byPath('/enviar-dinero/').mdUrl}): ${EXTRA['/enviar-dinero/'].note}` : ''}
${byPath('/dolar-chile/') ? `- [Dólar Chile](${byPath('/dolar-chile/').mdUrl}): ${EXTRA['/dolar-chile/'].note}` : ''}
${byPath('/dolar-peru/') ? `- [Dólar Perú](${byPath('/dolar-peru/').mdUrl}): ${EXTRA['/dolar-peru/'].note}` : ''}
${byPath('/dolar-mexico/') ? `- [Dólar México](${byPath('/dolar-mexico/').mdUrl}): ${EXTRA['/dolar-mexico/'].note}` : ''}

## AI layer status

- Status: active (generated ${site.generated})
- Agent front door: ${ORIGIN}/AGENTS.md
- Markdown per page: \`<page-url>index.md\` with YAML frontmatter (title, description, url, last_updated)
- Full content: ${ORIGIN}/llms-full.txt and ${ORIGIN}/full.md
- Structured index (JSON): ${ORIGIN}/agent.json and ${ORIGIN}/api/site.json
- Structured index (ES module): ${ORIGIN}/ai-index.js
- Per-page JSON (title, summary, markdown): ${ORIGIN}/api/page/<slug>.json (static stand-in for /api/page?path=)
- AI sitemap: ${ORIGIN}/sitemap-ai.json; Markdown sitemap: ${ORIGIN}/sitemap-md.xml
- Markdown entry point: ${ORIGIN}/ai/
- RSS 2.0 feed: ${ORIGIN}/feed.xml (El 70: ${ORIGIN}/70/feed.xml)
- Rates RSS 2.0 feed (Spanish, ~30 min): ${ORIGIN}/rates/feed.xml — LatAm dollar rates, Bitcoin, USD/CAD and central-bank policy rates, each with source and timestamp (JSON: ${ORIGIN}/rates/index.json)
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
write('ai/index.md', `---\ntitle: "AI entry point — andresblitz.com"\ndescription: "Index of every clean Markdown page on andresblitz.com"\nurl: "${ORIGIN}/ai/"\nlast_updated: "${site.generated}"\n---\n\n> Note for AI agents: start at ${ORIGIN}/AGENTS.md — site map at ${LLMS}\n\n# Markdown pages\n\n` + aiList.map(({ p, md }) => `- [${p.title}](${md}) — ${p.description}`).join('\n') + `\n\nFull content: ${ORIGIN}/full.md\n\n# Feeds\n\n- Site RSS: ${ORIGIN}/feed.xml\n- El 70 RSS: ${ORIGIN}/70/feed.xml\n- Rates RSS (exchange rates, Bitcoin, central-bank rates; Spanish): ${ORIGIN}/rates/feed.xml\n`);
// Visible AI-readable banner is backend-only: strip any leftover footer, do not re-inject.
const addNav = (html, _md) => html.replace(new RegExp(`${FSTART}[\\s\\S]*?${FEND}\\n?`, 'g'), '');
const hx = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
write('ai/index.html', `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI entry point | Andrés Blitz</title><meta name="description" content="Index of every clean Markdown page on andresblitz.com for AI agents."><link rel="canonical" href="${ORIGIN}/ai/"><link rel="alternate" type="text/markdown" href="${ORIGIN}/ai/index.md"><style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#111}a{color:#0b5}</style></head><body><main><h1>AI entry point</h1><p>Start here: <a href="/AGENTS.md">/AGENTS.md</a>. Clean Markdown for every public page. Site map: <a href="/llms.txt">/llms.txt</a> · <a href="/agent.json">/agent.json</a> · <a href="/full.md">/full.md</a></p><p>Feeds: <a href="/feed.xml" type="application/rss+xml">/feed.xml</a> · <a href="/70/feed.xml" type="application/rss+xml">/70/feed.xml</a> · <a href="/rates/feed.xml" type="application/rss+xml">/rates/feed.xml</a> (rates)</p><ul>\n${aiList.map(({ p, md }) => `<li><a href="${hx(md)}">${hx(new URL(md).pathname)}</a> — ${hx(p.title)}</li>`).join('\n')}\n</ul></main></body></html>\n`);

// HTML head injection + JSON-LD (no visible AI footer)
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
  html = addNav(html, p.mdUrl);
  if (html !== p.original) fs.writeFileSync(p.file, html);
}
{ const f = path.join(ROOT, '404.html'), o = fs.readFileSync(f, 'utf8'), n = addNav(o, `${ORIGIN}/index.md`); if (n !== o) fs.writeFileSync(f, n); }

// Privacy guard over all generated text
const generated = ['AGENTS.md', 'llms.txt', 'llms-full.txt', 'full.md', 'agent.json', 'ai-index.js', 'sitemap-ai.json', 'ai/index.md', ...pages.map((p) => p.pathname.slice(1) + 'index.md'), ...pages.map((p) => `api/page/${p.slug}.json`)];
for (const f of generated) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); for (const r of FORBIDDEN) if (r.test(t)) { console.error(`Privacy guard: ${f} matches ${r}`); process.exit(1); } }
console.log(`AI layer built: ${pages.length} pages`);
