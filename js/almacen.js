// Dónde se guardan los archivos de mockups:
// - AlmacenLocal: en el navegador (modo de prueba). Las pestañas del mismo navegador se ven entre sí.
// - AlmacenFirebase: en Firestore, compartido con todo el equipo y en tiempo real.
//
// Un archivo es un documento de "mockups" (nombre, páginas, propietario, miniatura).
// Cada figura es un documento de "mockups/{archivo}/objetos": así dos personas pueden cambiar
// figuras distintas (o propiedades distintas de la misma figura) al mismo tiempo sin pisarse.
// "mockups/{archivo}/presencia/{persona}" dice dónde está el cursor de cada quien, qué tiene
// seleccionado y qué está arrastrando o escribiendo (eso es lo que los demás ven sombreado).

export const nuevoId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20);
// Firestore no acepta "undefined": se quita con JSON
const limpio = o => JSON.parse(JSON.stringify(o));

export function crearAlmacen(sesion) {
  return sesion.modo === 'firebase' ? new AlmacenFirebase(sesion) : new AlmacenLocal(sesion);
}

// ---------- Navegador (modo de prueba) ----------
class AlmacenLocal {
  modo = 'local';
  intervaloPresencia = 40;
  constructor(sesion) {
    this.sesion = sesion;
    this.canal = 'BroadcastChannel' in window ? new BroadcastChannel('mockups') : null;
    this.oyentes = new Set();
    if (this.canal) this.canal.onmessage = e => this.oyentes.forEach(f => f(e.data));
  }
  leer(clave, porDefecto) { try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto; } catch { return porDefecto; } }
  escribirClave(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); }
    catch { throw new Error('El navegador no tiene más espacio (modo de prueba). Quita imágenes grandes.'); }
  }
  avisar(msg, tambienAqui = false) {
    this.canal?.postMessage(msg);
    if (tambienAqui) this.oyentes.forEach(f => f(msg));
  }
  oir(f) { this.oyentes.add(f); return () => this.oyentes.delete(f); }

  archivos() { return this.leer('mockups:archivos', {}); }
  escucharArchivos(cb) {
    const enviar = () => cb(Object.values(this.archivos()).map(a => ({ ...a, actualizado: a.actualizado ? new Date(a.actualizado) : null })));
    enviar();
    return this.oir(m => { if (m.tipo === 'archivos') enviar(); });
  }
  async crearArchivo({ nombre, paginas, objetos = [] }) {
    const id = nuevoId();
    const todos = this.archivos();
    todos[id] = { id, nombre, paginas, propietario: this.sesion.correo || 'yo', creado: Date.now(), actualizado: Date.now(), actualizadoPor: '' };
    this.escribirClave('mockups:archivos', todos);
    this.escribirClave('mockups:obj:' + id, Object.fromEntries(objetos.map(o => [o.id, o])));
    this.avisar({ tipo: 'archivos' }, true);
    return id;
  }
  async actualizarArchivo(id, parcial) {
    const todos = this.archivos();
    if (!todos[id]) return;
    todos[id] = { ...todos[id], ...limpio(parcial), actualizado: Date.now() };
    this.escribirClave('mockups:archivos', todos);
    this.avisar({ tipo: 'archivos' }, true);
    this.avisar({ tipo: 'archivo', id, datos: todos[id] }, true);
  }
  async eliminarArchivo(id) {
    const todos = this.archivos();
    delete todos[id];
    this.escribirClave('mockups:archivos', todos);
    localStorage.removeItem('mockups:obj:' + id);
    this.avisar({ tipo: 'archivos' }, true);
  }
  async leerObjetos(id) { return Object.values(this.leer('mockups:obj:' + id, {})); }

  abrir(id, { alArchivo, alObjetos, alPresencia }) {
    const clave = 'mockups:obj:' + id;
    const yo = this.sesion.uid;
    const datos = this.archivos()[id];
    if (!datos) { setTimeout(() => alArchivo(null)); return { escribir() {}, presencia() {}, cerrar() {} }; }
    setTimeout(() => {
      alArchivo(datos);
      alObjetos(Object.values(this.leer(clave, {})).map(d => ({ id: d.id, datos: d })), true);
    });
    const otros = new Map();
    const enviarPresencia = () => alPresencia([...otros.values()]);
    const quitar = this.oir(m => {
      if (m.tipo === 'archivo' && m.id === id) alArchivo(m.datos);
      if (m.tipo === 'objetos' && m.archivo === id && m.origen !== yo) alObjetos(m.cambios);
      if (m.tipo === 'presencia' && m.archivo === id && m.uid !== yo) {
        if (m.datos) otros.set(m.uid, { ...m.datos, uid: m.uid }); else otros.delete(m.uid);
        enviarPresencia();
        // Si alguien acaba de llegar, se le cuenta quién está
        if (m.nuevo && ultimaPresencia) this.avisar({ tipo: 'presencia', archivo: id, uid: yo, datos: ultimaPresencia });
      }
    });
    let ultimaPresencia = null;
    let anunciado = false;
    return {
      escribir: async cambios => {
        const todos = this.leer(clave, {});
        const salida = [];
        for (const c of cambios) {
          if (c.datos === null) { delete todos[c.id]; salida.push({ id: c.id, datos: null }); continue; }
          const nuevo = limpio(c.parcial && todos[c.id] ? { ...todos[c.id], ...c.datos } : { ...c.datos, id: c.id });
          todos[c.id] = nuevo;
          salida.push({ id: c.id, datos: nuevo });
        }
        this.escribirClave(clave, todos);
        this.avisar({ tipo: 'objetos', archivo: id, origen: yo, cambios: salida });
      },
      presencia: datos => {
        ultimaPresencia = limpio(datos);
        this.avisar({ tipo: 'presencia', archivo: id, uid: yo, datos: ultimaPresencia, nuevo: !anunciado });
        anunciado = true;
      },
      cerrar: () => { this.avisar({ tipo: 'presencia', archivo: id, uid: yo, datos: null }); quitar(); },
      salir: () => this.avisar({ tipo: 'presencia', archivo: id, uid: yo, datos: null }),
    };
  }
}

