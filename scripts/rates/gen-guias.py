# Generates /guias-cripto/ (hub) and its guide pages. Run from repo root: python3 scripts/rates/gen-guias.py
import json, html, re, os
E = html.escape
O = 'https://andresblitz.com'
src = open('enviar-dinero/index.html').read()
base_style = src[src.index('<style>'):src.index('</style>')+8]
analytics = re.search(r"<script>\n\(function\(\)\{var b='https://blitz-analytics.*?</script>\n", src, re.S).group(0)
TOOLS = [('/dolar-cripto/','Dólar cripto (USDT P2P)'),('/convertidor-cripto/','Convertidor cripto (BTC, USDT)'),('/comision-cripto/','Calculadora de comisión cripto'),('/ahorro-en-dolares/','Ahorro en dólares: calculadora histórica'),('/enviar-dinero/','Calculadora del costo de enviar dinero'),('/salario-en-dolares/','Calculadora de salario en dólares')]
RATES = [('/tasa-bcv/','Tasa BCV hoy (Venezuela)'),('/dolar-argentina/','Dólar hoy en Argentina'),('/dolar-colombia/','Dólar hoy en Colombia'),('/dolar-mexico/','Dólar hoy en México'),('/dolar-peru/','Dólar hoy en Perú'),('/dolar-chile/','Dólar hoy en Chile')]
G = [
 dict(slug='que-es-usdt', short='Qué es USDT', title='Qué es USDT y qué son las stablecoins: guía básica',
  desc='Qué es USDT (Tether), qué es una stablecoin, cómo intenta valer un dólar, qué riesgos tiene y en qué se diferencia de un dólar en el banco. Guía en español para principiantes.',
  body='''<p>Una <strong>stablecoin</strong> (moneda estable) es una criptomoneda diseñada para mantener un precio fijo frente a otro activo, casi siempre el dólar estadounidense. Las más conocidas son <strong>USDT</strong> (emitida por Tether) y <strong>USDC</strong> (emitida por Circle). La idea es sencilla: 1 USDT debería valer aproximadamente 1 dólar.</p>
<h2>Cómo intenta valer un dólar</h2>
<p>La empresa emisora dice mantener reservas (efectivo, letras del Tesoro de Estados Unidos y otros activos) por un valor igual o mayor a las monedas que circulan. Cuando alguien entrega dólares, se emiten tokens nuevos; cuando los devuelve, se retiran. Ese mecanismo, junto con el comercio entre plataformas, hace que el precio se mantenga cerca de 1 dólar. En la práctica puede moverse unas centésimas hacia arriba o hacia abajo.</p>
<h2>Por qué se usa tanto en Latinoamérica</h2>
<ul><li>Permite guardar un valor ligado al dólar desde un teléfono, sin cuenta bancaria en el exterior.</li><li>Se puede enviar a otra persona en minutos, a cualquier hora.</li><li>En países con controles cambiarios o varias tasas, su precio en moneda local sirve como referencia del dólar “de mercado”. Eso es lo que mide la página de <a href="/dolar-cripto/">dólar cripto</a>.</li></ul>
<h2>En qué se diferencia de un dólar en el banco</h2>
<p>Un USDT no es un depósito bancario. No tiene seguro de depósitos, depende de la solvencia y la transparencia de la empresa emisora y de la plataforma o billetera donde lo guardes. Si pierdes el acceso a tu billetera o envías a una dirección equivocada, normalmente no hay forma de recuperarlo.</p>
<h2>Riesgos que conviene conocer</h2>
<ul><li><strong>Riesgo del emisor:</strong> el valor depende de que las reservas existan y sean suficientes.</li><li><strong>Riesgo de plataforma:</strong> si dejas tus monedas en una plataforma, dependes de que esta funcione y te permita retirarlas.</li><li><strong>Riesgo de red:</strong> el mismo USDT existe en varias redes (TRC20, ERC20, BEP20 y otras). Enviar por la red equivocada puede hacer que se pierda. Lo explicamos en <a href="/guias-cripto/redes-y-comisiones/">redes y comisiones</a>.</li><li><strong>Riesgo regulatorio:</strong> las reglas cambian según el país.</li></ul>
<h2>Cómo ver su valor en tu moneda</h2>
<p>El <a href="/convertidor-cripto/">convertidor cripto</a> muestra cuánto equivale una cantidad de USDT en bolívares, pesos o soles con tasas de referencia, y la página de <a href="/dolar-cripto/">dólar cripto</a> muestra el precio P2P en Venezuela, Argentina y Colombia.</p>''',
  faq=[('¿1 USDT siempre vale 1 dólar?','Está diseñado para eso y normalmente cotiza muy cerca de 1 dólar, pero puede desviarse un poco, y en momentos de tensión puede desviarse más.'),('¿USDT y USDC son lo mismo?','Ambas son stablecoins ligadas al dólar, pero las emiten empresas distintas, con reservas y reglas propias.'),('¿Un USDT tiene seguro como un depósito bancario?','No. No está cubierto por seguros de depósitos.')]),
 dict(slug='como-funciona-p2p', short='Cómo funciona el P2P', title='Cómo funciona el P2P de criptomonedas: guía básica',
  desc='Qué es el mercado P2P de criptomonedas, cómo funciona una operación con custodia (escrow), qué son los anuncios, límites y métodos de pago, y qué cuidar. Explicado de forma neutral.',
  body='''<p><strong>P2P</strong> significa “de persona a persona”. En un mercado P2P de criptomonedas, una persona que quiere vender USDT (u otra moneda) publica un anuncio con su precio y sus métodos de pago, y otra persona que quiere comprar lo acepta. La plataforma no vende: pone en contacto a las partes y retiene las criptomonedas mientras se completa el pago. Plataformas como Binance P2P, entre otras, funcionan de esta forma.</p>
<h2>Paso a paso de una operación típica</h2>
<ol><li><strong>Anuncio:</strong> el vendedor publica precio, cantidad mínima y máxima, métodos de pago aceptados (transferencia, pago móvil, billeteras locales) y condiciones.</li><li><strong>Orden:</strong> el comprador abre una orden por un monto. Las criptomonedas del vendedor quedan bloqueadas por la plataforma (custodia o <em>escrow</em>).</li><li><strong>Pago:</strong> el comprador paga por fuera de la plataforma, con el método indicado, y marca la orden como pagada.</li><li><strong>Liberación:</strong> el vendedor confirma que recibió el dinero en su cuenta y libera las criptomonedas, que pasan al comprador.</li><li><strong>Disputa:</strong> si algo falla, cualquiera puede abrir una apelación y la plataforma revisa las pruebas.</li></ol>
<h2>Por qué los precios varían</h2>
<p>Cada anunciante fija su precio. Influyen el método de pago, el monto, la reputación del anunciante y la demanda del momento. Por eso en <a href="/dolar-cripto/">dólar cripto</a> usamos la <strong>mediana</strong> de varios anuncios: representa el precio típico sin dejarse llevar por anuncios extremos.</p>
<h2>Qué mirar en un anuncio</h2>
<ul><li>Cantidad de operaciones completadas y porcentaje de finalización del anunciante.</li><li>Tiempo límite para pagar y para liberar.</li><li>Que el nombre del titular de la cuenta que paga coincida con el de la cuenta en la plataforma (muchas plataformas lo exigen).</li><li>Condiciones escritas en el anuncio, sin acuerdos “por fuera”.</li></ul>
<h2>Buenas prácticas generales</h2>
<ul><li>Mantén toda la conversación dentro del chat de la plataforma.</li><li>Como vendedor, libera solo después de ver el dinero acreditado en tu cuenta, no por una captura de pantalla.</li><li>Como comprador, paga solo a la cuenta indicada en la orden.</li><li>Lee la guía de <a href="/guias-cripto/estafas-comunes/">estafas comunes</a> antes de operar.</li></ul>''',
  faq=[('¿La plataforma P2P me vende las criptomonedas?','No. En el P2P la contraparte es otra persona; la plataforma retiene las criptomonedas mientras se hace el pago y media en disputas.'),('¿Qué es el escrow o custodia?','Es el bloqueo temporal de las criptomonedas del vendedor por parte de la plataforma hasta que se confirma el pago.'),('¿Por qué el precio P2P es distinto del oficial?','Porque lo fijan los propios usuarios según la oferta y la demanda; la diferencia con la tasa oficial es la brecha.')]),
 dict(slug='redes-y-comisiones', short='Redes y comisiones', title='Redes cripto y comisiones: TRC20, ERC20, BEP20 y Lightning',
  desc='Qué es una red (TRC20, ERC20, BEP20, Solana, Lightning, Bitcoin), por qué las comisiones cambian según la red y cómo evitar enviar por la red equivocada. Guía para principiantes.',
  body='''<p>Una misma moneda puede existir en varias <strong>redes</strong> (blockchains). USDT, por ejemplo, circula en Tron, Ethereum, BNB Chain, Solana y otras. Al retirar o enviar, la plataforma te pide elegir la red. Esa elección define la comisión, la velocidad y, sobre todo, a qué direcciones puedes enviar.</p>
<h2>Las redes más comunes</h2>
<ul><li><strong>TRC20 (Tron):</strong> muy usada para USDT por sus comisiones generalmente bajas. Las direcciones empiezan con “T”.</li><li><strong>ERC20 (Ethereum):</strong> la red original de muchos tokens. Su comisión depende de la congestión y suele ser alta para montos pequeños. Direcciones que empiezan con “0x”.</li><li><strong>BEP20 (BNB Chain):</strong> compatible con el formato de Ethereum (también “0x”), con comisiones usualmente bajas. Que la dirección se vea igual no significa que sea la misma red.</li><li><strong>Solana:</strong> rápida y de bajo costo; direcciones con otro formato.</li><li><strong>Bitcoin (on-chain):</strong> la red principal de Bitcoin. La comisión se paga por tamaño de la transacción (satoshis por byte virtual), no por monto.</li><li><strong>Lightning:</strong> una red construida sobre Bitcoin para pagos pequeños y casi instantáneos, con comisiones muy bajas. Usa facturas (<em>invoices</em>) en lugar de direcciones tradicionales.</li></ul>
<h2>Por qué cambian las comisiones</h2>
<p>Cada red cobra una tarifa para procesar transacciones, y las plataformas suelen cobrar además una comisión fija de retiro que puede ser mayor que la tarifa de la red. Una comisión fija pesa mucho en un envío pequeño y poco en uno grande: 1 USDT de comisión es 10 % de 10 USDT, pero 0,5 % de 200 USDT.</p>
<p>Con la <a href="/comision-cripto/">calculadora de comisión cripto</a> puedes escribir la comisión que te muestra tu plataforma y ver cuánto llega, el porcentaje y su valor en tu moneda. Para Bitcoin, la calculadora también muestra como referencia las tarifas públicas de mempool.space.</p>
<h2>La regla más importante: misma red en ambos lados</h2>
<p>La red que eliges al enviar debe ser la misma que acepta la dirección de destino. Si envías USDT por BEP20 a una dirección que solo espera ERC20, los fondos pueden quedar inaccesibles o requerir un proceso de recuperación incierto.</p>
<ul><li>Copia la dirección y la red desde la pantalla de depósito del destino.</li><li>Revisa los primeros y últimos caracteres de la dirección después de pegarla.</li><li>Con montos grandes, muchas personas envían primero un monto de prueba.</li><li>Algunas redes o plataformas piden un <em>memo</em> o <em>tag</em>; si se olvida, el depósito puede no acreditarse.</li></ul>''',
  faq=[('¿Qué red es la más barata?','Depende del momento y de la plataforma. TRC20, BEP20, Solana y Lightning suelen tener comisiones bajas; ERC20 y Bitcoin on-chain suelen ser más caras para montos pequeños. Mira siempre la comisión que muestra tu plataforma.'),('¿Qué pasa si envío por la red equivocada?','Los fondos pueden perderse o quedar bloqueados. Algunas plataformas ofrecen recuperación con un costo, pero no está garantizada.'),('¿Lightning sirve para USDT?','Lightning se usa principalmente para Bitcoin. Para USDT se usan otras redes como TRC20, BEP20, ERC20 o Solana.')]),
 dict(slug='estafas-comunes', short='Estafas comunes', title='Estafas cripto comunes y cómo evitarlas',
  desc='Las estafas más comunes con criptomonedas y P2P: comprobantes falsos, falsos soportes, promesas de ganancias, phishing, triangulación y más. Señales de alerta y cómo protegerte.',
  body='''<p>Las criptomonedas se mueven rápido y una transacción enviada normalmente no se puede revertir. Por eso las estafas buscan apurarte o hacer que confíes en la persona equivocada. Estas son las más frecuentes y las señales para reconocerlas.</p>
<h2>Estafas frecuentes</h2>
<ul><li><strong>Comprobante falso:</strong> en P2P, el comprador envía una captura de una transferencia que nunca ocurrió y presiona para que liberes. Señal: te piden liberar “ya” sin que veas el dinero en tu cuenta.</li><li><strong>Falso soporte técnico:</strong> alguien te escribe por redes sociales o mensajería diciendo ser de una plataforma y te pide tu código de verificación, tu frase semilla o que instales una aplicación de acceso remoto. Ningún soporte real pide eso.</li><li><strong>Promesas de ganancias:</strong> “duplica tus USDT”, “inversión garantizada del 5 % semanal”, grupos que muestran ganancias de otros. Ninguna ganancia alta está garantizada.</li><li><strong>Phishing:</strong> enlaces a páginas idénticas a las de una plataforma para robar tu contraseña. Verifica la dirección web y entra siempre escribiéndola tú.</li><li><strong>Triangulación:</strong> un estafador usa tu anuncio P2P para que una tercera persona, también engañada, te pague a ti. Luego esa persona reclama y tu cuenta puede quedar bloqueada. Señal: el nombre del pagador no coincide con el de la cuenta en la plataforma.</li><li><strong>Pago fuera de la plataforma:</strong> te proponen cerrar el trato por fuera “para ahorrar comisiones”. Pierdes la custodia y la posibilidad de disputa.</li><li><strong>Reembolsos o contracargos:</strong> el pagador usa un método que puede revertirse después de que liberaste.</li><li><strong>Romance o amistad:</strong> alguien gana tu confianza durante semanas y luego te invita a una “oportunidad”.</li></ul>
<h2>Hábitos que protegen</h2>
<ul><li>Nunca compartas tu frase semilla ni tus códigos de verificación.</li><li>Activa la verificación en dos pasos con una aplicación, no solo por SMS.</li><li>Verifica el dinero en tu propia cuenta bancaria antes de liberar.</li><li>Mantén la conversación y los pagos dentro de la plataforma.</li><li>Desconfía de la urgencia: un estafador siempre tiene prisa.</li><li>Revisa la red y la dirección antes de enviar (ver <a href="/guias-cripto/redes-y-comisiones/">redes y comisiones</a>).</li></ul>
<h2>Si crees que te estafaron</h2>
<p>Abre una disputa en la plataforma de inmediato, guarda capturas y comprobantes, cambia tus contraseñas y, si corresponde, presenta una denuncia ante las autoridades de tu país.</p>''',
  faq=[('¿Un soporte de una plataforma puede pedirme mi frase semilla?','No. Ninguna plataforma ni soporte legítimo necesita tu frase semilla ni tus códigos de verificación.'),('¿Una captura de pantalla prueba que me pagaron?','No. En P2P, confirma siempre el dinero acreditado en tu propia cuenta antes de liberar.'),('¿Qué es la triangulación?','Una estafa en la que alguien hace que una tercera persona engañada te pague, para quedarse con tus criptomonedas; la víctima luego reclama el pago.')]),
 dict(slug='brecha-dolar-cripto', short='Cómo leer la brecha', title='Cómo leer la brecha del dólar cripto vs. el oficial',
  desc='Qué es la brecha entre el dólar cripto (USDT P2P) y el dólar oficial, cómo se calcula, qué la mueve y cómo leer los colores y el historial de la página de dólar cripto.',
  body='''<p>La <strong>brecha</strong> es la diferencia porcentual entre el precio del USDT en el mercado P2P y la tasa oficial de un país. Es una forma simple de ver cuánto más (o menos) cuesta el dólar digital frente al dólar oficial.</p>
<h2>Cómo se calcula</h2>
<p>Brecha = (precio USDT P2P ÷ tasa oficial − 1) × 100. Si el USDT cotiza a 990 bolívares y la tasa BCV es 900, la brecha es (990 ÷ 900 − 1) × 100 = 10 %. Una brecha negativa significa que el USDT está por debajo de la tasa oficial.</p>
<p>En la página de <a href="/dolar-cripto/">dólar cripto</a> la tasa oficial es la tasa BCV en Venezuela, el dólar oficial en Argentina y la TRM en Colombia. El precio P2P es la mediana de varios anuncios.</p>
<h2>Cómo leer los colores</h2>
<ul><li><strong>Verde (menos de 5 %):</strong> ambos mercados están cerca.</li><li><strong>Amarillo (5 % a 20 %):</strong> hay una diferencia notable.</li><li><strong>Rojo (más de 20 %):</strong> diferencia grande.</li></ul>
<p>Los colores describen el tamaño de la diferencia, no indican si conviene hacer algo.</p>
<h2>Qué suele mover la brecha</h2>
<ul><li>Restricciones o límites para comprar dólares por la vía oficial.</li><li>Cambios en la oferta y la demanda de dólares en el mercado local.</li><li>Ajustes de la tasa oficial, que puede moverse con retraso frente al mercado.</li><li>Comisiones y costos de los métodos de pago usados en P2P.</li><li>Días festivos o fines de semana, cuando la tasa oficial no se actualiza pero el P2P sigue operando.</li></ul>
<h2>Leer el historial</h2>
<p>La vista de gráfico muestra la brecha de los últimos días y la línea de resumen la compara con la semana anterior. Es una descripción de lo que pasó, no una predicción. Para ver qué habría pasado con un ahorro en moneda local frente a dólares en meses anteriores, usa la calculadora de <a href="/ahorro-en-dolares/">ahorro en dólares</a>.</p>
<h2>Limitaciones</h2>
<p>El precio P2P cambia minuto a minuto y varía por método de pago y monto; la tasa oficial puede tener otra hora de publicación. Por eso cada dato muestra su fuente y su hora.</p>''',
  faq=[('¿Qué significa una brecha de 10 %?','Que el USDT en P2P cuesta 10 % más en moneda local que el dólar a la tasa oficial.'),('¿Puede ser negativa?','Sí. Significa que el USDT P2P está por debajo de la tasa oficial, algo que a veces ocurre en Colombia.'),('¿La brecha predice la tasa oficial?','No. Es una medida de la diferencia en un momento dado, no una predicción.')]),
]
def page(path, title, desc, h1, lead, body, faq, crumbs, modified='2026-10-31'):
    U = O + path
    art = {"@context":"https://schema.org","@type":"Article","headline":title,"description":desc,"inLanguage":"es","url":U,"mainEntityOfPage":U,"datePublished":"2026-10-31","dateModified":modified,"author":{"@type":"Person","name":"Andrés Blitz","url":O+"/"},"publisher":{"@type":"Person","name":"Andrés Blitz","url":O+"/"},"image":O+"/assets/og-cover.png"}
    if path == '/guias-cripto/': art["@type"] = "CollectionPage"
    bc = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":O+p} for i,(p,n) in enumerate(crumbs)]}
    fl = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]}
    J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',',':'))
    nav = ' › '.join(f'<a href="{p}">{E(n)}</a>' if i < len(crumbs)-1 else f'<span aria-current="page">{E(n)}</span>' for i,(p,n) in enumerate(crumbs))
    guides = ''.join(f'<li><a href="/guias-cripto/{g["slug"]}/">{E(g["short"])}</a></li>' for g in G if path != f'/guias-cripto/{g["slug"]}/')
    return f'''<!doctype html>
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
<meta property="og:type" content="article">
<meta property="og:locale" content="es_LA">
<meta property="og:site_name" content="andresblitz.com">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{U}">
<meta property="og:image" content="https://andresblitz.com/assets/og-cover.png">
<meta property="article:modified_time" content="{modified}">
<link rel="alternate" type="application/rss+xml" title="Feed de tasas" href="https://andresblitz.com/rates/feed.xml">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{J(art)}</script>
<script type="application/ld+json">{J(bc)}</script>
<script type="application/ld+json">{J(fl)}</script>
{base_style}
<style>
main{{max-width:760px}}
.aviso{{border-left:3px solid #e0b252;background:#16130a;padding:8px 12px;border-radius:8px;margin:10px 0;font-weight:600;font-size:14px}}
.crumbs{{font-size:13px;color:var(--mute);margin:0 0 8px}}.crumbs a{{color:var(--mute)}}
.prose{{font-size:16px;line-height:1.65}}.prose h2{{font-size:19px;margin-top:26px}}.prose li{{margin:4px 0}}
.gcards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding:0;list-style:none}}
.gcards a{{display:block;height:100%;background:var(--panel);border:1px solid var(--line);border-top:3px solid #8fb3ff;border-radius:12px;padding:12px;text-decoration:none;color:var(--text)}}.gcards a:hover{{border-color:var(--acc)}}
.gcards strong{{display:block;font-size:16px;margin-bottom:4px}}.gcards span{{font-size:13.5px;color:var(--mute)}}
.tools{{display:flex;flex-wrap:wrap;gap:6px;padding:0;list-style:none}}.tools a{{display:inline-block;font-size:13.5px;background:#0f1527;border:1px solid var(--line);border-radius:999px;padding:6px 12px;text-decoration:none}}
</style>
</head>
<body>
<main id="contenido">
<nav class="crumbs" aria-label="Ruta">{nav}</nav>
<header>
  <h1>{E(h1)}</h1>
  <p class="sub">{lead}</p>
</header>
<p class="aviso" role="note">Informativo, no es asesoría financiera.</p>
<article class="prose">
{body}
</article>
<section id="herramientas" aria-labelledby="h-tools">
  <h2 id="h-tools">Herramientas cripto</h2>
  <ul class="tools">{''.join(f'<li><a href="{p}">{E(n)}</a></li>' for p,n in TOOLS)}</ul>
</section>
{f'<section id="mas" aria-labelledby="h-mas"><h2 id="h-mas">Más guías</h2><ul>{guides}</ul><p><a href="/guias-cripto/">Todas las guías cripto</a></p></section>' if path != '/guias-cripto/' else ''}
<section id="faq" aria-labelledby="h-faq">
  <h2 id="h-faq">Preguntas frecuentes</h2>
{chr(10).join(f'  <details><summary><h3>{E(q)}</h3></summary><p>{E(a)}</p></details>' for q,a in faq)}
</section>
<div data-rates-widget><p style="font-size:13px;color:#9aa3b8">Feed de tasas: <a href="/rates/feed.xml">RSS</a></p></div>
<script src="/assets/rates-widget.js" defer></script>
<section id="otros" aria-labelledby="h-otros">
  <h2 id="h-otros">Tasas por país</h2>
  <p>{' · '.join(f'<a href="{p}">{E(n)}</a>' for p,n in RATES)}</p>
</section>
</main>
<footer>
  <p style="margin:0">Informativo, no es asesoría financiera. Sin recomendaciones, botones de compra ni enlaces de afiliados. Las plataformas se mencionan solo como ejemplos. Contacto: <a href="mailto:blitz@mail.grokbot.com">blitz@mail.grokbot.com</a> · British Columbia, Canadá.</p>
  <nav aria-label="Enlaces del sitio"><a href="/">Inicio de andresblitz.com</a> · <a href="/guias-cripto/">Guías cripto</a> · <a href="/dolar-cripto/">Dólar cripto</a> · <a href="/convertidor-cripto/">Convertidor cripto</a> · <a href="/comision-cripto/">Comisión cripto</a> · <a href="/ahorro-en-dolares/">Ahorro en dólares</a> · <a href="/projects/currency-rss/">Feed de tasas (RSS)</a></nav>
</footer>
{analytics}</body>
</html>
'''
HUB = ('/guias-cripto/','Guías cripto')
cards = ''.join(f'<li><a href="/guias-cripto/{g["slug"]}/"><strong>{E(g["short"])}</strong><span>{E(g["desc"].split(". ")[0])}.</span></a></li>' for g in G)
hubfaq = [('¿Para quién son estas guías?','Para personas que están empezando con stablecoins, P2P y envíos en criptomonedas en Latinoamérica y quieren entender los conceptos básicos.'),('¿Recomiendan alguna plataforma o moneda?','No. Las guías son informativas; las plataformas se mencionan solo como ejemplos y no hay enlaces de afiliados.'),('¿Cada cuánto se actualizan?','Son guías de conceptos que cambian poco; se revisan cuando cambia algo importante. Los precios y tasas están en las herramientas.')]
os.makedirs('guias-cripto', exist_ok=True)
open('guias-cripto/index.html','w').write(page('/guias-cripto/','Guías cripto en español: USDT, P2P, redes y estafas','Guías básicas en español sobre USDT y stablecoins, cómo funciona el P2P, redes y comisiones (TRC20, ERC20, BEP20, Lightning), estafas comunes y cómo leer la brecha del dólar cripto.','Guías cripto para principiantes','Conceptos básicos explicados en español, sin recomendaciones: qué es USDT, cómo funciona el P2P, redes y comisiones, estafas comunes y la brecha del dólar cripto.',f'<h2>Las guías</h2>\n<ul class="gcards">{cards}</ul>\n<p>Cada guía enlaza a las herramientas del sitio para ver datos actuales, con fuente y hora.</p>',hubfaq,[('/','Inicio'),HUB]))
for g in G:
    p = f'/guias-cripto/{g["slug"]}/'
    os.makedirs(p.strip('/'), exist_ok=True)
    open(p.strip('/')+'/index.html','w').write(page(p,g['title'],g['desc'],g['title'],E(g['desc']),g['body'],g['faq'],[('/','Inicio'),HUB,(p,g['short'])]))
for t in [('Guías cripto en español: USDT, P2P, redes y estafas')]+[g['title'] for g in G]: print(len(t), t)
