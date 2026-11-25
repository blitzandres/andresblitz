// Source of truth for /70/ and /70/en/: reads 70/business.json and rewrites the
// marked geo-meta + JSON-LD block in both HTML pages. Also supplies the AI-layer EXTRA.
// Use official schema.org types only: LocalBusiness + Organization.
// schema.org/Farm does not exist (404); Google local rich results expect LocalBusiness.
import fs from 'node:fs';
import path from 'node:path';

const START = '<!-- el70-business:start -->';
const END = '<!-- el70-business:end -->';

export function loadEl70Business(root) {
  const file = path.join(root, '70/business.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function extraFromEl70(biz, lang = 'es') {
  if (!biz) return null;
  const geo = biz.geo || {};
  const addr = biz.address || {};
  const place = [addr.addressLocality, addr.postalCode, addr.addressRegion, 'Venezuela'].filter(Boolean).join(', ');
  const formatted = addr.formatted || [addr.streetAddress, addr.addressLocality, addr.postalCode, addr.addressRegion, 'Venezuela'].filter(Boolean).join(', ');
  const map = biz.hasMap ? ` Maps: ${biz.hasMap}.` : '';
  const social = (biz.sameAs || []).filter((u) => !/maps\.google/.test(u)).join(', ');
  const socialNote = social ? ` Social: ${social}.` : '';
  const hoursNote = formatHoursNote(biz.openingHours);
  const alt = addr.alternateLocality ? ` Alternate locality / municipality: ${addr.alternateLocality}.` : '';
  const en = lang === 'en';
  const note = en
    ? `El 70 farm (Finca El 70) — family cattle ranch and silvopasture project. English page; Spanish original at ${biz.url}. ${formatted}.${alt}${hoursNote} Geo: ${geo.latitude},${geo.longitude}.${map}${socialNote} Contact: ${biz.email}. No public phone. Source: ${biz.url_en || 'https://andresblitz.com/70/en/'} and 70/business.json.`
    : `El 70 farm (Finca El 70) — family cattle farm and silvopasture project (Spanish page; full English version at ${biz.url_en || 'https://andresblitz.com/70/en/'}). ${formatted}.${alt}${hoursNote} Geo: ${geo.latitude},${geo.longitude}.${map}${socialNote} Contact: ${biz.email}. No public phone. Source: ${biz.url} and 70/business.json.`;
  return {
    topics: ['El 70', 'El 70 farm', 'Finca El 70', 'Agropecuaria Blimar', 'ganadería', 'silvopastoreo', 'silvopasture', 'cattle ranch', 'Carretera de Perijá', 'Villa del Rosario', 'Rosario de Perijá', 'Zulia', 'Venezuela'],
    geo: { place, lat: geo.latitude, lng: geo.longitude },
    note,
  };
}

function formatHoursNote(hours) {
  if (!hours?.length) return '';
  const bits = hours.map((h) => {
    const days = Array.isArray(h.dayOfWeek) ? h.dayOfWeek.join('/') : h.dayOfWeek;
    return `${days} ${h.opens}–${h.closes}`;
  });
  return ` Hours: ${bits.join('; ')}.`;
}

function addressBlock(addr, indent) {
  const pad = ' '.repeat(indent);
  const postal = addr.postalCode
    ? `
${pad} "postalCode": ${JSON.stringify(addr.postalCode)},`
    : '';
  return `{
${pad} "@type": "PostalAddress",
${pad} "streetAddress": ${JSON.stringify(addr.streetAddress)},
${pad} "addressLocality": ${JSON.stringify(addr.addressLocality)},${postal}
${pad} "addressRegion": ${JSON.stringify(addr.addressRegion)},
${pad} "addressCountry": ${JSON.stringify(addr.addressCountry)}
${pad}}`;
}

function hoursBlock(hours, indent) {
  if (!hours?.length) return '';
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 1);
  const keyPad = ' '.repeat(Math.max(indent - 1, 0));
  const specs = hours.map((h) => {
    return [
      '{',
      inner + '"@type": "OpeningHoursSpecification",',
      inner + '"dayOfWeek": ' + JSON.stringify(h.dayOfWeek) + ',',
      inner + '"opens": ' + JSON.stringify(h.opens) + ',',
      inner + '"closes": ' + JSON.stringify(h.closes),
      pad + '}',
    ].join('\n');
  }).join(',\n' + pad);
  return ',\n' + keyPad + '"openingHoursSpecification": [\n' + pad + specs + '\n' + keyPad + ']';
}

