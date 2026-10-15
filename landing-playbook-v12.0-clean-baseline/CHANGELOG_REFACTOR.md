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

## Integración de la propuesta compacta en la web final

A petición explícita del usuario, la propuesta dejó de estar limitada a la demo y se implementó en `index.html`, `css/offer-countdown.css`, `css/sticky-mobile.css` y `css/motion.css`.

- Pricing: franja ámbar de ancho completo encima de comprar, texto oscuro, punto naranja, contador sin cápsula secundaria ni resplandor.
- Sticky móvil: franja dentro de la superficie fija, en la primera fila; precio real $999 pequeño y tachado, precio actual $349 y botón de compra en la segunda fila. Se eliminó el espacio vacío reservado a la cápsula flotante.
- Pulse suave (escala máxima 1.1, 320 ms) desde el inicio de los cinco minutos. Se respeta movimiento reducido y la expiración persistida.
- Se reemplazaron las reglas históricas de los dos componentes por CSS consolidado. Se retiró el brillo del CTA sticky. El resto de la landing conserva su composición.

## Auditoría de contenido visible y fluidez móvil

- Corregido el estado invisible permanente cuando una animación de entrada se cancelaba: el contenido tiene opacidad 1 por defecto y las animaciones no retienen blur/transform al terminar.
- Reveals activados por entrada en pantalla, sin exigir un porcentaje de visibilidad de una tarjeta que puede superar la altura del dispositivo.
- Conservado íntegramente el párrafo «Por $349 MXN obtienes el criterio…»; precio y moneda integrados como texto inline, con interlineado móvil más legible.
- Contadores de consultoría observan la primera cifra, en lugar de toda la sección. Los valores finales son legibles antes de iniciar la animación.
- Métodos de pago en seis columnas flexibles dentro del ancho real del box; se corrige el desborde de los badges con ancho fijo en móvil/tablet.
- FAQ: callbacks de animaciones canceladas ya no alteran una nueva transición; respuesta recuperada al cambiar de tamaño o salir de la página. Se evita recortar el icono de apertura.
- Canvas del hero detiene frames fuera del viewport y cuando la pestaña queda oculta; vuelve a funcionar al regresar.
- Open Graph/Twitter/JSON-LD apuntan a la portada PNG incluida, con dimensiones reales, en vez de a un JPG ausente del paquete.
- Permanecen el precio real $999, precio especial $349, reel al llegar al precio, sticky compacto y timer persistente de cinco minutos con pulse.

## Actualización exclusiva del video: controles tipo VTurb

- Bunny Stream permanece como hosting: biblioteca 780085, video 7b2bbd93-26c7-450f-8c58-3f3c99139b43. Fuente HLS pública proporcionada por el usuario: `https://vz-d4744015-b5b.b-cdn.net/7b2bbd93-26c7-450f-8c58-3f3c99139b43/playlist.m3u8`.
- Se reemplaza el iframe por video HTML5 con HLS nativo donde el navegador lo admite y Hls.js 1.7.3 light incluido localmente para navegadores con Media Source Extensions. No se requiere un CDN adicional para el código del reproductor. La dependencia conserva su licencia Apache-2.0 y avisos de terceros.
- Autoplay silenciado y reproducción inline. La capa muestra «El video ya comenzó» y «Haz clic para escuchar» cuando empieza la reproducción. El clic quita mute y oculta la capa sin cambiar currentTime. Si el navegador bloquea autoplay, se ofrece inicio mediante clic; no se afirma que el video empezó antes de recibir playing.
- Controles visibles: Play/Pause y progreso de solo lectura. No hay controles nativos, sliders, handlers de seek, volumen, tiempo, fullscreen, settings, captions, PiP, AirPlay, Chromecast ni velocidades. Se deshabilitan controles remotos y PiP mediante los atributos admitidos por cada navegador. Los controles propios nunca asignan currentTime.
- El video usa object-fit: cover, manteniendo proporción y sin deformarlo. Si la relación de aspecto difiere del frame 16:9 existente, se recortan bordes para evitar barras laterales; no se puede eliminar por CSS una barra negra que ya esté grabada en la imagen.
- Se preservan el contenedor, aspect-ratio, border-radius, sombras y tamaños de la sección. Todos los archivos ajenos al video y al changelog permanecen idénticos byte por byte, incluido index.html, sticky, timer, pricing, FAQ y hero. js/app.js solo se regenera para incluir el módulo y su dependencia.

### QA de este parche

Prueba de reproducción con HLS local real (manifiesto, segmentos H.264/AAC y decodificación del navegador), sustituyendo exclusivamente las respuestas del recurso CDN: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080, todas aprobadas en Chromium.

