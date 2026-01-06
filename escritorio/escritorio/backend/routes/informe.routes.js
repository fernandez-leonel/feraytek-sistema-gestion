// Descripción:
// Rutas administrativas del módulo INFORME agrupadas bajo /api/informe.
// Aplica verifyToken e isAdmin y delega en el controlador.
// ----------------------------------------------------------------------

const express = require('express')
const router = express.Router()
const InformeController = require('../controllers/informe.controller')
const { verifyToken, isAdmin } = require('../middleware/auth')

router.get('/api/informe/ventas', verifyToken, isAdmin, InformeController.ventasGanancias)
router.get('/api/informe/envios', verifyToken, isAdmin, InformeController.enviosLogistica)
router.get('/api/informe/usuarios', verifyToken, isAdmin, InformeController.usuariosActividad)
router.get('/api/informe/productos', verifyToken, isAdmin, InformeController.productosStock)
router.get('/api/informe/resenas-soporte', verifyToken, isAdmin, InformeController.reseñasSoporte)

module.exports = router

// ----------------------------------------------------------------------
// Nota: Router compacto y claro; ≤150 líneas y sin lógica.