function servicesBlock(services, origin, indent) {
  if (!services?.length) return '';
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 1);
  const deeper = ' '.repeat(indent + 2);
  const keyPad = ' '.repeat(Math.max(indent - 1, 0));
  const offers = services.map((svc) => {
    const url = svc.url
      ? (svc.url.startsWith('http') ? svc.url : `${origin}${svc.url}`)
      : '';
    const urlLine = url ? `\n${deeper}"url": ${JSON.stringify(url)},` : '';
    return [
      '{',
      inner + '"@type": "Offer",',
      inner + '"itemOffered": {',
      deeper + '"@type": "Service",' + urlLine,
      deeper + '"name": ' + JSON.stringify(svc.name) + ',',
      deeper + '"description": ' + JSON.stringify(svc.description),
      inner + '}',
      pad + '}',
    ].join('\n');
  }).join(',\n' + pad);
  return ',\n' + keyPad + '"makesOffer": [\n' + pad + offers + '\n' + keyPad + ']';
}

function localizeServices(services, en) {
  if (!services) return [];
  return services.map((s) => ({
    name: en ? (s.name_en || s.name) : s.name,
    description: en ? (s.description_en || s.description) : s.description,
    url: en ? (s.url_en || s.url) : s.url,
  }));
}

function faqJson(faq, origin, pagePath, inLang, en) {
  if (!faq?.length) return '';
  const els = faq.map((q, i) => `    {
     "@type": "Question",
     "@id": "${origin}${pagePath}#faq-${i + 1}",
     "name": ${JSON.stringify(en ? (q.q_en || q.q) : q.q)},
     "acceptedAnswer": {
      "@type": "Answer",
      "text": ${JSON.stringify(en ? (q.a_en || q.a) : q.a)}
     }
    }`).join(',\n');
  return `  ,
  {
   "@type": "FAQPage",
   "@id": "${origin}${pagePath}#faq",
   "url": "${origin}${pagePath}#preguntas",
   "inLanguage": ${JSON.stringify(inLang)},
   "mainEntity": [
${els}
   ]
  }`;
}

const IMG = {
  logo: {
    es: 'Logo de Agropecuaria Blimar',
    en: 'Agropecuaria Blimar logo',
  },
  og: {
    es: {
      name: 'Agropecuaria Blimar · El 70',
      caption: 'Agropecuaria Blimar · El 70 farm — km 70 Carretera de Perijá, La Villa del Rosario, Zulia, Venezuela',
    },
    en: {
      name: 'Agropecuaria Blimar · El 70 farm',
      caption: 'Agropecuaria Blimar · El 70 farm — km 70 Carretera de Perijá, La Villa del Rosario, Zulia, Venezuela',
    },
  },
  potrero: {
    es: {
      name: 'Potreros de El 70',
      caption: 'Potrero con samán y cerca de alambre en Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia',
    },
    en: {
      name: 'Pastures at El 70',
      caption: 'Pasture with a saman tree and wire fence at Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia',
    },
  },
  patio: {
    es: {
      name: 'Patio de El 70',
      caption: 'Tractor y remolque en el patio de Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia',
    },
    en: {
      name: 'Yard at El 70',
      caption: 'Tractor and trailer in the yard at Agropecuaria Blimar (El 70), La Villa del Rosario, Zulia',
    },
  },
  sat: {
    es: {
      name: 'Vista satelital de El 70',
      caption: 'Imagen satelital de la finca El 70 en el km 70 de la Carretera de Perijá, La Villa del Rosario, Zulia',
    },
    en: {
      name: 'Satellite view of El 70',
      caption: 'Satellite image of El 70 farm at km 70 of Carretera de Perijá, La Villa del Rosario, Zulia',
    },
  },
  lots: {
    es: {
      name: 'Mapa de los lotes de El 70',
      caption: 'Linderos aproximados de Agropecuaria Blimar (El 70): lote mayor al norte de la Troncal 6 y lote menor al sur, hacia el Río Palmar, La Villa del Rosario, Zulia',
      description: 'Linderos aproximados de Agropecuaria Blimar (El 70): lote mayor al norte de la Troncal 6 y lote menor al sur, hacia el Río Palmar, La Villa del Rosario, Zulia. Trazado satelital, no es un plano catastral.',
      credit: 'Agropecuaria Blimar C.A. Imágenes © Esri, Maxar, Earthstar Geographics. Troncal 6: datos © OpenStreetMap.',
    },
    en: {
      name: 'Map of the El 70 lots',
      caption: 'Approximate boundaries of Agropecuaria Blimar (El 70): the larger lot north of Troncal 6 and the smaller lot south toward the Río Palmar, La Villa del Rosario, Zulia',
      description: 'Approximate boundaries of Agropecuaria Blimar (El 70): the larger lot north of Troncal 6 and the smaller lot south toward the Río Palmar, La Villa del Rosario, Zulia. Satellite tracing, not a cadastral plan.',
      credit: 'Agropecuaria Blimar C.A. Imagery © Esri, Maxar, Earthstar Geographics. Troncal 6: data © OpenStreetMap.',
    },
  },
};

