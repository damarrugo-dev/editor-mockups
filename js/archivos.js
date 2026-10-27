// Lista de archivos: crear (desde plantilla), abrir, ordenar arrastrando, agrupar en carpetas, cambiar nombre, duplicar y eliminar.
import { $, h, ask, confirmDlg, showMenu, toast } from './util.js';
import { sesion } from './sesion.js';
import { login } from '../config.js';
import { PLANTILLAS } from './componentes.js';
import { nuevoId } from './almacen.js';

let almacen = null, archivos = [], quitar = null, alAbrir = null;

export function iniciarArchivos(alm, abrir) {
  almacen = alm;
  alAbrir = abrir;
  $('#buscarArchivo').oninput = dibujar;
  $('#ordenArchivos').onchange = dibujar;
  zonaDeSoltar($('#listaArchivos'), () => ({ carpeta: '' }));
  const cont = $('#plantillas');
  cont.textContent = '';
  for (const p of PLANTILLAS) {
    cont.append(h('button', { type: 'button', class: 'plantilla', onclick: () => crear(p) },
      h('span', { class: 'plantilla-dibujo ' + (p.clase || '') }),
      h('span', {}, p.nombre)));
  }
  cont.append(h('button', { type: 'button', class: 'plantilla', onclick: importar },
    h('span', { class: 'plantilla-dibujo importar' }, '⇪'), h('span', {}, 'Importar .json')));
}

export function escucharArchivos() {
  quitar?.();
  quitar = almacen.escucharArchivos((lista, err) => {
    if (err) {
      $('#listaArchivos').textContent = '';
      $('#listaArchivos').append(h('p', { class: 'muted' }, err.code === 'permission-denied'
        ? 'La base de datos no permite leer los archivos. Revisa que las reglas de firestore.rules estén publicadas.'
        : 'No se pudieron leer los archivos. Revisa tu conexión.'));
      return;
    }
    archivos = lista || [];
    dibujar();
  });
}
export function dejarDeEscuchar() { quitar?.(); quitar = null; }

