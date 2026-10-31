// Country rate-tool registry. Each entry drives scripts/bake-rates.mjs and the
// scheduled workflow .github/workflows/rates.yml. To add a country: add an entry,
// copy dolar-argentina/index.html as a starting template (keep the data-bake="<key>"
// placeholders, the `var FB=...;` line and the dateModified/data-upd hooks), run
//   node scripts/bake-rates.mjs <slug> && node scripts/build-ai.mjs
// (/tasa-bcv/ is intentionally separate and baked by scripts/bake-bcv.mjs.)
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); };
const getText = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.text(); };
// open.er-api.com (ExchangeRate-API) free endpoint: attribution required on the page.
const erApi = (cur, key = 'ref') => async () => {
  const j = await get('https://open.er-api.com/v6/latest/USD');
  if (j.result !== 'success' || !(j.rates?.[cur] > 0)) throw new Error('er-api bad data');
  return { source: 'open.er-api.com (ExchangeRate-API, tasa de mercado de referencia)', label: 'Dólar de referencia (mercado internacional)', rates: { [key]: { compra: null, venta: j.rates[cur], f: new Date(j.time_last_update_unix * 1000).toISOString() } } };
};
// fawazahmed0/currency-api via jsDelivr (keyless, daily reference): last-resort fallback.
const curApi = (cur, key = 'ref') => async () => {
  const j = await get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json');
  const v = Number(j.usd?.[cur.toLowerCase()]);
  if (!(v > 0)) throw new Error('currency-api bad data');
  return { source: 'currency-api (fawazahmed0, referencia diaria)', label: 'Tipo de cambio de referencia', rates: { [key]: { compra: null, venta: v, f: new Date(j.date + 'T12:00:00Z').toISOString() } } };
};
const dolarapiUsd = async (cc) => (await get(`https://${cc}.dolarapi.com/v1/cotizaciones`)).find((d) => d.moneda === 'USD');
const ts = (s) => new Date(s * 1000).toISOString();

export const COUNTRIES = {
  'dolar-argentina': {
    locale: 'es-AR', currency: 'ARS', timeZone: 'America/Argentina/Buenos_Aires', tzLabel: 'hora de Buenos Aires',
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
  'dolar-colombia': {
    locale: 'es-CO', currency: 'COP', timeZone: 'America/Bogota', tzLabel: 'hora de Colombia',
    keys: ['trm', 'mercado'], required: ['trm'],
    async primary() {
      const [t] = await get('https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC');
      const out = { trm: { compra: null, venta: Number(t.valor), f: `${t.vigenciadesde.slice(0, 19)}-05:00`, hasta: t.vigenciahasta?.slice(0, 10) } };
      try { const u = (await get('https://co.dolarapi.com/v1/cotizaciones')).find((d) => d.moneda === 'USD'); if (u) out.mercado = { compra: u.compra, venta: u.venta, f: u.fechaActualizacion }; } catch {}
      return { source: 'datos.gov.co (Superintendencia Financiera)', rates: out };
    },
    async backup() {
      const u = (await get('https://co.dolarapi.com/v1/cotizaciones')).find((d) => d.moneda === 'USD');
      return { source: 'co.dolarapi.com', rates: { trm: { compra: null, venta: u.ultimoCierre ?? u.venta, f: u.fechaActualizacion }, mercado: { compra: u.compra, venta: u.venta, f: u.fechaActualizacion } } };
    },
  },
  'dolar-mexico': {
    locale: 'es-MX', currency: 'MXN', timeZone: 'America/Mexico_City', tzLabel: 'hora del centro de México', decimals: 4,
    keys: ['ref', 'mercado'], required: ['ref'],
    sources: [
      async () => { const u = await dolarapiUsd('mx'); const f = `${u.fechaActualizacion.slice(0, 10)}T12:00:00-06:00`; // FIX is a daily value; keep the calendar date in Mexico
        return { source: 'mx.dolarapi.com (FIX de Banxico)', label: 'Tipo de cambio FIX (Banxico)', rates: { ref: { compra: null, venta: u.fix, f }, mercado: { compra: u.compra, venta: u.venta, f: u.fechaActualizacion } } }; },
      erApi('MXN'),
    ],
  },
  'dolar-peru': {
    locale: 'es-PE', currency: 'PEN', timeZone: 'America/Lima', tzLabel: 'hora de Lima', decimals: 4,
    keys: ['ref', 'mercado'], required: ['ref'],
    sources: [
      async () => { const u = await dolarapiUsd('pe'); return { source: 'pe.dolarapi.com', label: 'Tipo de cambio de cierre', rates: { ref: { compra: null, venta: u.ultimoCierre ?? u.venta, f: u.fechaActualizacion }, mercado: { compra: u.compra, venta: u.venta, f: u.fechaActualizacion } } }; },
      async () => {
        // BCRP series PD04640PD = tipo de cambio interbancario, venta (S/ por US$), daily.
        const end = new Date(), start = new Date(end - 15 * 864e5), d = (x) => x.toISOString().slice(0, 10);
        const t = await getText(`https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04640PD/json/${d(start)}/${d(end)}`);
        if (!t.trimStart().startsWith('{')) throw new Error('BCRP returned HTML (bot wall), skipped');
        const j = JSON.parse(t);
        const p = [...j.periods].reverse().find((x) => Number(x.values?.[0]) > 0);
        const M = { Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5, Jul: 6, Ago: 7, Set: 8, Sep: 8, Oct: 9, Nov: 10, Dic: 11 };
        const [dd, mm, yy] = p.name.split('.');
        const f = new Date(Date.UTC(2000 + Number(yy), M[mm], Number(dd), 5)).toISOString();
        return { source: 'BCRP (tipo de cambio interbancario)', label: 'Tipo de cambio interbancario BCRP (venta)', rates: { ref: { compra: null, venta: Number(p.values[0]), f } } };
      },
      erApi('PEN'),
      curApi('PEN'),
    ],
  },
  'dolar-chile': {
    locale: 'es-CL', currency: 'CLP', timeZone: 'America/Santiago', tzLabel: 'hora de Chile',
    keys: ['ref', 'mercado'], required: ['ref'],
    sources: [
      async () => {
        const [s] = (await get('https://mindicador.cl/api/dolar')).serie;
        const out = { ref: { compra: null, venta: s.valor, f: s.fecha } };
        try { const u = await dolarapiUsd('cl'); out.mercado = { compra: u.compra, venta: u.venta, f: u.fechaActualizacion }; } catch {}
        return { source: 'mindicador.cl (dólar observado, Banco Central de Chile)', label: 'Dólar observado (Banco Central de Chile)', rates: out };
      },
      async () => { const u = await dolarapiUsd('cl'); return { source: 'cl.dolarapi.com', label: 'Dólar de cierre de mercado', rates: { ref: { compra: null, venta: u.ultimoCierre ?? u.venta, f: u.fechaActualizacion }, mercado: { compra: u.compra, venta: u.venta, f: u.fechaActualizacion } } }; },
    ],
  },
};
