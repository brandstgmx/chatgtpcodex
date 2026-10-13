# QA_REPORT — V12.0 clean baseline

## Resultado

**APROBADO en las ocho resoluciones requeridas.** 249 verificaciones funcionales, 21 comprobaciones avanzadas, ocho pruebas del reel y tres escenarios móviles adicionales de sticky completados. Cero errores de consola en la matriz; ningún fallo funcional pendiente. No hubo rediseño ni cambios de copy.

Entorno: Node 24.19.0, Playwright 1.62.1, Chromium 154.0.8037.57, Linux. Fecha: 2026-10-12. Las ejecuciones se hicieron sobre archivos servidos mediante HTTP.

## Matriz y geometría

Medidas en píxeles CSS. `footerBottom` es la coordenada absoluta (`rect.bottom + scrollY`). La diferencia inferior a 1 px con `scrollHeight` corresponde al redondeo del navegador. El estado expirado reduce en 5 px la altura del bloque de oferta en mobile, igual que en V11.46; no es espacio extra ni crecimiento del documento.

| Viewport | Checks funcionales | scrollHeight activo | scrollHeight expirado | clientHeight | footerBottom expirado | Diferencia PNG normalizada |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 360×800 | 33/33 | 3127 | 3122 | 800 | 3122.156 | 0.00000 % |
| 390×844 | 33/33 | 3252 | 3247 | 844 | 3247.359 | 0.00000 % |
| 430×932 | 33/33 | 3352 | 3347 | 932 | 3346.516 | 0.00000 % |
| 768×1024 | 30/30 | 3409 | 3409 | 1024 | 3408.562 | 0.01581 % |
| 1024×768 | 30/30 | 3593 | 3593 | 768 | 3592.547 | 0.03604 % |
| 1366×768 | 30/30 | 3547 | 3547 | 768 | 3546.609 | 0.07878 % |
| 1440×900 | 30/30 | 3661 | 3661 | 900 | 3660.859 | 0.00000 % |
| 1920×1080 | 30/30 | 3729 | 3729 | 1080 | 3728.781 | 0.00342 % |

En cada resolución se tomaron 45 muestras al intentar repetidamente llegar al final, también durante la animación del reel. La altura permaneció estable y terminó en el footer. `scrollWidth === clientWidth` en las ocho resoluciones.

## Problemas encontrados y correcciones

1. **Overflow del reel durante la animación.** `mask-image` ocultaba los dígitos fuera del reel, pero las tiras absolutas seguían contribuyendo al overflow. Reproducción directa a 390×844: V11.46 pasó de 3252 a 5496 px de `scrollHeight`; V12.0 permaneció en 3252 px. Se añadió `overflow: clip` a cada reel, conservando la máscara, cifras, curvas y duraciones. Evidencia: `qa/evidence/overflow-regression.json`.
2. **Píldora naranja recortada.** La cápsula estaba fuera de la caja que aplicaba `contain: paint`. Se incorporó espacio transparente dentro de la caja fija para contener la cápsula y su sombra. La fila inferior conserva su posición. Ese espacio no cambia la altura del documento ni captura clics fuera de los elementos reales.
3. **Rutinas redundantes de sticky.** Se eliminaron resets repetidos, docking histórico y escritura inline de `bottom`. `bottom: 0` permanece constante en CSS; un único controlador de visibilidad se actualiza con RAF.
4. **CSS acumulativo y capas sin uso.** Se consolidaron reglas incondicionales y declaraciones reemplazadas. Se retiraron selectores sin consumidores, capas de shine/perímetro que siempre estaban desactivadas, su markup invisible y keyframes sin uso. No hay selectores incondicionales duplicados entre archivos de componentes.
5. **Tracking duplicado.** El clic se registra desde un único listener delegado. Se verificó un evento de CTA por clic.
6. **Timers/visibilidad.** Un solo intervalo de countdown; sincronización de expiración por `storage`; timers de tab attention sin duplicación de elegibilidad. Hero canvas reanuda RAF al regresar mediante `pageshow`.
7. **FAQ y reduced motion.** La cancelación del FAQ ocurre antes de establecer el nuevo estado. Se corrigieron animaciones tardías que reactivaban el shine o demoraban el hero en reduced motion.

## Validaciones ejecutadas

