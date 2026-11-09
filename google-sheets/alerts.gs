/**
 * andresblitz.com alerts: the whole "brain" in one Google Apps Script file.
 *
 * Lives in a Google Sheet (Extensions → Apps Script). The Sheet is the database:
 *   subs   one row per sign-up        pdfs   every tagged PDF sent
 *   state  what the cron already saw  log    errors and sends
 *
 * - doPost   receives sign-ups from the site cards (assets/alerts.js)
 * - doGet    confirm / unsubscribe links in emails, and ?a=status for the /alerts/ page
 * - cron     runs every 30 minutes from a time trigger; reads the JSON the site already
 *            publishes and emails people only when something changed
 * - setup    run once by hand: creates the tabs and the 30-minute trigger
 *
 * Email goes out through the Gmail account that owns this script, as FROM_EMAIL
 * (set up as a "Send mail as" alias, see google-sheets/README.md).
 */

var CONFIG = {
  SITE: 'https://andresblitz.com',
  FROM_EMAIL: 'info@andresblitz.com', // must be a verified "Send mail as" alias of this Gmail account
  FROM_NAME: 'Andrés Blitz',
  REPLY_TO: 'info@andresblitz.com',
  MAX_PER_EMAIL_PER_HOUR: 3,
  MAX_SIGNUPS_PER_HOUR: 60,
};

var SUBS_COLS = ['token', 'email', 'topic', 'sub_key', 'params', 'lang', 'created', 'confirmed', 'last_state', 'last_sent', 'due'];

/* ================= topics ================= */

function C_(enSubj, enLead, esSubj, esLead, enReady, esReady) {
  return { en: { confirmSubject: enSubj, confirmLead: enLead, ready: enReady || '' }, es: { confirmSubject: esSubj, confirmLead: esLead, ready: esReady || '' } };
}
var TOPICS = {
  'btc-bracket': { copy: C_('Confirm your Bitcoin bracket alert', 'Confirm and we will email you when Bitcoin closes a day in a new price bracket.', 'Confirma tu alerta de Bitcoin', 'Confirma y te avisamos cuando Bitcoin cierre el día en un nuevo rango de precio.') },
  'bio-pdf': { unique: true, copy: C_('Confirm to get the PDF bio', 'Confirm and your personal copy of the Andrés Blitz bio is on its way.', 'Confirma para recibir la biografía en PDF', 'Confirma y te enviamos tu copia personal de la biografía.', 'Your PDF bio', 'Tu biografía en PDF') },
  'dolar-gap': { copy: C_('Confirm your dollar gap alert', 'Confirm and we will email you when the crypto dollar gap crosses your level.', 'Confirma tu alerta de brecha', 'Confirma y te avisamos cuando la brecha del dólar cripto cruce tu nivel.') },
  'bcv-daily': { unique: true, copy: C_('Confirm the daily BCV rate', 'Confirm to get the Tasa BCV every morning.', 'Confirma la Tasa BCV diaria', 'Confirma y recibe la Tasa BCV cada mañana, alrededor de las 8:00 (hora de Caracas).') },
  'rates-weekly': { unique: true, copy: C_('Confirm the weekly LatAm rates', 'Confirm to get dollar rates for 7 countries every Monday.', 'Confirma el resumen semanal', 'Confirma y recibe cada lunes el dólar en 7 países, con el cambio de la semana.') },
  'guias-pdf': { unique: true, copy: C_('Confirm to get the crypto guides PDF', 'Confirm and the 5 crypto guides arrive as one PDF.', 'Confirma para recibir las guías en PDF', 'Confirma y te enviamos las 5 guías cripto en un solo PDF.', 'Your crypto guides PDF', 'Tus guías cripto en PDF') },
  'new-projects': { unique: true, copy: C_('Confirm new project alerts', 'Confirm to hear when a new project or demo goes live.', 'Confirma avisos de proyectos nuevos', 'Confirma y te avisamos cuando haya un proyecto nuevo.') },
  'trading-notes': { unique: true, copy: C_('Confirm trading notes', 'Confirm to get the monthly trading notes when they publish.', 'Confirma las notas de trading', 'Confirma y recibe las notas de trading mensuales.') },
  'el70': { unique: true, copy: C_('Confirm El 70 updates', 'Confirm to get news from El 70, the family ranch in Zulia.', 'Confirma las noticias de El 70', 'Confirma y recibe las novedades de la finca El 70.') },
  'calc-result': { copy: C_('Confirm to get your result', 'Confirm and we will email your result, plus a reminder in 30 days.', 'Confirma para recibir tu resultado', 'Confirma y te enviamos tu resultado, más un recordatorio en 30 días.', 'Your result', 'Tu resultado') },
};
var CALCS = { 'enviar-dinero': 'Costo de enviar dinero', 'salario-en-dolares': 'Salario en dólares', 'convertidor-cripto': 'Convertidor cripto', 'comision-cripto': 'Comisión cripto', 'ahorro-en-dolares': 'Ahorro en dólares' };
var GUIDES = ['que-es-usdt', 'como-funciona-p2p', 'redes-y-comisiones', 'brecha-dolar-cripto', 'estafas-comunes'];

