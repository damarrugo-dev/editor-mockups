// Paneles del editor: herramientas, páginas, capas, componentes, propiedades (Diseño / Prototipo / Código),
// personas conectadas, zoom y menú contextual.
import { $, h, ask, confirmDlg, showMenu, toast } from './util.js';
import {
  E, on, emitir, obj, cajaDe, cajaDeVarios, padreDe, hijosDe, raices, esMarco, seleccionados, seleccionar, cambiar, confirmar,
  HERRAMIENTAS, usarHerramienta, zoomEn, verTodo, verSeleccion, paginas, irAPagina, agregarPagina, renombrarPagina,
  cambiarPagina, duplicarPagina, eliminarPagina, moverPagina, eliminarSeleccion, duplicarSeleccion, agrupar, desagrupar,
  reordenar, alinear, distribuir, alternar, moverCapa, insertarFiguras, editarTexto, reemplazarImagen, seguir, onMenu,
  onSoltarComponente, deshacer, rehacer, seleccionarTodo, colorDe, objetosPagina, porOrden, miColor,
} from './editor.js';
import {
  figuraNueva, TIPOS, FUENTES, PESOS, TAMANOS_MARCO, NOMBRES_ICONOS, svgIcono, cssDe, caja,
  tieneRelleno, tieneBorde, tieneRadio,
} from './figuras.js';
import { CATEGORIAS } from './componentes.js';
import { exportarPng, exportarHtml } from './exportar.js';
import { me, initials, hueOf, sesion } from './sesion.js';

export function iniciarPaneles() {
  barraHerramientas();
  pestanas('#panelIzq', p => { $('#panelIzq [data-panel="capas"]').hidden = p !== 'capas'; $('#panelIzq [data-panel="componentes"]').hidden = p !== 'componentes'; });
  pestanas('#panelDer', p => { pestanaDer = p; propiedades(); });
  componentes();
  $('#nuevaPagina').onclick = () => agregarPagina();
  $('#zoomMas').onclick = () => zoomEn(E.cam.z * 1.25);
  $('#zoomMenos').onclick = () => zoomEn(E.cam.z / 1.25);
  $('#zoomValor').onclick = e => showMenu(e.currentTarget, [
    { label: 'Ver todo (Shift+1)', action: verTodo },
    { label: 'Ver selección (Shift+2)', action: verSeleccion },
    { label: '50%', action: () => zoomEn(0.5) },
    { label: '100% (Shift+0)', action: () => zoomEn(1) },
    { label: '200%', action: () => zoomEn(2) },
  ]);
  on('herramienta', barraHerramientas);
  on('camara', () => { $('#zoomValor').textContent = Math.round(E.cam.z * 100) + '%'; });
  on('pagina', listaPaginas);
  on('archivo', listaPaginas);
  for (const t of ['seleccion', 'objetos', 'pagina']) on(t, () => { capas(); propiedades(); });
  on('presencia', avatares);
  on('atajos', atajos);
  on('cambiar-imagen', () => elegirImagen());
  onMenu(menuContextual);
  onSoltarComponente(({ nombre, punto }) => { const c = buscarComponente(nombre); if (c) insertarFiguras(c.crear(), punto); });
  // Renombrar un marco con doble clic en su nombre
  $('#lienzo').addEventListener('dblclick', e => { const id = e.target.dataset?.marco; if (id) renombrarCapa(obj(id)); });
  window.addEventListener('focusout', () => { if (pendiente) setTimeout(() => { if (!$('#propiedades').contains(document.activeElement)) { pendiente = false; propiedades(); } }, 0); });
}

// Pestañas de los paneles
function pestanas(sel, alCambiar) {
  const botones = [...document.querySelectorAll(`${sel} .pestanas button`)];
  for (const b of botones) b.onclick = () => {
    botones.forEach(x => x.classList.toggle('activa', x === b));
    alCambiar(b.dataset.pest);
  };
}

