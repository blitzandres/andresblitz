// End-to-end test with no Cloudflare: D1 is faked with in-memory SQLite, email is captured,
// and the site's own files are served from the repo checkout. Run: node test.mjs
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import worker, { runCron } from './src/index.js';
import { PDFDocument } from 'pdf-lib';

const ROOT = path.resolve(import.meta.dirname, '..');
const sql = new DatabaseSync(':memory:');
sql.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

// Minimal D1 shim: ?1 ?2 … placeholders, first/all/run.
const D1 = {
  prepare(q) {
    const st = sql.prepare(q.replace(/\?(\d+)/g, '?'));
    const order = [...q.matchAll(/\?(\d+)/g)].map((m) => Number(m[1]) - 1);
    let args = [];
    const api = {
      bind: (...a) => { args = order.map((i) => a[i]); return api; },
      first: async (col) => { const r = st.get(...args); return r ? (col ? r[col] : { ...r }) : null; },
      all: async () => ({ results: st.all(...args).map((r) => ({ ...r })) }),
      run: async () => st.run(...args),
    };
    return api;
  },
};

const sent = [];
let override = {};
const env = {
  DB: D1,
  EMAIL: { send: async (m) => { sent.push(m); } },
  SITE: 'https://andresblitz.com',
  WORKER_URL: 'https://alerts.test',
  ALLOWED_ORIGINS: 'https://andresblitz.com',
  FROM_EMAIL: 'alertas@andresblitz.com',
  FROM_NAME: 'Andrés Blitz',
};
globalThis.fetch = async (u) => {
  const p = new URL(u).pathname;
  if (override[p]) return new Response(override[p]);
  const f = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('nf', { status: 404 });
};
const waits = [];
const ctx = { waitUntil: (p) => waits.push(p) };
const settle = async () => { await Promise.all(waits.splice(0)); };
const post = (body, ip = '1.1.1.1') => worker.fetch(new Request('https://alerts.test/subscribe', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Origin: 'https://andresblitz.com', 'CF-Connecting-IP': ip },
}), env, ctx);
const get = (p) => worker.fetch(new Request('https://alerts.test' + p), env, ctx);
const tokenFrom = (m) => m.html.match(/confirm\?t=([0-9a-f]+)/)[1];
async function signup(body) {
  sql.exec('DELETE FROM hits');
  const r = await post(body); assert.equal(r.status, 200, await r.clone().text()); await settle();
  const c = sent.pop(); assert.match(c.subject, /Confirm|Confirma/);
  const res = await get('/confirm?t=' + tokenFrom(c)); assert.equal(res.status, 303);
  return tokenFrom(c);
}
let n = 0; const ok = (name) => console.log(`ok ${++n} - ${name}`);

// Validation
assert.equal((await post({ email: 'nope', topic: 'bcv-daily' })).status, 400);
assert.equal((await post({ email: 'a@b.co', topic: 'nope' })).status, 400);
assert.equal((await post({ email: 'a@b.co', topic: 'btc-bracket', params: { width: 7 } })).status, 400);
assert.equal((await post({ email: 'a@b.co', topic: 'bcv-daily', hp: 'bot' })).status, 200); await settle();
assert.equal(sent.length, 0, 'honeypot sends nothing');
ok('rejects bad input, honeypot is silent');

// Rate limit
for (let i = 0; i < 6; i++) await post({ email: `r${i}@b.co`, topic: 'bcv-daily' }, '9.9.9.9');
assert.equal((await post({ email: 'r7@b.co', topic: 'bcv-daily' }, '9.9.9.9')).status, 429);
await settle(); sent.length = 0; sql.exec('DELETE FROM subs');
ok('rate limits sign-ups per IP');

