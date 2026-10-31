// Bakes monthly USD exchange-rate history for /ahorro-en-dolares/ (historical only, no projections).
// Sources (free, keyless, dated):
//  - fawazahmed0/currency-api dated snapshots (jsDelivr, mirror currency-api.pages.dev): VES, COP, MXN, PEN, CLP, CAD, first available day of each month since 2024-03.
//    Spot-checked against official series: TRM (datos.gov.co) 2025-10-01 3923.55 vs 3923.76; Bank of Canada 1.3940 vs 1.3924; Banco Central de Chile 962.39 vs 961.81; BCV 2026-10-30 889.26 vs 887.73.
//  - ArgentinaDatos (api.argentinadatos.com): ARS oficial and blue, daily "venta" (the currency-api ARS value is a wholesale reference that differs from the retail official rate).
// Only missing months are fetched; a failed fetch keeps existing data. Writes ahorro-en-dolares/history.json and the page's `var H=...;/*hist*/`.
import fs from 'node:fs';
const R = (p) => new URL(`../${p}`, import.meta.url);
const HF = R('ahorro-en-dolares/history.json'), PAGE = R('ahorro-en-dolares/index.html');
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': 'andresblitz.com savings history' }, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); };
const H = fs.existsSync(HF) ? JSON.parse(fs.readFileSync(HF, 'utf8')) : { months: {}, ar: { oficial: {}, blue: {} } };
const CUR = ['ves', 'cop', 'mxn', 'pen', 'clp', 'cad'];
const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();
let fetched = 0, failed = 0;
for (let d = new Date(Date.UTC(2024, 2, 1)); d <= now; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
  const ym = iso(d).slice(0, 7);
  if (H.months[ym]) continue;
  let got = null;
  for (let day = 1; day <= 6 && !got; day++) {
    const ds = `${ym}-${String(day).padStart(2, '0')}`;
    if (new Date(ds) > now) break;
    for (const u of [`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${ds}/v1/currencies/usd.min.json`, `https://${ds}.currency-api.pages.dev/v1/currencies/usd.min.json`]) {
      try { const j = await get(u); if (j.date === ds && CUR.every((c) => j.usd?.[c] > 0)) { got = { d: ds, ...Object.fromEntries(CUR.map((c) => [c, +j.usd[c].toPrecision(8)])) }; break; } } catch {}
    }
  }
  if (got) { H.months[ym] = got; fetched++; } else failed++;
}
// Argentina: refresh at most every 20 h.
if (!H.arFetched || Date.now() - Date.parse(H.arFetched) > 20 * 36e5) {
  try {
    for (const casa of ['oficial', 'blue']) {
      const rows = await get(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`);
      const m = {};
      for (const r of rows) if (r.fecha >= '2024-03-01' && r.venta > 0) { const ym = r.fecha.slice(0, 7); if (!m[ym] || r.fecha < m[ym].d) m[ym] = { d: r.fecha, v: r.venta }; }
      if (Object.keys(m).length < 6) throw new Error(`argentinadatos ${casa}: too few rows`);
      H.ar[casa] = m;
    }
    H.arFetched = new Date().toISOString();
  } catch (e) { console.warn('ahorro: argentinadatos failed, kept previous:', e.message); }
}
const json = JSON.stringify(H);
if (!fs.existsSync(HF) || fs.readFileSync(HF, 'utf8').trim() !== JSON.stringify(H, null, 1)) fs.writeFileSync(HF, JSON.stringify(H, null, 1) + '\n');
if (fs.existsSync(PAGE)) {
  const pts = {};
  for (const [ym, m] of Object.entries(H.months)) for (const c of CUR) (pts[c] ||= {})[ym] = [m.d, m[c]];
  for (const casa of ['oficial', 'blue']) for (const [ym, x] of Object.entries(H.ar[casa] || {})) (pts[casa === 'oficial' ? 'ars' : 'arsb'] ||= {})[ym] = [x.d, x.v];
  const html = fs.readFileSync(PAGE, 'utf8');
  const next = html.replace(/var H=\{.*?\};\/\*hist\*\//, () => `var H=${JSON.stringify(pts)};/*hist*/`);
  if (next !== html) { fs.writeFileSync(PAGE, next); console.log('ahorro: page history updated'); }
}
console.log(`ahorro: ${Object.keys(H.months).length} months (${fetched} fetched, ${failed} missing), AR oficial ${Object.keys(H.ar.oficial || {}).length} / blue ${Object.keys(H.ar.blue || {}).length}`);
