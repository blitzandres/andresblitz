// Source of truth for /70/: reads 70/business.json and rewrites the marked
// geo-meta + JSON-LD block in 70/index.html. Also supplies the AI-layer EXTRA.
import fs from 'node:fs';
import path from 'node:path';

const START = '<!-- el70-business:start -->';
const END = '<!-- el70-business:end -->';

export function loadEl70Business(root) {
  const file = path.join(root, '70/business.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function extraFromEl70(biz) {
  if (!biz) return null;
  const geo = biz.geo || {};
  const addr = biz.address || {};
  const place = [addr.nearby, addr.addressLocality, addr.addressRegion, 'Venezuela'].filter(Boolean).join(', ');
  const map = biz.hasMap ? ` Maps: ${biz.hasMap}.` : '';
  const social = (biz.sameAs || []).filter((u) => !/maps\.google/.test(u)).join(', ');
  const socialNote = social ? ` Social: ${social}.` : '';
  return {
    topics: ['El 70', 'El 70 farm', 'Finca El 70', 'Agropecuaria Blimar', 'ganadería', 'silvopastoreo', 'Carretera de Perijá', 'Rosario de Perijá', 'Zulia', 'Venezuela'],
    geo: { place, lat: geo.latitude, lng: geo.longitude },
    note: `El 70 farm (Finca El 70) — family cattle farm and silvopasture project (Spanish page with an English summary). ${addr.streetAddress}, near ${addr.nearby}, ${addr.addressLocality}, ${addr.addressRegion}, Venezuela. Geo: ${geo.latitude},${geo.longitude}.${map}${socialNote} Contact: ${biz.email}. Source: ${biz.url} and 70/business.json.`,
  };
}

function addressBlock(addr, indent) {
  const pad = ' '.repeat(indent);
  return `{
${pad} "@type": "PostalAddress",
${pad} "streetAddress": ${JSON.stringify(addr.streetAddress)},
${pad} "addressLocality": ${JSON.stringify(addr.addressLocality)},
${pad} "addressRegion": ${JSON.stringify(addr.addressRegion)},
${pad} "addressCountry": ${JSON.stringify(addr.addressCountry)}
${pad}}`;
}

function faqJson(faq, origin) {
  if (!faq?.length) return '';
  const els = faq.map((q, i) => `    {
     "@type": "Question",
     "@id": "${origin}/70/#faq-${i + 1}",
     "name": ${JSON.stringify(q.q)},
     "acceptedAnswer": {
      "@type": "Answer",
      "text": ${JSON.stringify(q.a)}
     }
    }`).join(',\n');
  return `  ,
  {
   "@type": "FAQPage",
   "@id": "${origin}/70/#faq",
   "url": "${origin}/70/#preguntas",
   "mainEntity": [
${els}
   ]
  }`;
}

export function renderEl70BusinessBlock(biz, origin = 'https://andresblitz.com') {
  const addr = biz.address;
  const geo = biz.geo;
  const sameAs = JSON.stringify(biz.sameAs || [], null, 1)
    .replace(/\n/g, '\n   ');
  const knows = JSON.stringify(biz.knowsAbout || [], null, 1)
    .replace(/\n/g, '\n   ');
  const dateMod = biz.dateModified ? `\n   "dateModified": ${JSON.stringify(biz.dateModified)},` : '';
  return `${START}
<meta name="geo.region" content="${addr.geoRegion}" />
<meta name="geo.placename" content="${addr.placeName}" />
<meta name="geo.position" content="${geo.latitude};${geo.longitude}" />
<meta name="ICBM" content="${geo.latitude}, ${geo.longitude}" />
<script type="application/ld+json">
{
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": ["Organization", "Farm"],
   "@id": "${origin}/70/#org",
   "name": ${JSON.stringify(biz.name)},
   "alternateName": ${JSON.stringify(biz.alternateName, null, 1).replace(/\n/g, '\n   ')},
   "legalName": ${JSON.stringify(biz.legalName)},
   "url": ${JSON.stringify(biz.url)},
   "description": ${JSON.stringify(biz.description)},${dateMod}
   "logo": {
    "@type": "ImageObject",
    "@id": "${origin}/70/img/logo-512.png#logo",
    "url": "${origin}/70/img/logo-512.png",
    "contentUrl": "${origin}/70/img/logo-512.png",
    "width": 512,
    "height": 512,
    "caption": "Logo de Agropecuaria Blimar"
   },
   "image": [
    { "@id": "${origin}/70/img/og-el70.jpg#img" },
    { "@id": "${origin}/70/img/potrero.jpg#img" },
    { "@id": "${origin}/70/img/patio-tractor.jpg#img" }
   ],
   "email": ${JSON.stringify(biz.email)},
   "address": ${addressBlock(addr, 4)},
   "geo": {
    "@type": "GeoCoordinates",
    "latitude": ${geo.latitude},
    "longitude": ${geo.longitude}
   },
   "location": { "@id": "${origin}/70/#place" },
   "hasMap": ${JSON.stringify(biz.hasMap)},
   "sameAs": ${sameAs},
   "areaServed": {
    "@type": "State",
    "name": "Zulia",
    "containedInPlace": { "@type": "Country", "name": "Venezuela" }
   },
   "knowsAbout": ${knows},
   "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": ${JSON.stringify(biz.email)},
    "availableLanguage": ["es", "en"]
   }
  },
  {
   "@type": "Place",
   "@id": "${origin}/70/#place",
   "name": "El 70 farm · Finca El 70 · Agropecuaria Blimar",
   "description": ${JSON.stringify(biz.description)},
   "address": ${addressBlock(addr, 4)},
   "geo": {
    "@type": "GeoCoordinates",
    "latitude": ${geo.latitude},
    "longitude": ${geo.longitude}
   },
   "hasMap": ${JSON.stringify(biz.hasMap)},
   "containedInPlace": {
    "@type": "City",
    "name": ${JSON.stringify(addr.nearby || addr.addressLocality)},
    "containedInPlace": {
     "@type": "AdministrativeArea",
     "name": ${JSON.stringify(addr.addressRegion)}
    }
   }
  },
  {
   "@type": "WebSite",
   "@id": "${origin}/#website",
   "url": "${origin}/",
   "name": "andresblitz.com"
  },
  {
   "@type": "WebPage",
   "@id": "${origin}/70/#webpage",
   "url": "${origin}/70/",
   "name": "Agropecuaria Blimar · El 70 farm, km 70 Perijá, Zulia",
   "description": "Agropecuaria Blimar · El 70 farm: finca familiar de ganadería y silvopastoreo en el km 70 Perijá, Rosario de Perijá, Zulia, Venezuela.",
   "inLanguage": "es-VE",
   "dateModified": ${JSON.stringify(biz.dateModified)},
   "isPartOf": { "@id": "${origin}/#website" },
   "about": { "@id": "${origin}/70/#org" },
   "mainEntity": { "@id": "${origin}/70/#org" },
   "contentLocation": { "@id": "${origin}/70/#place" },
   "primaryImageOfPage": { "@id": "${origin}/70/img/og-el70.jpg#img" },
   "breadcrumb": { "@id": "${origin}/70/#breadcrumb" },
   "keywords": "El 70 farm, Finca El 70, ganadería, silvopastoreo, silvopasture, Rosario de Perijá, La Villa del Rosario, Carretera de Perijá, Zulia, Río Palmar, Troncal 6"
  },
  {
   "@type": "BreadcrumbList",
   "@id": "${origin}/70/#breadcrumb",
   "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "${origin}/" },
    { "@type": "ListItem", "position": 2, "name": "Mapa del sitio", "item": "${origin}/site-map/" },
    { "@type": "ListItem", "position": 3, "name": "Agropecuaria Blimar · El 70 farm", "item": "${origin}/70/" }
   ]
  },
  {
   "@type": "ImageObject",
   "@id": "${origin}/70/img/og-el70.jpg#img",
   "contentUrl": "${origin}/70/img/og-el70.jpg",
   "url": "${origin}/70/img/og-el70.jpg",
   "width": 1200,
   "height": 630,
   "name": "Agropecuaria Blimar · El 70",
   "caption": "Agropecuaria Blimar · El 70 farm — km 70 Carretera de Perijá, La Villa del Rosario, Zulia, Venezuela",
   "description": "Agropecuaria Blimar · El 70 farm — km 70 Carretera de Perijá, La Villa del Rosario, Zulia, Venezuela",
   "inLanguage": "es-VE",
   "contentLocation": { "@id": "${origin}/70/#place" },
   "copyrightHolder": { "@id": "${origin}/70/#org" },
   "creditText": "Agropecuaria Blimar C.A.",
   "geo": { "@type": "GeoCoordinates", "latitude": ${geo.latitude}, "longitude": ${geo.longitude} }
  },
  {
   "@type": "ImageObject",
   "@id": "${origin}/70/img/potrero.jpg#img",
   "contentUrl": "${origin}/70/img/potrero.jpg",
   "url": "${origin}/70/img/potrero.jpg",
   "width": 700,
   "height": 525,
   "name": "Potreros de El 70",
   "caption": "Potrero con samán y cerca de alambre en Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia",
   "description": "Potrero con samán y cerca de alambre en Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia",
   "inLanguage": "es-VE",
   "contentLocation": { "@id": "${origin}/70/#place" },
   "copyrightHolder": { "@id": "${origin}/70/#org" },
   "creditText": "Agropecuaria Blimar C.A.",
   "geo": { "@type": "GeoCoordinates", "latitude": ${geo.latitude}, "longitude": ${geo.longitude} }
  },
  {
   "@type": "ImageObject",
   "@id": "${origin}/70/img/patio-tractor.jpg#img",
   "contentUrl": "${origin}/70/img/patio-tractor.jpg",
   "url": "${origin}/70/img/patio-tractor.jpg",
   "width": 700,
   "height": 525,
   "name": "Patio de El 70",
   "caption": "Tractor y remolque en el patio de Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia",
   "description": "Tractor y remolque en el patio de Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia",
   "inLanguage": "es-VE",
   "contentLocation": { "@id": "${origin}/70/#place" },
   "copyrightHolder": { "@id": "${origin}/70/#org" },
   "creditText": "Agropecuaria Blimar C.A.",
   "geo": { "@type": "GeoCoordinates", "latitude": ${geo.latitude}, "longitude": ${geo.longitude} }
  },
  {
   "@type": "ImageObject",
   "@id": "${origin}/70/img/mapa-estatico.jpg#img",
   "contentUrl": "${origin}/70/img/mapa-estatico.jpg",
   "url": "${origin}/70/img/mapa-estatico.jpg",
   "name": "Vista satelital de El 70",
   "caption": "Imagen satelital de la finca El 70 en el km 70 de la Carretera de Perijá, La Villa del Rosario, Zulia",
   "description": "Imagen satelital de la finca El 70 en el km 70 de la Carretera de Perijá, La Villa del Rosario, Zulia",
   "inLanguage": "es-VE",
   "contentLocation": { "@id": "${origin}/70/#place" },
   "copyrightHolder": { "@id": "${origin}/70/#org" },
   "creditText": "Agropecuaria Blimar C.A.",
   "geo": { "@type": "GeoCoordinates", "latitude": ${geo.latitude}, "longitude": ${geo.longitude} }
  }${faqJson(biz.faq, origin)}
 ]
}
</script>
${END}`;
}

export function applyEl70Business(root, origin = 'https://andresblitz.com') {
  const biz = loadEl70Business(root);
  if (!biz) return null;
  const htmlPath = path.join(root, '70/index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const block = renderEl70BusinessBlock(biz, origin);
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (re.test(html)) html = html.replace(re, () => block);
  else throw new Error('70/index.html is missing the el70-business markers');
  fs.writeFileSync(htmlPath, html);
  return { biz, extra: extraFromEl70(biz) };
}
