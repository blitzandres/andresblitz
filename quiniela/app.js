'use strict';
// ─────────────────────────────────────────────────────────────
//  QUINIELA 2026 — World Cup Prediction Pool v3
//  Firebase backend: real accounts, real-time sync, no JSON sharing.
//  Delete /quiniela/ folder + nav link after July 19 2026.
// ─────────────────────────────────────────────────────────────

// ── FLAGS ────────────────────────────────────────────────────
const F = {
  'Mexico':'🇲🇽','South Africa':'🇿🇦','South Korea':'🇰🇷','Czechia':'🇨🇿',
  'Canada':'🇨🇦','Bosnia and Herzegovina':'🇧🇦','Qatar':'🇶🇦','Switzerland':'🇨🇭',
  'Brazil':'🇧🇷','Morocco':'🇲🇦','Haiti':'🇭🇹','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'United States':'🇺🇸','Paraguay':'🇵🇾','Australia':'🇦🇺','Türkiye':'🇹🇷',
  'Germany':'🇩🇪','Curaçao':'🇨🇼','Ivory Coast':'🇨🇮','Ecuador':'🇪🇨',
  'Netherlands':'🇳🇱','Japan':'🇯🇵','Sweden':'🇸🇪','Tunisia':'🇹🇳',
  'Spain':'🇪🇸','Cape Verde':'🇨🇻','Saudi Arabia':'🇸🇦','Uruguay':'🇺🇾',
  'Belgium':'🇧🇪','Egypt':'🇪🇬','Iran':'🇮🇷','New Zealand':'🇳🇿',
  'France':'🇫🇷','Senegal':'🇸🇳','Iraq':'🇮🇶','Norway':'🇳🇴',
  'Argentina':'🇦🇷','Algeria':'🇩🇿','Austria':'🇦🇹','Jordan':'🇯🇴',
  'Portugal':'🇵🇹','DR Congo':'🇨🇩','Uzbekistan':'🇺🇿','Colombia':'🇨🇴',
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croatia':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦',
};
const flag = t => F[t] || '🏳️';
const ALL_TEAMS = Object.keys(F).sort();

// ── TICKER FACTS ─────────────────────────────────────────────
const TICKER_FACTS = [
  '⚽ 48 teams · 12 groups · 104 matches · Jun 11 – Jul 19, 2026',
  '🏆 Argentina 🇦🇷 are the defending champions — Qatar 2022',
  '🌍 First World Cup co-hosted by 3 nations: USA, Canada & Mexico',
  '🏟️ The Final is at MetLife Stadium, New Jersey — July 19',
  '📌 Opening match: Mexico 🇲🇽 vs South Africa 🇿🇦 at Estadio Azteca',
  '🆕 New for 2026: a Round of 32 — best 8 third-place teams also advance',
  '🇧🇷 Brazil face Morocco, Scotland & Haiti in Group C',
  '🇫🇷 France were 2022 runners-up — lost to Argentina in the final',
  '🇩🇪 Germany aim to bounce back after group-stage exits in 2018 & 2022',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England last won the World Cup in 1966 at Wembley',
  '🇦🇷 Argentina open Group J vs Algeria — potential shock fixture',
  '🇵🇹 Portugal & Colombia share Group K — a Latin American rivalry',
  '🇺🇸 USA play at home in Group D alongside Paraguay, Australia & Türkiye',
  '🇺🇿 Uzbekistan 🇺🇿 make their World Cup debut in 2026',
  '📊 Scoring: 5pts exact · 4pts result+diff · 3pts result · 0pts miss',
  '⭐ Bonus: +10pts champion · +5pts runner-up · +5pts top scorer',
];

// ── GROUPS ───────────────────────────────────────────────────
const GROUPS = {
  A:['Mexico','South Africa','South Korea','Czechia'],
  B:['Canada','Bosnia and Herzegovina','Qatar','Switzerland'],
  C:['Brazil','Morocco','Haiti','Scotland'],
  D:['United States','Paraguay','Australia','Türkiye'],
  E:['Germany','Curaçao','Ivory Coast','Ecuador'],
  F:['Netherlands','Japan','Sweden','Tunisia'],
  G:['Belgium','Egypt','Iran','New Zealand'],
  H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],
  I:['France','Senegal','Iraq','Norway'],
  J:['Argentina','Algeria','Austria','Jordan'],
  K:['Portugal','DR Congo','Uzbekistan','Colombia'],
  L:['England','Croatia','Ghana','Panama'],
};

