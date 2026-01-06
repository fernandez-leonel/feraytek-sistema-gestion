// Descripción:
// Rutas administrativas de envíos para el panel Feraytek.
// Aplica verifyToken e isAdmin y delega al controlador.
// ----------------------------------------------------------------------

const express = require("express")
const router = express.Router()
const EnvioController = require("../controllers/envio.controller")
const { verifyToken, isAdmin } = require("../middleware/auth")

// Lista de Envios
router.get("/envios", verifyToken, isAdmin, EnvioController.listarEnvios)
// Obtener por ID
router.get("/envios/:id", verifyToken, isAdmin, EnvioController.obtenerEnvio)
// Crear manual
router.post("/envios", verifyToken, isAdmin, EnvioController.crearEnvio)
// Crear para pedidos existentes
router.post("/envios/crear-para-existentes", verifyToken, isAdmin, EnvioController.crearEnviosParaPedidosExistentes)
// Actualizar datos
router.put("/envios/:id", verifyToken, isAdmin, EnvioController.actualizarDatosEnvio)
// Cambiar estado
router.put("/envios/:id/estado", verifyToken, isAdmin, EnvioController.cambiarEstadoEnvio)
// Eliminar
router.delete("/envios/:id", verifyToken, isAdmin, EnvioController.eliminarEnvio)

module.exports = router

// ----------------------------------------------------------------------
// Nota: Este router mapea endpoints admin y aplica auth/rol.
// Se mantiene ≤150 líneas delegando toda la lógica al Controller.