function validParams_(topic, p) {
  p = p || {};
  if (topic === 'btc-bracket') { var w = Number(p.width); return [3000, 5000, 10000, 15000].indexOf(w) >= 0 ? { width: w } : null; }
  if (topic === 'dolar-gap') {
    var t = Number(p.threshold);
    if (['VE', 'AR', 'CO'].indexOf(p.country) < 0 || !(t >= 1 && t <= 200)) return null;
    return { country: p.country, threshold: Math.round(t * 10) / 10 };
  }
  if (topic === 'calc-result') {
    if (!CALCS[p.calc]) return null;
    var s = String(p.summary || '').replace(/[<>]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 280);
    if (!s || /escribe tu/i.test(s)) return null;
    return { calc: p.calc, calcName: CALCS[p.calc], path: '/' + p.calc + '/', summary: s };
  }
  return {};
}

/* ================= web app ================= */

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return json_(subscribe_(body));
  } catch (err) { log_('doPost', String(err)); return json_({ error: 'internal' }); }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.a === 'confirm') return confirm_(p.t);
    if (p.a === 'unsub') return unsubscribe_(p.t, p.all === '1');
    if (p.a === 'status') return json_(status_());
  } catch (err) { log_('doGet', String(err)); }
  return redirect_(CONFIG.SITE + '/alerts/');
}

function subscribe_(b) {
  if (b.hp) return { ok: true };                                   // honeypot
  var email = String(b.email || '').trim().toLowerCase();
  var topic = String(b.topic || '');
  if (!/^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/.test(email)) return { error: 'email' };
  if (!TOPICS[topic]) return { error: 'topic' };
  var params = validParams_(topic, b.params);
  if (!params) return { error: 'params' };
  var lang = b.lang === 'es' ? 'es' : 'en';

  var cache = CacheService.getScriptCache();
  if (bump_(cache, 'e:' + email) > CONFIG.MAX_PER_EMAIL_PER_HOUR || bump_(cache, 'all') > CONFIG.MAX_SIGNUPS_PER_HOUR) return { error: 'rate' };

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var key = TOPICS[topic].unique ? topic : topic + ':' + JSON.stringify(params);
    var rows = subs_();
    var found = rows.filter(function (r) { return r.email === email && r.sub_key === key; })[0];
    if (found && found.confirmed) return { ok: true, pending: false };
    var sub = found || { token: 't' + Utilities.getUuid().replace(/-/g, ''), email: email, topic: topic, sub_key: key, params: JSON.stringify(params), lang: lang, created: new Date().toISOString() };
    if (!found) sheet_('subs').appendRow(SUBS_COLS.map(function (c) { return sub[c] == null ? '' : sub[c]; }));
    var c = TOPICS[topic].copy[lang];
    send_(sub, c.confirmSubject, mail_(sub, {
      title: c.confirmSubject, lead: c.confirmLead,
      cta: [lang === 'es' ? 'Confirmar' : 'Confirm', webUrl_() + '?a=confirm&t=' + sub.token],
      foot: lang === 'es' ? 'Si no fuiste tú, ignora este correo y no recibirás nada más.' : "If this wasn't you, ignore this email and you won't hear from us.",
      noUnsub: true,
    }));
    return { ok: true, pending: true };
  } finally { lock.releaseLock(); }
}