// ---------- Firebase (Firestore) ----------
class AlmacenFirebase {
  modo = 'firebase';
  constructor(sesion) {
    // Cada cuánto se envía el cursor (milisegundos): Firestore cobra cada escritura
    this.intervaloPresencia = sesion.presencia ? sesion.presencia.intervalo : 400;
    this.sesion = sesion;
    this.fs = sesion.fs;
    this.db = sesion.db;
    this.col = this.fs.collection(this.db, 'mockups');
  }
  get correo() { return this.sesion.correo; }

  escucharArchivos(cb) {
    return this.fs.onSnapshot(this.col, qs => {
      cb(qs.docs.map(d => {
        const x = d.data();
        return { ...x, id: d.id, actualizado: x.actualizado?.toDate?.() || null };
      }));
    }, err => { console.warn('No se pueden leer los archivos', err); cb(null, err); });
  }
  async crearArchivo({ nombre, paginas, objetos = [] }) {
    const ref = this.fs.doc(this.col);
    const fs = this.fs;
    await fs.setDoc(ref, {
      nombre, paginas, propietario: this.correo, creado: fs.serverTimestamp(),
      actualizado: fs.serverTimestamp(), actualizadoPor: this.correo,
    });
    await this.escribirLotes(ref.id, objetos.map(o => ({ id: o.id, datos: o })));
    return ref.id;
  }
  async actualizarArchivo(id, parcial) {
    await this.fs.updateDoc(this.fs.doc(this.col, id), { ...limpio(parcial), actualizado: this.fs.serverTimestamp(), actualizadoPor: this.correo });
  }
  async eliminarArchivo(id) {
    const fs = this.fs;
    // Primero las figuras y la presencia (Firestore no borra las subcolecciones solo)
    for (const sub of ['objetos', 'presencia']) {
      const qs = await fs.getDocs(fs.collection(this.db, 'mockups', id, sub));
      await this.escribirLotes(id, qs.docs.map(d => ({ id: d.id, datos: null })), sub);
    }
    await fs.deleteDoc(fs.doc(this.col, id));
  }
  async leerObjetos(id) {
    const qs = await this.fs.getDocs(this.fs.collection(this.db, 'mockups', id, 'objetos'));
    return qs.docs.map(d => ({ ...d.data(), id: d.id }));
  }
  // Firestore acepta hasta 500 cambios por lote
  async escribirLotes(archivo, cambios, sub = 'objetos') {
    const fs = this.fs;
    for (let i = 0; i < cambios.length; i += 400) {
      const lote = fs.writeBatch(this.db);
      for (const c of cambios.slice(i, i + 400)) {
        const ref = fs.doc(this.db, 'mockups', archivo, sub, c.id);
        if (c.datos === null) lote.delete(ref);
        else if (c.parcial) lote.set(ref, limpio(c.datos), { merge: true });
        else lote.set(ref, limpio({ ...c.datos, id: c.id }));
      }
      await lote.commit();
    }
  }

  abrir(id, { alArchivo, alObjetos, alPresencia }) {
    const fs = this.fs;
    const yo = this.sesion.uid;
    const quitar = [];
    quitar.push(fs.onSnapshot(fs.doc(this.col, id), snap => alArchivo(snap.exists() ? { ...snap.data(), id } : null),
      err => console.warn('No se puede leer el archivo', err)));
    let primero = true;
    quitar.push(fs.onSnapshot(fs.collection(this.db, 'mockups', id, 'objetos'), qs => {
      const cambios = qs.docChanges().map(c => ({ id: c.doc.id, datos: c.type === 'removed' ? null : { ...c.doc.data(), id: c.doc.id } }));
      alObjetos(cambios, primero);
      primero = false;
    }, err => console.warn('No se pueden recibir las figuras', err)));
    // Presencia: por Realtime Database si está configurada (fluida); si no, por Firestore (más despacio)
    let canal;
    if (this.sesion.presencia) canal = this.sesion.presencia.abrir(id, alPresencia);
    else {
      quitar.push(fs.onSnapshot(fs.collection(this.db, 'mockups', id, 'presencia'), qs => {
        alPresencia(qs.docs.filter(d => d.id !== yo).map(d => ({ ...d.data(), uid: d.id })));
      }, err => console.warn('No se puede ver quién está conectado', err)));
      const miPresencia = fs.doc(this.db, 'mockups', id, 'presencia', yo);
      canal = {
        enviar: datos => fs.setDoc(miPresencia, limpio(datos)).catch(err => console.warn('presencia', err)),
        cerrar: () => fs.deleteDoc(miPresencia).catch(() => {}),
        salir: () => fs.deleteDoc(miPresencia).catch(() => {}),
      };
    }
    let marcarArchivo = null;
    return {
      escribir: async cambios => {
        await this.escribirLotes(id, cambios);
        // "Modificado hace…" en la lista de archivos, sin escribir el archivo en cada cambio
        clearTimeout(marcarArchivo);
        marcarArchivo = setTimeout(() => this.actualizarArchivo(id, {}).catch(() => {}), 4000);
      },
      presencia: datos => canal.enviar(datos),
      cerrar: () => { quitar.forEach(f => f()); canal.cerrar(); },
      salir: () => canal.salir(),
    };
  }
}
