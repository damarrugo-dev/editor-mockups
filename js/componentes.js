// Biblioteca de componentes de páginas web: cada uno es un grupo de figuras listo para soltar en un marco.
// Las posiciones son relativas a la esquina del componente; al insertarlo se mueven a donde se suelta.
import { figuraNueva as f, TAMANOS_MARCO } from './figuras.js';

// Paleta: rojos corporativos (varios tonos) con blanco y grises neutros
const ROJO = '#c8102e', ROJO_OSC = '#8a0b20', ROJO_MED = '#e0485e', ROJO_CLARO = '#f7c6cd', ROJO_SUAVE = '#fdecee', ROJO_FONDO = '#fff6f7';
const TINTA = '#1f1a1b', GRIS = '#6b6365', LINEA = '#e5d9db', SUAVE = '#f6f1f2';
const VERDE = '#1f8a4c', VERDE_SUAVE = '#e3f4ea', AMBAR = '#b26b00', AMBAR_SUAVE = '#fff1d6';
const sombra = { x: 0, y: 4, b: 16, c: 'rgba(60,10,20,.10)' };
const t = (texto, x, y, props = {}) => f('texto', { texto, x, y, nombre: texto.slice(0, 30), ...props });

export const CATEGORIAS = [
  {
    nombre: 'Marcos', items: TAMANOS_MARCO.map(([n, w, h]) => ({
      nombre: `${n}`, detalle: `${w}×${h}`, marco: true,
      crear: () => [f('marco', { nombre: n, w, h })],
    })),
  },
  {
    nombre: 'Texto', items: [
      { nombre: 'Título 1', crear: () => [t('Título principal', 0, 0, { tam: 48, peso: 700, interlineado: 1.15, color: TINTA })] },
      { nombre: 'Título 2', crear: () => [t('Subtítulo de sección', 0, 0, { tam: 32, peso: 700, interlineado: 1.2, color: TINTA })] },
      { nombre: 'Título 3', crear: () => [t('Encabezado', 0, 0, { tam: 22, peso: 600, color: TINTA })] },
      { nombre: 'Párrafo', crear: () => [t('Este es un párrafo de ejemplo. Describe brevemente el contenido de la sección para que se entienda la idea.', 0, 0, { w: 420, autoAncho: false, tam: 16, color: GRIS, interlineado: 1.6 })] },
      { nombre: 'Etiqueta', crear: () => [t('ETIQUETA', 0, 0, { tam: 12, peso: 700, espaciado: 1.5, color: ROJO })] },
      { nombre: 'Enlace', crear: () => [t('Ver más →', 0, 0, { tam: 16, peso: 600, color: ROJO, decoracion: 'underline' })] },
    ],
  },
  {
    nombre: 'Botones y formularios', items: [
      { nombre: 'Botón principal', crear: () => boton('Comenzar', ROJO, '#ffffff') },
      { nombre: 'Botón secundario', crear: () => boton('Saber más', '#ffffff', TINTA, LINEA) },
      { nombre: 'Botón de texto', crear: () => [t('Cancelar', 0, 0, { tam: 15, peso: 600, color: ROJO })] },
      { nombre: 'Campo de texto', crear: () => campo('Correo electrónico', 'nombre@empresa.com') },
      { nombre: 'Área de texto', crear: () => [
        t('Mensaje', 0, 0, { tam: 14, peso: 500, color: TINTA }),
        f('rect', { nombre: 'Área', x: 0, y: 24, w: 320, h: 120, relleno: '#ffffff', borde: LINEA, radio: 8 }),
        t('Escribe tu mensaje…', 14, 36, { tam: 15, color: '#a39a9c' }),
      ] },
      { nombre: 'Lista desplegable', crear: () => [
        t('País', 0, 0, { tam: 14, peso: 500, color: TINTA }),
        f('rect', { nombre: 'Lista', x: 0, y: 24, w: 320, h: 44, relleno: '#ffffff', borde: LINEA, radio: 8 }),
        t('Colombia', 14, 35, { tam: 15, color: TINTA }),
        f('icono', { icono: 'abajo', x: 288, y: 36, w: 20, h: 20, color: GRIS }),
      ] },
      { nombre: 'Casilla', crear: () => [
        f('rect', { nombre: 'Casilla', x: 0, y: 1, w: 20, h: 20, relleno: ROJO, radio: 5 }),
        f('icono', { icono: 'check', x: 3, y: 4, w: 14, h: 14, color: '#ffffff', grosorBorde: 3 }),
        t('Recordarme', 30, 0, { tam: 15, color: TINTA }),
      ] },
      { nombre: 'Opción (radio)', crear: () => [
        f('elipse', { nombre: 'Radio', x: 0, y: 1, w: 20, h: 20, relleno: '#ffffff', borde: ROJO, grosorBorde: 2 }),
        f('elipse', { nombre: 'Punto', x: 5, y: 6, w: 10, h: 10, relleno: ROJO }),
        t('Opción', 30, 0, { tam: 15, color: TINTA }),
      ] },
      { nombre: 'Interruptor', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 44, h: 24, relleno: ROJO, radio: 12 }),
        f('elipse', { nombre: 'Perilla', x: 22, y: 2, w: 20, h: 20, relleno: '#ffffff' }),
      ] },
      { nombre: 'Deslizador', crear: () => [
        f('rect', { nombre: 'Riel', x: 0, y: 8, w: 240, h: 6, relleno: LINEA, radio: 3 }),
        f('rect', { nombre: 'Avance', x: 0, y: 8, w: 140, h: 6, relleno: ROJO, radio: 3 }),
        f('elipse', { nombre: 'Perilla', x: 130, y: 1, w: 20, h: 20, relleno: '#ffffff', borde: ROJO, grosorBorde: 2 }),
      ] },
      { nombre: 'Buscador', crear: () => [
        f('rect', { nombre: 'Buscador', x: 0, y: 0, w: 320, h: 44, relleno: SUAVE, radio: 22 }),
        f('icono', { icono: 'buscar', x: 16, y: 12, w: 20, h: 20, color: GRIS }),
        t('Buscar…', 46, 11, { tam: 15, color: '#a39a9c' }),
      ] },
      { nombre: 'Formulario de ingreso', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 400, h: 420, relleno: '#ffffff', radio: 16, sombra }),
        t('Iniciar sesión', 32, 32, { tam: 26, peso: 700, color: TINTA }),
        t('Bienvenido de nuevo', 32, 72, { tam: 15, color: GRIS }),
        ...campo('Correo', 'nombre@empresa.com', 32, 116, 336),
        ...campo('Contraseña', '••••••••', 32, 202, 336),
        ...boton('Entrar', ROJO, '#ffffff', null, 32, 300, 336),
        t('¿Olvidaste tu contraseña?', 115, 368, { tam: 14, color: ROJO }),
      ] },
    ],
  },
  {
    nombre: 'Navegación', items: [
      { nombre: 'Barra de navegación', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 1440, h: 72, relleno: '#ffffff', borde: LINEA }),
        f('rect', { nombre: 'Logo', x: 80, y: 22, w: 28, h: 28, relleno: ROJO, radio: 8 }),
        t('Marca', 118, 23, { tam: 20, peso: 700, color: TINTA }),
        t('Inicio', 560, 25, { tam: 15, peso: 500, color: TINTA }),
        t('Productos', 640, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Precios', 750, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Contacto', 845, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Ingresar', 1150, 25, { tam: 15, peso: 600, color: TINTA }),
        ...boton('Registrarse', ROJO, '#ffffff', null, 1240, 14, 120, 44),
      ] },
      { nombre: 'Barra móvil', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 390, h: 60, relleno: '#ffffff', borde: LINEA }),
        f('icono', { icono: 'menu', x: 18, y: 18, w: 24, h: 24, color: TINTA }),
        t('Marca', 166, 17, { tam: 19, peso: 700, color: TINTA }),
        f('icono', { icono: 'carrito', x: 348, y: 18, w: 24, h: 24, color: TINTA }),
      ] },
      { nombre: 'Pestañas', crear: () => [
        t('General', 0, 0, { tam: 15, peso: 600, color: ROJO }),
        f('rect', { nombre: 'Indicador', x: 0, y: 30, w: 58, h: 3, relleno: ROJO, radio: 2 }),
        t('Detalles', 90, 0, { tam: 15, peso: 500, color: GRIS }),
        t('Opiniones', 186, 0, { tam: 15, peso: 500, color: GRIS }),
        f('rect', { nombre: 'Línea', x: 0, y: 32, w: 300, h: 1, relleno: LINEA }),
      ] },
      { nombre: 'Ruta (migas)', crear: () => [
        t('Inicio  /  Productos  /  Detalle', 0, 0, { tam: 14, color: GRIS }),
      ] },
      { nombre: 'Paginación', crear: () => [1, 2, 3, 4].flatMap((n, i) => [
        f('rect', { nombre: `Página ${n}`, x: i * 44, y: 0, w: 36, h: 36, relleno: n === 1 ? ROJO : '#ffffff', borde: n === 1 ? null : LINEA, radio: 8 }),
        t(String(n), i * 44 + 14, 8, { tam: 15, peso: 600, color: n === 1 ? '#ffffff' : TINTA }),
      ]) },
      { nombre: 'Barra inferior móvil', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 390, h: 72, relleno: '#ffffff', borde: LINEA }),
        ...['inicio', 'buscar', 'corazon', 'usuario'].map((ic, i) => f('icono', { icono: ic, x: 41 + i * 92, y: 24, w: 24, h: 24, color: i ? GRIS : ROJO })),
      ] },
    ],
  },
  {
    nombre: 'Contenido', items: [
      { nombre: 'Tarjeta', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 320, h: 380, relleno: '#ffffff', radio: 16, sombra }),
        f('imagen', { nombre: 'Imagen', x: 0, y: 0, w: 320, h: 180, radio: 0 }),
        t('Título de la tarjeta', 24, 200, { tam: 20, peso: 700, color: TINTA }),
        t('Una descripción corta que explica el contenido de esta tarjeta.', 24, 236, { w: 272, autoAncho: false, tam: 15, color: GRIS, interlineado: 1.5 }),
        ...boton('Ver más', SUAVE, TINTA, null, 24, 312, 120, 44),
      ] },
      { nombre: 'Sección principal (hero)', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 1440, h: 560, relleno: ROJO_FONDO }),
        t('Diseña páginas más rápido', 80, 150, { tam: 56, peso: 800, color: TINTA, interlineado: 1.1, w: 600, autoAncho: false }),
        t('Explica en una o dos líneas qué ofrece el producto y por qué le sirve a quien visita la página.', 80, 290, { tam: 19, color: GRIS, w: 540, autoAncho: false, interlineado: 1.6 }),
        ...boton('Comenzar gratis', ROJO, '#ffffff', null, 80, 390, 180, 52),
        ...boton('Ver demostración', '#ffffff', TINTA, LINEA, 276, 390, 190, 52),
        f('imagen', { nombre: 'Imagen', x: 760, y: 80, w: 600, h: 400, radio: 20 }),
      ] },
      { nombre: 'Lista de características', crear: () => [0, 1, 2].flatMap(i => [
        f('rect', { nombre: 'Ícono fondo', x: i * 300, y: 0, w: 48, h: 48, relleno: ROJO_SUAVE, radio: 12 }),
        f('icono', { icono: ['grafica', 'candado', 'reloj'][i], x: i * 300 + 12, y: 12, w: 24, h: 24, color: ROJO }),
        t(['Rápido', 'Seguro', 'Siempre disponible'][i], i * 300, 68, { tam: 19, peso: 700, color: TINTA }),
        t('Texto corto que explica esta característica.', i * 300, 100, { w: 250, autoAncho: false, tam: 15, color: GRIS, interlineado: 1.5 }),
      ]) },
      { nombre: 'Precio', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 300, h: 400, relleno: '#ffffff', radio: 16, borde: LINEA }),
        t('Profesional', 28, 28, { tam: 17, peso: 600, color: ROJO }),
        t('$49', 28, 62, { tam: 44, peso: 800, color: TINTA }),
        t('/ mes', 112, 82, { tam: 15, color: GRIS }),
        ...['Usuarios ilimitados', 'Soporte prioritario', 'Reportes avanzados'].flatMap((x, i) => [
          f('icono', { icono: 'check', x: 28, y: 150 + i * 36, w: 18, h: 18, color: VERDE, grosorBorde: 3 }),
          t(x, 56, 148 + i * 36, { tam: 15, color: TINTA }),
        ]),
        ...boton('Elegir plan', ROJO, '#ffffff', null, 28, 320, 244, 48),
      ] },
      { nombre: 'Testimonio', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 380, h: 200, relleno: '#ffffff', radio: 16, sombra }),
        t('“Excelente servicio, nos ahorró semanas de trabajo.”', 24, 24, { w: 332, autoAncho: false, tam: 17, color: TINTA, cursiva: true, interlineado: 1.5 }),
        f('elipse', { nombre: 'Foto', x: 24, y: 128, w: 44, h: 44, relleno: ROJO_CLARO }),
        t('Ana Gómez', 80, 128, { tam: 15, peso: 700, color: TINTA }),
        t('Gerente, Empresa', 80, 150, { tam: 13, color: GRIS }),
      ] },
      { nombre: 'Tabla', crear: () => {
        const filas = [['Nombre', 'Estado', 'Fecha'], ['Pedido 1024', 'Enviado', '12 oct'], ['Pedido 1025', 'Pendiente', '13 oct'], ['Pedido 1026', 'Entregado', '14 oct']];
        return [
          f('rect', { nombre: 'Tabla', x: 0, y: 0, w: 540, h: 192, relleno: '#ffffff', radio: 10, borde: LINEA }),
          f('rect', { nombre: 'Encabezado', x: 1, y: 1, w: 538, h: 47, relleno: SUAVE, radio: 10 }),
          ...filas.flatMap((fila, i) => [
            ...(i > 1 ? [f('rect', { nombre: 'Separador', x: 0, y: i * 48, w: 540, h: 1, relleno: LINEA })] : []),
            ...fila.map((c, j) => t(c, 20 + j * 180, i * 48 + 14, { tam: 14, peso: i ? 400 : 600, color: i ? TINTA : GRIS })),
          ]),
        ];
      } },
      { nombre: 'Pie de página', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 1440, h: 240, relleno: TINTA }),
        t('Marca', 80, 48, { tam: 22, peso: 700, color: '#ffffff' }),
        t('Haciendo la web más simple.', 80, 86, { tam: 15, color: '#a39a9c' }),
        ...[['Producto', 'Precios', 'Novedades'], ['Empresa', 'Nosotros', 'Empleo'], ['Ayuda', 'Contacto', 'Términos']].flatMap((col, i) =>
          col.map((x, j) => t(x, 760 + i * 200, 48 + j * 34, { tam: j ? 15 : 14, peso: j ? 400 : 700, color: j ? '#a39a9c' : '#ffffff' }))),
        f('rect', { nombre: 'Línea', x: 80, y: 180, w: 1280, h: 1, relleno: '#4a3f41' }),
        t('© 2026 Marca. Todos los derechos reservados.', 80, 198, { tam: 13, color: '#a39a9c' }),
      ] },
    ],
  },
  {
    nombre: 'Elementos', items: [
      { nombre: 'Imagen', crear: () => [f('imagen', { nombre: 'Imagen', w: 320, h: 200, radio: 8 })] },
      { nombre: 'Avatar', crear: () => [
        f('elipse', { nombre: 'Avatar', x: 0, y: 0, w: 48, h: 48, relleno: ROJO_SUAVE }),
        t('AG', 13, 13, { tam: 16, peso: 700, color: ROJO }),
      ] },
      { nombre: 'Insignia', crear: () => [
        f('rect', { nombre: 'Insignia', x: 0, y: 0, w: 72, h: 26, relleno: VERDE_SUAVE, radio: 13 }),
        t('Activo', 14, 4, { tam: 13, peso: 600, color: VERDE }),
      ] },
      { nombre: 'Alerta', crear: () => [
        f('rect', { nombre: 'Alerta', x: 0, y: 0, w: 420, h: 56, relleno: ROJO_FONDO, radio: 10, borde: ROJO_CLARO }),
        f('icono', { icono: 'info', x: 16, y: 16, w: 24, h: 24, color: ROJO }),
        t('Tus cambios se guardaron correctamente.', 52, 17, { tam: 15, color: ROJO_OSC }),
      ] },
      { nombre: 'Barra de progreso', crear: () => [
        f('rect', { nombre: 'Riel', x: 0, y: 0, w: 300, h: 8, relleno: LINEA, radio: 4 }),
        f('rect', { nombre: 'Avance', x: 0, y: 0, w: 190, h: 8, relleno: ROJO, radio: 4 }),
      ] },
      { nombre: 'Divisor', crear: () => [f('rect', { nombre: 'Divisor', w: 400, h: 1, relleno: LINEA })] },
      { nombre: 'Video', crear: () => [
        f('rect', { nombre: 'Video', x: 0, y: 0, w: 480, h: 270, relleno: TINTA, radio: 12 }),
        f('elipse', { nombre: 'Botón', x: 208, y: 103, w: 64, h: 64, relleno: 'rgba(255,255,255,.9)' }),
        f('icono', { icono: 'reproducir', x: 228, y: 121, w: 28, h: 28, color: TINTA }),
      ] },
      { nombre: 'Mapa', crear: () => [
        f('rect', { nombre: 'Mapa', x: 0, y: 0, w: 400, h: 260, relleno: '#e0f2e9', radio: 12 }),
        f('linea', { nombre: 'Calle', x: 0, y: 90, w: 400, h: 60, borde: '#ffffff', grosorBorde: 10 }),
        f('linea', { nombre: 'Calle', x: 240, y: 0, w: -60, h: 260, borde: '#ffffff', grosorBorde: 8 }),
        f('icono', { icono: 'ubicacion', x: 190, y: 96, w: 36, h: 36, color: ROJO, grosorBorde: 2.5 }),
      ] },
      { nombre: 'Ventana modal', crear: () => [
        f('rect', { nombre: 'Ventana', x: 0, y: 0, w: 440, h: 240, relleno: '#ffffff', radio: 16, sombra: { x: 0, y: 20, b: 50, c: 'rgba(17,24,39,.25)' } }),
        t('¿Eliminar elemento?', 28, 28, { tam: 20, peso: 700, color: TINTA }),
        f('icono', { icono: 'cerrar', x: 396, y: 26, w: 20, h: 20, color: GRIS }),
        t('Esta acción no se puede deshacer. ¿Seguro que quieres continuar?', 28, 70, { w: 384, autoAncho: false, tam: 15, color: GRIS, interlineado: 1.5 }),
        ...boton('Cancelar', '#ffffff', TINTA, LINEA, 172, 164, 112, 44),
        ...boton('Eliminar', ROJO, '#ffffff', null, 296, 164, 116, 44),
      ] },
    ],
  },
  {
    nombre: 'KPI e indicadores', items: [
      { nombre: 'KPI', crear: () => kpi('Entregas a tiempo', '96,4 %', '▲ 2,1 % vs. semana pasada', 'check') },
      { nombre: 'Fila de KPI logísticos', crear: () => [
        ['OTIF', '94,8 %', '▲ 1,2 %', 'check'], ['Pedidos en ruta', '1.284', '▲ 86 hoy', 'camion'],
        ['Ocupación de muelles', '78 %', '▼ 4 %', 'almacen'], ['Citas del día', '142', '18 pendientes', 'calendario'],
      ].flatMap(([a, b, c, ic], i) => kpi(a, b, c, ic, i * 276, 0, 260)) },
      { nombre: 'KPI con meta', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 300, h: 150, relleno: '#ffffff', radio: 14, borde: LINEA }),
        t('Cumplimiento de ventanas', 20, 18, { tam: 14, peso: 500, color: GRIS }),
        t('87 %', 20, 44, { tam: 34, peso: 800, color: TINTA }),
        t('Meta 92 %', 210, 58, { tam: 13, peso: 600, color: ROJO }),
        f('rect', { nombre: 'Riel', x: 20, y: 104, w: 260, h: 10, relleno: ROJO_SUAVE, radio: 5 }),
        f('rect', { nombre: 'Avance', x: 20, y: 104, w: 226, h: 10, relleno: ROJO, radio: 5 }),
        f('rect', { nombre: 'Meta', x: 259, y: 98, w: 2, h: 22, relleno: ROJO_OSC }),
        t('Faltan 5 puntos para la meta', 20, 124, { tam: 12, color: GRIS }),
      ] },
      { nombre: 'Indicador circular', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 220, h: 230, relleno: '#ffffff', radio: 14, borde: LINEA }),
        f('elipse', { nombre: 'Anillo', x: 50, y: 24, w: 120, h: 120, relleno: ROJO_FONDO, borde: ROJO, grosorBorde: 14 }),
        t('72 %', 80, 70, { tam: 26, peso: 800, color: TINTA }),
        t('Ocupación de patio', 0, 168, { w: 220, autoAncho: false, alinear: 'center', tam: 14, peso: 600, color: TINTA }),
        t('1.940 de 2.700 TEU', 0, 192, { w: 220, autoAncho: false, alinear: 'center', tam: 13, color: GRIS }),
      ] },
      { nombre: 'Gráfica de barras', crear: () => {
        const v = [62, 78, 54, 90, 84, 70, 96], d = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 480, h: 280, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Entregas por día', 24, 20, { tam: 17, peso: 700, color: TINTA }),
          t('Última semana', 24, 46, { tam: 13, color: GRIS }),
          ...[0, 1, 2, 3].map(i => f('rect', { nombre: 'Guía', x: 24, y: 90 + i * 40, w: 432, h: 1, relleno: SUAVE })),
          ...v.flatMap((n, i) => [
            f('rect', { nombre: `Barra ${d[i]}`, x: 40 + i * 60, y: 230 - n * 1.4, w: 32, h: n * 1.4, relleno: i === 6 ? ROJO : i % 2 ? ROJO_MED : ROJO_CLARO, radio: 6 }),
            t(d[i], 42 + i * 60, 242, { tam: 12, color: GRIS }),
          ]),
        ];
      } },
      { nombre: 'Gráfica de línea', crear: () => {
        const p = [140, 120, 128, 96, 104, 72, 60];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 480, h: 240, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Tiempo promedio de entrega', 24, 20, { tam: 17, peso: 700, color: TINTA }),
          t('-18 %', 400, 22, { tam: 15, peso: 700, color: VERDE }),
          ...p.slice(1).map((y, i) => f('linea', { nombre: 'Tramo', x: 40 + i * 66, y: p[i] + 40, w: 66, h: y - p[i], borde: ROJO, grosorBorde: 3 })),
          ...p.map((y, i) => f('elipse', { nombre: 'Punto', x: 35 + i * 66, y: y + 35, w: 10, h: 10, relleno: '#ffffff', borde: ROJO, grosorBorde: 2 })),
        ];
      } },
      { nombre: 'Ranking de transportadoras', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 380, h: 250, relleno: '#ffffff', radio: 14, borde: LINEA }),
        t('Desempeño por transportadora', 20, 18, { tam: 16, peso: 700, color: TINTA }),
        ...[['TransAndes', 98], ['RutaSur', 91], ['Carga Express', 84], ['LogiNorte', 76]].flatMap(([n, v], i) => [
          t(n, 20, 62 + i * 46, { tam: 14, color: TINTA }),
          t(`${v} %`, 324, 62 + i * 46, { tam: 14, peso: 700, color: TINTA }),
          f('rect', { nombre: 'Riel', x: 20, y: 86 + i * 46, w: 340, h: 6, relleno: ROJO_SUAVE, radio: 3 }),
          f('rect', { nombre: 'Avance', x: 20, y: 86 + i * 46, w: 340 * v / 100, h: 6, relleno: [ROJO_OSC, ROJO, ROJO_MED, ROJO_CLARO][i], radio: 3 }),
        ]),
      ] },
    ],
  },
  {
    nombre: 'Barras laterales', items: [
      { nombre: 'Barra lateral completa', crear: () => lateral(true) },
      { nombre: 'Barra lateral oscura', crear: () => lateral(false) },
      { nombre: 'Barra lateral compacta', crear: () => [
        f('rect', { nombre: 'Barra lateral', x: 0, y: 0, w: 72, h: 900, relleno: ROJO_OSC }),
        f('rect', { nombre: 'Logo', x: 18, y: 20, w: 36, h: 36, relleno: '#ffffff', radio: 10 }),
        f('icono', { icono: 'camion', x: 26, y: 28, w: 20, h: 20, color: ROJO }),
        ...MENU.map(([ic], i) => [
          ...(i === 0 ? [f('rect', { nombre: 'Activo', x: 14, y: 84, w: 44, h: 44, relleno: ROJO, radio: 10 })] : []),
          f('icono', { icono: ic, x: 24, y: 94 + i * 56, w: 24, h: 24, color: i ? ROJO_CLARO : '#ffffff' }),
        ]).flat(),
        f('elipse', { nombre: 'Usuario', x: 16, y: 836, w: 40, h: 40, relleno: ROJO_MED }),
        t('DM', 26, 846, { tam: 14, peso: 700, color: '#ffffff' }),
      ] },
      { nombre: 'Panel lateral de detalle', crear: () => [
        f('rect', { nombre: 'Panel', x: 0, y: 0, w: 380, h: 900, relleno: '#ffffff', borde: LINEA, sombra: { x: -8, y: 0, b: 30, c: 'rgba(60,10,20,.12)' } }),
        t('Envío GU-458201', 24, 24, { tam: 20, peso: 700, color: TINTA }),
        f('icono', { icono: 'cerrar', x: 336, y: 26, w: 20, h: 20, color: GRIS }),
        ...insignia('En ruta', ROJO_SUAVE, ROJO, 24, 60),
        f('rect', { nombre: 'Línea', x: 0, y: 104, w: 380, h: 1, relleno: LINEA }),
        ...[['Origen', 'CEDI Bogotá'], ['Destino', 'Cra 15 #93-40, Bogotá'], ['Cliente', 'Comercial Andina S.A.S.'], ['Peso', '18,5 kg · 3 bultos'], ['Conductor', 'Carlos Pérez · ABC-123'], ['Entrega estimada', 'Hoy, 2:00 p. m. – 4:00 p. m.']].flatMap(([a, b], i) => [
          t(a, 24, 124 + i * 60, { tam: 12, peso: 600, color: GRIS, mayus: 'uppercase', espaciado: .5 }),
          t(b, 24, 144 + i * 60, { tam: 15, color: TINTA }),
        ]),
        ...boton('Ver seguimiento', ROJO, '#ffffff', null, 24, 820, 332, 48),
      ] },
      { nombre: 'Filtros laterales', crear: () => [
        f('rect', { nombre: 'Filtros', x: 0, y: 0, w: 280, h: 560, relleno: ROJO_FONDO, radio: 14, borde: ROJO_SUAVE }),
        f('icono', { icono: 'filtro', x: 20, y: 22, w: 20, h: 20, color: ROJO }),
        t('Filtros', 48, 20, { tam: 17, peso: 700, color: TINTA }),
        t('Estado', 20, 68, { tam: 13, peso: 700, color: GRIS }),
        ...['En bodega', 'En ruta', 'Entregado', 'Novedad'].flatMap((x, i) => [
          f('rect', { nombre: 'Casilla', x: 20, y: 96 + i * 34, w: 18, h: 18, relleno: i < 2 ? ROJO : '#ffffff', borde: i < 2 ? null : ROJO_CLARO, radio: 4 }),
          ...(i < 2 ? [f('icono', { icono: 'check', x: 22, y: 98 + i * 34, w: 14, h: 14, color: '#ffffff', grosorBorde: 3 })] : []),
          t(x, 48, 95 + i * 34, { tam: 14, color: TINTA }),
        ]),
        ...campo('Ciudad', 'Todas', 20, 250, 240),
        ...campo('Fecha', '21/10/2026', 20, 336, 240),
        ...boton('Aplicar', ROJO, '#ffffff', null, 20, 440, 240, 44),
        t('Limpiar filtros', 92, 500, { tam: 14, peso: 600, color: ROJO }),
      ] },
    ],
  },
  {
    nombre: 'Seguimiento de envíos', items: [
      { nombre: 'Buscar guía', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 640, h: 160, relleno: ROJO, radio: 16 }),
        t('Rastrea tu envío', 32, 28, { tam: 24, peso: 700, color: '#ffffff' }),
        f('rect', { nombre: 'Campo', x: 32, y: 80, w: 440, h: 52, relleno: '#ffffff', radio: 10 }),
        f('icono', { icono: 'codigo', x: 48, y: 96, w: 20, h: 20, color: GRIS }),
        t('Número de guía, p. ej. GU-458201', 80, 95, { tam: 15, color: '#a39a9c' }),
        ...boton('Rastrear', ROJO_OSC, '#ffffff', null, 484, 80, 124, 52),
      ] },
      { nombre: 'Línea de tiempo horizontal', crear: () => {
        const pasos = ['Recibido', 'En bodega', 'En ruta', 'Entregado'];
        return [
          f('rect', { nombre: 'Riel', x: 16, y: 15, w: 600, h: 4, relleno: ROJO_SUAVE, radio: 2 }),
          f('rect', { nombre: 'Avance', x: 16, y: 15, w: 400, h: 4, relleno: ROJO, radio: 2 }),
          ...pasos.flatMap((p, i) => [
            f('elipse', { nombre: p, x: i * 200, y: 0, w: 34, h: 34, relleno: i < 3 ? ROJO : '#ffffff', borde: i < 3 ? null : ROJO_CLARO, grosorBorde: 2 }),
            ...(i < 2 ? [f('icono', { icono: 'check', x: i * 200 + 8, y: 8, w: 18, h: 18, color: '#ffffff', grosorBorde: 3 })] : []),
            ...(i === 2 ? [f('icono', { icono: 'camion', x: 407, y: 8, w: 18, h: 18, color: '#ffffff' })] : []),
            t(p, i * 200 - 20, 46, { w: 74, autoAncho: false, alinear: 'center', tam: 13, peso: 600, color: i < 3 ? TINTA : GRIS }),
            t(['12 oct 08:10', '12 oct 15:42', 'Hoy 07:30', 'Estimado 16:00'][i], i * 200 - 30, 66, { w: 94, autoAncho: false, alinear: 'center', tam: 12, color: GRIS }),
          ]),
        ];
      } },
      { nombre: 'Historial del envío', crear: () => {
        const ev = [['Entregado a destinatario', 'Bogotá · 14:12', true], ['En reparto con el conductor', 'Bogotá · 07:30'], ['Llegó al centro de distribución', 'Bogotá · 02:15'], ['Salió del CEDI origen', 'Medellín · 18:40'], ['Guía generada', 'Medellín · 10:05']];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 400, h: 70 + ev.length * 64, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Historial', 24, 22, { tam: 17, peso: 700, color: TINTA }),
          f('rect', { nombre: 'Línea', x: 33, y: 76, w: 2, h: (ev.length - 1) * 64, relleno: ROJO_SUAVE }),
          ...ev.flatMap(([a, b, ok], i) => [
            f('elipse', { nombre: 'Punto', x: 26, y: 70 + i * 64, w: 16, h: 16, relleno: i === 0 ? ROJO : '#ffffff', borde: ROJO, grosorBorde: 2 }),
            t(a, 56, 66 + i * 64, { tam: 15, peso: i ? 500 : 700, color: TINTA }),
            t(b, 56, 88 + i * 64, { tam: 13, color: GRIS }),
          ]),
        ];
      } },
      { nombre: 'Tarjeta de envío', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 360, h: 190, relleno: '#ffffff', radio: 14, sombra }),
        f('rect', { nombre: 'Ícono fondo', x: 20, y: 20, w: 44, h: 44, relleno: ROJO_SUAVE, radio: 12 }),
        f('icono', { icono: 'paquete', x: 30, y: 30, w: 24, h: 24, color: ROJO }),
        t('GU-458201', 78, 20, { tam: 16, peso: 700, color: TINTA }),
        t('Comercial Andina S.A.S.', 78, 44, { tam: 13, color: GRIS }),
        ...insignia('En ruta', ROJO_SUAVE, ROJO, 266, 26),
        f('rect', { nombre: 'Línea', x: 20, y: 84, w: 320, h: 1, relleno: LINEA }),
        t('Medellín', 20, 100, { tam: 15, peso: 600, color: TINTA }),
        f('icono', { icono: 'flecha', x: 160, y: 102, w: 20, h: 20, color: ROJO }),
        t('Bogotá', 278, 100, { tam: 15, peso: 600, color: TINTA }),
        t('Entrega estimada: hoy, 4:00 p. m.', 20, 144, { tam: 13, color: GRIS }),
      ] },
      { nombre: 'Tabla de envíos', crear: () => tabla(
        ['Guía', 'Cliente', 'Destino', 'Estado'],
        [['GU-458201', 'Comercial Andina', 'Bogotá', 'En ruta'], ['GU-458202', 'Distri Caribe', 'Barranquilla', 'Entregado'], ['GU-458203', 'Ferretería Sol', 'Cali', 'Novedad'], ['GU-458204', 'Moda Urbana', 'Medellín', 'En bodega']],
        [140, 200, 160, 140], 3) },
      { nombre: 'Mapa de ruta', crear: () => [
        f('rect', { nombre: 'Mapa', x: 0, y: 0, w: 520, h: 320, relleno: '#f4efe9', radio: 14 }),
        f('linea', { nombre: 'Calle', x: 0, y: 110, w: 520, h: 40, borde: '#ffffff', grosorBorde: 12 }),
        f('linea', { nombre: 'Calle', x: 320, y: 0, w: -80, h: 320, borde: '#ffffff', grosorBorde: 10 }),
        f('linea', { nombre: 'Calle', x: 0, y: 250, w: 520, h: -30, borde: '#ffffff', grosorBorde: 8 }),
        f('linea', { nombre: 'Ruta', x: 70, y: 260, w: 200, h: -130, borde: ROJO, grosorBorde: 4, estiloBorde: 'dashed' }),
        f('linea', { nombre: 'Ruta', x: 270, y: 130, w: 170, h: -70, borde: ROJO, grosorBorde: 4, estiloBorde: 'dashed' }),
        ...[[52, 240, '1'], [252, 110, '2'], [422, 40, '3']].flatMap(([x, y, n], i) => [
          f('elipse', { nombre: `Parada ${n}`, x, y, w: 36, h: 36, relleno: i === 2 ? ROJO_OSC : ROJO, borde: '#ffffff', grosorBorde: 3 }),
          t(n, x + 13, y + 8, { tam: 15, peso: 700, color: '#ffffff' }),
        ]),
        f('rect', { nombre: 'Etiqueta', x: 16, y: 16, w: 190, h: 56, relleno: '#ffffff', radio: 10, sombra }),
        f('icono', { icono: 'camion', x: 28, y: 32, w: 24, h: 24, color: ROJO }),
        t('ABC-123 · 3 paradas', 62, 24, { tam: 13, peso: 700, color: TINTA }),
        t('Llega en 25 min', 62, 44, { tam: 12, color: GRIS }),
      ] },
      { nombre: 'Novedad del envío', crear: () => [
        f('rect', { nombre: 'Alerta', x: 0, y: 0, w: 460, h: 88, relleno: ROJO_SUAVE, radio: 12, borde: ROJO_CLARO }),
        f('icono', { icono: 'alerta', x: 18, y: 18, w: 26, h: 26, color: ROJO }),
        t('Novedad: destinatario ausente', 56, 16, { tam: 15, peso: 700, color: ROJO_OSC }),
        t('Se hará un segundo intento mañana entre 8:00 y 12:00.', 56, 40, { w: 380, autoAncho: false, tam: 14, color: ROJO_OSC }),
        t('Reprogramar', 56, 62, { tam: 13, peso: 700, color: ROJO, decoracion: 'underline' }),
      ] },
    ],
  },
  {
    nombre: 'Última milla', items: [
      { nombre: 'Tarjeta del conductor', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 360, h: 150, relleno: '#ffffff', radio: 14, sombra }),
        f('elipse', { nombre: 'Foto', x: 20, y: 20, w: 56, h: 56, relleno: ROJO_CLARO }),
        t('CP', 35, 36, { tam: 18, peso: 700, color: ROJO_OSC }),
        t('Carlos Pérez', 90, 22, { tam: 17, peso: 700, color: TINTA }),
        t('★ 4,9 · 1.240 entregas', 90, 48, { tam: 13, color: GRIS }),
        f('rect', { nombre: 'Placa', x: 20, y: 96, w: 92, h: 34, relleno: '#ffd400', radio: 6, borde: TINTA, grosorBorde: 2 }),
        t('ABC-123', 30, 102, { tam: 15, peso: 800, color: TINTA }),
        ...boton('Llamar', ROJO, '#ffffff', null, 216, 92, 124, 40),
      ] },
      { nombre: 'Lista de paradas', crear: () => {
        const ps = [['Cra 15 #93-40', 'Comercial Andina · 2 bultos', 'Entregado'], ['Cl 72 #10-51', 'Ferretería Sol · 1 bulto', 'Siguiente'], ['Av 68 #24-15', 'Moda Urbana · 4 bultos', 'Pendiente']];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 390, h: 60 + ps.length * 80, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Paradas de hoy · 3 de 18', 20, 20, { tam: 16, peso: 700, color: TINTA }),
          ...ps.flatMap(([a, b, e], i) => [
            f('elipse', { nombre: 'Número', x: 20, y: 66 + i * 80, w: 32, h: 32, relleno: e === 'Entregado' ? VERDE : e === 'Siguiente' ? ROJO : ROJO_SUAVE }),
            t(String(i + 1), 31, 72 + i * 80, { tam: 14, peso: 700, color: e === 'Pendiente' ? ROJO : '#ffffff' }),
            t(a, 66, 62 + i * 80, { tam: 15, peso: 600, color: TINTA }),
            t(b, 66, 84 + i * 80, { tam: 13, color: GRIS }),
            ...insignia(e, e === 'Entregado' ? VERDE_SUAVE : e === 'Siguiente' ? ROJO_SUAVE : SUAVE, e === 'Entregado' ? VERDE : e === 'Siguiente' ? ROJO : GRIS, 284, 68 + i * 80),
          ]),
        ];
      } },
      { nombre: 'Prueba de entrega', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 360, h: 470, relleno: '#ffffff', radio: 16, borde: LINEA }),
        t('Prueba de entrega', 20, 20, { tam: 18, peso: 700, color: TINTA }),
        t('Foto del paquete', 20, 60, { tam: 13, peso: 600, color: GRIS }),
        f('imagen', { nombre: 'Foto', x: 20, y: 84, w: 320, h: 140, radio: 10 }),
        t('Firma del destinatario', 20, 240, { tam: 13, peso: 600, color: GRIS }),
        f('rect', { nombre: 'Área de firma', x: 20, y: 264, w: 320, h: 100, relleno: ROJO_FONDO, radio: 10, borde: ROJO_CLARO, estiloBorde: 'dashed' }),
        f('icono', { icono: 'firma', x: 140, y: 290, w: 80, h: 50, color: ROJO_OSC, grosorBorde: 1.5 }),
        ...boton('Confirmar entrega', ROJO, '#ffffff', null, 20, 390, 320, 52),
      ] },
      { nombre: 'Tarjeta de vehículo', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 300, h: 180, relleno: '#ffffff', radio: 14, borde: LINEA }),
        f('rect', { nombre: 'Ícono fondo', x: 20, y: 20, w: 52, h: 52, relleno: ROJO, radio: 12 }),
        f('icono', { icono: 'camion', x: 32, y: 32, w: 28, h: 28, color: '#ffffff' }),
        t('Furgón NHR · ABC-123', 86, 22, { tam: 15, peso: 700, color: TINTA }),
        t('Capacidad 2,5 t', 86, 46, { tam: 13, color: GRIS }),
        t('Carga', 20, 96, { tam: 13, color: GRIS }), t('68 %', 248, 96, { tam: 13, peso: 700, color: TINTA }),
        f('rect', { nombre: 'Riel', x: 20, y: 120, w: 260, h: 8, relleno: ROJO_SUAVE, radio: 4 }),
        f('rect', { nombre: 'Avance', x: 20, y: 120, w: 177, h: 8, relleno: ROJO, radio: 4 }),
        ...insignia('Disponible', VERDE_SUAVE, VERDE, 20, 142),
      ] },
      { nombre: 'Franja de entrega (cliente)', crear: () => [
        t('Elige cuándo recibir', 0, 0, { tam: 16, peso: 700, color: TINTA }),
        ...['8:00 – 12:00', '12:00 – 16:00', '16:00 – 20:00'].flatMap((x, i) => [
          f('rect', { nombre: 'Franja', x: i * 128, y: 34, w: 118, h: 64, relleno: i === 1 ? ROJO : '#ffffff', borde: i === 1 ? null : ROJO_CLARO, radio: 10 }),
          t(['Mañana', 'Tarde', 'Noche'][i], i * 128, 44, { w: 118, autoAncho: false, alinear: 'center', tam: 13, peso: 600, color: i === 1 ? '#ffffff' : GRIS }),
          t(x, i * 128, 66, { w: 118, autoAncho: false, alinear: 'center', tam: 14, peso: 700, color: i === 1 ? '#ffffff' : TINTA }),
        ]),
      ] },
    ],
  },
  {
    nombre: 'Puertos y contenedores', items: [
      { nombre: 'Tarjeta de buque', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 420, h: 200, relleno: '#ffffff', radio: 14, borde: LINEA }),
        f('rect', { nombre: 'Franja', x: 0, y: 0, w: 420, h: 64, relleno: ROJO_OSC, radio: 14 }),
        f('rect', { nombre: 'Franja', x: 0, y: 40, w: 420, h: 24, relleno: ROJO_OSC }),
        f('icono', { icono: 'barco', x: 20, y: 18, w: 28, h: 28, color: '#ffffff' }),
        t('MSC Aurora · V. 042E', 60, 20, { tam: 17, peso: 700, color: '#ffffff' }),
        ...[['ETA', '23 oct · 06:00'], ['ETD', '24 oct · 18:00'], ['Muelle', 'Berth 3']].flatMap(([a, b], i) => [
          t(a, 20 + i * 136, 84, { tam: 12, peso: 700, color: GRIS, espaciado: .5 }),
          t(b, 20 + i * 136, 104, { tam: 15, peso: 600, color: TINTA }),
        ]),
        t('Contenedores: 1.240 descarga · 980 cargue', 20, 152, { tam: 13, color: GRIS }),
        ...insignia('Fondeado', ROJO_SUAVE, ROJO, 316, 148),
      ] },
      { nombre: 'Contenedor', crear: () => [
        f('rect', { nombre: 'Contenedor', x: 0, y: 0, w: 320, h: 130, relleno: ROJO, radio: 6 }),
        ...Array.from({ length: 11 }, (_, i) => f('rect', { nombre: 'Corrugado', x: 16 + i * 27, y: 12, w: 4, h: 106, relleno: ROJO_OSC, opacidad: .45 })),
        f('rect', { nombre: 'Placa', x: 20, y: 18, w: 150, h: 46, relleno: '#ffffff', radio: 4 }),
        t('MSCU 458201-3', 30, 22, { tam: 15, peso: 800, color: TINTA }),
        t('40HC · 26.480 kg', 30, 42, { tam: 12, color: GRIS }),
      ] },
      { nombre: 'Movimientos de contenedores', crear: () => tabla(
        ['Contenedor', 'Tipo', 'Movimiento', 'Estado'],
        [['MSCU 458201-3', '40HC', 'Descargue', 'Patio'], ['MAEU 771240-0', '20DV', 'Cargue', 'Inspección'], ['HLXU 330918-6', '40RF', 'Descargue', 'Liberado'], ['CMAU 902114-2', '40HC', 'Cargue', 'En muelle']],
        [170, 90, 140, 140], 3) },
      { nombre: 'Ocupación de patio', crear: () => {
        const oc = [3, 5, 4, 2, 5, 1, 4, 3, 5, 5, 2, 0, 4, 3, 1, 5];
        const tono = n => [SUAVE, ROJO_FONDO, ROJO_SUAVE, ROJO_CLARO, ROJO_MED, ROJO][n];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 380, h: 320, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Patio de contenedores', 20, 18, { tam: 16, peso: 700, color: TINTA }),
          ...oc.flatMap((n, i) => [
            f('rect', { nombre: `Bloque ${String.fromCharCode(65 + (i >> 2))}${(i % 4) + 1}`, x: 20 + (i % 4) * 86, y: 56 + (i >> 2) * 52, w: 78, h: 44, relleno: tono(n), radio: 6 }),
            t(`${String.fromCharCode(65 + (i >> 2))}${(i % 4) + 1}`, 28 + (i % 4) * 86, 62 + (i >> 2) * 52, { tam: 12, peso: 700, color: n > 3 ? '#ffffff' : ROJO_OSC }),
          ]),
          t('Vacío', 20, 276, { tam: 12, color: GRIS }),
          ...[0, 1, 2, 3, 4, 5].map(n => f('rect', { nombre: 'Escala', x: 64 + n * 30, y: 278, w: 26, h: 12, relleno: tono(n), radio: 3 })),
          t('Lleno', 250, 276, { tam: 12, color: GRIS }),
        ];
      } },
      { nombre: 'Estado en aduana', crear: () => [
        t('Trámite de importación', 0, 0, { tam: 16, peso: 700, color: TINTA }),
        ...['Manifiesto', 'Declaración', 'Inspección', 'Levante', 'Retiro'].flatMap((p, i) => [
          f('rect', { nombre: p, x: i * 112, y: 34, w: 104, h: 36, relleno: i < 3 ? ROJO : i === 3 ? ROJO_SUAVE : SUAVE, radio: 18 }),
          t(p, i * 112, 42, { w: 104, autoAncho: false, alinear: 'center', tam: 13, peso: 600, color: i < 3 ? '#ffffff' : i === 3 ? ROJO : GRIS }),
        ]),
      ] },
    ],
  },
  {
    nombre: 'Citas y agendamiento', items: [
      { nombre: 'Calendario semanal de citas', crear: () => {
        const dias = ['Lun 20', 'Mar 21', 'Mié 22', 'Jue 23', 'Vie 24'], horas = ['06:00', '08:00', '10:00', '12:00', '14:00'];
        const citas = [[0, 0, 'ABC-123 · Descargue'], [1, 1, 'XYZ-987 · Cargue'], [1, 3, 'KLM-456 · Descargue'], [2, 2, 'JHG-221 · Cargue'], [3, 0, 'TRE-845 · Descargue'], [4, 1, 'POI-302 · Cargue'], [4, 3, 'WER-118 · Descargue']];
        return [
          f('rect', { nombre: 'Calendario', x: 0, y: 0, w: 680, h: 380, relleno: '#ffffff', radio: 14, borde: LINEA }),
          ...dias.map((d, i) => t(d, 90 + i * 116, 16, { tam: 13, peso: 700, color: i === 1 ? ROJO : TINTA })),
          ...horas.flatMap((hh, j) => [
            f('rect', { nombre: 'Guía', x: 72, y: 48 + j * 64, w: 592, h: 1, relleno: SUAVE }),
            t(hh, 16, 42 + j * 64, { tam: 12, color: GRIS }),
          ]),
          ...citas.flatMap(([d, hh, x], i) => [
            f('rect', { nombre: 'Cita', x: 80 + d * 116, y: 54 + hh * 64, w: 110, h: 52, relleno: i % 3 === 0 ? ROJO : i % 3 === 1 ? ROJO_SUAVE : ROJO_CLARO, radio: 8 }),
            t(x, 88 + d * 116, 60 + hh * 64, { w: 96, autoAncho: false, tam: 12, peso: 600, interlineado: 1.3, color: i % 3 === 0 ? '#ffffff' : ROJO_OSC }),
          ]),
        ];
      } },
      { nombre: 'Agendar cita (formulario)', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 420, h: 560, relleno: '#ffffff', radio: 16, sombra }),
        f('rect', { nombre: 'Encabezado', x: 0, y: 0, w: 420, h: 72, relleno: ROJO, radio: 16 }),
        f('rect', { nombre: 'Encabezado', x: 0, y: 50, w: 420, h: 22, relleno: ROJO }),
        f('icono', { icono: 'calendario', x: 24, y: 24, w: 24, h: 24, color: '#ffffff' }),
        t('Agendar cita de cargue', 58, 23, { tam: 19, peso: 700, color: '#ffffff' }),
        ...campo('Placa del vehículo', 'ABC-123', 24, 96, 176),
        ...campo('Tipo de operación', 'Descargue', 220, 96, 176),
        ...campo('Conductor', 'Nombre y cédula', 24, 180, 372),
        ...campo('Fecha', '22/10/2026', 24, 264, 176),
        ...campo('Muelle', 'Muelle 4', 220, 264, 176),
        t('Franja horaria', 24, 348, { tam: 14, peso: 500, color: TINTA }),
        ...['06:00', '08:00', '10:00', '14:00'].flatMap((x, i) => [
          f('rect', { nombre: 'Franja', x: 24 + i * 94, y: 372, w: 86, h: 40, relleno: i === 1 ? ROJO : i === 2 ? SUAVE : '#ffffff', borde: i === 1 || i === 2 ? null : ROJO_CLARO, radio: 8 }),
          t(x, 24 + i * 94, 382, { w: 86, autoAncho: false, alinear: 'center', tam: 14, peso: 600, color: i === 1 ? '#ffffff' : i === 2 ? '#a39a9c' : TINTA, decoracion: i === 2 ? 'line-through' : 'none' }),
        ]),
        ...boton('Confirmar cita', ROJO, '#ffffff', null, 24, 476, 372, 52),
      ] },
      { nombre: 'Tarjeta de cita', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 340, h: 130, relleno: '#ffffff', radio: 12, borde: LINEA }),
        f('rect', { nombre: 'Marca', x: 0, y: 0, w: 6, h: 130, relleno: ROJO, radio: 3 }),
        t('08:00 – 09:00', 24, 18, { tam: 18, peso: 800, color: TINTA }),
        ...insignia('Confirmada', VERDE_SUAVE, VERDE, 228, 18),
        t('ABC-123 · Descargue · Muelle 4', 24, 52, { tam: 14, color: TINTA }),
        t('Carlos Pérez · Transportes Andes', 24, 76, { tam: 13, color: GRIS }),
        t('Reprogramar', 24, 100, { tam: 13, peso: 700, color: ROJO }),
        t('Cancelar', 124, 100, { tam: 13, peso: 600, color: GRIS }),
      ] },
      { nombre: 'Estado de muelles', crear: () => [
        t('Muelles', 0, 0, { tam: 16, peso: 700, color: TINTA }),
        ...[['M1', 'Ocupado', 'ABC-123'], ['M2', 'Libre', ''], ['M3', 'Ocupado', 'XYZ-987'], ['M4', 'Reservado', '10:00'], ['M5', 'Libre', ''], ['M6', 'Mantenimiento', '']].flatMap(([m, e, d], i) => {
          const c = e === 'Ocupado' ? [ROJO, '#ffffff'] : e === 'Reservado' ? [ROJO_SUAVE, ROJO_OSC] : e === 'Libre' ? ['#ffffff', VERDE] : [SUAVE, GRIS];
          const x = (i % 3) * 140, y = 32 + Math.floor(i / 3) * 92;
          return [
            f('rect', { nombre: m, x, y, w: 130, h: 82, relleno: c[0], radio: 10, borde: e === 'Libre' ? VERDE : null }),
            t(m, x + 14, y + 10, { tam: 18, peso: 800, color: c[1] }),
            t(e, x + 14, y + 38, { tam: 12, peso: 600, color: c[1] }),
            t(d, x + 14, y + 56, { tam: 12, color: c[1] }),
          ];
        }),
      ] },
      { nombre: 'Turno en portería', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 280, h: 300, relleno: ROJO, radio: 18 }),
        t('Tu turno', 0, 28, { w: 280, autoAncho: false, alinear: 'center', tam: 15, color: ROJO_CLARO }),
        t('A-047', 0, 56, { w: 280, autoAncho: false, alinear: 'center', tam: 56, peso: 800, color: '#ffffff' }),
        t('Muelle 4 · 08:00', 0, 136, { w: 280, autoAncho: false, alinear: 'center', tam: 16, peso: 600, color: '#ffffff' }),
        f('rect', { nombre: 'Código QR', x: 90, y: 176, w: 100, h: 100, relleno: '#ffffff', radio: 8 }),
        f('icono', { icono: 'cuadricula', x: 104, y: 190, w: 72, h: 72, color: TINTA }),
      ] },
    ],
  },
  {
    nombre: 'ITR (inspección)', items: [
      { nombre: 'Lista de inspección', crear: () => {
        const pts = [['Sellos intactos', 1], ['Puertas y bisagras', 1], ['Piso y paredes', 2], ['Techo sin perforaciones', 1], ['Olores / humedad', 0], ['Placas y números', 0]];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 420, h: 80 + pts.length * 52, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Inspección técnica de recibo', 20, 20, { tam: 17, peso: 700, color: TINTA }),
          t('4 de 6 puntos revisados', 20, 46, { tam: 13, color: GRIS }),
          ...pts.flatMap(([p, e], i) => [
            f('rect', { nombre: 'Separador', x: 20, y: 78 + i * 52, w: 380, h: 1, relleno: SUAVE }),
            t(p, 20, 94 + i * 52, { tam: 15, color: TINTA }),
            ...(e ? insignia(e === 1 ? 'Conforme' : 'Con daño', e === 1 ? VERDE_SUAVE : ROJO_SUAVE, e === 1 ? VERDE : ROJO, 300, 92 + i * 52)
              : insignia('Pendiente', SUAVE, GRIS, 300, 92 + i * 52)),
          ]),
        ];
      } },
      { nombre: 'Formulario ITR', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 460, h: 520, relleno: '#ffffff', radio: 16, borde: LINEA }),
        f('icono', { icono: 'escaner', x: 24, y: 24, w: 24, h: 24, color: ROJO }),
        t('Registro ITR', 58, 22, { tam: 20, peso: 700, color: TINTA }),
        ...campo('Placa', 'ABC-123', 24, 72, 196),
        ...campo('Contenedor', 'MSCU 458201-3', 240, 72, 196),
        ...campo('Sello', 'SL-0098812', 24, 156, 196),
        ...campo('Remolque', 'R-55410', 240, 156, 196),
        t('Daños encontrados', 24, 240, { tam: 14, peso: 500, color: TINTA }),
        f('rect', { nombre: 'Área', x: 24, y: 264, w: 412, h: 100, relleno: '#ffffff', borde: LINEA, radio: 8 }),
        t('Describe golpes, abolladuras o faltantes…', 38, 276, { tam: 14, color: '#a39a9c' }),
        f('rect', { nombre: 'Casilla', x: 24, y: 384, w: 20, h: 20, relleno: ROJO, radio: 5 }),
        f('icono', { icono: 'check', x: 27, y: 387, w: 14, h: 14, color: '#ffffff', grosorBorde: 3 }),
        t('El conductor estuvo presente en la inspección', 54, 383, { tam: 14, color: TINTA }),
        ...boton('Guardar borrador', '#ffffff', ROJO, ROJO, 24, 440, 196, 48),
        ...boton('Firmar y enviar', ROJO, '#ffffff', null, 240, 440, 196, 48),
      ] },
      { nombre: 'Fotos de inspección', crear: () => [
        t('Evidencias fotográficas', 0, 0, { tam: 16, peso: 700, color: TINTA }),
        ...['Frontal', 'Lateral izq.', 'Puertas', 'Sello'].flatMap((x, i) => [
          f('imagen', { nombre: x, x: i * 132, y: 32, w: 122, h: 92, radio: 8 }),
          t(x, i * 132, 132, { tam: 12, color: GRIS }),
        ]),
        f('rect', { nombre: 'Agregar foto', x: 528, y: 32, w: 92, h: 92, relleno: ROJO_FONDO, radio: 8, borde: ROJO_CLARO, estiloBorde: 'dashed', grosorBorde: 2 }),
        f('icono', { icono: 'mas', x: 560, y: 64, w: 28, h: 28, color: ROJO }),
      ] },
      { nombre: 'Esquema de daños', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 420, h: 220, relleno: '#ffffff', radio: 14, borde: LINEA }),
        t('Marca los daños en el contenedor', 20, 18, { tam: 15, peso: 700, color: TINTA }),
        f('rect', { nombre: 'Contenedor', x: 40, y: 64, w: 340, h: 110, relleno: SUAVE, radio: 4, borde: GRIS, grosorBorde: 2 }),
        ...[[110, 90], [290, 130]].flatMap(([x, y], i) => [
          f('elipse', { nombre: `Daño ${i + 1}`, x, y, w: 28, h: 28, relleno: ROJO, opacidad: .9 }),
          t(String(i + 1), x + 10, y + 4, { tam: 14, peso: 800, color: '#ffffff' }),
        ]),
        t('1. Abolladura lateral   2. Rayón en puerta', 20, 188, { tam: 13, color: GRIS }),
      ] },
    ],
  },
  {
    nombre: 'Documentación', items: [
      { nombre: 'Documentos del envío', crear: () => {
        const ds = [['Guía de remisión', 'PDF · 120 KB', 'Firmado'], ['Factura comercial', 'PDF · 340 KB', 'Aprobado'], ['Bill of Lading (BL)', 'PDF · 210 KB', 'Pendiente'], ['Lista de empaque', 'XLSX · 48 KB', 'Aprobado'], ['Certificado de origen', 'PDF · 95 KB', 'Rechazado']];
        const col = e => e === 'Pendiente' ? [AMBAR_SUAVE, AMBAR] : e === 'Rechazado' ? [ROJO_SUAVE, ROJO] : [VERDE_SUAVE, VERDE];
        return [
          f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 520, h: 76 + ds.length * 64, relleno: '#ffffff', radio: 14, borde: LINEA }),
          t('Documentos', 20, 20, { tam: 17, peso: 700, color: TINTA }),
          t('+ Adjuntar', 420, 22, { tam: 14, peso: 700, color: ROJO }),
          ...ds.flatMap(([a, b, e], i) => [
            f('rect', { nombre: 'Separador', x: 0, y: 64 + i * 64, w: 520, h: 1, relleno: SUAVE }),
            f('rect', { nombre: 'Ícono fondo', x: 20, y: 76 + i * 64, w: 40, h: 40, relleno: ROJO_SUAVE, radio: 10 }),
            f('icono', { icono: 'archivo', x: 30, y: 86 + i * 64, w: 20, h: 20, color: ROJO }),
            t(a, 74, 76 + i * 64, { tam: 15, peso: 600, color: TINTA }),
            t(b, 74, 98 + i * 64, { tam: 12, color: GRIS }),
            ...insignia(e, ...col(e), 360, 84 + i * 64),
            f('icono', { icono: 'descargar', x: 476, y: 86 + i * 64, w: 20, h: 20, color: GRIS }),
          ]),
        ];
      } },
      { nombre: 'Tarjeta de documento', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 200, h: 240, relleno: '#ffffff', radio: 12, borde: LINEA }),
        f('rect', { nombre: 'Vista previa', x: 12, y: 12, w: 176, h: 140, relleno: ROJO_FONDO, radio: 8 }),
        ...[0, 1, 2, 3, 4].map(i => f('rect', { nombre: 'Renglón', x: 36, y: 40 + i * 18, w: i === 4 ? 70 : 128, h: 6, relleno: ROJO_CLARO, radio: 3 })),
        f('rect', { nombre: 'Tipo', x: 140, y: 20, w: 40, h: 20, relleno: ROJO, radio: 4 }),
        t('PDF', 148, 22, { tam: 11, peso: 800, color: '#ffffff' }),
        t('BL-2026-00981', 12, 166, { tam: 15, peso: 700, color: TINTA }),
        t('Bill of Lading · 21 oct', 12, 190, { tam: 12, color: GRIS }),
        t('Ver documento →', 12, 212, { tam: 13, peso: 700, color: ROJO }),
      ] },
      { nombre: 'Zona para subir archivos', crear: () => [
        f('rect', { nombre: 'Zona', x: 0, y: 0, w: 480, h: 200, relleno: ROJO_FONDO, radio: 14, borde: ROJO_MED, estiloBorde: 'dashed', grosorBorde: 2 }),
        f('elipse', { nombre: 'Ícono fondo', x: 212, y: 30, w: 56, h: 56, relleno: ROJO_SUAVE }),
        f('icono', { icono: 'subir', x: 226, y: 44, w: 28, h: 28, color: ROJO }),
        t('Arrastra aquí la guía, factura o BL', 0, 102, { w: 480, autoAncho: false, alinear: 'center', tam: 16, peso: 600, color: TINTA }),
        t('o haz clic para buscar · PDF, JPG o XLSX hasta 10 MB', 0, 130, { w: 480, autoAncho: false, alinear: 'center', tam: 13, color: GRIS }),
      ] },
      { nombre: 'Página de documentación', crear: () => [
        f('rect', { nombre: 'Índice', x: 0, y: 0, w: 260, h: 720, relleno: ROJO_FONDO, borde: ROJO_SUAVE }),
        t('Documentación', 24, 24, { tam: 18, peso: 800, color: ROJO_OSC }),
        ...['Introducción', 'Crear un envío', 'Generar guías', 'Agendar citas', 'Inspección ITR', 'Integración API', 'Preguntas frecuentes'].flatMap((x, i) => [
          ...(i === 1 ? [f('rect', { nombre: 'Activo', x: 12, y: 70 + i * 40, w: 236, h: 34, relleno: ROJO_SUAVE, radio: 8 })] : []),
          t(x, 28, 77 + i * 40, { tam: 14, peso: i === 1 ? 700 : 500, color: i === 1 ? ROJO : TINTA }),
        ]),
        t('Inicio  /  Envíos  /  Crear un envío', 300, 28, { tam: 13, color: GRIS }),
        t('Crear un envío', 300, 60, { tam: 32, peso: 800, color: TINTA }),
        t('Registra los datos del remitente, el destinatario y los bultos. El sistema genera la guía y la asigna a la ruta más cercana.', 300, 112, { w: 620, autoAncho: false, tam: 16, color: GRIS, interlineado: 1.6 }),
        t('1. Datos del remitente', 300, 200, { tam: 20, peso: 700, color: TINTA }),
        t('Ingresa NIT, dirección de recogida y franja disponible.', 300, 236, { tam: 15, color: GRIS }),
        f('rect', { nombre: 'Nota', x: 300, y: 280, w: 620, h: 72, relleno: ROJO_FONDO, radio: 10, borde: ROJO_CLARO }),
        f('rect', { nombre: 'Marca', x: 300, y: 280, w: 4, h: 72, relleno: ROJO }),
        t('Importante: las guías creadas después de las 4:00 p. m. salen al día siguiente.', 322, 304, { tam: 14, color: ROJO_OSC }),
        f('rect', { nombre: 'Código', x: 300, y: 380, w: 620, h: 130, relleno: TINTA, radio: 10 }),
        t('POST /api/envios\n{\n  "destino": "Bogotá",\n  "bultos": 3\n}', 320, 396, { w: 580, autoAncho: false, tam: 13, fuente: 'JetBrains Mono', color: ROJO_CLARO, interlineado: 1.5 }),
      ] },
      { nombre: 'Guía de remisión', crear: () => [
        f('rect', { nombre: 'Guía', x: 0, y: 0, w: 420, h: 300, relleno: '#ffffff', radio: 8, borde: TINTA, grosorBorde: 2 }),
        f('rect', { nombre: 'Encabezado', x: 0, y: 0, w: 420, h: 56, relleno: ROJO, radio: 8 }),
        t('GUÍA DE REMISIÓN', 20, 16, { tam: 17, peso: 800, color: '#ffffff', espaciado: 1 }),
        t('N.º 458201', 310, 18, { tam: 15, peso: 700, color: '#ffffff' }),
        ...[['Remitente', 'CEDI Medellín'], ['Destinatario', 'Comercial Andina'], ['Ciudad', 'Bogotá D.C.'], ['Bultos / peso', '3 · 18,5 kg']].flatMap(([a, b], i) => [
          t(a, 20 + (i % 2) * 200, 72 + (i >> 1) * 56, { tam: 11, peso: 700, color: GRIS, mayus: 'uppercase' }),
          t(b, 20 + (i % 2) * 200, 90 + (i >> 1) * 56, { tam: 15, peso: 600, color: TINTA }),
        ]),
        f('icono', { icono: 'codigo', x: 20, y: 194, w: 260, h: 70, color: TINTA, grosorBorde: 2.5 }),
        t('*458201*', 110, 268, { tam: 12, fuente: 'JetBrains Mono', color: TINTA }),
        f('rect', { nombre: 'QR', x: 310, y: 190, w: 90, h: 90, relleno: SUAVE, radio: 4 }),
        f('icono', { icono: 'cuadricula', x: 322, y: 202, w: 66, h: 66, color: TINTA }),
      ] },
    ],
  },
];