function confirm_(token) {
  var row = subs_().filter(function (r) { return r.token === token; })[0];
  if (!row) return redirect_(CONFIG.SITE + '/alerts/?e=link');
  if (!row.confirmed) {
    update_(row, { confirmed: new Date().toISOString() });
    afterConfirm_(row);
  }
  return redirect_(CONFIG.SITE + '/alerts/?ok=' + encodeURIComponent(row.topic));
}

function unsubscribe_(token, all) {
  var rows = subs_();
  var row = rows.filter(function (r) { return r.token === token; })[0];
  if (row) {
    var gone = rows.filter(function (r) { return all ? r.email === row.email : r.token === token; });
    deleteRows_(gone);
  }
  return redirect_(CONFIG.SITE + '/alerts/?bye=1');
}

function status_() {
  var counts = {};
  subs_().forEach(function (r) { if (r.confirmed) counts[r.topic] = (counts[r.topic] || 0) + 1; });
  return { counts: counts };
}

function afterConfirm_(row) {
  var params = JSON.parse(row.params || '{}');
  if (row.topic === 'bio-pdf' || row.topic === 'guias-pdf') {
    var doc = row.topic === 'bio-pdf' ? 'bio' : 'guias';
    var tag = 'c' + Utilities.getUuid().replace(/-/g, '').slice(0, 11);
    sheet_('pdfs').appendRow([tag, doc, row.email, new Date().toISOString()]);
    var es = row.lang === 'es';
    send_(row, TOPICS[row.topic].copy[row.lang].ready, mail_(row, {
      title: TOPICS[row.topic].copy[row.lang].ready,
      lead: es ? 'Tu PDF va adjunto. Es una copia personal con un código único; por favor comparte el enlace a la página en lugar del archivo.' : 'Your PDF is attached. It is a personal copy with a unique code; please share the page link rather than the file.',
      cta: [es ? 'Visitar andresblitz.com' : 'Visit andresblitz.com', CONFIG.SITE + (doc === 'bio' ? '/' : '/guias-cripto/')],
      noUnsub: true,
    }), [buildPdf_(doc, tag)]);
    deleteRows_([row]); // one-off; the pdfs tab keeps the record
  }
  if (row.topic === 'calc-result') {
    send_(row, TOPICS[row.topic].copy[row.lang].ready, calcMail_(row, params, false));
    update_(row, { due: new Date(Date.now() + 30 * 864e5).toISOString() });
  }
}

/* ================= cron (every 30 min) ================= */

function cron() {
  var now = new Date();
  var jobs = [btcBrackets_, dollarGap_, newProjects_, feed_('el70', '/70/feed.xml'), feed_('trading-notes', '/notes/feed.xml'), calcReminders_, bcvDaily_, weeklyRates_];
  jobs.forEach(function (job) {
    try { job(now); } catch (err) { log_('cron', String(err && err.stack || err)); }
  });
}

function btcBrackets_() {
  var subs = confirmed_('btc-bracket'); if (!subs.length) return;
  var h = getJson_('/bitcoin/history.json');
  var last = h.closes[h.closes.length - 1], day = last[0], close = last[1];
  subs.forEach(function (s) {
    var w = JSON.parse(s.params).width, b = Math.floor(close / w);
    var prev = s.last_state ? JSON.parse(s.last_state) : null;
    if (prev && prev.b !== b && prev.day !== day) {
      var up = b > prev.b;
      var subj = 'Bitcoin closed ' + (up ? 'above ' + usd_(b * w) : 'below ' + usd_((b + 1) * w));
      send_(s, subj, mail_(s, {
        title: subj,
        lead: 'BTC closed at <b>' + usd_(close) + '</b> on ' + day + ' (UTC), in the <b>' + usd_(b * w) + ' – ' + usd_((b + 1) * w) + '</b> bracket. Before it was in ' + usd_(prev.b * w) + ' – ' + usd_((prev.b + 1) * w) + '.',
        cta: ['See the bracket chart', CONFIG.SITE + '/bitcoin/'],
      }));
    }
    if (!prev || prev.b !== b) update_(s, { last_state: JSON.stringify({ b: b, day: day }) });
  });
}

