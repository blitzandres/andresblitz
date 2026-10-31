# Generates the /comision-cripto/ page shell. Run from repo root: python3 scripts/rates/gen-comision.py
# Baked by scripts/bake-feed.mjs: `var MID=...;/*mid*/`, `var CO=...;/*coins*/`, `var MP=...;/*mempool*/`. No visitor-side API calls.
import json, html, re
E = html.escape
U = 'https://andresblitz.com/comision-cripto/'
title = 'Calculadora de comisión cripto: cuánto llega al enviar USDT, USDC o BTC'
desc = 'Calcula cuánto llega al retirar o enviar USDT, USDC o Bitcoin por TRC20, ERC20, BEP20, Solana, Lightning o la red de Bitcoin: comisión en %, valor en bolívares, pesos, soles o dólares y comparación con una remesa.'
faq = [('¿Cómo uso la calculadora?','Escribe el monto que vas a enviar, elige la moneda y la red, y copia la comisión de retiro que te muestra tu plataforma. La calculadora resta esa comisión y te dice cuánto llega, qué porcentaje se pierde y cuánto vale en tu moneda local.'),
('¿Por qué tengo que escribir yo la comisión?','Porque cada plataforma cobra distinto y cambia sus comisiones con frecuencia. Esta página no consulta ni compara proveedores: usa solo el número que tú ves al retirar.'),
('¿Qué red conviene usar?','Depende de lo que acepten la plataforma de origen y la de destino. Lo más importante es que ambas usen la misma red: enviar por una red distinta a la de la dirección de destino puede hacer que pierdas los fondos. Revisa siempre la red y la dirección antes de confirmar.'),
('¿Qué son las tarifas de mempool.space?','Son estimaciones públicas de cuántos satoshis por byte virtual se pagan para que una transacción de Bitcoin se confirme pronto. Se muestran solo como información; la comisión real la fija tu plataforma o tu billetera.'),
('¿Cómo se compara con enviar una remesa?','Puedes escribir lo que cobra una remesadora y la tasa que ofrece para ver lo que llegaría por cada vía. Para un análisis detallado del costo de una remesa usa la calculadora de enviar dinero.'),
('¿Esta página recomienda alguna plataforma?','No. Son estimaciones, no es asesoría financiera. No tiene botones de compra, enlaces de afiliados, señales ni predicciones.')]
faqld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},ensure_ascii=False,separators=(',',':'))
wp = json.dumps({"@context":"https://schema.org","@type":"WebApplication","name":title,"url":U,"applicationCategory":"FinanceApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"inLanguage":"es","datePublished":"2026-10-31","dateModified":"","author":{"@type":"Person","name":"Andrés Blitz","url":"https://andresblitz.com/"}},ensure_ascii=False,separators=(',',':'))
src = open('enviar-dinero/index.html').read()
base_style = src[src.index('<style>'):src.index('</style>')+8]
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
links = ' · '.join(['<a href=\"/guias-cripto/\">Guías cripto para principiantes</a>','<a href="/convertidor-cripto/">Convertidor cripto (BTC, USDT)</a>','<a href="/dolar-cripto/">Dólar cripto (USDT P2P)</a>','<a href="/enviar-dinero/">Calculadora del costo de enviar dinero</a>','<a href="/salario-en-dolares/">Calculadora de salario en dólares</a>','<a href="/ahorro-en-dolares/">Ahorro en dólares: calculadora histórica</a>','<a href="/tasa-bcv/">Tasa BCV hoy (Venezuela)</a>'] + [f'<a href="/{s}/">Dólar hoy en {n}</a>' for s,n in [('dolar-argentina','Argentina'),('dolar-colombia','Colombia'),('dolar-mexico','México'),('dolar-peru','Perú'),('dolar-chile','Chile')]])
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
.big{{display:grid;grid-template-columns:1fr minmax(110px,36%);gap:8px;align-items:center}}
.big input{{font:inherit;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;background:transparent;border:0;color:var(--text);min-width:0;width:100%;min-height:44px}}.big input:focus{{outline:none}}
select,.sm{{font:inherit;font-size:15px;min-height:44px;background:#16203a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:6px 8px;width:100%;min-width:0}}
.seg{{display:flex;flex-wrap:wrap;gap:6px;min-height:40px}}.seg button{{min-height:38px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:#0f1527;color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}}.seg button[aria-pressed=true]{{background:#16203a;border-color:var(--acc);font-weight:600}}
.qa{{display:flex;flex-wrap:wrap;gap:6px;min-height:36px}}.qa button{{min-height:34px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:#0f1527;color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}
.kpis{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}}.kpi{{background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--t,#7fc8a9);border-radius:12px;padding:10px;min-height:84px}}
.kpi .k{{font-size:12px;color:var(--mute)}}.kpi .v{{font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px;overflow-wrap:anywhere}}.kpi .s{{font-size:12px;color:var(--mute)}}
.ok{{--t:#7fc8a9}}.mid{{--t:#e0b252}}.hi{{--t:#e98a8a}}
.res{{font-size:16px;margin:12px 0 4px;min-height:3em}}.warnl{{color:#e0b252;font-size:14px;min-height:1.4em;margin:0}}
.chips{{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:24px}}.chip{{display:inline-block;font-size:11.5px;color:var(--mute);background:#0f1527;border:1px solid var(--line);border-radius:999px;padding:2px 8px}}.chip.src{{color:var(--acc)}}
.cmp{{width:100%;border-collapse:collapse;font-size:14px}}.cmp th,.cmp td{{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left}}.n{{text-align:right!important;white-space:nowrap;font-variant-numeric:tabular-nums}}
.tblwrap{{overflow-x:auto}}
@media (max-width:520px){{.kpis{{grid-template-columns:1fr}}.big input{{font-size:23px}}.grid2{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<main id="contenido">
<header>
  <h1>Calculadora de comisión cripto: cuánto llega</h1>
  <p class="sub">Escribe el monto, la moneda, la red y la comisión de retiro que te muestra tu plataforma. Te decimos cuánto llega, qué porcentaje se va en comisión y cuánto vale en tu moneda.</p>
</header>
<p class="aviso" role="note">Estimaciones, no es asesoría financiera.</p>

<section class="box" aria-label="Calculadora">
  <div class="side">
    <label for="amt">Monto que envías</label>
    <div class="big"><input id="amt" inputmode="decimal" autocomplete="off" value="100"><select id="coin" aria-label="Moneda"><option value="USDT">USDT</option><option value="USDC">USDC</option><option value="BTC">BTC</option></select></div>
    <div class="qa" id="qa" aria-label="Montos rápidos"></div>
  </div>
  <div class="side">
    <span class="lbl" id="l-net">Red</span>
    <div class="seg" id="net" role="group" aria-labelledby="l-net"></div>
  </div>
  <div class="grid2">
    <div class="side"><label for="fee">Comisión de retiro que muestra tu plataforma (<span id="feeu">USDT</span>)</label><input id="fee" class="sm" inputmode="decimal" autocomplete="off" value="1"></div>
    <div class="side"><label for="dest">Ver el valor en</label><select id="dest"></select></div>
  </div>
</section>

<div class="kpis" aria-live="polite">
  <div class="kpi" id="k1"><div class="k">Llega</div><div class="v" id="v-llega">—</div><div class="s" id="s-llega"></div></div>
  <div class="kpi" id="k2"><div class="k">Comisión</div><div class="v" id="v-pct">—</div><div class="s" id="s-pct"></div></div>
  <div class="kpi" id="k3"><div class="k">En tu moneda</div><div class="v" id="v-loc">—</div><div class="s" id="s-loc"></div></div>
</div>
<p class="res" id="res">Activa JavaScript para usar la calculadora.</p>
<p class="warnl" id="warn"></p>
<div class="chips" id="chips"></div>

<section id="remesa" aria-labelledby="h-rem">
  <h2 id="h-rem">Comparar con una remesa</h2>
  <p class="nota">Opcional: escribe lo que cobra una remesadora por enviar el mismo valor en dólares y la tasa que te ofrece. Para el detalle del costo usa la <a href="/enviar-dinero/">calculadora de enviar dinero</a>.</p>
  <div class="grid2">
    <div class="side"><label for="rfee">Comisión de la remesadora (USD)</label><input id="rfee" class="sm" inputmode="decimal" autocomplete="off" placeholder="ej. 5"></div>
    <div class="side"><label for="rrate">Tasa que ofrece (<span id="rrateu">VES</span> por USD)</label><input id="rrate" class="sm" inputmode="decimal" autocomplete="off" placeholder="tasa de referencia"></div>
  </div>
  <div class="tblwrap"><table class="cmp"><thead><tr><th scope="col">Vía</th><th scope="col" class="n">Llega</th><th scope="col" class="n">Costo</th></tr></thead><tbody id="cmpb"><tr><td colspan="3">—</td></tr></tbody></table></div>
</section>

<section id="mempool" aria-labelledby="h-mp">
  <h2 id="h-mp">Tarifas de la red Bitcoin ahora (informativo)</h2>
  <div class="tblwrap"><table class="cmp"><thead><tr><th scope="col">Prioridad</th><th scope="col" class="n">sat/vB</th><th scope="col" class="n">Envío típico (~140 vB)</th></tr></thead><tbody id="mpb"><!--mp:start--><!--mp:end--></tbody></table></div>
  <p class="nota">Fuente: <a href="https://mempool.space/" rel="nofollow">mempool.space</a>, <time id="mpt" datetime="">—</time>. Solo como referencia: tu plataforma o billetera fija la comisión real, y las plataformas suelen cobrar un monto fijo distinto.</p>
</section>

<section id="como" aria-labelledby="h-como">
  <h2 id="h-como">Cómo se calcula</h2>
  <p>Llega = monto − comisión de retiro. Comisión % = comisión ÷ monto. El valor en tu moneda usa el precio de la moneda en dólares (CoinGecko; Bitcoin con la misma serie del feed de tasas) y la tasa de referencia del país. En Venezuela, Argentina y Colombia también mostramos el valor al precio USDT P2P. Envía siempre por la misma red que acepta la dirección de destino.</p>
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
  <p style="margin:0">Estimaciones, no es asesoría financiera. Sin botones de compra, enlaces de afiliados, señales ni predicciones; las comisiones las escribe cada usuario. Precios: <a href="https://www.coingecko.com/" rel="nofollow">CoinGecko</a>; tarifas de Bitcoin: <a href="https://mempool.space/" rel="nofollow">mempool.space</a>. Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/convertidor-cripto/">Convertidor cripto</a> · <a href="/dolar-cripto/">Dólar cripto</a> · <a href="/enviar-dinero/">Enviar dinero</a> · <a href="/ahorro-en-dolares/">Ahorro en dólares</a> · <a href="/guias-cripto/">Guías cripto</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
<script>
var MID={{}};/*mid*/
var CO={{}};/*coins*/
var MP={{}};/*mempool*/
(function(){{
var $=function(s){{return document.getElementById(s)}};
var NETS={{USDT:[['TRC20','TRC20 (Tron)'],['ERC20','ERC20 (Ethereum)'],['BEP20','BEP20 (BNB Chain)'],['SOL','Solana']],USDC:[['ERC20','ERC20 (Ethereum)'],['BEP20','BEP20 (BNB Chain)'],['SOL','Solana']],BTC:[['LN','Lightning'],['BTC','Red de Bitcoin (on-chain)']]}};
var FI=[['VE','VES','Bolívares (tasa BCV)','bolívares','la tasa BCV'],['AR','ARS','Pesos argentinos (oficial)','pesos argentinos','el dólar oficial'],['ARB','ARS','Pesos argentinos (blue)','pesos argentinos','el dólar blue'],['CO','COP','Pesos colombianos (TRM)','pesos colombianos','la TRM'],['MX','MXN','Pesos mexicanos (FIX)','pesos mexicanos','el FIX'],['PE','PEN','Soles peruanos','soles','la tasa de referencia'],['CL','CLP','Pesos chilenos','pesos chilenos','el dólar observado'],['USD','USD','Dólares estadounidenses','dólares',''],['CAD','CAD','Dólares canadienses','dólares canadienses','la tasa del Banco de Canadá']];
var P2P={{VE:'ve',AR:'ar',ARB:'ar',CO:'co'}};
var coin=$('coin'),amt=$('amt'),fee=$('fee'),dest=$('dest'),net='TRC20';
dest.innerHTML=FI.map(function(f){{return '<option value="'+f[0]+'">'+f[2]+'</option>'}}).join('');
var q=new URLSearchParams(location.search);
if(NETS[q.get('m')])coin.value=q.get('m');
if(q.get('a')&&FI.some(function(f){{return f[0]===q.get('a')}}))dest.value=q.get('a');
['n','c'].forEach(function(k){{if(q.get(k))(k==='n'?amt:fee).value=q.get(k)}});
function fi(k){{for(var i=0;i<FI.length;i++)if(FI[i][0]===k)return FI[i]}}
function parse(s){{s=String(s).replace(/[\\s_]/g,'');if(!s)return NaN;var c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>-1&&d>-1){{s=c>d?s.replace(/\\./g,'').replace(',','.'):s.replace(/,/g,'')}}else if(c>-1){{s=(s.split(',').length>2)?s.replace(/,/g,''):s.replace(',','.')}}else if(d>-1&&s.split('.').length>2){{s=s.replace(/\\./g,'')}}
 return /^\\d*\\.?\\d+$/.test(s)?parseFloat(s):NaN}}
function nf(v,d){{if(!isFinite(v))return '—';var a=Math.abs(v);if(d==null)d=a>=1000?0:2;return v.toLocaleString('es',{{maximumFractionDigits:d,minimumFractionDigits:0}})}}
function cf(v,c){{if(!isFinite(v))return '—';return v.toLocaleString('es',{{maximumFractionDigits:c==='BTC'?8:2}})+' '+c}}
function usd(c){{return CO[c]?CO[c].usd:NaN}}
function rate(k){{return k==='USD'?1:MID[k]?MID[k].value:NaN}}
function lf(v,k){{var f=fi(k);return nf(v,['USD','CAD','PE'].indexOf(k)>-1?2:null)+' '+f[1]}}
function nets(){{var l=NETS[coin.value];if(!l.some(function(n){{return n[0]===net}}))net=l[0][0];
 $('net').innerHTML=l.map(function(n){{return '<button type="button" data-n="'+n[0]+'" aria-pressed="'+(n[0]===net)+'">'+n[1]+'</button>'}}).join('');
 $('feeu').textContent=coin.value;
 var qa=coin.value==='BTC'?[0.0005,0.001,0.01,0.1]:[50,100,200,500,1000];
 $('qa').innerHTML=qa.map(function(v){{return '<button type="button" data-v="'+v+'">'+cf(v,coin.value)+'</button>'}}).join('')}}
var last={{}};
function calc(){{var c=coin.value,n=parse(amt.value),f=parse(fee.value),k=dest.value,F=fi(k);
 if(fee.value.trim()==='')f=0;
 var ok=isFinite(n)&&n>0&&isFinite(f)&&f>=0,got=n-f,pct=f/n*100,px=usd(c),r=rate(k);
 $('rrateu').textContent=F[1];
 var line='',warn='',ch=[];
 if(!ok){{['v-llega','v-pct','v-loc'].forEach(function(i){{$(i).textContent='—'}});['s-llega','s-pct','s-loc'].forEach(function(i){{$(i).textContent=''}});
  line=!isFinite(n)||!(n>0)?'Escribe el monto que vas a enviar, por ejemplo 100 o 0,01.':'Escribe la comisión que muestra tu plataforma (0 si no cobra).'}}
 else if(got<=0){{$('v-llega').textContent=cf(0,c);$('v-pct').textContent='100 % o más';$('v-loc').textContent='—';line='La comisión es igual o mayor que el monto: no llegaría nada.'}}
 else{{
  var gu=got*px,gl=gu*r,fu=f*px;
  $('v-llega').textContent=cf(got,c);$('s-llega').textContent=isFinite(gu)?'≈ '+nf(gu,2)+' dólares':'';
  $('v-pct').textContent=nf(pct,pct<1?2:1)+' %';$('s-pct').textContent=cf(f,c)+(isFinite(fu)?' ≈ '+nf(fu,2)+' USD':'');
  $('k2').className='kpi '+(pct<1?'ok':pct<3?'mid':'hi');
  $('v-loc').textContent=isFinite(gl)?lf(gl,k):'—';
  var pk=P2P[k],pc=pk&&CO.p2p&&CO.p2p[pk];
  $('s-loc').textContent=pc&&isFinite(gu)?'al precio USDT P2P: '+lf(gu*pc.value,k):(F[4]?'con '+F[4]:'');
  line='Envías <strong>'+cf(n,c)+'</strong> por '+NETS[c].filter(function(x){{return x[0]===net}})[0][1]+' y llegan <strong>'+cf(got,c)+'</strong>'+(isFinite(gl)?', unos <strong>'+lf(gl,k)+'</strong>'+(F[4]?' con '+F[4]:''):'')+'. La comisión se lleva el <strong>'+nf(pct,pct<1?2:1)+' %</strong>'+(pct<1?', un costo bajo para este monto.':pct<3?'.':', un costo alto para este monto; un monto mayor la diluye.');
  if(c==='BTC'&&net==='BTC'&&MP.halfHourFee){{var est=MP.halfHourFee*140/1e8;line+=' Como referencia, una transacción típica en la red de Bitcoin cuesta hoy unos '+cf(est,'BTC').replace(' BTC','')+' BTC ('+nf(est*1e8,0)+' sats) según mempool.space.'}}
  if(c==='BTC'&&net==='LN'&&n>0.05)warn='Montos grandes por Lightning pueden fallar por falta de liquidez del canal; revisa el límite de tu billetera.';
  if(c!=='BTC'&&net==='ERC20'&&pct>2)warn='En ERC20 la comisión suele ser alta para montos pequeños; verifica si tu destino acepta otra red.';
 }}
 $('res').innerHTML=line;$('warn').textContent=warn;
 if(CO[c])ch.push('<span class="chip src">'+c+': '+CO[c].source+'</span><span class="chip">'+new Date(CO[c].time).toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})+'</span>');
 if(k!=='USD'&&MID[k])ch.push('<span class="chip src">'+F[1]+': '+MID[k].source+'</span><span class="chip">'+new Date(MID[k].time).toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})+'</span>');
 $('chips').innerHTML=ch.join('');
 // remittance comparison: same USD value
 var rows='';
 if(ok&&got>0&&isFinite(px)&&isFinite(r)){{var su=n*px,rf=parse($('rfee').value),rr=parse($('rrate').value);if(!isFinite(rr))rr=r;if(!isFinite(rf))rf=NaN;
  rows+='<tr><td>Cripto ('+c+', '+net+')</td><td class="n">'+lf(got*px*r,k)+'</td><td class="n">'+nf(pct,pct<1?2:1)+' %</td></tr>';
  if(isFinite(rf)){{var rl=(su-rf)*rr,rc=(1-rl/(su*r))*100;rows+='<tr><td>Remesa (comisión '+nf(rf,2)+' USD, tasa '+nf(rr)+')</td><td class="n">'+(rl>0?lf(rl,k):'—')+'</td><td class="n">'+(rl>0?nf(rc,1)+' %':'—')+'</td></tr>'}}
  else rows+='<tr><td colspan="3">Escribe la comisión de la remesadora para comparar.</td></tr>'}}
 $('cmpb').innerHTML=rows||'<tr><td colspan="3">—</td></tr>';
 try{{history.replaceState(null,'','?m='+c+'&r='+net+'&n='+encodeURIComponent(amt.value)+'&c='+encodeURIComponent(fee.value)+'&a='+k)}}catch(e){{}}
}}
if(q.get('r'))net=q.get('r');
nets();
$('net').addEventListener('click',function(e){{var b=e.target.closest('button');if(b){{net=b.getAttribute('data-n');nets();calc()}}}});
$('qa').addEventListener('click',function(e){{var v=e.target.getAttribute('data-v');if(v){{amt.value=Number(v).toLocaleString('es',{{useGrouping:false,maximumFractionDigits:8}});calc()}}}});
coin.addEventListener('change',function(){{if(coin.value==='BTC'&&parse(amt.value)>10){{amt.value='0,01';fee.value='0,0002'}}else if(coin.value!=='BTC'&&parse(amt.value)<1){{amt.value='100';fee.value='1'}}nets();calc()}});
[amt,fee,$('rfee'),$('rrate')].forEach(function(i){{i.addEventListener('input',calc)}});dest.addEventListener('change',calc);
if(MP.time){{var t=$('mpt');t.dateTime=MP.time;t.textContent=new Date(MP.time).toLocaleString('es',{{dateStyle:'medium',timeStyle:'short'}})}}
calc();
}})();
</script>
{analytics}</body>
</html>
'''
open('comision-cripto/index.html','w').write(out)
print('ok')