function imageObject(id, contentUrl, size, copy, inLang, origin, geo, extra = {}) {
  const wh = size
    ? `
   "width": ${size[0]},
   "height": ${size[1]},`
    : '';
  const description = extra.description || copy.caption;
  const credit = extra.credit || 'Agropecuaria Blimar C.A.';
  return `  {
   "@type": "ImageObject",
   "@id": "${id}",
   "contentUrl": "${contentUrl}",
   "url": "${contentUrl}",${wh}
   "name": ${JSON.stringify(copy.name || copy.caption)},
   "caption": ${JSON.stringify(copy.caption)},
   "description": ${JSON.stringify(description)},
   "inLanguage": ${JSON.stringify(inLang)},
   "contentLocation": { "@id": "${origin}/70/#place" },
   "copyrightHolder": { "@id": "${origin}/70/#org" },
   "creditText": ${JSON.stringify(credit)},
   "geo": { "@type": "GeoCoordinates", "latitude": ${geo.latitude}, "longitude": ${geo.longitude} }
  }`;
}

export function renderEl70BusinessBlock(biz, origin = 'https://andresblitz.com', lang = 'es') {
  const en = lang === 'en';
  const loc = en ? 'en' : 'es';
  const inLang = en ? 'en' : 'es-VE';
  const pagePath = en ? '/70/en/' : '/70/';
  const otherPath = en ? '/70/' : '/70/en/';
  const desc = en ? (biz.description_en || biz.description) : biz.description;
  const pageTitle = en
    ? (biz.pageTitle_en || 'El 70 farm · Agropecuaria Blimar, Zulia, Venezuela')
    : (biz.pageTitle || 'Agropecuaria Blimar · El 70 farm, km 70 Perijá, Zulia');
  const pageDesc = en
    ? (biz.metaDescription_en || desc)
    : (biz.metaDescription || desc);
  const keywords = en
    ? (biz.keywords_en || 'El 70 farm, Agropecuaria Blimar, Zulia, Venezuela, cattle ranch, silvopasture, land for sale or lease, solar, oil and gas')
    : 'El 70 farm, Finca El 70, ganadería, silvopastoreo, silvopasture, Villa del Rosario, Villa del Rosario 4033, Rosario de Perijá, Carretera de Perijá, Zulia, Río Palmar, Troncal 6';
  const services = localizeServices(biz.services, en);
  const addr = biz.address;
  const geo = biz.geo;
  const sameAs = JSON.stringify(biz.sameAs || [], null, 1)
    .replace(/\n/g, '\n   ');
  const knows = JSON.stringify(biz.knowsAbout || [], null, 1)
    .replace(/\n/g, '\n   ');
  const dateMod = biz.dateModified ? `\n   "dateModified": ${JSON.stringify(biz.dateModified)},` : '';
  const transKey = en ? 'translationOfWork' : 'workTranslation';
  const crumbHome = en ? 'Home' : 'Inicio';
  const crumbMap = en ? 'Site map' : 'Mapa del sitio';
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
   "@type": ["LocalBusiness", "Organization"],
   "@id": "${origin}/70/#org",
   "name": ${JSON.stringify(biz.name)},
   "alternateName": ${JSON.stringify(biz.alternateName, null, 1).replace(/\n/g, '\n   ')},
   "legalName": ${JSON.stringify(biz.legalName)},
   "url": ${JSON.stringify(biz.url)},
   "description": ${JSON.stringify(desc)},${dateMod}
   "logo": {
    "@type": "ImageObject",
    "@id": "${origin}/70/img/logo-512.png#logo",
    "url": "${origin}/70/img/logo-512.png",
    "contentUrl": "${origin}/70/img/logo-512.png",
    "width": 512,
    "height": 512,
    "caption": ${JSON.stringify(IMG.logo[loc])}
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
   }${servicesBlock(services, origin, 4)}${hoursBlock(biz.openingHours, 4)}
  },
  {
   "@type": "Place",
   "@id": "${origin}/70/#place",
   "name": "El 70 farm · Finca El 70 · Agropecuaria Blimar",
   "description": ${JSON.stringify(desc)},
   "address": ${addressBlock(addr, 4)},
   "geo": {
    "@type": "GeoCoordinates",
    "latitude": ${geo.latitude},
    "longitude": ${geo.longitude}
   },
   "containedInPlace": {
    "@type": "City",
    "name": ${JSON.stringify(addr.addressLocality)},
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
   "@id": "${origin}${pagePath}#webpage",
   "url": "${origin}${pagePath}",
   "name": ${JSON.stringify(pageTitle)},
   "description": ${JSON.stringify(pageDesc)},
   "inLanguage": ${JSON.stringify(inLang)},
   "dateModified": ${JSON.stringify(biz.dateModified)},
   "isPartOf": { "@id": "${origin}/#website" },
   "about": { "@id": "${origin}/70/#org" },
   "mainEntity": { "@id": "${origin}/70/#org" },
   "contentLocation": { "@id": "${origin}/70/#place" },
   "primaryImageOfPage": { "@id": "${origin}/70/img/og-el70.jpg#img" },
   "breadcrumb": { "@id": "${origin}${pagePath}#breadcrumb" },
   "${transKey}": { "@id": "${origin}${otherPath}#webpage" },
   "keywords": ${JSON.stringify(keywords)}
  },
  {
   "@type": "BreadcrumbList",
   "@id": "${origin}${pagePath}#breadcrumb",
   "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(crumbHome)}, "item": "${origin}/" },
    { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(crumbMap)}, "item": "${origin}/site-map/" },
    { "@type": "ListItem", "position": 3, "name": "Agropecuaria Blimar · El 70 farm", "item": "${origin}${pagePath}" }
   ]
  },
