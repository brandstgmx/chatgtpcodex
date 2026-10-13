# CHANGELOG_REFACTOR — V12.0 clean baseline

Baseline: `landing-playbook-v11.46-CODEX-HANDOFF`, verificado contra `SOURCE_SHA256.json`. Fecha de QA: 2026-10-12.

## Alcance visual y copy

No hubo rediseño ni cambios de copy, imágenes, SEO, paleta, tamaños o espaciado del contenido. Se conservó la mecánica y el timing normal de las animaciones.

Sí hubo una corrección visible mínima de un bug: la píldora naranja del sticky ahora se pinta completa. V11.46 la recortaba mediante `contain: paint`. Se documentó el defecto antes de corregirlo. La fila inferior, sus coordenadas, el precio tachado, el botón y los estilos de la píldora conservan la referencia. La caja fija incorpora 70 px transparentes para alojar la píldora y su sombra; ese espacio no pertenece al flujo del documento ni intercepta clics fuera del contenido real.

El modo `prefers-reduced-motion` evita ahora el retraso del reveal del hero y el shine tardío del sticky. Conserva el estado visual final. El recorte del reel sólo elimina overflow de dígitos que la máscara ya hacía invisibles.

## Cambios técnicos

- CSS separado en base, header, hero, VSL, price anchor, decision/proof, purchase box, price reel, offer countdown, FAQ, sticky mobile y motion. `css/styles.css` es el punto de entrada; los módulos conservan la cascada necesaria.
- Consolidación de declaraciones reemplazadas, shorthands y reglas incondicionales. Ningún selector incondicional se repite dentro de su archivo de componente. Las variantes responsive, hover, estado y reduced motion permanecen explícitas.
- Eliminación de selectores históricos sin consumidores, keyframes sin uso y capas de shine/perímetro permanentemente desactivadas. Se retiró el span invisible `purchase-shine` y la regla `:first-child` que sólo lo estilaba.
- CSS: 155,976 → 95,772 bytes, reducción de 38.6 %. Se conservan 13 keyframes utilizados por la experiencia.
- Fuentes JS divididos en módulos por componente, con estado privado e inicialización idempotente. `js/bootstrap.js` se compila al script clásico `js/app.js`, que viene generado y listo para usar en el ZIP. Se mantiene la API pública de tracking, consentimiento, tab attention y purchase.
- Un solo listener delegado registra los CTAs y checkout. Se eliminó el doble registro publicitario/analítico del clic.
- Countdown con una única expiración absoluta de 300 000 ms, un único intervalo activo y sincronización de timestamps entre pestañas mediante `storage`. La expiración nunca se extiende ni se reinicia automáticamente.
- Fallback de storage protegido frente a errores de lectura/escritura; estado en memoria encapsulado cuando no hay storage disponible. Pulse únicamente al cambiar el segundo.
- Tab attention sin duplicación del timer de elegibilidad durante `pageshow`; restauración inmediata del título original al volver.
- Hero canvas reanuda su RAF después de `pagehide/pageshow`.
- FAQ con cancelación de la animación anterior antes de establecer el nuevo estado, evitando flags e inline styles residuales en clics rápidos.
- Mensajes del VSL filtrados por iframe y origen configurados; placeholder e integración estática conservados.
- Sticky con `bottom: 0` constante, sin docking al footer ni reajustes inline de geometría. Se eliminaron las dos rutinas de hard reset y su variable de offset.
- `overflow: clip` en cada reel: las tiras animadas dejan de aumentar `scrollHeight` sin modificar el precio visible ni sus tiempos.
- Eliminación de la rama de dígitos adicionales del reel y de su medición de ancho, ambos sin consumidores para los precios fijos $499 → $179.
- QA automatizado, evidencias y reportes incorporados fuera de la ruta de ejecución del sitio.

## Archivos conservados

`img/*`, `robots.txt` y `sitemap.xml` son idénticos byte por byte al handoff. El HTML conserva la carga clásica con `defer`, como V11.45/V11.46, y sólo retira el span sin contenido que siempre estaba oculto.

No se agregaron funcionalidades al producto. No se publicó ni se configuraron servicios comerciales externos.

## Corrección posterior — animaciones al abrir el ZIP

La primera entrega cambió la carga a `type="module"`. Esa decisión rompió la ejecución al abrir el HTML directamente desde el disco y podía impedir los contadores, sticky y countdown. Se restauró `script src="js/app.js" defer` y se empaquetaron los mismos componentes en un bundle IIFE. No se cambió CSS, copy ni tiempos de las animaciones. Se añadió un guard de bootstrap por documento para que recargar el script no duplique listeners ni timers.

Comparación con el archivo V11.45 adjuntado: su `js/app.js` es idéntico al del handoff V11.46; se conserva esa mecánica de animación.

## Ajuste de precios y animación solicitado por el usuario

- Precio de referencia $999 MXN; precio de compra $349 MXN en todos los textos, accesibilidad, JSON-LD y valor de analítica.
- Reel descendente de $999 a $349, activado cuando el precio está al menos 55% visible, una sola vez por carga. No comienza mientras el precio está fuera de pantalla.
- Las dos píldoras pulsan en cada cambio de segundo desde el inicio de los cinco minutos; respetan movimiento reducido incluso si la preferencia cambia sin recargar.
- Se conserva la fecha de expiración persistida: al vencer, aparece «✨ Precio de lanzamiento» y no se reinicia automáticamente.
- CSS y composición del sitio conservados; la propuesta visual compacta sigue en la demo independiente.
