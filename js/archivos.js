// Lista de archivos: crear (desde plantilla), abrir, cambiar nombre, duplicar y eliminar.
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

function dibujar() {
  const cont = $('#listaArchivos');
  const q = $('#buscarArchivo').value.trim().toLowerCase();
  const orden = $('#ordenArchivos').value;
  let lista = archivos.filter(a => !q || (a.nombre || '').toLowerCase().includes(q));
  if (orden === 'mios') lista = lista.filter(a => a.propietario === sesion.correo || almacen.modo === 'local');
  lista.sort(orden === 'nombre' ? (a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es') : (a, b) => (b.actualizado || 0) - (a.actualizado || 0));
  cont.textContent = '';
  if (!lista.length) {
    cont.append(h('p', { class: 'muted' }, archivos.length ? 'Ningún archivo coincide con la búsqueda.' : 'Todavía no hay archivos. Empieza con una plantilla de arriba.'));
    return;
  }
  for (const a of lista) {
    const tarjeta = h('article', { class: 'archivo', tabindex: 0, onclick: e => { if (!e.target.closest('button')) alAbrir(a.id); }, onkeydown: e => { if (e.key === 'Enter') alAbrir(a.id); } },
      h('div', { class: 'archivo-mini' }, a.miniatura ? h('img', { src: a.miniatura, alt: '' }) : h('span', { class: 'sin-mini' }, (a.nombre || '?').slice(0, 1).toUpperCase())),
      h('div', { class: 'archivo-pie' },
        h('div', { class: 'archivo-txt' },
          h('strong', {}, a.nombre || 'Sin nombre'),
          h('span', { class: 'muted' }, [hace(a.actualizado), a.actualizadoPor && a.actualizadoPor !== sesion.correo ? `por ${a.actualizadoPor.split('@')[0]}` : ''].filter(Boolean).join(' ')),
        ),
        h('button', { type: 'button', class: 'icon-btn', title: 'Opciones', onclick: e => menu(e.currentTarget, a) }, '⋯')));
    cont.append(tarjeta);
  }
}

function menu(ancla, a) {
  showMenu(ancla, [
    { label: 'Abrir', action: () => alAbrir(a.id) },
    { label: 'Abrir en otra pestaña', action: () => window.open(enlace(a.id), '_blank') },
    { label: 'Copiar enlace', action: () => navigator.clipboard.writeText(enlace(a.id)).then(() => toast('Enlace copiado')) },
    { label: 'Cambiar nombre', action: async () => { const n = await ask({ title: 'Nombre del archivo', value: a.nombre }); if (n) almacen.actualizarArchivo(a.id, { nombre: n }); } },
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
