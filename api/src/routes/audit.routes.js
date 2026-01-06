const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");
const { verifyToken, isSuperAdmin } = require("../middleware/auth");

// Todas las rutas requieren autenticación y permisos de super admin
router.use(verifyToken);
router.use(isSuperAdmin);

// GET /api/audit/logs - Obtener logs de auditoría con filtros
router.get("/logs", auditController.getAuditLogs);

// GET /api/audit/statistics - Obtener estadísticas de auditoría
router.get("/statistics", auditController.getStatistics);

// GET /api/audit/recent - Obtener actividad reciente
router.get("/recent", auditController.getRecentActivity);

// GET /api/audit/user/:userId - Obtener logs de un usuario específico
router.get("/user/:userId", auditController.getUserLogs);

// GET /api/audit/action-types - Obtener tipos de acciones disponibles
router.get("/action-types", auditController.getActionTypes);

// POST /api/audit/clean - Limpiar logs antiguos
router.post("/clean", auditController.cleanOldLogs);

module.exports = router;