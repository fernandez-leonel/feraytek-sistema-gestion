// =====================================================================
// resena.routes.js
// Mapea endpoints de reseñas y aplica middlewares de auth/rol
// =====================================================================

const express = require("express")
const router = express.Router()
const ResenaController = require("../controllers/resena.controller")
const auth = require("../middleware/auth")

// Crear reseña (usuario autenticado)
router.post('/resenas', auth.verifyToken, (req, res) => ResenaController.crear(req, res))
// Listar todas (solo admin)
router.get('/resenas', auth.verifyToken, auth.isAdmin, (req, res) => ResenaController.listarTodas(req, res))
// Listar por producto (público)
router.get('/resenas/producto/:id_producto', (req, res) => ResenaController.listarPorProducto(req, res))
// Obtener reseña (autenticado)
router.get('/resenas/obtener', auth.verifyToken, (req, res) => ResenaController.obtener(req, res))
// Actualizar reseña (autor autenticado)
router.put('/resenas/:id', auth.verifyToken, (req, res) => ResenaController.actualizar(req, res))

module.exports = router

// ----------------------------------------------------------------------
// Explicación
// Router de reseñas: aplica `verifyToken`/`isAdmin` y delega al Controller.
// ≤150 líneas, responsabilidades claras y sin lógica adicional.