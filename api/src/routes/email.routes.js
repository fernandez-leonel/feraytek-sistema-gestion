const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST /api/email/test - Probar configuración SMTP (solo admins)
router.post('/test', verifyToken, isAdmin, emailController.probarConfiguracionSMTP);

module.exports = router;