# Generates the /convertidor-cripto/ page shell. Run from repo root: python3 scripts/rates/gen-convertidor.py
# Rates are baked into `var MID=...;/*mid*/` and `var CO=...;/*coins*/` by scripts/bake-feed.mjs (no visitor-side API calls).
import json, html, re
E = html.escape
U = 'https://andresblitz.com/convertidor-cripto/'
title = 'Convertidor cripto: BTC, sats, ETH y USDT a bolívares, pesos y dólares'
desc = 'Convierte Bitcoin, satoshis, Ethereum, USDT y otras criptomonedas a bolívares, pesos argentinos (oficial y blue), colombianos, mexicanos y chilenos, soles, dólares y dólares canadienses, y al revés. Fuente y hora de cada tasa.'
faq = [('¿Cómo funciona el convertidor?','Multiplica la cantidad de la criptomoneda por su precio en dólares estadounidenses y luego por la tasa de referencia de la moneda local (por ejemplo, la tasa BCV o la TRM). Al invertir la conversión hace la cuenta al revés.'),
('¿Qué es un satoshi (sat)?','Es la unidad más pequeña de Bitcoin: 1 BTC = 100.000.000 sats. Es útil para hablar de montos pequeños sin tantos decimales.'),
('¿De dónde salen los precios?','El precio de Bitcoin viene de la misma serie de CoinGecko que usa el feed de tasas de este sitio; Ethereum, USDT, USDC, Solana, XRP y BNB vienen de CoinGecko. Las tasas de cada país son las mismas de sus páginas: tasa BCV, dólar oficial y blue de Argentina, TRM, FIX de Banxico, referencia para Perú, dólar observado de Chile y Banco de Canadá. Se actualizan cerca de cada 30 minutos.'),
('¿Por qué el resultado no coincide con lo que me pagan en una plataforma?','Porque las plataformas y casas de cambio aplican su propio precio, comisiones y diferencial. Este convertidor usa tasas de referencia. En Venezuela, Argentina y Colombia también mostramos el valor al precio USDT P2P como comparación.'),
('¿El convertidor consulta precios en vivo desde mi navegador?','No. Las tasas se guardan en la página en cada actualización automática, así que la conversión se calcula en tu dispositivo sin llamar a servicios externos.'),
('¿Esta página recomienda comprar o vender?','No. Es información referencial, no es asesoría financiera. No tiene botones de compra, enlaces de afiliados, señales ni predicciones.')]
faqld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},ensure_ascii=False,separators=(',',':'))
wp = json.dumps({"@context":"https://schema.org","@type":"WebApplication","name":title,"url":U,"applicationCategory":"FinanceApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"inLanguage":"es","datePublished":"2026-10-31","dateModified":"","author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
src = open('enviar-dinero/index.html').read()
base_style = src[src.index('<style>'):src.index('</style>')+8]
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
links = ' · '.join(['<a href="/dolar-cripto/">Dólar cripto (USDT P2P)</a>','<a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>'] + [f'<a href="/{s}/">Dólar hoy en {n}</a>' for s,n in [('dolar-argentina','Argentina'),('dolar-colombia','Colombia'),('dolar-mexico','México'),('dolar-peru','Perú'),('dolar-chile','Chile')]] + ['<a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>','<a href="/salario-en-dolares/">Calculadora de salario en dólares</a>'])
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
.swap{{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;display:grid;gap:8px}}
.side{{display:grid;grid-template-columns:1fr minmax(120px,42%);gap:8px;align-items:end;background:#0b1020;border:1px solid var(--line);border-radius:12px;padding:10px 12px}}
.side label{{grid-column:1/-1;font-size:12.5px;color:var(--mute)}}
.side input,.side output{{font:inherit;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;background:transparent;border:0;color:var(--text);min-width:0;width:100%;padding:2px 0;line-height:1.25;min-height:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}}
.side input:focus{{outline:none}}.side:focus-within{{border-color:var(--acc)}}
.side select{{font:inherit;font-size:15px;min-height:44px;background:#16203a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:6px 8px;width:100%}}
.mid{{display:flex;justify-content:center;margin:-2px 0}}
.mid button{{width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:#16203a;color:var(--text);font-size:20px;cursor:pointer}}.mid button:hover{{border-color:var(--acc)}}
.qa{{display:flex;flex-wrap:wrap;gap:6px;min-height:36px}}.qa button{{min-height:34px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:#0f1527;color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}}.qa button:hover{{border-color:var(--acc)}}
.res{{font-size:16px;margin:12px 0 4px;min-height:3em}}.res strong{{font-variant-numeric:tabular-nums}}
.p2p{{font-size:14px;color:var(--mute);min-height:1.5em;margin:0}}
.chips{{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:24px}}.chip{{display:inline-block;font-size:11.5px;color:var(--mute);background:#0f1527;border:1px solid var(--line);border-radius:999px;padding:2px 8px}}.chip.src{{color:var(--acc)}}.chip.warn{{color:#e0b252;border-color:#5a4720}}
.ref{{width:100%;border-collapse:collapse;font-size:14px}}.ref th,.ref td{{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left}}.n{{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums}}
.tblwrap{{overflow-x:auto}}
@media (max-width:480px){{.side input,.side output{{font-size:23px}}}}
</style>
</head>
<body>
<main id="contenido">
<header>
  <h1>Convertidor cripto a bolívares, pesos y dólares</h1>
  <p class="sub">Bitcoin, sats, Ethereum, USDT y otras criptomonedas ↔ VES, ARS (oficial y blue), COP, MXN, PEN, CLP, USD y CAD con tasas de referencia. Actualizado <time id="upd" datetime="">—</time>.</p>
</header>
<p class="aviso" role="note">Referencial, no es asesoría financiera.</p>

<section class="swap" aria-label="Convertidor">
  <div class="side">
    <label for="amt" id="l-from">Tienes</label>
    <input id="amt" inputmode="decimal" autocomplete="off" value="1" aria-describedby="res">
    <select id="from" aria-label="Moneda de origen"></select>
  </div>
  <div class="mid"><button type="button" id="sw" aria-label="Invertir conversión" title="Invertir">⇅</button></div>
  <div class="side">
    <label for="to" id="l-to">Recibes (aprox.)</label>
    <output id="out" for="amt from to" aria-live="off">—</output>
    <select id="to" aria-label="Moneda de destino"></select>
  </div>
  <div class="qa" id="qa" aria-label="Montos rápidos"></div>
</section>
<p class="res" id="res" aria-live="polite">Activa JavaScript para usar el convertidor; abajo está la tabla de referencia.</p>
<p class="p2p" id="p2p"></p>
<div class="chips" id="chips"></div>

<section id="tabla" aria-labelledby="h-ref">
  <h2 id="h-ref">Tabla de referencia: <span id="refname">1 BTC</span></h2>
  <div class="tblwrap"><table class="ref"><thead><tr><th scope="col">Moneda</th><th scope="col" class="n">Valor</th><th scope="col">Tasa usada</th></tr></thead><tbody id="refbody"><!--ref:start--><!--ref:end--></tbody></table></div>
</section>

<section id="como" aria-labelledby="h-como">
  <h2 id="h-como">Cómo se calcula</h2>
  <p>Cantidad × precio de la criptomoneda en dólares (CoinGecko) × tasa de referencia de la moneda local. Para dólares canadienses se usa la tasa del Banco de Canadá. El resultado es una referencia: plataformas, casas de cambio y vendedores P2P usan su propio precio y comisiones.</p>
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
  <p style="margin:0">Referencial, no es asesoría financiera. Sin botones de compra, enlaces de afiliados, señales ni predicciones. Precios de criptomonedas: <a href="https://www.coingecko.com/" rel="nofollow">CoinGecko</a>; tasas de cada país: fuentes indicadas en cada moneda. Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
<script>
var MID={{}};/*mid*/
var CO={{}};/*coins*/
(function(){{
var $=function(s){{return document.getElementById(s)}};
var CR=[['BTC','Bitcoin (BTC)'],['SAT','Satoshis (sats)'],['ETH','Ethereum (ETH)'],['USDT','Tether (USDT)'],['USDC','USD Coin (USDC)'],['SOL','Solana (SOL)'],['XRP','XRP'],['BNB','BNB']];
var FI=[['VE','VES','Bolívares (tasa BCV)','Bs.','la tasa BCV','bolívares'],['AR','ARS','Pesos argentinos (oficial)','$','el dólar oficial','pesos argentinos'],['ARB','ARS','Pesos argentinos (blue)','$','el dólar blue','pesos argentinos'],['CO','COP','Pesos colombianos (TRM)','$','la TRM','pesos colombianos'],['MX','MXN','Pesos mexicanos (FIX)','$','el FIX de Banxico','pesos mexicanos'],['PE','PEN','Soles peruanos','S/','la tasa de referencia','soles'],['CL','CLP','Pesos chilenos','$','el dólar observado','pesos chilenos'],['USD','USD','Dólares estadounidenses','US$','',  'dólares'],['CAD','CAD','Dólares canadienses','C$','la tasa del Banco de Canadá','dólares canadienses']];
var P2P={{VE:'ve',AR:'ar',ARB:'ar',CO:'co'}};
function usd(c){{if(c==='SAT')return CO.BTC?CO.BTC.usd/1e8:NaN;return CO[c]?CO[c].usd:NaN}}
function rate(f){{if(f==='USD')return 1;return MID[f]?MID[f].value:NaN}}
function fi(k){{for(var i=0;i<FI.length;i++)if(FI[i][0]===k)return FI[i]}}
function cname(k){{for(var i=0;i<CR.length;i++)if(CR[i][0]===k)return CR[i][1]}}
function isC(k){{return !fi(k)}}
function nf(v,max){{if(!isFinite(v))return '—';var a=Math.abs(v),d=max!=null?max:a>=1000?0:a>=1?2:a>=0.01?4:8;return v.toLocaleString('es',{{maximumFractionDigits:d,minimumFractionDigits:0}})}}
function cf(v){{if(!isFinite(v))return '—';var a=Math.abs(v);return v.toLocaleString('es',{{maximumFractionDigits:a>=100?2:a>=1?4:8}})}}
function parse(s){{s=String(s).replace(/[\\s_]/g,'');if(!s)return NaN;var c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>-1&&d>-1){{s=c>d?s.replace(/\\./g,'').replace(',','.'):s.replace(/,/g,'')}}else if(c>-1){{s=(s.split(',').length>2)?s.replace(/,/g,''):s.replace(',','.')}}else if(d>-1&&s.split('.').length>2){{s=s.replace(/\\./g,'')}}
 return /^-?\\d*\\.?\\d+$/.test(s)?parseFloat(s):NaN}}
function opts(sel,v){{sel.innerHTML='<optgroup label="Criptomonedas">'+CR.map(function(c){{return '<option value="'+c[0]+'">'+c[1]+'</option>'}}).join('')+'</optgroup><optgroup label="Monedas">'+FI.map(function(f){{return '<option value="'+f[0]+'">'+f[2]+'</option>'}}).join('')+'</optgroup>';sel.value=v}}
var lastR=NaN,from=$('from'),to=$('to'),amt=$('amt');
var q=new URLSearchParams(location.search);
opts(from,q.get('de')&&usdOk(q.get('de'))?q.get('de'):'BTC');opts(to,q.get('a')&&usdOk(q.get('a'))?q.get('a'):'VE');
if(q.get('n')&&isFinite(parse(q.get('n'))))amt.value=q.get('n');
function usdOk(k){{return !!(fi(k)||cname(k))}}
function toUsd(k,n){{return isC(k)?n*usd(k):n/rate(k)}}
function fromUsd(k,u){{return isC(k)?u/usd(k):u*rate(k)}}
function lab(k){{return isC(k)?(k==='SAT'?'sats':k):fi(k)[1]}}
function words(k,v){{if(isC(k))return cf(v)+' '+lab(k);var f=fi(k);return nf(v,f[0]==='USD'||f[0]==='CAD'||f[0]==='PE'?2:null)+' '+f[5]}}
function round2(x){{if(!(x>0))return x;var p=Math.pow(10,Math.floor(Math.log10(x))-1);return Math.round(x/p)*p}}
function chips(){{var k=from.value,list;
 if(k==='SAT')list=[1000,10000,100000,1000000];else if(k==='BTC')list=[0.001,0.01,0.1,1];else if(k==='ETH')list=[0.01,0.1,1,5];else if(isC(k)&&usd(k)<5)list=[10,50,100,500];else if(isC(k))list=[0.1,1,5,10];
 else list=[10,50,100,500].map(function(u){{return round2(u*rate(k))}});
 $('qa').innerHTML=list.map(function(v){{return '<button type="button" data-v="'+v+'">'+(isC(k)?cf(v):nf(v,0))+' '+lab(k)+'</button>'}}).join('')}}
function ago(t){{var d=new Date(t);return d.toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})}}
function calc(){{var a=from.value,b=to.value,n=parse(amt.value);
 amt.setAttribute('aria-invalid',isFinite(n)?'false':'true');
 var u=toUsd(a,n),r=fromUsd(b,u);lastR=r;
 $('out').textContent=isFinite(r)?(isC(b)?cf(r):nf(r,(b==='USD'||b==='CAD'||b==='PE')?2:null)):'—';
 var line='',p2p='';
 if(!isFinite(n))line='Escribe una cantidad, por ejemplo 0,01 o 250.';
 else if(!isFinite(r))line='Falta una de las tasas en este momento; prueba con otra moneda.';
 else if(a===b)line='Elige dos monedas distintas.';
 else {{var fb=isC(b)?null:fi(b),fa=isC(a)?null:fi(a);
  line='<strong>'+words(a,n)+'</strong> equivalen a unos <strong>'+words(b,r)+'</strong>';
  var via=[];if(isC(a)||isC(b))via.push('precio de '+(isC(a)?(a==='SAT'?'BTC':a):(b==='SAT'?'BTC':b))+' en dólares');
  [fa,fb].forEach(function(f){{if(f&&f[4])via.push(f[4])}});
  line+=(isFinite(u)&&a!=='USD'&&b!=='USD'?' (unos '+nf(u,2)+' dólares)':'')+(via.length?', usando '+via.join(' y ')+'.':'.');
  var pk=P2P[isC(b)?a:b],pc=pk&&CO.p2p&&CO.p2p[pk];
  if(pc&&(isC(a)!==isC(b))){{var loc=isC(b)?a:b,f=fi(loc),u2=isC(a)?n*usd(a):r*usd(b);
   if(isC(a)){{p2p='Al precio USDT P2P ('+nf(pc.value)+' '+f[1]+' por USDT) serían unos '+nf(u2*pc.value)+' '+f[5]+'. <a href="/dolar-cripto/">Ver dólar cripto</a>.'}}
   else{{p2p='Al precio USDT P2P ('+nf(pc.value)+' '+f[1]+' por USDT) serían unos '+cf(n/pc.value/usd(b))+' '+lab(b)+'. <a href="/dolar-cripto/">Ver dólar cripto</a>.'}}}}
 }}
 $('res').innerHTML=line;$('p2p').innerHTML=p2p;
 var ch=[];[a,b].forEach(function(k){{if(isC(k)){{var c=CO[k==='SAT'?'BTC':k];if(c)ch.push('<span class="chip src">'+(k==='SAT'?'BTC':k)+': '+c.source+'</span><span class="chip">'+ago(c.time)+'</span>')}}else if(k!=='USD'&&MID[k]){{ch.push('<span class="chip src">'+fi(k)[1]+': '+MID[k].source+'</span><span class="chip">'+ago(MID[k].time)+'</span>'+(Date.now()-Date.parse(MID[k].time)>4*864e5?'<span class="chip warn">dato anterior</span>':''))}}}});
 $('chips').innerHTML=ch.join('');
 // reference table: 1 unit (or amount) of the crypto side across all fiats
 var ck=isC(a)?a:isC(b)?b:'BTC',cn=isC(a)&&isFinite(n)?n:1;$('refname').textContent=cf(cn)+' '+lab(ck);
 $('refbody').innerHTML=FI.map(function(f){{var v=cn*usd(ck)*rate(f[0]);return '<tr><td>'+f[2]+'</td><td class="n">'+nf(v,f[0]==='USD'||f[0]==='CAD'||f[0]==='PE'?2:null)+' '+f[1]+'</td><td>'+(f[0]==='USD'?'—':(MID[f[0]]?MID[f[0]].source:'sin dato'))+'</td></tr>'}}).join('');
 try{{history.replaceState(null,'','?de='+a+'&a='+b+'&n='+encodeURIComponent(amt.value))}}catch(e){{}}
}}
from.addEventListener('change',function(){{chips();calc()}});to.addEventListener('change',calc);amt.addEventListener('input',calc);
$('sw').addEventListener('click',function(){{var a=from.value,r=$('out').textContent;from.value=to.value;to.value=a;if(isFinite(lastR))amt.value=Number(lastR.toPrecision(10)).toLocaleString('es',{{useGrouping:false,maximumFractionDigits:8}});chips();calc();amt.focus()}});
$('qa').addEventListener('click',function(e){{var v=e.target.getAttribute('data-v');if(v){{amt.value=Number(v).toLocaleString('es',{{useGrouping:false,maximumFractionDigits:8}});calc()}}}});
if(CO.generated){{var t=$('upd');t.dateTime=CO.generated;t.textContent=ago(CO.generated)}}
chips();calc();
}})();
</script>
{analytics}</body>
</html>
'''
open('convertidor-cripto/index.html','w').write(out)
print('ok')