// ---------- Barra de herramientas ----------
function barraHerramientas() {
  const barra = $('#barraHerr');
  barra.textContent = '';
  for (const [id, nombre, tecla, icono] of HERRAMIENTAS) {
    const b = h('button', { type: 'button', class: E.herr === id ? 'activa' : '', title: `${nombre} (${tecla})`, 'aria-label': nombre, 'aria-pressed': String(E.herr === id), onclick: () => usarHerramienta(id) });
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icono}</svg>`;
    barra.append(b);
    if (id === 'marco' || id === 'imagen') barra.append(h('span', { class: 'sep' }));
  }
  const atajosBtn = h('button', { type: 'button', title: 'Atajos de teclado (?)', onclick: atajos }, '?');
  barra.append(h('span', { class: 'sep' }), atajosBtn);
}

// ---------- Personas conectadas ----------
function avatares() {
  const cont = $('#avatares');
  cont.textContent = '';
  const yo = h('span', { class: 'avatar yo', style: `background:${miColor()}`, title: `${me()} (tú)` }, initials(me()));
  const otros = [...E.otros.entries()].map(([uid, p]) => {
    const enOtra = p.pagina !== E.pagina ? ` · en "${paginas().find(x => x.id === p.pagina)?.nombre || 'otra página'}"` : '';
    return h('button', {
      type: 'button', class: 'avatar' + (E.siguiendo === uid ? ' siguiendo' : ''), style: `background:${p.color}`,
      title: `${p.nombre}${p.correo ? ' · ' + p.correo : ''}${enOtra}\nClic para seguir su vista`,
      onclick: () => seguir(E.siguiendo === uid ? null : uid),
    }, initials(p.nombre));
  });
  cont.append(...otros, yo);
  if (otros.length) cont.append(h('span', { class: 'conectados' }, `${otros.length + 1} editando`));
}

// ---------- Páginas ----------
function listaPaginas() {
  const ul = $('#listaPaginas');
  ul.textContent = '';
  for (const p of paginas()) {
    const quien = [...E.otros.values()].filter(o => o.pagina === p.id);
    const li = h('li', { class: p.id === E.pagina ? 'activa' : '', onclick: () => irAPagina(p.id), ondblclick: () => renombrar() },
      h('span', { class: 'nombre' }, p.nombre),
      ...quien.slice(0, 3).map(o => h('span', { class: 'punto', style: `background:${o.color}`, title: o.nombre })),
      h('button', { type: 'button', class: 'icon-btn sm mas', title: 'Opciones de la página', onclick: e => { e.stopPropagation(); menu(e.currentTarget); } }, '⋯'));
    const renombrar = async () => { const n = await ask({ title: 'Nombre de la página', value: p.nombre }); if (n) renombrarPagina(p.id, n); };
    const menu = anc => showMenu(anc, [
      { label: 'Cambiar nombre', action: renombrar },
      { label: 'Duplicar', action: () => duplicarPagina(p.id) },
      { label: 'Subir', action: () => moverPagina(p.id, -1) },
      { label: 'Bajar', action: () => moverPagina(p.id, 1) },
      { label: 'Eliminar', danger: true, action: async () => { if (await confirmDlg(`¿Eliminar la página "${p.nombre}"?`, 'Se borran todas sus figuras para todos.')) eliminarPagina(p.id); } },
    ]);
    ul.append(li);
  }
}

// ---------- Capas ----------
const ICONO_TIPO = {
  marco: '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>', rect: '<rect x="4" y="5" width="16" height="14" rx="1.5"/>',
  elipse: '<circle cx="12" cy="12" r="8"/>', linea: '<path d="M5 19L19 5"/>', texto: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  imagen: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
  icono: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
  grupo: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h6v6M7 11v6h6" stroke-dasharray="2 2"/>',
};
const icono = t => { const s = h('span', { class: 'ico' }); s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONO_TIPO[t]}</svg>`; return s; };
const cerrados = new Set();
let arrastreCapa = null;
function capas() {
  const ul = $('#listaCapas');
  const scroll = ul.parentElement.scrollTop;
  ul.textContent = '';
  // De arriba (adelante) hacia abajo (atrás), como en Figma
  const fila = (o, nivel) => {
    const sel = E.sel.has(o.id);
    const otros = [...E.otros.values()].filter(p => p.sel?.includes(o.id));
    const hijos = esMarco(o) ? hijosDe(o.id) : [];
    const li = h('li', {
      class: 'capa' + (sel ? ' sel' : '') + (o.visible === false ? ' oculta' : ''), draggable: 'true', style: `--nivel:${nivel}`,
      'data-id': o.id,
      onclick: e => {
        if (e.target.closest('button')) return;
        if (o.grupo) E.grupoAbierto = o.grupo;
        seleccionar(e.shiftKey ? (sel ? [...E.sel].filter(x => x !== o.id) : [...E.sel, o.id]) : [o.id]);
      },
      ondblclick: e => { if (!e.target.closest('button')) renombrarCapa(o); },
    },
      hijos.length ? h('button', { type: 'button', class: 'flecha' + (cerrados.has(o.id) ? '' : ' abierta'), onclick: () => { cerrados.has(o.id) ? cerrados.delete(o.id) : cerrados.add(o.id); capas(); } }, '▸') : h('span', { class: 'flecha' }),
      icono(o.tipo),
      h('span', { class: 'nombre' }, o.nombre || TIPOS[o.tipo]),
      ...otros.map(p => h('span', { class: 'punto', style: `background:${p.color}`, title: `${p.nombre} lo tiene seleccionado` })),
      h('button', { type: 'button', class: 'icon-btn sm accion' + (o.bloqueado ? ' fija' : ''), title: o.bloqueado ? 'Desbloquear' : 'Bloquear', onclick: () => cambiar({ [o.id]: { bloqueado: !o.bloqueado } }) }, o.bloqueado ? '🔒' : '🔓'),
      h('button', { type: 'button', class: 'icon-btn sm accion' + (o.visible === false ? ' fija' : ''), title: o.visible === false ? 'Mostrar' : 'Ocultar', onclick: () => cambiar({ [o.id]: { visible: o.visible === false } }) }, o.visible === false ? '◌' : '👁'),
    );
    li.addEventListener('dragstart', e => {
      arrastreCapa = E.sel.has(o.id) ? [...E.sel] : [o.id];
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', o.id);
    });
    li.addEventListener('dragover', e => {
      if (!arrastreCapa) return;
      e.preventDefault();
      const r = li.getBoundingClientRect(), k = (e.clientY - r.top) / r.height;
      const donde = esMarco(o) && k > 0.3 && k < 0.7 && !arrastreCapa.some(id => esMarco(obj(id))) ? 'dentro' : k < 0.5 ? 'antes' : 'despues';
      li.dataset.soltar = donde;
    });
    li.addEventListener('dragleave', () => delete li.dataset.soltar);
    li.addEventListener('drop', e => {
      e.preventDefault();
      const donde = li.dataset.soltar; delete li.dataset.soltar;
      if (arrastreCapa && donde) moverCapa(arrastreCapa, o.id, donde);
      arrastreCapa = null;
    });
    li.addEventListener('dragend', () => { arrastreCapa = null; });
    ul.append(li);
    if (hijos.length && !cerrados.has(o.id)) agruparFilas([...hijos].reverse(), nivel + 1);
  };
  // Las figuras de un mismo grupo se muestran juntas bajo una fila "Grupo"
  const agruparFilas = (lista, nivel) => {
    const vistos = new Set();
    for (const o of lista) {
      if (!o.grupo) { fila(o, nivel); continue; }
      if (vistos.has(o.grupo)) continue;
      vistos.add(o.grupo);
      const miembros = lista.filter(x => x.grupo === o.grupo);
      const sel = miembros.every(m => E.sel.has(m.id));
      const clave = 'g:' + o.grupo;
      const li = h('li', {
        class: 'capa grupo' + (sel ? ' sel' : ''), style: `--nivel:${nivel}`,
        onclick: e => { if (e.target.closest('button')) return; E.grupoAbierto = null; seleccionar(miembros.map(m => m.id), e.shiftKey); },
      },
        h('button', { type: 'button', class: 'flecha' + (cerrados.has(clave) ? '' : ' abierta'), onclick: () => { cerrados.has(clave) ? cerrados.delete(clave) : cerrados.add(clave); capas(); } }, '▸'),
        icono('grupo'), h('span', { class: 'nombre' }, nombreGrupo(miembros)));
      ul.append(li);
      if (!cerrados.has(clave)) miembros.forEach(m => fila(m, nivel + 1));
    }
  };
  for (const g of new Set(objetosPagina().map(o => o.grupo).filter(Boolean))) if (!cerrados.has('g:' + g) && !inicializados.has(g)) { inicializados.add(g); cerrados.add('g:' + g); }
  agruparFilas([...raices()].reverse(), 0);
  if (!ul.children.length) ul.append(h('li', { class: 'vacio' }, 'Dibuja un marco (F) o arrastra un componente para empezar.'));
  ul.parentElement.scrollTop = scroll;
  ul.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
}
const inicializados = new Set();
function nombreGrupo(miembros) {
  const grande = [...miembros].sort((a, b) => cajaDe(b).w * cajaDe(b).h - cajaDe(a).w * cajaDe(a).h)[0];
  return grande?.nombre && grande.tipo !== 'texto' ? grande.nombre : 'Grupo';
}
async function renombrarCapa(o) {
  const n = await ask({ title: 'Nombre de la capa', value: o.nombre });
  if (n) cambiar({ [o.id]: { nombre: n } });
}

