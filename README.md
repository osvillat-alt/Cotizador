# Cotizador MCM

Aplicación estática con cotizaciones, precios y recetas guardados en el navegador. Usa el Firebase existente de MCM únicamente para recibir las solicitudes del formulario público. No requiere servidor propio, compilación, paquetes npm ni servicios de IA. Incluye las 24 recetas del Excel, 133 ingredientes y 62 insumos; también conserva la cotización, los 9 pedidos y las 7 ventas de la versión anterior del repositorio, con sus clientes e importes originales. Los precios de los insumos quedan pendientes para capturarlos nuevamente.

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

Se validan los ingredientes, solicitudes e identificadores al importar, se escapan datos al dibujar HTML y se rechazan versiones desconocidas de respaldo. La política de contenido permite el SDK y las conexiones de Firebase/Google para autenticación y recepción; sigue bloqueando formularios y objetos incrustados. Los scripts y manejadores locales siguen siendo inline. WhatsApp se abre sin acceso a la ventana de origen y recibe el mensaje de cotización que el usuario elige compartir.

## Pedidos del formulario de MCM

En MCM, **Enviar por WhatsApp** mantiene el mensaje y guarda una solicitud en Firestore (`orderRequests`). El cliente debe completar el envío en WhatsApp y mantener MCM abierto hasta ver **Solicitud recibida**. Abrir WhatsApp no demuestra que se haya enviado el mensaje. Si falla Firebase, el mensaje sigue disponible y MCM muestra el error para reintentar.

En el cotizador, conecta con Google usando una de las cuentas que administra MCM: `osvillat@gmail.com` o `calderamoralesmarisol@gmail.com`. Las solicitudes se reciben en tiempo real mientras estás conectado. También se recuperan al volver a abrir la página con la sesión conservada, aunque hayan llegado mientras estaba cerrada.

Cada solicitud genera una **vista previa pendiente** en **Cotizaciones guardadas**, con los precios y las cantidades de las combinaciones que hayas guardado en este navegador. Si faltan costos, se guarda sin importe final y muestra qué completar. No se inventan precios. Nutella corresponde a Crema de avellana, Red velvet a Redvelvet y Seco a Normal; los sabores sin equivalencia y los rellenos múltiples conservan sus nombres y necesitan un costo manual o una receta asignada. El diseño con descripción, imagen o texto se prepara como Personalizado.

Usa **Revisar y autorizar**, confirma figura y altura (el formulario no las solicita), completa costos y marca la revisión. **Autorizar y guardar** actualiza esa misma cotización; **Autorizar y crear pedido** conserva fecha, hora, teléfono y notas. Las vistas previas pendientes no se pueden compartir como cotización final ni convertir en pedidos. La recepción conserva el formulario que estuvieras editando.

Los identificadores recibidos se guardan con el respaldo para evitar duplicados, incluso después de eliminar una vista previa. Las solicitudes originales quedan en Firebase; los precios, cálculos, autorizaciones y pedidos permanecen locales. Otro navegador genera su propia copia con sus propios precios. Restaurar un respaldo anterior a una solicitud o borrar todos los datos puede volver a importarla.

### Activación conjunta

1. Publica los cambios de `osvillat-alt/mcm` y de este repositorio como una misma actualización.
2. En Firebase, proyecto `mcm-reposteria`, **Authentication → Settings → Authorized domains**, agrega `osvillat-alt.github.io`. Conserva el proveedor Google que utiliza el administrador de MCM.
3. Revisa y publica las reglas incluidas en el repositorio MCM (`firestore.rules`). El ejemplo incluye el catálogo público `products` y la recepción privada `orderRequests`. Compara con las reglas reales antes de reemplazarlas y conserva las colecciones adicionales que existan. Un permiso general `allow read, write: if true` también permitiría leer solicitudes: elimínalo o restríngelo; las reglas permisivas se combinan, no se anulan con una regla más estricta.
4. Comprueba con un pedido de prueba: envío de WhatsApp, solicitud confirmada en MCM, vista previa local al conectar el cotizador y autorización. Desde una sesión sin autorización, la lectura de `orderRequests` debe ser rechazada.

Las claves de configuración públicas de Firebase identifican la aplicación; la protección de las solicitudes depende de las reglas publicadas. Los clientes sólo pueden crear solicitudes con campos limitados, y únicamente las dos cuentas verificadas pueden leerlas o eliminarlas. El cotizador no modifica solicitudes en la nube. No se debe activar la recepción con reglas de prueba abiertas.

GitHub Pages sirve código público: una contraseña escrita en JavaScript no protege información confidencial. Si se agrega una API de pago, su clave debe permanecer en un servidor con autenticación, autorización y límites de uso. Los secretos de GitHub Actions no son privados si se incorporan al HTML o JavaScript publicado. Para proteger una cuenta de GitHub, usa autenticación de dos factores y habilita las protecciones de secretos disponibles en **Settings → Security**.

Verificación sin dependencias: `node check.mjs`.
