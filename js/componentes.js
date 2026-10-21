// Biblioteca de componentes de páginas web: cada uno es un grupo de figuras listo para soltar en un marco.
// Las posiciones son relativas a la esquina del componente; al insertarlo se mueven a donde se suelta.
import { figuraNueva as f, TAMANOS_MARCO } from './figuras.js';

const AZUL = '#2563eb', TINTA = '#111827', GRIS = '#6b7280', LINEA = '#d1d5db', SUAVE = '#f3f4f6';
const sombra = { x: 0, y: 4, b: 16, c: 'rgba(17,24,39,.12)' };
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
      { nombre: 'Etiqueta', crear: () => [t('ETIQUETA', 0, 0, { tam: 12, peso: 700, espaciado: 1.5, color: AZUL })] },
      { nombre: 'Enlace', crear: () => [t('Ver más →', 0, 0, { tam: 16, peso: 600, color: AZUL, decoracion: 'underline' })] },
    ],
  },
  {
    nombre: 'Botones y formularios', items: [
      { nombre: 'Botón principal', crear: () => boton('Comenzar', AZUL, '#ffffff') },
      { nombre: 'Botón secundario', crear: () => boton('Saber más', '#ffffff', TINTA, LINEA) },
      { nombre: 'Botón de texto', crear: () => [t('Cancelar', 0, 0, { tam: 15, peso: 600, color: AZUL })] },
      { nombre: 'Campo de texto', crear: () => campo('Correo electrónico', 'nombre@empresa.com') },
      { nombre: 'Área de texto', crear: () => [
        t('Mensaje', 0, 0, { tam: 14, peso: 500, color: TINTA }),
        f('rect', { nombre: 'Área', x: 0, y: 24, w: 320, h: 120, relleno: '#ffffff', borde: LINEA, radio: 8 }),
        t('Escribe tu mensaje…', 14, 36, { tam: 15, color: '#9ca3af' }),
      ] },
      { nombre: 'Lista desplegable', crear: () => [
        t('País', 0, 0, { tam: 14, peso: 500, color: TINTA }),
        f('rect', { nombre: 'Lista', x: 0, y: 24, w: 320, h: 44, relleno: '#ffffff', borde: LINEA, radio: 8 }),
        t('Colombia', 14, 35, { tam: 15, color: TINTA }),
        f('icono', { icono: 'abajo', x: 288, y: 36, w: 20, h: 20, color: GRIS }),
      ] },
      { nombre: 'Casilla', crear: () => [
        f('rect', { nombre: 'Casilla', x: 0, y: 1, w: 20, h: 20, relleno: AZUL, radio: 5 }),
        f('icono', { icono: 'check', x: 3, y: 4, w: 14, h: 14, color: '#ffffff', grosorBorde: 3 }),
        t('Recordarme', 30, 0, { tam: 15, color: TINTA }),
      ] },
      { nombre: 'Opción (radio)', crear: () => [
        f('elipse', { nombre: 'Radio', x: 0, y: 1, w: 20, h: 20, relleno: '#ffffff', borde: AZUL, grosorBorde: 2 }),
        f('elipse', { nombre: 'Punto', x: 5, y: 6, w: 10, h: 10, relleno: AZUL }),
        t('Opción', 30, 0, { tam: 15, color: TINTA }),
      ] },
      { nombre: 'Interruptor', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 44, h: 24, relleno: AZUL, radio: 12 }),
        f('elipse', { nombre: 'Perilla', x: 22, y: 2, w: 20, h: 20, relleno: '#ffffff' }),
      ] },
      { nombre: 'Deslizador', crear: () => [
        f('rect', { nombre: 'Riel', x: 0, y: 8, w: 240, h: 6, relleno: '#e5e7eb', radio: 3 }),
        f('rect', { nombre: 'Avance', x: 0, y: 8, w: 140, h: 6, relleno: AZUL, radio: 3 }),
        f('elipse', { nombre: 'Perilla', x: 130, y: 1, w: 20, h: 20, relleno: '#ffffff', borde: AZUL, grosorBorde: 2 }),
      ] },
      { nombre: 'Buscador', crear: () => [
        f('rect', { nombre: 'Buscador', x: 0, y: 0, w: 320, h: 44, relleno: SUAVE, radio: 22 }),
        f('icono', { icono: 'buscar', x: 16, y: 12, w: 20, h: 20, color: GRIS }),
        t('Buscar…', 46, 11, { tam: 15, color: '#9ca3af' }),
      ] },
      { nombre: 'Formulario de ingreso', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 400, h: 420, relleno: '#ffffff', radio: 16, sombra }),
        t('Iniciar sesión', 32, 32, { tam: 26, peso: 700, color: TINTA }),
        t('Bienvenido de nuevo', 32, 72, { tam: 15, color: GRIS }),
        ...campo('Correo', 'nombre@empresa.com', 32, 116, 336),
        ...campo('Contraseña', '••••••••', 32, 202, 336),
        ...boton('Entrar', AZUL, '#ffffff', null, 32, 300, 336),
        t('¿Olvidaste tu contraseña?', 115, 368, { tam: 14, color: AZUL }),
      ] },
    ],
  },
  {
    nombre: 'Navegación', items: [
      { nombre: 'Barra de navegación', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 1440, h: 72, relleno: '#ffffff', borde: '#e5e7eb' }),
        f('rect', { nombre: 'Logo', x: 80, y: 22, w: 28, h: 28, relleno: AZUL, radio: 8 }),
        t('Marca', 118, 23, { tam: 20, peso: 700, color: TINTA }),
        t('Inicio', 560, 25, { tam: 15, peso: 500, color: TINTA }),
        t('Productos', 640, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Precios', 750, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Contacto', 845, 25, { tam: 15, peso: 500, color: GRIS }),
        t('Ingresar', 1150, 25, { tam: 15, peso: 600, color: TINTA }),
        ...boton('Registrarse', AZUL, '#ffffff', null, 1240, 14, 120, 44),
      ] },
      { nombre: 'Barra móvil', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 390, h: 60, relleno: '#ffffff', borde: '#e5e7eb' }),
        f('icono', { icono: 'menu', x: 18, y: 18, w: 24, h: 24, color: TINTA }),
        t('Marca', 166, 17, { tam: 19, peso: 700, color: TINTA }),
        f('icono', { icono: 'carrito', x: 348, y: 18, w: 24, h: 24, color: TINTA }),
      ] },
      { nombre: 'Pestañas', crear: () => [
        t('General', 0, 0, { tam: 15, peso: 600, color: AZUL }),
        f('rect', { nombre: 'Indicador', x: 0, y: 30, w: 58, h: 3, relleno: AZUL, radio: 2 }),
        t('Detalles', 90, 0, { tam: 15, peso: 500, color: GRIS }),
        t('Opiniones', 186, 0, { tam: 15, peso: 500, color: GRIS }),
        f('rect', { nombre: 'Línea', x: 0, y: 32, w: 300, h: 1, relleno: '#e5e7eb' }),
      ] },
      { nombre: 'Ruta (migas)', crear: () => [
        t('Inicio  /  Productos  /  Detalle', 0, 0, { tam: 14, color: GRIS }),
      ] },
      { nombre: 'Paginación', crear: () => [1, 2, 3, 4].flatMap((n, i) => [
        f('rect', { nombre: `Página ${n}`, x: i * 44, y: 0, w: 36, h: 36, relleno: n === 1 ? AZUL : '#ffffff', borde: n === 1 ? null : LINEA, radio: 8 }),
        t(String(n), i * 44 + 14, 8, { tam: 15, peso: 600, color: n === 1 ? '#ffffff' : TINTA }),
      ]) },
      { nombre: 'Barra inferior móvil', crear: () => [
        f('rect', { nombre: 'Barra', x: 0, y: 0, w: 390, h: 72, relleno: '#ffffff', borde: '#e5e7eb' }),
        ...['inicio', 'buscar', 'corazon', 'usuario'].map((ic, i) => f('icono', { icono: ic, x: 41 + i * 92, y: 24, w: 24, h: 24, color: i ? GRIS : AZUL })),
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
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 1440, h: 560, relleno: '#eff6ff' }),
        t('Diseña páginas más rápido', 80, 150, { tam: 56, peso: 800, color: TINTA, interlineado: 1.1, w: 600, autoAncho: false }),
        t('Explica en una o dos líneas qué ofrece el producto y por qué le sirve a quien visita la página.', 80, 290, { tam: 19, color: GRIS, w: 540, autoAncho: false, interlineado: 1.6 }),
        ...boton('Comenzar gratis', AZUL, '#ffffff', null, 80, 390, 180, 52),
        ...boton('Ver demostración', '#ffffff', TINTA, LINEA, 276, 390, 190, 52),
        f('imagen', { nombre: 'Imagen', x: 760, y: 80, w: 600, h: 400, radio: 20 }),
      ] },
      { nombre: 'Lista de características', crear: () => [0, 1, 2].flatMap(i => [
        f('rect', { nombre: 'Ícono fondo', x: i * 300, y: 0, w: 48, h: 48, relleno: '#dbeafe', radio: 12 }),
        f('icono', { icono: ['grafica', 'candado', 'reloj'][i], x: i * 300 + 12, y: 12, w: 24, h: 24, color: AZUL }),
        t(['Rápido', 'Seguro', 'Siempre disponible'][i], i * 300, 68, { tam: 19, peso: 700, color: TINTA }),
        t('Texto corto que explica esta característica.', i * 300, 100, { w: 250, autoAncho: false, tam: 15, color: GRIS, interlineado: 1.5 }),
      ]) },
      { nombre: 'Precio', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 300, h: 400, relleno: '#ffffff', radio: 16, borde: LINEA }),
        t('Profesional', 28, 28, { tam: 17, peso: 600, color: AZUL }),
        t('$49', 28, 62, { tam: 44, peso: 800, color: TINTA }),
        t('/ mes', 112, 82, { tam: 15, color: GRIS }),
        ...['Usuarios ilimitados', 'Soporte prioritario', 'Reportes avanzados'].flatMap((x, i) => [
          f('icono', { icono: 'check', x: 28, y: 150 + i * 36, w: 18, h: 18, color: '#16a34a', grosorBorde: 3 }),
          t(x, 56, 148 + i * 36, { tam: 15, color: TINTA }),
        ]),
        ...boton('Elegir plan', AZUL, '#ffffff', null, 28, 320, 244, 48),
      ] },
      { nombre: 'Testimonio', crear: () => [
        f('rect', { nombre: 'Tarjeta', x: 0, y: 0, w: 380, h: 200, relleno: '#ffffff', radio: 16, sombra }),
        t('“Excelente servicio, nos ahorró semanas de trabajo.”', 24, 24, { w: 332, autoAncho: false, tam: 17, color: TINTA, cursiva: true, interlineado: 1.5 }),
        f('elipse', { nombre: 'Foto', x: 24, y: 128, w: 44, h: 44, relleno: '#cbd5e1' }),
        t('Ana Gómez', 80, 128, { tam: 15, peso: 700, color: TINTA }),
        t('Gerente, Empresa', 80, 150, { tam: 13, color: GRIS }),
      ] },
      { nombre: 'Tabla', crear: () => {
        const filas = [['Nombre', 'Estado', 'Fecha'], ['Pedido 1024', 'Enviado', '12 oct'], ['Pedido 1025', 'Pendiente', '13 oct'], ['Pedido 1026', 'Entregado', '14 oct']];
        return [
          f('rect', { nombre: 'Tabla', x: 0, y: 0, w: 540, h: 192, relleno: '#ffffff', radio: 10, borde: '#e5e7eb' }),
          f('rect', { nombre: 'Encabezado', x: 1, y: 1, w: 538, h: 47, relleno: '#f9fafb', radio: 10 }),
          ...filas.flatMap((fila, i) => [
            ...(i > 1 ? [f('rect', { nombre: 'Separador', x: 0, y: i * 48, w: 540, h: 1, relleno: '#e5e7eb' })] : []),
            ...fila.map((c, j) => t(c, 20 + j * 180, i * 48 + 14, { tam: 14, peso: i ? 400 : 600, color: i ? TINTA : GRIS })),
          ]),
        ];
      } },
      { nombre: 'Pie de página', crear: () => [
        f('rect', { nombre: 'Fondo', x: 0, y: 0, w: 1440, h: 240, relleno: TINTA }),
        t('Marca', 80, 48, { tam: 22, peso: 700, color: '#ffffff' }),
        t('Haciendo la web más simple.', 80, 86, { tam: 15, color: '#9ca3af' }),
        ...[['Producto', 'Precios', 'Novedades'], ['Empresa', 'Nosotros', 'Empleo'], ['Ayuda', 'Contacto', 'Términos']].flatMap((col, i) =>
          col.map((x, j) => t(x, 760 + i * 200, 48 + j * 34, { tam: j ? 15 : 14, peso: j ? 400 : 700, color: j ? '#9ca3af' : '#ffffff' }))),
        f('rect', { nombre: 'Línea', x: 80, y: 180, w: 1280, h: 1, relleno: '#374151' }),
        t('© 2026 Marca. Todos los derechos reservados.', 80, 198, { tam: 13, color: '#9ca3af' }),
      ] },
    ],
  },
  {
    nombre: 'Elementos', items: [
      { nombre: 'Imagen', crear: () => [f('imagen', { nombre: 'Imagen', w: 320, h: 200, radio: 8 })] },
      { nombre: 'Avatar', crear: () => [
        f('elipse', { nombre: 'Avatar', x: 0, y: 0, w: 48, h: 48, relleno: '#dbeafe' }),
        t('AG', 13, 13, { tam: 16, peso: 700, color: AZUL }),
      ] },
      { nombre: 'Insignia', crear: () => [
        f('rect', { nombre: 'Insignia', x: 0, y: 0, w: 72, h: 26, relleno: '#dcfce7', radio: 13 }),
        t('Activo', 14, 4, { tam: 13, peso: 600, color: '#15803d' }),
      ] },
      { nombre: 'Alerta', crear: () => [
        f('rect', { nombre: 'Alerta', x: 0, y: 0, w: 420, h: 56, relleno: '#eff6ff', radio: 10, borde: '#bfdbfe' }),
        f('icono', { icono: 'info', x: 16, y: 16, w: 24, h: 24, color: AZUL }),
        t('Tus cambios se guardaron correctamente.', 52, 17, { tam: 15, color: '#1e3a8a' }),
      ] },
      { nombre: 'Barra de progreso', crear: () => [
        f('rect', { nombre: 'Riel', x: 0, y: 0, w: 300, h: 8, relleno: '#e5e7eb', radio: 4 }),
        f('rect', { nombre: 'Avance', x: 0, y: 0, w: 190, h: 8, relleno: AZUL, radio: 4 }),
      ] },
      { nombre: 'Divisor', crear: () => [f('rect', { nombre: 'Divisor', w: 400, h: 1, relleno: '#e5e7eb' })] },
      { nombre: 'Video', crear: () => [
        f('rect', { nombre: 'Video', x: 0, y: 0, w: 480, h: 270, relleno: '#1f2937', radio: 12 }),
        f('elipse', { nombre: 'Botón', x: 208, y: 103, w: 64, h: 64, relleno: 'rgba(255,255,255,.9)' }),
        f('icono', { icono: 'reproducir', x: 228, y: 121, w: 28, h: 28, color: TINTA }),
      ] },
      { nombre: 'Mapa', crear: () => [
        f('rect', { nombre: 'Mapa', x: 0, y: 0, w: 400, h: 260, relleno: '#e0f2e9', radio: 12 }),
        f('linea', { nombre: 'Calle', x: 0, y: 90, w: 400, h: 60, borde: '#ffffff', grosorBorde: 10 }),
        f('linea', { nombre: 'Calle', x: 240, y: 0, w: -60, h: 260, borde: '#ffffff', grosorBorde: 8 }),
        f('icono', { icono: 'ubicacion', x: 190, y: 96, w: 36, h: 36, color: '#dc2626', grosorBorde: 2.5 }),
      ] },
      { nombre: 'Ventana modal', crear: () => [
        f('rect', { nombre: 'Ventana', x: 0, y: 0, w: 440, h: 240, relleno: '#ffffff', radio: 16, sombra: { x: 0, y: 20, b: 50, c: 'rgba(17,24,39,.25)' } }),
        t('¿Eliminar elemento?', 28, 28, { tam: 20, peso: 700, color: TINTA }),
        f('icono', { icono: 'cerrar', x: 396, y: 26, w: 20, h: 20, color: GRIS }),
        t('Esta acción no se puede deshacer. ¿Seguro que quieres continuar?', 28, 70, { w: 384, autoAncho: false, tam: 15, color: GRIS, interlineado: 1.5 }),
        ...boton('Cancelar', '#ffffff', TINTA, LINEA, 172, 164, 112, 44),
        ...boton('Eliminar', '#dc2626', '#ffffff', null, 296, 164, 116, 44),
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
    t(ejemplo, x + 14, y + 35, { tam: 15, color: '#9ca3af' }),
  ];
}

// Plantillas para empezar un archivo nuevo
export const PLANTILLAS = [
  { nombre: 'En blanco', crear: () => [] },
  { nombre: 'Página de inicio', crear: () => {
    const marco = f('marco', { nombre: 'Inicio · Escritorio', w: 1440, h: 1900 });
    const partes = [
      [buscar('Barra de navegación'), 0, 0], [buscar('Sección principal (hero)'), 0, 72],
      [buscar('Lista de características'), 120, 760], [buscar('Tarjeta'), 120, 1000], [buscar('Tarjeta'), 560, 1000], [buscar('Tarjeta'), 1000, 1000],
      [buscar('Pie de página'), 0, 1660],
    ];
    return [marco, ...partes.flatMap(([c, x, y]) => colocar(c.crear(), marco.x + x, marco.y + y, marco.id))];
  } },
  { nombre: 'Ingreso móvil', crear: () => {
    const marco = f('marco', { nombre: 'Ingreso · Celular', w: 390, h: 844, relleno: '#f9fafb' });
    return [marco, ...colocar(buscar('Barra móvil').crear(), 0, 0, marco.id), ...colocar(buscar('Formulario de ingreso').crear().map(o => {
      // El formulario se ajusta al ancho del celular
      const k = 350 / 400; o.x *= k; o.w *= k; return o;
    }), 20, 160, marco.id)];
  } },
];
function buscar(nombre) { for (const c of CATEGORIAS) for (const it of c.items) if (it.nombre === nombre) return it; }

// Mueve un conjunto de figuras a (x, y), las mete en el marco y las agrupa si son varias
export function colocar(figuras, x, y, padre = null, grupo = undefined) {
  const g = grupo !== undefined ? grupo : figuras.length > 1 ? crypto.randomUUID().slice(0, 12) : null;
  return figuras.map(o => ({ ...o, x: o.x + x, y: o.y + y, padre: o.tipo === 'marco' ? null : padre, grupo: o.tipo === 'marco' ? null : g }));
}
