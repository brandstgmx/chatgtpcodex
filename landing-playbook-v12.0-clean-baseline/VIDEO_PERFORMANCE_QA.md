# VSL: vista previa acotada, reutilización de bytes y QA

Fecha: 2026-10-15. Referencia anterior: `7abb21a2da0ecf021fdbaa51b54917b07d510096`.

## Problema y solución

`preload="none"` es una sugerencia y no impide que `play()` o autoplay descarguen medios. La versión anterior prefería HLS nativo: sus límites de calidad/buffer no estaban bajo control de la landing. Además, una vista previa silenciada podía recorrer los 45 segundos y el reinicio de fuente podía volver a pedir los primeros segmentos.

La versión actual usa Hls.js/MSE cuando está soportado. Antes de reproducir, acota las respuestas de playlists de medios al primer segmento por pista y marca ese fragmento como VOD completo para repetirlo localmente. No recorta el archivo del usuario ni modifica el recurso en Bunny. Conserva URL de respuesta, claves, mapas de inicialización y byte-ranges para resolver recursos correctamente.

Una caché de memoria por página, máxima 12 MiB, guarda exclusivamente los segmentos completos descargados por la vista previa. La sesión audible nueva lee esos bytes desde memoria. Se copia cada buffer antes de entregarlo a los workers para que una transferencia no deje la caché vacía. La caché no persiste tras recargar/cerrar, no descarga el video completo, no instala service workers y no requiere cambios en cPanel/Bunny.

La vista previa solicita la menor variante disponible. La sesión con audio permite ABR hasta 480p/1.6 Mbps, o 360p/0.8 Mbps si el navegador declara ahorro de datos/2G. Si Bunny no ofrece una variante que cumpla estos topes, se usa la menor disponible. Para reducir bytes cuando solo existen variantes de alta calidad, hay que habilitar codificaciones menores en Bunny; no se puede inventarlas desde JavaScript.

El motor MSE utiliza un objetivo de buffer de 4 segundos y techo configurado de 6 (3/5 en ahorro). Los segmentos se descargan como unidades y pueden superar esos tiempos; no son topes exactos de bytes. Las pestañas ocultas/pausas detienen nuevas solicitudes. Un 15 % del frame debe estar visible durante 250 ms antes de cargar; no hay precarga fuera de pantalla.

En navegadores sin un motor MSE compatible se muestra «Reproducir video»: HLS nativo espera al clic para descargar. Una vez iniciado, su buffer/calidad sigue siendo administrado por el navegador. Se conserva activación de usuario síncrona al llamar play() en esa ruta. Es una decisión de ahorro deliberada, no una promesa de autoplay universal.

El bundle inicial sigue minificado y la librería HLS diferida. A cambio del control de descargas, también los navegadores que admiten tanto HLS nativo como MSE cargan ahora esa librería cuando el frame es visible.

## Comparación de bytes solicitados

`qa/video-bandwidth.cjs` genera un HLS local H.264/AAC de **45 segundos**, con segmentos de 2 segundos. Intercepta exclusivamente el hostname CDN y sirve archivos locales. Compara la implementación anterior y la actual durante la misma ventana de 7.5 segundos después de comenzar reproducción. La caché HTTP de Playwright está deshabilitada por el routing: la reutilización se comprueba por la caché implementada, no suponiendo headers del CDN.

| Vista previa del fixture | Solicitudes de segmentos | Bytes de segmentos |
| --- | ---: | ---: |
| Implementación anterior | 9 | 1 188 912 |
| Vista previa acotada | 1 | 159 236 |

Reducción en esa prueba controlada: **86.6 %**. No es una medición del consumo real de Bunny ni un porcentaje garantizado por visita. El tamaño de los segmentos, bitrates reales, pistas y comportamiento del visitante cambian el resultado.

Se comprueban varias vueltas de la vista previa sin más solicitudes de segmentos y el reinicio audible por debajo de 0.8 segundos, con duración completa superior a 44 segundos. La primera URL de segmento no se solicita de nuevo al activar sonido. Se verifica además que la reproducción completa sigue avanzando, la calidad/buffer están configurados, las pestañas ocultas paran solicitudes y una pausa manual se conserva.

Casos: comparación anterior, versión nueva, ahorro de datos, fallback nativo sin descarga antes del clic y pestaña inicialmente oculta. Resultados: `qa/video-bandwidth-results.json`.

