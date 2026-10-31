// Fetches rates for a country tool, writes <slug>/rates.json and pre-renders the
// values into <slug>/index.html so crawlers and first paint see real numbers.
// Usage: node scripts/bake-rates.mjs [slug ...]   (default: all countries)
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { COUNTRIES } from './rates/countries.mjs';

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(COUNTRIES);
let failed = 0, changed = 0;
for (const slug of slugs) {
  const c = COUNTRIES[slug];
  if (!fs.existsSync(new URL(`../${slug}/index.html`, import.meta.url))) { console.log(slug, 'no page yet, skipped'); continue; }
  try {
    // Try each source in order (c.sources, or primary → backup) until one has all required keys.
    let data;
    for (const src of c.sources || [c.primary, c.backup]) {
      try { const d = await src(); if (!(c.required || c.keys).every((k) => d.rates[k]?.venta > 0)) throw new Error('incomplete'); data = d; break; }
      catch (e) { console.warn(slug, 'source failed:', e.message); }
    }
    if (!data) throw new Error('all sources failed');
    const rates = Object.fromEntries(c.keys.filter((k) => data.rates[k]?.venta > 0).map((k) => [k, data.rates[k]]));
    if (!(c.required || c.keys).every((k) => rates[k])) throw new Error('no data');
    const newest = Object.values(rates).map((r) => new Date(r.f).toISOString()).sort().pop();
    const json = { country: slug, currency: c.currency, base: 'USD', source: data.source, ...(data.label ? { label: data.label } : {}), updated: newest, rates };
    const jf = new URL(`../${slug}/rates.json`, import.meta.url);
    const prev = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : null;
    if (prev && JSON.stringify(prev.rates) === JSON.stringify(rates) && prev.source === data.source) { console.log(slug, 'unchanged'); continue; }
    fs.writeFileSync(jf, JSON.stringify(json, null, 1) + '\n');
    const nf = (n) => n == null ? '—' : '$ ' + n.toLocaleString(c.locale, { minimumFractionDigits: c.decimals ?? 2, maximumFractionDigits: c.decimals ?? 2 });
    const when = new Date(newest).toLocaleString(c.locale, { timeZone: c.timeZone, dateStyle: 'medium', timeStyle: 'short' });
    const hf = new URL(`../${slug}/index.html`, import.meta.url);
    let h = fs.readFileSync(hf, 'utf8');
    h = h.replace(/var FB=\{[\s\S]*?\};\/\*fb\*\//, `var FB=${JSON.stringify(json)};/*fb*/`)
      .replace(/("dateModified":")[^"]*(")/g, `$1${newest}$2`)
      .replace(/(<time data-upd datetime=")[^"]*(">)[^<]*(<\/time>)/g, `$1${newest}$2${when} (${c.tzLabel})$3`)
      .replace(/(<time data-vig datetime=")[^"]*(">)[^<]*(<\/time>)/g, (m, a, b, e) => `${a}${rates[c.keys[0]].f}${b}${new Date(rates[c.keys[0]].f).toLocaleDateString(c.locale, { timeZone: c.timeZone, dateStyle: 'long' })}${e}`)
      .replace(/(<span data-label>)[^<]*(<\/span>)/g, (m, a, e) => data.label ? `${a}${data.label}${e}` : m)
      .replace(/(<article class="card tasa[^"]*" data-k="mercado-[cv]")( hidden)?/g, (m, a) => rates.mercado ? a : `${a} hidden`)
      .replace(/(<span data-src>)[^<]*(<\/span>)/g, `$1${data.source}$2`)
      .replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${newest}$2`);
    for (const k of c.keys) {
      h = h.replace(new RegExp(`(data-bake="${k}-venta">)[^<]*(<)`, 'g'), `$1${nf(rates[k]?.venta)}$2`)
        .replace(new RegExp(`(data-bake="${k}-compra">)[^<]*(<)`, 'g'), `$1${nf(rates[k]?.compra)}$2`);
    }
    fs.writeFileSync(hf, h);
    changed++;
    console.log(slug, 'baked from', data.source, newest);
  } catch (e) { failed++; console.error(slug, 'FAILED:', e.message); }
}
// Keep the AI layer (each country's index.md, llms-full.txt, …) in sync with the baked HTML.
if (changed && !process.env.SKIP_AI) execSync('node scripts/build-ai.mjs', { cwd: new URL('..', import.meta.url), stdio: 'inherit' });
process.exit(failed ? 1 : 0);
