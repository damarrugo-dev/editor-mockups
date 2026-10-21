// Conexión a la base de datos del editor (Firebase). Es un proyecto de Firebase propio del editor.
// Si se pone en null, el editor funciona en "modo de prueba" (solo guarda en este navegador;
// dos pestañas del mismo navegador se ven entre sí, para probar la edición en equipo).
// Esta configuración es pública por diseño: los datos los protegen las reglas de firestore.rules
// y database.rules.json.
export const firebaseConfig = {
  apiKey: "AIzaSyAU06dxDokfut1lZM6yRcK9SdEQxbNCrY0",
  authDomain: "editor-mockups.firebaseapp.com",
  databaseURL: "https://editor-mockups-default-rtdb.firebaseio.com",
  projectId: "editor-mockups",
  storageBucket: "editor-mockups.firebasestorage.app",
  messagingSenderId: "503169657093",
  appId: "1:503169657093:web:d7811a55d09f6f8c686f6c"
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

// Dirección de la Realtime Database del mismo proyecto de Firebase (para cursores y sombras fluidos).
// Se ve en Firebase → Realtime Database, arriba de los datos. En null, la presencia va por Firestore (más lenta).
export const presenciaURL = "https://editor-mockups-default-rtdb.firebaseio.com";
