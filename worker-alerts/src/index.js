// andresblitz-alerts: email sign-ups, alerts and tagged PDFs for andresblitz.com.
// Separate from andresblitz-ai-api (read-only, used by agents), which stays untouched.
//
//   POST /subscribe            { email, topic, params, hp }   -> sends a confirmation email
//   GET  /confirm?t=TOKEN       confirms one subscription      -> redirects to /alerts/
//   GET  /unsubscribe?t=TOKEN   removes one subscription (all=1 removes every one for that email)
//   GET  /pdf/:doc?t=TAG        builds the tagged PDF for that subscriber
//   GET  /status                public counts per topic, for the /alerts/ page
//   cron (every 30 min)         reads the JSON the site already bakes and sends alerts
import { TOPICS, validParams, bracketOf, fmtUsd, gapCrossed } from './topics.js';
import { buildPdf } from './pdf.js';

const MAX_PER_HOUR = 6;
const EMAIL_RE = /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/;

export default {
  async fetch(req, env, ctx) {
    try { return await route(req, env, ctx); }
    catch (e) { console.error('alerts error', String(e && e.stack || e)); return json(env, req, { error: 'internal error' }, 500); }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCron(env, new Date(event.scheduledTime)));
  },
};

/* ---------- HTTP ---------- */

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}
function json(env, req, obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(env, req) } });
}
const redirect = (to) => new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store' } });

async function route(req, env, ctx) {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors(env, req), 'Access-Control-Max-Age': '86400' } });
  if (url.pathname === '/subscribe' && req.method === 'POST') return subscribe(req, env, ctx);
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(env, req, { error: 'method not allowed' }, 405);
  if (url.pathname === '/confirm') return confirm(url, env);
  if (url.pathname === '/unsubscribe') return unsubscribe(url, env);
  if (url.pathname.startsWith('/pdf/')) return pdf(url, env);
  if (url.pathname === '/status') return status(req, env);
  if (url.pathname === '/') return json(env, req, { name: 'andresblitz.com alerts', topics: Object.keys(TOPICS) });
  return json(env, req, { error: 'not found' }, 404);
}