function boton(texto, fondo, color, borde = null, x = 0, y = 0, w = 140, h = 48) {
  return [
    f('rect', { nombre: 'Botón', x, y, w, h, relleno: fondo, borde, radio: 10 }),
    f('texto', { nombre: texto, texto, x, y, w, h, autoAncho: false, autoAlto: false, alinear: 'center', alinearV: 'middle', tam: 15, peso: 600, color }),
  ];
}
function campo(etiqueta, ejemplo, x = 0, y = 0, w = 320) {
  return [
    t(etiqueta, x, y, { tam: 14, peso: 500, color: TINTA }),
    f('rect', { nombre: 'Campo', x, y: y + 24, w, h: 44, relleno: '#ffffff', borde: LINEA, radio: 8 }),
    t(ejemplo, x + 14, y + 35, { tam: 15, color: '#a39a9c' }),
  ];
}

function insignia(texto, fondo, color, x = 0, y = 0) {
  const w = Math.round(texto.length * 7.4 + 24);
  return [
    f('rect', { nombre: 'Insignia', x, y, w, h: 24, relleno: fondo, radio: 12 }),
    f('texto', { nombre: texto, texto, x, y, w, h: 24, autoAncho: false, autoAlto: false, alinear: 'center', alinearV: 'middle', tam: 12, peso: 600, color }),
  ];
}
function kpi(titulo, valor, cambio, icono, x = 0, y = 0, w = 280) {
  const baja = cambio.startsWith('▼');
  return [
    f('rect', { nombre: 'Tarjeta KPI', x, y, w, h: 136, relleno: '#ffffff', radio: 14, borde: LINEA }),
    f('rect', { nombre: 'Ícono fondo', x: x + w - 60, y: y + 20, w: 40, h: 40, relleno: ROJO_SUAVE, radio: 10 }),
    f('icono', { icono, x: x + w - 50, y: y + 30, w: 20, h: 20, color: ROJO }),
    t(titulo, x + 20, y + 20, { tam: 14, peso: 500, color: GRIS }),
    t(valor, x + 20, y + 46, { tam: 34, peso: 800, color: TINTA }),
    t(cambio, x + 20, y + 100, { tam: 13, peso: 600, color: baja ? ROJO : VERDE }),
  ];
}
// Tabla con la última columna como insignia de estado
function tabla(cabeza, filas, anchos, colEstado = -1) {
  const w = anchos.reduce((a, b) => a + b, 0) + 40, h = 48 * (filas.length + 1);
  const xs = anchos.map((_, i) => 20 + anchos.slice(0, i).reduce((a, b) => a + b, 0));
  const tono = e => /entreg|liber|aprob/i.test(e) ? [VERDE_SUAVE, VERDE] : /noved|rechaz|inspec/i.test(e) ? [ROJO_SUAVE, ROJO] : /ruta|muelle/i.test(e) ? [ROJO, '#ffffff'] : [SUAVE, GRIS];
  return [
    f('rect', { nombre: 'Tabla', x: 0, y: 0, w, h, relleno: '#ffffff', radio: 10, borde: LINEA }),
    f('rect', { nombre: 'Encabezado', x: 0, y: 0, w, h: 48, relleno: ROJO_OSC, radio: 10 }),
    f('rect', { nombre: 'Encabezado', x: 0, y: 30, w, h: 18, relleno: ROJO_OSC }),
    ...cabeza.map((c, j) => t(c, xs[j], 15, { tam: 13, peso: 700, color: '#ffffff' })),
    ...filas.flatMap((fila, i) => [
      ...(i ? [f('rect', { nombre: 'Separador', x: 0, y: 48 + i * 48, w, h: 1, relleno: LINEA })] : []),
      ...fila.flatMap((c, j) => j === colEstado ? insignia(c, ...tono(c), xs[j], 60 + i * 48) : [t(c, xs[j], 62 + i * 48, { tam: 14, peso: j ? 400 : 600, color: TINTA })]),
    ]),
  ];
}
const MENU = [['panel', 'Panel'], ['paquete', 'Envíos'], ['ruta', 'Rutas'], ['camion', 'Flota'], ['calendario', 'Citas'], ['barco', 'Puertos'], ['escaner', 'Inspección ITR'], ['archivo', 'Documentos'], ['grafica', 'Reportes'], ['ajustes', 'Configuración']];
function lateral(claro) {
  const fondo = claro ? '#ffffff' : ROJO_OSC, texto = claro ? TINTA : '#ffffff', tenue = claro ? GRIS : ROJO_CLARO;
  return [
    f('rect', { nombre: 'Barra lateral', x: 0, y: 0, w: 260, h: 900, relleno: fondo, borde: claro ? LINEA : null }),
    f('rect', { nombre: 'Logo', x: 20, y: 22, w: 36, h: 36, relleno: claro ? ROJO : '#ffffff', radio: 10 }),
    f('icono', { icono: 'camion', x: 28, y: 30, w: 20, h: 20, color: claro ? '#ffffff' : ROJO }),
    t('LogiRed', 66, 27, { tam: 19, peso: 800, color: texto }),
    t('OPERACIÓN', 24, 84, { tam: 11, peso: 700, espaciado: 1, color: tenue }),
    ...MENU.flatMap(([ic, n], i) => {
      const y = 108 + i * 44 + (i >= 8 ? 32 : 0), activo = i === 1;
      return [
        ...(i === 8 ? [t('ANÁLISIS', 24, y - 28, { tam: 11, peso: 700, espaciado: 1, color: tenue })] : []),
        ...(activo ? [f('rect', { nombre: 'Activo', x: 12, y: y - 8, w: 236, h: 40, relleno: claro ? ROJO_SUAVE : ROJO, radio: 10 })] : []),
        f('icono', { icono: ic, x: 26, y, w: 22, h: 22, color: activo ? (claro ? ROJO : '#ffffff') : tenue }),
        t(n, 60, y + 1, { tam: 15, peso: activo ? 700 : 500, color: activo ? (claro ? ROJO : '#ffffff') : texto }),
        ...(n === 'Citas' ? insignia('18', claro ? ROJO : '#ffffff', claro ? '#ffffff' : ROJO, 204, y - 1) : []),
      ];
    }),
    f('rect', { nombre: 'Separador', x: 20, y: 820, w: 220, h: 1, relleno: claro ? LINEA : ROJO }),
    f('elipse', { nombre: 'Usuario', x: 20, y: 838, w: 40, h: 40, relleno: claro ? ROJO_SUAVE : ROJO_MED }),
    t('DM', 30, 848, { tam: 14, peso: 700, color: claro ? ROJO : '#ffffff' }),
    t('Daniel M.', 70, 838, { tam: 14, peso: 700, color: texto }),
    t('Coordinador', 70, 858, { tam: 12, color: tenue }),
    f('icono', { icono: 'salir', x: 218, y: 848, w: 20, h: 20, color: tenue }),
  ];
}

