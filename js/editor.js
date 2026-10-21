// Núcleo del editor: el lienzo infinito, las herramientas, la selección, mover / redimensionar con guías,
// deshacer, copiar y pegar, y la edición en equipo (cursores y sombras de lo que los demás arrastran o escriben).
//
// Los cambios de una persona se aplican al momento en su pantalla y se guardan figura por figura;
// mientras arrastra, los demás ven una sombra de su color en la posición nueva, y al soltar se guarda.
import { $, h, toast } from './util.js';
import { figuraNueva, crearNodo, pintar, caja, TIPOS } from './figuras.js';
import { nuevoId } from './almacen.js';
import { me, hueOf, sesion } from './sesion.js';

// ---------- Estado ----------
export const E = {
  almacen: null, conexion: null, archivoId: null, archivo: null,
  objetos: new Map(),          // id → figura (lo guardado)
  temporal: new Map(),         // id → cambios mientras se arrastra (aún sin guardar)
  borrador: null,              // figura que se está dibujando
  pagina: null,
  sel: new Set(),
  grupoAbierto: null,          // doble clic en un grupo: se seleccionan sus partes una por una
  cam: { x: 0, y: 0, z: 1 },
  herr: 'mover',
  otros: new Map(),            // uid → presencia de las demás personas
  editando: null,              // id del texto que se está escribiendo
  deshacer: [], rehacer: [],
  guias: [], marquesina: null, hover: null,
  siguiendo: null,
  espacio: false,
  guardando: 0, error: false,
  soloLectura: false,
};

const ev = new EventTarget();
export const on = (tipo, f) => ev.addEventListener(tipo, f);
export const emitir = tipo => ev.dispatchEvent(new Event(tipo));

const nodos = new Map();       // id → elemento en el lienzo
const medidas = new Map();     // id → tamaño real de los textos que crecen solos
let lienzo, mundo, capaUI, capaFantasmas, capaCursores;

export const colorDe = clave => `hsl(${hueOf(clave)} 75% 45%)`;
export const miColor = () => colorDe(sesion.correo || me());

// Figura con los cambios temporales encima
export function obj(id) {
  const o = id === E.borrador?.id ? E.borrador : E.objetos.get(id);
  if (!o) return null;
  const t = E.temporal.get(id) || pendiente(id);
  return t ? { ...o, ...t } : o;
}
// Cuando otra persona suelta lo que arrastraba (o termina de escribir), su sombra desaparece al instante
// pero el cambio guardado tarda un poco más en llegar. Mientras tanto se muestra ya en su lugar nuevo,
// para que la figura no "salte" de vuelta a la posición vieja.
const pendientes = new Map(); // id → { cambios, hasta }
function pendiente(id) {
  const p = pendientes.get(id);
  if (!p) return null;
  if (Date.now() > p.hasta) { pendientes.delete(id); return null; }
  return p.cambios;
}
export const porOrden = (a, b) => (a.orden || 0) - (b.orden || 0);
export function objetosPagina(pagina = E.pagina) {
  const r = [];
  for (const o of E.objetos.values()) if (o.pagina === pagina && o.tipo) r.push(obj(o.id));
  return r;
}
export const esMarco = o => o?.tipo === 'marco';
// Marco que contiene la figura (si existe en la misma página)
export function padreDe(o) {
  const p = o.padre && E.objetos.get(o.padre);
  return p && p.pagina === o.pagina && esMarco(p) ? obj(p.id) : null;
}
export function hijosDe(id) { return objetosPagina().filter(o => o.padre === id).sort(porOrden); }
export function raices() { return objetosPagina().filter(o => !padreDe(o)).sort(porOrden); }