async function subscribe(req, env, ctx) {
  let body;
  try { body = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  if (body.hp) return json(env, req, { ok: true }); // honeypot: bots fill hidden field
  const email = String(body.email || '').trim().toLowerCase();
  const topic = String(body.topic || '');
  if (!EMAIL_RE.test(email)) return json(env, req, { error: 'email' }, 400);
  if (!TOPICS[topic]) return json(env, req, { error: 'topic' }, 400);
  const params = validParams(topic, body.params || {});
  if (!params) return json(env, req, { error: 'params' }, 400);
  const lang = body.lang === 'es' ? 'es' : 'en';

  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const hour = Math.floor(Date.now() / 3600e3);
  const hits = await env.DB.prepare('INSERT INTO hits (ip, hour, n) VALUES (?1, ?2, 1) ON CONFLICT(ip, hour) DO UPDATE SET n = n + 1 RETURNING n').bind(ip, hour).first('n');
  if (hits > MAX_PER_HOUR) return json(env, req, { error: 'rate' }, 429);

  const key = TOPICS[topic].unique ? topic : topic + ':' + JSON.stringify(params);
  const existing = await env.DB.prepare('SELECT token, confirmed FROM subs WHERE email = ?1 AND sub_key = ?2').bind(email, key).first();
  const token = existing ? existing.token : rand(16);
  if (!existing) {
    await env.DB.prepare('INSERT INTO subs (token, email, topic, sub_key, params, lang, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
      .bind(token, email, topic, key, JSON.stringify(params), lang, Date.now()).run();
  }
  if (!existing || !existing.confirmed) ctx.waitUntil(sendConfirm(env, { email, topic, token, lang, params }));
  return json(env, req, { ok: true, pending: !(existing && existing.confirmed) });
}

async function confirm(url, env) {
  const t = url.searchParams.get('t') || '';
  const row = await env.DB.prepare('SELECT * FROM subs WHERE token = ?1').bind(t).first();
  if (!row) return redirect(env.SITE + '/alerts/?e=link');
  if (!row.confirmed) {
    await env.DB.prepare('UPDATE subs SET confirmed = ?1 WHERE token = ?2').bind(Date.now(), t).run();
    await onConfirmed(env, row);
  }
  return redirect(env.SITE + '/alerts/?ok=' + encodeURIComponent(row.topic));
}

async function unsubscribe(url, env) {
  const t = url.searchParams.get('t') || '';
  const row = await env.DB.prepare('SELECT email FROM subs WHERE token = ?1').bind(t).first();
  if (row) {
    if (url.searchParams.get('all') === '1') await env.DB.prepare('DELETE FROM subs WHERE email = ?1').bind(row.email).run();
    else await env.DB.prepare('DELETE FROM subs WHERE token = ?1').bind(t).run();
  }
  return redirect(env.SITE + '/alerts/?bye=1');
}

async function pdf(url, env) {
  const doc = url.pathname.slice(5);
  const tag = url.searchParams.get('t') || '';
  const row = await env.DB.prepare('SELECT * FROM pdf_tags WHERE tag = ?1 AND doc = ?2').bind(tag, doc).first();
  if (!row) return new Response('Link not valid. Request a new copy at ' + env.SITE + '/alerts/', { status: 404 });
  await env.DB.prepare('UPDATE pdf_tags SET downloads = downloads + 1, last_download = ?1 WHERE tag = ?2').bind(Date.now(), tag).run();
  const bytes = await buildPdf(env, doc, tag);
  const name = doc === 'bio' ? 'andres-blitz-bio.pdf' : 'guias-cripto-andresblitz.pdf';
  return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store' } });
}

async function status(req, env) {
  const { results } = await env.DB.prepare('SELECT topic, COUNT(*) AS n FROM subs WHERE confirmed IS NOT NULL GROUP BY topic').all();
  const counts = {};
  for (const r of results) counts[r.topic] = r.n;
  return new Response(JSON.stringify({ counts }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...cors(env, req) } });
}

/* ---------- things that happen right after confirming ---------- */

async function onConfirmed(env, row) {
  const params = JSON.parse(row.params || '{}');
  if (row.topic === 'bio-pdf' || row.topic === 'guias-pdf') {
    const doc = row.topic === 'bio-pdf' ? 'bio' : 'guias';
    const tag = rand(8);
    await env.DB.prepare('INSERT INTO pdf_tags (tag, doc, email, created, downloads) VALUES (?1, ?2, ?3, ?4, 0)').bind(tag, doc, row.email, Date.now()).run();
    await send(env, row, TOPICS[row.topic].copy[row.lang].ready, pdfMail(env, row, doc, tag));
    // One-off: the subscription is done once the PDF is sent; the tag row keeps the record.
    await env.DB.prepare('DELETE FROM subs WHERE token = ?1').bind(row.token).run();
  }
  if (row.topic === 'calc-result') {
    await send(env, row, TOPICS[row.topic].copy[row.lang].ready, calcMail(env, row, params, false));
    await env.DB.prepare('UPDATE subs SET due = ?1 WHERE token = ?2').bind(Date.now() + 30 * 864e5, row.token).run();
  }
}

/* ---------- cron ---------- */

async function getJson(env, path) {
  const r = await fetch(env.SITE + path, { cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return r.json();
}
async function getText(env, path) {
  const r = await fetch(env.SITE + path, { cf: { cacheTtl: 300 } });
  return r.ok ? r.text() : null;
}
async function stateGet(env, k) { return env.DB.prepare('SELECT v FROM state WHERE k = ?1').bind(k).first('v'); }
async function stateSet(env, k, v) { await env.DB.prepare('INSERT INTO state (k, v) VALUES (?1, ?2) ON CONFLICT(k) DO UPDATE SET v = ?2').bind(k, v).run(); }
async function subsFor(env, topic) {
  const { results } = await env.DB.prepare('SELECT * FROM subs WHERE topic = ?1 AND confirmed IS NOT NULL').bind(topic).all();
  return results;
}

export async function runCron(env, now) {
  const jobs = [btcBrackets, dollarGap, newProjects, feedWatch('el70', '/70/feed.xml'), feedWatch('trading-notes', '/notes/feed.xml'), calcReminders];
  const h = now.getUTCHours(), m = now.getUTCMinutes();
  if (h === 12 && m < 30) jobs.push(bcvDaily);                       // ~8:00 Caracas
  if (now.getUTCDay() === 1 && h === 13 && m < 30) jobs.push(weeklyRates); // Monday
  for (const job of jobs) {
    try { await job(env, now); } catch (e) { console.error('cron job failed', job.name, String(e && e.message || e)); }
  }
  await env.DB.prepare('DELETE FROM hits WHERE hour < ?1').bind(Math.floor(Date.now() / 3600e3) - 24).run();
}

async function btcBrackets(env) {
  const subs = await subsFor(env, 'btc-bracket');
  if (!subs.length) return;
  const h = await getJson(env, '/bitcoin/history.json');
  const [day, close] = h.closes[h.closes.length - 1];
  for (const s of subs) {
    const p = JSON.parse(s.params);
    const b = bracketOf(close, p.width);
    const prev = s.last_state ? JSON.parse(s.last_state) : null;
    if (prev && prev.b !== b && prev.day !== day) {
      const up = b > prev.b;
      const subj = `Bitcoin closed ${up ? 'above' : 'below'} ${fmtUsd(up ? b * p.width : (b + 1) * p.width)}`;
      await send(env, s, subj, mail(env, s, {
        title: subj,
        lead: `BTC closed at <b>${fmtUsd(close)}</b> on ${day} (UTC), in the <b>${fmtUsd(b * p.width)} – ${fmtUsd((b + 1) * p.width)}</b> bracket. Before it was in ${fmtUsd(prev.b * p.width)} – ${fmtUsd((prev.b + 1) * p.width)}.`,
        cta: ['See the bracket chart', env.SITE + '/bitcoin/'],
      }));
    }
    if (!prev || prev.b !== b) await env.DB.prepare('UPDATE subs SET last_state = ?1 WHERE token = ?2').bind(JSON.stringify({ b, day }), s.token).run();
  }
}

async function dollarGap(env) {
  const subs = await subsFor(env, 'dolar-gap');
  if (!subs.length) return;
  const d = await getJson(env, '/dolar-cripto/data.json');
  for (const s of subs) {
    const p = JSON.parse(s.params);
    const c = d.countries[p.country];
    if (!c || typeof c.gap !== 'number') continue;
    const above = c.gap >= p.threshold;
    const prev = s.last_state ? JSON.parse(s.last_state) : null;
    if (gapCrossed(prev, above)) {
      const subj = above ? `Brecha ${c.name}: ${c.gap.toFixed(1)} % (pasó tu nivel de ${p.threshold} %)` : `Brecha ${c.name}: ${c.gap.toFixed(1)} % (bajó de ${p.threshold} %)`;
      await send(env, s, subj, mail(env, s, {
        title: subj,
        lead: `${c.officialLabel || 'Oficial'}: <b>${c.official.value.toLocaleString('es')}</b> ${c.fiat} · USDT P2P: <b>${c.usdt.value.toLocaleString('es')}</b> ${c.fiat}. Brecha: <b>${c.gap.toFixed(2)} %</b>.`,
        cta: ['Ver el dólar cripto', env.SITE + '/dolar-cripto/'],
      }));
    }
    if (!prev || prev.above !== above) await env.DB.prepare('UPDATE subs SET last_state = ?1 WHERE token = ?2').bind(JSON.stringify({ above }), s.token).run();
  }
}

async function bcvDaily(env, now) {
  const subs = await subsFor(env, 'bcv-daily');
  if (!subs.length) return;
  const day = now.toISOString().slice(0, 10);
  const r = await getJson(env, '/rates/index.json');
  const bcv = r.series['tasa-bcv'], usdt = r.series['usdt-ve'];
  if (!bcv) return;
  const fecha = new Date(bcv.time).toLocaleDateString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'long' });
  for (const s of subs) {
    if (s.last_sent === day) continue;
    await send(env, s, `Tasa BCV: ${bcv.value.toLocaleString('es-VE', { maximumFractionDigits: 4 })} Bs/USD`, mail(env, s, {
      title: `Tasa BCV hoy: ${bcv.value.toLocaleString('es-VE', { maximumFractionDigits: 4 })} Bs. por dólar`,
      lead: `Tasa oficial vigente: ${fecha}.${usdt ? ` USDT P2P: <b>${usdt.value.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</b> Bs.` : ''}`,
      cta: ['Ver la Tasa BCV', env.SITE + '/tasa-bcv/'],
    }));
    await env.DB.prepare('UPDATE subs SET last_sent = ?1 WHERE token = ?2').bind(day, s.token).run();
  }
}

async function weeklyRates(env, now) {
  const subs = await subsFor(env, 'rates-weekly');
  if (!subs.length) return;
  const day = now.toISOString().slice(0, 10);
  const r = await getJson(env, '/rates/index.json');
  const keys = ['tasa-bcv', 'usdt-ve', 'dolar-argentina', 'dolar-argentina-blue', 'usdt-ar', 'dolar-colombia', 'usdt-co', 'dolar-mexico', 'dolar-peru', 'dolar-chile'];
  const last = JSON.parse((await stateGet(env, 'weekly-values')) || '{}');
  const rows = keys.filter((k) => r.series[k]).map((k) => {
    const v = r.series[k].value, was = last[k];
    const ch = was ? ((v - was) / was) * 100 : null;
    return `<tr><td style="padding:6px 12px 6px 0">${esc(r.series[k].title)}</td><td style="padding:6px 0;text-align:right;font-variant-numeric:tabular-nums"><b>${v.toLocaleString('es')}</b></td><td style="padding:6px 0 6px 12px;text-align:right;color:${ch == null ? '#97a3b8' : ch >= 0 ? '#f87171' : '#34d399'}">${ch == null ? '' : (ch >= 0 ? '+' : '') + ch.toFixed(2) + ' %'}</td></tr>`;
  }).join('');
  for (const s of subs) {
    if (s.last_sent === day) continue;
    await send(env, s, 'Resumen semanal del dólar en Latinoamérica', mail(env, s, {
      title: 'El dólar esta semana',
      lead: 'Moneda local por 1 USD. El cambio es contra el lunes pasado.',
      html: `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`,
      cta: ['Ver todos los países', env.SITE + '/site-map/'],
    }));
    await env.DB.prepare('UPDATE subs SET last_sent = ?1 WHERE token = ?2').bind(day, s.token).run();
  }
  await stateSet(env, 'weekly-values', JSON.stringify(Object.fromEntries(keys.filter((k) => r.series[k]).map((k) => [k, r.series[k].value]))));
}

async function newProjects(env) {
  const site = await getJson(env, '/api/site.json');
  const projects = site.pages.filter((p) => p.kind === 'project');
  const seenRaw = await stateGet(env, 'projects-seen');
  const seen = new Set(seenRaw ? JSON.parse(seenRaw) : []);
  const fresh = seenRaw ? projects.filter((p) => !seen.has(p.slug)) : []; // first run only records
  await stateSet(env, 'projects-seen', JSON.stringify(projects.map((p) => p.slug)));
  if (!fresh.length) return;
  for (const s of await subsFor(env, 'new-projects')) {
    for (const p of fresh) {
      const name = p.title.replace(/\s*\|\s*Andr[ée]s Blitz.*$/, '');
      await send(env, s, 'New project: ' + name.split(' — ')[0], mail(env, s, { title: name, lead: esc(p.summary), cta: ['Open the project', p.url] }));
    }
  }
}

function feedWatch(topic, path) {
  const fn = async (env) => {
    const xml = await getText(env, path);
    if (!xml) return;
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
      guid: (m[1].match(/<guid[^>]*>([^<]*)/) || m[1].match(/<link>([^<]*)/) || [])[1],
      title: (m[1].match(/<title>([^<]*)/) || [])[1] || '',
      link: (m[1].match(/<link>([^<]*)/) || [])[1] || env.SITE,
      desc: (m[1].match(/<description>([^<]*)/) || [])[1] || '',
      date: (m[1].match(/<pubDate>([^<]*)/) || [])[1] || '',
    })).filter((i) => i.guid);
    const k = 'feed:' + path;
    const seenRaw = await stateGet(env, k);
    const seen = new Set(seenRaw ? JSON.parse(seenRaw) : []);
    const fresh = seenRaw ? items.filter((i) => !seen.has(i.guid + '|' + i.date)) : [];
    await stateSet(env, k, JSON.stringify(items.map((i) => i.guid + '|' + i.date)));
    if (!fresh.length) return;
    for (const s of await subsFor(env, topic)) {
      for (const i of fresh.slice(0, 3)) await send(env, s, i.title, mail(env, s, { title: i.title, lead: i.desc, cta: [s.lang === 'es' ? 'Leer' : 'Read', i.link] }));
    }
  };
  Object.defineProperty(fn, 'name', { value: 'feed:' + topic });
  return fn;
}

