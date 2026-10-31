# Generates the /ahorro-en-dolares/ page shell. Run from repo root: python3 scripts/rates/gen-ahorro.py
# History is baked into `var H=...;/*hist*/` by scripts/bake-ahorro.mjs; today's rates into `var MID=...;/*mid*/` by scripts/bake-feed.mjs.
import json, html, re
E = html.escape
U = 'https://andresblitz.com/ahorro-en-dolares/'
title = 'Ahorro en dólares: cuánto valdrían hoy tus bolívares o pesos si los hubieras cambiado'
desc = 'Calculadora histórica: si guardaste bolívares, pesos o soles hace N meses, cuánto valen hoy en dólares (USD/USDT) frente a haberlos cambiado ese día. Datos con fuente y fecha, sin proyecciones.'
faq = [('¿Qué calcula esta página?','Compara dos casos con datos históricos: guardar el dinero en moneda local desde una fecha pasada, o cambiarlo a dólares (o USDT, que sigue al dólar) ese mismo día. Muestra cuánto vale cada caso hoy en dólares.'),
('¿De dónde salen los datos históricos?','Para bolívares, pesos colombianos, mexicanos y chilenos, soles y dólares canadienses usamos las cotizaciones diarias fechadas de currency-api (fawazahmed0), tomando el primer día disponible de cada mes desde marzo de 2024; las comparamos con series oficiales (TRM, Banco de Canadá, Banco Central de Chile, BCV) y coinciden en menos de 0,2 %. Para Argentina usamos el dólar oficial y el blue (venta) de ArgentinaDatos. El valor de hoy es la tasa de referencia de cada país en este sitio.'),
('¿Por qué no puedo elegir fechas anteriores a 2024?','Porque solo usamos fuentes gratuitas y fechadas que pudimos verificar. Las instantáneas diarias de currency-api empiezan en marzo de 2024.'),
('¿Se considera la inflación en dólares o el rendimiento de un ahorro?','No. Es una comparación de tipo de cambio: no incluye intereses, comisiones, la inflación del dólar ni el pequeño desvío del USDT respecto de un dólar.'),
('¿Esto dice qué va a pasar con mi moneda?','No. Son solo datos históricos, no es asesoría financiera. No hay proyecciones, señales ni recomendaciones.'),
('¿Cómo convierto mi salario a dólares hoy?','Usa la calculadora de salario en dólares, que convierte un sueldo mensual o anual con las tasas de referencia actuales.')]
faqld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},ensure_ascii=False,separators=(',',':'))
wp = json.dumps({"@context":"https://schema.org","@type":"WebApplication","name":title,"url":U,"applicationCategory":"FinanceApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"inLanguage":"es","datePublished":"2026-10-31","dateModified":"","author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
src = open('enviar-dinero/index.html').read()
base_style = src[src.index('<style>'):src.index('</style>')+8]
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
links = ' · '.join(['<a href="/salario-en-dolares/">Calculadora de salario en dólares</a>','<a href="/convertidor-cripto/">Convertidor cripto (BTC, USDT)</a>','<a href="/dolar-cripto/">Dólar cripto (USDT P2P)</a>','<a href="/comision-cripto/">Calculadora de comisión cripto (USDT, BTC)</a>','<a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>','<a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>'] + [f'<a href="/{s}/">Dólar hoy en {n}</a>' for s,n in [('dolar-argentina','Argentina'),('dolar-colombia','Colombia'),('dolar-mexico','México'),('dolar-peru','Perú'),('dolar-chile','Chile')]])
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
main{{max-width:760px}}
.aviso{{border-left:3px solid #e0b252;background:#16130a;padding:8px 12px;border-radius:8px;margin:10px 0;font-weight:600;font-size:14px}}
.box{{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;display:grid;gap:10px}}
.side{{background:#0b1020;border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:grid;gap:6px}}.side:focus-within{{border-color:var(--acc)}}
.side label,.lbl{{font-size:12.5px;color:var(--mute)}}
.big{{display:grid;grid-template-columns:1fr minmax(120px,42%);gap:8px;align-items:center}}
.big input{{font:inherit;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;background:transparent;border:0;color:var(--text);min-width:0;width:100%;min-height:44px}}.big input:focus{{outline:none}}
select{{font:inherit;font-size:15px;min-height:44px;background:#16203a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:6px 8px;width:100%;min-width:0}}
.seg{{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:44px}}.seg button{{min-height:38px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:#0f1527;color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}}.seg button[aria-pressed=true]{{background:#16203a;border-color:var(--acc);font-weight:600}}
.seg select{{width:auto;min-height:38px}}
.kpis{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}}.kpi{{background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--t,#8fb3ff);border-radius:12px;padding:10px;min-height:84px}}
.kpi .k{{font-size:12px;color:var(--mute)}}.kpi .v{{font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px;overflow-wrap:anywhere}}.kpi .s{{font-size:12px;color:var(--mute)}}
.ok{{--t:#7fc8a9}}.mid{{--t:#e0b252}}.hi{{--t:#e98a8a}}
.res{{font-size:16px;margin:12px 0 4px;min-height:4.5em}}
.chartbox{{height:220px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px;margin-top:8px}}.chartbox svg{{width:100%;height:100%;display:block}}
.lg{{display:flex;gap:12px;font-size:12.5px;color:var(--mute);margin-top:4px;min-height:20px}}.lg i{{display:inline-block;width:12px;height:3px;vertical-align:middle;margin-right:4px}}
.chips{{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:24px}}.chip{{display:inline-block;font-size:11.5px;color:var(--mute);background:#0f1527;border:1px solid var(--line);border-radius:999px;padding:2px 8px}}.chip.src{{color:var(--acc)}}
.tbl{{width:100%;border-collapse:collapse;font-size:14px}}.tbl th,.tbl td{{padding:6px;border-bottom:1px solid var(--line);text-align:left}}.n{{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums}}
.tblwrap{{overflow-x:auto;max-height:420px;overflow-y:auto}}
@media (max-width:520px){{.kpis{{grid-template-columns:1fr}}.big input{{font-size:23px}}}}
</style>
</head>
<body>
<main id="contenido">
<header>
  <h1>Ahorro en dólares: ¿cuánto valdría hoy?</h1>
  <p class="sub">Si guardaste dinero en tu moneda hace unos meses, ¿cuánto vale hoy en dólares, y cuánto tendrías si lo hubieras cambiado a dólares o USDT ese día? Datos históricos con fuente y fecha.</p>
</header>
<p class="aviso" role="note">Solo datos históricos, no es asesoría financiera.</p>

<section class="box" aria-label="Calculadora">
  <div class="side">
    <label for="amt">Monto que guardaste</label>
    <div class="big"><input id="amt" inputmode="decimal" autocomplete="off" value="1000"><select id="cur" aria-label="Moneda">
      <option value="VE">Bolívares (VES)</option><option value="AR">Pesos argentinos (oficial)</option><option value="ARB">Pesos argentinos (blue)</option><option value="CO">Pesos colombianos (COP)</option><option value="MX">Pesos mexicanos (MXN)</option><option value="PE">Soles (PEN)</option><option value="CL">Pesos chilenos (CLP)</option><option value="CAD">Dólares canadienses (CAD)</option></select></div>
  </div>
  <div class="side">
    <span class="lbl" id="l-per">Hace cuánto</span>
    <div class="seg" id="per" role="group" aria-labelledby="l-per"><button type="button" data-m="1">1 mes</button><button type="button" data-m="3">3 meses</button><button type="button" data-m="6">6 meses</button><button type="button" data-m="12" aria-pressed="true">1 año</button><button type="button" data-m="24">2 años</button><label class="lbl" for="since">o desde</label><select id="since"></select></div>
  </div>
</section>

<div class="kpis" aria-live="polite">
  <div class="kpi" id="k1"><div class="k">Guardado en moneda local, hoy</div><div class="v" id="v-loc">—</div><div class="s" id="s-loc"></div></div>
  <div class="kpi" id="k2"><div class="k">Cambiado a USD/USDT ese día</div><div class="v" id="v-usd">—</div><div class="s" id="s-usd"></div></div>
  <div class="kpi" id="k3"><div class="k">Diferencia</div><div class="v" id="v-dif">—</div><div class="s" id="s-dif"></div></div>
</div>
<p class="res" id="res">Activa JavaScript para usar la calculadora; abajo está la tabla de tasas históricas.</p>
<div class="chips" id="chips"></div>

<section id="grafico" aria-labelledby="h-g">
  <h2 id="h-g">Valor en dólares de tu ahorro en moneda local</h2>
  <div class="chartbox" id="chart" role="img" aria-label="Gráfico del valor en dólares del ahorro en moneda local por mes"></div>
  <div class="lg"><span><i style="background:#8fb3ff"></i>Guardado en moneda local</span><span><i style="background:#7fc8a9"></i>Cambiado a dólares</span></div>
</section>

<section id="tabla" aria-labelledby="h-t">
  <h2 id="h-t">Tasas históricas usadas (<span id="tcur">VES</span> por USD)</h2>
  <div class="tblwrap"><table class="tbl"><thead><tr><th scope="col">Fecha</th><th scope="col" class="n">Tasa</th><th scope="col" class="n">Tu monto en USD</th></tr></thead><tbody id="tb"><tr><td colspan="3">Activa JavaScript para ver la tabla.</td></tr></tbody></table></div>
</section>

<section id="como" aria-labelledby="h-como">
  <h2 id="h-como">Cómo se calcula y de dónde salen los datos</h2>
  <p>Guardado en moneda local, hoy = monto ÷ tasa de hoy. Cambiado ese día = monto ÷ tasa de esa fecha (y se mantiene en dólares; el USDT sigue al dólar). Diferencia = cuánto más (o menos) tendrías en dólares si lo hubieras cambiado.</p>
  <p>Historia mensual: <a href="https://github.com/fawazahmed0/exchange-api" rel="nofollow">currency-api (fawazahmed0)</a>, primer día disponible de cada mes desde marzo de 2024, para VES, COP, MXN, PEN, CLP y CAD; verificada contra la TRM (datos.gov.co), el Banco de Canadá, el Banco Central de Chile y la tasa BCV, con diferencias menores a 0,2 %. Argentina: dólar oficial y blue (venta) de <a href="https://argentinadatos.com/" rel="nofollow">ArgentinaDatos</a>. Hoy: la tasa de referencia de cada país en este sitio (fuente y hora en las etiquetas). No se incluye el real brasileño ni otras monedas porque no forman parte de este sitio.</p>
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
  <p style="margin:0">Solo datos históricos, no es asesoría financiera. Sin proyecciones, señales, botones de compra ni enlaces de afiliados. Historia: currency-api (fawazahmed0) y ArgentinaDatos. Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/salario-en-dolares/">Salario en dólares</a> · <a href="/convertidor-cripto/">Convertidor cripto</a> · <a href="/dolar-cripto/">Dólar cripto</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
<script>
var MID={{}};/*mid*/
var H={{}};/*hist*/
(function(){{
var $=function(s){{return document.getElementById(s)}};
var C={{VE:['ves','VES','bolívares','el bolívar','currency-api (fawazahmed0)'],AR:['ars','ARS','pesos argentinos','el peso argentino (oficial)','ArgentinaDatos (dólar oficial, venta)'],ARB:['arsb','ARS','pesos argentinos','el peso argentino (blue)','ArgentinaDatos (dólar blue, venta)'],CO:['cop','COP','pesos colombianos','el peso colombiano','currency-api (fawazahmed0)'],MX:['mxn','MXN','pesos mexicanos','el peso mexicano','currency-api (fawazahmed0)'],PE:['pen','PEN','soles','el sol','currency-api (fawazahmed0)'],CL:['clp','CLP','pesos chilenos','el peso chileno','currency-api (fawazahmed0)'],CAD:['cad','CAD','dólares canadienses','el dólar canadiense','currency-api (fawazahmed0)']}};
var MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var cur=$('cur'),amt=$('amt'),since=$('since'),months=12;
var q=new URLSearchParams(location.search);if(C[q.get('m')])cur.value=q.get('m');if(q.get('n'))amt.value=q.get('n');if(+q.get('p')>0)months=+q.get('p');
function parse(s){{s=String(s).replace(/[\\s_]/g,'');if(!s)return NaN;var c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>-1&&d>-1){{s=c>d?s.replace(/\\./g,'').replace(',','.'):s.replace(/,/g,'')}}else if(c>-1){{s=(s.split(',').length>2)?s.replace(/,/g,''):s.replace(',','.')}}else if(d>-1&&s.split('.').length>2){{s=s.replace(/\\./g,'')}}
 return /^\\d*\\.?\\d+$/.test(s)?parseFloat(s):NaN}}
function nf(v,d){{if(!isFinite(v))return '—';var a=Math.abs(v);if(d==null)d=a>=1000?0:a>=1?2:4;return v.toLocaleString('es',{{maximumFractionDigits:d,minimumFractionDigits:0}})}}
function usd(v){{return nf(v,v>=1000?0:2)+' USD'}}
function series(){{var s=H[C[cur.value][0]]||{{}};return Object.keys(s).sort().map(function(ym){{return {{ym:ym,d:s[ym][0],r:s[ym][1]}}}})}}
function label(ym){{var p=ym.split('-');return MES[+p[1]-1]+' de '+p[0]}}
function fd(d){{var p=d.split('-');return +p[2]+' de '+MES[+p[1]-1]+' de '+p[0]}}
function fillSince(){{var s=series(),v=since.value;since.innerHTML=s.map(function(x){{return '<option value="'+x.ym+'">'+label(x.ym)+'</option>'}}).reverse().join('');pick();if(v&&s.some(function(x){{return x.ym===v}})&&!months)since.value=v}}
function pick(){{if(!months)return;var d=new Date();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-months);var ym=d.toISOString().slice(0,7),s=series();
 if(!s.length)return;if(ym<s[0].ym)ym=s[0].ym;since.value=ym}}
function btns(){{document.querySelectorAll('#per button').forEach(function(b){{b.setAttribute('aria-pressed',String(+b.getAttribute('data-m')===months))}})}}
function chart(s,n,today){{var box=$('chart'),W=box.clientWidth-16||600,Hh=204,P=36;var pts=s.map(function(x){{return {{l:n/x.r,u:n/s[0].r}}}});pts.push({{l:n/today,u:n/s[0].r}});
 var mx=Math.max.apply(null,pts.map(function(p){{return Math.max(p.l,p.u)}}))*1.08,X=function(i){{return P+i*(W-P-8)/Math.max(1,pts.length-1)}},Y=function(v){{return 8+(Hh-28)*(1-v/mx)}};
 var path=function(k){{return pts.map(function(p,i){{return (i?'L':'M')+X(i).toFixed(1)+' '+Y(p[k]).toFixed(1)}}).join('')}};
 var g='';for(var i=0;i<=3;i++){{var v=mx*i/3;g+='<line x1="'+P+'" x2="'+(W-8)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#1a2135"/><text x="'+(P-4)+'" y="'+(Y(v)+4)+'" fill="#9aa3b8" font-size="10" text-anchor="end">'+nf(v,v>=100?0:1)+'</text>'}}
 g+='<text x="'+P+'" y="'+(Hh-4)+'" fill="#9aa3b8" font-size="10">'+label(s[0].ym)+'</text><text x="'+(W-8)+'" y="'+(Hh-4)+'" fill="#9aa3b8" font-size="10" text-anchor="end">hoy</text>';
 box.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" preserveAspectRatio="none">'+g+'<path d="'+path('u')+'" stroke="#7fc8a9" stroke-width="2" fill="none"/><path d="'+path('l')+'" stroke="#8fb3ff" stroke-width="2.5" fill="none"/></svg>'}}
function calc(){{var k=cur.value,c=C[k],n=parse(amt.value),all=series(),s=all.filter(function(x){{return x.ym>=since.value}}),m=MID[k];
 $('tcur').textContent=c[1];
 var line='',chips='';
 if(!(n>0)){{line='Escribe el monto que guardaste, por ejemplo 1000.';['v-loc','v-usd','v-dif'].forEach(function(i){{$(i).textContent='—'}})}}
 else if(!s.length||!m){{line='No hay datos históricos suficientes para esta moneda en este momento.'}}
 else{{var t0=s[0],today=m.value,a=n/today,b=n/t0.r,dif=(b/a-1)*100,chg=(1-t0.r/today)*100;
  $('v-loc').textContent=usd(a);$('s-loc').textContent=nf(n)+' '+c[1]+' ÷ '+nf(today)+' (hoy)';
  $('v-usd').textContent=usd(b);$('s-usd').textContent=nf(n)+' '+c[1]+' ÷ '+nf(t0.r)+' ('+fd(t0.d)+')';
  $('v-dif').textContent=(dif>=0?'+':'')+nf(dif,1)+' %';$('s-dif').textContent=usd(Math.abs(b-a))+(b>=a?' más si se cambiaba ese día':' más guardando en '+c[1]);
  $('k3').className='kpi '+(Math.abs(dif)<5?'ok':Math.abs(dif)<25?'mid':'hi');
  line='Si el '+fd(t0.d)+' guardaste <strong>'+nf(n)+' '+c[2]+'</strong>, hoy equivalen a <strong>'+usd(a)+'</strong>; si los hubieras cambiado a dólares (o USDT) ese día tendrías <strong>'+usd(b)+'</strong>. '
   +(chg>0.05?'En ese periodo '+c[3]+' perdió '+nf(chg,1)+' % de su valor frente al dólar.':chg<-0.05?'En ese periodo '+c[3]+' ganó '+nf(-chg,1)+' % de valor frente al dólar, así que guardar en moneda local rindió más en dólares.':'En ese periodo el tipo de cambio casi no se movió.');
  chips='<span class="chip src">'+fd(t0.d)+': '+c[4]+'</span><span class="chip src">Hoy: '+m.source+'</span><span class="chip">'+new Date(m.time).toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})+'</span>';
  chart(s,n,today);
  $('tb').innerHTML=s.slice().reverse().map(function(x){{return '<tr><td>'+fd(x.d)+'</td><td class="n">'+nf(x.r)+'</td><td class="n">'+usd(n/x.r)+'</td></tr>'}}).join('')+'';
  $('tb').insertAdjacentHTML('afterbegin','<tr><td>Hoy</td><td class="n">'+nf(today)+'</td><td class="n">'+usd(a)+'</td></tr>');
 }}
 $('res').innerHTML=line;$('chips').innerHTML=chips;
 try{{history.replaceState(null,'','?m='+k+'&n='+encodeURIComponent(amt.value)+'&p='+(months||since.value))}}catch(e){{}}
}}
$('per').addEventListener('click',function(e){{var b=e.target.closest('button');if(b){{months=+b.getAttribute('data-m');btns();pick();calc()}}}});
since.addEventListener('change',function(){{months=0;btns();calc()}});
cur.addEventListener('change',function(){{fillSince();calc()}});amt.addEventListener('input',calc);
if(/^\\d{{4}}-\\d\\d$/.test(q.get('p')||'')){{months=0}}
fillSince();if(!months&&q.get('p'))since.value=q.get('p');btns();calc();
var rt;addEventListener('resize',function(){{clearTimeout(rt);rt=setTimeout(calc,150)}});
}})();
</script>
{analytics}</body>
</html>
'''
open('ahorro-en-dolares/index.html','w').write(out)
print('ok')
