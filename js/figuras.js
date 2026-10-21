// Las figuras del editor: qué propiedades tiene cada tipo y cómo se dibujan en la página.
// El mismo dibujo se usa en el lienzo, en las sombras de los demás, en el modo Presentar y al exportar.
import { nuevoId } from './almacen.js';

export const TIPOS = {
  marco: 'Marco', rect: 'Rectángulo', elipse: 'Elipse', linea: 'Línea',
  texto: 'Texto', imagen: 'Imagen', icono: 'Ícono',
};

export const FUENTES = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Raleway',
  'Playfair Display', 'Merriweather', 'Source Code Pro', 'Arial', 'Georgia', 'Times New Roman', 'Courier New'];
export const PESOS = [[300, 'Ligera'], [400, 'Normal'], [500, 'Media'], [600, 'Seminegrita'], [700, 'Negrita'], [800, 'Extra negrita']];

// Tamaños de marco más usados en páginas web
export const TAMANOS_MARCO = [
  ['Escritorio', 1440, 1024], ['Portátil', 1280, 800], ['Escritorio HD', 1920, 1080],
  ['Tableta', 768, 1024], ['Tableta horizontal', 1024, 768],
  ['Celular', 390, 844], ['Celular grande', 430, 932], ['Celular pequeño', 360, 640],
];

const BASE = {
  nombre: '', padre: null, grupo: null, x: 0, y: 0, w: 100, h: 100, rot: 0,
  visible: true, bloqueado: false, opacidad: 1, enlace: null,
};
const POR_TIPO = {
  marco: { relleno: '#ffffff', borde: null, grosorBorde: 1, estiloBorde: 'solid', radio: 0, sombra: null, recortar: true },
  rect: { relleno: '#d9d9d9', borde: null, grosorBorde: 1, estiloBorde: 'solid', radio: 0, sombra: null },
  elipse: { relleno: '#d9d9d9', borde: null, grosorBorde: 1, estiloBorde: 'solid', sombra: null },
  linea: { borde: '#1c2230', grosorBorde: 2, estiloBorde: 'solid', flechaIni: false, flechaFin: false, sombra: null },
  texto: {
    texto: 'Texto', fuente: 'Inter', tam: 16, peso: 400, cursiva: false, color: '#1c2230', interlineado: 1.4, espaciado: 0,
    alinear: 'left', alinearV: 'top', decoracion: 'none', mayus: 'none', autoAncho: true, autoAlto: true, sombra: null, relleno: null,
  },
  imagen: { src: '', ajuste: 'cover', radio: 0, borde: null, grosorBorde: 1, estiloBorde: 'solid', sombra: null },
  icono: { icono: 'estrella', color: '#1c2230', grosorBorde: 2, sombra: null },
};

export function figuraNueva(tipo, props = {}) {
  const o = { id: nuevoId(), tipo, ...BASE, ...structuredClone(POR_TIPO[tipo]), ...props };
  if (!o.nombre) o.nombre = TIPOS[tipo];
  return o;
}

export const tieneRelleno = t => ['marco', 'rect', 'elipse', 'texto'].includes(t);
export const tieneBorde = t => ['marco', 'rect', 'elipse', 'imagen', 'linea'].includes(t);
export const tieneRadio = t => ['marco', 'rect', 'imagen'].includes(t);

// Caja de la figura con ancho y alto positivos (las líneas guardan el ancho y alto con signo: van de (x,y) a (x+w,y+h))
export function caja(o) {
  const x = Math.min(o.x, o.x + o.w), y = Math.min(o.y, o.y + o.h);
  return { x, y, w: Math.abs(o.w), h: Math.abs(o.h) };
}

const css = (c, alfa = 1) => c || 'transparent';
function sombraCss(s) { return s ? `${s.x || 0}px ${s.y || 0}px ${s.b || 0}px ${s.c || 'rgba(0,0,0,.25)'}` : ''; }

const SVG = 'http://www.w3.org/2000/svg';

// Crea el elemento de una figura (sin posición: eso lo pone pintar)
export function crearNodo(o) {
  const el = document.createElement('div');
  el.className = 'obj';
  el.dataset.id = o.id;
  el.dataset.tipo = o.tipo;
  if (o.tipo === 'texto') { const t = document.createElement('div'); t.className = 'txt'; el.append(t); }
  if (o.tipo === 'marco') { const c = document.createElement('div'); c.className = 'hijos'; el.append(c); }
  return el;
}

