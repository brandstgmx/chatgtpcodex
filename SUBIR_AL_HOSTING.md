# Publicar la landing en /franquiciar-mi-negocio/

Descarga `landing-playbook-v12.0-HOSTING.zip`. Contiene `index.html`, `css/`, `js/`, `img/`, `robots.txt` y `sitemap.xml` directamente en su raíz; no incluye una carpeta contenedora adicional.

1. Abre en el administrador del hosting la carpeta que corresponde a `/franquiciar-mi-negocio/`.
2. Sube el ZIP y extráelo dentro de esa carpeta. Reemplaza los archivos anteriores.
3. Comprueba los permisos: archivos **0644** y carpetas **0755**, incluida `franquiciar-mi-negocio`.
4. Abre `https://lanzatufranquicia.com/franquiciar-mi-negocio/index.html` y después la URL que termina en `/`.

Si el hosting conserva los permisos de archivos ya existentes, cambia manualmente `index.html`, `robots.txt`, `sitemap.xml` y los archivos dentro de `css`, `js` e `img` a **0644**. Las carpetas deben quedar en **0755**. No uses 0777.

La captura del error mostraba archivos con 0600 y carpetas con 0755. El paquete anterior conservaba permisos 0600, lo que puede impedir que el servidor de contenido estático lea sus archivos. Ambos ZIP nuevos fuerzan archivos 0644 y directorios 0755. El paquete completo incluye la sección de video HLS actualizada y los cuatro botones con compra directa `https://payhip.com/buy?link=KCz65`. No requiere aplicar los parches anteriores por separado. La reproducción real desde el CDN de Bunny sigue pendiente de verificación desde el hosting, porque el proxy de este entorno bloquea ese dominio.

Si `/index.html` carga y la URL que termina en `/` no, hay que revisar el documento índice del hosting (`index.html`). Si ambas siguen dando 403 con permisos correctos, revisa el registro de errores del hosting, el propietario de la carpeta y las reglas de acceso de `.htaccess`; no borres reglas ni reemplaces archivos de configuración sin identificar cuál bloquea la lectura.

Desde este entorno no se pudo verificar la respuesta del servidor de origen: el proxy de salida rechazó la conexión a ese dominio. La corrección del paquete se verificó localmente: integridad ZIP, permisos de cada entrada y contenido idéntico al sitio auditado.

Para regenerar los paquetes: `python scripts/package-hosting.py`.