function dollarGap_() {
  var subs = confirmed_('dolar-gap'); if (!subs.length) return;
  var d = getJson_('/dolar-cripto/data.json');
  subs.forEach(function (s) {
    var p = JSON.parse(s.params), c = d.countries[p.country];
    if (!c || typeof c.gap !== 'number') return;
    var above = c.gap >= p.threshold;
    var prev = s.last_state ? JSON.parse(s.last_state) : null;
    if (prev && prev.above !== above) {
      var subj = 'Brecha ' + c.name + ': ' + c.gap.toFixed(1) + ' % (' + (above ? 'pasó' : 'bajó de') + ' tu nivel de ' + p.threshold + ' %)';
      send_(s, subj, mail_(s, {
        title: subj,
        lead: (c.officialLabel || 'Oficial') + ': <b>' + num_(c.official.value) + '</b> ' + c.fiat + ' · USDT P2P: <b>' + num_(c.usdt.value) + '</b> ' + c.fiat + '. Brecha: <b>' + c.gap.toFixed(2) + ' %</b>.',
        cta: ['Ver el dólar cripto', CONFIG.SITE + '/dolar-cripto/'],
      }));
    }
    if (!prev || prev.above !== above) update_(s, { last_state: JSON.stringify({ above: above }) });
  });
}

function bcvDaily_(now) {
  if (now.getUTCHours() < 12) return;                       // from ~8:00 Caracas, once a day
  var day = now.toISOString().slice(0, 10);
  var subs = confirmed_('bcv-daily').filter(function (s) { return s.last_sent !== day; }); if (!subs.length) return;
  var r = getJson_('/rates/index.json'), bcv = r.series['tasa-bcv'], usdt = r.series['usdt-ve'];
  if (!bcv) return;
  var v = num_(bcv.value, 4);
  subs.forEach(function (s) {
    send_(s, 'Tasa BCV: ' + v + ' Bs/USD', mail_(s, {
      title: 'Tasa BCV hoy: ' + v + ' Bs. por dólar',
      lead: 'Tasa oficial vigente del ' + Utilities.formatDate(new Date(bcv.time), 'America/Caracas', 'dd/MM/yyyy') + '.' + (usdt ? ' USDT P2P: <b>' + num_(usdt.value) + '</b> Bs.' : ''),
      cta: ['Ver la Tasa BCV', CONFIG.SITE + '/tasa-bcv/'],
    }));
    update_(s, { last_sent: day });
  });
}

function weeklyRates_(now) {
  if (now.getUTCDay() !== 1 || now.getUTCHours() < 13) return; // Mondays from 13:00 UTC
  var day = now.toISOString().slice(0, 10);
  var subs = confirmed_('rates-weekly').filter(function (s) { return s.last_sent !== day; }); if (!subs.length) return;
  var r = getJson_('/rates/index.json');
  var keys = ['tasa-bcv', 'usdt-ve', 'dolar-argentina', 'dolar-argentina-blue', 'usdt-ar', 'dolar-colombia', 'usdt-co', 'dolar-mexico', 'dolar-peru', 'dolar-chile'].filter(function (k) { return r.series[k]; });
  var last = JSON.parse(stateGet_('weekly-values') || '{}');
  var rows = keys.map(function (k) {
    var v = r.series[k].value, was = last[k], ch = was ? ((v - was) / was) * 100 : null;
    return '<tr><td style="padding:6px 12px 6px 0">' + esc_(r.series[k].title) + '</td><td style="padding:6px 0;text-align:right"><b>' + num_(v) + '</b></td><td style="padding:6px 0 6px 12px;text-align:right;color:' + (ch == null ? '#97a3b8' : ch >= 0 ? '#f87171' : '#34d399') + '">' + (ch == null ? '' : (ch >= 0 ? '+' : '') + ch.toFixed(2) + ' %') + '</td></tr>';
  }).join('');
  subs.forEach(function (s) {
    send_(s, 'Resumen semanal del dólar en Latinoamérica', mail_(s, {
      title: 'El dólar esta semana', lead: 'Moneda local por 1 USD. El cambio es contra el lunes pasado.',
      html: '<table style="width:100%;border-collapse:collapse;font-size:14px;color:#e7ecf5">' + rows + '</table>',
      cta: ['Ver todos los países', CONFIG.SITE + '/site-map/'],
    }));
    update_(s, { last_sent: day });
  });
  var vals = {}; keys.forEach(function (k) { vals[k] = r.series[k].value; });
  stateSet_('weekly-values', JSON.stringify(vals));
}