async function calcReminders(env) {
  const { results } = await env.DB.prepare("SELECT * FROM subs WHERE topic = 'calc-result' AND confirmed IS NOT NULL AND due IS NOT NULL AND due <= ?1").bind(Date.now()).all();
  for (const s of results) {
    await send(env, s, s.lang === 'es' ? 'Han pasado 30 días: revisa tu cálculo' : '30 days later: check your numbers again', calcMail(env, s, JSON.parse(s.params), true));
    await env.DB.prepare('DELETE FROM subs WHERE token = ?1').bind(s.token).run();
  }
}

/* ---------- email ---------- */

async function send(env, sub, subject, html) {
  const unsub = `${env.WORKER_URL}/unsubscribe?t=${sub.token}`;
  await env.EMAIL.send({
    to: sub.email,
    from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
    subject,
    html,
    text: html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2: $1').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim(),
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  });
}

async function sendConfirm(env, { email, topic, token, lang }) {
  const c = TOPICS[topic].copy[lang];
  const link = `${env.WORKER_URL}/confirm?t=${token}`;
  const sub = { email, token, lang };
  await send(env, sub, c.confirmSubject, mail(env, sub, {
    title: c.confirmSubject,
    lead: c.confirmLead,
    cta: [lang === 'es' ? 'Confirmar' : 'Confirm', link],
    foot: lang === 'es' ? 'Si no fuiste tú, ignora este correo y no recibirás nada más.' : "If this wasn't you, ignore this email and you won't hear from us.",
  }));
}

