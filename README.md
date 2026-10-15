# Landing Playbook V12.0 — clean baseline

[Descargar el sitio final en ZIP](https://raw.githubusercontent.com/brandstgmx/chatgtpcodex/main/landing-playbook-v12.0-clean-baseline-SITIO.zip)

El ZIP ligero contiene el sitio estático final y los reportes. Descárgalo, extráelo y encontrarás la carpeta `landing-playbook-v12.0-clean-baseline`.

El código completo está en [landing-playbook-v12.0-clean-baseline/](landing-playbook-v12.0-clean-baseline/). Incluye pruebas reproducibles y evidencias de QA de las ocho resoluciones requeridas.

- [Reporte QA](landing-playbook-v12.0-clean-baseline/QA_REPORT.md)
- [Changelog técnico](landing-playbook-v12.0-clean-baseline/CHANGELOG_REFACTOR.md)
- [Instrucciones del sitio](landing-playbook-v12.0-clean-baseline/README.md)

La V11.46 se conservó como baseline visual. Se corrigieron el overflow del reel y el recorte de la píldora del sticky, sin cambiar el copy ni rediseñar.

Las URLs de Payhip y Bunny siguen vacías, como en el handoff original. Guardar estos archivos en GitHub no activa un hosting ni GitHub Pages.

La descarga actual incluye la corrección de carga del JavaScript: los contadores, reel, sticky y countdown se ejecutan desde un script autocontenido, también al abrir el HTML directamente. Se mantienen la reducción de movimiento y la expiración persistente de cinco minutos.

Para subir al hosting, usa **[landing-playbook-v12.0-HOSTING.zip](https://raw.githubusercontent.com/brandstgmx/chatgtpcodex/main/landing-playbook-v12.0-HOSTING.zip)**. Se extrae directamente dentro de `franquiciar-mi-negocio/`, con archivos 0644 y carpetas 0755. Instrucciones en [SUBIR_AL_HOSTING.md](SUBIR_AL_HOSTING.md).
