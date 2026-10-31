// Fetches rates for a country tool, writes <slug>/rates.json and pre-renders the
// values into <slug>/index.html so crawlers and first paint see real numbers.
// Usage: node scripts/bake-rates.mjs [slug ...]   (default: all countries)
import fs from 'node:fs';
import { COUNTRIES } from './rates/countries.mjs';

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(COUNTRIES);
let failed = 0;
for (const slug of slugs) {
  const c = COUNTRIES[slug];
  try {
    let data;
    try { data = await c.primary(); if (!c.keys.every((k) => data.rates[k]?.venta > 0)) throw new Error('incomplete'); }
    catch (e) { console.warn(slug, 'primary failed:', e.message, '→ backup'); data = await c.backup(); }
    const rates = Object.fromEntries(c.keys.filter((k) => data.rates[k]?.venta > 0).map((k) => [k, data.rates[k]]));
    if (!rates[c.keys[0]]) throw new Error('no data');
    const newest = Object.values(rates).map((r) => r.f).sort().pop();
    const json = { country: slug, currency: c.currency, base: 'USD', source: data.source, updated: newest, rates };
    const jf = new URL(`../${slug}/rates.json`, import.meta.url);
    const prev = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : null;
    if (prev && JSON.stringify(prev.rates) === JSON.stringify(rates)) { console.log(slug, 'unchanged'); continue; }
    fs.writeFileSync(jf, JSON.stringify(json, null, 1) + '\n');
    const nf = (n) => n == null ? '—' : '$ ' + n.toLocaleString(c.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const when = new Date(newest).toLocaleString(c.locale, { timeZone: c.timeZone, dateStyle: 'medium', timeStyle: 'short' });
    const hf = new URL(`../${slug}/index.html`, import.meta.url);
    let h = fs.readFileSync(hf, 'utf8');
    h = h.replace(/var FB=\{[\s\S]*?\};\/\*fb\*\//, `var FB=${JSON.stringify(json)};/*fb*/`)
      .replace(/("dateModified":")[^"]*(")/g, `$1${newest}$2`)
      .replace(/(<time data-upd datetime=")[^"]*(">)[^<]*(<\/time>)/g, `$1${newest}$2${when} (hora de Buenos Aires)$3`)
      .replace(/(<span data-src>)[^<]*(<\/span>)/g, `$1${data.source}$2`)
      .replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${newest}$2`);
    for (const k of c.keys) {
      h = h.replace(new RegExp(`(data-bake="${k}-venta">)[^<]*(<)`, 'g'), `$1${nf(rates[k]?.venta)}$2`)
        .replace(new RegExp(`(data-bake="${k}-compra">)[^<]*(<)`, 'g'), `$1${nf(rates[k]?.compra)}$2`);
    }
    fs.writeFileSync(hf, h);
    console.log(slug, 'baked from', data.source, newest);
  } catch (e) { failed++; console.error(slug, 'FAILED:', e.message); }
}
process.exit(failed ? 1 : 0);
