// =====================================================================
// Rutas Carrito
// Mapea endpoints del panel y usuarios hacia el Controller
// =====================================================================

const express = require("express")
const router = express.Router()
const CarritoController = require("../controllers/carrito.controller")

// ------------------------ Cliente autenticado -------------------------
router.get("/carrito", (req, res) => CarritoController.listar(req, res))
router.post("/carrito", (req, res) => CarritoController.agregar(req, res))
router.delete("/carrito/item", (req, res) => CarritoController.eliminar(req, res))
router.delete("/carrito", (req, res) => CarritoController.vaciar(req, res))

// --------------------------- Administradores --------------------------
router.get("/carrito/admin/todos", (req, res) => CarritoController.listarTodos(req, res))
router.get("/carrito/admin/usuario/:id", (req, res) => CarritoController.verCarritoUsuario(req, res))
router.get("/carrito/admin/abandonados", (req, res) => CarritoController.carritosAbandonados(req, res))
router.delete("/carrito/admin/limpiar-abandonados", (req, res) => CarritoController.limpiarAbandonados(req, res))
router.get("/carrito/admin/estadisticas", (req, res) => CarritoController.estadisticasCarritos(req, res))

module.exports = router

// ----------------------------------------------------------------------
// Explicación
// Este router sólo mapea rutas y delega; la autenticación llega por headers.
// Conecta con el Controller; ≤150 líneas para mantener legibilidad.