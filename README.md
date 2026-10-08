# Cotizador MCM

Aplicación estática sin API keys, servicios de IA, dependencias ni servidor de datos. Incluye las 24 recetas del Excel, 133 ingredientes y 62 insumos; también conserva la cotización, los 9 pedidos y las 7 ventas de la versión anterior del repositorio, con sus clientes e importes originales. Los precios de los insumos quedan pendientes para capturarlos nuevamente.

Estos datos iniciales están en el código público por solicitud expresa del propietario. La ruta `CCMMCM` y la indicación de no indexar no ofrecen control de acceso.

## Primer uso

Abre la página y captura precios y presentaciones en **Insumos**. En **Recetas**, asigna las recetas a sus sabores cuando sea necesario y completa conversiones o cantidades pendientes. Si ya trabajas con la versión local, exporta primero su respaldo actualizado y usa **Ajustes → Importar respaldo** para trasladar tus cambios.

El respaldo se lee en el navegador y no se sube a GitHub. Importar reemplaza los datos actuales y pide confirmación. Las cotizaciones guardadas conservan sus importes; abrirlas prepara un nuevo cálculo con precios actuales.

Los datos se guardan en este navegador y en esta dirección. Los de un archivo local, otro dominio, otro navegador o modo privado no se trasladan automáticamente. Exporta respaldos periódicamente y mantenlos fuera del repositorio. Quien tenga acceso a tu perfil del navegador puede leer estos datos; el respaldo JSON tampoco está cifrado.

## Publicación en GitHub Pages

Sube únicamente los archivos de esta carpeta a la raíz del repositorio, conservando la subcarpeta `CCMMCM`. Reemplaza también el antiguo `index.html` de la raíz por el de este paquete. En **Settings → Pages**, selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)**. Activa **Enforce HTTPS**. La dirección prevista es `https://osvillat-alt.github.io/Cotizador/CCMMCM/`.

La raíz muestra “Página no disponible”, sin enlaces ni redirecciones al cotizador. La página del cotizador pide a los buscadores no indexarla. Esto reduce el descubrimiento casual, pero no restringe el acceso: cualquiera con la dirección puede entrar y el repositorio público muestra la ruta. Para permitir únicamente usuarios autorizados se necesita autenticación aplicada por un servidor o servicio de acceso.

No subas respaldos del navegador, archivos `.env` ni claves. `.gitignore` ayuda con archivos nuevos; no borra archivos ya publicados ni su historial. Quitar datos de la última versión no elimina copias ni commits anteriores.

## Seguridad

Se validan los ingredientes y los identificadores al importar, se escapan datos al dibujar HTML y se rechazan versiones desconocidas de respaldo. La política de contenido bloquea conexiones, recursos externos, formularios y objetos incrustados. Los scripts y manejadores locales siguen siendo inline; esta política no sustituye la validación ni ofrece una garantía contra todo XSS. WhatsApp se abre sin acceso a la ventana de origen y recibe el mensaje de cotización que el usuario elige compartir.

GitHub Pages sirve código público: una contraseña escrita en JavaScript no protege información confidencial. Si se agrega una API de pago, su clave debe permanecer en un servidor con autenticación, autorización y límites de uso. Los secretos de GitHub Actions no son privados si se incorporan al HTML o JavaScript publicado. Para proteger una cuenta de GitHub, usa autenticación de dos factores y habilita las protecciones de secretos disponibles en **Settings → Security**.

Verificación sin dependencias: `node check.mjs`.