function pdfMail(env, row, doc, tag) {
  const es = row.lang === 'es';
  return mail(env, row, {
    title: TOPICS[row.topic].copy[row.lang].ready,
    lead: es ? 'Tu copia es personal y lleva un código único. Por favor no la reenvíes; comparte el enlace a la página.' : 'Your copy is personal and carries a unique code. Please share the page link rather than the file.',
    cta: [es ? 'Descargar PDF' : 'Download PDF', `${env.WORKER_URL}/pdf/${doc}?t=${tag}`],
    noUnsub: true,
  });
}

function calcMail(env, row, p, reminder) {
  const es = row.lang === 'es';
  return mail(env, row, {
    title: reminder ? (es ? 'Tu cálculo de hace 30 días' : 'Your calculation from 30 days ago') : (es ? 'Tu resultado' : 'Your result'),
    lead: `<b>${esc(p.calcName)}</b><br>${esc(p.summary)}` + (reminder ? (es ? '<br><br>Las tasas cambiaron. Vuelve a calcular con los números de hoy.' : '<br><br>Rates have moved. Run it again with today\'s numbers.') : ''),
    cta: [es ? 'Abrir la calculadora' : 'Open the calculator', env.SITE + p.path],
  });
}

function mail(env, sub, { title, lead, html = '', cta, foot = '', noUnsub = false }) {
  const es = sub.lang === 'es';
  const unsub = `${env.WORKER_URL}/unsubscribe?t=${sub.token}`;
  return `<!doctype html><html><body style="margin:0;background:#05070f;font-family:Helvetica,Arial,sans-serif;color:#e7ecf5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070f"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b101d;border:1px solid #1c2333;border-radius:14px">
<tr><td style="height:4px;background:linear-gradient(120deg,#5b8def,#a78bfa);border-radius:14px 14px 0 0"></td></tr>
<tr><td style="padding:28px 28px 8px;font-size:13px;color:#97a3b8;letter-spacing:.06em;text-transform:uppercase">andresblitz.com</td></tr>
<tr><td style="padding:0 28px;font-size:22px;font-weight:700;line-height:1.25">${title}</td></tr>
<tr><td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#c9d2e3">${lead}</td></tr>
${html ? `<tr><td style="padding:16px 28px 0">${html}</td></tr>` : ''}
${cta ? `<tr><td style="padding:24px 28px 8px"><a href="${cta[1]}" style="display:inline-block;background:#5b8def;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:9px">${cta[0]} →</a></td></tr>` : ''}
<tr><td style="padding:20px 28px 28px;font-size:12px;line-height:1.6;color:#97a3b8">${foot ? foot + '<br>' : ''}${noUnsub ? '' : `<a href="${unsub}" style="color:#97a3b8">${es ? 'Darme de baja' : 'Unsubscribe'}</a> · <a href="${unsub}&all=1" style="color:#97a3b8">${es ? 'Darme de baja de todo' : 'Unsubscribe from everything'}</a>`}</td></tr>
</table></td></tr></table></body></html>`;
}

/* ---------- utils ---------- */

function rand(bytes) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
