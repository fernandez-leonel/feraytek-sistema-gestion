const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordReset.controller');

// Rutas públicas para recuperación de contraseña
// POST /forgot-password - Solicitar código de recuperación
router.post('/forgot-password', passwordResetController.requestPasswordReset);

// POST /verify-reset-code - Verificar código de recuperación
router.post('/verify-reset-code', passwordResetController.verifyResetCode);

// POST /reset-password - Cambiar contraseña con código válido
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;