// Caja visible (los textos que crecen solos se miden en pantalla)
export function cajaDe(o) {
  if (typeof o === 'string') o = obj(o);
  const b = caja(o);
  if (o.tipo === 'texto') {
    const m = medidas.get(o.id);
    if (m) { if (o.autoAncho) b.w = m.w; if (o.autoAlto) b.h = m.h; }
  }
  return b;
}
export function cajaDeVarios(ids) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const id of ids) {
    const o = obj(id); if (!o) continue;
    const b = cajaDe(o);
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h);
  }
  return x1 === Infinity ? null : { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
const dentro = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
const corta = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const contiene = (a, b) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
const redondear = n => Math.round(n);

export function seleccionados() { return [...E.sel].map(obj).filter(Boolean); }
// Al mover un marco se mueven también sus figuras
function conHijos(ids) {
  const r = new Set(ids);
  for (const id of ids) if (esMarco(obj(id))) for (const c of hijosDe(id)) r.add(c.id);
  return r;
}
function miembrosGrupo(o) {
  if (!o.grupo || o.grupo === E.grupoAbierto) return [o.id];
  return objetosPagina().filter(x => x.grupo === o.grupo).map(x => x.id);
}

// ---------- Guardar cambios ----------
// lista: [[id, figura completa | null]]. Guarda solo lo que cambió de cada figura, así dos personas pueden
// cambiar cosas distintas de la misma figura al tiempo.
export function confirmar(lista, { historial = true } = {}) {
  if (E.soloLectura || !lista.length) return;
  const antes = [], escrituras = [];
  for (const [id, despues] of lista) {
    const previo = E.objetos.get(id) || null;
    antes.push([id, previo]);
    if (despues === null) {
      if (!previo) continue;
      E.objetos.delete(id);
      E.sel.delete(id);
      escrituras.push({ id, datos: null });
    } else if (!previo) {
      E.objetos.set(id, despues);
      escrituras.push({ id, datos: despues });
    } else {
      const parcial = {};
      for (const k of new Set([...Object.keys(previo), ...Object.keys(despues)])) {
        if (JSON.stringify(previo[k]) !== JSON.stringify(despues[k])) parcial[k] = despues[k] === undefined ? null : despues[k];
      }
      if (!Object.keys(parcial).length) continue;
      E.objetos.set(id, despues);
      escrituras.push({ id, datos: parcial, parcial: true });
    }
  }
  if (!escrituras.length) return;
  E.ultimoCambioLocal = Date.now();
  if (historial) { E.deshacer.push({ antes, despues: lista }); if (E.deshacer.length > 200) E.deshacer.shift(); E.rehacer = []; }
  guardar(escrituras);
  dibujar();
  emitir('objetos');
}
async function guardar(escrituras) {
  E.guardando++;
  estadoGuardado();
  try { await E.conexion.escribir(escrituras); E.error = false; }
  catch (err) {
    console.error(err);
    E.error = true;
    toast(err.code === 'permission-denied' ? 'No tienes permiso para guardar en este archivo.' : 'No se pudo guardar: ' + (err.message || err));
  } finally { E.guardando--; estadoGuardado(); }
}
function estadoGuardado() {
  const el = $('#estadoGuardado');
  if (!el) return;
  el.classList.toggle('error', E.error);
  el.textContent = E.guardando ? 'Guardando…' : E.error ? 'Sin guardar' : E.almacen?.modo === 'local' ? 'Guardado en este navegador' : 'Guardado';
}
// Cambia propiedades de varias figuras de una vez: cambios = {id: {prop: valor}}
export function cambiar(cambios, opciones) {
  confirmar(Object.entries(cambios).map(([id, p]) => [id, { ...E.objetos.get(id), ...p }]).filter(([, o]) => o.id), opciones);
}
export function deshacer() {
  const paso = E.deshacer.pop(); if (!paso) return;
  confirmar(paso.antes, { historial: false });
  E.rehacer.push(paso);
  limpiarSeleccion();
}
export function rehacer() {
  const paso = E.rehacer.pop(); if (!paso) return;
  confirmar(paso.despues, { historial: false });
  E.deshacer.push(paso);
}
function limpiarSeleccion() {
  for (const id of [...E.sel]) if (!E.objetos.has(id)) E.sel.delete(id);
  emitir('seleccion');
}

// ---------- Cambios de los demás ----------
export function recibirObjetos(cambios) {
  for (const c of cambios) {
    pendientes.delete(c.id);
    if (c.datos === null) { E.objetos.delete(c.id); E.sel.delete(c.id); }
    else if (c.datos.tipo) E.objetos.set(c.id, c.datos);
  }
  dibujar();
  emitir('objetos');
}
export function recibirPresencia(lista) {
  const ahora = Date.now();
  const nuevos = new Map(lista.filter(p => p && p.nombre && (!p.t || ahora - p.t < 120000)).map(p => [p.uid, p]));
  for (const [uid, antes] of E.otros) {
    const ahoraP = nuevos.get(uid);
    for (const [id, d] of Object.entries(antes.arrastre || {})) {
      if (!ahoraP?.arrastre?.[id] && E.objetos.has(id) && !d.tipo) pendientes.set(id, { cambios: d, hasta: ahora + 4000 });
    }
    if (antes.texto && ahoraP?.texto?.id !== antes.texto.id && E.objetos.has(antes.texto.id)) {
      pendientes.set(antes.texto.id, { cambios: { texto: antes.texto.valor }, hasta: ahora + 4000 });
    }
  }
  if (pendientes.size) setTimeout(dibujar, 4100);
  E.otros = nuevos;
  if (E.siguiendo) seguirVista();
  dibujar();
  emitir('presencia');
}

// ---------- Presencia propia ----------
let ultimoEnvio = 0, envioPendiente = null, cursor = null, arrastreVivo = null, textoVivo = null;
export function enviarPresencia() {
  if (!E.conexion) return;
  const espera = (E.almacen.intervaloPresencia || 100) - (Date.now() - ultimoEnvio);
  if (espera > 0) { if (!envioPendiente) envioPendiente = setTimeout(() => { envioPendiente = null; enviarPresencia(); }, espera); return; }
  ultimoEnvio = Date.now();
  const r = lienzo.getBoundingClientRect();
  E.conexion.presencia({
    nombre: me(), correo: sesion.correo || '', color: miColor(), pagina: E.pagina,
    cursor, sel: [...E.sel], arrastre: arrastreVivo, texto: textoVivo,
    vista: { x: E.cam.x, y: E.cam.y, z: E.cam.z, w: r.width, h: r.height }, t: Date.now(),
  });
}

// ---------- Cámara ----------
export function aMundo(cx, cy) {
  const r = lienzo.getBoundingClientRect();
  return { x: (cx - r.left) / E.cam.z + E.cam.x, y: (cy - r.top) / E.cam.z + E.cam.y };
}
export const aPantalla = (x, y) => ({ x: (x - E.cam.x) * E.cam.z, y: (y - E.cam.y) * E.cam.z });
export function zoomEn(z, cx, cy) {
  z = Math.min(64, Math.max(0.02, z));
  const r = lienzo.getBoundingClientRect();
  if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  const p = aMundo(cx, cy);
  E.cam.z = z;
  E.cam.x = p.x - (cx - r.left) / z;
  E.cam.y = p.y - (cy - r.top) / z;
  cambioCamara();
}
export function encuadrar(b, margen = 80, max = 1) {
  if (!b) { E.cam = { x: -100, y: -100, z: 1 }; return cambioCamara(); }
  const r = lienzo.getBoundingClientRect();
  const z = Math.min(max, (r.width - margen * 2) / Math.max(b.w, 1), (r.height - margen * 2) / Math.max(b.h, 1));
  E.cam.z = Math.max(0.02, z);
  E.cam.x = b.x + b.w / 2 - r.width / 2 / E.cam.z;
  E.cam.y = b.y + b.h / 2 - r.height / 2 / E.cam.z;
  cambioCamara();
}
export const verTodo = () => encuadrar(cajaDeVarios(objetosPagina().map(o => o.id)));
export const verSeleccion = () => E.sel.size ? encuadrar(cajaDeVarios(E.sel), 80, 8) : verTodo();
function cambioCamara() {
  camaras.set(E.pagina, { ...E.cam });
  dibujar();
  emitir('camara');
  enviarPresencia();
}
const camaras = new Map();

// Seguir a otra persona: la vista copia la suya hasta que muevas la tuya
export function seguir(uid) {
  E.siguiendo = uid && E.otros.has(uid) ? uid : null;
  const aviso = $('#siguiendo');
  const p = E.otros.get(uid);
  aviso.hidden = !E.siguiendo;
  if (p) { aviso.replaceChildren(h('span', {}, `Siguiendo a ${p.nombre} · Esc o mueve tu vista para dejar de seguir`)); aviso.style.setProperty('--c', p.color); }
  if (E.siguiendo) seguirVista();
  emitir('presencia');
}
function seguirVista() {
  const p = E.otros.get(E.siguiendo);
  if (!p) return seguir(null);
  if (p.pagina && p.pagina !== E.pagina) irAPagina(p.pagina, false);
  const v = p.vista; if (!v) return;
  const r = lienzo.getBoundingClientRect();
  E.cam.z = v.z * Math.min(r.width / v.w, r.height / v.h, 1) || v.z;
  E.cam.x = v.x + v.w / v.z / 2 - r.width / E.cam.z / 2;
  E.cam.y = v.y + v.h / v.z / 2 - r.height / E.cam.z / 2;
  camaras.set(E.pagina, { ...E.cam });
  dibujar();
  emitir('camara');
}
const dejarDeSeguir = () => { if (E.siguiendo) seguir(null); };

// ---------- Páginas ----------
export function paginas() { return E.archivo?.paginas || []; }
export function irAPagina(id, centrar = true) {
  if (!paginas().some(p => p.id === id)) id = paginas()[0]?.id;
  if (E.pagina === id) return;
  terminarTexto();
  E.pagina = id;
  E.sel.clear();
  E.grupoAbierto = null;
  const url = new URL(location.href); url.searchParams.set('pagina', id); history.replaceState(null, '', url);
  const guardada = camaras.get(id);
  if (guardada) { E.cam = { ...guardada }; dibujar(); } else if (centrar) verTodo();
  emitir('pagina'); emitir('seleccion');
  enviarPresencia();
}
async function guardarPaginas(lista) {
  E.archivo = { ...E.archivo, paginas: lista };
  emitir('pagina');
  try { await E.almacen.actualizarArchivo(E.archivoId, { paginas: lista }); } catch (err) { console.error(err); toast('No se pudo guardar la página.'); }
}
export function agregarPagina(nombre) {
  const p = { id: nuevoId(), nombre: nombre || `Página ${paginas().length + 1}` };
  guardarPaginas([...paginas(), p]);
  irAPagina(p.id);
}
export function renombrarPagina(id, nombre) { guardarPaginas(paginas().map(p => p.id === id ? { ...p, nombre } : p)); }
export function cambiarPagina(id, props) { guardarPaginas(paginas().map(p => p.id === id ? { ...p, ...props } : p)); dibujar(); }
export function duplicarPagina(id) {
  const orig = paginas().find(p => p.id === id); if (!orig) return;
  const nueva = { ...orig, id: nuevoId(), nombre: orig.nombre + ' (copia)' };
  const lista = paginas(); lista.splice(lista.indexOf(orig) + 1, 0, nueva);
  guardarPaginas([...lista]);
  const copia = clonar(objetosPagina(id).map(o => E.objetos.get(o.id)), 0, 0, nueva.id);
  confirmar(copia.map(o => [o.id, o]));
  irAPagina(nueva.id);
}
export function eliminarPagina(id) {
  if (paginas().length <= 1) return toast('El archivo necesita al menos una página.');
  confirmar(objetosPagina(id).map(o => [o.id, null]));
  const lista = paginas().filter(p => p.id !== id);
  guardarPaginas(lista);
  if (E.pagina === id) irAPagina(lista[0].id);
}
export function moverPagina(id, paso) {
  const lista = [...paginas()];
  const i = lista.findIndex(p => p.id === id), j = i + paso;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  guardarPaginas(lista);
}
export function recibirArchivo(datos) {
  E.archivo = datos;
  if (!paginas().some(p => p.id === E.pagina)) irAPagina(paginas()[0]?.id);
  emitir('archivo'); emitir('pagina');
  dibujar();
}

// ---------- Selección ----------
export function seleccionar(ids, sumar = false) {
  if (!sumar) E.sel.clear();
  for (const id of ids) E.sel.add(id);
  if (E.grupoAbierto && ![...E.sel].some(id => obj(id)?.grupo === E.grupoAbierto)) E.grupoAbierto = null;
  emitir('seleccion');
  dibujar();
  enviarPresencia();
}
export function seleccionarTodo() { seleccionar(raices().filter(o => o.visible !== false && !o.bloqueado).map(o => o.id)); }

// ---------- Dibujo ----------
let pedido = false;
export function dibujar() {
  if (pedido) return;
  pedido = true;
  requestAnimationFrame(() => { pedido = false; dibujarAhora(); });
}
function escribiendoOtro(id) {
  for (const p of E.otros.values()) if (p.pagina === E.pagina && p.texto?.id === id) return p;
  return null;
}
function dibujarAhora() {
  if (!mundo || !E.pagina) return;
  const { x, y, z } = E.cam;
  const tr = `translate(${-x * z}px, ${-y * z}px) scale(${z})`;
  mundo.style.transform = tr;
  capaFantasmas.style.transform = tr;
  const pag = paginas().find(p => p.id === E.pagina);
  lienzo.style.setProperty('--fondo-pagina', pag?.fondo || '');
  lienzo.style.backgroundPosition = `${-x * z}px ${-y * z}px`;

  const vivos = new Set();
  const lista = raices();
  if (E.borrador && !E.borrador.padre) lista.push(E.borrador);
  colocarEn(mundo, lista, 0, 0, vivos);
  for (const m of lista) {
    if (!esMarco(m)) continue;
    const hijos = hijosDe(m.id);
    if (E.borrador?.padre === m.id) hijos.push(E.borrador);
    colocarEn(nodos.get(m.id).querySelector('.hijos'), hijos, m.x, m.y, vivos);
  }
  for (const [id, el] of nodos) if (!vivos.has(id)) { el.remove(); nodos.delete(id); medidas.delete(id); }
  // Medir los textos que crecen solos
  for (const id of vivos) {
    const o = obj(id);
    if (o?.tipo === 'texto' && (o.autoAncho || o.autoAlto)) {
      const el = nodos.get(id);
      medidas.set(id, { w: el.offsetWidth, h: el.offsetHeight });
    }
  }
  dibujarFantasmas();
  dibujarCursores();
  dibujarUI();
}
function colocarEn(cont, lista, ox, oy, vivos) {
  lista.forEach((o, i) => {
    let el = nodos.get(o.id);
    if (!el || el.dataset.tipo !== o.tipo) { el?.remove(); el = crearNodo(o); nodos.set(o.id, el); }
    pintar(el, o, ox, oy);
    el.style.visibility = escribiendoOtro(o.id) ? 'hidden' : '';
    if (cont.children[i] !== el) cont.insertBefore(el, cont.children[i] || null);
    vivos.add(o.id);
  });
  // Lo que sobra en el contenedor (figuras que se fueron a otro marco) se quita al final
  while (cont.children.length > lista.length) {
    const ult = cont.lastElementChild;
    if (!lista.some(o => o.id === ult.dataset.id)) ult.remove(); else break;
  }
}

// Sombras de lo que los demás están arrastrando o escribiendo
const nodosFantasma = new Map();
function dibujarFantasmas() {
  const vivos = new Set();
  const etiquetas = [];
  for (const [uid, p] of E.otros) {
    if (p.pagina !== E.pagina) continue;
    const poner = (o, extra) => {
      const clave = uid + ':' + o.id;
      let el = nodosFantasma.get(clave);
      if (!el || el.dataset.tipo !== o.tipo) { el?.remove(); el = crearNodo(o); el.classList.add('fantasma'); nodosFantasma.set(clave, el); capaFantasmas.append(el); }
      pintar(el, o, 0, 0);
      el.classList.toggle('escribiendo', !!extra);
      el.style.setProperty('--c', p.color);
      el.style.zIndex = extra ? 5 : 1;
      vivos.add(clave);
      return el;
    };
    if (p.arrastre) {
      let b = null;
      for (const [id, d] of Object.entries(p.arrastre)) {
        const base = d.tipo ? d : E.objetos.get(id);
        if (!base) continue;
        const o = { ...base, ...d, id };
        if (o.tipo === 'texto' && !d.tipo) { o.autoAncho = false; o.autoAlto = false; const m = medidas.get(id); if (m) { if (base.autoAncho) o.w = m.w; if (base.autoAlto) o.h = m.h; } }
        if (esMarco(o)) o.relleno = o.relleno || '#fff';
        poner(o);
        const c = caja(o);
        b = b ? { x: Math.min(b.x, c.x), y: Math.min(b.y, c.y) } : { x: c.x, y: c.y };
      }
      if (b) etiquetas.push({ ...b, nombre: p.nombre, color: p.color, texto: 'moviendo' });
    }
    if (p.texto && E.objetos.get(p.texto.id)) {
      const o = { ...obj(p.texto.id), texto: p.texto.valor };
      const el = poner(o, true);
      el.firstChild.textContent = p.texto.valor;
      etiquetas.push({ x: o.x, y: o.y, nombre: p.nombre, color: p.color, texto: 'escribiendo…' });
    }
  }
  for (const [clave, el] of nodosFantasma) if (!vivos.has(clave)) { el.remove(); nodosFantasma.delete(clave); }
  fantasmaEtiquetas = etiquetas;
}
let fantasmaEtiquetas = [];

const nodosCursor = new Map();
function dibujarCursores() {
  const vivos = new Set();
  for (const [uid, p] of E.otros) {
    if (p.pagina !== E.pagina || !p.cursor) continue;
    let el = nodosCursor.get(uid);
    if (!el) {
      el = h('div', { class: 'cursor-otro' },
        h('svg', { viewBox: '0 0 16 20', width: 16, height: 20 }),
        h('span', { class: 'cursor-nombre' }));
      el.firstChild.innerHTML = '<path d="M1 1l13 10.5-6 .7-3.3 5.8z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>';
      capaCursores.append(el);
      nodosCursor.set(uid, el);
    }
    el.style.setProperty('--c', p.color);
    el.style.setProperty('--dur', (E.almacen.intervaloPresencia || 100) + 'ms');
    const s = aPantalla(p.cursor.x, p.cursor.y);
    el.style.transform = `translate(${s.x}px, ${s.y}px)`;
    el.lastChild.textContent = p.nombre + (p.texto ? ' · escribiendo…' : p.arrastre ? ' · moviendo' : '');
    vivos.add(uid);
  }
  for (const [uid, el] of nodosCursor) if (!vivos.has(uid)) { el.remove(); nodosCursor.delete(uid); }
}

// Capa de interfaz (en pantalla, no en el mundo): selección, manijas, guías, nombres de marcos
function dibujarUI() {
  const z = E.cam.z;
  const piezas = [];
  const rect = (b, clase, estilo = '') => {
    const s = aPantalla(b.x, b.y);
    return `<div class="${clase}" style="left:${s.x}px;top:${s.y}px;width:${b.w * z}px;height:${b.h * z}px;${estilo}"></div>`;
  };
  // Nombres de los marcos
  for (const m of raices()) {
    if (!esMarco(m) || m.visible === false) continue;
    const s = aPantalla(m.x, m.y);
    const sel = E.sel.has(m.id);
    piezas.push(`<div class="etiqueta-marco${sel ? ' sel' : ''}" data-marco="${m.id}" style="left:${s.x}px;top:${s.y - 20}px;max-width:${Math.max(m.w * z, 40)}px">${esc(m.nombre)}</div>`);
  }
  // Selección de los demás
  for (const p of E.otros.values()) {
    if (p.pagina !== E.pagina || !p.sel?.length) continue;
    for (const id of p.sel) {
      const o = obj(id); if (!o) continue;
      piezas.push(rect(cajaDe(o), 'sel-otro', `--c:${p.color}`));
    }
  }
  for (const et of fantasmaEtiquetas) {
    const s = aPantalla(et.x, et.y);
    piezas.push(`<div class="etiqueta-fantasma" style="left:${s.x}px;top:${s.y - 22}px;--c:${et.color}">${esc(et.nombre)} ${et.texto}</div>`);
  }
  if (E.hover && !E.sel.has(E.hover) && obj(E.hover)) piezas.push(rect(cajaDe(E.hover), 'hover'));
  // Selección propia
  const ids = [...E.sel].filter(id => obj(id));
  if (ids.length) {
    if (ids.length > 1) for (const id of ids) piezas.push(rect(cajaDe(id), 'sel-una'));
    const b = cajaDeVarios(ids);
    const unica = ids.length === 1 ? obj(ids[0]) : null;
    const rot = unica?.rot ? `transform:rotate(${unica.rot}deg)` : '';
    piezas.push(rect(b, 'sel-caja', rot));
    if (!E.editando && !arrastre?.moviendo) {
      if (unica?.tipo === 'linea') {
        for (const [asa, px, py] of [['ini', unica.x, unica.y], ['fin', unica.x + unica.w, unica.y + unica.h]]) {
          const s = aPantalla(px, py);
          piezas.push(`<div class="asa" data-asa="${asa}" style="left:${s.x}px;top:${s.y}px"></div>`);
        }
      } else if (!unica?.bloqueado) {
        const pts = { nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] };
        const chico = b.w * z < 30 || b.h * z < 30;
        for (const [asa, [fx, fy]] of Object.entries(pts)) {
          if (chico && asa.length === 1) continue;
          const s = aPantalla(b.x + b.w * fx, b.y + b.h * fy);
          piezas.push(`<div class="asa" data-asa="${asa}" style="left:${s.x}px;top:${s.y}px"></div>`);
        }
      }
      const s = aPantalla(b.x + b.w / 2, b.y + b.h);
      piezas.push(`<div class="medida" style="left:${s.x}px;top:${s.y + 8}px">${redondear(b.w)} × ${redondear(b.h)}</div>`);
    }
  }
  for (const g of E.guias) {
    const a = aPantalla(g.x1, g.y1), c = aPantalla(g.x2, g.y2);
    piezas.push(`<div class="guia" style="left:${Math.min(a.x, c.x)}px;top:${Math.min(a.y, c.y)}px;width:${Math.max(Math.abs(c.x - a.x), 1)}px;height:${Math.max(Math.abs(c.y - a.y), 1)}px"></div>`);
  }
  if (E.marquesina) piezas.push(rect(E.marquesina, 'marquesina'));
  capaUI.innerHTML = piezas.join('');
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Crear figuras ----------
function siguienteOrden() {
  let m = 0;
  for (const o of E.objetos.values()) if (o.pagina === E.pagina) m = Math.max(m, o.orden || 0);
  return m + 1;
}
// Marco de más arriba que contiene el punto (para saber dónde cae una figura)
export function marcoEn(x, y, excluir = new Set()) {
  const ms = raices().filter(o => esMarco(o) && !excluir.has(o.id) && o.visible !== false).reverse();
  return ms.find(m => dentro(cajaDe(m), x, y)) || null;
}
export function agregar(figuras, { seleccionarlas = true } = {}) {
  let orden = siguienteOrden();
  const lista = figuras.map(o => ({ ...o, pagina: E.pagina, orden: orden++, creadoPor: sesion.correo || me() }));
  confirmar(lista.map(o => [o.id, o]));
  if (seleccionarlas) {
    const raiz = lista.filter(o => !lista.some(p => p.id === o.padre));
    seleccionar(raiz.map(o => o.id));
  }
  return lista;
}
// Copia figuras con ids nuevos (grupos y marcos incluidos), movidas (dx, dy)
function clonar(lista, dx, dy, pagina = E.pagina) {
  const ids = new Map(lista.map(o => [o.id, nuevoId()]));
  const grupos = new Map();
  return lista.map(o => ({
    ...structuredClone(o), id: ids.get(o.id), pagina, x: o.x + dx, y: o.y + dy,
    padre: o.padre ? ids.get(o.padre) || o.padre : null,
    grupo: o.grupo ? (grupos.get(o.grupo) || grupos.set(o.grupo, nuevoId()).get(o.grupo)) : null,
  }));
}

// ---------- Herramientas ----------
export const HERRAMIENTAS = [
  ['mover', 'Mover', 'V', '<path d="M5 3l14 8-6 1.5L10 19z"/>'],
  ['marco', 'Marco', 'F', '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>'],
  ['rect', 'Rectángulo', 'R', '<rect x="4" y="5" width="16" height="14" rx="1.5"/>'],
  ['elipse', 'Elipse', 'O', '<circle cx="12" cy="12" r="8"/>'],
  ['linea', 'Línea', 'L', '<path d="M5 19L19 5"/>'],
  ['flecha', 'Flecha', 'Shift+L', '<path d="M5 19L19 5M10 5h9v9"/>'],
  ['texto', 'Texto', 'T', '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'],
  ['imagen', 'Imagen', 'Shift+Ctrl+K', '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>'],
  ['mano', 'Mano (o mantener Espacio)', 'H', '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4a1.5 1.5 0 0 1 3 0v8M14 11.5V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4.3 14a1.5 1.5 0 0 1 2.5-1.6L8 14"/>'],
];
export function usarHerramienta(herr) {
  if (herr === 'imagen') { $('#elegirImagen').click(); herr = 'mover'; }
  E.herr = herr;
  lienzo.dataset.herr = herr;
  emitir('herramienta');
}

// ---------- Arrastres (mover, redimensionar, dibujar, marquesina, desplazar) ----------
let arrastre = null;
const punteros = new Map(); // para pellizcar con dos dedos

function alPresionar(e) {
  if (e.target.closest('.barra-herr, .zoom-ctrl, .siguiendo')) return;
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (punteros.size === 2) { arrastre = { modo: 'pellizco', ...pellizco() }; return; }
  if (E.editando && !e.target.closest('.txt[contenteditable]')) terminarTexto();
  if (E.editando) return;
  dejarDeSeguir();
  lienzo.focus({ preventScroll: true });
  const p = aMundo(e.clientX, e.clientY);
  const base = { x0: e.clientX, y0: e.clientY, p0: p, alt: e.altKey, shift: e.shiftKey, id: e.pointerId };
  if (e.button === 1 || E.espacio || E.herr === 'mano') {
    arrastre = { ...base, modo: 'camara', cam0: { ...E.cam } };
  } else if (e.button !== 0) {
    return;
  } else if (e.target.dataset.asa) {
    iniciarRedimension(base, e.target.dataset.asa);
  } else if (e.target.dataset.marco) {
    const id = e.target.dataset.marco;
    if (e.shiftKey) seleccionar(E.sel.has(id) ? [...E.sel].filter(x => x !== id) : [...E.sel, id]);
    else if (!E.sel.has(id)) seleccionar([id]);
    arrastre = { ...base, modo: 'mover' };
  } else if (['marco', 'rect', 'elipse', 'linea', 'flecha', 'texto'].includes(E.herr)) {
    arrastre = { ...base, modo: 'dibujar', herr: E.herr };
  } else {
    const o = figuraEn(e.target);
    if (o && !(esMarco(o) && hijosDe(o.id).length && !E.sel.has(o.id))) {
      const ids = miembrosGrupo(o);
      if (e.shiftKey) {
        const ya = ids.every(id => E.sel.has(id));
        seleccionar(ya ? [...E.sel].filter(x => !ids.includes(x)) : [...E.sel, ...ids]);
      } else if (!E.sel.has(o.id)) seleccionar(ids);
      arrastre = { ...base, modo: 'mover' };
    } else {
      if (!e.shiftKey) seleccionar([]);
      arrastre = { ...base, modo: 'marquesina', previa: e.shiftKey ? [...E.sel] : [] };
    }
  }
  lienzo.setPointerCapture(e.pointerId);
}
function figuraEn(target) {
  const el = target.closest?.('#mundo [data-id]');
  if (!el) return null;
  const o = obj(el.dataset.id);
  return o && !o.bloqueado ? o : null;
}

function alMover(e) {
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const p = aMundo(e.clientX, e.clientY);
  cursor = { x: Math.round(p.x), y: Math.round(p.y) };
  if (!arrastre) {
    const o = E.herr === 'mover' && !E.espacio ? figuraEn(e.target) : null;
    const nuevo = o ? (o.grupo && o.grupo !== E.grupoAbierto ? null : o.id) : null;
    if (nuevo !== E.hover) { E.hover = nuevo; dibujar(); }
    enviarPresencia();
    return;
  }
  const a = arrastre;
  const dx = (e.clientX - a.x0) / E.cam.z, dy = (e.clientY - a.y0) / E.cam.z;
  const lejos = Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 3;
  switch (a.modo) {
    case 'pellizco': {
      const n = pellizco();
      if (!n) break;
      const r = lienzo.getBoundingClientRect();
      const z = Math.min(64, Math.max(0.02, a.cam0z * n.d / a.d));
      const mundoCentro = { x: (a.cx - r.left) / a.cam0z + a.cam0x, y: (a.cy - r.top) / a.cam0z + a.cam0y };
      E.cam = { z, x: mundoCentro.x - (n.cx - r.left) / z, y: mundoCentro.y - (n.cy - r.top) / z };
      cambioCamara();
      break;
    }
    case 'camara':
      E.cam.x = a.cam0.x - dx; E.cam.y = a.cam0.y - dy;
      cambioCamara();
      break;
    case 'mover':
      if (!a.moviendo && !lejos) break;
      if (!a.moviendo) iniciarMovimiento(a, e.altKey);
      moverSeleccion(a, dx, dy, e);
      break;
    case 'redimensionar': redimensionar(a, p, e); break;
    case 'dibujar': if (lejos || a.borrador) dibujarFigura(a, p, e); break;
    case 'marquesina': {
      if (!lejos) break;
      const b = { x: Math.min(a.p0.x, p.x), y: Math.min(a.p0.y, p.y), w: Math.abs(p.x - a.p0.x), h: Math.abs(p.y - a.p0.y) };
      E.marquesina = b;
      const dentroDe = [];
      for (const o of objetosPagina()) {
        if (o.bloqueado || o.visible === false) continue;
        const ob = cajaDe(o);
        if (esMarco(o) ? contiene(b, ob) : corta(b, ob)) dentroDe.push(o);
      }
      const marcos = new Set(dentroDe.filter(esMarco).map(o => o.id));
      const ids = new Set(a.previa);
      for (const o of dentroDe) if (!marcos.has(o.padre)) for (const id of miembrosGrupo(o)) ids.add(id);
      seleccionar([...ids]);
      break;
    }
  }
  enviarPresencia();
}

function alSoltar(e) {
  punteros.delete(e.pointerId);
  const a = arrastre;
  if (!a || (a.id !== e.pointerId && a.modo !== 'pellizco')) return;
  arrastre = null;
  E.guias = [];
  E.marquesina = null;
  if (a.modo === 'mover' && a.moviendo) terminarMovimiento(a);
  if (a.modo === 'redimensionar') terminarTemporal(a.ids);
  if (a.modo === 'dibujar') terminarDibujo(a, aMundo(e.clientX, e.clientY));
  arrastreVivo = null;
  ultimoEnvio = 0; // al soltar se avisa de inmediato, sin esperar el siguiente envío
  enviarPresencia();
  dibujar();
  emitir('seleccion');
}

function pellizco() {
  const [a, b] = [...punteros.values()];
  if (!a || !b) return null;
  return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, cam0z: E.cam.z, cam0x: E.cam.x, cam0y: E.cam.y };
}