// ---------- Componentes ----------
function buscarComponente(nombre) { for (const c of CATEGORIAS) for (const it of c.items) if (it.nombre === nombre) return it; }
function componentes() {
  const cont = $('#listaComponentes');
  const dibujarLista = () => {
    const q = $('#buscarComponente').value.trim().toLowerCase();
    cont.textContent = '';
    for (const cat of CATEGORIAS) {
      const items = cat.items.filter(it => !q || it.nombre.toLowerCase().includes(q) || cat.nombre.toLowerCase().includes(q));
      if (!items.length) continue;
      cont.append(h('h3', {}, cat.nombre), h('div', { class: 'rejilla-comp' }, items.map(it => {
        const b = h('button', {
          type: 'button', class: 'comp', draggable: 'true', title: 'Clic para agregar · arrastra para soltarlo donde quieras',
          onclick: () => insertarFiguras(it.crear()),
          ondragstart: e => { e.dataTransfer.setData('application/x-componente', it.nombre); e.dataTransfer.effectAllowed = 'copy'; },
        }, miniaturaComponente(it), h('span', {}, it.nombre), it.detalle ? h('small', {}, it.detalle) : '');
        return b;
      })));
    }
    // Íconos sueltos
    const iconos = NOMBRES_ICONOS.filter(n => !q || n.includes(q) || 'iconos íconos'.includes(q));
    if (iconos.length) cont.append(h('h3', {}, 'Íconos'), h('div', { class: 'rejilla-iconos' }, iconos.map(n => {
      const b = h('button', {
        type: 'button', title: n, draggable: 'true',
        onclick: () => insertarFiguras([nuevaFiguraIcono(n)]),
        ondragstart: e => { e.dataTransfer.setData('application/x-componente', 'icono:' + n); },
      });
      b.append(svgIcono(n, 'currentColor', 2));
      return b;
    })));
  };
  $('#buscarComponente').oninput = dibujarLista;
  dibujarLista();
  onSoltarComponente(({ nombre, punto }) => { if (nombre.startsWith('icono:')) insertarFiguras([nuevaFiguraIcono(nombre.slice(6))], punto); });
}
const nuevaFiguraIcono = n => figuraNueva('icono', { icono: n, nombre: 'Ícono ' + n, w: 24, h: 24 });
// Dibujo pequeño del componente para el panel
function miniaturaComponente(it) {
  const figs = it.crear();
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const o of figs) { const c = caja(o); x1 = Math.min(x1, c.x); y1 = Math.min(y1, c.y); x2 = Math.max(x2, c.x + c.w); y2 = Math.max(y2, c.y + c.h); }
  const w = x2 - x1, hh = y2 - y1, k = Math.min(96 / w, 56 / hh, 1);
  const svg = [`<svg viewBox="0 0 ${w} ${hh}" width="${w * k}" height="${hh * k}" preserveAspectRatio="xMidYMid meet">`];
  for (const o of figs) {
    const c = caja(o), x = c.x - x1, y = c.y - y1;
    if (o.tipo === 'marco') svg.push(`<rect x="${x}" y="${y}" width="${c.w}" height="${c.h}" fill="#fff" stroke="#9aa1b0" stroke-width="${2 / k}"/>`);
    else if (o.tipo === 'rect' || o.tipo === 'imagen') svg.push(`<rect x="${x}" y="${y}" width="${c.w}" height="${c.h}" rx="${o.radio || 0}" fill="${o.tipo === 'imagen' ? '#d5dae3' : o.relleno || 'none'}" stroke="${o.borde || 'none'}" stroke-width="${o.grosorBorde || 1}"/>`);
    else if (o.tipo === 'elipse') svg.push(`<ellipse cx="${x + c.w / 2}" cy="${y + c.h / 2}" rx="${c.w / 2}" ry="${c.h / 2}" fill="${o.relleno || 'none'}" stroke="${o.borde || 'none'}"/>`);
    else if (o.tipo === 'texto') {
      const lineas = Math.max(1, Math.round((o.autoAlto ? o.tam * o.interlineado * Math.ceil((o.texto.length * o.tam * 0.5) / (o.autoAncho ? 1e9 : o.w)) : c.h) / (o.tam * o.interlineado)));
      const ancho = o.autoAncho ? o.texto.length * o.tam * 0.52 : o.w;
      for (let i = 0; i < Math.min(lineas, 4); i++) {
        const lw = i === lineas - 1 && lineas > 1 ? ancho * 0.6 : ancho;
        const tx = o.alinear === 'center' ? x + (c.w - lw) / 2 : x;
        const ty = o.alinearV === 'middle' ? y + c.h / 2 - o.tam * 0.3 : y + i * o.tam * o.interlineado + o.tam * 0.25;
        svg.push(`<rect x="${tx}" y="${ty}" width="${Math.min(lw, o.autoAncho ? lw : c.w)}" height="${o.tam * 0.6}" rx="${o.tam * 0.2}" fill="${o.color}" opacity=".75"/>`);
      }
    } else if (o.tipo === 'linea') svg.push(`<line x1="${o.x - x1}" y1="${o.y - y1}" x2="${o.x + o.w - x1}" y2="${o.y + o.h - y1}" stroke="${o.borde}" stroke-width="${o.grosorBorde}"/>`);
    else if (o.tipo === 'icono') svg.push(`<rect x="${x}" y="${y}" width="${c.w}" height="${c.h}" rx="${c.w / 2}" fill="${o.color}" opacity=".6"/>`);
  }
  svg.push('</svg>');
  const s = h('span', { class: 'mini' });
  s.innerHTML = svg.join('');
  return s;
}

// ---------- Propiedades ----------
let pestanaDer = 'diseno';
let pendiente = false;
function propiedades() {
  const cont = $('#propiedades');
  // No se redibuja mientras la persona escribe en un campo del panel
  if (cont.contains(document.activeElement) && document.activeElement.matches('input, textarea, select')) { pendiente = true; return; }
  const scroll = cont.scrollTop;
  cont.textContent = '';
  const sel = seleccionados();
  if (pestanaDer === 'prototipo') cont.append(...panelPrototipo(sel));
  else if (pestanaDer === 'codigo') cont.append(...panelCodigo(sel));
  else cont.append(...(sel.length ? panelDiseno(sel) : panelPagina()));
  cont.scrollTop = scroll;
}

// Valor común de una propiedad en varias figuras (o null si son distintos)
function comun(sel, f) {
  const vs = sel.map(f);
  return vs.every(v => JSON.stringify(v) === JSON.stringify(vs[0])) ? vs[0] : undefined;
}
// Aplica props a la selección. props puede ser una función (figura) => cambios
function aplicar(sel, props) {
  cambiar(Object.fromEntries(sel.map(o => [o.id, typeof props === 'function' ? props(o) : props])));
}

const seccion = (titulo, ...hijos) => h('section', { class: 'sec' }, titulo ? h('div', { class: 'sec-titulo' }, ...[].concat(titulo)) : '', ...hijos);
const fila = (...hijos) => h('div', { class: 'fila' }, ...hijos);