// Plantillas para empezar un archivo nuevo
export const PLANTILLAS = [
  { nombre: 'En blanco', clase: 'blanco', crear: () => [] },
  { nombre: 'Página de inicio', clase: 'inicio', crear: () => {
    const marco = f('marco', { nombre: 'Inicio · Escritorio', w: 1440, h: 1900 });
    const partes = [
      [buscar('Barra de navegación'), 0, 0], [buscar('Sección principal (hero)'), 0, 72],
      [buscar('Lista de características'), 120, 760], [buscar('Tarjeta'), 120, 1000], [buscar('Tarjeta'), 560, 1000], [buscar('Tarjeta'), 1000, 1000],
      [buscar('Pie de página'), 0, 1660],
    ];
    return [marco, ...partes.flatMap(([c, x, y]) => colocar(c.crear(), marco.x + x, marco.y + y, marco.id))];
  } },
  { nombre: 'Ingreso móvil', clase: 'movil', crear: () => {
    const marco = f('marco', { nombre: 'Ingreso · Celular', w: 390, h: 844, relleno: SUAVE });
    return [marco, ...colocar(buscar('Barra móvil').crear(), 0, 0, marco.id), ...colocar(buscar('Formulario de ingreso').crear().map(o => {
      // El formulario se ajusta al ancho del celular
      const k = 350 / 400; o.x *= k; o.w *= k; return o;
    }), 20, 160, marco.id)];
  } },
  { nombre: 'Tablero logístico', clase: 'tablero', crear: () => {
    const marco = f('marco', { nombre: 'Tablero · Operación', w: 1440, h: 900, relleno: ROJO_FONDO });
    const partes = [
      ['Barra lateral oscura', 0, 0], ['Fila de KPI logísticos', 300, 104], ['Gráfica de barras', 300, 272],
      ['Indicador circular', 812, 272], ['Ranking de transportadoras', 1052, 272], ['Tabla de envíos', 300, 588], ['Estado de muelles', 1000, 588],
    ];
    return [marco,
      ...colocar([t('Panel de operación', 0, 0, { tam: 28, peso: 800, color: TINTA }), t('Martes 21 de octubre · Turno mañana', 0, 40, { tam: 14, color: GRIS })], marco.x + 300, marco.y + 28, marco.id),
      ...colocar(buscar('Buscador').crear(), marco.x + 1080, marco.y + 32, marco.id),
      ...partes.flatMap(([n, x, y]) => colocar(buscar(n).crear(), marco.x + x, marco.y + y, marco.id))];
  } },
  { nombre: 'Seguimiento de envío', clase: 'seguimiento', crear: () => {
    const marco = f('marco', { nombre: 'Seguimiento · Celular', w: 390, h: 1100, relleno: ROJO_FONDO });
    const encabezado = [
      f('rect', { nombre: 'Encabezado', x: 0, y: 0, w: 390, h: 150, relleno: ROJO }),
      f('icono', { icono: 'izquierda', x: 18, y: 22, w: 24, h: 24, color: '#ffffff' }),
      t('Mi envío', 160, 22, { tam: 18, peso: 700, color: '#ffffff' }),
      t('GU-458201', 20, 72, { tam: 26, peso: 800, color: '#ffffff' }),
      t('Llega hoy entre 2:00 y 4:00 p. m.', 20, 108, { tam: 14, color: ROJO_CLARO }),
    ];
    const ajustar = (lista, ancho, k = 350 / ancho) => lista.map(o => { o.x *= k; o.w *= k; return o; });
    return [marco, ...colocar(encabezado, 0, 0, marco.id),
      ...colocar(ajustar(buscar('Mapa de ruta').crear(), 520), 20, 170, marco.id),
      ...colocar(buscar('Tarjeta del conductor').crear().map(o => ({ ...o, x: o.x * 350 / 360, w: o.w * 350 / 360 })), 20, 510, marco.id),
      ...colocar(ajustar(buscar('Historial del envío').crear(), 400), 20, 680, marco.id)];
  } },
  { nombre: 'Agendamiento de citas', clase: 'citas', crear: () => {
    const marco = f('marco', { nombre: 'Citas · Escritorio', w: 1440, h: 900, relleno: '#ffffff' });
    const partes = [['Barra lateral completa', 0, 0], ['Calendario semanal de citas', 300, 120], ['Agendar cita (formulario)', 1000, 120], ['Tarjeta de cita', 300, 530], ['Tarjeta de cita', 660, 530]];
    return [marco,
      ...colocar([t('Citas de cargue y descargue', 0, 0, { tam: 28, peso: 800, color: TINTA }), t('CEDI Funza · Semana 43', 0, 40, { tam: 14, color: GRIS })], marco.x + 300, marco.y + 32, marco.id),
      ...partes.flatMap(([n, x, y]) => colocar(buscar(n).crear(), marco.x + x, marco.y + y, marco.id))];
  } },
];
function buscar(nombre) { for (const c of CATEGORIAS) for (const it of c.items) if (it.nombre === nombre) return it; }

// Mueve un conjunto de figuras a (x, y), las mete en el marco y las agrupa si son varias
export function colocar(figuras, x, y, padre = null, grupo = undefined) {
  const g = grupo !== undefined ? grupo : figuras.length > 1 ? crypto.randomUUID().slice(0, 12) : null;
  return figuras.map(o => ({ ...o, x: o.x + x, y: o.y + y, padre: o.tipo === 'marco' ? null : padre, grupo: o.tipo === 'marco' ? null : g }));
}
