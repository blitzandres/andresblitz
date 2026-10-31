# Generates /salario-en-dolares/ (salary-in-USD calculator). Run from repo root:
#   python3 scripts/rates/gen-salario.py
# Reference rates come from rates/index.json (inline fallback; scripts/bake-feed.mjs keeps the MID block fresh).
# PPP factors: World Bank WDI indicator PA.NUS.PPP (free API, no sign-up), fetched at generation time.
import json, html, re, urllib.request, datetime
E = html.escape
idx = json.load(open('rates/index.json'))
MAP = {'VE':'tasa-bcv','CO':'dolar-colombia','MX':'dolar-mexico','AR':'dolar-argentina','ARB':'dolar-argentina-blue','PE':'dolar-peru','CL':'dolar-chile','CAD':'usdcad'}
mid = {k:{x:idx['series'][s][x] for x in ('value','source','time')} for k,s in MAP.items() if s in idx['series']}
ISO = {'VE':'VEN','CO':'COL','MX':'MEX','AR':'ARG','PE':'PER','CL':'CHL','CAD':'CAN'}
ppp = {}
for k, iso in ISO.items():
    try:
        d = json.load(urllib.request.urlopen(f'https://api.worldbank.org/v2/country/{iso}/indicator/PA.NUS.PPP?format=json&mrnev=1', timeout=30))
        r = d[1][0]; yr = int(r['date'])
        if yr >= datetime.date.today().year - 3 and r['value']:  # skip stale series (e.g. Venezuela, last 2011)
            ppp[k] = {'value': round(r['value'], 6), 'year': yr, 'updated': d[0].get('lastupdated')}
    except Exception as e:
        print('PPP skipped', k, e)
ppp['ARB'] = ppp.get('AR')
ppp = {k:v for k,v in ppp.items() if v}
wbdate = max((v['updated'] for v in ppp.values()), default='')
CUR = [('VE','VES','bolívares (Venezuela, tasa BCV)','tasa-bcv','Tasa BCV'),('CO','COP','pesos colombianos','dolar-colombia','TRM'),('MX','MXN','pesos mexicanos','dolar-mexico','FIX de Banxico'),
       ('AR','ARS','pesos argentinos · dólar oficial','dolar-argentina','dólar oficial'),('ARB','ARS','pesos argentinos · dólar blue','dolar-argentina','dólar blue'),
       ('PE','PEN','soles (Perú)','dolar-peru','tasa de mercado'),('CL','CLP','pesos chilenos','dolar-chile','dólar observado'),('CAD','CAD','dólares canadienses','','Banco de Canadá USD/CAD')]
