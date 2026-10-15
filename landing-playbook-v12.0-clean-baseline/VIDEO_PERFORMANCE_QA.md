# QA de carga y reproducción del VSL

Fecha: 2026-10-15. Referencia previa: commit `3fe76f4425d1fa631f94091c7d73fe473512ee1e`.

## Peso medido

| Recurso | Antes | Ahora |
| --- | ---: | ---: |
| JS inicial, sin compresión | 912 276 B | 28 625 B |
| JS inicial, gzip calculado localmente | 187 863 B | aproximadamente 10 308 B |
| Hls.js inicial en navegadores con HLS nativo | Incluido en bundle | 0 B |
| Hls.js para motores MSE | Incluido en bundle | 367 034 B diferidos; aproximadamente 116 767 B gzip |

Son tamaños de archivos y estimaciones locales de compresión, no mediciones de velocidad del hosting. No se midieron LCP/INP de producción, conversión de compra ni facturación de Bunny. El bundle diferido se solicita desde el hosting, no desde Bunny.

## Verificación funcional

Chromium, HLS nativo y Hls.js/MSE forzado por separado: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900 y 1920×1080.

- Vista previa automática silenciada; clic de audio produce una nueva carga y reproducción con sonido cerca de 00:00 después de más de 2.2 s de vista previa.
- Play/Pause operativo. Saltos directos hacia delante y atrás rechazados; click y arrastre de la barra no cambian la posición.
- Capa centrada; controles nativos ausentes; PiP y reproducción remota deshabilitados mediante los atributos soportados.
- Mismo scrollHeight y geometría del frame que la referencia; altura estable tras 15 intentos de llegar al final. Mismo radio, CSS y contenido fuera del video.
- Countdown activo, sincronizado entre sus dos instancias, y sticky oculto junto al footer.
- Sin excepciones JavaScript ni errores de consola en las pruebas con medios locales.

Resultados: `qa/video-regression-native-results.json` y `qa/video-regression-mse-results.json`. También se extrajo el ZIP HOSTING y se repitió el caso MSE en 390×844 desde esos archivos, sin sustituir la librería del paquete: aprobado. Se verificaron integridad ZIP, bytes y permisos de todas las entradas.

## Verificación de descargas y ciclo de vida

`qa/video-performance.cjs` genera medios H.264/AAC con FFmpeg y sustituye las respuestas CDN por esos archivos locales. Cubre HLS nativo, MSE, ahorro de datos y página inicialmente oculta.

- Cero solicitudes de video y de Hls.js antes de acercarse al frame en la prueba móvil 390 px.
- HLS nativo no solicita la librería; MSE la solicita una vez y la reutiliza al reiniciar con sonido.
- Pestaña inicialmente oculta no descarga medios hasta hacerse visible.
- Vista previa fuera de la zona de pantalla se pausa; las solicitudes MSE se detienen. Se reanuda al volver.
- Pausa manual conservada entre cambios de visibilidad.
- En MSE, topes de calidad comprobados con un manifiesto de prueba que declara 480p/720p/1080p; configuración de buffer comprobada. La prueba valida selección/configuración, no la calidad visual de las variantes reales de Bunny.
- Pestaña oculta pausa reproducción y detiene las nuevas descargas MSE; al volver, reanuda únicamente la reproducción que estaba activa.

Resultados: `qa/video-performance-results.json`.

## Repetir

Desde la raíz del repositorio:

```sh
python -m http.server 8781 --bind 127.0.0.1 --directory landing-playbook-v12.0-clean-baseline
```

En otra terminal, con dependencias QA instaladas y Chromium/FFmpeg disponibles:

```sh
cd landing-playbook-v12.0-clean-baseline/qa
npm run build:check
node video-performance.cjs
mkdir -p /tmp/vsl-qa-fixture
ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc2=size=640x360:rate=24 -f lavfi -i sine=frequency=440:sample_rate=44100 -t 18 -c:v libx264 -preset ultrafast -g 48 -pix_fmt yuv420p -c:a aac -f hls -hls_time 2 -hls_playlist_type vod /tmp/vsl-qa-fixture/playlist.m3u8
node video-regression.cjs
VSL_FORCE_MSE=1 node video-regression.cjs
```

## Límites

El proxy de salida de este entorno bloquea el CDN de Bunny y el hosting; no se ha verificado aquí la reproducción real, CORS, caché, compresión del servidor ni gasto por visitante. El tráfico de QA se sirve localmente. No se ejecutaron pruebas en Safari/iOS físico. El navegador con HLS nativo controla su propio buffer y calidad; `preload` es una indicación, no un límite estricto de bytes.

El autoplay silenciado y reiniciar con sonido pueden consumir datos antes de que el visitante escuche. Estos comportamientos se conservan por petición del usuario. El ahorro real requiere medir bytes entregados en Bunny con tráfico representativo; no se deduce de dividir las vistas del panel entre el ancho de banda acumulado.