// ── ALL 72 GROUP STAGE MATCHES ────────────────────────────────
const MATCHES = [
  {id:1,  g:'A', h:'Mexico',                  a:'South Africa',            d:'2026-06-11', t:'15:00 ET'},
  {id:2,  g:'A', h:'South Korea',             a:'Czechia',                 d:'2026-06-11', t:'22:00 ET'},
  {id:3,  g:'B', h:'Canada',                  a:'Bosnia and Herzegovina',  d:'2026-06-12', t:'15:00 ET'},
  {id:4,  g:'D', h:'United States',           a:'Paraguay',                d:'2026-06-12', t:'21:00 ET'},
  {id:5,  g:'B', h:'Qatar',                   a:'Switzerland',             d:'2026-06-13', t:'15:00 ET'},
  {id:6,  g:'C', h:'Brazil',                  a:'Morocco',                 d:'2026-06-13', t:'18:00 ET'},
  {id:7,  g:'C', h:'Haiti',                   a:'Scotland',                d:'2026-06-13', t:'21:00 ET'},
  {id:8,  g:'D', h:'Australia',               a:'Türkiye',                 d:'2026-06-14', t:'00:00 ET'},
  {id:9,  g:'E', h:'Germany',                 a:'Curaçao',                 d:'2026-06-14', t:'13:00 ET'},
  {id:10, g:'F', h:'Netherlands',             a:'Japan',                   d:'2026-06-14', t:'16:00 ET'},
  {id:11, g:'E', h:'Ivory Coast',             a:'Ecuador',                 d:'2026-06-14', t:'19:00 ET'},
  {id:12, g:'F', h:'Tunisia',                 a:'Sweden',                  d:'2026-06-14', t:'22:00 ET'},
  {id:13, g:'H', h:'Spain',                   a:'Cape Verde',              d:'2026-06-15', t:'12:00 ET'},
  {id:14, g:'G', h:'Belgium',                 a:'Egypt',                   d:'2026-06-15', t:'15:00 ET'},
  {id:15, g:'H', h:'Saudi Arabia',            a:'Uruguay',                 d:'2026-06-15', t:'18:00 ET'},
  {id:16, g:'G', h:'Iran',                    a:'New Zealand',             d:'2026-06-15', t:'21:00 ET'},
  {id:17, g:'I', h:'France',                  a:'Senegal',                 d:'2026-06-16', t:'15:00 ET'},
  {id:18, g:'I', h:'Iraq',                    a:'Norway',                  d:'2026-06-16', t:'18:00 ET'},
  {id:19, g:'J', h:'Argentina',               a:'Algeria',                 d:'2026-06-16', t:'21:00 ET'},
  {id:20, g:'J', h:'Austria',                 a:'Jordan',                  d:'2026-06-17', t:'00:00 ET'},
  {id:21, g:'K', h:'Portugal',                a:'DR Congo',                d:'2026-06-17', t:'13:00 ET'},
  {id:22, g:'L', h:'England',                 a:'Croatia',                 d:'2026-06-17', t:'16:00 ET'},
  {id:23, g:'L', h:'Ghana',                   a:'Panama',                  d:'2026-06-17', t:'19:00 ET'},
  {id:24, g:'K', h:'Uzbekistan',              a:'Colombia',                d:'2026-06-17', t:'22:00 ET'},
  {id:25, g:'A', h:'Czechia',                 a:'South Africa',            d:'2026-06-18', t:'12:00 ET'},
  {id:26, g:'B', h:'Switzerland',             a:'Bosnia and Herzegovina',  d:'2026-06-18', t:'15:00 ET'},
  {id:27, g:'B', h:'Canada',                  a:'Qatar',                   d:'2026-06-18', t:'18:00 ET'},
  {id:28, g:'A', h:'Mexico',                  a:'South Korea',             d:'2026-06-18', t:'21:00 ET'},
  {id:29, g:'D', h:'United States',           a:'Australia',               d:'2026-06-19', t:'15:00 ET'},
  {id:30, g:'C', h:'Scotland',                a:'Morocco',                 d:'2026-06-19', t:'15:00 ET'},
  {id:31, g:'C', h:'Brazil',                  a:'Haiti',                   d:'2026-06-19', t:'21:00 ET'},
  {id:32, g:'D', h:'Türkiye',                 a:'Paraguay',                d:'2026-06-20', t:'00:00 ET'},
  {id:33, g:'F', h:'Netherlands',             a:'Sweden',                  d:'2026-06-20', t:'13:00 ET'},
  {id:34, g:'E', h:'Germany',                 a:'Ivory Coast',             d:'2026-06-20', t:'16:00 ET'},
  {id:35, g:'E', h:'Ecuador',                 a:'Curaçao',                 d:'2026-06-20', t:'20:00 ET'},
  {id:36, g:'F', h:'Tunisia',                 a:'Japan',                   d:'2026-06-21', t:'00:00 ET'},
  {id:37, g:'H', h:'Spain',                   a:'Saudi Arabia',            d:'2026-06-21', t:'12:00 ET'},
  {id:38, g:'G', h:'Belgium',                 a:'Iran',                    d:'2026-06-21', t:'15:00 ET'},
  {id:39, g:'H', h:'Uruguay',                 a:'Cape Verde',              d:'2026-06-21', t:'18:00 ET'},
  {id:40, g:'G', h:'New Zealand',             a:'Egypt',                   d:'2026-06-21', t:'21:00 ET'},
  {id:41, g:'J', h:'Argentina',               a:'Austria',                 d:'2026-06-22', t:'13:00 ET'},
  {id:42, g:'I', h:'France',                  a:'Iraq',                    d:'2026-06-22', t:'17:00 ET'},
  {id:43, g:'I', h:'Norway',                  a:'Senegal',                 d:'2026-06-22', t:'20:00 ET'},
  {id:44, g:'J', h:'Jordan',                  a:'Algeria',                 d:'2026-06-22', t:'23:00 ET'},
  {id:45, g:'K', h:'Portugal',                a:'Uzbekistan',              d:'2026-06-23', t:'13:00 ET'},
  {id:46, g:'L', h:'England',                 a:'Ghana',                   d:'2026-06-23', t:'16:00 ET'},
  {id:47, g:'L', h:'Panama',                  a:'Croatia',                 d:'2026-06-23', t:'19:00 ET'},
  {id:48, g:'K', h:'Colombia',                a:'DR Congo',                d:'2026-06-23', t:'22:00 ET'},
  {id:49, g:'B', h:'Switzerland',             a:'Canada',                  d:'2026-06-24', t:'15:00 ET'},
  {id:50, g:'B', h:'Bosnia and Herzegovina',  a:'Qatar',                   d:'2026-06-24', t:'15:00 ET'},
  {id:51, g:'C', h:'Brazil',                  a:'Scotland',                d:'2026-06-24', t:'18:00 ET'},
  {id:52, g:'C', h:'Morocco',                 a:'Haiti',                   d:'2026-06-24', t:'18:00 ET'},
  {id:53, g:'A', h:'Mexico',                  a:'Czechia',                 d:'2026-06-24', t:'21:00 ET'},
  {id:54, g:'A', h:'South Korea',             a:'South Africa',            d:'2026-06-24', t:'21:00 ET'},
  {id:55, g:'E', h:'Ecuador',                 a:'Germany',                 d:'2026-06-25', t:'16:00 ET'},
  {id:56, g:'E', h:'Curaçao',                 a:'Ivory Coast',             d:'2026-06-25', t:'16:00 ET'},
  {id:57, g:'F', h:'Tunisia',                 a:'Netherlands',             d:'2026-06-25', t:'19:00 ET'},
  {id:58, g:'F', h:'Japan',                   a:'Sweden',                  d:'2026-06-25', t:'19:00 ET'},
  {id:59, g:'D', h:'United States',           a:'Türkiye',                 d:'2026-06-25', t:'22:00 ET'},
  {id:60, g:'D', h:'Paraguay',                a:'Australia',               d:'2026-06-25', t:'22:00 ET'},
  {id:61, g:'I', h:'Norway',                  a:'France',                  d:'2026-06-26', t:'15:00 ET'},
  {id:62, g:'I', h:'Senegal',                 a:'Iraq',                    d:'2026-06-26', t:'15:00 ET'},
  {id:63, g:'H', h:'Uruguay',                 a:'Spain',                   d:'2026-06-26', t:'20:00 ET'},
  {id:64, g:'H', h:'Cape Verde',              a:'Saudi Arabia',            d:'2026-06-26', t:'20:00 ET'},
  {id:65, g:'G', h:'New Zealand',             a:'Belgium',                 d:'2026-06-26', t:'23:00 ET'},
  {id:66, g:'G', h:'Egypt',                   a:'Iran',                    d:'2026-06-26', t:'23:00 ET'},
  {id:67, g:'L', h:'Panama',                  a:'England',                 d:'2026-06-27', t:'17:00 ET'},
  {id:68, g:'L', h:'Croatia',                 a:'Ghana',                   d:'2026-06-27', t:'17:00 ET'},
  {id:69, g:'K', h:'Colombia',                a:'Portugal',                d:'2026-06-27', t:'19:30 ET'},
  {id:70, g:'K', h:'DR Congo',                a:'Uzbekistan',              d:'2026-06-27', t:'19:30 ET'},
  {id:71, g:'J', h:'Argentina',               a:'Jordan',                  d:'2026-06-27', t:'22:00 ET'},
  {id:72, g:'J', h:'Algeria',                 a:'Austria',                 d:'2026-06-27', t:'22:00 ET'},
];