## Regresión de la landing

`qa/video-regression.cjs`, con Hls.js/MSE: **360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080**.

- Vista previa silenciada y capa centrada; reinicio con sonido desde cero y nueva carga.
- Rechazo de seek hacia delante/atrás; click/drag en progreso sin efecto; Play/Pause operativo.
- Mismos frame, radio, CSS y contenido de las otras secciones que el commit anterior; scrollHeight idéntico y estable tras 15 intentos de llegar al final.
- Countdown activo y sincronizado; sticky oculto al footer; header/hero conservan destino pricing, 38 páginas y Payhip en compra.
- Sin excepciones JavaScript ni errores de consola con las respuestas locales.

Resultados: `qa/video-bounded-regression-results.json`. También se descomprimió el ZIP HOSTING y se comprobó la reproducción MSE en 390×844 desde sus archivos, más activación nativa mediante la capa y mediante Play. Se verificaron integridad, contenido y permisos 0644/0755 del paquete. Los archivos de resultados con nombres anteriores son evidencia histórica, no la verificación del comportamiento nuevo.

## Repetir

Desde la raíz del repositorio:

```sh
python -m http.server 8783 --bind 127.0.0.1 --directory landing-playbook-v12.0-clean-baseline
```

En otra terminal, con Chromium, FFmpeg y dependencias QA instaladas:

```sh
cd landing-playbook-v12.0-clean-baseline/qa
npm run build:check
APP_URL=http://127.0.0.1:8783/ node video-bandwidth.cjs
mkdir -p /tmp/vsl-qa-fixture
ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc2=size=640x360:rate=24 -f lavfi -i sine=frequency=440:sample_rate=44100 -t 18 -c:v libx264 -preset ultrafast -g 48 -pix_fmt yuv420p -c:a aac -f hls -hls_time 2 -hls_playlist_type vod /tmp/vsl-qa-fixture/playlist.m3u8
APP_URL=http://127.0.0.1:8783/ VSL_FORCE_MSE=1 QA_OUTPUT_FILE=video-bounded-regression-results.json node video-regression.cjs
```

## Límites de verificación

El proxy de salida sigue bloqueando el hostname CDN con `CONNECT tunnel failed, response 403`; ese rechazo no demuestra un error de Bunny. No se verifican aquí bitrates/manifiestos reales, CORS, caché, factura, LCP/INP de producción ni conversiones. La prueba nativa es una ruta forzada en Chromium, no Safari/iOS físico.

El ancho de banda del panel es acumulado; el contador de vistas del player no es una medida fiable de todas las solicitudes de un reproductor HLS propio, pruebas, reinicios y recargas. No se calcula costo por visita dividiendo ambos números. Cada recarga borra la caché de memoria; el ahorro persistente entre visitas depende de la caché HTTP del navegador y del CDN.

## Portada de carga añadida posteriormente

La corrección del primer fotograma añade únicamente una portada local usando `img/embedded-3.png`, ya cargada por el hero, y estilos dentro del VSL. No cambia la lógica de entrega ni inicia solicitudes adicionales a Bunny. El CSS de la sección de video cambia para mostrar esa portada; los tamaños y estilos de las demás secciones se mantienen. El video se revela después de disponer de un fotograma decodificado, con fallback para motores sin callbacks de frame. También se cubre el reinicio de audio.

`qa/video-poster.cjs` ralentiza las respuestas HLS y comprueba la portada con la imagen local cargada, transparencia del video antes de decodificar y visibilidad posterior, reinicio con sonido, misma altura de documento y ausencia de solicitudes de imágenes al CDN. Anchos: 360, 390, 430, 768, 1024, 1366, 1440 y 1920 px. Se repite 390 px deshabilitando requestVideoFrameCallback.

```sh
APP_URL=http://127.0.0.1:8783/ node video-poster.cjs
APP_URL=http://127.0.0.1:8783/ VSL_NO_FRAME_CALLBACK=1 QA_WIDTHS='[390]' node video-poster.cjs
```

La carga ralentizada usa el mismo fixture de 18 s descrito en las instrucciones de regresión. La portada no implica que el tiempo de descarga/decodificación sea cero. El cambio se validó en Chromium; no se ha ejecutado Firefox en macOS, como en la captura del usuario.