const hace = d => {
  if (!d) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `hace ${Math.floor(s / 86400)} d`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
const esAdmin = () => (login?.administradores || []).map(a => a.toLowerCase()).includes(sesion.correo);
const puedeBorrar = a => almacen.modo === 'local' || a.propietario === sesion.correo || esAdmin();

// Orden personalizado: cada archivo guarda "posicion"; los que no la tienen van al final, los más recientes primero
function ordenManual(a, b) {
  const pa = a.posicion ?? null, pb = b.posicion ?? null;
  if (pa !== null && pb !== null && pa !== pb) return pa - pb;
  if (pa !== null && pb === null) return -1;
  if (pa === null && pb !== null) return 1;
  return (b.actualizado || 0) - (a.actualizado || 0);
}
const ORDENES = {
  manual: ordenManual,
  recientes: (a, b) => (b.actualizado || 0) - (a.actualizado || 0),
  nombre: (a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'),
};
ORDENES.mios = ORDENES.manual;

// Carpetas plegadas (solo en este navegador)
let plegadas = new Set();
try { plegadas = new Set(JSON.parse(localStorage.getItem('mockups:plegadas') || '[]')); } catch {}
const guardarPlegadas = () => { try { localStorage.setItem('mockups:plegadas', JSON.stringify([...plegadas])); } catch {} };

let arrastrado = null;

function dibujar() {
  const cont = $('#listaArchivos');
  const q = $('#buscarArchivo').value.trim().toLowerCase();
  const orden = $('#ordenArchivos').value;
  let lista = archivos.filter(a => !q || (a.nombre || '').toLowerCase().includes(q));
  if (orden === 'mios') lista = lista.filter(a => a.propietario === sesion.correo || almacen.modo === 'local');
  lista.sort(ORDENES[orden] || ordenManual);
  cont.textContent = '';
  if (!lista.length) {
    cont.append(h('p', { class: 'muted' }, archivos.length ? 'Ningún archivo coincide con la búsqueda.' : 'Todavía no hay archivos. Empieza con una plantilla de arriba.'));
    return;
  }
  // Cada carpeta aparece donde está su primer archivo; los archivos sueltos van después
  const carpetas = [];
  for (const a of lista) if (a.carpeta && !carpetas.includes(a.carpeta)) carpetas.push(a.carpeta);
  for (const c of carpetas) {
    const dentro = lista.filter(a => a.carpeta === c), abierta = !plegadas.has(c);
    const rejilla = h('div', { class: 'lista-archivos' }, ...dentro.map(tarjeta));
    rejilla.hidden = !abierta;
    const seccion = h('section', { class: 'carpeta' },
      h('div', { class: 'carpeta-cab' },
        h('button', { type: 'button', class: 'carpeta-nombre', 'aria-expanded': String(abierta), onclick: () => { abierta ? plegadas.add(c) : plegadas.delete(c); guardarPlegadas(); dibujar(); } },
          h('span', { class: 'carpeta-flecha' }, abierta ? '▾' : '▸'), h('span', { class: 'carpeta-icono' }, '📁'), h('strong', {}, c), h('span', { class: 'muted' }, String(dentro.length))),
        h('button', { type: 'button', class: 'icon-btn', title: 'Opciones de la carpeta', onclick: e => menuCarpeta(e.currentTarget, c) }, '⋯')),
      rejilla);
    zonaDeSoltar(seccion, () => ({ carpeta: c }));
    cont.append(seccion);
  }
  const sueltos = lista.filter(a => !a.carpeta);
  const rejilla = h('div', { class: 'lista-archivos' }, ...sueltos.map(tarjeta));
  if (carpetas.length && sueltos.length) cont.append(h('h2', { class: 'carpeta-sueltos' }, 'Sin carpeta'));
  cont.append(rejilla);
}

function tarjeta(a) {
  const el = h('article', { class: 'archivo', tabindex: 0, draggable: 'true', title: a.nombre || 'Sin nombre', onclick: e => { if (!e.target.closest('button')) alAbrir(a.id); }, onkeydown: e => { if (e.key === 'Enter') alAbrir(a.id); } },
    h('div', { class: 'archivo-mini' }, a.miniatura ? h('img', { src: a.miniatura, alt: '', draggable: 'false' }) : h('span', { class: 'sin-mini' }, (a.nombre || '?').slice(0, 1).toUpperCase())),
    h('div', { class: 'archivo-pie' },
      h('div', { class: 'archivo-txt' },
        h('strong', {}, a.nombre || 'Sin nombre'),
        h('span', { class: 'muted' }, [hace(a.actualizado), a.actualizadoPor && a.actualizadoPor !== sesion.correo ? `por ${a.actualizadoPor.split('@')[0]}` : ''].filter(Boolean).join(' ')),
      ),
      h('button', { type: 'button', class: 'icon-btn', title: 'Opciones', onclick: e => menu(e.currentTarget, a) }, '⋯')));
  // Arrastrar: a la izquierda o derecha de otra tarjeta la ordena; en el centro las agrupa en una carpeta
  const zona = e => { const r = el.getBoundingClientRect(), k = (e.clientX - r.left) / r.width; return k < .3 ? 'antes' : k > .7 ? 'despues' : 'agrupar'; };
  const limpiar = () => el.classList.remove('soltar-antes', 'soltar-despues', 'soltar-agrupar');
  el.addEventListener('dragstart', e => {
    arrastrado = a.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', a.id);
    requestAnimationFrame(() => el.classList.add('arrastrando'));
  });
  el.addEventListener('dragend', () => { arrastrado = null; el.classList.remove('arrastrando'); document.querySelectorAll('.soltar-antes, .soltar-despues, .soltar-agrupar, .soltar-aqui').forEach(x => x.classList.remove('soltar-antes', 'soltar-despues', 'soltar-agrupar', 'soltar-aqui')); });
  el.addEventListener('dragover', e => {
    if (!arrastrado || arrastrado === a.id) return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    limpiar(); el.classList.add('soltar-' + zona(e));
  });
  el.addEventListener('dragleave', limpiar);
  el.addEventListener('drop', e => {
    if (!arrastrado || arrastrado === a.id) return;
    e.preventDefault(); e.stopPropagation();
    const z = zona(e), id = arrastrado;
    limpiar();
    if (z === 'agrupar') agrupar(id, a);
    else mover(id, { [z]: a.id, carpeta: a.carpeta || '' });
  });
  return el;
}

// Soltar en el espacio libre de una carpeta (o de la lista): va al final de ella
function zonaDeSoltar(el, destino) {
  el.addEventListener('dragover', e => { if (!arrastrado) return; e.preventDefault(); e.stopPropagation(); el.classList.add('soltar-aqui'); });
  el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) el.classList.remove('soltar-aqui'); });
  el.addEventListener('drop', e => {
    if (!arrastrado) return;
    e.preventDefault(); e.stopPropagation();
    el.classList.remove('soltar-aqui');
    mover(arrastrado, destino());
  });
}

