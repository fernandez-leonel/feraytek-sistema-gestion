// Este módulo define las rutas HTTP para gestionar los envíos de pedidos.

const express = require("express");
const router = express.Router();

// Importamos el controlador de envíos
const EnvioController = require("../controllers/envio.controller");

// (Opcional) Middleware de autenticación y validación
const { verifyToken, isAdmin } = require("../middleware/auth");

// Lista de Envios - Solo admins pueden ver todos los envíos
router.get("/", verifyToken, isAdmin, EnvioController.listarEnvios);

// Obtener envio por ID - Solo admins pueden ver envíos específicos
router.get("/:id", verifyToken, isAdmin, EnvioController.obtenerEnvio);

// Crear Nuevo Envio - Solo admins pueden crear envíos
router.post("/", verifyToken, isAdmin, EnvioController.crearEnvio);

// Crear envíos para pedidos existentes - Solo admins pueden ejecutar esta función
router.post("/crear-para-existentes", verifyToken, isAdmin, EnvioController.crearEnviosParaPedidosExistentes);

//Actualizar Datos de Envios - Solo admins pueden actualizar
router.put("/:id", verifyToken, isAdmin, EnvioController.actualizarDatosEnvio);

//Cambios de Estado de Envios - Solo admins pueden cambiar estado
router.put("/:id/estado", verifyToken, isAdmin, EnvioController.cambiarEstadoEnvio);

// Eliminar Envio - Solo admins pueden eliminar
router.delete("/:id", verifyToken, isAdmin, EnvioController.eliminarEnvio);

module.exports = router;