// --- Mover ---
function iniciarMovimiento(a, duplicar) {
  a.moviendo = true;
  ultimoEnvio = 0;
  let ids = [...E.sel].filter(id => !obj(id)?.bloqueado);
  if (duplicar) {
    // Alt + arrastrar: se mueve una copia
    const originales = [...conHijos(ids)].map(id => E.objetos.get(id));
    const copia = clonar(originales, 0, 0);
    let orden = siguienteOrden();
    confirmar(copia.map(o => [o.id, { ...o, orden: orden++ }]));
    const raizCopia = copia.filter(o => !copia.some(p => p.id === o.padre)).map(o => o.id);
    E.sel = new Set(raizCopia);
    ids = raizCopia;
  }
  a.ids = [...conHijos(ids)];
  a.inicio = new Map(a.ids.map(id => [id, { x: obj(id).x, y: obj(id).y }]));
  a.caja0 = cajaDeVarios(ids);
  a.raiz = new Set(ids);
  const mov = new Set(a.ids);
  a.objetivos = objetosPagina().filter(o => !mov.has(o.id) && o.visible !== false).map(o => cajaDe(o));
}
function moverSeleccion(a, dx, dy, e) {
  if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
  let b = { ...a.caja0, x: a.caja0.x + dx, y: a.caja0.y + dy };
  E.guias = [];
  if (!(e.ctrlKey || e.metaKey)) {
    const aj = ajustar(b, a.objetivos, ['x', 'cx', 'r'], ['y', 'cy', 'b']);
    dx += aj.dx; dy += aj.dy;
    b = { ...a.caja0, x: a.caja0.x + dx, y: a.caja0.y + dy };
    E.guias = guiasDe(b, aj, a.objetivos);
  }
  dx = Math.round(a.caja0.x + dx) - a.caja0.x; dy = Math.round(a.caja0.y + dy) - a.caja0.y;
  for (const id of a.ids) { const i = a.inicio.get(id); E.temporal.set(id, { x: i.x + dx, y: i.y + dy }); }
  arrastreVivo = Object.fromEntries(a.ids.map(id => [id, E.temporal.get(id)]));
  dibujar();
}
function terminarMovimiento(a) {
  // Al soltar, cada figura queda dentro del marco sobre el que cayó
  const lista = [];
  for (const id of a.ids) {
    const o = { ...E.objetos.get(id), ...E.temporal.get(id) };
    if (a.raiz.has(id) && !esMarco(o)) {
      const b = cajaDe(o);
      const m = marcoEn(b.x + b.w / 2, b.y + b.h / 2, new Set(a.ids));
      o.padre = m ? m.id : null;
    }
    lista.push([id, o]);
  }
  E.temporal.clear();
  confirmar(lista);
}
function terminarTemporal(ids) {
  const lista = ids.map(id => [id, { ...E.objetos.get(id), ...E.temporal.get(id) }]);
  E.temporal.clear();
  confirmar(lista);
}

