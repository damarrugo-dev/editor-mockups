// Exportar a PNG y HTML, y la miniatura que se ve en la lista de archivos.
// Las figuras se dibujan aparte (fuera del lienzo, a tamaño real) con la misma función del editor.
import { h, toast } from './util.js';
import { crearNodo, pintar, caja } from './figuras.js';
import { E, objetosPagina } from './editor.js';

const porOrden = (a, b) => (a.orden || 0) - (b.orden || 0);

// Dibuja las figuras raíz (y el contenido de los marcos) en un contenedor del tamaño justo
export function construirEscena(raices, todos) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const o of raices) { const c = caja(o); x1 = Math.min(x1, c.x); y1 = Math.min(y1, c.y); x2 = Math.max(x2, c.x + c.w); y2 = Math.max(y2, c.y + c.h); }
  const cont = h('div', { class: 'escena', style: `position:relative;width:${x2 - x1}px;height:${y2 - y1}px;overflow:hidden` });
  const nodos = new Map();
  const poner = (dest, o, ox, oy) => {
    const el = crearNodo(o);
    pintar(el, o, ox, oy);
    dest.append(el);
    nodos.set(o.id, el);
    if (o.tipo === 'marco') {
      const hijos = todos.filter(c => c.padre === o.id && c.tipo && c.pagina === o.pagina).sort(porOrden);
      for (const c of hijos) poner(el.querySelector('.hijos'), c, o.x, o.y);
    }
  };
  for (const o of [...raices].sort(porOrden)) poner(cont, o, x1, y1);
  return { cont, nodos, ancho: x2 - x1, alto: y2 - y1, x: x1, y: y1 };
}

async function conEscena(raices, todos, hacer) {
  if (!window.htmlToImage) { toast('No se pudo cargar la herramienta de exportar. Revisa tu conexión y recarga.'); return null; }
  const esc = construirEscena(raices, todos);
  const fuera = h('div', { class: 'escena-fuera' }, esc.cont);
  document.body.append(fuera);
  try {
    await document.fonts.ready;
    await Promise.all([...esc.cont.querySelectorAll('img')].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    return await hacer(esc);
  } finally { fuera.remove(); }
}

export async function exportarPng(seleccion, escala = 2) {
  if (!seleccion.length) return;
  const todos = objetosPagina();
  const ids = new Set(seleccion.map(o => o.id));
  // Si se eligió una figura dentro de un marco junto con su marco, basta con el marco
  const raices = seleccion.filter(o => !ids.has(o.padre));
  try {
    const url = await conEscena(raices, todos, esc => window.htmlToImage.toPng(esc.cont, { pixelRatio: escala, width: esc.ancho, height: esc.alto }));
    if (!url) return;
    const nombre = (raices.length === 1 ? raices[0].nombre : 'seleccion') || 'mockup';
    descargar(url, `${limpiarNombre(nombre)}${escala > 1 ? '@' + escala + 'x' : ''}.png`);
  } catch (err) { console.error(err); toast('No se pudo exportar la imagen.'); }
}

export function exportarHtml(marco) {
  const todos = objetosPagina();
  const esc = construirEscena([marco], todos);
  const fuentes = new Set(todos.filter(o => o.tipo === 'texto').map(o => o.fuente));
  const google = [...fuentes].filter(f => !['Arial', 'Georgia', 'Times New Roman', 'Courier New'].includes(f));
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${Math.round(marco.w)}">
<title>${escapar(marco.nombre)}</title>
${google.length ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${google.map(f => 'family=' + f.replace(/ /g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400').join('&')}&display=swap">` : ''}
<style>
  body { margin: 0; background: #e9e9ec; display: flex; justify-content: center; }
  .escena { margin: 0 auto; }
  .obj { position: absolute; box-sizing: border-box; }
  .hijos { position: absolute; inset: 0; }
  .obj img { width: 100%; height: 100%; display: block; }
  .obj > svg { position: absolute; left: 0; top: 0; }
  .obj[data-tipo="icono"] > svg { width: 100%; height: 100%; }
  .obj[data-tipo="imagen"].sin-imagen > svg { width: 40%; height: 40%; left: 30%; top: 30%; }
  .txt { width: 100%; }
</style>
</head>
<body>
${esc.cont.outerHTML}
</body>
</html>`;
  descargar(URL.createObjectURL(new Blob([html], { type: 'text/html' })), `${limpiarNombre(marco.nombre)}.html`);
}

// Miniatura (JPEG pequeño) del primer marco de la primera página, para la lista de archivos
export async function miniatura() {
  if (!window.htmlToImage) return null;
  const pagina = E.archivo?.paginas?.[0]?.id;
  const todos = [...E.objetos.values()].filter(o => o.pagina === pagina && o.tipo);
  const marcos = todos.filter(o => o.tipo === 'marco').sort(porOrden);
  const raices = marcos.length ? [marcos[0]] : todos.filter(o => !o.padre);
  if (!raices.length) return '';
  return conEscena(raices, todos, esc => {
    const k = Math.min(1, 480 / esc.ancho, 320 / esc.alto);
    return window.htmlToImage.toJpeg(esc.cont, { pixelRatio: k, width: esc.ancho, height: esc.alto, quality: 0.7, backgroundColor: '#ffffff' });
  });
}

export function exportarJson() {
  const datos = { formato: 'editor-mockups', version: 1, nombre: E.archivo?.nombre, paginas: E.archivo?.paginas, objetos: [...E.objetos.values()] };
  descargar(URL.createObjectURL(new Blob([JSON.stringify(datos)], { type: 'application/json' })), `${limpiarNombre(E.archivo?.nombre || 'mockup')}.json`);
}

function descargar(url, nombre) {
  const a = h('a', { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
}
const limpiarNombre = n => String(n).replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'mockup';
const escapar = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
