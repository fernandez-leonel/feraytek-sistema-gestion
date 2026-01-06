// =====================================================================
// Define los endpoints RESTful relacionados al carrito de compras.
// ======================================================================

const express = require("express");
const router = express.Router();
const CarritoController = require("../controllers/carrito.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// ----------------------------------------------------------------------
// Documentación rápida de endpoints:
// GET    /api/carrito          -> Lista los productos del carrito activo
// POST   /api/carrito          -> Agrega un producto al carrito
// DELETE /api/carrito/item     -> Elimina un producto del carrito
// DELETE /api/carrito          -> Vacía el carrito completo
// ----------------------------------------------------------------------

// Rutas del carrito para usuarios autenticados
router.get("/", verifyToken, CarritoController.listar);
router.post("/", verifyToken, CarritoController.agregar);
router.delete("/item", verifyToken, CarritoController.eliminar);
router.delete("/", verifyToken, CarritoController.vaciar);

// Rutas administrativas del carrito
router.get("/admin/todos", verifyToken, isAdmin, CarritoController.listarTodos);
router.get("/admin/usuario/:id", verifyToken, isAdmin, CarritoController.verCarritoUsuario);
router.get("/admin/abandonados", verifyToken, isAdmin, CarritoController.carritosAbandonados);
router.delete("/admin/limpiar-abandonados", verifyToken, isAdmin, CarritoController.limpiarAbandonados);
router.get("/admin/estadisticas", verifyToken, isAdmin, CarritoController.estadisticasCarritos);

module.exports = router;
