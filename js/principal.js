// Arranque: inicio de sesión, conexión a la base de datos y cambio entre la lista de archivos y el editor.
import { $, toast } from './util.js';
import { conectar, sesion, preguntarNombreSiFalta } from './sesion.js';
import { presenciaURL } from '../config.js';
import { conectarPresencia } from './presencia.js';
import { crearAlmacen } from './almacen.js';
import { E, on, iniciarLienzo, abrirArchivo, cerrarArchivo, clonar, agregar } from './editor.js';
import { iniciarPaneles } from './paneles.js';
import { iniciarPresentar } from './presentar.js';
import { iniciarArchivos, escucharArchivos, dejarDeEscuchar, enlace } from './archivos.js';
import { miniatura, exportarJson } from './exportar.js';

let almacen;

function mostrar(vista) {
  document.body.dataset.vista = vista;
  for (const el of document.querySelectorAll('[data-de]')) el.hidden = el.dataset.de !== vista;
}

async function irALista(empujar = true) {
  await guardarMiniatura();
  cerrarArchivo();
  if (empujar) { const u = new URL(location.href); u.searchParams.delete('archivo'); u.searchParams.delete('pagina'); history.pushState(null, '', u); }
  document.title = 'Editor de mockups';
  mostrar('archivos');
  escucharArchivos();
}

async function abrir(id, empujar = true) {
  if (empujar) { const u = new URL(location.href); u.searchParams.set('archivo', id); u.searchParams.delete('pagina'); history.pushState(null, '', u); }
  dejarDeEscuchar();
  mostrar('editor');
  const ok = await abrirArchivo(almacen, id);
  if (!ok) { toast('Ese archivo no existe o fue eliminado.'); return irALista(); }
  $('#lienzo').focus({ preventScroll: true });
}

// La miniatura de la lista se actualiza unos segundos después de que uno mismo cambia algo
let ultimaMiniatura = 0, temporizador = null;
async function guardarMiniatura() {
  clearTimeout(temporizador);
  if (!E.archivoId || !E.ultimoCambioLocal || E.ultimoCambioLocal <= ultimaMiniatura) return;
  ultimaMiniatura = Date.now();
  try {
    const url = await miniatura();
    if (url != null && url.length < 300000) await almacen.actualizarArchivo(E.archivoId, { miniatura: url });
  } catch (err) { console.warn('miniatura', err); }
}

async function arrancar() {
  try { await conectar(); }
  catch (err) {
    console.error(err);
    const b = $('#banner');
    b.className = 'banner error';
    b.textContent = 'No se pudo conectar con la base de datos en línea. Revisa tu conexión a internet y recarga la página.';
    b.hidden = false;
    return;
  }
  if (sesion.modo === 'firebase' && presenciaURL) {
    try { sesion.presencia = await conectarPresencia(sesion, presenciaURL); }
    catch (err) { console.warn('Sin Realtime Database: los cursores irán por Firestore', err); }
  }
  if (sesion.modo === 'local') {
    const b = $('#banner');
    b.className = 'banner warn';
    b.textContent = 'Modo de prueba: los archivos se guardan solo en este navegador. Abre otra pestaña para probar la edición en equipo.';
    b.hidden = false;
  }
  preguntarNombreSiFalta();
  almacen = crearAlmacen(sesion);

  iniciarLienzo();
  iniciarPaneles();
  iniciarPresentar();
  iniciarArchivos(almacen, id => abrir(id));

  $('#irArchivos').onclick = () => irALista();
  const nombre = $('#nombreArchivo');
  on('archivo', () => {
    if (document.activeElement !== nombre) nombre.value = E.archivo?.nombre || '';
    document.title = `${E.archivo?.nombre || 'Archivo'} · Mockups`;
  });
  nombre.onchange = () => { const v = nombre.value.trim(); if (v && E.archivoId) almacen.actualizarArchivo(E.archivoId, { nombre: v }); };
  nombre.onkeydown = e => { if (e.key === 'Enter' || e.key === 'Escape') { if (e.key === 'Escape') nombre.value = E.archivo?.nombre || ''; nombre.blur(); } };
  $('#btnCompartir').onclick = () => navigator.clipboard.writeText(enlace(E.archivoId))
    .then(() => toast('Enlace copiado. Quien lo abra (con su correo de la empresa) puede editar contigo.'))
    .catch(() => toast(enlace(E.archivoId)));
  on('objetos', () => { clearTimeout(temporizador); temporizador = setTimeout(guardarMiniatura, 15000); });
  on('exportar-json', exportarJson);
  on('importar-json', importarEnPagina);
  window.addEventListener('pagehide', () => { guardarMiniatura(); });
  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('archivo');
    if (id && id !== E.archivoId) abrir(id, false);
    else if (!id && E.archivoId) irALista(false);
  });

  const id = new URLSearchParams(location.search).get('archivo');
  if (id) abrir(id, false); else irALista(false);
}

// Trae las figuras de una copia .json a la página actual
function importarEnPagina() {
  const inp = $('#elegirJson');
  inp.onchange = async () => {
    const f = inp.files[0]; inp.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.formato !== 'editor-mockups') throw new Error('formato');
      const primera = d.paginas?.[0]?.id;
      const figuras = (d.objetos || []).filter(o => o.pagina === primera);
      agregar(clonar(figuras, 0, 0));
      toast(`Se importaron ${figuras.length} figuras.`);
    } catch (err) { console.error(err); toast('Ese archivo no es una copia del editor de mockups.'); }
  };
  inp.click();
}

arrancar();