${imageObject(`${origin}/70/img/og-el70.jpg#img`, `${origin}/70/img/og-el70.jpg`, [1200, 630], IMG.og[loc], inLang, origin, geo)},
${imageObject(`${origin}/70/img/potrero.jpg#img`, `${origin}/70/img/potrero.jpg`, [700, 525], IMG.potrero[loc], inLang, origin, geo)},
${imageObject(`${origin}/70/img/patio-tractor.jpg#img`, `${origin}/70/img/patio-tractor.jpg`, [700, 525], IMG.patio[loc], inLang, origin, geo)},
${imageObject(`${origin}/70/img/mapa-estatico.jpg#img`, `${origin}/70/img/mapa-estatico.jpg`, null, IMG.sat[loc], inLang, origin, geo)},
${imageObject(`${origin}/70/img/mapa-lotes.jpg#img`, `${origin}/70/img/mapa-lotes.jpg`, [1400, 1600], { name: IMG.lots[loc].name, caption: IMG.lots[loc].caption }, inLang, origin, geo, { description: IMG.lots[loc].description, credit: IMG.lots[loc].credit })}${faqJson(biz.faq, origin, pagePath, inLang, en)}
 ]
}
</script>
${END}`;
}

export function applyEl70Business(root, origin = 'https://andresblitz.com') {
  const biz = loadEl70Business(root);
  if (!biz) return null;
  const pages = [
    ['70/index.html', 'es'],
    ['70/en/index.html', 'en'],
  ];
  for (const [rel, lang] of pages) {
    const htmlPath = path.join(root, rel);
    if (!fs.existsSync(htmlPath)) {
      if (lang === 'es') throw new Error('70/index.html is missing the el70-business markers');
      continue;
    }
    let html = fs.readFileSync(htmlPath, 'utf8');
    const block = renderEl70BusinessBlock(biz, origin, lang);
    const re = new RegExp(`${START}[\\s\\S]*?${END}`);
    if (re.test(html)) html = html.replace(re, () => block);
    else throw new Error(`${rel} is missing the el70-business markers`);
    fs.writeFileSync(htmlPath, html);
  }
  return { biz, extra: extraFromEl70(biz, 'es'), extraEn: extraFromEl70(biz, 'en') };
}