// Guías inteligentes: busca bordes y centros cercanos de otras figuras
function ajustar(b, objetivos, ejesX, ejesY, umbral = 6 / E.cam.z) {
  const val = (c, k) => ({ x: c.x, cx: c.x + c.w / 2, r: c.x + c.w, y: c.y, cy: c.y + c.h / 2, b: c.y + c.h }[k]);
  let mejorX = null, mejorY = null;
  for (const t of objetivos) {
    for (const k of ejesX) for (const kt of ['x', 'cx', 'r']) {
      const d = val(t, kt) - val(b, k);
      if (Math.abs(d) <= umbral && (!mejorX || Math.abs(d) < Math.abs(mejorX.d))) mejorX = { d, pos: val(t, kt) };
    }
    for (const k of ejesY) for (const kt of ['y', 'cy', 'b']) {
      const d = val(t, kt) - val(b, k);
      if (Math.abs(d) <= umbral && (!mejorY || Math.abs(d) < Math.abs(mejorY.d))) mejorY = { d, pos: val(t, kt) };
    }
  }
  return { dx: mejorX?.d || 0, dy: mejorY?.d || 0, x: mejorX?.pos, y: mejorY?.pos };
}
function guiasDe(b, aj, objetivos) {
  const g = [];
  const cerca = (v, a, c) => Math.abs(v - a) < 0.5 || Math.abs(v - c) < 0.5;
  if (aj.x != null) {
    let y1 = b.y, y2 = b.y + b.h;
    for (const t of objetivos) if (cerca(aj.x, t.x, t.x + t.w) || Math.abs(aj.x - (t.x + t.w / 2)) < 0.5) { y1 = Math.min(y1, t.y); y2 = Math.max(y2, t.y + t.h); }
    g.push({ x1: aj.x, y1, x2: aj.x, y2 });
  }
  if (aj.y != null) {
    let x1 = b.x, x2 = b.x + b.w;
    for (const t of objetivos) if (cerca(aj.y, t.y, t.y + t.h) || Math.abs(aj.y - (t.y + t.h / 2)) < 0.5) { x1 = Math.min(x1, t.x); x2 = Math.max(x2, t.x + t.w); }
    g.push({ x1, y1: aj.y, x2, y2: aj.y });
  }
  return g;
}