// 1. BTC bracket: first cron records, a new close in another bracket alerts once.
await signup({ email: 'btc@x.co', topic: 'btc-bracket', params: { width: 10000 } });
const hist = JSON.parse(fs.readFileSync(path.join(ROOT, 'bitcoin/history.json')));
await runCron(env, new Date('2026-11-10T03:00:00Z'));
assert.equal(sent.length, 0);
const last = hist.closes.at(-1)[1];
hist.closes.push(['2099-01-01', last + 25000]);
override['/bitcoin/history.json'] = JSON.stringify(hist);
await runCron(env, new Date('2026-11-10T03:30:00Z'));
assert.equal(sent.length, 1); assert.match(sent[0].subject, /Bitcoin closed above/);
await runCron(env, new Date('2026-11-10T04:00:00Z'));
assert.equal(sent.length, 1, 'no repeat');
ok('btc-bracket: ' + sent[0].subject); sent.length = 0; delete override['/bitcoin/history.json'];
await runCron(env, new Date('2026-11-10T04:30:00Z')); sent.length = 0; // back to the real close

// 2. Bio PDF: confirm sends a download link; the PDF carries the tag.
await signup({ email: 'bio@x.co', topic: 'bio-pdf', lang: 'en' });
await settle();
const pm = sent.pop(); assert.match(pm.subject, /PDF bio/);
const link = pm.html.match(/\/pdf\/bio\?t=([0-9a-f]+)/);
const pr = await get(link[0]); assert.equal(pr.status, 200);
const bytes = new Uint8Array(await pr.arrayBuffer());
const doc = await PDFDocument.load(bytes);
assert.equal(doc.getSubject(), 'Personal copy ' + link[1]);
assert.equal(sql.prepare('SELECT downloads FROM pdf_tags WHERE tag = ?').get(link[1]).downloads, 1);
fs.writeFileSync(path.join(import.meta.dirname, 'sample-bio.pdf'), bytes);
ok(`bio-pdf: ${doc.getPageCount()} page(s), tag ${link[1]} in metadata, download counted`);

// 3. Dollar gap
await signup({ email: 'gap@x.co', topic: 'dolar-gap', lang: 'es', params: { country: 'VE', threshold: 50 } });
await runCron(env, new Date('2026-11-10T05:00:00Z'));
const dc = JSON.parse(fs.readFileSync(path.join(ROOT, 'dolar-cripto/data.json'))); dc.countries.VE.gap = 61.2;
override['/dolar-cripto/data.json'] = JSON.stringify(dc);
await runCron(env, new Date('2026-11-10T05:30:00Z'));
sent.splice(0, sent.length, ...sent.filter((m) => m.to === 'gap@x.co')); // btc@x.co gets a "closed below" as the test price is removed
assert.equal(sent.length, 1); assert.match(sent[0].subject, /Brecha Venezuela: 61.2/);
ok('dolar-gap: ' + sent[0].subject); sent.length = 0; delete override['/dolar-cripto/data.json'];
await runCron(env, new Date('2026-11-10T06:00:00Z')); sent.length = 0; // back to the real gap

// 4. BCV daily at 12:00 UTC, once a day
await signup({ email: 'bcv@x.co', topic: 'bcv-daily', lang: 'es' });
await runCron(env, new Date('2026-11-10T12:00:00Z'));
await runCron(env, new Date('2026-11-10T12:10:00Z'));
assert.equal(sent.length, 1); assert.match(sent[0].subject, /Tasa BCV/);
ok('bcv-daily: ' + sent[0].subject); sent.length = 0;

// 5. Weekly rates on Monday 13:00 UTC
await signup({ email: 'week@x.co', topic: 'rates-weekly', lang: 'es' });
await runCron(env, new Date('2026-11-16T13:00:00Z'));
assert.equal(sent.length, 1); assert.match(sent[0].html, /Tasa BCV/);
ok('rates-weekly: ' + sent[0].subject); sent.length = 0;