// Campo numérico; arrastrar la etiqueta cambia el valor (como en Figma)
function num(etiqueta, valor, alCambiar, { min = -Infinity, max = Infinity, paso = 1, sufijo = '', titulo = '', decimales = 0 } = {}) {
  const inp = h('input', { type: 'text', inputmode: 'decimal', value: valor === undefined ? '' : redondear(valor, decimales), placeholder: valor === undefined ? 'Mixto' : '', 'aria-label': titulo || etiqueta });
  const confirmar = () => {
    const txt = inp.value.trim().replace(',', '.');
    if (txt === '') return;
    let v;
    try { v = Number(txt) ; if (Number.isNaN(v)) v = Function(`"use strict";return (${txt.replace(/[^-+*/().\d\s]/g, '')})`)(); } catch { v = NaN; }
    if (!Number.isFinite(v)) { inp.value = valor === undefined ? '' : redondear(valor, decimales); return; }
    v = Math.min(max, Math.max(min, v));
    if (v !== valor) alCambiar(v);
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { confirmar(); inp.blur(); }
    if (e.key === 'Escape') { inp.value = valor === undefined ? '' : redondear(valor, decimales); inp.blur(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const v = (Number(inp.value) || 0) + (e.key === 'ArrowUp' ? 1 : -1) * paso * (e.shiftKey ? 10 : 1);
      inp.value = redondear(Math.min(max, Math.max(min, v)), decimales);
      confirmar(); valor = Number(inp.value);
    }
  });
  inp.addEventListener('change', confirmar);
  const et = h('span', { class: 'et', title: titulo || etiqueta }, etiqueta);
  et.addEventListener('pointerdown', e => {
    e.preventDefault();
    const x0 = e.clientX, v0 = Number(inp.value) || 0;
    et.setPointerCapture(e.pointerId);
    const mover = ev => { inp.value = redondear(Math.min(max, Math.max(min, v0 + Math.round((ev.clientX - x0) / 2) * paso)), decimales); };
    const soltar = () => { et.removeEventListener('pointermove', mover); et.removeEventListener('pointerup', soltar); confirmar(); };
    et.addEventListener('pointermove', mover);
    et.addEventListener('pointerup', soltar);
  });
  return h('label', { class: 'num' }, et, inp, sufijo ? h('span', { class: 'suf' }, sufijo) : '');
}
const redondear = (v, d = 0) => { const k = 10 ** Math.max(d, 2); return Math.round(v * k) / k; };

