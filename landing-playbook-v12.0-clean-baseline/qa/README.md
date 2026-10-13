# QA reproducible

El ZIP trae `js/app.js` ya generado y no requiere Node, npm ni un build para abrir o desplegar el sitio. Estas dependencias son para QA y para regenerar el bundle cuando se editan los fuentes.

## Preparación

Desde la carpeta de la landing, sirve los archivos con HTTP:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

En otra terminal:

```sh
cd qa
npm ci
APP_URL=http://127.0.0.1:8765/ npm test
```

Los tests esperan Chromium en `/usr/bin/chromium`. Para usar otro binario, define `CHROMIUM_PATH`. Se verificaron con Node 24.19.0, Playwright 1.62.1 y Chromium 154.0.8037.57. Los resultados se escriben en `qa/results/`, o en `QA_OUTPUT_DIR` si lo defines.

## Comparación visual

Extrae el ZIP original V11.46 sin modificarlo y sírvelo en otro puerto (por ejemplo 8766). Luego:

```sh
APP_URL=http://127.0.0.1:8765/ BASELINE_URL=http://127.0.0.1:8766/ npm run visual
node pixels.mjs
```

`compare.cjs` registra estilos computados de todos los elementos. `visual.cjs` captura las ocho resoluciones con movimiento normal: recorre los reveals, espera el reel, fija la fase de las animaciones continuas y oculta el canvas temporalmente en ambos documentos para una comparación reproducible. También elimina transiciones de reveal sólo en el navegador de captura; el código entregado conserva sus duraciones originales.

La comparación PNG usa pixelmatch con threshold 0.1; un residual global de más de 0.1 % o dimensiones diferentes falla el chequeo. Este residual cubre fases transitorias de rasterizado/composición; no autoriza rediseños. Las capturas del sticky se revisan aparte porque recuperar la píldora recortada es una corrección deliberada.

Las diferencias esperadas son el recorte del reel, la caja fija que contiene la píldora móvil, las capas invisibles eliminadas y las correcciones de reduced motion. No se deben interpretar cambios de propiedades de pseudo-elementos con `content: none` como cambios visuales.

## Validación estática

```sh
python -m pip install html5lib tinycss2 beautifulsoup4
BASELINE_DIR=/ruta/al/landing-playbook-v11.46-CODEX-HANDOFF python static.py
for f in ../js/*.js; do node --check "$f" || exit 1; done
```

`static.py` compara íntegramente el HTML (permitiendo sólo la eliminación del span invisible; la carga clásica con defer debe conservarse), los assets y los archivos SEO. Verifica también los hashes del handoff original, el parseo HTML/CSS, los IDs y la ubicación del footer/sticky.

## Alcance de los tests

`runtime.cjs`: matriz funcional de ocho viewports, sin overflow y sin errores de consola.

`advanced.cjs`: expiración exacta, pulse, storage bloqueado, persistencia al cerrar/reabrir Chromium, init idempotente, FAQ interrumpido, tab attention y fixtures de VSL/checkout. Los eventos de visibilidad y BFCache se simulan; la reapertura del navegador usa un perfil persistente real.

`reel.cjs`: $999 → $349 y 45 muestras por viewport durante la animación, incluyendo el intento repetido de llegar al final.

`sticky.cjs`: píldora pintada, CTA, paso de clics en el padding transparente y cambios entre mobile/tablet.

`evidence/` contiene los resultados y capturas de la ejecución realizada para esta entrega. No se incluyen las dependencias instaladas ni perfiles de navegador en el ZIP.

## Regenerar el script de la página

```sh
cd qa
npm ci
npm run build
npm run build:check
```

Edita los módulos fuente y `js/bootstrap.js`; `js/app.js` es el bundle generado. La compilación no cambia el diseño, las duraciones ni el copy.

`animations.cjs` verifica movimiento intermedio y timings de números, sticky y timer en los ocho viewports. `local-compatible.cjs` verifica la carga autocontenida en origen opaco y sin storage.
