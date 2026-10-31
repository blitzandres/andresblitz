---
title: "Redes cripto y comisiones: TRC20, ERC20, BEP20 y Lightning"
description: "Qué es una red (TRC20, ERC20, BEP20, Solana, Lightning, Bitcoin), por qué las comisiones cambian según la red y cómo evitar enviar por la red equivocada. Guía para principiantes."
url: "https://andresblitz.com/guias-cripto/redes-y-comisiones/"
last_updated: "2026-10-31"
lang: "es"
---

> Note for AI agents: this is the clean Markdown version of https://andresblitz.com/guias-cripto/redes-y-comisiones/. The site map for agents is https://andresblitz.com/llms.txt (full content: https://andresblitz.com/llms-full.txt).

# Redes cripto y comisiones: TRC20, ERC20, BEP20 y Lightning

Qué es una red (TRC20, ERC20, BEP20, Solana, Lightning, Bitcoin), por qué las comisiones cambian según la red y cómo evitar enviar por la red equivocada. Guía para principiantes.

Informativo, no es asesoría financiera.

Una misma moneda puede existir en varias **redes** (blockchains). USDT, por ejemplo, circula en Tron, Ethereum, BNB Chain, Solana y otras. Al retirar o enviar, la plataforma te pide elegir la red. Esa elección define la comisión, la velocidad y, sobre todo, a qué direcciones puedes enviar.

## Las redes más comunes

-   **TRC20 (Tron):** muy usada para USDT por sus comisiones generalmente bajas. Las direcciones empiezan con “T”.
-   **ERC20 (Ethereum):** la red original de muchos tokens. Su comisión depende de la congestión y suele ser alta para montos pequeños. Direcciones que empiezan con “0x”.
-   **BEP20 (BNB Chain):** compatible con el formato de Ethereum (también “0x”), con comisiones usualmente bajas. Que la dirección se vea igual no significa que sea la misma red.
-   **Solana:** rápida y de bajo costo; direcciones con otro formato.
-   **Bitcoin (on-chain):** la red principal de Bitcoin. La comisión se paga por tamaño de la transacción (satoshis por byte virtual), no por monto.
-   **Lightning:** una red construida sobre Bitcoin para pagos pequeños y casi instantáneos, con comisiones muy bajas. Usa facturas (_invoices_) en lugar de direcciones tradicionales.

## Por qué cambian las comisiones

Cada red cobra una tarifa para procesar transacciones, y las plataformas suelen cobrar además una comisión fija de retiro que puede ser mayor que la tarifa de la red. Una comisión fija pesa mucho en un envío pequeño y poco en uno grande: 1 USDT de comisión es 10 % de 10 USDT, pero 0,5 % de 200 USDT.

Con la [calculadora de comisión cripto](https://andresblitz.com/comision-cripto/) puedes escribir la comisión que te muestra tu plataforma y ver cuánto llega, el porcentaje y su valor en tu moneda. Para Bitcoin, la calculadora también muestra como referencia las tarifas públicas de mempool.space.

## La regla más importante: misma red en ambos lados

La red que eliges al enviar debe ser la misma que acepta la dirección de destino. Si envías USDT por BEP20 a una dirección que solo espera ERC20, los fondos pueden quedar inaccesibles o requerir un proceso de recuperación incierto.

-   Copia la dirección y la red desde la pantalla de depósito del destino.
-   Revisa los primeros y últimos caracteres de la dirección después de pegarla.
-   Con montos grandes, muchas personas envían primero un monto de prueba.
-   Algunas redes o plataformas piden un _memo_ o _tag_; si se olvida, el depósito puede no acreditarse.

## Herramientas cripto

-   [Dólar cripto (USDT P2P)](https://andresblitz.com/dolar-cripto/)
-   [Convertidor cripto (BTC, USDT)](https://andresblitz.com/convertidor-cripto/)
-   [Calculadora de comisión cripto](https://andresblitz.com/comision-cripto/)
-   [Ahorro en dólares: calculadora histórica](https://andresblitz.com/ahorro-en-dolares/)
-   [Calculadora del costo de enviar dinero](https://andresblitz.com/enviar-dinero/)
-   [Calculadora de salario en dólares](https://andresblitz.com/salario-en-dolares/)

## Más guías

-   [Qué es USDT](https://andresblitz.com/guias-cripto/que-es-usdt/)
-   [Cómo funciona el P2P](https://andresblitz.com/guias-cripto/como-funciona-p2p/)
-   [Estafas comunes](https://andresblitz.com/guias-cripto/estafas-comunes/)
-   [Cómo leer la brecha](https://andresblitz.com/guias-cripto/brecha-dolar-cripto/)

[Todas las guías cripto](https://andresblitz.com/guias-cripto/)

## Preguntas frecuentes

### ¿Qué red es la más barata?

Depende del momento y de la plataforma. TRC20, BEP20, Solana y Lightning suelen tener comisiones bajas; ERC20 y Bitcoin on-chain suelen ser más caras para montos pequeños. Mira siempre la comisión que muestra tu plataforma.

### ¿Qué pasa si envío por la red equivocada?

Los fondos pueden perderse o quedar bloqueados. Algunas plataformas ofrecen recuperación con un costo, pero no está garantizada.

### ¿Lightning sirve para USDT?

Lightning se usa principalmente para Bitcoin. Para USDT se usan otras redes como TRC20, BEP20, ERC20 o Solana.

Feed de tasas: [RSS](https://andresblitz.com/rates/feed.xml)

## Tasas por país

[Tasa BCV hoy (Venezuela)](https://andresblitz.com/tasa-bcv/) · [Dólar hoy en Argentina](https://andresblitz.com/dolar-argentina/) · [Dólar hoy en Colombia](https://andresblitz.com/dolar-colombia/) · [Dólar hoy en México](https://andresblitz.com/dolar-mexico/) · [Dólar hoy en Perú](https://andresblitz.com/dolar-peru/) · [Dólar hoy en Chile](https://andresblitz.com/dolar-chile/)