| Área | Resultado y alcance |
| --- | --- |
| HTML | Parseo html5lib sin errores; IDs únicos; footer y sticky hijos directos de body; ningún fixed bajo un ancestro transformado, filtrado o con perspectiva. |
| Copy / SEO / assets | HTML íntegramente idéntico salvo eliminación del span vacío invisible; carga clásica con `defer` conservada. Imágenes, robots y sitemap idénticos byte por byte. Hashes del handoff original correctos. |
| CSS | Parseo recursivo tinycss2 sin errores; reglas base consolidadas; responsive conservado; recorte del reel sin overflow accidental. |
| JS | `node --check` aprobado para los 15 archivos JS, incluido el bundle clásico generado. Inicialización repetida sin timers adicionales. Sin null dereferences ni errores de consola observados. |
| Hero / portada | Imagen cargada, dimensiones contenidas y estilos del baseline conservados en los ocho viewports. Canvas activo en runtime y reduced motion respetado. |
| VSL | Placeholder y evento de inicio aprobados. Creación de iframe y eventos start/complete aprobados con fixture local y origen verificado. |
| CTA / purchase | Scroll al bloque de compra aprobado; precio y layout conservados; sin navegación ficticia cuando el checkout está vacío. Checkout configurado validado con fixture local. |
| Price anchor | Secuencia de contadores aprobada; valores finales 150,000 y 1,000,000. |
| Reel | Inicia con $499, termina en $179, mantiene duraciones y curvas; 45 muestras por viewport sin crecimiento del documento durante la animación. |
| FAQ | Apertura/cierre animado, interrupción rápida y comportamiento nativo con reduced motion aprobados. |
| Countdown | Expiración exactamente a los 300,000 ms: activo a deadline−1 ms y expirado en deadline. Refresh, otra pestaña y cierre/reapertura de Chromium conservan el timestamp. |
| Storage / pulse | Fallback a session/memoria con storage bloqueado; excepción de lectura manejada. Misma expiración en main/sticky; un pulse por segundo cambiado; eventos repetidos no generan pulses extra. |
| Expiración | Estado fijo sin reinicio; intervalo detenido; refresh posterior conserva expiración. |
| Sticky | Visible sólo en mobile tras salir del header; se oculta junto al box y al entrar el footer. Píldora pintada, CTA funcional y cero efecto sobre `scrollHeight`. Cambios mobile→tablet→mobile aprobados. |
| Tab attention | Elegibilidad tras 8 s, alternancia a 1.5 s en pestaña oculta y restauración inmediata del título. |
| Page lifecycle | `visibilitychange`, `pagehide` y `pageshow` no duplican el countdown. Los eventos se simularon; cierre/reapertura de navegador se ejecutó con perfil persistente real. |

## Comparación visual contra V11.46

Las capturas completas conservan exactamente las dimensiones del documento en los ocho viewports. Las diferencias de estilos computados quedaron limitadas a la geometría interna del sticky, el overflow del reel, capas invisibles eliminadas y reduced motion; no se detectaron diferencias nuevas en tamaños, tipografía, colores, copy o layout final.

Se recorrieron los reveals y se esperó el reel antes de capturar. Para comparar frames de forma útil, se fijó la fase de las animaciones continuas y se ocultó el canvas en ambos documentos sólo durante la captura; las transiciones de reveal también se normalizaron sólo en el navegador de QA. El canvas y las animaciones normales se conservaron y se ejercitaron en runtime.

Las capturas móviles y la de 1440 px coinciden píxel a píxel con pixelmatch threshold 0.1. El residual máximo en las otras capturas completas es **0.07878 %**, concentrado en frames transitorios de composición/rasterizado. El bloque post-VSL se verificó adicionalmente en cada resolución donde se muestra: mismo DOM, geometría y estilos, y **0 píxeles diferentes** en capturas del componente sin animación (`post-vsl*.json` y PNGs).

El sticky se compara por separado: la píldora naranja aparece ahora completa, como exige el brief. Esta es la corrección visible deliberada; no se cambió su diseño. Capturas antes/después: `qa/evidence/original-390-sticky.png` y `qa/evidence/clean-390-sticky.png`.

## Evidencias y reproducción

`qa/evidence/` incluye los resultados JSON y capturas originales, limpias y diff. `qa/README.md` contiene instalación y comandos reproducibles. Las dependencias de QA están fijadas en `qa/package-lock.json`; no forman parte del runtime de la landing.

## Limitaciones restantes

- Las URLs de Payhip y Bunny estaban vacías en el baseline y permanecen vacías. Se validaron sus caminos configurados con fixtures locales; no se ejecutó una compra real ni reproducción de un Bunny remoto sin URL suministrada.
- La matriz se ejecutó en Chromium. No se afirma validación en Safari, Firefox o dispositivos físicos.
- Si localStorage y sessionStorage están bloqueados, el fallback mantiene una expiración en memoria durante esa visita; no puede garantizar persistencia después de cerrar el navegador sin storage.
- El handoff referencia `img/og-playbook.jpg` en metadata, pero ese archivo no venía en el ZIP. Se conservó la referencia y no se inventó una imagen SEO.
- No se publicó el sitio ni se modificó el repositorio remoto.

No quedan bloqueos para el alcance solicitado: refactor técnico, baseline visual preservado y matriz QA completada.

## Validación posterior — restauración de animaciones

La entrega se corrigió para usar un script clásico autocontenido. Las pruebas de `animations.cjs` verifican en los ocho viewports los valores intermedios de los contadores, las animaciones WAAPI del reel (1000/1450/1950 ms con delay de 260 ms), el precio final $179, el sticky móvil, avance y sincronización del countdown, pulse y una sola petición del script.