// ── FIREBASE ──────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDn2UORWWThh0IPrqSTA47rNxwK7mFIINY',
  authDomain:        'quiniela-2026-e7990.firebaseapp.com',
  projectId:         'quiniela-2026-e7990',
  storageBucket:     'quiniela-2026-e7990.firebasestorage.app',
  messagingSenderId: '835456036580',
  appId:             '1:835456036580:web:1a2f8f510e38a1178ac6f1',
};
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// ── IN-MEMORY STATE ───────────────────────────────────────────
const STATE = {
  nick:     null,
  preds:    {},
  specials: {},
  results:  {},
  specRes:  {},
  players:  [], // other players loaded from Firestore
};

// ── PIN AUTH ──────────────────────────────────────────────────
async function hashPin(nick, pin) {
  const msg = `${nick.toLowerCase()}:${pin}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loginWithPin(nick, pin) {
  const hash = await hashPin(nick, pin);
  const ref  = db.collection('players').doc(nick);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ pin_hash: hash, preds: {}, specials: {}, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    return { ok: true, isNew: true, hash };
  }
  const data = snap.data();
  if (data.pin_hash !== hash) return { ok: false, error: 'Wrong PIN — try again' };
  STATE.preds    = data.preds    || {};
  STATE.specials = data.specials || {};
  return { ok: true, isNew: false, hash };
}

async function tryAutoLogin() {
  const nick = localStorage.getItem('q_session_nick');
  const hash = localStorage.getItem('q_session_hash');
  if (!nick || !hash) return false;
  try {
    const snap = await db.collection('players').doc(nick).get();
    if (!snap.exists || snap.data().pin_hash !== hash) {
      localStorage.removeItem('q_session_nick');
      localStorage.removeItem('q_session_hash');
      return false;
    }
    const data      = snap.data();
    STATE.nick      = nick;
    STATE.preds     = data.preds    || {};
    STATE.specials  = data.specials || {};
    return true;
  } catch { return false; }
}

function logout() {
  stopListeners();
  Object.assign(STATE, { nick: null, preds: {}, specials: {}, results: {}, specRes: {}, players: [] });
  localStorage.removeItem('q_session_nick');
  localStorage.removeItem('q_session_hash');
  tab = 'standings';
  viewingPlayer = null;
  render();
}

// ── DB WRITES ─────────────────────────────────────────────────
let picksTimer = null;
function savePreds() {
  clearTimeout(picksTimer);
  picksTimer = setTimeout(() => {
    db.collection('players').doc(STATE.nick).update({
      preds: STATE.preds,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }, 800);
}

function saveSpecials() {
  db.collection('players').doc(STATE.nick).update({
    specials: STATE.specials,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {});
}

let resultsTimer = null;
function saveResults() {
  clearTimeout(resultsTimer);
  resultsTimer = setTimeout(() => {
    db.collection('tournament').doc('state').set(
      { results: STATE.results, specRes: STATE.specRes },
      { merge: true }
    ).catch(() => {});
  }, 1000);
}

// ── REAL-TIME LISTENERS ───────────────────────────────────────
let unsubAll = [];

function startListeners() {
  const unsubP = db.collection('players').onSnapshot(snap => {
    STATE.players = snap.docs
      .filter(d => d.id !== STATE.nick)
      .map(d => { const x = d.data(); return { nick: d.id, preds: x.preds || {}, specials: x.specials || {} }; });
    if (tab === 'standings' && !viewingPlayer) render();
    if (tab === 'picks') render(); // refresh odds bars
  });

  const unsubT = db.collection('tournament').doc('state').onSnapshot(snap => {
    if (snap.exists) {
      const d = snap.data();
      STATE.results = d.results || {};
      STATE.specRes = d.specRes || {};
    }
    // Only auto-re-render tabs that display results (not the results entry tab itself)
    if (tab === 'standings' && !viewingPlayer) render();
    if (tab === 'picks') render();
  });

  unsubAll = [unsubP, unsubT];
}

function stopListeners() {
  unsubAll.forEach(u => u());
  unsubAll = [];
}

// ── LIVE SCORES (api-sports.io) ───────────────────────────────
const DEFAULT_API_KEY = 'fa6cc4a79c8cab4bdd3a078d0eacec7e';
const TEAM_NORM = {
  'Korea Republic': 'South Korea', "Côte d'Ivoire": 'Ivory Coast',
  'Ivory Coast': 'Ivory Coast', 'Czech Republic': 'Czechia',
  'Turkey': 'Türkiye', 'Curacao': 'Curaçao', 'Congo DR': 'DR Congo',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina', 'USA': 'United States',
};
function normTeam(n) { return TEAM_NORM[n] || n; }

function lastSyncLabel() {
  const ls = localStorage.getItem('q_lastsync');
  if (!ls) return 'Never';
  const m = Math.floor((Date.now() - new Date(ls)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

async function fetchLiveResults(showToast = true) {
  document.querySelectorAll('.q-sync-time').forEach(el => el.textContent = 'Syncing…');
  try {
    const r = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT',
      { headers: { 'x-apisports-key': DEFAULT_API_KEY } }
    );
    if (r.status === 401) { if (showToast) toast('⚠ API key invalid'); return; }
    if (r.status === 429) { if (showToast) toast('Rate limited — try again soon'); return; }
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data    = await r.json();
    const results = { ...STATE.results };
    let updated   = 0;
    for (const fx of (data.response || [])) {
      const fh = fx.goals?.home, fa = fx.goals?.away;
      if (fh == null || fa == null) continue;
      const home = normTeam(fx.teams?.home?.name);
      const away = normTeam(fx.teams?.away?.name);
      const m = MATCHES.find(x => x.h === home && x.a === away);
      if (!m) continue;
      if (results[m.id]?.h === fh && results[m.id]?.a === fa) continue;
      results[m.id] = { h: fh, a: fa };
      updated++;
    }
    if (updated > 0) {
      STATE.results = results;
      saveResults(); // writes to Firestore → onSnapshot updates everyone
    }
    localStorage.setItem('q_lastsync', new Date().toISOString());
    document.querySelectorAll('.q-sync-time').forEach(el => el.textContent = 'Just now');
    if (showToast) toast(updated > 0 ? `✅ ${updated} result${updated !== 1 ? 's' : ''} updated` : '✅ All up to date');
  } catch(e) {
    document.querySelectorAll('.q-sync-time').forEach(el => el.textContent = 'Failed');
    if (showToast) toast(`⚠ Sync failed: ${e.message}`);
  }
}

// ── SCORING ───────────────────────────────────────────────────
function scoreMatch(pred, result) {
  if (!pred || pred.h == null || pred.a == null) return null;
  if (!result || result.h == null || result.a == null) return null;
  const ph = +pred.h, pa = +pred.a, rh = +result.h, ra = +result.a;
  if ([ph,pa,rh,ra].some(isNaN)) return null;
  if (ph === rh && pa === ra) return 5;
  const pSign = Math.sign(ph - pa), rSign = Math.sign(rh - ra);
  if (pSign === rSign) return (ph - pa) === (rh - ra) ? 4 : 3;
  return 0;
}
function ptsBadgeClass(pts) {
  return pts === 5 ? 'exact' : pts === 4 ? 'diff' : pts >= 3 ? 'win' : 'zero';
}

// ── MATCHDAY + LOCKING ────────────────────────────────────────
function matchday(m) {
  if (m.d <= '2026-06-17') return 1;
  if (m.d <= '2026-06-23') return 2;
  return 3;
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function isLocked(m) { return m.d <= todayStr(); }

// ── TOURNAMENT STATS ──────────────────────────────────────────
function computeStats(results) {
  const res = Object.values(results).filter(r => r.h != null && r.a != null);
  if (!res.length) return null;
  const goals = res.map(r => r.h + r.a);
  const total = goals.reduce((s,g) => s + g, 0);
  const tg = {};
  MATCHES.forEach(m => {
    const r = results[m.id];
    if (!r || r.h == null) return;
    tg[m.h] = (tg[m.h]||0) + r.h;
    tg[m.a] = (tg[m.a]||0) + r.a;
  });
  const top = Object.entries(tg).sort((a,b) => b[1]-a[1])[0];
  return { played: res.length, total, avg: (total/res.length).toFixed(1), topTeam: top ? `${flag(top[0])} ${top[1]}g` : '—' };
}

// ── NEXT MATCH COUNTDOWN ──────────────────────────────────────
function nextMatch() {
  const today = todayStr();
  const upcoming = MATCHES.filter(m => m.d > today);
  if (!upcoming.length) return null;
  upcoming.sort((a,b) => a.d.localeCompare(b.d) || a.t.localeCompare(b.t));
  return upcoming[0];
}
function countdownStr(m) {
  const [h, min] = m.t.split(':').map(s => parseInt(s,10));
  const [y, mo, d] = m.d.split('-').map(Number);
  const kickoff = Date.UTC(y, mo-1, d, h+4, min);
  const diff = kickoff - Date.now();
  if (diff <= 0) return 'Kick-off!';
  const days = Math.floor(diff/86400000), hours = Math.floor((diff%86400000)/3600000), minutes = Math.floor((diff%3600000)/60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ── TICKER ────────────────────────────────────────────────────
let tickerIdx = 0, tickerTimer = null;
function startTicker() {
  clearInterval(tickerTimer);
  const el = document.getElementById('ticker-text');
  if (!el) return;
  tickerTimer = setInterval(() => {
    el.classList.add('fade');
    setTimeout(() => { tickerIdx = (tickerIdx+1) % TICKER_FACTS.length; el.textContent = TICKER_FACTS[tickerIdx]; el.classList.remove('fade'); }, 300);
  }, 5000);
}

// ── ROUTER ────────────────────────────────────────────────────
let tab = 'standings';
let viewingPlayer = null;

function navigate(t) {
  tab = t;
  viewingPlayer = null;
  document.querySelectorAll('.q-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  render();
}

// ── GROUP CONSENSUS ODDS ──────────────────────────────────────
function matchOdds(mid, players) {
  const picks = (players || allPlayers()).map(p => p.preds[mid]).filter(p => p?.h != null && p?.a != null);
  if (picks.length < 2) return null;
  let home = 0, draw = 0, away = 0;
  for (const p of picks) { const d = p.h - p.a; if (d > 0) home++; else if (d === 0) draw++; else away++; }
  const n = picks.length;
  return { home: Math.round(home/n*100), draw: Math.round(draw/n*100), away: Math.round(away/n*100), n };
}

// ── RENDER ────────────────────────────────────────────────────
function render() {
  clearInterval(tickerTimer);
  const app = document.getElementById('q-app');
  if (!STATE.nick) { app.innerHTML = loginHTML(); bindLogin(); return; }

  const badge = document.getElementById('player-badge');
  if (badge) badge.textContent = STATE.nick;

  if (viewingPlayer) {
    app.innerHTML = playerPicksHTML(viewingPlayer);
    document.getElementById('back-btn')?.addEventListener('click', () => { viewingPlayer = null; render(); });
    return;
  }
  switch (tab) {
    case 'standings': app.innerHTML = standingsHTML(); startTicker(); bindStandings(); break;
    case 'picks':     app.innerHTML = picksHTML();     bindPicks();   break;
    case 'specials':  app.innerHTML = specialsHTML();  bindSpecials();break;
    case 'results':   app.innerHTML = resultsHTML();   bindResults(); break;
    case 'share':     app.innerHTML = shareHTML();     bindShare();   break;
  }
}

// ── VIEW: LOGIN ───────────────────────────────────────────────
function loginHTML() {
  return `
    <div class="q-login">
      <div class="q-login-card">
        <span class="q-ball">⚽</span>
        <h2>Quiniela 2026</h2>
        <p class="q-subtitle">World Cup · Jun 11 – Jul 19<br>12 friends · 72 matches · zero drama</p>
        <form id="login-form">
          <input type="text"  id="nick-input" placeholder="Nickname"     maxlength="20" autocomplete="username"  required>
          <input type="tel"   id="pin-input"  placeholder="4-digit PIN"  maxlength="4"  inputmode="numeric" pattern="[0-9]{4}" autocomplete="current-password" required>
          <button type="submit" class="q-btn" id="login-btn">Enter the Pool →</button>
        </form>
        <p class="q-login-note">First time? Pick any nickname + PIN to create your account.<br>Coming back? Use the same details from any device.</p>
        <div id="login-err" class="q-login-err" style="display:none"></div>
      </div>
    </div>`;
}

function bindLogin() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const nick = document.getElementById('nick-input').value.trim();
    const pin  = document.getElementById('pin-input').value.trim();
    const err  = document.getElementById('login-err');
    const btn  = document.getElementById('login-btn');
    if (!/^\d{4}$/.test(pin)) { err.textContent = 'PIN must be exactly 4 digits'; err.style.display='block'; return; }
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      const result = await loginWithPin(nick, pin);
      if (!result.ok) {
        err.textContent = result.error; err.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Enter the Pool →';
        return;
      }
      STATE.nick = nick;
      localStorage.setItem('q_session_nick', nick);
      localStorage.setItem('q_session_hash', result.hash);
      startListeners();
      render();
      toast(result.isNew ? `Welcome, ${nick}! 🎉` : `Welcome back, ${nick}! ⚽`);
      const ls = localStorage.getItem('q_lastsync');
      if (!ls || (Date.now() - new Date(ls)) > 5*60*1000) fetchLiveResults(false);
    } catch(e) {
      err.textContent = 'Connection error — check your internet'; err.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Enter the Pool →';
    }
  });
}

// ── VIEW: STANDINGS ───────────────────────────────────────────
function standingsHTML() {
  const results = STATE.results, specRes = STATE.specRes;
  const all = allPlayers(), stats = computeStats(results), nxt = nextMatch();
  const ranked = all.map(p => {
    const mPts = MATCHES.reduce((sum,m) => sum + (scoreMatch(p.preds[m.id], results[m.id]) ?? 0), 0);
    const champPts  = specRes.champion  && p.specials?.champion  === specRes.champion  ? 10 : 0;
    const runnerPts = specRes.runnerUp  && p.specials?.runnerUp  === specRes.runnerUp  ? 5  : 0;
    const scorerPts = specRes.topScorer && p.specials?.topScorer?.toLowerCase() === specRes.topScorer?.toLowerCase() ? 5 : 0;
    return { ...p, total: mPts+champPts+runnerPts+scorerPts, filled: Object.keys(p.preds).length };
  }).sort((a,b) => b.total - a.total);
  const me = STATE.nick, medals = ['🥇','🥈','🥉'];
  return `
    <div class="q-section">
      <div class="q-section-header"><h2>🏆 Standings</h2><span class="q-badge">${ranked.length} players</span></div>
      <div class="q-ticker"><span class="q-ticker-label">Live</span><span class="q-ticker-text" id="ticker-text">${TICKER_FACTS[tickerIdx]}</span></div>
      <a class="q-news-link" href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026" target="_blank" rel="noopener">📰 FIFA Official World Cup 2026 News <span>→</span></a>
      ${nxt ? `<div class="q-countdown">
        <div class="q-countdown-icon">${flag(nxt.h)}</div>
        <div class="q-countdown-info"><div class="q-countdown-match">${nxt.h} vs ${nxt.a}</div><div class="q-countdown-when">Group ${nxt.g} · ${nxt.d.slice(5).replace('-','/')} · ${nxt.t}</div></div>
        <div class="q-countdown-time" id="countdown-val">${countdownStr(nxt)}</div>
      </div>` : ''}
      ${stats ? `<div class="q-stats-row">
        <div class="q-stat-card"><div class="q-stat-num">${stats.total}</div><div class="q-stat-label">Goals</div></div>
        <div class="q-stat-card"><div class="q-stat-num">${stats.avg}</div><div class="q-stat-label">per match</div></div>
        <div class="q-stat-card"><div class="q-stat-num" style="font-size:14px">${stats.topTeam}</div><div class="q-stat-label">top scorer</div></div>
      </div>` : ''}
      ${!Object.keys(results).length ? `<div class="q-info">No results yet — live scores auto-fill once matches are played.</div>` : ''}
      ${ranked.length === 0
        ? `<div class="q-empty">No players yet.<br>Share <strong>andresblitz.com/quiniela/</strong> with your friends.</div>`
        : `<div class="q-table">
            ${ranked.map((p,i) => `
              <div class="q-row ${p.nick===me?'is-me':''}" data-view-player="${p.nick}">
                <span class="q-rank">${medals[i]||i+1}</span>
                <span class="q-pname">${p.nick===me?'⭐ ':''}${p.nick}</span>
                <span class="q-pts">${p.total}<small>pts</small></span>
                <span class="q-pred-count">${p.filled}/72</span>
                <span class="q-view-arrow">→</span>
              </div>`).join('')}
          </div>
          <div class="q-hint">Tap a player to see their picks · 5pts exact · 4pts result+diff · 3pts result</div>`}
    </div>`;
}

function allPlayers() {
  return [{ nick: STATE.nick, preds: STATE.preds, specials: STATE.specials }, ...STATE.players];
}

function bindStandings() {
  document.querySelectorAll('[data-view-player]').forEach(row => {
    row.addEventListener('click', () => { viewingPlayer = row.dataset.viewPlayer; render(); });
  });
}

// ── VIEW: PLAYER PICKS DETAIL ─────────────────────────────────
function playerPicksHTML(nick) {
  const player = allPlayers().find(p => p.nick === nick);
  if (!player) return `<div class="q-section"><button class="q-back-btn" id="back-btn">← Back</button></div>`;
  const results = STATE.results, specRes = STATE.specRes, sp = player.specials || {};
  const mPts      = MATCHES.reduce((sum,m) => sum + (scoreMatch(player.preds[m.id], results[m.id]) ?? 0), 0);
  const champPts  = specRes.champion  && sp.champion  === specRes.champion  ? 10 : 0;
  const runnerPts = specRes.runnerUp  && sp.runnerUp  === specRes.runnerUp  ? 5  : 0;
  const scorerPts = specRes.topScorer && sp.topScorer?.toLowerCase() === specRes.topScorer?.toLowerCase() ? 5 : 0;
  const total = mPts + champPts + runnerPts + scorerPts;
  const mdLabel = ['','Phase 1 · Jun 11–17','Phase 2 · Jun 18–23','Phase 3 · Jun 24–27'];
  return `
    <div class="q-section">
      <button class="q-back-btn" id="back-btn">← Standings</button>
      <div class="q-player-detail-hdr">
        <h2>${nick===STATE.nick?'⭐ ':''}${nick}</h2>
        <div class="q-player-total">${total}<small>pts</small></div>
      </div>
      ${sp.champion||sp.runnerUp||sp.topScorer ? `<div class="q-specials-card">
        ${sp.champion  ? `<div class="q-spec-row"><span>🏆 Champion</span><span>${flag(sp.champion)} ${sp.champion}</span>${champPts?`<span class="q-pts-badge exact">+10pts</span>`:''}</div>` : ''}
        ${sp.runnerUp  ? `<div class="q-spec-row"><span>🥈 Runner-up</span><span>${flag(sp.runnerUp)} ${sp.runnerUp}</span>${runnerPts?`<span class="q-pts-badge exact">+5pts</span>`:''}</div>` : ''}
        ${sp.topScorer ? `<div class="q-spec-row"><span>👟 Top Scorer</span><span>${sp.topScorer}</span>${scorerPts?`<span class="q-pts-badge exact">+5pts</span>`:''}</div>` : ''}
      </div>` : ''}
      ${[1,2,3].map(md => {
        const mdMatches = MATCHES.filter(m => matchday(m) === md);
        const mdPts = mdMatches.reduce((sum,m) => sum + (scoreMatch(player.preds[m.id], results[m.id]) ?? 0), 0);
        return `<div class="q-matchday" data-md="${md}">
          <div class="q-matchday-hdr">
            <div class="q-md-label-group"><h3>${mdLabel[md]}</h3></div>
            <div class="q-md-bar" style="flex:1"></div>
            <span class="q-md-pct">${mdPts}pts</span>
          </div>
          ${mdMatches.map(m => {
            const pred = player.preds[m.id], result = results[m.id], pts = scoreMatch(pred, result);
            const hasPred = pred?.h != null && pred?.a != null, cls = pts !== null ? ptsBadgeClass(pts) : '';
            return `<div class="q-detail-row ${cls}">
              <span class="q-group-badge">GRP ${m.g}</span>
              <span class="q-detail-teams">${flag(m.h)} <b>${m.h}</b> v ${flag(m.a)} <b>${m.a}</b></span>
              <span class="q-detail-pred">${hasPred ? `${pred.h}–${pred.a}` : '—'}</span>
              ${result ? `<span class="q-detail-res">${result.h}–${result.a}</span>` : ''}
              ${pts !== null ? `<span class="q-pts-badge ${cls}">${pts>0?'+':''}${pts}</span>` : ''}
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

// ── VIEW: MY PICKS ────────────────────────────────────────────
function picksHTML() {
  const preds = STATE.preds, results = STATE.results, allP = allPlayers();
  const filled = Object.keys(preds).filter(id => preds[id]?.h != null && preds[id]?.a != null).length;
  const byDate = {};
  MATCHES.forEach(m => { if (!byDate[m.d]) byDate[m.d] = []; byDate[m.d].push(m); });
  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  const mdDates = {1:[],2:[],3:[]};
  Object.keys(byDate).sort().forEach(d => mdDates[matchday(byDate[d][0])].push(d));
  const mdLabel = ['','Matchday 1 · Jun 11–17','Matchday 2 · Jun 18–23','Matchday 3 · Jun 24–27'];
  const mdDesc  = ['','Opening round — each group plays their first match','Second round — the table starts to take shape','⚠ Final round — all group matches kick off simultaneously'];
  return `
    <div class="q-section">
      <div class="q-section-header"><h2>⚽ My Picks</h2><span class="q-badge">${filled}/72</span></div>
      <div class="q-phase-legend">
        <div class="q-phase-pill" data-md="1"><span class="q-phase-pill-dot"></span>Phase 1</div>
        <div class="q-phase-pill" data-md="2"><span class="q-phase-pill-dot"></span>Phase 2</div>
        <div class="q-phase-pill" data-md="3"><span class="q-phase-pill-dot"></span>Phase 3 · Simultaneous</div>
      </div>
      <div class="q-scoring-legend">
        <span class="leg"><span class="leg-dot exact"></span>5pts exact</span>
        <span class="leg"><span class="leg-dot diff"></span>4pts result+diff</span>
        <span class="leg"><span class="leg-dot win"></span>3pts result</span>
        <span class="leg"><span class="leg-dot wrong"></span>0pts miss</span>
      </div>
      ${[1,2,3].map(md => {
        const mdMatches = MATCHES.filter(m => matchday(m) === md);
        const mdFilled  = mdMatches.filter(m => preds[m.id]?.h != null && preds[m.id]?.a != null).length;
        const pct = Math.round((mdFilled/mdMatches.length)*100);
        return `<div class="q-matchday" data-md="${md}">
          <div class="q-matchday-hdr">
            <div class="q-md-label-group"><h3>${mdLabel[md]}</h3><span class="q-md-desc">${mdDesc[md]}</span></div>
            <div class="q-md-bar"><div class="q-md-fill" style="width:${pct}%"></div></div>
            <span class="q-md-pct">${mdFilled}/${mdMatches.length}</span>
          </div>
          ${mdDates[md].map(d => `
            <div class="q-date-divider">${fmtDate(d)}</div>
            ${byDate[d].map(m => matchCardHTML(m, preds, results, allP)).join('')}
          `).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

function matchCardHTML(m, preds, results, allP) {
  const locked = isLocked(m), pred = preds[m.id]||{}, result = results[m.id];
  const pts = (result && pred.h != null && pred.a != null) ? scoreMatch(pred, result) : null;
  const odds = matchOdds(m.id, allP), hVal = pred.h??0, aVal = pred.a??0;
  return `
    <div class="q-match-card ${locked?'locked':''}" data-mid="${m.id}">
      <div class="q-match-meta">
        <span class="q-group-badge">GRP ${m.g}</span>
        <span class="q-match-time">${m.t}</span>
        ${locked?'<span class="q-lock-icon">🔒</span>':''}
        ${pts !== null ? `<span class="q-pts-badge ${ptsBadgeClass(pts)}">${pts>0?'+':''}${pts}pts</span>` : ''}
      </div>
      <div class="q-match-teams">
        <div class="q-team-home"><span class="q-tname">${m.h}</span><span class="q-flag">${flag(m.h)}</span></div>
        <div class="q-score-pair">
          ${locked
            ? `<div class="q-score-locked"><span class="q-score-locked-val">${pred.h??'—'}</span><span class="q-score-sep">:</span><span class="q-score-locked-val">${pred.a??'—'}</span></div>`
            : `${stepperHTML(m.id,'h',hVal)}<span class="q-score-sep">:</span>${stepperHTML(m.id,'a',aVal)}`}
        </div>
        <div class="q-team-away"><span class="q-flag">${flag(m.a)}</span><span class="q-tname">${m.a}</span></div>
      </div>
      ${result ? `<div class="q-actual-result">Result · ${flag(m.h)} ${result.h} – ${result.a} ${flag(m.a)}</div>` : ''}
      ${odds ? `<div class="q-odds">
        <div class="q-odds-bar">
          <div class="q-odds-home" style="width:${odds.home}%"></div>
          <div class="q-odds-draw" style="width:${odds.draw}%"></div>
          <div class="q-odds-away" style="width:${odds.away}%"></div>
        </div>
        <div class="q-odds-labels">
          <span>${odds.home}% ${m.h.split(' ')[0]}</span>
          <span>${odds.draw}% Draw</span>
          <span>${m.a.split(' ')[0]} ${odds.away}%</span>
        </div>
      </div>` : ''}
    </div>`;
}

function stepperHTML(mid, side, val) {
  return `<div class="q-stepper" data-mid="${mid}" data-side="${side}">
    <button class="q-step-btn q-step-minus" aria-label="Decrease">−</button>
    <span class="q-step-val">${val}</span>
    <button class="q-step-btn q-step-plus" aria-label="Increase">+</button>
  </div>`;
}

function bindPicks() {
  document.querySelectorAll('.q-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepper = btn.closest('.q-stepper');
      const mid = stepper.dataset.mid, side = stepper.dataset.side;
      const dir = btn.classList.contains('q-step-plus') ? 1 : -1;
      const p = STATE.preds;
      if (!p[mid]) p[mid] = { h:0, a:0 };
      if (p[mid].h == null) p[mid].h = 0;
      if (p[mid].a == null) p[mid].a = 0;
      const next = Math.max(0, Math.min(20, p[mid][side] + dir));
      p[mid][side] = next;
      STATE.preds = p;
      savePreds();
      stepper.querySelector('.q-step-val').textContent = next;
      updatePtsBadge(mid, p, STATE.results);
    });
  });
}

function updatePtsBadge(mid, preds, results) {
  const card = document.querySelector(`.q-match-card[data-mid="${mid}"]`);
  if (!card) return;
  const existing = card.querySelector('.q-pts-badge');
  const pred = preds[mid], result = results[mid];
  if (!result || pred?.h == null || pred?.a == null) { if (existing) existing.remove(); return; }
  const pts = scoreMatch(pred, result);
  if (pts === null) { if (existing) existing.remove(); return; }
  const cls = ptsBadgeClass(pts), txt = `${pts>0?'+':''}${pts}pts`;
  if (existing) { existing.className = `q-pts-badge ${cls}`; existing.textContent = txt; }
  else { const b = document.createElement('span'); b.className=`q-pts-badge ${cls}`; b.textContent=txt; card.querySelector('.q-match-meta').appendChild(b); }
}

// ── VIEW: SPECIALS ────────────────────────────────────────────
function specialsHTML() {
  const sp = STATE.specials, sr = STATE.specRes, locked = isLocked(MATCHES[0]);
  const opts = key => ALL_TEAMS.map(t => `<option value="${t}" ${sp[key]===t?'selected':''}>${flag(t)} ${t}</option>`).join('');
  const card = (key, emoji, label, pts, isText) => {
    const correct = sr[key] && (isText ? sp[key]?.toLowerCase()===sr[key]?.toLowerCase() : sp[key]===sr[key]);
    const wrong = sr[key] && sp[key] && !correct;
    return `<div class="q-special-card ${correct?'correct':wrong?'wrong':''}">
      <div class="q-special-label"><span>${emoji} ${label}</span><span class="q-special-pts">+${pts}pts</span></div>
      ${locked
        ? `<div class="q-special-pick">${sp[key]?`${isText?'':flag(sp[key])} ${sp[key]}`:'<span style="color:var(--soft);font-size:13px">Not set</span>'}</div>`
        : isText
          ? `<input type="text" id="sp-${key}" class="q-text-in" value="${sp[key]||''}" placeholder="Player name">`
          : `<select id="sp-${key}" class="q-select"><option value="">— Pick a team —</option>${opts(key)}</select>`}
      ${sr[key] ? `<div class="q-special-verdict">Actual: ${isText?'':flag(sr[key])} ${sr[key]} ${correct?'✅ +'+pts+'pts':'❌'}</div>` : ''}
    </div>`;
  };
  return `
    <div class="q-section">
      <div class="q-section-header"><h2>⭐ Special Picks</h2><span class="q-badge">Locks Jun 11</span></div>
      <p class="q-desc">Bonus points. Must be set before June 11 — after that they're locked in forever.</p>
      <div class="q-special-cards">
        ${card('champion','🏆','World Cup Champion',10,false)}
        ${card('runnerUp','🥈','Runner-Up (Finalist)',5,false)}
        ${card('topScorer','👟','Top Goal Scorer',5,true)}
      </div>
      ${!locked ? `<button class="q-btn" id="save-specials">Save Special Picks</button>` : ''}
    </div>`;
}

function bindSpecials() {
  document.getElementById('save-specials')?.addEventListener('click', () => {
    const sp = {};
    const c = document.getElementById('sp-champion')?.value;
    const r = document.getElementById('sp-runnerUp')?.value;
    const t = document.getElementById('sp-topScorer')?.value.trim();
    if (c) sp.champion = c;
    if (r) sp.runnerUp = r;
    if (t) sp.topScorer = t;
    STATE.specials = sp;
    saveSpecials();
    toast('Special picks saved ⭐');
    render();
  });
}

// ── VIEW: RESULTS ─────────────────────────────────────────────
function resultsHTML() {
  const res = STATE.results, sr = STATE.specRes;
  const tOpts = key => ALL_TEAMS.map(t => `<option value="${t}" ${sr[key]===t?'selected':''}>${flag(t)} ${t}</option>`).join('');
  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  return `
    <div class="q-section">
      <div class="q-section-header"><h2>📊 Results</h2><span class="q-badge">${Object.keys(res).length}/72</span></div>
      <div class="q-live-bar">
        <span class="q-live-dot"></span>
        <span>Live sync active</span>
        <span class="q-sync-time">${lastSyncLabel()}</span>
        <button class="q-btn xs" id="sync-now-btn">Sync Now</button>
      </div>
      <div class="q-awards-block">
        <h3>🏆 Final Awards <span style="font-weight:400;color:var(--soft);font-size:11px">· after Jul 19</span></h3>
        <div class="q-award-row"><label>Champion</label><select id="res-champion" class="q-select sm"><option value="">— TBD —</option>${tOpts('champion')}</select></div>
        <div class="q-award-row"><label>Runner-Up</label><select id="res-runner" class="q-select sm"><option value="">— TBD —</option>${tOpts('runnerUp')}</select></div>
        <div class="q-award-row"><label>Top Scorer</label><input type="text" id="res-scorer" class="q-text-in sm" value="${sr.topScorer||''}" placeholder="Player name"></div>
        <button class="q-btn sm" id="save-awards" style="margin-top:8px">Save Awards</button>
      </div>
      <div class="q-results-header"><h3>Group Stage Scores</h3></div>
      ${MATCHES.map(m => {
        const r = res[m.id]||{};
        return `<div class="q-result-row ${!isLocked(m)?'future':''}">
          <span class="q-result-matchlabel">${flag(m.h)} ${m.h} <em style="color:var(--soft)">vs</em> ${m.a} ${flag(m.a)}</span>
          <span class="q-result-date">${fmtDate(m.d)}</span>
          <input class="q-res-in" type="number" min="0" max="20" data-mid="${m.id}" data-side="h" value="${r.h??''}" placeholder="H">
          <span class="q-res-sep">–</span>
          <input class="q-res-in" type="number" min="0" max="20" data-mid="${m.id}" data-side="a" value="${r.a??''}" placeholder="A">
        </div>`;
      }).join('')}
    </div>`;
}

function bindResults() {
  document.getElementById('sync-now-btn')?.addEventListener('click', () => fetchLiveResults(true));
  document.querySelectorAll('.q-res-in').forEach(inp => {
    inp.addEventListener('input', () => {
      const mid = inp.dataset.mid, side = inp.dataset.side, val = inp.value.trim();
      const res = { ...STATE.results };
      if (!res[mid]) res[mid] = {};
      val === '' ? delete res[mid][side] : res[mid][side] = parseInt(val, 10);
      if (res[mid] && res[mid].h == null && res[mid].a == null) delete res[mid];
      STATE.results = res;
      saveResults(); // debounced write → Firestore → everyone's leaderboard updates
    });
  });
  document.getElementById('save-awards')?.addEventListener('click', () => {
    const sr = {};
    const c = document.getElementById('res-champion')?.value;
    const r = document.getElementById('res-runner')?.value;
    const t = document.getElementById('res-scorer')?.value.trim();
    if (c) sr.champion = c;
    if (r) sr.runnerUp = r;
    if (t) sr.topScorer = t;
    STATE.specRes = sr;
    saveResults();
    toast('Awards saved 🏆');
  });
}

// ── VIEW: SHARE → PLAYERS & ACCOUNT ──────────────────────────
function shareHTML() {
  const all = allPlayers();
  return `
    <div class="q-section">
      <div class="q-section-header"><h2>👥 The Pool</h2><span class="q-badge">${all.length} players</span></div>

      <div class="q-share-block">
        <h3>Invite a friend</h3>
        <p>Share the link — they open it, enter any nickname + a 4-digit PIN, and appear in the leaderboard automatically. No imports needed.</p>
        <div class="q-invite-url">andresblitz.com/quiniela/</div>
      </div>

      <div class="q-share-block">
        <h3>Players (${all.length})</h3>
        <div class="q-pool-list">
          ${all.map(p => `
            <div class="q-pool-row">
              <span class="q-pool-name">${p.nick===STATE.nick?'⭐ ':''}${p.nick}</span>
              <span class="q-pool-picks">${Object.keys(p.preds||{}).length}/72 picks</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="q-share-block danger-zone">
        <h3>Account</h3>
        <p>Signed in as <strong>${STATE.nick}</strong> · your picks are saved to the cloud.</p>
        <button class="q-btn secondary sm" id="logout-btn" style="margin-right:8px">Log Out</button>
        <button class="q-btn danger sm" id="reset-btn">Delete My Account</button>
      </div>
    </div>`;
}

function bindShare() {
  document.getElementById('logout-btn')?.addEventListener('click', () => { logout(); toast('Logged out 👋'); });
  document.getElementById('reset-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete your account and all picks? This cannot be undone.')) return;
    await db.collection('players').doc(STATE.nick).delete().catch(() => {});
    logout();
    toast('Account deleted');
  });
}

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'q-toast'; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2800);
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.q-tab-btn').forEach(btn =>
    btn.addEventListener('click', () => navigate(btn.dataset.tab))
  );
  document.getElementById('q-app').innerHTML = '<div class="q-loading"><div class="q-loading-ball">⚽</div><div>Loading…</div></div>';

  const autoLogged = await tryAutoLogin();
  if (autoLogged) {
    startListeners();
    render();
    const ls = localStorage.getItem('q_lastsync');
    if (!ls || (Date.now() - new Date(ls)) > 5*60*1000) fetchLiveResults(false);
  } else {
    render();
  }
});
