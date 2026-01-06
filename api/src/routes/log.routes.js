const express = require("express");
const router = express.Router();
const LogController = require("../controllers/log.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Listar todos los logs
router.get("/", verifyToken, isAdmin, LogController.listarTodos);

// Filtrar por usuario
router.get("/usuario/:id_usuario", verifyToken, isAdmin, LogController.listarPorUsuario);

// Ver detalle de log
router.get("/:id_log", verifyToken, isAdmin, LogController.obtenerDetalle);

module.exports = router;