// Pone en el elemento el aspecto de la figura. (ox, oy) es la esquina del marco que la contiene.
export function pintar(el, o, ox = 0, oy = 0) {
  const b = caja(o);
  const s = el.style;
  s.left = (b.x - ox) + 'px';
  s.top = (b.y - oy) + 'px';
  s.width = b.w + 'px';
  s.height = b.h + 'px';
  s.opacity = o.opacidad ?? 1;
  s.transform = o.rot ? `rotate(${o.rot}deg)` : '';
  s.display = o.visible === false ? 'none' : '';
  el.classList.toggle('bloqueado', !!o.bloqueado);
  el.classList.toggle('con-enlace', !!o.enlace);
  const borde = o.borde && o.grosorBorde ? `${o.grosorBorde}px ${o.estiloBorde || 'solid'} ${o.borde}` : '';
  switch (o.tipo) {
    case 'marco':
    case 'rect':
    case 'elipse':
      s.background = css(o.relleno);
      s.border = borde;
      s.borderRadius = o.tipo === 'elipse' ? '50%' : (o.radio || 0) + 'px';
      s.boxShadow = sombraCss(o.sombra);
      if (o.tipo === 'marco') s.overflow = o.recortar === false ? 'visible' : 'hidden';
      break;
    case 'texto': pintarTexto(el, o); break;
    case 'imagen': pintarImagen(el, o, borde); break;
    case 'linea': pintarLinea(el, o, b); break;
    case 'icono': pintarIcono(el, o); break;
  }
}

function pintarTexto(el, o) {
  const s = el.style;
  const t = el.firstChild;
  if (o.autoAncho) s.width = 'max-content';
  if (o.autoAlto) s.height = 'auto';
  s.background = css(o.relleno);
  s.display = o.visible === false ? 'none' : 'flex';
  s.flexDirection = 'column';
  s.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[o.alinearV] || 'flex-start';
  s.fontFamily = `"${o.fuente}", system-ui, sans-serif`;
  s.fontSize = o.tam + 'px';
  s.fontWeight = o.peso;
  s.fontStyle = o.cursiva ? 'italic' : 'normal';
  s.color = o.color;
  s.lineHeight = o.interlineado;
  s.letterSpacing = (o.espaciado || 0) + 'px';
  s.textAlign = o.alinear;
  s.textDecoration = o.decoracion || 'none';
  s.textTransform = o.mayus || 'none';
  s.whiteSpace = o.autoAncho ? 'pre' : 'pre-wrap';
  s.textShadow = sombraCss(o.sombra);
  // No se toca el texto mientras la persona lo está escribiendo
  if (t.isContentEditable) return;
  if (t.textContent !== o.texto) t.textContent = o.texto;
}

function pintarImagen(el, o, borde) {
  const s = el.style;
  s.border = borde;
  s.borderRadius = (o.radio || 0) + 'px';
  s.boxShadow = sombraCss(o.sombra);
  s.overflow = 'hidden';
  el.classList.toggle('sin-imagen', !o.src);
  let img = el.querySelector('img');
  if (!o.src) { img?.remove(); s.background = '#e3e6ec'; if (!el.querySelector('svg')) el.append(svgIcono('imagen', '#9aa1b0', 1.5)); return; }
  el.querySelector('svg')?.remove();
  s.background = '';
  if (!img) { img = document.createElement('img'); img.draggable = false; img.alt = ''; el.append(img); }
  if (img.getAttribute('src') !== o.src) img.setAttribute('src', o.src);
  img.style.objectFit = o.ajuste || 'cover';
}

function pintarLinea(el, o, b) {
  el.style.overflow = 'visible';
  el.style.filter = o.sombra ? `drop-shadow(${sombraCss(o.sombra)})` : '';
  let svg = el.querySelector('svg');
  if (!svg) { svg = document.createElementNS(SVG, 'svg'); el.append(svg); }
  svg.setAttribute('width', Math.max(b.w, 1));
  svg.setAttribute('height', Math.max(b.h, 1));
  svg.style.overflow = 'visible';
  const x1 = o.x - b.x, y1 = o.y - b.y, x2 = o.x + o.w - b.x, y2 = o.y + o.h - b.y;
  const g = o.grosorBorde || 1;
  const guion = o.estiloBorde === 'dashed' ? `${g * 3} ${g * 2}` : o.estiloBorde === 'dotted' ? `0 ${g * 2}` : '';
  let d = `M${x1} ${y1}L${x2} ${y2}`;
  const punta = (ax, ay, bx, by) => {
    const ang = Math.atan2(by - ay, bx - ax), t = 4 * g + 6;
    const p = a => `${bx - t * Math.cos(ang + a)} ${by - t * Math.sin(ang + a)}`;
    return `M${p(0.5)}L${bx} ${by}L${p(-0.5)}`;
  };
  if (o.flechaFin) d += punta(x1, y1, x2, y2);
  if (o.flechaIni) d += punta(x2, y2, x1, y1);
  svg.innerHTML = `<path d="${d}" fill="none" stroke="${o.borde || '#000'}" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" ${guion ? `stroke-dasharray="${guion}"` : ''}/>`;
}

