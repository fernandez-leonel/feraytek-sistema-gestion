/**
 * ===============================================
 * Middleware: errorHandler
 * Descripción: Manejo centralizado de errores.
 * ===============================================
 */

// Empezamos a capturar errores especificos
function errorHandler(err, req, res, next) {
  // Mensaje de error en consola para desarrollo
  console.error(" X Error Detectado:", err.message);

  // Responder con el error en formato JSON de err.status o 500 si no tiene
  res.status(err.status || 500).json({
    success: false,
    // Mensaje en Json
    message: err.message || "Error interno del servidor",
  });
}

module.exports = errorHandler;
