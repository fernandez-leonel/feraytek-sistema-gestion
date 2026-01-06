const express = require("express");
const router = express.Router();
const SoporteController = require("../controllers/soporte.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Crear ticket (cualquier usuario autenticado puede crear un ticket)
router.post("/", verifyToken, SoporteController.crear);

// Obtener mis tickets (usuario autenticado ve sus propios tickets)
router.get("/mis-tickets", verifyToken, SoporteController.misTickets);

// Obtener estadísticas de soporte (solo admin)
router.get("/estadisticas", verifyToken, isAdmin, SoporteController.obtenerEstadisticas);

// Listar todos los tickets con filtros opcionales (solo admin)
router.get("/", verifyToken, isAdmin, SoporteController.listarTodos);

// Obtener un ticket específico (admin puede ver cualquiera, usuario solo los suyos)
router.get("/:id_soporte", verifyToken, SoporteController.obtenerPorId);

// Registrar respuesta del staff (solo admin)
router.put("/:id_soporte/responder", verifyToken, isAdmin, SoporteController.responder);

// Actualizar prioridad del ticket (solo admin)
router.put("/:id_soporte/prioridad", verifyToken, isAdmin, SoporteController.actualizarPrioridad);

// Cerrar ticket (solo admin)
router.put("/:id_soporte/cerrar", verifyToken, isAdmin, SoporteController.cerrar);

module.exports = router;
