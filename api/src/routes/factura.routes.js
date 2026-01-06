// ======================================================================
// Rutas de Facturas
// Define los endpoints para gestión de facturas con autenticación apropiada
// ======================================================================

const express = require("express");
const router = express.Router();
const FacturaController = require("../controllers/factura.controller");
const authMiddleware = require("../middleware/auth");

// ========== RUTAS PARA ADMINISTRADORES ==========
// Todas requieren autenticación y rol de administrador

// Obtener estadísticas de facturas (solo admin) - DEBE IR ANTES DE /:id
router.get("/admin/estadisticas", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.obtenerEstadisticas
);

// Buscar facturas (solo admin) - DEBE IR ANTES DE /:id
router.get("/admin/buscar", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.buscarFacturas
);

// Obtener todas las facturas (solo admin)
router.get("/admin/todas", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.obtenerTodas
);

// Obtener factura por ID (admin puede ver cualquiera)
router.get("/admin/:id", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.obtenerPorId
);

// Crear nueva factura (solo admin)
router.post("/admin", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.crear
);

// Marcar factura como enviada por email (solo admin)
router.patch("/admin/:id/marcar-enviada", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.marcarEnviada
);

// Enviar factura por email (solo admin)
router.post("/admin/:id/enviar-email", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.enviarPorEmail
);

// Generar PDF de factura (solo admin)
router.post("/admin/:id/generar-pdf", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.generarPDF
);

// Obtener PDF de factura (solo admin)
router.get("/admin/:id/pdf", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.generarPDF
);

// ========== RUTAS PARA CLIENTES ==========
// Requieren autenticación, los clientes solo pueden ver sus propias facturas

// Obtener mis facturas (cliente autenticado)
router.get("/mis-facturas", 
  authMiddleware.verifyToken, 
  FacturaController.obtenerMisFacturas
);

// Verificar factura por número o ID (usuarios autenticados)
router.get("/verificar", 
  authMiddleware.verifyToken, 
  FacturaController.verificarFactura
);

// Obtener una factura específica mía (cliente autenticado)
router.get("/mis-facturas/:id", 
  authMiddleware.verifyToken, 
  FacturaController.obtenerMiFactura
);

// Descargar PDF de mi factura (cliente autenticado)
router.get("/mis-facturas/:id/pdf", 
  authMiddleware.verifyToken, 
  FacturaController.descargarMiFacturaPDF
);

// Solicitar reenvío de factura por email (cliente autenticado)
router.post("/mis-facturas/:id/reenviar", 
  authMiddleware.verifyToken, 
  FacturaController.solicitarReenvio
);

// ========== RUTAS LEGACY (MANTENER COMPATIBILIDAD) ==========
// Estas rutas mantienen compatibilidad con implementaciones anteriores
// pero ahora requieren autenticación de administrador

// Obtener todas las facturas (legacy - solo admin)
router.get("/", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.obtenerTodas
);

// Obtener factura por ID (legacy - solo admin)
router.get("/:id", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.obtenerPorId
);

// Crear nueva factura (legacy - solo admin)
router.post("/", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.crear
);

// Marcar como enviada (legacy - solo admin)
router.patch("/:id/enviar", 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  FacturaController.marcarEnviada
);

module.exports = router;
