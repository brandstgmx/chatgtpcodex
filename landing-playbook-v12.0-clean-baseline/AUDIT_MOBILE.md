# Auditoría de lectura y fluidez móvil

## Fallos reproducidos y corregidos

1. **Secciones en blanco:** al cancelar `sectionReveal`, la tarjeta seguía con `.is-visible` pero volvía a opacidad 0 por la regla base. Ahora el contenido es visible por defecto; cancelar una entrada mantiene opacidad 1. Las animaciones terminadas no conservan filtro ni transformación de una tarjeta grande.
2. **Tarjetas grandes sin revelar:** en 390×280 con texto al 300%, una tarjeta de ~3127 px nunca alcanzaba el 12% exigido por el observer y quedaba invisible. Se observa la entrada al viewport, independientemente del tamaño del bloque.
3. **Fila de pagos fuera del pricing:** en 390 px, el contenedor iba de x=47 a x=343, pero los badges de ancho fijo ocupaban x=24 a x=366. Ahora los seis quedan dentro de x=47…343; se comprueba también a 320 px y en tablet.
4. **Párrafo señalado por el usuario:** el copy «Por $349 MXN obtienes el criterio para decidir si avanzar, pausar o descartar la franquicia antes de comprometer una inversión mayor» permanece completo. Precio y moneda usan texto inline sin corte interno; el interlineado móvil pasó de 1.08 a 1.3.
5. **FAQ:** callbacks de una transición cancelada podían alterar una nueva. Ahora se desactivan antes de reemplazar la animación; al redimensionar o salir de la página, la respuesta recupera su altura natural. Se evita recortar el icono al girar.
6. **Trabajo de canvas fuera de pantalla:** el fondo seguía solicitando frames aunque no dibujara. Ahora detiene el bucle fuera del viewport y en pestañas ocultas y lo reanuda al regresar. La prueba instrumentada confirma cero incremento de callbacks mientras está detenido.
7. **Recursos de metadatos:** el JPG Open Graph no existía en el paquete. Open Graph, Twitter y JSON-LD apuntan a la portada PNG incluida, con dimensiones reales 1346×1920.
8. **Acceso por teclado:** el enlace de salto no se pinta sin foco y aparece al usar Tab; Enter navega a `#contenido`.

## Verificación

- Ocho resoluciones requeridas: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080.
- Casos extra: 320×568, 844×390, 390×280, orientación, movimiento reducido dinámico y tarjeta con texto al 300%.
- Scroll rápido: cero secciones de lectura invisibles mientras cruzan el viewport; texto y logos dentro de sus límites. FAQ abiertas y respuestas legibles; cancelar reveals mantiene la lectura.
- Scroll al final: altura estable sin crecimiento, también durante el reel con 45 muestras por resolución.
- Runtime: 249 comprobaciones pasan en conjunto; el caso de 1920 se repitió después de corregir FAQ y esperar su estado real, en vez de depender de una pausa fija. `runtime-initial-audit.json` conserva el resultado inicial; `runtime.json` contiene la repetición aprobada.
- FAQ: interrupciones rápidas, resize y pagehide pasan en las ocho resoluciones.
- Contadores, reel $999 → $349, sticky compacto y countdown persistente de 300000 ms mantienen su comportamiento. Pruebas de animaciones y ejecución con origen opaco pasan en las ocho resoluciones.
- HTML/CSS sin errores de parseo; bundle clásico coincide con sus fuentes; cero errores de consola en las pruebas.

## Límites y configuración existente

Motor verificado: Chromium, incluidos viewports y entrada táctil móvil emulados. No se presenta esto como una prueba en dispositivos físicos. La descarga de WebKit fue bloqueada por la red con HTTP 403 «Domain forbidden», por lo que Safari real queda pendiente. La ejecución local se valida con un origen opaco sin almacenamiento; el navegador administrado bloquea file:// directo.

Las URLs de Payhip y Bunny permanecen vacías en la configuración original. Sus integraciones se verifican con fixtures locales; no se inventaron URLs ni se afirma que una compra real o un video real estén conectados.

Evidencias reproducibles: `qa/evidence/scroll-audit.json`, `faq-lifecycle.json`, `canvas-lifecycle.json`, `runtime.json`, `advanced.json`, `reel.json`, `sticky.json`, `animations.json`, `local-compatible.json`, `static.json` y capturas `audit-*.png`.