Comprobado: autoplay muted, texto de la capa, audio sin reinicio, Play/Pause, click y drag sobre progreso sin seek, progreso actualizado, controles nativos ausentes, dimensiones/radio del frame iguales, scrollHeight idéntico al baseline en cada tamaño y estable durante 15 intentos de llegar al final, sticky oculto junto al footer, countdown activo y sincronizado. Sin excepciones JavaScript ni errores de consola durante esas pruebas. También se comprobó que el bundle coincide con sus fuentes y no hay cambios en las demás secciones.

Límite de verificación: el proxy de este entorno bloquea la conexión tanto a Bunny Player como al hostname CDN con «Tunnel connection failed: 403 Forbidden». Ese rechazo es del proxy de salida, no una respuesta comprobada del servidor de Bunny. Por tanto, la URL del video real quedó configurada pero su reproducción y CORS reales deben comprobarse desde el hosting/navegador del usuario. Tampoco se verificó Safari en un dispositivo físico. No se presenta el HLS local de QA como si fuera el video del usuario.

Entrega: `landing-playbook-v12.0-VIDEO-UPDATE.zip` contiene únicamente css/vsl.css, js/vsl.js, js/app.js, js/vendor/hls.light.mjs, js/vendor/LICENSE.hls.js.txt y este changelog. Extraer dentro de la carpeta existente de la landing, sobrescribiendo esos archivos; no sustituir index.html ni otras secciones. Todos los archivos del parche llevan permisos 0644 y sus carpetas 0755.

## URL de pago Payhip

- Configurada `https://payhip.com/b/KCz65` en los cuatro botones de compra: header, hero, pricing y sticky móvil.
- Actualizados exclusivamente los cuatro href del HTML y la configuración compartida; bundle regenerado. Los enlaces funcionan también antes de inicializar JavaScript. Sin cambios de diseño, copy, precio ni lógica de video, timer, FAQ o sticky.
- Verificación en escritorio 1440×900 y móvil 390×844: los cuatro href apuntan al destino exacto. Click en pricing y en sticky navega a esa URL, interceptada localmente para comprobar la navegación sin efectuar compras. Bundle consistente con las fuentes.
- Parche `landing-playbook-v12.0-PAYHIP-UPDATE.zip`: únicamente index.html, js/shared.js, js/app.js y este changelog. Aplicar sobre la versión actual con el parche de video ya instalado; archivos 0644 y carpetas 0755.

## Corrección: compra directa Payhip

- Sustituida la URL de ficha de producto por `https://payhip.com/buy?link=KCz65` en los cuatro botones de compra, la configuración y el bundle.
- Se conserva todo lo demás. Verificados los cuatro href y la consistencia del bundle con sus fuentes.
- El parche Payhip actualizado reemplaza al anterior y contiene los mismos cuatro archivos: index.html, js/shared.js, js/app.js y este changelog. Aplicar sobre la versión con el parche de video instalado.

## Bloqueo reforzado de avance y retroceso del video

- La barra sigue siendo un progressbar de lectura, sin miniaturas ni interacción. Además, seeking devuelve el video a la última posición de reproducción aceptada; esa posición no se actualiza durante un salto. Se conserva una tolerancia de 120 ms para redondeo y posición de frames.
- Bloqueados los atajos de avance/retroceso cuando el foco está dentro del reproductor. Un observer retira controles nativos si otro código intenta activarlos. Context menu desactivado únicamente dentro del frame.
- Se mantiene autoplay muted, activación de audio sin reinicio y Play/Pause. Se permite volver a reproducir tras completar el video mediante el botón Play.
- Selector de frame compatible con el atributo original o con #video .video-frame. Marca de diagnóstico interna: data-vsl-version="locked-1".
- URLs de app.js, styles.css y el import de vsl.css versionadas con video-locked-1 para pedir los archivos nuevos al navegador. index.html solo cambia esas dos referencias; no cambia el texto ni el layout de ninguna sección.
- QA con HLS local real: ocho tamaños aprobados, incluyendo click/drag sin seek y rechazo de asignaciones de posición hacia adelante y atrás en pausa. Pruebas adicionales en 390 y 1440: saltos durante reproducción rechazados, atajos bloqueados, controles nativos retirados y ausencia de iframe/miniaturas. Se mantienen altura, radio, timer y ocultamiento del sticky junto al footer.
- La captura del usuario mostraba una barra naranja con miniaturas y otro texto inferior; esa UI no existe en este reproductor. El HTML/JS efectivamente publicados siguen sin poder compararse desde el entorno, cuyo proxy bloquea el hosting y Bunny. Se solicitó el bloque publicado para identificar diferencias; no se presenta la caché como causa confirmada ni se afirma una verificación del video real.
- Regenerado el ZIP completo para extracción directa en cPanel, con la corrección y compra directa Payhip, archivos 0644 y carpetas 0755.