function pintarIcono(el, o) {
  el.style.filter = o.sombra ? `drop-shadow(${sombraCss(o.sombra)})` : '';
  const svg = el.querySelector('svg');
  const clave = `${o.icono}|${o.color}|${o.grosorBorde}`;
  if (svg && svg.dataset.clave === clave) return;
  svg?.remove();
  const nuevo = svgIcono(o.icono, o.color, o.grosorBorde);
  nuevo.dataset.clave = clave;
  el.append(nuevo);
}

export function svgIcono(nombre, color = 'currentColor', grosor = 2) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', grosor);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.innerHTML = ICONOS[nombre] || ICONOS.estrella;
  return svg;
}

// Íconos de línea (24×24) para mockups web
export const ICONOS = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.6-4.6"/>',
  usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  inicio: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  corazon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  estrella: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
  carrito: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  campana: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  correo: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  telefono: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  cerrar: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  abajo: '<path d="M6 9l6 6 6-6"/>',
  arriba: '<path d="M18 15l-6-6-6 6"/>',
  derecha: '<path d="M9 18l6-6-6-6"/>',
  izquierda: '<path d="M15 18l-6-6 6-6"/>',
  flecha: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  reproducir: '<path d="M6 3l14 9-14 9z"/>',
  imagen: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  candado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  ojo: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  mundo: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
  compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  basura: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  lapiz: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  ubicacion: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  filtro: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  cuadricula: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  archivo: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  tarjeta: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  grafica: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  // Logística
  camion: '<rect x="1" y="4" width="14" height="12" rx="1"/><path d="M15 8h4l3 3.5V16h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  paquete: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
  barco: '<path d="M2 20c2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0"/><path d="M4 17l-1.5-5h19L20 17"/><path d="M6 12V7h12v5M10 7V4h4v3"/>',
  contenedor: '<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M6 9v6M10 9v6M14 9v6M18 9v6"/>',
  ruta: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h9a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7h9"/>',
  codigo: '<path d="M3 5v14M6 5v14M10 5v14M13 5v14M15 5v14M18 5v14M21 5v14"/>',
  almacen: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
  alerta: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  panel: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  firma: '<path d="M3 17c3-6 5-9 6-8s-2 7 0 7 3-5 5-5-1 5 1 5 3-2 6-2"/><path d="M3 21h18"/>',
  grua: '<path d="M5 21V4h15M5 4l5 5M10 4v5M16 4v5"/><rect x="13" y="9" width="6" height="4"/><path d="M2 21h7"/>',
  escaner: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
};
export const NOMBRES_ICONOS = Object.keys(ICONOS);

// CSS de una figura, para la pestaña "Código"
export function cssDe(o, ox = 0, oy = 0) {
  const b = caja(o);
  const l = [`position: absolute;`, `left: ${r(b.x - ox)}px;`, `top: ${r(b.y - oy)}px;`, `width: ${r(b.w)}px;`, `height: ${r(b.h)}px;`];
  if (o.tipo === 'texto') {
    if (o.autoAncho) l[3] = 'width: max-content;';
    if (o.autoAlto) l[4] = 'height: auto;';
  }
  if (o.rot) l.push(`transform: rotate(${o.rot}deg);`);
  if (o.opacidad != null && o.opacidad !== 1) l.push(`opacity: ${o.opacidad};`);
  if (o.relleno && o.tipo !== 'icono') l.push(`background: ${o.relleno};`);
  if (o.borde && o.grosorBorde && o.tipo !== 'linea') l.push(`border: ${o.grosorBorde}px ${o.estiloBorde || 'solid'} ${o.borde};`);
  if (o.tipo === 'elipse') l.push('border-radius: 50%;');
  else if (o.radio) l.push(`border-radius: ${o.radio}px;`);
  if (o.sombra) l.push(`${o.tipo === 'texto' ? 'text-shadow' : 'box-shadow'}: ${sombraCss(o.sombra)};`);
  if (o.tipo === 'marco' && o.recortar !== false) l.push('overflow: hidden;');
  if (o.tipo === 'texto') {
    l.push(`font-family: "${o.fuente}", sans-serif;`, `font-size: ${o.tam}px;`, `font-weight: ${o.peso};`, `line-height: ${o.interlineado};`, `color: ${o.color};`);
    if (o.cursiva) l.push('font-style: italic;');
    if (o.espaciado) l.push(`letter-spacing: ${o.espaciado}px;`);
    if (o.alinear !== 'left') l.push(`text-align: ${o.alinear};`);
    if (o.decoracion && o.decoracion !== 'none') l.push(`text-decoration: ${o.decoracion};`);
    if (o.mayus && o.mayus !== 'none') l.push(`text-transform: ${o.mayus};`);
  }
  if (o.tipo === 'imagen') l.push(`object-fit: ${o.ajuste || 'cover'};`);
  return l.join('\n');
}
const r = n => Math.round(n * 100) / 100;
