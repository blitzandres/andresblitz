// Runs alerts.gs in Node against fake Google services (Sheet, Gmail, Cache…) and the
// repo's real data files. Run from the repo root: node google-sheets/test.mjs
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(import.meta.dirname, '..');
const sent = [];
let override = {};
let clock = null;

class Sheet {
  constructor() { this.rows = []; }
  appendRow(r) { this.rows.push(r.map(String)); }
  getDataRange() { return { getValues: () => this.rows.map((r) => r.slice()) }; }
  getRange(r, c) { return { setValue: (v) => { while (this.rows[r - 1].length < c) this.rows[r - 1].push(''); this.rows[r - 1][c - 1] = String(v); }, setNumberFormat() {} }; }
  deleteRow(n) { this.rows.splice(n - 1, 1); }
  deleteRows(s, n) { this.rows.splice(s - 1, n); }
  getLastRow() { return this.rows.length; }
  getMaxRows() { return 1000; }
  setFrozenRows() {}
}
const sheets = {};
const cache = new Map();
const ctx = {
  SpreadsheetApp: (() => { const book = { getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = new Sheet()) }; return { getActive: () => book, openById: () => book }; })(),
  GmailApp: { getAliases: () => ['info@andresblitz.com'], sendEmail: (to, subject, text, opts) => sent.push({ to, subject, text, ...opts }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    newBlob: (html) => ({ getAs: () => ({ html, setName(n) { this.name = n; return this; } }) }),
    formatDate: (d) => d.toISOString().slice(0, 10),
  },
  UrlFetchApp: {
    fetch: (u) => {
      const p = new URL(u).pathname;
      const f = path.join(ROOT, p);
      const body = override[p] ?? (fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : null);
      return { getResponseCode: () => (body == null ? 404 : 200), getContentText: () => body };
    },
  },
  ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }), getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }) },
  ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return JSON.parse(s); } }), MimeType: { JSON: 'json' } },
  HtmlService: { createHtmlOutput: (h) => ({ redirect: h.match(/url=([^"]+)"/)[1] }) },
  Logger: { log() {} },
  console,
};
ctx.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [clock ?? Date.now()])); } static now() { return clock ?? Date.now(); } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(import.meta.dirname, 'alerts.gs'), 'utf8'), ctx);
const at = (iso) => { clock = new Date(iso).getTime(); };

at('2026-11-10T03:00:00Z');
ctx.setup();
assert.deepEqual(Object.keys(sheets).sort(), ['log', 'pdfs', 'state', 'subs']);
const post = (b) => ctx.doPost({ postData: { contents: JSON.stringify(b) } });
const tok = () => sent.pop().text.match(/a=confirm&t=(t[0-9a-f]+)/)[1];
const signup = (b) => { cache.clear(); const r = post(b); assert.equal(r.ok, true, JSON.stringify(r)); const t = tok(); assert.match(ctx.doGet({ parameter: { a: 'confirm', t } }).redirect, /alerts\/\?ok=/); return t; };
const only = (to) => sent.filter((m) => m.to === to);
let n = 0; const ok = (s) => console.log(`ok ${++n} - ${s}`);

assert.equal(post({ email: 'bad', topic: 'bcv-daily' }).error, 'email');
assert.equal(post({ email: 'a@b.co', topic: 'x' }).error, 'topic');
assert.equal(post({ email: 'a@b.co', topic: 'bcv-daily', hp: 'x' }).ok, true); assert.equal(sent.length, 0);
for (let i = 0; i < 3; i++) post({ email: 'spam@b.co', topic: 'btc-bracket', params: { width: 5000 } });
assert.equal(post({ email: 'spam@b.co', topic: 'btc-bracket', params: { width: 5000 } }).error, 'rate');
sent.length = 0;
ok('validation, honeypot, per-email rate limit');

signup({ email: 'btc@x.co', topic: 'btc-bracket', params: { width: 10000 } });
ctx.cron();
const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'bitcoin/history.json'))); h.closes.push(['2099-01-01', h.closes.at(-1)[1] + 25000]);
override['/bitcoin/history.json'] = JSON.stringify(h); ctx.cron();
assert.equal(only('btc@x.co').length, 1); assert.equal(sent[0].from, 'info@andresblitz.com');
ok('btc-bracket: ' + sent[0].subject + ' (from ' + sent[0].from + ')');
ctx.cron(); assert.equal(only('btc@x.co').length, 1, 'no repeat');
delete override['/bitcoin/history.json']; ctx.cron(); sent.length = 0;

signup({ email: 'bio@x.co', topic: 'bio-pdf' });
const bio = sent.pop(); assert.match(bio.attachments[0].name, /^andres-blitz-bio-c[0-9a-f]+\.pdf$/); assert.match(bio.attachments[0].html, /ab-copy:c[0-9a-f]+/);
assert.equal(sheets.pdfs.rows.length, 2); assert.equal(sheets.pdfs.rows[1][2], 'bio@x.co');
ok('bio-pdf: attached ' + bio.attachments[0].name + ', logged in pdfs tab');

