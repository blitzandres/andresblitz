# Generates a country rate page (MX/PE/CL template) from the C registry below.
# Usage (from repo root): python3 scripts/rates/gen-country-page.py <slug> <comma list of live slugs>
# Baked values (FB, dateModified, timestamps) are filled by scripts/bake-rates.mjs on the next run.
import json,sys,html
C={
'dolar-mexico':dict(lang='es-MX',og='es_MX',cur='MXN',curname='pesos mexicanos',tz='America/Mexico_City',tzl='hora del centro de México',
 title='Dólar hoy en México: tipo de cambio FIX de Banxico y conversor',
 desc='Tipo de cambio FIX del Banco de México para hoy, precio de compra y venta del dólar en el mercado y conversor de pesos mexicanos a dólares.',
 h1='Dólar hoy en México: FIX de Banxico y precio de ventanilla',
 sub='El tipo de cambio FIX que publica el Banco de México y una cotización de mercado de compra y venta, en pesos mexicanos (MXN).',
 reflabel='Tipo de cambio FIX (Banxico)',refsub='pesos por 1 dólar · fecha',src='mx.dolarapi.com (FIX de Banxico)',
 credit=True,
 explainh='Qué es el tipo de cambio FIX y para qué sirve',
 explain='''<p>México opera con un tipo de cambio <strong>flotante</strong>: el valor del peso frente al dólar se determina libremente en el mercado. Para contar con una referencia diaria, el <strong>Banco de México (Banxico)</strong> calcula el <strong>tipo de cambio FIX</strong>.</p>
  <p>Banxico lo obtiene en días hábiles a partir de un promedio de cotizaciones del mercado de cambios al mayoreo para operaciones liquidables el segundo día hábil siguiente. Se publica alrededor del mediodía y, al día hábil siguiente, aparece en el Diario Oficial de la Federación (DOF).</p>
  <p>Ese valor publicado en el DOF es el que se usa para <strong>solventar obligaciones en dólares pagaderas en México</strong>, y es la referencia habitual en contratos, facturas y trámites fiscales. En bancos, casas de cambio y aplicaciones el precio de ventanilla incluye un margen, por lo que comprar dólares cuesta algo más que el FIX y venderlos rinde algo menos.</p>''',
 faq=[('¿Qué es el tipo de cambio FIX?','Es el tipo de cambio de referencia que determina el Banco de México cada día hábil con base en cotizaciones del mercado mayorista de divisas. Sirve como valor oficial de referencia del peso mexicano frente al dólar.'),
 ('¿Cuál es la diferencia entre el FIX y el tipo de cambio del DOF?','El FIX se calcula y difunde el mismo día; el Diario Oficial de la Federación lo publica al día hábil siguiente, y desde esa publicación se aplica para pagar obligaciones en dólares dentro de México.'),
 ('¿Por qué el banco me cobra más que el FIX?','Los bancos y casas de cambio fijan sus propios precios de compra y venta y añaden un margen por la operación. El FIX es un promedio del mercado al mayoreo, no un precio al público.'),
 ('¿El tipo de cambio cambia los fines de semana?','El mercado mayorista no opera sábados, domingos ni días festivos bancarios, así que el FIX se mantiene en el último valor publicado hasta el siguiente día hábil.'),
 ('¿De dónde salen los datos de esta página?','Del FIX de Banxico vía mx.dolarapi.com, que se consulta aproximadamente cada 30 minutos. Si esa fuente no responde, se muestra una tasa de mercado de referencia de ExchangeRate-API y la etiqueta de la tarjeta lo indica.'),
 ('¿Puedo usar el conversor para facturar?','Es una herramienta informativa. Para facturación o pagos formales consulta el valor publicado en el DOF o el que indique tu banco.')]),
'dolar-peru':dict(lang='es-PE',og='es_PE',cur='PEN',curname='soles',tz='America/Lima',tzl='hora de Lima',
 title='Dólar hoy en Perú: tipo de cambio en soles y conversor',
 desc='Tipo de cambio del dólar hoy en Perú en soles (S/), con la fuente indicada en cada actualización, explicación del tipo de cambio interbancario y conversor de soles a dólares.',
 h1='Dólar hoy en Perú: tipo de cambio en soles',
 sub='Cuántos soles (PEN) cuesta un dólar estadounidense hoy, con la fuente de cada dato a la vista.',
 reflabel='Tipo de cambio',refsub='soles por 1 dólar · fecha',src='open.er-api.com',
 credit=True,
 explainh='Cómo se forma el tipo de cambio en Perú',
 explain='''<p>El sol peruano tiene un régimen de <strong>flotación administrada</strong>: el precio del dólar lo fijan la oferta y la demanda, pero el <strong>Banco Central de Reserva del Perú (BCRP)</strong> interviene comprando o vendiendo divisas para suavizar movimientos bruscos, sin defender un nivel determinado.</p>
  <p>La referencia más seguida es el <strong>tipo de cambio interbancario</strong>, el precio al que bancos y otras entidades negocian dólares entre sí. El BCRP lo publica a diario junto con el promedio de compra y venta del sistema bancario que la SBS usa como referencia contable.</p>
  <p>Perú es una economía con alto uso del dólar en ahorros, alquileres y créditos, por eso las ventanillas bancarias, las casas de cambio y los cambistas ofrecen precios de compra y venta propios. Esta página indica siempre de qué fuente proviene la cifra: cuando las fuentes locales no responden, se muestra una tasa de mercado internacional de referencia y la tarjeta lo dice expresamente.</p>''',
 faq=[('¿Qué es el tipo de cambio interbancario?','Es el precio al que se negocian dólares entre bancos y entidades financieras en el mercado mayorista. El Banco Central de Reserva del Perú lo publica diariamente y es la referencia principal del sol frente al dólar.'),
 ('¿El BCRP fija el precio del dólar?','No. El precio surge del mercado. El BCRP puede intervenir para reducir la volatilidad, pero no establece un tipo de cambio oficial obligatorio.'),
 ('¿Qué tipo de cambio uso para la SUNAT?','Para obligaciones tributarias se usa el tipo de cambio promedio ponderado publicado por la SBS. Verifica el valor correspondiente a la fecha de tu operación en la fuente oficial.'),
 ('¿Por qué la casa de cambio me da otro precio?','Cada casa de cambio, banco o cambista define su precio de compra y de venta con un margen propio, que además varía durante el día.'),
 ('¿Qué fuente usa esta página?','Un proceso automático intenta primero pe.dolarapi.com y luego el BCRP. Si ninguno responde, usa la tasa de mercado de ExchangeRate-API (open.er-api.com). La etiqueta de la tarjeta y la línea de fuente muestran siempre cuál se usó.'),
 ('¿Es una recomendación para cambiar dinero?','No. Es información de referencia; confirma el precio final con tu banco o casa de cambio antes de operar.')]),
'dolar-chile':dict(lang='es-CL',og='es_CL',cur='CLP',curname='pesos chilenos',tz='America/Santiago',tzl='hora de Chile',
 title='Dólar hoy en Chile: dólar observado y conversor de pesos',
 desc='Dólar observado de hoy en Chile según el Banco Central, precio de compra y venta en el mercado y conversor de pesos chilenos a dólares.',
 h1='Dólar hoy en Chile: dólar observado y precio de mercado',
 sub='El dólar observado que informa el Banco Central de Chile y una cotización de compra y venta del mercado, en pesos chilenos (CLP).',
 reflabel='Dólar observado (Banco Central de Chile)',refsub='pesos por 1 dólar · fecha',src='mindicador.cl (dólar observado, Banco Central de Chile)',
 credit=False,
 explainh='Qué es el dólar observado',
 explain='''<p>Chile mantiene un régimen de <strong>tipo de cambio flotante</strong> desde 1999: el peso se transa libremente y el Banco Central solo interviene en situaciones excepcionales.</p>
  <p>El <strong>dólar observado</strong> es el promedio de las operaciones de compra y venta de dólares realizadas por las empresas bancarias en el mercado cambiario formal durante un día hábil. El <strong>Banco Central de Chile</strong> lo calcula y lo publica en el Diario Oficial, y rige para el día hábil siguiente.</p>
  <p>Se usa como referencia legal para convertir obligaciones en moneda extranjera, en contratos, aduanas y documentos tributarios del SII. El precio que ves en una casa de cambio o en el banco es distinto: depende de la oferta en ese momento y del margen de cada institución.</p>''',
 faq=[('¿Qué es el dólar observado?','Es el tipo de cambio promedio de las transacciones de dólares realizadas por los bancos en el mercado cambiario formal durante el día hábil anterior. Lo calcula y publica el Banco Central de Chile.'),
 ('¿Para qué se usa el dólar observado?','Es la referencia para convertir a pesos obligaciones pactadas en dólares, para trámites aduaneros y para documentos tributarios, entre otros usos legales y contables.'),
 ('¿Por qué el dólar observado no coincide con la casa de cambio?','El dólar observado es un promedio del día anterior en el mercado interbancario. Las casas de cambio y bancos cotizan en tiempo real y agregan su margen entre compra y venta.'),
 ('¿Qué pasa con el dólar observado el fin de semana?','Como el mercado formal no opera sábados, domingos ni festivos, se mantiene el último valor publicado hasta el siguiente día hábil.'),
 ('¿De dónde vienen los datos?','El dólar observado proviene de mindicador.cl, que replica la información del Banco Central de Chile, y la cotización de mercado de cl.dolarapi.com. Se actualiza aproximadamente cada 30 minutos.'),
 ('¿Puedo usar estos valores para operar?','Son valores informativos. Antes de cambiar dinero confirma el precio en tu banco o casa de cambio.')]),
}
LINKS=[('dolar-argentina','Dólar Argentina','Dólar hoy en Argentina: oficial, blue, MEP y CCL'),('dolar-colombia','Dólar Colombia','Dólar hoy en Colombia: TRM y conversor de pesos'),('dolar-mexico','Dólar México','Dólar hoy en México: FIX de Banxico'),('dolar-peru','Dólar Perú','Dólar hoy en Perú: tipo de cambio en soles'),('dolar-chile','Dólar Chile','Dólar hoy en Chile: dólar observado')]
slug=sys.argv[1];live=sys.argv[2].split(',');c=C[slug];E=html.escape
others=[l for l in LINKS if l[0]!=slug and l[0] in live]
faqld=json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in c['faq']]},ensure_ascii=False,separators=(',',':'))
wp=json.dumps({"@context":"https://schema.org","@type":"WebPage","name":c['title'],"url":f"https://andresblitz.com/{slug}/","inLanguage":c['lang'],"datePublished":"2026-10-31","dateModified":"","author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
credit=' Respaldo: <a href="https://www.exchangerate-api.com" rel="noopener">Rates By Exchange Rate API</a>.' if c['credit'] else ''
out=f'''<!doctype html>
<html lang="{c['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(c['title'])}</title>
<meta name="description" content="{E(c['desc'])}">
<link rel="canonical" href="https://andresblitz.com/{slug}/">
<link rel="alternate" hreflang="{c['lang']}" href="https://andresblitz.com/{slug}/">
<link rel="alternate" hreflang="x-default" href="https://andresblitz.com/{slug}/">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="format-detection" content="telephone=no">
<meta name="author" content="Andrés Blitz">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#05070f">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="article">
<meta property="og:locale" content="{c['og']}">
<meta property="og:site_name" content="andresblitz.com">
<meta property="og:title" content="{E(c['title'])}">
<meta property="og:description" content="{E(c['desc'])}">
<meta property="og:url" content="https://andresblitz.com/{slug}/">
<meta property="og:image" content="https://andresblitz.com/assets/og-cover.png">
<meta property="article:modified_time" content="">
<link rel="alternate" type="application/rss+xml" title="Feed de tasas" href="https://andresblitz.com/rates/feed.xml">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{wp}</script>
<script type="application/ld+json">{faqld}</script>
<style>
:root{{--bg:#05070f;--panel:#0b0f1c;--line:#1a2135;--text:#e7eaf2;--mute:#9aa3b8;--acc:#7fc8a9;--pad:clamp(12px,4vw,20px)}}
*{{box-sizing:border-box}}html{{-webkit-text-size-adjust:100%;text-size-adjust:100%}}
body{{margin:0;background:var(--bg);color:var(--text);font:clamp(14.5px,3.9vw,16px)/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;overflow-x:hidden}}
a{{color:var(--acc)}}
main{{max-width:760px;margin:0 auto;padding:clamp(10px,4vw,40px) var(--pad) 40px}}
h1{{font-size:clamp(18px,5vw,32px);line-height:1.2;margin:0 0 4px;letter-spacing:-.01em}}
h2{{font-size:clamp(16px,4.4vw,20px);margin:28px 0 10px}}
.sub,.mute{{color:var(--mute)}}.sub{{font-size:clamp(12.5px,3.4vw,15px);margin:0}}
.sr{{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}
.card{{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:clamp(10px,3vw,18px)}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 0}}
.tasa{{min-width:0;padding:10px 12px}}.tasa.big{{grid-column:1/-1}}.tasa[hidden]{{display:none}}
.tasa h3{{font-size:clamp(11.5px,3.2vw,13px);color:var(--mute);font-weight:400;margin:0}}
.tasa .v{{font-size:clamp(19px,5.8vw,28px);font-weight:650;line-height:1.15;margin:2px 0 0;font-variant-numeric:tabular-nums;white-space:nowrap}}
.tasa.big .v{{font-size:clamp(26px,8vw,40px)}}
.tasa .s{{font-size:clamp(11px,3vw,12.5px);color:var(--mute);margin:1px 0 0;font-variant-numeric:tabular-nums}}
.fuente{{font-size:12.5px;color:var(--mute);margin:8px 0 0;min-height:1.4em}}
.calc label{{font-size:12.5px;color:var(--mute);display:block;margin:8px 0 3px}}
.calc input,.calc select{{min-height:44px;width:100%;min-width:0;background:#05070f;color:var(--text);border:1px solid #2c3550;border-radius:10px;padding:8px 12px;font:inherit;font-size:16px;font-variant-numeric:tabular-nums}}
.nota{{font-size:12.5px;color:var(--mute);margin:6px 0 0}}
details{{border-bottom:1px solid var(--line);padding:8px 0}}summary{{cursor:pointer;font-weight:600}}summary h3{{display:inline;font-size:inherit;margin:0}}details p{{margin:6px 0 0}}
footer{{max-width:760px;margin:0 auto;padding:0 var(--pad) 20px;color:var(--mute);font-size:13px}}
</style>
</head>
<body>
<main id="contenido">
<header>
  <h1>{E(c['h1'])}</h1>
  <p class="sub">{E(c['sub'])}</p>
</header>

<section id="cotizaciones" aria-labelledby="h-cot">
  <h2 id="h-cot" class="sr">{E(c['h1'])}</h2>
  <div class="grid">
    <article class="card tasa big" data-k="ref"><h3><span data-label>{E(c['reflabel'])}</span></h3><p class="v" data-bake="ref-venta">—</p><p class="s">{c['refsub']} <time data-vig datetime=""></time></p></article>
    <article class="card tasa" data-k="mercado-c"><h3>Mercado · compra</h3><p class="v" data-bake="mercado-compra">—</p><p class="s">lo que pagan por un dólar</p></article>
    <article class="card tasa" data-k="mercado-v"><h3>Mercado · venta</h3><p class="v" data-bake="mercado-venta">—</p><p class="s">lo que cuesta un dólar</p></article>
  </div>
  <p class="fuente" id="fuente">Fuente: <span data-src>{E(c['src'])}</span>, actualizado <time data-upd datetime=""></time><span id="estado"></span></p>
</section>

<section id="conversor" class="card calc" aria-labelledby="h-conv">
  <h2 id="h-conv" style="margin-top:0">Conversor de {c['curname']} a dólares ({c['cur']} ↔ USD)</h2>
  <label for="c-tipo">Tasa a usar</label>
  <select id="c-tipo"><option value="ref" selected>Tasa de referencia</option><option value="mercado">Mercado (compra / venta)</option></select>
  <label for="c-usd">Dólares (USD)</label>
  <input id="c-usd" type="text" inputmode="decimal" autocomplete="off" value="100">
  <label for="c-loc">{c['curname'].capitalize()} ({c['cur']})</label>
  <input id="c-loc" type="text" inputmode="decimal" autocomplete="off">
  <p class="nota">El cálculo funciona en ambos sentidos. Con la tasa de mercado, de dólares a {c['curname']} se aplica el precio de compra y en sentido inverso, el de venta.</p>
</section>

<section id="explicacion" aria-labelledby="h-exp">
  <h2 id="h-exp">{E(c['explainh'])}</h2>
  {c['explain']}
</section>

<section id="faq" aria-labelledby="h-faq">
  <h2 id="h-faq">Preguntas frecuentes</h2>
{chr(10).join(f'  <details><summary><h3>{E(q)}</h3></summary><p>{E(a)}</p></details>' for q,a in c['faq'])}
</section>

<div data-rates-widget data-highlight="{slug}"><p style="font-size:13px;color:#9aa3b8">Feed de tasas: <a href="/rates/feed.xml">RSS</a></p></div>
<script src="/assets/rates-widget.js" defer></script>
<section id="otros" aria-labelledby="h-otros">
  <h2 id="h-otros">Otras tasas de cambio</h2>
  <p>{' · '.join(f'<a href="/{s}/">{t}</a>' for s,_,t in others)} · <a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>{' · <a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>' if 'enviar-dinero' in live else ''}{' · <a href="/salario-en-dolares/">Calculadora de salario en dólares</a>' if 'salario-en-dolares' in live else ''}{' · <a href="/dolar-cripto/">Dólar cripto hoy: USDT P2P</a> · <a href="/convertidor-cripto/">Convertidor cripto (BTC, USDT)</a> · <a href="/comision-cripto/">Calculadora de comisión cripto (USDT, BTC)</a>' if 'dolar-cripto' in live else ''}</p>
</section>
</main>
<footer>
  <p style="margin:0">Datos: <span data-src>{E(c['src'])}</span>.{credit} Información de referencia, no constituye asesoría financiera. Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a></p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · {' · '.join(f'<a href="/{s}/">{n}</a>' for s,n,_ in others)} · <a href="/tasa-bcv/">Tasa BCV (Venezuela)</a></nav>
</footer>
<script>
(function(){{
var FB={{}};/*fb*/
var L='{c['lang']}',TZ='{c['tz']}',KEY='rates:{slug}',R=FB.rates||{{}};
var $=function(s){{return document.querySelector(s)}};
var nf=function(n){{return n==null?'—':'$ '+n.toLocaleString(L,{{minimumFractionDigits:DEC,maximumFractionDigits:DEC}})}};
var fd=function(s,o){{return new Date(s).toLocaleString(L,Object.assign({{timeZone:TZ}},o))}};
function render(d){{R=d.rates;FB=d;
 ['ref','mercado'].forEach(function(k){{var a=$('[data-bake="'+k+'-venta"]'),b=$('[data-bake="'+k+'-compra"]');if(a)a.textContent=nf(R[k]&&R[k].venta);if(b)b.textContent=nf(R[k]&&R[k].compra)}});
 ['mercado-c','mercado-v'].forEach(function(k){{$('[data-k="'+k+'"]').hidden=!R.mercado}});$('#c-tipo option[value=mercado]').disabled=!R.mercado;if(!R.mercado)$('#c-tipo').value='ref';
 if(d.label)$('[data-label]').textContent=d.label;
 if(R.ref){{var v=$('time[data-vig]');v.dateTime=R.ref.f;v.textContent=fd(R.ref.f,{{dateStyle:'long'}})}}
 if(d.updated){{var t=$('time[data-upd]');t.dateTime=d.updated;t.textContent=fd(d.updated,{{dateStyle:'medium',timeStyle:'short'}})+' ({c['tzl']})'}}
 document.querySelectorAll('[data-src]').forEach(function(e){{e.textContent=d.source}});conv('usd')}}
var num=function(s){{s=String(s).replace(/\\s|\\$/g,'');if(L==='es-MX'||L==='es-PE')s=s.replace(/,/g,'');else if(s.indexOf(',')>-1)s=s.replace(/\\./g,'').replace(',','.');else if(/\\.\\d{{3}}(\\.|$)/.test(s))s=s.replace(/\\./g,'');var n=parseFloat(s);return isFinite(n)?n:NaN}};
var fmt=function(n){{return isFinite(n)?n.toLocaleString(L,{{maximumFractionDigits:2}}):''}};
function conv(from){{var r=R[$('#c-tipo').value];if(!r)return;
 if(from==='usd')$('#c-loc').value=fmt(num($('#c-usd').value)*(r.compra||r.venta));
 else $('#c-usd').value=fmt(num($('#c-loc').value)/r.venta)}}
$('#c-usd').addEventListener('input',function(){{conv('usd')}});
$('#c-loc').addEventListener('input',function(){{conv('loc')}});
$('#c-tipo').addEventListener('change',function(){{conv('usd')}});
try{{var c=JSON.parse(localStorage.getItem(KEY));if(c&&c.updated>(FB.updated||''))FB=c}}catch(e){{}}
if(FB.rates)render(FB);
var ctl=window.AbortController?new AbortController():null;setTimeout(function(){{ctl&&ctl.abort()}},4500);
fetch('/{slug}/rates.json',Object.assign({{cache:'no-cache'}},ctl?{{signal:ctl.signal}}:{{}})).then(function(r){{if(!r.ok)throw 0;return r.json()}}).then(function(d){{
 if(!(d.rates&&d.rates.ref))throw 0;if(d.updated>=(FB.updated||'')){{render(d);try{{localStorage.setItem(KEY,JSON.stringify(d))}}catch(e){{}}}}
}}).catch(function(){{$('#estado').textContent=' · mostrando el último valor guardado'}});
}})();
</script>
<script>
(function(){{var b='https://blitz-analytics.andres-491.workers.dev';
function add(f){{var s=document.createElement('script');s.src=b+'/'+f;s.defer=true;s.setAttribute('data-endpoint',b);document.body.appendChild(s)}}
add('t.js');function late(){{(window.requestIdleCallback||setTimeout)(function(){{add('chat.js')}},{{timeout:3000}})}}
if(document.readyState==='complete')late();else addEventListener('load',late);}})();
</script>
</body>
</html>
'''
dec=4 if slug in('dolar-mexico','dolar-peru') else 2
out=out.replace('DEC',str(dec))
import os;os.makedirs(slug,exist_ok=True);open(f'{slug}/index.html','w').write(out)