function newProjects_() {
  var projects = getJson_('/api/site.json').pages.filter(function (p) { return p.kind === 'project'; });
  var seenRaw = stateGet_('projects-seen'), seen = seenRaw ? JSON.parse(seenRaw) : null;
  stateSet_('projects-seen', JSON.stringify(projects.map(function (p) { return p.slug; })));
  if (!seen) return;                                          // first run only records
  var fresh = projects.filter(function (p) { return seen.indexOf(p.slug) < 0; });
  if (!fresh.length) return;
  confirmed_('new-projects').forEach(function (s) {
    fresh.forEach(function (p) {
      var name = p.title.replace(/\s*\|\s*Andr[ée]s Blitz.*$/, '');
      send_(s, 'New project: ' + name.split(' — ')[0], mail_(s, { title: esc_(name), lead: esc_(p.summary), cta: ['Open the project', p.url] }));
    });
  });
}

function feed_(topic, path) {
  return function feedJob() {
    var xml = getText_(path); if (!xml) return;
    var items = [], re = /<item>([\s\S]*?)<\/item>/g, m;
    while ((m = re.exec(xml))) {
      var x = m[1], g = function (tag) { var r = new RegExp('<' + tag + '[^>]*>([^<]*)').exec(x); return r ? r[1] : ''; };
      items.push({ id: (g('guid') || g('link')) + '|' + g('pubDate'), title: g('title'), link: g('link') || CONFIG.SITE, desc: g('description') });
    }
    var k = 'feed:' + path, seenRaw = stateGet_(k), seen = seenRaw ? JSON.parse(seenRaw) : null;
    stateSet_(k, JSON.stringify(items.map(function (i) { return i.id; })));
    if (!seen) return;
    var fresh = items.filter(function (i) { return seen.indexOf(i.id) < 0; }).slice(0, 3);
    if (!fresh.length) return;
    confirmed_(topic).forEach(function (s) {
      fresh.forEach(function (i) { send_(s, i.title, mail_(s, { title: i.title, lead: i.desc, cta: [s.lang === 'es' ? 'Leer' : 'Read', i.link] })); });
    });
  };
}

function calcReminders_() {
  var now = new Date().toISOString();
  var due = confirmed_('calc-result').filter(function (s) { return s.due && s.due <= now; });
  due.forEach(function (s) {
    send_(s, s.lang === 'es' ? 'Han pasado 30 días: revisa tu cálculo' : '30 days later: check your numbers again', calcMail_(s, JSON.parse(s.params), true));
  });
  deleteRows_(due);
}

/* ================= email ================= */

function send_(sub, subject, html, attachments) {
  var opts = { htmlBody: html, name: CONFIG.FROM_NAME, replyTo: CONFIG.REPLY_TO };
  if (attachments) opts.attachments = attachments;
  var aliases = GmailApp.getAliases();
  if (aliases.indexOf(CONFIG.FROM_EMAIL) >= 0) opts.from = CONFIG.FROM_EMAIL;
  else log_('send', 'FROM_EMAIL is not a Gmail alias yet; sending from the account address');
  var text = html.replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2: $1').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
  GmailApp.sendEmail(sub.email, subject, text, opts);
  log_('sent', sub.topic + ' → ' + sub.email + ': ' + subject);
}

function calcMail_(row, p, reminder) {
  var es = row.lang === 'es';
  return mail_(row, {
    title: reminder ? (es ? 'Tu cálculo de hace 30 días' : 'Your calculation from 30 days ago') : (es ? 'Tu resultado' : 'Your result'),
    lead: '<b>' + esc_(p.calcName) + '</b><br>' + esc_(p.summary) + (reminder ? (es ? '<br><br>Las tasas cambiaron. Vuelve a calcular con los números de hoy.' : "<br><br>Rates have moved. Run it again with today's numbers.") : ''),
    cta: [es ? 'Abrir la calculadora' : 'Open the calculator', CONFIG.SITE + p.path],
  });
}

