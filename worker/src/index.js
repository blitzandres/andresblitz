// Read-only AI API for andresblitz.com. Proxies the static AI layer on GitHub Pages.
const ORIGIN = 'https://andresblitz.com';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Content-Type' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const CACHE = 'public, max-age=300, s-maxage=3600';
const BLOCK = /^\/dashboard/;

function reply(body, type, status = 200, extra = {}) {
  return new Response(body, { status, headers: { 'Content-Type': type, 'Cache-Control': CACHE, Vary: 'Accept', ...SEC, ...CORS, ...extra } });
}
const json = (o, s = 200) => reply(JSON.stringify(o, null, 2), 'application/json; charset=utf-8', s);
const wantsMd = (req) => (req.headers.get('Accept') || '').includes('text/markdown');
async function upstream(path) {
  const r = await fetch(ORIGIN + path, { cf: { cacheTtl: 3600, cacheEverything: true } });
  return r.ok ? r.text() : null;
}
function parseMd(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  const fm = {};
  if (m) for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) { try { fm[l.slice(0, i).trim()] = JSON.parse(l.slice(i + 1).trim()); } catch { fm[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } } }
  return fm;
}

export default {
  async fetch(req) {
    try { return await handle(req); } catch (e) { console.error('worker error', String(e && e.message || e)); return json({ error: 'internal error' }, 500); }
  },
};

const _h = {
  async handle(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'read-only' }, 405);
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/api' || url.pathname === '/api/') {
      return json({ name: 'andresblitz.com AI API', read_only: true, endpoints: ['/api/site', '/api/page?path=/70/'], llms: ORIGIN + '/llms.txt' });
    }
    if (url.pathname === '/api/site') {
      if (wantsMd(req)) { const md = await upstream('/full.md'); return md ? reply(md, 'text/markdown; charset=utf-8') : json({ error: 'upstream' }, 502); }
      const s = await upstream('/agent.json');
      return s ? reply(s, 'application/json; charset=utf-8') : json({ error: 'upstream' }, 502);
    }
    if (url.pathname === '/api/page') {
      let p = url.searchParams.get('path') || '/';
      if (!p.startsWith('/') || p.includes('..') || BLOCK.test(p)) return json({ error: 'invalid path' }, 400);
      p = p.replace(/index\.(html|md)$/, '');
      if (!p.endsWith('/')) p += '/';
      const md = await upstream(p + 'index.md');
      if (!md) return json({ error: 'not found', path: p }, 404);
      if (wantsMd(req)) return reply(md, 'text/markdown; charset=utf-8');
      const fm = parseMd(md);
      return json({ path: p, url: fm.url || ORIGIN + p, title: fm.title || '', summary: fm.description || '', last_updated: fm.last_updated || '', md: ORIGIN + p + 'index.md', markdown: md });
    }
    return json({ error: 'not found' }, 404);
  },
};
const handle = _h.handle;