// --- Redimensionar ---
function iniciarRedimension(base, asa) {
  const ids = [...E.sel].filter(id => obj(id));
  const unica = ids.length === 1 ? obj(ids[0]) : null;
  const a = arrastre = { ...base, modo: 'redimensionar', asa, ids, linea: unica?.tipo === 'linea' };
  a.caja0 = cajaDeVarios(ids);
  a.inicio = new Map(ids.map(id => [id, { ...obj(id), ...cajaDe(id), w0: obj(id).w, h0: obj(id).h, x0: obj(id).x, y0: obj(id).y }]));
  const sel = new Set(conHijos(ids));
  a.objetivos = objetosPagina().filter(o => !sel.has(o.id) && o.visible !== false).map(o => cajaDe(o));
}
function redimensionar(a, p, e) {
  E.guias = [];
  if (a.linea) {
    const o = a.inicio.get(a.ids[0]);
    let x = p.x, y = p.y;
    const ox = a.asa === 'ini' ? o.x0 + o.w0 : o.x0, oy = a.asa === 'ini' ? o.y0 + o.h0 : o.y0;
    if (e.shiftKey) ({ x, y } = angulo45(ox, oy, x, y));
    x = Math.round(x); y = Math.round(y);
    E.temporal.set(o.id, a.asa === 'ini' ? { x, y, w: ox - x, h: oy - y } : { w: x - ox, h: y - oy });
    arrastreVivo = { [o.id]: E.temporal.get(o.id) };
    return dibujar();
  }
  const c = a.caja0;
  let x1 = c.x, y1 = c.y, x2 = c.x + c.w, y2 = c.y + c.h;
  const s = a.asa;
  let px = p.x, py = p.y;
  if (!(e.ctrlKey || e.metaKey)) {
    const aj = ajustar({ x: px, y: py, w: 0, h: 0 }, a.objetivos, s.includes('w') || s.includes('e') ? ['x'] : [], s.includes('n') || s.includes('s') ? ['y'] : []);
    px += aj.dx; py += aj.dy;
    if (aj.x != null) E.guias.push({ x1: aj.x, y1: Math.min(y1, py) - 20, x2: aj.x, y2: Math.max(y2, py) + 20 });
    if (aj.y != null) E.guias.push({ x1: Math.min(x1, px) - 20, y1: aj.y, x2: Math.max(x2, px) + 20, y2: aj.y });
  }
  if (s.includes('w')) x1 = px; if (s.includes('e')) x2 = px;
  if (s.includes('n')) y1 = py; if (s.includes('s')) y2 = py;
  if (e.altKey) { // desde el centro
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    if (s.includes('w') || s.includes('e')) { const d = Math.abs((s.includes('w') ? x1 : x2) - cx); x1 = cx - d; x2 = cx + d; }
    if (s.includes('n') || s.includes('s')) { const d = Math.abs((s.includes('n') ? y1 : y2) - cy); y1 = cy - d; y2 = cy + d; }
  }
  let w = Math.max(1, Math.abs(x2 - x1)), hh = Math.max(1, Math.abs(y2 - y1));
  const ratio = c.w / Math.max(c.h, 1);
  const unica = a.ids.length === 1 ? E.objetos.get(a.ids[0]) : null;
  if (e.shiftKey || unica?.tipo === 'imagen' && !e.shiftKey && false || unica?.proporcion) {
    if (s.length === 2) { if (w / hh > ratio) hh = w / ratio; else w = hh * ratio; }
    else if (s === 'n' || s === 's') w = hh * ratio; else hh = w / ratio;
  }
  let nx = Math.min(x1, x2), ny = Math.min(y1, y2);
  if (s.includes('w') && !e.altKey) nx = c.x + c.w - w;
  if (s.includes('n') && !e.altKey) ny = c.y + c.h - hh;
  if (s.length === 1 && (s === 'n' || s === 's') && e.shiftKey) nx = c.x + (c.w - w) / 2;
  if (s.length === 1 && (s === 'e' || s === 'w') && e.shiftKey) ny = c.y + (c.h - hh) / 2;
  const nueva = { x: Math.round(nx), y: Math.round(ny), w: Math.round(w), h: Math.round(hh) };
  const kx = nueva.w / Math.max(c.w, 1), ky = nueva.h / Math.max(c.h, 1);
  for (const id of a.ids) {
    const o = a.inicio.get(id);
    const t = { x: Math.round(nueva.x + (o.x - c.x) * kx), y: Math.round(nueva.y + (o.y - c.y) * ky), w: Math.max(1, Math.round(o.w * kx)), h: Math.max(1, Math.round(o.h * ky)) };
    if (o.tipo === 'linea') { t.w = Math.round(o.w0 * kx); t.h = Math.round(o.h0 * ky); t.x = Math.round(nueva.x + (o.x0 - c.x) * kx); t.y = Math.round(nueva.y + (o.y0 - c.y) * ky); }
    if (o.tipo === 'texto') {
      if (s.includes('e') || s.includes('w')) t.autoAncho = false;
      if (s.includes('n') || s.includes('s')) t.autoAlto = false;
      if (!t.autoAncho && o.autoAncho) t.w = Math.max(1, Math.round(o.w * kx));
    }
    E.temporal.set(id, t);
  }
  arrastreVivo = Object.fromEntries(a.ids.map(id => [id, E.temporal.get(id)]));
  dibujar();
}
function angulo45(ox, oy, x, y) {
  const ang = Math.round(Math.atan2(y - oy, x - ox) / (Math.PI / 4)) * (Math.PI / 4);
  const d = Math.hypot(x - ox, y - oy);
  return { x: ox + Math.cos(ang) * d, y: oy + Math.sin(ang) * d };
}

// --- Dibujar una figura nueva ---
function dibujarFigura(a, p, e) {
  const tipo = a.herr === 'flecha' ? 'linea' : a.herr;
  if (!a.borrador) {
    const m = tipo === 'marco' ? null : marcoEn(a.p0.x, a.p0.y);
    a.borrador = figuraNueva(tipo, { padre: m?.id || null, pagina: E.pagina, orden: siguienteOrden(), ...(a.herr === 'flecha' ? { flechaFin: true, nombre: 'Flecha' } : {}) });
    if (tipo === 'texto') Object.assign(a.borrador, { autoAncho: false, texto: '' });
    E.borrador = a.borrador;
    E.sel.clear();
  }
  const o = a.borrador;
  if (tipo === 'linea') {
    let { x, y } = e.shiftKey ? angulo45(a.p0.x, a.p0.y, p.x, p.y) : p;
    Object.assign(o, { x: Math.round(a.p0.x), y: Math.round(a.p0.y), w: Math.round(x - a.p0.x), h: Math.round(y - a.p0.y) });
  } else {
    let w = Math.abs(p.x - a.p0.x), hh = Math.abs(p.y - a.p0.y);
    if (e.shiftKey) w = hh = Math.max(w, hh);
    const x = p.x < a.p0.x ? a.p0.x - w : a.p0.x, y = p.y < a.p0.y ? a.p0.y - hh : a.p0.y;
    Object.assign(o, { x: Math.round(x), y: Math.round(y), w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(hh)) });
  }
  arrastreVivo = { [o.id]: { ...o } };
  dibujar();
}
function terminarDibujo(a, p) {
  const tipo = a.herr === 'flecha' ? 'linea' : a.herr;
  let o = a.borrador;
  E.borrador = null;
  if (!o) {
    // Un clic sin arrastrar: figura de tamaño normal
    const m = tipo === 'marco' ? null : marcoEn(p.x, p.y);
    const tam = { marco: [390, 844], rect: [100, 100], elipse: [100, 100], linea: [160, 0], texto: [200, 24] }[tipo];
    o = figuraNueva(tipo, { padre: m?.id || null, x: Math.round(p.x), y: Math.round(p.y), w: tam[0], h: tam[1], ...(a.herr === 'flecha' ? { flechaFin: true, nombre: 'Flecha' } : {}) });
    if (tipo === 'marco') o.nombre = 'Celular';
    if (tipo === 'texto') Object.assign(o, { texto: '', autoAncho: true });
  }
  const [nuevo] = agregar([o]);
  // Un marco nuevo adopta las figuras sueltas que quedaron dentro de él
  if (tipo === 'marco') {
    const b = cajaDe(nuevo);
    const adoptar = raices().filter(x => !esMarco(x) && x.id !== nuevo.id && contiene(b, cajaDe(x)));
    if (adoptar.length) {
      const paso = E.deshacer.pop();
      confirmar(adoptar.map(x => [x.id, { ...E.objetos.get(x.id), padre: nuevo.id }]));
      const paso2 = E.deshacer.pop();
      E.deshacer.push({ antes: [...paso.antes, ...paso2.antes], despues: [...paso.despues, ...paso2.despues] });
    }
  }
  usarHerramienta('mover');
  if (tipo === 'texto') editarTexto(nuevo.id, true);
}

