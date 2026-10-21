// Presencia en tiempo real con Firebase Realtime Database: cursores, selección y lo que cada persona
// está arrastrando o escribiendo. Se usa Realtime Database (y no Firestore) porque un cursor cambia
// muchas veces por segundo: en Realtime Database eso no cuesta escrituras y, si alguien cierra la
// pestaña, su cursor desaparece solo (onDisconnect).
// Si config.js no tiene "presenciaURL", la presencia va por Firestore, más despacio (ver almacen.js).
import { VERSION_FIREBASE } from './sesion.js';

export async function conectarPresencia(sesion, url) {
  const rt = await import(`https://www.gstatic.com/firebasejs/${VERSION_FIREBASE}/firebase-database.js`);
  const db = rt.getDatabase(sesion.app, url);
  return {
    intervalo: 50,
    abrir(archivo, alPresencia) {
      const sala = rt.ref(db, `presencia_mockups/${archivo}`);
      const mia = rt.ref(db, `presencia_mockups/${archivo}/${sesion.uid}`);
      rt.onDisconnect(mia).remove();
      const quitar = rt.onValue(sala, snap => {
        const todos = snap.val() || {};
        alPresencia(Object.entries(todos).filter(([uid]) => uid !== sesion.uid).map(([uid, d]) => ({ ...d, uid })));
      }, err => console.warn('No se puede ver quién está conectado', err));
      return {
        enviar: datos => rt.set(mia, JSON.parse(JSON.stringify(datos))).catch(err => console.warn('presencia', err)),
        cerrar: () => { quitar(); rt.remove(mia).catch(() => {}); },
        salir: () => rt.remove(mia).catch(() => {}),
      };
    },
  };
}