title = 'Salario en dólares: convierte tu sueldo en pesos, bolívares o soles a USD'
desc = 'Convierte tu salario mensual o anual en bolívares, pesos colombianos, mexicanos, argentinos (oficial y blue), soles, pesos chilenos o dólares canadienses a dólares estadounidenses con tasas de referencia actualizadas.'
U = 'https://andresblitz.com/salario-en-dolares/'
faq = [('¿Cómo se convierte un salario a dólares?','Se divide el salario en moneda local por la tasa de referencia del día, expresada en unidades de moneda local por 1 dólar. Para un salario anual, el resultado mensual es el anual dividido entre 12.'),
('¿Qué tasa de cambio usa esta calculadora?','Las mismas tasas publicadas en este sitio y actualizadas cerca de cada 30 minutos: tasa BCV para Venezuela, TRM para Colombia, FIX de Banxico para México, dólar oficial y dólar blue para Argentina, tasa de mercado para Perú, dólar observado para Chile y el USD/CAD del Banco de Canadá. Cada una muestra su fuente y su fecha.'),
('¿Por qué Argentina tiene dos resultados?','Porque conviven varios tipos de cambio. El oficial es el de referencia bancaria y el blue es el del mercado informal; según cuál uses, el mismo sueldo equivale a otra cantidad de dólares.'),
('¿Qué es la paridad de poder adquisitivo (PPA)?','Es un factor del Banco Mundial que indica cuántas unidades de moneda local compran lo mismo que un dólar en Estados Unidos. Sirve para comparar el nivel de vida entre países mejor que el tipo de cambio de mercado. La calculadora la muestra solo donde hay datos recientes.'),
('¿Por qué no aparece la PPA para Venezuela?','El último dato del Banco Mundial para Venezuela es de 2011, anterior a varias reconversiones monetarias, así que no es útil para un salario actual y se omite.'),
('¿Este resultado sirve para un contrato o un trámite?','No. Es una conversión de referencia; para contratos, impuestos o trámites usa la tasa oficial que indique la autoridad o tu banco en la fecha correspondiente.')]
faqld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},ensure_ascii=False,separators=(',',':'))
wp = json.dumps({"@context":"https://schema.org","@type":"WebApplication","name":title,"url":U,"inLanguage":"es","applicationCategory":"FinanceApplication","operatingSystem":"Web","isAccessibleForFree":True,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"datePublished":"2026-10-31","dateModified":idx['generated'],"author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
src = open('enviar-dinero/index.html').read()
style = src[src.index('<style>'):src.index('</head>')]
style = re.sub(r'\n?<!-- ai-layer:start -->.*?<!-- ai-layer:end -->\n?', '\n', style, flags=re.S).strip()
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
opts = ''.join(f'<option value="{k}"{" selected" if k=="CO" else ""}>{n} ({c})</option>' for k,c,n,s,l in CUR)
links = ' · '.join(['<a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>'] + [f'<a href="/{s}/">Dólar hoy en {n}</a>' for s,n in [('dolar-colombia','Colombia'),('dolar-mexico','México'),('dolar-argentina','Argentina'),('dolar-peru','Perú'),('dolar-chile','Chile')]] + ['<a href="/dolar-cripto/">Dólar cripto (USDT P2P)</a>', '<a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>'])
pppnote = (f'Paridad de poder adquisitivo: Banco Mundial, indicador PA.NUS.PPP (datos de {max(v["year"] for v in ppp.values())}, base actualizada el {wbdate}).' if ppp else '')
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
<meta property="article:modified_time" content="{idx['generated']}">
<link rel="alternate" type="application/rss+xml" title="Feed de tasas" href="https://andresblitz.com/rates/feed.xml">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{wp}</script>
<script type="application/ld+json">{faqld}</script>
{style}
</head>
<body>
<main id="contenido">
<header>
  <h1>Salario en dólares: convierte tu sueldo a USD</h1>
  <p class="sub">Escribe tu salario mensual o anual en moneda local y mira cuánto equivale en dólares estadounidenses con la tasa de referencia de hoy.</p>
</header>
<p class="aviso" role="note">Conversión de referencia; no es una oferta ni un dato de salarios.</p>

<section id="calculadora" class="card calc" aria-labelledby="h-calc">
  <h2 id="h-calc" style="margin-top:0">Tu salario</h2>
  <div class="row2">
    <div><label for="s-monto">Salario</label><input id="s-monto" type="text" inputmode="decimal" autocomplete="off" placeholder="p. ej. 3.000.000"></div>
    <div><label for="s-per">Periodo</label><select id="s-per"><option value="m" selected>Mensual</option><option value="a">Anual</option></select></div>
  </div>
  <label for="s-cur">Moneda</label>
  <select id="s-cur">{opts}</select>
  <div class="res" aria-live="polite">
    <article class="card tasa big"><h3>En dólares (USD) por mes</h3><p class="v" id="r-mes">—</p><p class="s" id="r-alt">—</p></article>
    <article class="card tasa"><h3>USD por año</h3><p class="v" id="r-anio">—</p></article>
    <article class="card tasa"><h3>Dólares internacionales (PPA) por mes</h3><p class="v" id="r-ppa">—</p><p class="s" id="r-ppa-s">—</p></article>
  </div>
  <p class="fuente" id="r-ref">Tasa de referencia: —</p>
</section>

<section id="referencias" aria-labelledby="h-ref">
  <h2 id="h-ref">Tasas que usa la calculadora</h2>
  <table><thead><tr><th>Moneda</th><th class="n">por 1 USD</th><th>Fuente y fecha</th></tr></thead><tbody id="t-ref"></tbody></table>
  <p class="nota">Se actualizan cerca de cada 30 minutos con los mismos datos de las páginas de cada país. Si no cargan, se usa el último valor guardado. {E(pppnote)}</p>
</section>

<section id="como" aria-labelledby="h-como">
  <h2 id="h-como">Tipo de cambio y poder adquisitivo</h2>
  <p>La conversión principal divide tu salario entre la tasa de referencia: cuántas unidades de tu moneda equivalen a un dólar hoy. Es la cifra útil para comparar con un sueldo pagado en dólares o con precios en dólares.</p>
  <p>El tipo de cambio no dice cuánto alcanza el dinero en tu país. Para eso existe la <strong>paridad de poder adquisitivo (PPA)</strong> del Banco Mundial, que convierte tu salario en “dólares internacionales”: lo que podrías comprar en Estados Unidos con el mismo nivel de precios. Es un promedio nacional y anual, no un costo de vida de tu ciudad, y solo se muestra donde hay datos recientes.</p>
  <p>Esta página no muestra ni estima salarios: solo convierte la cifra que tú escribes, y no la guarda ni la envía.</p>
</section>

<section id="faq" aria-labelledby="h-faq">
  <h2 id="h-faq">Preguntas frecuentes</h2>
{chr(10).join(f'  <details><summary><h3>{E(q)}</h3></summary><p>{E(a)}</p></details>' for q,a in faq)}
</section>

<div data-rates-widget><p style="font-size:13px;color:#9aa3b8">Feed de tasas: <a href="/rates/feed.xml">RSS</a></p></div>
<script src="/assets/rates-widget.js" defer></script>
<section id="otros" aria-labelledby="h-otros">
  <h2 id="h-otros">Tasas de cambio por país</h2>
  <p>{links}</p>
</section>
</main>
<footer>
  <p style="margin:0">Herramienta informativa y gratuita. Conversión de referencia, no constituye asesoría financiera ni laboral. Sin enlaces de afiliados. {E(pppnote)} Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/enviar-dinero/">Enviar dinero</a> · <a href="/dolar-cripto/">Dólar cripto</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
<script>
(function(){{
var MID={json.dumps(mid,ensure_ascii=False,separators=(',',':'))};/*mid*/
var PPP={json.dumps(ppp,separators=(',',':'))};
var C={json.dumps({k:[c,n,s,l] for k,c,n,s,l in CUR},ensure_ascii=False,separators=(',',':'))};
var SER={json.dumps(MAP,separators=(',',':'))};
var $=function(s){{return document.querySelector(s)}};
var num=function(s){{s=String(s).replace(/[\\s$]/g,'');if(!s)return NaN;var c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>-1&&d>-1){{s=c>d?s.replace(/\\./g,'').replace(',','.'):s.replace(/,/g,'')}}
 else if(c>-1){{s=(s.split(',').length===2&&s.length-c-1!==3)?s.replace(',','.'):s.replace(/,/g,'')}}
 else if(d>-1&&(s.split('.').length>2||s.length-d-1===3))s=s.replace(/\\./g,'');
 return parseFloat(s)}};
var f=function(n,d){{return isFinite(n)?n.toLocaleString('es',{{minimumFractionDigits:d==null?2:0,maximumFractionDigits:d==null?2:d,useGrouping:'always'}}):'—'}};
var fd=function(s){{return new Date(s).toLocaleDateString('es',{{dateStyle:'medium'}})}};
function table(){{$('#t-ref').innerHTML=Object.keys(C).map(function(k){{var m=MID[k];return '<tr><td>'+(C[k][2]?'<a href="/'+C[k][2]+'/">'+C[k][1]+'</a>':C[k][1])+'</td><td class="n">'+(m?f(m.value,4)+' '+C[k][0]:'—')+'</td><td>'+(m?m.source+' · '+fd(m.time):'no disponible')+'</td></tr>'}}).join('')}}
function calc(){{var k=$('#s-cur').value,c=C[k][0],m=MID[k],v=num($('#s-monto').value),mes=$('#s-per').value==='a'?v/12:v;
 $('#r-ref').textContent=m?'Tasa de referencia: '+f(m.value,4)+' '+c+' por 1 USD ('+C[k][3]+', '+m.source+', '+fd(m.time)+').':'Tasa de referencia no disponible.';
 var ok=m&&isFinite(mes)&&mes>0;
 $('#r-mes').textContent=ok?f(mes/m.value)+' USD':'—';$('#r-anio').textContent=ok?f(mes*12/m.value)+' USD':'—';
 var o=k==='AR'?'ARB':k==='ARB'?'AR':null;
 $('#r-alt').textContent=ok&&o&&MID[o]?'con el '+C[o][3]+': '+f(mes/MID[o].value)+' USD por mes':ok?f(mes,2)+' '+c+' por mes':'escribe tu salario';
 var p=PPP[k];$('#r-ppa').textContent=ok&&p?f(mes/p.value)+' $ int.':'—';
 $('#r-ppa-s').textContent=p?'Banco Mundial, PPA '+p.year:'sin dato reciente del Banco Mundial'}}
['#s-monto'].forEach(function(s){{$(s).addEventListener('input',calc)}});
['#s-per','#s-cur'].forEach(function(s){{$(s).addEventListener('change',calc)}});
table();calc();
var ctl=window.AbortController?new AbortController():null;setTimeout(function(){{ctl&&ctl.abort()}},4500);
fetch('/rates/index.json',Object.assign({{cache:'no-cache'}},ctl?{{signal:ctl.signal}}:{{}})).then(function(r){{if(!r.ok)throw 0;return r.json()}}).then(function(d){{
 Object.keys(SER).forEach(function(k){{var s=d.series[SER[k]];if(s&&typeof s.value==='number')MID[k]={{value:s.value,source:s.source,time:s.time}}}});table();calc()}}).catch(function(){{}});
}})();
</script>
{analytics}</body>
</html>
'''
import os; os.makedirs('salario-en-dolares', exist_ok=True)
open('salario-en-dolares/index.html', 'w').write(out)
print('ok; PPP:', {k:(v['year'],v['value']) for k,v in ppp.items()})
