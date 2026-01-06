/**
 * ===============================================
 * Archivo: server.js
 * Descripción: Punto de entrada del servidor.
 * Lee el puerto del archivo .env y levanta la app.
 * ===============================================
 */

const app = require("./app");
const auditModel = require("./models/audit.model");
const passwordResetModel = require("./models/passwordReset.model");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Inicializar tabla de auditoría
async function initializeAuditTable() {
  try {
    await auditModel.createAuditTable();
    console.log("✓ Tabla de auditoría inicializada correctamente");
  } catch (error) {
    console.error("✗ Error al inicializar tabla de auditoría:", error.message);
  }
}

// Inicializar tabla de password resets
async function initializePasswordResetTable() {
  try {
    await passwordResetModel.createTable();
    console.log("✓ Tabla de password_resets inicializada correctamente");
  } catch (error) {
    console.error("✗ Error al inicializar tabla de password_resets:", error.message);
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`OK ARIELO - Servidor corriendo en http://localhost:${PORT}`);
  
  // Inicializar tabla de auditoría
  await initializeAuditTable();
  
  // Inicializar tabla de password resets
  await initializePasswordResetTable();
});
