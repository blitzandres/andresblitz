// Country rate-tool registry. Each entry drives scripts/bake-rates.mjs and the
// scheduled workflow .github/workflows/rates.yml. To add a country: add an entry,
// copy dolar-argentina/index.html as a starting template (keep the data-bake="<key>"
// placeholders, the `var FB=...;` line and the dateModified/data-upd hooks), run
//   node scripts/bake-rates.mjs <slug> && node scripts/build-ai.mjs
// (/tasa-bcv/ is intentionally separate and baked by scripts/bake-bcv.mjs.)
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); };
const ts = (s) => new Date(s * 1000).toISOString();

export const COUNTRIES = {
  'dolar-argentina': {
    locale: 'es-AR', currency: 'ARS', timeZone: 'America/Argentina/Buenos_Aires',
    source: 'dolarapi.com',
    keys: ['oficial', 'blue', 'mep', 'ccl', 'cripto', 'tarjeta'],
    async primary() {
      const map = { oficial: 'oficial', blue: 'blue', bolsa: 'mep', contadoconliqui: 'ccl', cripto: 'cripto', tarjeta: 'tarjeta' };
      const out = {};
      for (const d of await get('https://dolarapi.com/v1/dolares')) if (map[d.casa]) out[map[d.casa]] = { compra: d.compra ?? null, venta: d.venta, f: d.fechaActualizacion };
      return { source: 'dolarapi.com', rates: out };
    },
    async backup() {
      const j = await get('https://criptoya.com/api/dolar');
      const r = (o) => o && { compra: o.bid ?? null, venta: o.ask ?? o.price, f: ts(o.timestamp) };
      return { source: 'criptoya.com', rates: { oficial: r(j.oficial), blue: r(j.blue), mep: r(j.mep?.al30?.ci), ccl: r(j.ccl?.al30?.ci), cripto: r(j.cripto?.usdt), tarjeta: r(j.tarjeta) } };
    },
  },
};
