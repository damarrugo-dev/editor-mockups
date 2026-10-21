// Modo Presentar: muestra un marco como si fuera la página real y sigue los enlaces del prototipo.
import { $, h } from './util.js';
import { E, on, objetosPagina, seleccionados, esMarco, padreDe, porOrden } from './editor.js';
import { construirEscena } from './exportar.js';

let actual = null;
const historial = [];

export function iniciarPresentar() {
  $('#btnPresentar').onclick = abrir;
  on('presentar', abrir);
  $('#presCerrar').onclick = cerrar;
  $('#presMarco').onchange = e => ir(e.target.value);
  on('objetos', () => { if (!$('#presentacion').hidden) dibujar(); });
  window.addEventListener('resize', () => { if (!$('#presentacion').hidden) dibujar(); });
  document.addEventListener('keydown', e => {
    if ($('#presentacion').hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    const ms = marcos();
    const i = ms.findIndex(m => m.id === actual);
    if (e.key === 'ArrowRight' && ms[i + 1]) ir(ms[i + 1].id);
    if (e.key === 'ArrowLeft' && ms[i - 1]) ir(ms[i - 1].id);
  });
}
const marcos = () => objetosPagina().filter(o => esMarco(o) && !padreDe(o) && o.visible !== false).sort((a, b) => a.y - b.y || a.x - b.x);

function abrir() {
  const ms = marcos();
  if (!ms.length) { import('./util.js').then(u => u.toast('Esta página no tiene marcos para presentar.')); return; }
  const sel = seleccionados()[0];
  const desde = sel && (esMarco(sel) ? sel : padreDe(sel));
  historial.length = 0;
  actual = (desde || ms[0]).id;
  $('#presentacion').hidden = false;
  dibujar();
}
function cerrar() { $('#presentacion').hidden = true; }
function ir(id, guardar = true) {
  if (guardar && actual) historial.push(actual);
  actual = id;
  dibujar();
}

function dibujar() {
  const ms = marcos();
  const marco = ms.find(m => m.id === actual) || ms[0];
  if (!marco) return cerrar();
  actual = marco.id;
  const sel = $('#presMarco');
  sel.textContent = '';
  sel.append(...ms.map(m => h('option', { value: m.id, selected: m.id === actual }, m.nombre)));
  const escena = $('#presEscena');
  escena.textContent = '';
  const { cont, nodos } = construirEscena([marco], objetosPagina());
  // El marco se ve a su ancho real si cabe; si no, se reduce. Los marcos altos se recorren con scroll.
  const k = Math.min(1, (escena.clientWidth - 40) / marco.w);
  const caja = h('div', { class: 'pres-marco', style: `width:${marco.w * k}px;height:${marco.h * k}px` }, cont);
  cont.style.transform = `scale(${k})`;
  cont.style.transformOrigin = '0 0';
  cont.style.boxShadow = '0 10px 40px rgba(0,0,0,.35)';
  escena.append(caja);
  for (const [id, el] of nodos) {
    const o = objetosPagina().find(x => x.id === id);
    if (!o?.enlace) continue;
    el.classList.add('enlace-pres');
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (o.enlace.startsWith('url:')) window.open(o.enlace.slice(4), '_blank', 'noopener');
      else if (o.enlace === '__atras') { const prev = historial.pop(); if (prev) ir(prev, false); }
      else if (ms.some(m => m.id === o.enlace)) { ir(o.enlace); escena.scrollTop = 0; }
    });
  }
  // Clic fuera de un enlace: se resaltan los enlaces para que se vea dónde se puede tocar
  cont.addEventListener('click', () => { cont.classList.remove('pista'); void cont.offsetWidth; cont.classList.add('pista'); });
}