// ---------- Edición de texto ----------
export function editarTexto(id, nuevo = false) {
  const o = obj(id);
  if (!o || o.tipo !== 'texto' || o.bloqueado || E.soloLectura) return;
  terminarTexto();
  const el = nodos.get(id);
  if (!el) return dibujar();
  const t = el.firstChild;
  try { t.contentEditable = 'plaintext-only'; } catch { t.contentEditable = 'true'; }
  if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
  t.spellcheck = false;
  E.editando = id;
  E.editandoNuevo = nuevo;
  seleccionar([id]);
  t.focus();
  const rango = document.createRange();
  rango.selectNodeContents(t);
  const s = getSelection(); s.removeAllRanges(); s.addRange(rango);
  t.oninput = () => {
    textoVivo = { id, valor: t.innerText.replace(/\n$/, '') };
    medidas.set(id, { w: el.offsetWidth, h: el.offsetHeight });
    enviarPresencia();
    dibujarUI();
  };
  t.onkeydown = e => {
    e.stopPropagation();
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); terminarTexto(); }
  };
  t.onblur = () => setTimeout(() => { if (E.editando === id) terminarTexto(); }, 0);
  textoVivo = { id, valor: t.innerText };
  enviarPresencia();
  dibujarUI();
}
export function terminarTexto() {
  const id = E.editando;
  if (!id) return;
  E.editando = null;
  textoVivo = null;
  const el = nodos.get(id);
  const t = el?.firstChild;
  const o = E.objetos.get(id);
  if (!t || !o) return;
  const valor = t.innerText.replace(/\n$/, '');
  t.contentEditable = 'false';
  t.removeAttribute('contenteditable');
  t.oninput = t.onkeydown = t.onblur = null;
  getSelection().removeAllRanges();
  if (!valor.trim()) {
    // Un texto vacío se elimina (si era nuevo, ni siquiera queda en el historial)
    confirmar([[id, null]], { historial: !E.editandoNuevo });
    if (E.editandoNuevo) E.deshacer.pop();
  } else {
    const m = { w: el.offsetWidth, h: el.offsetHeight };
    const nuevo = { ...o, texto: valor };
    // Como en Figma, la capa de un texto se llama como lo que dice (si nadie le cambió el nombre)
    if (!o.nombre || o.nombre === 'Texto' || o.nombre === o.texto.slice(0, 40)) nuevo.nombre = valor.replace(/\s+/g, ' ').slice(0, 40);
    if (o.autoAncho) nuevo.w = m.w;
    if (o.autoAlto) nuevo.h = m.h;
    if (E.editandoNuevo) {
      // Escribir el texto recién creado es parte de crearlo: un solo paso para deshacer
      const paso = E.deshacer[E.deshacer.length - 1];
      confirmar([[id, nuevo]], { historial: false });
      if (paso) paso.despues = [[id, nuevo]];
    } else confirmar([[id, nuevo]]);
  }
  ultimoEnvio = 0;
  enviarPresencia();
  lienzo.focus({ preventScroll: true });
  emitir('seleccion');
}

// ---------- Acciones sobre la selección ----------
export function eliminarSeleccion() {
  const ids = conHijos([...E.sel].filter(id => !obj(id)?.bloqueado));
  if (!ids.size) return;
  confirmar([...ids].map(id => [id, null]));
  seleccionar([]);
}
export function duplicarSeleccion() {
  const ids = [...E.sel];
  if (!ids.length) return;
  const originales = [...conHijos(ids)].map(id => E.objetos.get(id));
  const copia = clonar(originales, 20, 20);
  agregar(copia);
}
export function moverConTeclado(dx, dy) {
  const ids = conHijos([...E.sel].filter(id => !obj(id)?.bloqueado));
  confirmar([...ids].map(id => { const o = E.objetos.get(id); return [id, { ...o, x: o.x + dx, y: o.y + dy }]; }));
}
export function agrupar() {
  const sel = seleccionados().filter(o => !esMarco(o));
  if (sel.length < 2) return toast('Selecciona dos o más figuras para agruparlas.');
  const g = nuevoId();
  confirmar(sel.map(o => [o.id, { ...E.objetos.get(o.id), grupo: g }]));
  E.grupoAbierto = null;
  emitir('seleccion');
}
export function desagrupar() {
  const sel = seleccionados().filter(o => o.grupo);
  if (!sel.length) return;
  confirmar(sel.map(o => [o.id, { ...E.objetos.get(o.id), grupo: null }]));
  emitir('seleccion');
}
// Orden de apilado: paso = +1 adelante, -1 atrás, +Infinity al frente, -Infinity al fondo
export function reordenar(paso) {
  const sel = seleccionados();
  if (!sel.length) return;
  const cambios = [];
  const porPadre = new Map();
  for (const o of sel) { const k = padreDe(o)?.id || ''; if (!porPadre.has(k)) porPadre.set(k, []); porPadre.get(k).push(o); }
  for (const [padre, lista] of porPadre) {
    const hermanos = (padre ? hijosDe(padre) : raices());
    const ords = hermanos.map(o => o.orden || 0);
    const min = Math.min(...ords), max = Math.max(...ords);
    lista.sort(porOrden);
    if (paso === Infinity) lista.forEach((o, i) => cambios.push([o.id, max + 1 + i]));
    else if (paso === -Infinity) lista.forEach((o, i) => cambios.push([o.id, min - lista.length + i]));
    else {
      const ids = new Set(lista.map(o => o.id));
      const resto = hermanos.filter(o => !ids.has(o.id));
      for (const o of paso > 0 ? [...lista].reverse() : lista) {
        const i = resto.findIndex(x => paso > 0 ? (x.orden || 0) > (o.orden || 0) : (x.orden || 0) >= (o.orden || 0));
        if (paso > 0) {
          if (i < 0) continue;
          const sig = resto[i], sig2 = resto[i + 1];
          cambios.push([o.id, sig2 ? ((sig.orden || 0) + (sig2.orden || 0)) / 2 : (sig.orden || 0) + 1]);
        } else {
          const j = (i < 0 ? resto.length : i) - 1;
          if (j < 0) continue;
          const ant = resto[j], ant2 = resto[j - 1];
          cambios.push([o.id, ant2 ? ((ant.orden || 0) + (ant2.orden || 0)) / 2 : (ant.orden || 0) - 1]);
        }
      }
    }
  }
  confirmar(cambios.map(([id, orden]) => [id, { ...E.objetos.get(id), orden }]));
}
// Mover una capa (desde el panel de capas): antes de / después de / dentro de otra figura
export function moverCapa(ids, destinoId, donde) {
  const destino = obj(destinoId);
  if (!destino || ids.includes(destinoId)) return;
  let padre = donde === 'dentro' ? destino.id : destino.padre && padreDe(destino) ? destino.padre : null;
  const hermanos = (padre ? hijosDe(padre) : raices()).filter(o => !ids.includes(o.id));
  const lista = ids.map(obj).filter(o => o && !(esMarco(o) && padre));
  if (!lista.length) return;
  let ordBase, ordTope;
  if (donde === 'dentro') { const top = hermanos[hermanos.length - 1]; ordBase = top ? (top.orden || 0) : 0; ordTope = ordBase + lista.length + 1; }
  else {
    const i = hermanos.findIndex(o => o.id === destinoId);
    // En el panel, arriba = adelante: "antes" en la lista es un orden mayor
    if (donde === 'antes') { ordBase = hermanos[i].orden || 0; ordTope = hermanos[i + 1] ? hermanos[i + 1].orden || 0 : ordBase + lista.length + 1; }
    else { ordTope = hermanos[i].orden || 0; ordBase = hermanos[i - 1] ? hermanos[i - 1].orden || 0 : ordTope - lista.length - 1; }
  }
  const paso = (ordTope - ordBase) / (lista.length + 1);
  lista.sort(porOrden);
  confirmar(lista.map((o, k) => [o.id, { ...E.objetos.get(o.id), orden: ordBase + paso * (k + 1), padre: esMarco(o) ? null : padre }]));
}
export function alinear(como) {
  const sel = seleccionados();
  if (!sel.length) return;
  // Una sola figura se alinea con su marco; varias, entre ellas
  let ref = sel.length === 1 ? (padreDe(sel[0]) ? cajaDe(padreDe(sel[0])) : null) : cajaDeVarios(E.sel);
  if (!ref) return;
  const cambios = [];
  for (const o of sel) {
    const b = cajaDe(o);
    let dx = 0, dy = 0;
    if (como === 'izq') dx = ref.x - b.x;
    if (como === 'centroH') dx = ref.x + ref.w / 2 - (b.x + b.w / 2);
    if (como === 'der') dx = ref.x + ref.w - (b.x + b.w);
    if (como === 'arriba') dy = ref.y - b.y;
    if (como === 'centroV') dy = ref.y + ref.h / 2 - (b.y + b.h / 2);
    if (como === 'abajo') dy = ref.y + ref.h - (b.y + b.h);
    for (const id of conHijos([o.id])) { const x = E.objetos.get(id); cambios.push([id, { ...x, x: Math.round(x.x + dx), y: Math.round(x.y + dy) }]); }
  }
  confirmar(cambios);
}
export function distribuir(eje) {
  const sel = seleccionados();
  if (sel.length < 3) return toast('Selecciona tres o más figuras para distribuirlas.');
  const k = eje === 'h' ? 'x' : 'y', t = eje === 'h' ? 'w' : 'h';
  const cajas = sel.map(o => ({ o, b: cajaDe(o) })).sort((a, b) => a.b[k] - b.b[k]);
  const total = cajas.reduce((s, c) => s + c.b[t], 0);
  const ini = cajas[0].b[k], fin = cajas[cajas.length - 1].b[k] + cajas[cajas.length - 1].b[t];
  const hueco = (fin - ini - total) / (cajas.length - 1);
  let pos = ini;
  const cambios = [];
  for (const { o, b } of cajas) {
    const d = Math.round(pos - b[k]);
    for (const id of conHijos([o.id])) { const x = E.objetos.get(id); cambios.push([id, { ...x, [k]: x[k] + d }]); }
    pos += b[t] + hueco;
  }
  confirmar(cambios);
}

