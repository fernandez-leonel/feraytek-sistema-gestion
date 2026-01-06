// ======================================================================
// Define los endpoints RESTful para el módulo de pedidos.
// ======================================================================

const express = require("express");
const router = express.Router();
const PedidoController = require("../controllers/pedido.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Ruta temporal para verificar datos
router.get("/verificar-datos", verifyToken, isAdmin, PedidoController.verificarDatos);

// Rutas para usuarios autenticados (rutas específicas ANTES que las parametrizadas)
router.get("/usuario", verifyToken, PedidoController.obtenerPedidosUsuario); // Usuario obtiene sus propios pedidos
router.post("/", verifyToken, PedidoController.crearDesdeCarrito); // Usuario autenticado puede crear pedido

// Rutas administrativas
router.get("/", verifyToken, isAdmin, PedidoController.listar); // Solo admins pueden ver TODOS los pedidos
router.get("/:id", verifyToken, PedidoController.detalle); // Usuario autenticado puede ver sus pedidos (validar en controlador)
router.put("/:id/estado", verifyToken, isAdmin, PedidoController.actualizarEstado); // Solo admins pueden cambiar estado

module.exports = router;
