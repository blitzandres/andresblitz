// Bakes the latest official BCV USD/EUR rate into /tasa-bcv/index.html as a static
// fallback (shown instantly before the live fetch). Run: node scripts/bake-bcv.mjs
import fs from 'node:fs';
const F = new URL('../tasa-bcv/index.html', import.meta.url);
const get = async u => { const r = await fetch(u, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(u); return r.json(); };
const [u, e] = await Promise.all([get('https://ve.dolarapi.com/v1/dolares/oficial'), get('https://ve.dolarapi.com/v1/euros/oficial')]);
if (!(u.promedio > 0 && e.promedio > 0)) throw new Error('bad data');
const fb = { USD: u.promedio, EUR: e.promedio, f: u.fechaActualizacion };
const nf = n => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
let h = fs.readFileSync(F, 'utf8');
h = h.replace(/var FB=\{[^}]*\};/, `var FB=${JSON.stringify(fb)};`)
  .replace(/(<p class="v" data-v data-bake="USD">)[^<]*(<\/p>)/, `$1${nf(fb.USD)}$2`)
  .replace(/(<p class="v" data-v data-bake="EUR">)[^<]*(<\/p>)/, `$1${nf(fb.EUR)}$2`);
fs.writeFileSync(F, h);
console.log('baked', fb);
