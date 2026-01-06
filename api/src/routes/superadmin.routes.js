// ======================================================================
// Rutas de Superadministrador
// Define los endpoints exclusivos para el superadministrador
// ======================================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

// Endpoint especial para crear el primer superadmin (solo una vez)
router.post('/create-first-superadmin', userController.createFirstSuperAdmin);

// Rutas que requieren autenticación de superadmin
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isSuperAdmin);

// Gestión de administradores
router.post('/register-admin', userController.registerAdmin);
router.get('/admins', userController.getAllAdmins);
router.put('/admin/:id/status', userController.toggleAdminStatus);

// Estadísticas del sistema
router.get('/system-stats', userController.getSystemStats);

module.exports = router;