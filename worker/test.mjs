import w from './src/index.js';
const t = async (p, m='GET') => (await w.fetch(new Request('https://x'+p,{method:m})));
let r = await t('/api'); if (r.status!==200||r.headers.get('x-content-type-options')!=='nosniff') throw 'root';
if ((await t('/api/page?path=../x')).status!==400) throw 'trav';
if ((await t('/api/page?path=/dashboard/')).status!==400) throw 'block';
if ((await t('/api','POST')).status!==405) throw 'ro';
console.log('ok');
