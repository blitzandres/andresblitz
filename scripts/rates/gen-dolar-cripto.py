# Generates the /dolar-cripto/ page shell. Run from repo root: python3 scripts/rates/gen-dolar-cripto.py
# Values, summary, cards, table and chart data are filled between <!--x:start/end--> markers by scripts/bake-crypto.mjs.
import json, html, re
E = html.escape
U = 'https://andresblitz.com/dolar-cripto/'
title = 'Dólar cripto hoy: USDT P2P en Venezuela, Argentina y Colombia'
desc = 'Precio del USDT en el mercado P2P en bolívares, pesos argentinos y pesos colombianos (mediana), con la brecha frente a la tasa BCV, el dólar oficial y la TRM, fuente y hora de cada dato.'
faq = [('¿Qué es el dólar cripto o dólar USDT?','Es el precio al que se compran y venden USDT (Tether), una criptomoneda que sigue al dólar estadounidense, entre personas en plataformas P2P. En países con controles o varias tasas, funciona como un precio de mercado del dólar.'),
('¿Qué es la brecha?','Es la diferencia porcentual entre el precio del USDT P2P y la tasa oficial: tasa BCV en Venezuela, dólar oficial en Argentina y TRM en Colombia. Una brecha de 10 % significa que el dólar digital cuesta 10 % más que el oficial.'),
('¿De dónde salen los precios?','De fuentes públicas sin registro, consultadas cerca de cada 30 minutos por un proceso automático: primero CriptoYa (mediana de varias plataformas P2P), luego la búsqueda pública de Binance P2P y, si ambas fallan, Yadio. Cada tarjeta muestra la fuente usada y la hora del dato. Si todas fallan se mantiene el último dato válido, marcado como anterior.'),
('¿Por qué uso la mediana y no el promedio?','La mediana no se deja mover por anuncios con precios extremos, así que representa mejor el precio típico del mercado.'),
('¿De dónde vienen los precios de Bitcoin y otras criptomonedas?','De CoinGecko, una fuente pública y gratuita. Son precios en dólares estadounidenses y se muestran con su variación de 24 horas.'),
('¿Esta página recomienda comprar o vender?','No. Es información referencial, no es asesoría financiera. No tiene botones de compra, enlaces de afiliados, señales ni predicciones.')]
faqld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},ensure_ascii=False,separators=(',',':'))
wp = json.dumps({"@context":"https://schema.org","@type":"WebPage","name":title,"url":U,"inLanguage":"es","datePublished":"2026-10-31","dateModified":"","author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
src = open('enviar-dinero/index.html').read()
base_style = src[src.index('<style>'):src.index('</style>')+8]
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
links = ' · '.join(['<a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>'] + [f'<a href="/{s}/">Dólar hoy en {n}</a>' for s,n in [('dolar-argentina','Argentina'),('dolar-colombia','Colombia'),('dolar-mexico','México'),('dolar-peru','Perú'),('dolar-chile','Chile')]] + ['<a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>','<a href="/salario-en-dolares/">Calculadora de salario en dólares</a>','<a href="/convertidor-cripto/">Convertidor cripto (BTC, USDT)</a> · <a href="/comision-cripto/">Calculadora de comisión cripto (USDT, BTC)</a> · <a href="/ahorro-en-dolares/">Ahorro en dólares: calculadora histórica</a>'])
out = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{U}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="format-detection" content="telephone=no">
<meta name="author" content="Andrés Blitz">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#05070f">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_LA">
<meta property="og:site_name" content="andresblitz.com">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{U}">
<meta property="og:image" content="https://andresblitz.com/assets/og-cover.png">
<meta property="article:modified_time" content="">
<link rel="alternate" type="application/rss+xml" title="Feed de tasas" href="https://andresblitz.com/rates/feed.xml">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{wp}</script>
<script type="application/ld+json">{faqld}</script>
{base_style}
<style>
main{{max-width:980px}}
.aviso{{border-left:3px solid #e0b252;background:#16130a;padding:8px 12px;border-radius:8px;margin:10px 0;font-weight:600;font-size:14px}}
.sum{{list-style:none;margin:12px 0;padding:0;display:grid;gap:6px}}.sum li{{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--mute);border-radius:10px;padding:8px 12px;font-size:14.5px}}
.sum li.ok,.cc.ok{{--t:#7fc8a9}}.sum li.mid,.cc.mid{{--t:#e0b252}}.sum li.hi,.cc.hi{{--t:#e98a8a}}.sum li{{border-left-color:var(--t,var(--mute))}}
.tabs{{display:flex;gap:4px;margin:18px 0 10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:4px;width:max-content;max-width:100%}}
.tabs button{{min-height:40px;padding:6px 14px;border:0;border-radius:7px;background:transparent;color:var(--mute);font:inherit;font-size:14px;cursor:pointer}}.tabs button[aria-selected=true]{{background:#16203a;color:var(--text);font-weight:600}}
.js .panel[hidden]{{display:none}}
.cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}}
.cc{{background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--t,var(--line));border-radius:12px;padding:12px;min-width:0}}
.cc header{{display:flex;justify-content:space-between;align-items:center;gap:8px}}.cc h3{{margin:0;font-size:17px}}
.row{{display:flex;gap:10px;align-items:flex-start;margin-top:8px}}
.gauge{{flex:0 0 72px;width:72px;height:44px;position:relative}}.gauge svg{{width:72px;height:72px;position:absolute;top:0;left:0}}
.gauge .dial{{stroke:#1a2135;stroke-width:12;fill:none}}.gauge .value{{stroke:var(--t,#7fc8a9);stroke-width:12;fill:none}}.gauge .value-text{{display:none}}
.nums{{margin:0;display:grid;gap:4px;flex:1;min-width:0}}.nums div{{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:baseline}}
.nums dt{{color:var(--mute);font-size:12.5px}}.nums dd{{margin:0;text-align:right;font-variant-numeric:tabular-nums;font-weight:650;white-space:nowrap}}.nums dd.v{{font-size:20px}}.nums dd.g{{color:var(--t)}}
.nums dd.why{{grid-column:1/-1;text-align:left;font-weight:400;font-size:11.5px;color:var(--mute);white-space:normal}}
.spk{{display:block;width:100%;height:40px;margin:8px 0 4px;stroke:var(--t,#7fc8a9);fill:none}}.spk path{{fill:none!important}}.spk .sparkline--cursor,.spk .sparkline--spot{{display:none}}
.chips{{display:flex;flex-wrap:wrap;gap:4px}}.chip{{display:inline-block;font-size:11.5px;color:var(--mute);background:#0f1527;border:1px solid var(--line);border-radius:999px;padding:2px 8px;text-decoration:none;font-weight:400}}.chip.src{{color:var(--acc)}}.chip.warn{{color:#e0b252;border-color:#5a4720}}
.chartbox{{height:300px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px}}.chartbox .u-legend{{font-size:12px;color:var(--mute)}}
.tbl,.coins{{width:100%;border-collapse:collapse;font-size:14px}}.tbl th,.tbl td,.coins th,.coins td{{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}}.n{{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums}}
.tblwrap{{overflow-x:auto}}.coins .up{{color:#7fc8a9}}.coins .dn{{color:#e98a8a}}
</style>
</head>
<body>
<main id="contenido">
<header>
  <h1>Dólar cripto hoy: USDT P2P vs. tasa oficial</h1>
  <p class="sub">Precio mediano del USDT en el mercado entre personas (P2P) en Venezuela, Argentina y Colombia, y su brecha con la tasa oficial. Actualizado <!--upd:start--><!--upd:end-->.</p>
</header>
<p class="aviso" role="note">Referencial, no es asesoría financiera.</p>
<!--sum:start--><!--sum:end-->

<div class="tabs" role="tablist" aria-label="Vista">
  <button role="tab" id="t-cards" aria-controls="p-cards" aria-selected="true">Tarjetas</button>
  <button role="tab" id="t-chart" aria-controls="p-chart" aria-selected="false" tabindex="-1">Gráfico</button>
  <button role="tab" id="t-table" aria-controls="p-table" aria-selected="false" tabindex="-1">Tabla</button>
</div>
<section class="panel" id="p-cards" role="tabpanel" aria-labelledby="t-cards">
  <h2 class="sr">Tarjetas por país</h2>
  <div class="cards">
<!--cards:start--><!--cards:end-->
  </div>
</section>
<section class="panel" id="p-chart" role="tabpanel" aria-labelledby="t-chart">
  <h2 style="margin-top:0;font-size:16px">Brecha USDT vs. oficial, últimos 7 días (%)</h2>
  <div class="chartbox" id="chart"></div>
  <p class="nota">Cada punto es una actualización (cerca de cada 30 minutos). La tabla tiene los mismos datos en texto.</p>
</section>
<section class="panel tblwrap" id="p-table" role="tabpanel" aria-labelledby="t-table">
  <h2 style="margin-top:0;font-size:16px">Tabla de datos</h2>
  <!--table:start--><!--table:end-->
</section>

<section id="cripto" aria-labelledby="h-coins">
  <h2 id="h-coins">Bitcoin y otras criptomonedas (USD)</h2>
  <!--coins:start--><!--coins:end-->
</section>

<section id="como" aria-labelledby="h-como">
  <h2 id="h-como">Cómo leer esta página</h2>
  <p>El <strong>USDT</strong> es una moneda digital diseñada para valer un dólar. En Venezuela y Argentina, y en menor medida en Colombia, mucha gente lo compra y vende directamente con otras personas en plataformas P2P. Su precio en moneda local funciona como un termómetro del dólar fuera del canal oficial.</p>
  <p>La <strong>brecha</strong> compara ese precio con la tasa oficial de cada país. Una brecha cercana a cero indica que ambos mercados están alineados; una brecha alta suele aparecer cuando hay restricciones para comprar dólares o expectativas de devaluación. Verde: menos de 5 %; amarillo: de 5 % a 20 %; rojo: más de 20 %.</p>
</section>

<section id="faq" aria-labelledby="h-faq">
  <h2 id="h-faq">Preguntas frecuentes</h2>
{chr(10).join(f'  <details><summary><h3>{E(q)}</h3></summary><p>{E(a)}</p></details>' for q,a in faq)}
</section>

<div data-rates-widget><p style="font-size:13px;color:#9aa3b8">Feed de tasas: <a href="/rates/feed.xml">RSS</a></p></div>
<script src="/assets/rates-widget.js" defer></script>
<section id="otros" aria-labelledby="h-otros">
  <h2 id="h-otros">Tasas y calculadoras</h2>
  <p>{links}</p>
</section>
</main>
<footer>
  <p style="margin:0">Referencial, no es asesoría financiera. Sin botones de compra, enlaces de afiliados, señales ni predicciones. Datos P2P: CriptoYa, Binance P2P o Yadio según disponibilidad; criptomonedas: CoinGecko. Gráficos: uPlot, svg-gauge y sparkline (MIT). Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/convertidor-cripto/">Convertidor cripto</a> · <a href="/comision-cripto/">Comisión cripto</a> · <a href="/ahorro-en-dolares/">Ahorro en dólares</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
<script type="application/json" id="cd">{{}}</script>
<script>
(function(){{
document.documentElement.classList.add('js');
var D;try{{D=JSON.parse(document.getElementById('cd').textContent)}}catch(e){{D={{}}}}
var $=function(s){{return document.querySelector(s)}},loaded={{}};
function load(src,css){{if(loaded[src])return loaded[src];return loaded[src]=new Promise(function(ok,ko){{if(css){{var l=document.createElement('link');l.rel='stylesheet';l.href=css;document.head.appendChild(l)}}var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)}})}}
var V='/assets/vendor/',done={{}};
var views={{
 cards:function(){{return Promise.all([load(V+'svg-gauge/gauge.min.js'),load(V+'sparkline/sparkline.js')]).then(function(){{
  document.querySelectorAll('[data-gauge]').forEach(function(el){{var g=parseFloat(el.getAttribute('data-gauge'));if(!isFinite(g))return;
   Gauge(el,{{max:50,min:0,value:Math.min(50,Math.abs(g)),dialStartAngle:180,dialEndAngle:0,showValue:false}})}});
  var sp=window.sparkline&&(window.sparkline.sparkline||window.sparkline.default||window.sparkline);
  document.querySelectorAll('[data-spark]').forEach(function(el){{var h=(D.h||{{}})[el.getAttribute('data-spark')]||[];var v=h.map(function(p){{return p.u}});if(v.length>1&&sp)sp(el,v)}})}})}},
 chart:function(){{return load(V+'uplot/uPlot.iife.min.js',V+'uplot/uPlot.min.css').then(function(){{
  var H=D.h||{{}},keys=Object.keys(H),ts={{}};keys.forEach(function(k){{H[k].forEach(function(p){{ts[Date.parse(p.t)/1e3]=1}})}});
  var xs=Object.keys(ts).map(Number).sort(function(a,b){{return a-b}}),col=['#7fc8a9','#e0b252','#8fb3ff'];
  var data=[xs].concat(keys.map(function(k){{var m={{}};H[k].forEach(function(p){{if(p.o>0)m[Date.parse(p.t)/1e3]=+((p.u/p.o-1)*100).toFixed(2)}});return xs.map(function(x){{return x in m?m[x]:null}})}}));
  var box=$('#chart');box.textContent='';
  if(xs.length<2){{box.textContent='El historial se completa con cada actualización.';return}}
  new uPlot({{width:box.clientWidth-16,height:240,scales:{{x:{{time:true}}}},axes:[{{stroke:'#9aa3b8',grid:{{stroke:'#1a2135'}},values:function(u,v){{return v.map(function(t){{return new Date(t*1e3).toLocaleString('es',{{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}})}})}}}},{{stroke:'#9aa3b8',grid:{{stroke:'#1a2135'}},values:function(u,v){{return v.map(function(x){{return x+' %'}})}}}}],
   series:[{{label:'Hora',value:function(u,t){{return t==null?'—':new Date(t*1e3).toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})}}}}].concat(keys.map(function(k,i){{return {{label:((D.c||{{}})[k]||{{}}).n||k,stroke:col[i%3],width:2,spanGaps:true,value:function(u,v){{return v==null?'—':v.toLocaleString('es')+' %'}}}}}}))}},data,box)}})}},
 table:function(){{return Promise.resolve()}}
}};
function show(name,focus){{['cards','chart','table'].forEach(function(n){{var on=n===name,t=$('#t-'+n);t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;$('#p-'+n).hidden=!on;if(on&&focus)t.focus()}});
 if(!done[name]){{done[name]=1;views[name]().catch(function(){{}})}}}}
var order=['cards','chart','table'];
order.forEach(function(n,i){{var t=$('#t-'+n);t.addEventListener('click',function(){{show(n)}});
 t.addEventListener('keydown',function(e){{var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d)show(order[(i+d+3)%3],true)}})}});
show('cards');
}})();
</script>
{analytics}</body>
</html>
'''
open('dolar-cripto/index.html','w').write(out)
print('ok')