// Pone un archivo antes o después de otro (o al final de una carpeta) y guarda el nuevo orden de todos
async function mover(id, { antes, despues, carpeta }, extra = []) {
  const todos = [...archivos].sort(ordenManual);
  const yo = todos.find(a => a.id === id);
  if (!yo) return;
  todos.splice(todos.indexOf(yo), 1);
  let i = todos.length;
  if (antes) i = todos.findIndex(a => a.id === antes);
  else if (despues) i = todos.findIndex(a => a.id === despues) + 1;
  else if (carpeta) { const ult = todos.findLastIndex(a => (a.carpeta || '') === carpeta); if (ult >= 0) i = ult + 1; }
  todos.splice(i, 0, yo);
  const cambios = [];
  todos.forEach((a, k) => {
    const parcial = {};
    if (a.posicion !== k + 1) parcial.posicion = k + 1;
    if (a.id === id && (a.carpeta || '') !== carpeta) parcial.carpeta = carpeta;
    const otro = extra.find(x => x.id === a.id);
    if (otro) Object.assign(parcial, otro.parcial);
    if (Object.keys(parcial).length) { cambios.push({ id: a.id, parcial }); Object.assign(a, parcial); }
  });
  if ($('#ordenArchivos').value !== 'manual' && $('#ordenArchivos').value !== 'mios') $('#ordenArchivos').value = 'manual';
  dibujar();
  if (!cambios.length) return;
  try { await almacen.organizarArchivos(cambios); }
  catch (err) { console.error(err); toast('No se pudo guardar el nuevo orden.'); }
}

async function agrupar(id, destino) {
  if (destino.carpeta) return mover(id, { despues: destino.id, carpeta: destino.carpeta });
  const nombre = await ask({ title: 'Nueva carpeta', hint: 'Los dos archivos quedarán juntos en esta carpeta.', value: 'Carpeta nueva', okText: 'Crear carpeta' });
  if (!nombre) return;
  plegadas.delete(nombre); guardarPlegadas();
  mover(id, { despues: destino.id, carpeta: nombre }, [{ id: destino.id, parcial: { carpeta: nombre } }]);
}

async function moverACarpeta(a) {
  const existentes = [...new Set(archivos.map(x => x.carpeta).filter(Boolean))];
  const nombre = await ask({ title: 'Mover a carpeta', hint: existentes.length ? `Carpetas: ${existentes.join(', ')}. Escribe una de ellas o un nombre nuevo.` : 'Escribe el nombre de la carpeta.', value: a.carpeta || '', okText: 'Mover' });
  if (nombre && nombre !== a.carpeta) mover(a.id, { carpeta: nombre });
}

