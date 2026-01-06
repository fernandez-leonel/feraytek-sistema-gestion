// =====================================================================
// soporte.routes.js
// Aplica `verifyToken`/`isAdmin` y mapea endpoints a Controller
// =====================================================================

const express = require('express')
const router = express.Router()
const SoporteController = require('../controllers/soporte.controller')
const auth = require('../middleware/auth')

// Crear ticket (usuario autenticado)
router.post('/soporte', auth.verifyToken, (req, res) => SoporteController.crear(req, res))
// Mis tickets (usuario autenticado)
router.get('/soporte/mis-tickets', auth.verifyToken, (req, res) => SoporteController.misTickets(req, res))
// Listar todos con filtros (admin)
router.get('/soporte', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.listarTodos(req, res))
// Obtener por ID (admin)
router.get('/soporte/:id', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.obtener(req, res))
// Estadísticas (admin)
router.get('/soporte/estadisticas', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.estadisticas(req, res))
// Responder (admin)
router.put('/soporte/:id/responder', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.responder(req, res))
// Cambiar prioridad (admin)
router.put('/soporte/:id/prioridad', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.prioridad(req, res))
// Cerrar (admin)
router.put('/soporte/:id/cerrar', auth.verifyToken, auth.isAdmin, (req, res) => SoporteController.cerrar(req, res))

module.exports = router

// ----------------------------------------------------------------------
// Explicación
// Rutas de soporte: capa delgada con auth y mapeo; sin lógica extra.
// ≤150 líneas, consistente con el patrón del proyecto.