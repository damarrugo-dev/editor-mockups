# Editor de mockups

Editor de mockups de páginas web en línea, al estilo de Figma, para trabajar en equipo y en tiempo real.

- **Lienzo infinito** con marcos (pantallas de escritorio, tableta y celular), rectángulos, elipses, líneas, flechas, textos, imágenes e íconos.
- **Componentes web listos**: barra de navegación, sección principal, tarjetas, botones, campos, formularios, pestañas, tablas, precios, pie de página y más. Clic para agregarlos o arrastrarlos al lienzo.
- **Plantillas** para empezar: página de inicio y pantalla de ingreso móvil.
- **Capas y páginas**: ordenar arrastrando, agrupar, ocultar, bloquear, renombrar.
- **Propiedades** como en Figma: posición, tamaño, rotación, radio, relleno, borde, sombra, opacidad, tipografía (fuentes de Google), alineación y distribución, guías inteligentes al mover.
- **Prototipo**: enlaces entre marcos y botón ▶ Presentar para navegar el mockup como si fuera la página real.
- **Exportar**: PNG (1x, 2x, 3x), HTML de un marco, CSS de cualquier figura, copia completa del archivo en .json.
- **Edición en equipo**: cada persona ve el cursor y el nombre de las demás; lo que alguien está **arrastrando** o **escribiendo** se ve sombreado con su color antes de soltarlo. Clic en la foto de alguien para seguir su vista.
- Deshacer / rehacer, copiar y pegar (también imágenes desde el portapapeles), atajos de teclado (`?` los muestra), tema claro y oscuro.

Es un sitio estático (`index.html`, `styles.css`, `js/`) publicado con GitHub Pages. Los datos viven en un proyecto de Firebase propio del editor. Mientras `config.js` tenga `firebaseConfig = null` (o si se abre con `?prueba` al final del enlace), funciona en **modo de prueba**: guarda solo en el navegador, y dos pestañas del mismo navegador se ven entre sí para probar la edición en equipo.

## Seguridad e inicio de sesión

Es la misma del Tablero Kanban:

- Solo entran personas con correo **@hitss.com** o **@anava.com**: escriben su correo y abren el enlace que les llega.
- Las reglas de la base de datos (`firestore.rules` y `database.rules.json`) rechazan cualquier lectura o escritura de alguien que no haya entrado con un correo confirmado de esos dominios, aunque conozca la dirección del sitio.
- Todos los de la empresa ven y editan todos los archivos; **solo quien creó un archivo** (o un administrador) puede borrarlo.
- Cada persona solo puede escribir su propia presencia (cursor, selección): nadie puede hacerse pasar por otra.
- **Control de acceso**: quién pidió el enlace, quién entró y quién intentó con un correo no permitido queda registrado (colección `accesos`). Nadie puede cambiar ni borrar ese registro, y solo los administradores de `config.js` lo ven (botón **Accesos**).

## Puesta en marcha

### 1. Publicar el sitio (GitHub Pages)

1. En este repositorio: **Settings** → **Pages**.
2. En *Build and deployment* → *Source*: **Deploy from a branch**.
3. En *Branch*: **main** y carpeta **/ (root)** → **Save**.
4. En uno o dos minutos queda en `https://damarrugo-dev.github.io/editor-mockups/`. Cada cambio que se sube a `main` se publica solo.

### 2. Firebase (proyecto `editor-mockups`)

1. **Authentication → Método de acceso**: activar **Correo electrónico/contraseña** y **Vínculo del correo electrónico** → Guardar.
2. **Authentication → Configuración → Dominios autorizados**: agregar `damarrugo-dev.github.io`.
3. **Firestore Database → Reglas**: borrar lo que hay, pegar el contenido de [`firestore.rules`](firestore.rules) → **Publicar**.
4. **Realtime Database → Reglas**: borrar lo que hay, pegar el contenido de [`database.rules.json`](database.rules.json) → **Publicar**.
5. La configuración web (`firebaseConfig`) y la dirección de la Realtime Database (`presenciaURL`) van en [`config.js`](config.js).

¿Para qué dos bases de datos? Los archivos y figuras viven en **Firestore**. Los cursores y las sombras en vivo cambian muchas veces por segundo; en **Realtime Database** eso no gasta la cuota gratuita y, si alguien cierra la pestaña, su cursor desaparece solo. Sin `presenciaURL`, la presencia va por Firestore, más despacio.

Para cambiar los dominios permitidos o los administradores, hay que cambiarlos en `config.js`, en `firestore.rules` y en `database.rules.json`.

## Cómo se guarda

- Cada archivo es un documento de `mockups` (nombre, páginas, quién lo creó, miniatura).
- Cada figura es un documento de `mockups/{archivo}/objetos`. Al cambiar algo se guarda solo lo que cambió, así dos personas pueden editar figuras distintas, o propiedades distintas de la misma figura, sin pisarse.
- Mientras alguien arrastra o escribe, el cambio viaja solo por la presencia (Realtime Database) y se guarda al soltar o al terminar de escribir.
- Las imágenes se reducen y se guardan dentro de la figura (hasta ~700 KB cada una).