`local-compatible.cjs` verifica en los ocho viewports el bundle en un documento de origen opaco (`origin: null`), con storage bloqueado y sin imports ni peticiones de módulos. El sticky, countdown de fallback y reel funcionan en ese contexto. El navegador administrado de este entorno bloquea `file://` con `ERR_BLOCKED_BY_ADMINISTRATOR`; por eso no se afirma una ejecución directa de archivos locales dentro de este navegador. Se validaron la carga clásica, la ausencia de imports y el contexto opaco equivalente de ejecución, además de la matriz HTTP completa.

`npm run build:check` confirma que `js/app.js` corresponde exactamente a los fuentes modulares. La inicialización idempotente se prueba recargando el bundle dos veces; la integración de VSL/checkout se prueba interceptando ese mismo archivo servido. La persistencia y expiración fija de cinco minutos se conserva.

Resultados de la corrección: matriz HTTP 249/249 checks, 21/21 checks avanzados, reel 8/8, sticky 3/3, movimiento intermedio 8/8 y origen opaco 8/8. El CSS no se modificó en esta corrección.

## Validación del ajuste de precios y activación al llegar al pricing

Solicitud posterior del usuario: $999 → $349, pulse desde el inicio de los cinco minutos y reel al entrar el precio en pantalla.

`qa/offer-update.cjs` pasó en 360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080: precio inicial $999 sin animación fuera de pantalla, secuencias de dígitos descendentes al llegar al precio, resultado $349, sin repetición al volver al bloque, sin overflow horizontal ni crecimiento de altura, pulse en las dos píldoras desde el inicio y recuperación tras cambiar movimiento reducido. Sin errores de consola ni excepciones JavaScript. Evidencia: `qa/evidence/offer-update.json`.

También pasó `qa/advanced.cjs`: duración exacta 300000 ms, un pulse por cambio de segundo, expiración exacta sin reinicio, almacenamiento persistente y fallback, movimiento reducido e integraciones con fixtures. HTML/CSS parsean sin errores y la comparación estática permite exclusivamente los precios autorizados y los cambios técnicos anteriores. El bundle coincide con sus fuentes.

Los informes visuales y demás archivos de evidencia previos corresponden a las revisiones históricas indicadas; no se presentan como una nueva comparación visual de los precios actuales. La demo compacta es independiente de la composición del sitio.

## Diseño compacto integrado en producción

La propuesta visual está implementada en la landing final, no solo en la demo. Pricing y sticky comparten la franja ámbar, sin cápsula secundaria ni resplandor naranja; el sticky contiene la franja y el precio $349 en su propia superficie fija. Los segundos pulsan suavemente desde el inicio (escala 1.1, 320 ms) y se mantiene la expiración de cinco minutos sin reinicio.

Validación: `compact-urgency.cjs` pasó las ocho resoluciones, verificando estilos de la franja, contenido dentro de sus límites, integración y altura del sticky, precios y texto al vencer. El estado activo y expirado mantienen la misma altura. `offer-update.cjs` pasó nuevamente en las ocho resoluciones con el diseño integrado. `sticky.cjs` pasó los tres tamaños móviles: franja visible y contenida en la barra (<140 px), interacción fuera de la superficie, CTA con evento único, ocultamiento al llegar a compra, ocultamiento en tablet y recuperación al volver a móvil.

`runtime.cjs` pasó 249/249 comprobaciones en las ocho resoluciones: scroll/altura estables, sticky fijo, ocultamiento en compra/footer, contador persistente y sincronizado, intervalos, BFCache, expiración, reel final $349 y cero errores de consola. HTML y CSS parsean sin errores; la comparación estática conserva lo ajeno a los precios y componentes autorizados. El bundle sigue coincidiendo con sus fuentes. Evidencias nuevas: `compact-urgency.json`, `offer-update.json`, `runtime.json`, `sticky.json`, `static.json` y capturas `integrated-*.png`.

## Auditoría posterior: lectura y fluidez móvil

La auditoría y sus límites están documentados en `AUDIT_MOBILE.md`. Se corrigieron estados de opacidad que dejaban contenido en blanco, activación de reveals en tarjetas altas, badges de pago fuera del pricing, interlineado del párrafo señalado, interrupciones FAQ y trabajo del canvas fuera de pantalla. La franja compacta, precios y persistencia del timer se conservan.

Pasaron la matriz de ocho resoluciones, tres viewports adicionales y el caso de texto al 300%. Evidencia nueva: `scroll-audit.json`, `faq-lifecycle.json`, `canvas-lifecycle.json` y capturas `audit-*.png`. Se repitieron las pruebas de animaciones, compatibilidad sin almacenamiento, reel durante scroll, sticky y timer avanzado. Runtime: 249 checks aprobados combinando la matriz y la repetición de 1920 tras el ajuste FAQ. La auditoría visual actual sustituye las comparaciones históricas en estos componentes autorizados. Motor disponible: Chromium; Safari real sigue sin verificar.