// 6. Guides PDF
await signup({ email: 'guias@x.co', topic: 'guias-pdf', lang: 'es' }); await settle();
const gm = sent.pop(); const gl = gm.html.match(/\/pdf\/guias\?t=[0-9a-f]+/)[0];
const gpdf = await PDFDocument.load(new Uint8Array(await (await get(gl)).arrayBuffer()));
assert.ok(gpdf.getPageCount() >= 5);
fs.writeFileSync(path.join(import.meta.dirname, 'sample-guias.pdf'), await gpdf.save());
ok(`guias-pdf: ${gpdf.getPageCount()} pages`);

// 7. New projects: first run records, a new project alerts.
await signup({ email: 'proj@x.co', topic: 'new-projects' });
await runCron(env, new Date('2026-11-10T06:10:00Z'));
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/site.json')));
site.pages.push({ slug: 'projects-new', kind: 'project', title: 'Test Rig — a new thing | Andrés Blitz', summary: 'New.', url: 'https://andresblitz.com/projects/new/' });
override['/api/site.json'] = JSON.stringify(site);
await runCron(env, new Date('2026-11-10T06:30:00Z'));
assert.equal(sent.length, 1); assert.equal(sent[0].subject, 'New project: Test Rig');
ok('new-projects: ' + sent[0].subject); sent.length = 0; delete override['/api/site.json'];

// 8 + 9. Feeds (trading notes, El 70)
await signup({ email: 'notes@x.co', topic: 'trading-notes' });
await signup({ email: 'ranch@x.co', topic: 'el70', lang: 'es' });
override['/notes/feed.xml'] = '<rss><channel><item><title>October notes</title><link>https://andresblitz.com/notes/2026-10/</link><guid>n1</guid><pubDate>Sat, 31 Oct 2026</pubDate></item></channel></rss>';
await runCron(env, new Date('2026-11-10T07:00:00Z'));
assert.equal(sent.length, 0, 'first read only records');
override['/notes/feed.xml'] = override['/notes/feed.xml'].replace('<channel>', '<channel><item><title>November notes</title><link>https://andresblitz.com/notes/2026-11/</link><guid>n2</guid><pubDate>Sun, 30 Nov 2026</pubDate></item>');
const f70 = fs.readFileSync(path.join(ROOT, '70/feed.xml'), 'utf8');
override['/70/feed.xml'] = f70.replace('<item>', '<item><title>Nuevo potrero</title><link>https://andresblitz.com/70/#potrero</link><guid>p1</guid><pubDate>Mon, 09 Nov 2026</pubDate></item><item>');
await runCron(env, new Date('2026-11-10T07:30:00Z'));
assert.deepEqual(sent.map((m) => m.subject).sort(), ['November notes', 'Nuevo potrero']);
ok('trading-notes + el70 feeds'); sent.length = 0;

// 10. Calculator result now, reminder after 30 days
const ct = await signup({ email: 'calc@x.co', topic: 'calc-result', lang: 'es', params: { calc: 'salario-en-dolares', summary: '1.500.000 COP <b>= 463 USD</b> https://evil.example' } });
await settle();
const cm = sent.pop(); assert.match(cm.html, /463 USD/); assert.doesNotMatch(cm.html, /evil|<b>=/);
sql.prepare('UPDATE subs SET due = 1 WHERE token = ?').run(ct);
await runCron(env, new Date('2026-12-10T08:00:00Z'));
assert.match(sent.pop().subject, /30 días/);
ok('calc-result: result now, reminder later, summary sanitized');

// Unsubscribe
const ut = sql.prepare("SELECT token FROM subs WHERE email = 'btc@x.co'").get().token;
assert.equal((await get('/unsubscribe?t=' + ut)).status, 303);
assert.equal(sql.prepare("SELECT COUNT(*) c FROM subs WHERE email = 'btc@x.co'").get().c, 0);
assert.ok(sent.length === 0);
ok('unsubscribe removes the row');

const st = await (await get('/status')).json();
assert.ok(st.counts['bcv-daily'] >= 1);
ok('status counts: ' + JSON.stringify(st.counts));
