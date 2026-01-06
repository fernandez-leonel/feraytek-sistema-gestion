// Este archivo define los endpoints de la API relacionados con los pagos.
const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pago.controller");
const authMiddleware = require("../middleware/auth");

// GET /api/pagos/test - Endpoint de prueba
router.get("/test", (req, res) => {
  process.stdout.write("=== ENDPOINT DE PRUEBA CON STDOUT ===\n");
  console.log("=== ENDPOINT DE PRUEBA CON CONSOLE.LOG ===");
  console.error("=== ENDPOINT DE PRUEBA CON CONSOLE.ERROR ===");
  res.json({ ok: true, message: "Endpoint de prueba funcionando" });
});

// POST /api/pagos - Crear pago (solo usuarios autenticados)
router.post("/", authMiddleware.verifyToken, pagoController.crearPago);

// GET /api/pagos - Listar todos los pagos (solo administradores)
router.get("/", authMiddleware.verifyToken, authMiddleware.isAdmin, pagoController.listarPagos);

// GET /api/pagos/consulta - Consultar pagos con filtros (usuarios autenticados)
router.get("/consulta", authMiddleware.verifyToken, pagoController.consultarPagos);

// GET /api/pagos/:id - Obtener pago específico (usuario propietario o admin)
router.get("/:id", authMiddleware.verifyToken, pagoController.obtenerPago);

// PUT /api/pagos/:id/estado - Actualizar estado (solo administradores)
router.put("/:id/estado", authMiddleware.verifyToken, authMiddleware.isAdmin, pagoController.actualizarEstadoPago);

// POST /api/pagos/webhook - Webhook de Mercado Pago (público para MP)
router.post("/webhook", pagoController.recibirWebhook);

// POST /api/pagos/simular-aprobacion/:id_transaccion - Simular aprobación (solo admins en desarrollo)
router.post("/simular-aprobacion/:id_transaccion", authMiddleware.verifyToken, authMiddleware.isAdmin, pagoController.simularAprobacionPago);

router.post("/aprobar", authMiddleware.verifyToken, authMiddleware.isAdmin, pagoController.aprobarPagoPorReferencia);

module.exports = router;
