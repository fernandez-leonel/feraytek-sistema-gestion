const express = require("express");
const router = express.Router();
const userManagementController = require("../controllers/userManagement.controller");
const { verifyToken, isSuperAdmin } = require("../middleware/auth");

// Todas las rutas requieren autenticación y rol de superadmin

// Obtener usuarios con filtros y paginación
// GET /api/user-management?rol=cliente&estado=activo&busqueda=juan&pagina=1&limite=20
router.get("/", verifyToken, isSuperAdmin, userManagementController.getUsers);

// Obtener estadísticas de usuarios
router.get("/statistics", verifyToken, isSuperAdmin, userManagementController.getStatistics);

// Cambiar rol de usuario
// PUT /api/user-management/:userId/role
// Body: { "rol": "admin" }
router.put("/:userId/role", verifyToken, isSuperAdmin, userManagementController.changeRole);

// Activar/desactivar usuario
// PUT /api/user-management/:userId/status
router.put("/:userId/status", verifyToken, isSuperAdmin, userManagementController.toggleStatus);

// Resetear contraseña de usuario
// POST /api/user-management/:userId/reset-password
router.post("/:userId/reset-password", verifyToken, isSuperAdmin, userManagementController.resetPassword);

module.exports = router;