signup({ email: 'gap@x.co', topic: 'dolar-gap', lang: 'es', params: { country: 'VE', threshold: 50 } });
ctx.cron();
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'dolar-cripto/data.json'))); d.countries.VE.gap = 61.2;
override['/dolar-cripto/data.json'] = JSON.stringify(d); ctx.cron();
assert.equal(only('gap@x.co').length, 1); ok('dolar-gap: ' + only('gap@x.co')[0].subject);
delete override['/dolar-cripto/data.json']; ctx.cron(); sent.length = 0;

signup({ email: 'bcv@x.co', topic: 'bcv-daily', lang: 'es' });
at('2026-11-10T11:30:00Z'); ctx.cron(); assert.equal(only('bcv@x.co').length, 0, 'not before 12 UTC');
at('2026-11-10T12:05:00Z'); ctx.cron(); at('2026-11-10T15:00:00Z'); ctx.cron();
assert.equal(only('bcv@x.co').length, 1); ok('bcv-daily once a day: ' + only('bcv@x.co')[0].subject); sent.length = 0;

signup({ email: 'week@x.co', topic: 'rates-weekly', lang: 'es' });
at('2026-11-16T13:10:00Z'); ctx.cron(); ctx.cron();
assert.equal(only('week@x.co').length, 1); assert.match(only('week@x.co')[0].htmlBody, /Tasa BCV/);
ok('rates-weekly Monday: ' + only('week@x.co')[0].subject); sent.length = 0;

signup({ email: 'guias@x.co', topic: 'guias-pdf', lang: 'es' });
const g = sent.pop(); assert.equal((g.attachments[0].html.match(/class="page"/g) || []).length, 5);
ok('guias-pdf: 5 guides in one attached PDF');

signup({ email: 'proj@x.co', topic: 'new-projects' });
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/site.json')));
site.pages.push({ slug: 'projects-new', kind: 'project', title: 'Test Rig — a thing | Andrés Blitz', summary: 'New.', url: 'https://andresblitz.com/projects/new/' });
override['/api/site.json'] = JSON.stringify(site); ctx.cron();
assert.equal(only('proj@x.co')[0].subject, 'New project: Test Rig'); ok('new-projects'); delete override['/api/site.json']; sent.length = 0;

signup({ email: 'notes@x.co', topic: 'trading-notes' });
signup({ email: 'ranch@x.co', topic: 'el70', lang: 'es' });
override['/notes/feed.xml'] = '<rss><item><title>October notes</title><link>https://andresblitz.com/notes/1/</link><guid>n1</guid></item></rss>'; ctx.cron();
override['/notes/feed.xml'] = '<rss><item><title>November notes</title><link>https://andresblitz.com/notes/2/</link><guid>n2</guid></item>' + override['/notes/feed.xml'].slice(5);
override['/70/feed.xml'] = fs.readFileSync(path.join(ROOT, '70/feed.xml'), 'utf8').replace('<item>', '<item><title>Nuevo potrero</title><link>https://andresblitz.com/70/</link><guid>p1</guid></item><item>');
ctx.cron();
assert.deepEqual(sent.map((m) => m.subject).sort(), ['November notes', 'Nuevo potrero']); ok('trading-notes + el70 feeds'); sent.length = 0;

assert.equal(post({ email: 'c@x.co', topic: 'calc-result', params: { calc: 'salario-en-dolares', summary: 'En dólares — escribe tu salario' } }).error, 'params');
const ct = signup({ email: 'calc@x.co', topic: 'calc-result', lang: 'es', params: { calc: 'salario-en-dolares', summary: '1.500.000 COP <b>= 463 USD</b> https://evil.example' } });
const cr = sent.pop(); assert.match(cr.htmlBody, /463 USD/); assert.doesNotMatch(cr.htmlBody, /evil|<b>=/);
at('2026-12-20T09:00:00Z'); ctx.cron(); assert.match(sent.pop().subject, /30 días/);
assert.equal(ctx.subs_().filter((r) => r.token === ct).length, 0);
ok('calc-result: result now, 30-day reminder, empty calculator rejected, summary cleaned');

const ut = ctx.subs_().find((r) => r.email === 'btc@x.co').token;
assert.match(ctx.doGet({ parameter: { a: 'unsub', t: ut } }).redirect, /bye=1/);
assert.equal(ctx.subs_().filter((r) => r.email === 'btc@x.co').length, 0);
ok('unsubscribe');
ok('status: ' + JSON.stringify(ctx.doGet({ parameter: { a: 'status' } }).counts));
