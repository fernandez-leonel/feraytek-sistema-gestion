const express = require("express");
const router = express.Router();
const HistorialPedidosController = require("../controllers/historialPedidos.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Ruta temporal para verificar datos
router.get("/verificar-datos", verifyToken, isAdmin, HistorialPedidosController.verificarDatosHistorial);

// Ruta temporal para crear historial automáticamente para pedidos existentes
router.post('/crear-historial-automatico', verifyToken, isAdmin, HistorialPedidosController.crearHistorialAutomatico);

// Rutas disponibles - Solo admins pueden acceder al historial
router.get("/", verifyToken, isAdmin, HistorialPedidosController.listar); // Solo admins pueden ver historial completo
router.get("/pedido/:id_pedido", verifyToken, isAdmin, HistorialPedidosController.listarPorPedido); // Solo admins pueden ver historial por pedido
router.post("/", verifyToken, isAdmin, HistorialPedidosController.registrar); // Solo admins pueden registrar cambios

module.exports = router;