function menuCarpeta(ancla, c) {
  const dentro = archivos.filter(a => a.carpeta === c);
  const guardar = parcial => {
    dentro.forEach(a => Object.assign(a, parcial)); dibujar();
    almacen.organizarArchivos(dentro.map(a => ({ id: a.id, parcial }))).catch(err => { console.error(err); toast('No se pudo guardar.'); });
  };
  showMenu(ancla, [
    { label: 'Cambiar nombre', action: async () => { const n = await ask({ title: 'Nombre de la carpeta', value: c }); if (n && n !== c) { if (plegadas.delete(c)) { plegadas.add(n); guardarPlegadas(); } guardar({ carpeta: n }); } } },
    { label: 'Desagrupar (sacar los archivos)', action: () => guardar({ carpeta: '' }) },
  ]);
}

function menu(ancla, a) {
  showMenu(ancla, [
    { label: 'Abrir', action: () => alAbrir(a.id) },
    { label: 'Abrir en otra pestaña', action: () => window.open(enlace(a.id), '_blank') },
    { label: 'Copiar enlace', action: () => navigator.clipboard.writeText(enlace(a.id)).then(() => toast('Enlace copiado')) },
    { label: 'Cambiar nombre', action: async () => { const n = await ask({ title: 'Nombre del archivo', value: a.nombre }); if (n) almacen.actualizarArchivo(a.id, { nombre: n }); } },
    { label: 'Mover a carpeta…', action: () => moverACarpeta(a) },
    ...(a.carpeta ? [{ label: 'Sacar de la carpeta', action: () => mover(a.id, { carpeta: '' }) }] : []),
    { label: 'Duplicar', action: () => duplicar(a) },
    { label: puedeBorrar(a) ? 'Eliminar' : 'Eliminar (solo quien lo creó)', danger: true, disabled: !puedeBorrar(a), action: async () => {
      if (await confirmDlg(`¿Eliminar "${a.nombre}"?`, 'Se borra para todos y no se puede deshacer.')) {
        try { await almacen.eliminarArchivo(a.id); toast('Archivo eliminado'); } catch (err) { console.error(err); toast('No se pudo eliminar.'); }
      }
    } },
  ]);
}
export const enlace = id => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('archivo', id); if (sesion.modo === 'local' && new URLSearchParams(location.search).has('prueba')) u.searchParams.set('prueba', ''); return u.href; };

async function crear(plantilla) {
  const nombre = await ask({ title: 'Nombre del archivo', value: plantilla.nombre === 'En blanco' ? 'Sin título' : plantilla.nombre });
  if (!nombre) return;
  const pagina = { id: nuevoId(), nombre: 'Página 1' };
  const objetos = plantilla.crear().map((o, i) => ({ ...o, pagina: pagina.id, orden: i + 1 }));
  try {
    const id = await almacen.crearArchivo({ nombre, paginas: [pagina], objetos });
    alAbrir(id);
  } catch (err) { console.error(err); toast('No se pudo crear el archivo: ' + (err.message || err.code)); }
}

async function duplicar(a) {
  try {
    const objetos = await almacen.leerObjetos(a.id);
    const id = await almacen.crearArchivo({ nombre: a.nombre + ' (copia)', paginas: a.paginas, objetos });
    if (a.miniatura) almacen.actualizarArchivo(id, { miniatura: a.miniatura });
    toast('Archivo duplicado');
  } catch (err) { console.error(err); toast('No se pudo duplicar.'); }
}

function importar() {
  const inp = $('#elegirJson');
  inp.onchange = async () => {
    const f = inp.files[0]; inp.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.formato !== 'editor-mockups') throw new Error('formato');
      const id = await almacen.crearArchivo({ nombre: d.nombre || f.name.replace(/\.json$/, ''), paginas: d.paginas, objetos: d.objetos });
      alAbrir(id);
    } catch (err) { console.error(err); toast('Ese archivo no es una copia del editor de mockups.'); }
  };
  inp.click();
}