// ---------- Copiar y pegar ----------
let portapapeles = null;
function paraCopiar() {
  const ids = [...conHijos([...E.sel])];
  return ids.map(id => E.objetos.get(id)).filter(Boolean);
}
function alCopiar(e, cortar = false) {
  if (enCampo(e.target) || !E.sel.size) return;
  const lista = paraCopiar();
  portapapeles = lista;
  e.clipboardData.setData('text/plain', 'mockups:' + JSON.stringify(lista));
  e.preventDefault();
  if (cortar) eliminarSeleccion();
}
async function alPegar(e) {
  if (enCampo(e.target) || !E.archivoId || $('#vistaEditor').hidden) return;
  const dt = e.clipboardData;
  const imagenes = [...(dt?.files || [])].filter(f => f.type.startsWith('image/'));
  if (imagenes.length) { e.preventDefault(); return insertarImagenes(imagenes); }
  const texto = dt?.getData('text/plain') || '';
  e.preventDefault();
  if (texto.startsWith('mockups:')) {
    try { pegar(JSON.parse(texto.slice(8))); } catch { toast('No se pudo pegar.'); }
  } else if (texto.trim()) {
    const c = centroVista();
    const m = marcoDestino(c);
    agregar([figuraNueva('texto', { texto: texto.slice(0, 5000), x: Math.round(c.x), y: Math.round(c.y), padre: m?.id || null, autoAncho: texto.length < 60, w: 360 })]);
  } else if (portapapeles) pegar(portapapeles);
}
function pegar(lista) {
  if (!lista?.length) return;
  const ids = new Set(lista.map(o => o.id));
  const raiz = lista.filter(o => !ids.has(o.padre));
  const b = cajaDeVarios.call(null, []) || null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const o of raiz) { const c = caja(o); x1 = Math.min(x1, c.x); y1 = Math.min(y1, c.y); x2 = Math.max(x2, c.x + c.w); y2 = Math.max(y2, c.y + c.h); }
  let dx = 0, dy = 0;
  const destino = seleccionados().length === 1 && esMarco(seleccionados()[0]) && !raiz.some(esMarco) ? seleccionados()[0] : null;
  const vista = vistaMundo();
  const enMismoLugar = raiz.every(o => E.objetos.has(o.id) && E.objetos.get(o.id).pagina === E.pagina);
  if (destino) {
    // Dentro del marco seleccionado, centrado
    const m = cajaDe(destino);
    dx = m.x + (m.w - (x2 - x1)) / 2 - x1; dy = m.y + (m.h - (y2 - y1)) / 2 - y1;
  } else if (enMismoLugar) { dx = 20; dy = 20; }
  else if (!corta(vista, { x: x1, y: y1, w: x2 - x1, h: y2 - y1 })) {
    const c = centroVista(); dx = c.x - (x1 + x2) / 2; dy = c.y - (y1 + y2) / 2;
  }
  const copia = clonar(lista, Math.round(dx), Math.round(dy));
  for (const o of copia) {
    if (esMarco(o) || copia.some(p => p.id === o.padre)) continue;
    o.padre = destino ? destino.id : marcoDestino({ x: o.x + o.w / 2, y: o.y + o.h / 2 })?.id || null;
  }
  agregar(copia);
}
export function vistaMundo() {
  const r = lienzo.getBoundingClientRect();
  return { x: E.cam.x, y: E.cam.y, w: r.width / E.cam.z, h: r.height / E.cam.z };
}
export function centroVista() { const v = vistaMundo(); return { x: v.x + v.w / 2, y: v.y + v.h / 2 }; }
function marcoDestino(p) { return marcoEn(p.x, p.y); }

// Insertar componentes y figuras desde el panel: en el marco seleccionado, en el centro de la vista o donde se suelten
export { clonar };
export function insertarFiguras(figuras, punto = null) {
  let m = null;
  const sel = seleccionados();
  if (!punto && sel.length === 1) m = esMarco(sel[0]) ? sel[0] : padreDe(sel[0]);
  const esMarcoNuevo = figuras.some(esMarco);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const o of figuras) { const c = caja(o); x1 = Math.min(x1, c.x); y1 = Math.min(y1, c.y); x2 = Math.max(x2, c.x + c.w); y2 = Math.max(y2, c.y + c.h); }
  const w = x2 - x1, hh = y2 - y1;
  let x, y;
  if (punto) { x = punto.x - w / 2; y = punto.y - hh / 2; m = esMarcoNuevo ? null : marcoEn(punto.x, punto.y); }
  else if (m && !esMarcoNuevo) {
    const b = cajaDe(m);
    // Si el componente es tan ancho como el marco (barras, pies de página), se pega al borde izquierdo
    x = w >= b.w * 0.9 ? b.x : b.x + (b.w - w) / 2;
    y = b.y + Math.max(0, (Math.min(b.h, vistaMundo().y + vistaMundo().h - b.y) - hh) / 2);
    if (w >= b.w * 0.9) y = b.y + (hijosDe(m.id).length ? 0 : 0);
  } else if (esMarcoNuevo) {
    // Un marco nuevo va a la derecha de los que ya hay
    const ms = raices().filter(esMarco);
    const fin = ms.length ? Math.max(...ms.map(o => cajaDe(o).x + cajaDe(o).w)) : 0;
    x = ms.length ? fin + 100 : 0; y = ms.length ? Math.min(...ms.map(o => o.y)) : 0;
    m = null;
  } else { const c = centroVista(); x = c.x - w / 2; y = c.y - hh / 2; m = marcoEn(c.x, c.y); }
  const dx = Math.round(x - x1), dy = Math.round(y - y1);
  // Un componente de varias piezas entra agrupado: se mueve de una vez y doble clic entra a sus partes
  const grupo = figuras.length > 1 && !esMarcoNuevo ? nuevoId() : null;
  const lista = figuras.map(o => ({ ...o, x: o.x + dx, y: o.y + dy, padre: esMarco(o) ? null : o.padre || m?.id || null, grupo: esMarco(o) ? null : o.grupo || grupo }));
  const nuevas = agregar(lista);
  if (esMarcoNuevo) encuadrar(cajaDe(nuevas[0]), 80, 1);
  else if (!corta(vistaMundo(), { x: x1 + dx, y: y1 + dy, w, h: hh })) encuadrar({ x: x1 + dx, y: y1 + dy, w, h: hh }, 120, E.cam.z);
  return nuevas;
}

// ---------- Imágenes ----------
export async function insertarImagenes(archivos, punto = null) {
  let i = 0;
  for (const f of archivos) {
    try {
      const { src, w, h: alto } = await comprimirImagen(f);
      const k = Math.min(1, 800 / w);
      const o = figuraNueva('imagen', { src, w: Math.round(w * k), h: Math.round(alto * k), nombre: f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Imagen' });
      const p = punto ? { x: punto.x + i * 20, y: punto.y + i * 20 } : null;
      insertarFiguras([o], p);
      i++;
    } catch (err) { console.error(err); toast('No se pudo cargar la imagen ' + f.name); }
  }
}
export async function reemplazarImagen(id, archivo) {
  const { src } = await comprimirImagen(archivo);
  cambiar({ [id]: { src } });
}
// Las imágenes se guardan dentro del archivo, así que se reducen para que no pasen de ~700 KB
export function comprimirImagen(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let lado = 1600, calidad = 0.85, src;
      const w0 = img.naturalWidth, h0 = img.naturalHeight;
      if (archivo.type === 'image/svg+xml' && archivo.size < 200000) {
        const fr = new FileReader();
        fr.onload = () => ok({ src: fr.result, w: w0 || 300, h: h0 || 300 });
        fr.readAsDataURL(archivo);
        return;
      }
      for (let intento = 0; intento < 8; intento++) {
        const k = Math.min(1, lado / Math.max(w0, h0));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        src = c.toDataURL('image/webp', calidad);
        if (!src.startsWith('data:image/webp')) src = c.toDataURL('image/jpeg', calidad);
        if (src.length < 900000) break;
        lado *= 0.8; calidad = Math.max(0.5, calidad - 0.08);
      }
      ok({ src, w: w0, h: h0 });
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen no válida')); };
    img.src = url;
  });
}

