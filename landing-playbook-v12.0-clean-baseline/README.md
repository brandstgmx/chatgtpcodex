# landing-playbook-v12.0-clean-baseline

Refactor técnico del handoff V11.46. Sitio estático, sin framework ni build obligatorio.

Para ejecutarlo desde esta carpeta:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Para desplegarlo, copia `index.html`, `css/`, `js/`, `img/`, `robots.txt` y `sitemap.xml` al directorio público de tu hosting. Los módulos JavaScript requieren HTTP/HTTPS; abrir `index.html` mediante `file://` no es el método de ejecución.

Los valores originales de Payhip y Bunny siguen vacíos. La landing conserva su placeholder de video y el comportamiento del CTA sin checkout configurado. Las URLs se configuran en `js/shared.js`; los píxeles y consentimiento se mantienen en `js/tracking.js`. No se inventaron URLs ni IDs.

La metadata SEO, el copy y las imágenes originales se conservaron. El canonical y sitemap siguen apuntando a la URL original del handoff.

Consulta `QA_REPORT.md`, `CHANGELOG_REFACTOR.md` y `qa/README.md` para resultados, excepciones de corrección y reproducción de las pruebas. La carpeta `qa/` no es necesaria para servir la landing.