// Color con transparencia: #rrggbb o #rrggbbaa
function separar(c) {
  if (!c) return { hex: '#000000', a: 100 };
  if (/^#[0-9a-f]{8}$/i.test(c)) return { hex: c.slice(0, 7), a: Math.round(parseInt(c.slice(7), 16) / 2.55) };
  if (/^#[0-9a-f]{6}$/i.test(c)) return { hex: c, a: 100 };
  if (/^#[0-9a-f]{3}$/i.test(c)) return { hex: '#' + [...c.slice(1)].map(x => x + x).join(''), a: 100 };
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b, a = 1] = m[1].split(',').map(s => parseFloat(s));
    return { hex: '#' + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join(''), a: Math.round(a * 100) };
  }
  return { hex: '#000000', a: 100 };
}
const unir = (hex, a) => a >= 100 ? hex : hex + Math.round(a * 2.55).toString(16).padStart(2, '0');
function color(valor, alCambiar) {
  const { hex, a } = separar(valor);
  const mixto = valor === undefined;
  const muestra = h('input', { type: 'color', value: hex, 'aria-label': 'Color' });
  const texto = h('input', { type: 'text', class: 'hex', value: mixto ? '' : hex.slice(1).toUpperCase(), placeholder: mixto ? 'Mixto' : '', maxlength: 7, 'aria-label': 'Código del color' });
  const alfa = h('input', { type: 'text', class: 'alfa', value: mixto ? '' : a, 'aria-label': 'Opacidad del color' });
  muestra.oninput = () => { texto.value = muestra.value.slice(1).toUpperCase(); };
  muestra.onchange = () => alCambiar(unir(muestra.value, Number(alfa.value) || 100));
  texto.onchange = () => {
    let v = texto.value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(v)) v = [...v].map(x => x + x).join('');
    if (/^[0-9a-f]{6}$/i.test(v)) alCambiar(unir('#' + v.toLowerCase(), Number(alfa.value) || 100));
  };
  alfa.onchange = () => alCambiar(unir(muestra.value, Math.min(100, Math.max(0, Number(alfa.value) || 0))));
  for (const i of [texto, alfa]) i.addEventListener('keydown', e => { if (e.key === 'Enter') i.blur(); });
  const caja = h('span', { class: 'muestra', style: `--c:${valor || 'transparent'}` }, muestra);
  return h('div', { class: 'color' }, caja, texto, alfa, h('span', { class: 'suf' }, '%'));
}
// Colores usados en el archivo, para repetirlos con un clic
function coloresDelArchivo() {
  const cuenta = new Map();
  for (const o of E.objetos.values()) for (const k of ['relleno', 'borde', 'color']) if (o[k] && typeof o[k] === 'string') cuenta.set(o[k], (cuenta.get(o[k]) || 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c]) => c);
}
function paleta(alElegir) {
  const cs = coloresDelArchivo();
  if (!cs.length) return '';
  return h('div', { class: 'paleta', title: 'Colores del archivo' }, cs.map(c => h('button', { type: 'button', style: `--c:${c}`, title: c, onclick: () => alElegir(c) })));
}
function opciones(valor, lista, alCambiar, etiqueta = '') {
  const s = h('select', { 'aria-label': etiqueta, onchange: e => alCambiar(isNaN(e.target.value) || e.target.value === '' ? e.target.value : Number(e.target.value)) },
    valor === undefined ? h('option', { value: '', selected: true, disabled: true }, 'Mixto') : '',
    lista.map(([v, t]) => h('option', { value: v, selected: v == valor }, t)));
  return s;
}
function botonesSeg(valor, lista, alCambiar) {
  return h('div', { class: 'seg' }, lista.map(([v, t, titulo, svg]) => {
    const b = h('button', { type: 'button', class: v === valor ? 'on' : '', title: titulo || t, 'aria-pressed': String(v === valor), onclick: () => alCambiar(v) });
    if (svg) b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${svg}</svg>`; else b.textContent = t;
    return b;
  }));
}
const btnIcono = (titulo, svg, accion, extra = '') => {
  const b = h('button', { type: 'button', class: 'icon-btn ' + extra, title: titulo, onclick: accion });
  b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
  return b;
};

function panelPagina() {
  const pag = paginas().find(p => p.id === E.pagina);
  const marcos = raices().filter(esMarco);
  return [
    seccion('Página',
      fila(h('span', { class: 'et-larga' }, 'Fondo del lienzo'), color(pag?.fondo || '#e9e9ec', c => cambiarPagina(E.pagina, { fondo: c }))),
    ),
    seccion('Marcos de esta página', marcos.length
      ? h('ul', { class: 'lista-simple' }, marcos.map(m => h('li', {}, h('button', { type: 'button', class: 'enlace', onclick: () => { seleccionar([m.id]); verSeleccion(); } }, m.nombre), h('small', {}, `${m.w}×${m.h}`))))
      : h('p', { class: 'hint' }, 'Todavía no hay marcos. Un marco es una pantalla de tu página web: elige un tamaño en Componentes → Marcos o usa la herramienta Marco (F).')),
    seccion('Exportar', h('p', { class: 'hint' }, 'Selecciona un marco para exportarlo como imagen PNG o como HTML.'),
      h('button', { type: 'button', class: 'btn', onclick: () => emitir('exportar-json') }, 'Descargar copia del archivo (.json)'),
      h('button', { type: 'button', class: 'btn', onclick: () => emitir('importar-json') }, 'Importar figuras desde .json')),
    seccion('Ayuda', h('ul', { class: 'ayuda' },
      h('li', {}, 'Mantén ', h('kbd', {}, 'Espacio'), ' y arrastra para moverte; ', h('kbd', {}, 'Ctrl'), ' + rueda para acercar.'),
      h('li', {}, 'Doble clic en un texto para escribir; en un grupo, para entrar.'),
      h('li', {}, 'Alt + arrastrar duplica. Shift mantiene la proporción.'),
      h('li', {}, 'Clic en la foto de otra persona (arriba) para seguir su vista.'),
      h('li', {}, h('button', { type: 'button', class: 'enlace', onclick: atajos }, 'Ver todos los atajos')))),
  ];
}

function panelDiseno(sel) {
  const unica = sel.length === 1 ? sel[0] : null;
  const tipos = new Set(sel.map(o => o.tipo));
  const todos = f => sel.every(f);
  const out = [];

  // Alinear
  out.push(seccion(null, h('div', { class: 'alinear' },
    btnIcono('Alinear a la izquierda', '<path d="M4 3v18M8 7h12M8 15h7"/>', () => alinear('izq')),
    btnIcono('Centrar horizontalmente', '<path d="M12 3v18M6 7h12M8 15h8"/>', () => alinear('centroH')),
    btnIcono('Alinear a la derecha', '<path d="M20 3v18M4 7h12M9 15h7"/>', () => alinear('der')),
    btnIcono('Alinear arriba', '<path d="M3 4h18M7 8v12M15 8v7"/>', () => alinear('arriba')),
    btnIcono('Centrar verticalmente', '<path d="M3 12h18M7 6v12M15 8v8"/>', () => alinear('centroV')),
    btnIcono('Alinear abajo', '<path d="M3 20h18M7 4v12M15 9v7"/>', () => alinear('abajo')),
    btnIcono('Distribuir en horizontal', '<path d="M4 4v16M20 4v16M10 8h4v8h-4z"/>', () => distribuir('h'), sel.length < 3 ? 'apagado' : ''),
    btnIcono('Distribuir en vertical', '<path d="M4 4h16M4 20h16M8 10h8v4H8z"/>', () => distribuir('v'), sel.length < 3 ? 'apagado' : ''),
  )));

  // Encabezado: tipo y nombre
  const titulo = unica ? (unica.grupo && E.grupoAbierto !== unica.grupo ? 'Grupo' : TIPOS[unica.tipo]) : sel.every(o => o.grupo && o.grupo === sel[0].grupo) ? 'Grupo' : `${sel.length} figuras`;
  const acciones = h('span', { class: 'acciones' },
    sel.length > 1 && !sel.every(o => o.grupo && o.grupo === sel[0].grupo) ? h('button', { type: 'button', class: 'mini-btn', onclick: agrupar, title: 'Ctrl+G' }, 'Agrupar') : '',
    sel.some(o => o.grupo) ? h('button', { type: 'button', class: 'mini-btn', onclick: desagrupar, title: 'Ctrl+Shift+G' }, 'Desagrupar') : '');

  // Marco: tamaño de pantalla
  if (unica && esMarco(unica)) {
    const actual = TAMANOS_MARCO.findIndex(([, w, hh]) => w === unica.w && hh === unica.h);
    out.push(seccion(['Marco', acciones],
      fila(opciones(actual >= 0 ? actual : '', [['', 'Tamaño personalizado'], ...TAMANOS_MARCO.map(([n, w, hh], i) => [i, `${n} · ${w}×${hh}`])], i => {
        if (i === '') return; const [, w, hh] = TAMANOS_MARCO[i]; aplicar(sel, { w, h: hh });
      }, 'Tamaño del marco'),
        btnIcono('Girar (vertical / horizontal)', '<path d="M4 7h10v13H4zM18 4a4 4 0 0 1 2 3.5M20 4v4h-4"/>', () => aplicar(sel, o => ({ w: o.h, h: o.w })))),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: unica.recortar !== false, onchange: e => aplicar(sel, { recortar: e.target.checked }) }), 'Recortar contenido'),
    ));
  } else out.push(seccion([titulo, acciones]));

  // Posición y tamaño: de la figura o de toda la selección (relativa al marco que la contiene)
  const padres = [...new Set(sel.map(o => padreDe(o)?.id || ''))];
  const padre = padres.length === 1 && padres[0] ? obj(padres[0]) : null;
  const caj = cajaDeVarios(sel.map(o => o.id));
  const vx = Math.round(caj.x - (padre ? padre.x : 0)), vy = Math.round(caj.y - (padre ? padre.y : 0));
  const vw = Math.round(caj.w), vh = Math.round(caj.h);
  const conSusHijos = ids => [...new Set(ids.flatMap(id => [id, ...(esMarco(obj(id)) ? hijosDe(id).map(c => c.id) : [])]))];
  const mover = (k, v) => {
    const d = Math.round(v - (k === 'x' ? vx : vy));
    cambiar(Object.fromEntries(conSusHijos(sel.map(o => o.id)).map(id => [id, { [k]: E.objetos.get(id)[k] + d }])));
  };
  const tamano = (k, v) => {
    if (unica) return aplicar(sel, o => {
      const b = cajaDe(o);
      const r = { [k]: o.tipo === 'linea' ? Math.sign(o[k] || 1) * v : v };
      if (o.proporcion) { const otro = k === 'w' ? 'h' : 'w'; r[otro] = Math.round(b[otro] * v / Math.max(b[k], 1)); }
      if (o.tipo === 'texto') { if (k === 'w') r.autoAncho = false; else r.autoAlto = false; if (k === 'h' && o.autoAncho) { r.autoAncho = false; r.w = Math.round(b.w); } }
      return r;
    });
    // Varias figuras: se escalan juntas desde la esquina superior izquierda
    const f = v / Math.max(k === 'w' ? caj.w : caj.h, 1);
    const pos = k === 'w' ? 'x' : 'y', ini = k === 'w' ? caj.x : caj.y;
    aplicar(sel, o => {
      const r = { [pos]: Math.round(ini + (o[pos] - ini) * f), [k]: Math.round(o[k] * f) };
      if (o.tipo === 'texto' && o[k === 'w' ? 'autoAncho' : 'autoAlto']) { r[k] = Math.round(cajaDe(o)[k] * f); r[k === 'w' ? 'autoAncho' : 'autoAlto'] = false; }
      return r;
    });
  };
  const prop = comun(sel, o => !!o.proporcion);
  out.push(seccion(null,
    h('div', { class: 'rejilla2' },
      num('X', vx, v => mover('x', v), { titulo: padre ? `Posición horizontal desde el marco "${padre.nombre}"` : 'Posición horizontal' }),
      num('Y', vy, v => mover('y', v), { titulo: padre ? `Posición vertical desde el marco "${padre.nombre}"` : 'Posición vertical' }),
      num('An', vw, v => tamano('w', v), { min: 1, titulo: 'Ancho' }),
      num('Al', vh, v => tamano('h', v), { min: 1, titulo: 'Alto' }),
      num('↻', comun(sel, o => o.rot || 0), v => aplicar(sel, { rot: ((v % 360) + 360) % 360 }), { sufijo: '°', titulo: 'Rotación' }),
      h('button', { type: 'button', class: 'mini-btn' + (prop ? ' on' : ''), title: 'Mantener proporción al cambiar el tamaño', onclick: () => aplicar(sel, { proporcion: !prop }) }, prop ? '🔗 Proporción fija' : '⛓ Proporción libre'),
    ),
    tipos.has('texto') && sel.length === 1 ? h('div', { class: 'seg-fila' }, h('span', { class: 'et-larga' }, 'Tamaño del texto'),
      botonesSeg(unica.autoAncho ? 'auto' : unica.autoAlto ? 'alto' : 'fijo', [['auto', '↔ Auto', 'El ancho crece con el texto'], ['alto', '↕ Alto auto', 'Ancho fijo, el alto crece'], ['fijo', '▢ Fijo', 'Ancho y alto fijos']], v => {
        const b = cajaDe(unica);
        aplicar(sel, v === 'auto' ? { autoAncho: true, autoAlto: true } : v === 'alto' ? { autoAncho: false, autoAlto: true, w: Math.round(b.w) } : { autoAncho: false, autoAlto: false, w: Math.round(b.w), h: Math.round(b.h) });
      })) : '',
  ));

  // Capa
  out.push(seccion('Capa', h('div', { class: 'rejilla2' },
    num('Opac.', comun(sel, o => Math.round((o.opacidad ?? 1) * 100)), v => aplicar(sel, { opacidad: v / 100 }), { min: 0, max: 100, sufijo: '%', titulo: 'Opacidad' }),
    todos(o => tieneRadio(o.tipo)) ? num('Radio', comun(sel, o => o.radio || 0), v => aplicar(sel, { radio: v }), { min: 0, titulo: 'Radio de las esquinas' }) : h('span'),
  )));

  // Relleno
  if (todos(o => tieneRelleno(o.tipo))) {
    const v = comun(sel, o => o.relleno || null);
    out.push(seccion(['Relleno', v === null
      ? h('button', { type: 'button', class: 'icon-btn sm', title: 'Agregar relleno', onclick: () => aplicar(sel, { relleno: tipos.has('texto') ? '#ffffff' : '#d9d9d9' }) }, '＋')
      : h('button', { type: 'button', class: 'icon-btn sm', title: 'Quitar relleno', onclick: () => aplicar(sel, { relleno: null }) }, '−')],
    v !== null ? color(v, c => aplicar(sel, { relleno: c })) : '',
    v !== null ? paleta(c => aplicar(sel, { relleno: c })) : ''));
  }

  // Texto
  if (todos(o => o.tipo === 'texto')) {
    const c = f => comun(sel, f);
    out.push(seccion(['Texto', unica ? h('button', { type: 'button', class: 'mini-btn', onclick: () => editarTexto(unica.id) }, 'Editar texto') : ''],
      opciones(c(o => o.fuente), FUENTES.map(f => [f, f]), v => aplicar(sel, { fuente: v }), 'Fuente'),
      h('div', { class: 'rejilla2' },
        opciones(c(o => o.peso), PESOS.map(([p, n]) => [p, `${n} · ${p}`]), v => aplicar(sel, { peso: v }), 'Grosor'),
        num('Tam.', c(o => o.tam), v => aplicar(sel, { tam: v }), { min: 1, max: 999, titulo: 'Tamaño de letra', decimales: 1 }),
        num('Línea', c(o => o.interlineado), v => aplicar(sel, { interlineado: v }), { min: 0.5, max: 5, paso: 0.05, titulo: 'Alto de línea (veces el tamaño)', decimales: 2 }),
        num('Espac.', c(o => o.espaciado || 0), v => aplicar(sel, { espaciado: v }), { paso: 0.1, sufijo: 'px', titulo: 'Espacio entre letras', decimales: 1 }),
      ),
      h('div', { class: 'seg-fila' },
        botonesSeg(c(o => o.alinear), [['left', 'Izq', 'Alinear a la izquierda', '<path d="M4 6h16M4 12h10M4 18h13"/>'], ['center', 'Centro', 'Centrar', '<path d="M4 6h16M7 12h10M5 18h14"/>'], ['right', 'Der', 'Alinear a la derecha', '<path d="M4 6h16M10 12h10M7 18h13"/>'], ['justify', 'Just.', 'Justificar', '<path d="M4 6h16M4 12h16M4 18h16"/>']], v => aplicar(sel, { alinear: v })),
        botonesSeg(c(o => o.alinearV), [['top', 'Arriba', 'Arriba', '<path d="M4 4h16M12 8v12M8 12l4-4 4 4"/>'], ['middle', 'Medio', 'Al medio', '<path d="M4 12h16M12 3v5M12 16v5"/>'], ['bottom', 'Abajo', 'Abajo', '<path d="M4 20h16M12 4v12M8 12l4 4 4-4"/>']], v => aplicar(sel, { alinearV: v, autoAlto: false })),
      ),
      h('div', { class: 'seg-fila' },
        botonesSeg(c(o => !!o.cursiva), [[true, 'I', 'Cursiva']], () => aplicar(sel, o => ({ cursiva: !o.cursiva }))),
        botonesSeg(c(o => o.decoracion), [['underline', 'S', 'Subrayado'], ['line-through', 'T', 'Tachado']], v => aplicar(sel, o => ({ decoracion: o.decoracion === v ? 'none' : v }))),
        botonesSeg(c(o => o.mayus), [['uppercase', 'AA', 'MAYÚSCULAS'], ['capitalize', 'Aa', 'Primera Letra En Mayúscula']], v => aplicar(sel, o => ({ mayus: o.mayus === v ? 'none' : v }))),
      ),
      color(c(o => o.color), v => aplicar(sel, { color: v })),
      paleta(v => aplicar(sel, { color: v })),
    ));
  }

  // Ícono
  if (todos(o => o.tipo === 'icono')) {
    const actual = comun(sel, o => o.icono);
    out.push(seccion('Ícono',
      h('div', { class: 'rejilla-iconos chica' }, NOMBRES_ICONOS.map(n => {
        const b = h('button', { type: 'button', title: n, class: n === actual ? 'on' : '', onclick: () => aplicar(sel, { icono: n, nombre: 'Ícono ' + n }) });
        b.append(svgIcono(n, 'currentColor', 2)); return b;
      })),
      color(comun(sel, o => o.color), v => aplicar(sel, { color: v })),
      paleta(v => aplicar(sel, { color: v })),
      num('Trazo', comun(sel, o => o.grosorBorde), v => aplicar(sel, { grosorBorde: v }), { min: 0.5, max: 6, paso: 0.25, titulo: 'Grosor del trazo', decimales: 2 }),
    ));
  }

  // Imagen
  if (todos(o => o.tipo === 'imagen')) {
    out.push(seccion('Imagen',
      h('div', { class: 'seg-fila' }, botonesSeg(comun(sel, o => o.ajuste), [['cover', 'Llenar', 'Cubre todo el recuadro (recorta)'], ['contain', 'Ajustar', 'Se ve completa'], ['fill', 'Estirar', 'Se deforma para llenar']], v => aplicar(sel, { ajuste: v }))),
      fila(h('button', { type: 'button', class: 'btn', onclick: () => elegirImagen() }, 'Cambiar imagen…'),
        h('button', { type: 'button', class: 'btn', onclick: async () => {
          const url = await ask({ title: 'Imagen desde internet', hint: 'Pega la dirección (https://…) de la imagen.' });
          if (url) aplicar(sel, { src: url });
        } }, 'Desde URL…')),
      unica?.src ? h('button', { type: 'button', class: 'mini-btn', onclick: () => {
        const img = new Image(); img.onload = () => aplicar(sel, { h: Math.round(unica.w * img.naturalHeight / img.naturalWidth) }); img.src = unica.src;
      } }, 'Tamaño original (proporción)') : '',
    ));
  }

  // Línea
  if (todos(o => o.tipo === 'linea')) {
    out.push(seccion('Puntas',
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!comun(sel, o => !!o.flechaIni), onchange: e => aplicar(sel, { flechaIni: e.target.checked }) }), 'Flecha al inicio'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!comun(sel, o => !!o.flechaFin), onchange: e => aplicar(sel, { flechaFin: e.target.checked }) }), 'Flecha al final'),
    ));
  }

  // Borde
  if (todos(o => tieneBorde(o.tipo))) {
    const v = comun(sel, o => o.borde || null);
    const esLinea = todos(o => o.tipo === 'linea');
    out.push(seccion([esLinea ? 'Trazo' : 'Borde', !esLinea ? (v === null
      ? h('button', { type: 'button', class: 'icon-btn sm', title: 'Agregar borde', onclick: () => aplicar(sel, { borde: '#1c2230', grosorBorde: 1 }) }, '＋')
      : h('button', { type: 'button', class: 'icon-btn sm', title: 'Quitar borde', onclick: () => aplicar(sel, { borde: null }) }, '−')) : ''],
    v !== null ? color(v, c => aplicar(sel, { borde: c })) : '',
    v !== null ? h('div', { class: 'rejilla2' },
      num('Grosor', comun(sel, o => o.grosorBorde), g => aplicar(sel, { grosorBorde: g }), { min: 0, max: 100, paso: 0.5, decimales: 1 }),
      opciones(comun(sel, o => o.estiloBorde || 'solid'), [['solid', 'Continuo'], ['dashed', 'Guiones'], ['dotted', 'Puntos']], s => aplicar(sel, { estiloBorde: s }), 'Estilo del borde'),
    ) : ''));
  }

  // Sombra
  const sombra = comun(sel, o => o.sombra || null);
  out.push(seccion(['Sombra', sombra === null
    ? h('button', { type: 'button', class: 'icon-btn sm', title: 'Agregar sombra', onclick: () => aplicar(sel, { sombra: { x: 0, y: 4, b: 12, c: '#00000040' } }) }, '＋')
    : h('button', { type: 'button', class: 'icon-btn sm', title: 'Quitar sombra', onclick: () => aplicar(sel, { sombra: null }) }, '−')],
  sombra ? h('div', { class: 'rejilla2' },
    num('X', sombra.x, v => aplicar(sel, o => ({ sombra: { ...o.sombra, x: v } }))),
    num('Y', sombra.y, v => aplicar(sel, o => ({ sombra: { ...o.sombra, y: v } }))),
    num('Difum.', sombra.b, v => aplicar(sel, o => ({ sombra: { ...o.sombra, b: v } })), { min: 0, titulo: 'Difuminado' }),
  ) : '',
  sombra ? color(sombra.c, v => aplicar(sel, o => ({ sombra: { ...o.sombra, c: v } }))) : ''));

  // Exportar
  const marcosOSel = sel;
  out.push(seccion('Exportar',
    h('div', { class: 'fila' },
      h('button', { type: 'button', class: 'btn', onclick: () => exportarPng(marcosOSel, 1) }, 'PNG 1x'),
      h('button', { type: 'button', class: 'btn', onclick: () => exportarPng(marcosOSel, 2) }, 'PNG 2x'),
      h('button', { type: 'button', class: 'btn', onclick: () => exportarPng(marcosOSel, 3) }, '3x')),
    unica && esMarco(unica) ? h('button', { type: 'button', class: 'btn', onclick: () => exportarHtml(unica) }, 'Descargar como HTML') : '',
  ));
  return out;
}

function panelPrototipo(sel) {
  const marcos = raices().filter(esMarco);
  if (!sel.length) return [seccion('Prototipo', h('p', { class: 'hint' }, 'Selecciona un botón, texto o figura y elige a qué marco lleva al hacer clic. Luego pulsa ▶ Presentar para probar la navegación.'),
    marcos.length ? h('button', { type: 'button', class: 'btn primary', onclick: () => emitir('presentar') }, '▶ Presentar') : '')];
  const v = comun(sel, o => o.enlace || '');
  const esUrl = typeof v === 'string' && v.startsWith('url:');
  return [
    seccion('Al hacer clic',
      opciones(esUrl ? '__url' : v ?? '', [['', 'Nada'], ...marcos.filter(m => !sel.some(o => o.id === m.id)).map(m => [m.id, `Ir a: ${m.nombre}`]), ['__atras', '← Volver al marco anterior'], ['__url', 'Abrir un enlace…']], async d => {
        if (d === '__url') {
          const url = await ask({ title: 'Abrir enlace', hint: 'Dirección que se abre al hacer clic (https://…)', value: esUrl ? v.slice(4) : 'https://' });
          if (url) aplicar(sel, { enlace: 'url:' + url });
          else propiedades();
        } else aplicar(sel, { enlace: d || null });
      }, 'Acción al hacer clic'),
      esUrl ? h('p', { class: 'hint' }, 'Abre: ' + v.slice(4)) : '',
      h('p', { class: 'hint' }, 'En el lienzo, las figuras con enlace muestran una marca azul al pasar el mouse.'),
    ),
    seccion(null, h('button', { type: 'button', class: 'btn primary', onclick: () => emitir('presentar') }, '▶ Presentar')),
  ];
}

function panelCodigo(sel) {
  if (sel.length !== 1) return [seccion('Código', h('p', { class: 'hint' }, 'Selecciona una figura para ver su CSS, o un marco para descargarlo como HTML.'))];
  const o = sel[0];
  const p = padreDe(o);
  const texto = cssDe(o, p ? p.x : 0, p ? p.y : 0);
  const pre = h('pre', { class: 'codigo' }, texto);
  return [
    seccion(['CSS', h('button', { type: 'button', class: 'mini-btn', onclick: () => navigator.clipboard.writeText(texto).then(() => toast('CSS copiado')) }, 'Copiar')], pre),
    o.tipo === 'texto' ? seccion('Contenido', h('pre', { class: 'codigo' }, o.texto)) : '',
    esMarco(o) ? seccion('HTML', h('button', { type: 'button', class: 'btn', onclick: () => exportarHtml(o) }, 'Descargar este marco como HTML')) : '',
  ].filter(Boolean);
}

function elegirImagen() {
  const sel = seleccionados().filter(o => o.tipo === 'imagen');
  if (!sel.length) return;
  const inp = h('input', { type: 'file', accept: 'image/*' });
  inp.onchange = async () => { if (inp.files[0]) for (const o of sel) await reemplazarImagen(o.id, inp.files[0]); };
  inp.click();
}

// ---------- Menú contextual ----------
function menuContextual(e) {
  const el = e.target.closest?.('#mundo [data-id]');
  if (el && !E.sel.has(el.dataset.id)) { const o = obj(el.dataset.id); if (o && !o.bloqueado) seleccionar(o.grupo && o.grupo !== E.grupoAbierto ? objetosPagina().filter(x => x.grupo === o.grupo).map(x => x.id) : [o.id]); }
  const ancla = h('span', { style: `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:0;height:0` });
  document.body.append(ancla);
  const hay = E.sel.size > 0;
  const atajo = (t, k) => `${t}  ·  ${k}`;
  const items = hay ? [
    { label: atajo('Copiar', 'Ctrl+C'), action: () => document.execCommand('copy') },
    { label: atajo('Duplicar', 'Ctrl+D'), action: duplicarSeleccion },
    { label: atajo('Traer al frente', 'Ctrl+Shift+]'), action: () => reordenar(Infinity) },
    { label: atajo('Traer adelante', 'Ctrl+]'), action: () => reordenar(1) },
    { label: atajo('Enviar atrás', 'Ctrl+['), action: () => reordenar(-1) },
    { label: atajo('Enviar al fondo', 'Ctrl+Shift+['), action: () => reordenar(-Infinity) },
    { label: atajo('Agrupar', 'Ctrl+G'), action: agrupar },
    { label: atajo('Desagrupar', 'Ctrl+Shift+G'), action: desagrupar },
    { label: atajo('Mostrar / ocultar', 'Ctrl+Shift+H'), action: () => alternar('visible') },
    { label: atajo('Bloquear / desbloquear', 'Ctrl+Shift+L'), action: () => alternar('bloqueado') },
    { label: 'Exportar como PNG', action: () => exportarPng(seleccionados(), 2) },
    { label: atajo('Eliminar', 'Supr'), danger: true, action: eliminarSeleccion },
  ] : [
    { label: atajo('Pegar', 'Ctrl+V'), action: () => toast('Usa Ctrl+V para pegar') },
    { label: atajo('Seleccionar todo', 'Ctrl+A'), action: seleccionarTodo },
    { label: atajo('Ver todo', 'Shift+1'), action: verTodo },
    { label: atajo('Deshacer', 'Ctrl+Z'), action: deshacer },
    { label: atajo('Rehacer', 'Ctrl+Shift+Z'), action: rehacer },
  ];
  showMenu(ancla, items);
  ancla.remove();
}

// ---------- Atajos ----------
function atajos() {
  const grupos = [
    ['Herramientas', [['V', 'Mover'], ['F', 'Marco'], ['R', 'Rectángulo'], ['O', 'Elipse'], ['L', 'Línea'], ['Shift+L', 'Flecha'], ['T', 'Texto'], ['Ctrl+Shift+K', 'Imagen'], ['H o Espacio', 'Mano (moverse)']]],
    ['Edición', [['Ctrl+Z', 'Deshacer'], ['Ctrl+Shift+Z / Ctrl+Y', 'Rehacer'], ['Ctrl+C / X / V', 'Copiar, cortar, pegar'], ['Ctrl+D', 'Duplicar'], ['Alt + arrastrar', 'Duplicar al mover'], ['Supr', 'Eliminar'], ['Flechas', 'Mover 1 px (Shift: 10 px)'], ['Ctrl+G / Ctrl+Shift+G', 'Agrupar / desagrupar'], ['Ctrl+] / Ctrl+[', 'Adelante / atrás'], ['Ctrl+Shift+H', 'Ocultar'], ['Ctrl+Shift+L', 'Bloquear']]],
    ['Selección', [['Ctrl+A', 'Seleccionar todo'], ['Shift+clic', 'Sumar a la selección'], ['Doble clic', 'Entrar al grupo / editar texto'], ['Enter', 'Editar texto / entrar al marco'], ['Esc', 'Subir de nivel / soltar']]],
    ['Al arrastrar', [['Shift', 'Proporción fija / ejes rectos'], ['Alt', 'Desde el centro'], ['Ctrl', 'Sin guías inteligentes']]],
    ['Vista', [['Ctrl + rueda', 'Acercar / alejar'], ['+ / −', 'Acercar / alejar'], ['Shift+0', 'Zoom 100%'], ['Shift+1', 'Ver todo'], ['Shift+2', 'Ver selección'], ['Shift+Espacio', 'Presentar']]],
  ];
  const body = $('#atajosBody');
  body.textContent = '';
  body.append(...grupos.map(([t, l]) => h('section', {}, h('h3', {}, t), h('dl', {}, l.flatMap(([k, d]) => [h('dt', {}, h('kbd', {}, k)), h('dd', {}, d)])))));
  $('#atajosDialog').showModal();
}