function mail_(sub, o) {
  var es = sub.lang === 'es', unsub = webUrl_() + '?a=unsub&t=' + sub.token;
  return '<!doctype html><html><body style="margin:0;background:#05070f;font-family:Helvetica,Arial,sans-serif;color:#e7ecf5">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070f"><tr><td align="center" style="padding:32px 16px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b101d;border:1px solid #1c2333;border-radius:14px">' +
    '<tr><td style="height:4px;background:#5b8def;background-image:linear-gradient(120deg,#5b8def,#a78bfa);border-radius:14px 14px 0 0"></td></tr>' +
    '<tr><td style="padding:28px 28px 8px;font-size:13px;color:#97a3b8;letter-spacing:.06em;text-transform:uppercase">andresblitz.com</td></tr>' +
    '<tr><td style="padding:0 28px;font-size:22px;font-weight:700;line-height:1.25;color:#e7ecf5">' + o.title + '</td></tr>' +
    '<tr><td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#c9d2e3">' + o.lead + '</td></tr>' +
    (o.html ? '<tr><td style="padding:16px 28px 0">' + o.html + '</td></tr>' : '') +
    (o.cta ? '<tr><td style="padding:24px 28px 8px"><a href="' + o.cta[1] + '" style="display:inline-block;background:#5b8def;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:9px">' + o.cta[0] + ' →</a></td></tr>' : '') +
    '<tr><td style="padding:20px 28px 28px;font-size:12px;line-height:1.6;color:#97a3b8">' + (o.foot ? o.foot + '<br>' : '') +
    (o.noUnsub ? '' : '<a href="' + unsub + '" style="color:#97a3b8">' + (es ? 'Darme de baja' : 'Unsubscribe') + '</a> · <a href="' + unsub + '&all=1" style="color:#97a3b8">' + (es ? 'Darme de baja de todo' : 'Unsubscribe from everything') + '</a>') +
    '</td></tr></table></td></tr></table></body></html>';
}

/* ================= tagged PDFs ================= */
// Built from the site's own content as HTML, converted to PDF by Google. The tag is in the
// file name, a footer line and a hidden line. Your encoding library can replace stampHtml_().

function buildPdf_(doc, tag) {
  var body;
  if (doc === 'bio') {
    var s = getJson_('/api/site.json');
    body = '<h1>' + esc_(s.name) + '</h1><p class="meta">' + esc_(s.location) + ' · andresblitz.com</p><p>' + esc_(s.description) + '</p>' +
      '<h2>Focus</h2><p>' + esc_(s.topics.join(' · ')) + '</p><h2>Projects</h2><ul>' +
      s.pages.filter(function (p) { return p.kind === 'project'; }).map(function (p) {
        return '<li><b>' + esc_(p.title.replace(/\s*\|\s*Andr[ée]s Blitz.*$/, '')) + '</b><br><span class="meta">' + esc_(p.summary) + '</span></li>';
      }).join('') + '</ul><h2>Contact</h2><p>' + esc_([s.contact.x, s.contact.github, CONFIG.SITE].join(' · ')) + '</p>';
  } else {
    body = '<h1>Guías cripto en español</h1><p class="meta">USDT, P2P, redes, brecha y estafas · andresblitz.com/guias-cripto/</p><p>Informativo, no es asesoría financiera.</p>' +
      GUIDES.map(function (g) { return '<div class="page">' + mdToHtml_(getText_('/guias-cripto/' + g + '/index.md') || '') + '</div>'; }).join('');
  }
  var html = '<html><head><meta charset="utf-8"><style>body{font-family:Helvetica,Arial,sans-serif;color:#111827;font-size:11pt;line-height:1.5}' +
    'h1{font-size:22pt;margin:0 0 4pt;border-top:3pt solid #5b8def;padding-top:10pt}h2{font-size:13pt;margin:16pt 0 4pt}.meta{color:#6b7280;font-size:9.5pt}' +
    'li{margin:0 0 6pt}.page{page-break-before:always}.tag{color:#9ca3af;font-size:7pt;margin-top:24pt}.hid{color:#ffffff;font-size:1pt}</style></head><body>' +
    stampHtml_(body, tag) + '</body></html>';
  var name = (doc === 'bio' ? 'andres-blitz-bio-' : 'guias-cripto-') + tag + '.pdf';
  return Utilities.newBlob(html, 'text/html', 'doc.html').getAs('application/pdf').setName(name);
}

function stampHtml_(body, tag) {
  return body + '<p class="tag">Copia personal · ' + tag + '</p><p class="hid">ab-copy:' + tag + '</p>';
}