// ---------- Teclado ----------
const enCampo = t => t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
const TECLAS_HERR = { v: 'mover', f: 'marco', a: 'marco', r: 'rect', o: 'elipse', l: 'linea', t: 'texto', h: 'mano' };
function alTeclear(e) {
  if ($('#vistaEditor').hidden || document.querySelector('dialog[open]') || !$('#presentacion').hidden) return;
  if (enCampo(e.target)) return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (e.key === ' ' && !e.repeat) {
    if (e.shiftKey) { e.preventDefault(); return emitir('presentar'); }
    E.espacio = true; lienzo.classList.add('mano'); e.preventDefault(); return;
  }
  if (mod && k === 'z') { e.preventDefault(); return e.shiftKey ? rehacer() : deshacer(); }
  if (mod && k === 'y') { e.preventDefault(); return rehacer(); }
  if (mod && k === 'a') { e.preventDefault(); return seleccionarTodo(); }
  if (mod && k === 'd') { e.preventDefault(); return duplicarSeleccion(); }
  if (mod && k === 'g') { e.preventDefault(); return e.shiftKey ? desagrupar() : agrupar(); }
  if (mod && e.shiftKey && k === 'h') { e.preventDefault(); return alternar('visible'); }
  if (mod && e.shiftKey && k === 'l') { e.preventDefault(); return alternar('bloqueado'); }
  if (mod && e.shiftKey && k === 'k') { e.preventDefault(); return usarHerramienta('imagen'); }
  if (mod && (e.key === ']' || e.key === '}')) { e.preventDefault(); return reordenar(e.shiftKey || e.altKey ? Infinity : 1); }
  if (mod && (e.key === '[' || e.key === '{')) { e.preventDefault(); return reordenar(e.shiftKey || e.altKey ? -Infinity : -1); }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); return zoomEn(E.cam.z * 1.25); }
  if (mod && k === '-') { e.preventDefault(); return zoomEn(E.cam.z / 1.25); }
  if (mod && k === '0') { e.preventDefault(); return zoomEn(1); }
  if (mod) return;
  if (e.shiftKey && e.code === 'Digit0') return zoomEn(1);
  if (e.shiftKey && e.code === 'Digit1') return verTodo();
  if (e.shiftKey && e.code === 'Digit2') return verSeleccion();
  if (e.shiftKey && k === 'l') return usarHerramienta('flecha');
  if (e.key === '?') return emitir('atajos');
  if (k === '+' || k === '=') return zoomEn(E.cam.z * 1.25);
  if (k === '-') return zoomEn(E.cam.z / 1.25);
  if (TECLAS_HERR[k] && !e.shiftKey && !e.altKey) return usarHerramienta(TECLAS_HERR[k]);
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return eliminarSeleccion(); }
  if (e.key === 'Escape') {
    if (E.siguiendo) return seguir(null);
    if (E.herr !== 'mover') return usarHerramienta('mover');
    if (E.grupoAbierto) { const g = E.grupoAbierto; E.grupoAbierto = null; return seleccionar(objetosPagina().filter(o => o.grupo === g).map(o => o.id)); }
    const padres = [...new Set(seleccionados().map(o => padreDe(o)?.id).filter(Boolean))];
    return seleccionar(padres.length === 1 ? padres : []);
  }
  if (e.key === 'Enter') {
    const sel = seleccionados();
    if (sel.length === 1 && sel[0].tipo === 'texto') { e.preventDefault(); return editarTexto(sel[0].id); }
    if (sel.length === 1 && esMarco(sel[0])) return seleccionar(hijosDe(sel[0].id).map(o => o.id));
    return;
  }
  const flechas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (flechas[e.key] && E.sel.size) {
    e.preventDefault();
    const [dx, dy] = flechas[e.key], n = e.shiftKey ? 10 : 1;
    return moverConTeclado(dx * n, dy * n);
  }
}
export function alternar(prop) {
  const sel = seleccionados();
  if (!sel.length) return;
  const valor = prop === 'visible' ? sel.every(o => o.visible === false) : !sel.every(o => o.bloqueado);
  cambiar(Object.fromEntries(sel.map(o => [o.id, { [prop]: valor }])));
}

// ---------- Arranque del lienzo ----------
export function iniciarLienzo() {
  lienzo = $('#lienzo'); mundo = $('#mundo'); capaUI = $('#capaUI'); capaFantasmas = $('#fantasmas'); capaCursores = $('#cursores');
  lienzo.addEventListener('pointerdown', alPresionar);
  lienzo.addEventListener('pointermove', alMover);
  lienzo.addEventListener('pointerup', alSoltar);
  lienzo.addEventListener('pointercancel', alSoltar);
  lienzo.addEventListener('pointerleave', () => { if (!arrastre) { cursor = null; E.hover = null; dibujar(); enviarPresencia(); } });
  lienzo.addEventListener('dblclick', e => {
    // El lienzo captura el puntero al presionar, así que el objetivo real se busca en el punto del clic
    const objetivo = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    if (objetivo.dataset.marco) return; // lo atiende el panel de capas (renombrar)
    const el = objetivo.closest('#mundo [data-id]');
    const o = el && obj(el.dataset.id);
    if (!o || o.bloqueado || E.editando === o.id) return;
    if (o.grupo && o.grupo !== E.grupoAbierto) { E.grupoAbierto = o.grupo; seleccionar([o.id]); if (o.tipo !== 'texto') return; }
    if (o.tipo === 'texto') editarTexto(o.id);
    else if (o.tipo === 'imagen') emitir('cambiar-imagen');
  });
  lienzo.addEventListener('wheel', e => {
    e.preventDefault();
    dejarDeSeguir();
    if (e.ctrlKey || e.metaKey) {
      zoomEn(E.cam.z * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0025)), e.clientX, e.clientY);
    } else {
      const k = e.deltaMode ? 16 : 1;
      E.cam.x += (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * k / E.cam.z;
      E.cam.y += (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * k / E.cam.z;
      cambioCamara();
    }
  }, { passive: false });
  lienzo.addEventListener('contextmenu', e => { e.preventDefault(); ev.dispatchEvent(new CustomEvent('menu', { detail: e })); });
  // Soltar imágenes o componentes sobre el lienzo
  lienzo.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  lienzo.addEventListener('drop', e => {
    e.preventDefault();
    const p = aMundo(e.clientX, e.clientY);
    const imgs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (imgs.length) return insertarImagenes(imgs, p);
    const comp = e.dataTransfer.getData('application/x-componente');
    if (comp) ev.dispatchEvent(new CustomEvent('soltar-componente', { detail: { nombre: comp, punto: p } }));
  });
  document.addEventListener('keydown', alTeclear);
  document.addEventListener('keyup', e => { if (e.key === ' ') { E.espacio = false; lienzo.classList.remove('mano'); } });
  window.addEventListener('blur', () => { E.espacio = false; lienzo.classList.remove('mano'); });
  document.addEventListener('copy', e => alCopiar(e));
  document.addEventListener('cut', e => alCopiar(e, true));
  document.addEventListener('paste', alPegar);
  $('#elegirImagen').onchange = e => { insertarImagenes([...e.target.files]); e.target.value = ''; };
  window.addEventListener('resize', () => dibujar());
  window.addEventListener('cambio-usuario', () => enviarPresencia());
  // Si alguien deja la pestaña abierta sin moverse, se avisa que sigue ahí
  setInterval(() => { if (E.conexion && document.visibilityState === 'visible') { ultimoEnvio = 0; enviarPresencia(); } }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { ultimoEnvio = 0; enviarPresencia(); } });
  window.addEventListener('pagehide', () => E.conexion?.salir?.());
  usarHerramienta('mover');
}
export const onMenu = f => ev.addEventListener('menu', e => f(e.detail));
export const onSoltarComponente = f => ev.addEventListener('soltar-componente', e => f(e.detail));

// ---------- Abrir y cerrar un archivo ----------
export function abrirArchivo(almacen, id) {
  cerrarArchivo();
  E.almacen = almacen;
  E.archivoId = id;
  let primeraVez = true;
  return new Promise(resolve => {
    E.conexion = almacen.abrir(id, {
      alArchivo: datos => {
        if (!datos) { resolve(false); return; }
        const pagina = new URLSearchParams(location.search).get('pagina');
        if (!E.pagina) E.pagina = paginas().length ? E.pagina : null;
        E.archivo = datos;
        if (primeraVez) E.pagina = datos.paginas?.some(p => p.id === pagina) ? pagina : datos.paginas?.[0]?.id;
        recibirArchivo(datos);
      },
      alObjetos: (cambios, inicial) => {
        recibirObjetos(cambios);
        if (inicial && primeraVez) {
          primeraVez = false;
          requestAnimationFrame(() => { verTodo(); resolve(true); enviarPresencia(); });
        }
      },
      alPresencia: recibirPresencia,
    });
  });
}
export function cerrarArchivo() {
  terminarTexto();
  E.conexion?.cerrar();
  Object.assign(E, {
    conexion: null, archivoId: null, archivo: null, pagina: null, borrador: null, editando: null,
    grupoAbierto: null, siguiendo: null, deshacer: [], rehacer: [], guias: [], marquesina: null, hover: null,
  });
  E.objetos.clear(); E.temporal.clear(); E.sel.clear(); E.otros.clear();
  camaras.clear();
  for (const m of [nodos, nodosFantasma, nodosCursor]) { for (const el of m.values()) el.remove(); m.clear(); }
  medidas.clear();
  if (mundo) { mundo.textContent = ''; capaUI.textContent = ''; }
  arrastreVivo = textoVivo = null;
}
export { nodos, TIPOS };
