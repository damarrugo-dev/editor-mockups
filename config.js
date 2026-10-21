// Conexión a la base de datos compartida (Firebase). Es la misma del Tablero Kanban y del Diagrama de Gantt:
// se entra con la misma cuenta y el registro de accesos es uno solo.
// Si se pone en null, el editor funciona en "modo de prueba" (solo guarda en este navegador;
// dos pestañas del mismo navegador se ven entre sí, para probar la edición en equipo).
// Esta configuración es pública por diseño: los datos los protegen las reglas de firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyA0c0X87PBi3a21YJOkH970xE12OHiaY_Y",
  authDomain: "tablero-kanban-f5f28.firebaseapp.com",
  projectId: "tablero-kanban-f5f28",
  storageBucket: "tablero-kanban-f5f28.firebasestorage.app",
  messagingSenderId: "670983517801",
  appId: "1:670983517801:web:f2918705cfdc983870d4f8"
};

// Inicio de sesión: solo entran personas con correo de la empresa.
//   metodo: "correo"     → llega un enlace al correo | "microsoft" → cuenta de Microsoft
//   dominios             → solo se aceptan correos de estos dominios (deben coincidir con firestore.rules)
//   administradores      → ven el registro de accesos (botón "Accesos"); deben coincidir con firestore.rules
//   tenant: "..."        → solo para "microsoft": ID del directorio de Microsoft Entra
export const login = {
  metodo: "correo",
  dominios: ["hitss.com", "anava.com"],
  administradores: ["marrugod@hitss.com"],
};