function mdToHtml_(md) {
  var out = [];
  md.replace(/^---\n[\s\S]*?\n---\n/, '').split(/\n{2,}/).forEach(function (raw) {
    var t = raw.trim();
    if (!t || /^(>|\||```)/.test(t)) return;
    var inline = function (s) { return esc_(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/[*_`]+/g, ''); };
    var h = /^(#{1,4})\s+(.*)$/.exec(t);
    if (h) { out.push('<h' + Math.min(h[1].length, 2) + '>' + inline(h[2]) + '</h' + Math.min(h[1].length, 2) + '>'); return; }
    if (/^([-*]|\d+\.)\s/.test(t)) { out.push('<ul>' + t.split('\n').map(function (li) { var m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(li); return m ? '<li>' + inline(m[1]) + '</li>' : ''; }).join('') + '</ul>'); return; }
    out.push('<p>' + inline(t.replace(/\n/g, ' ')) + '</p>');
  });
  return out.join('');
}

/* ================= sheet helpers ================= */

function sheet_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }

function subs_() {
  var v = sheet_('subs').getDataRange().getValues();
  return v.slice(1).map(function (r, i) {
    var o = { _row: i + 2 };
    SUBS_COLS.forEach(function (c, j) { o[c] = r[j] instanceof Date ? r[j].toISOString() : (r[j] === '' ? null : String(r[j])); });
    return o;
  }).filter(function (o) { return o.token; });
}
function confirmed_(topic) { return subs_().filter(function (r) { return r.topic === topic && r.confirmed; }); }
function update_(row, fields) {
  var sh = sheet_('subs');
  Object.keys(fields).forEach(function (k) { sh.getRange(row._row, SUBS_COLS.indexOf(k) + 1).setValue(fields[k]); row[k] = fields[k]; });
}
function deleteRows_(rows) {
  var sh = sheet_('subs');
  rows.map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (n) { sh.deleteRow(n); });
}
function stateGet_(k) {
  var v = sheet_('state').getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === k) return String(v[i][1]);
  return null;
}
function stateSet_(k, val) {
  var sh = sheet_('state'), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === k) { sh.getRange(i + 1, 2).setValue(val); return; }
  sh.appendRow([k, val]);
}
function log_(what, msg) {
  try { var sh = sheet_('log'); sh.appendRow([new Date().toISOString(), what, String(msg).slice(0, 500)]); if (sh.getLastRow() > 2000) sh.deleteRows(2, 500); } catch (e) {}
}

/* ================= small utils ================= */

function getText_(path) {
  var r = UrlFetchApp.fetch(CONFIG.SITE + path, { muteHttpExceptions: true });
  return r.getResponseCode() === 200 ? r.getContentText('UTF-8') : null;
}
function getJson_(path) { var t = getText_(path); if (!t) throw new Error('fetch failed ' + path); return JSON.parse(t); }
function bump_(cache, k) { var n = Number(cache.get(k) || 0) + 1; cache.put(k, String(n), 3600); return n; }
function webUrl_() { return ScriptApp.getService().getUrl(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function redirect_(url) {
  return HtmlService.createHtmlOutput('<meta http-equiv="refresh" content="0;url=' + url + '"><script>window.top.location.href=' + JSON.stringify(url) + '</script><a href="' + url + '" target="_top">Continue to andresblitz.com</a>');
}
function esc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function usd_(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function num_(n, d) { return Number(n).toLocaleString('es', { maximumFractionDigits: d == null ? 2 : d }); }

/* ================= one-time setup ================= */

function setup() {
  var ss = SpreadsheetApp.getActive();
  var tabs = { subs: SUBS_COLS, pdfs: ['tag', 'doc', 'email', 'created'], state: ['k', 'v'], log: ['time', 'what', 'message'] };
  Object.keys(tabs).forEach(function (n) {
    var sh = ss.getSheetByName(n) || ss.insertSheet(n);
    sh.getRange(1, 1, sh.getMaxRows(), tabs[n].length).setNumberFormat('@'); // keep dates and ids as plain text
    if (sh.getLastRow() === 0) { sh.appendRow(tabs[n]); sh.setFrozenRows(1); }
  });
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'cron') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('cron').timeBased().everyMinutes(30).create();
  cron(); // first run records the current state, so nobody gets old news
  Logger.log('Setup done. Aliases on this account: ' + GmailApp.getAliases().join(', '));
}
