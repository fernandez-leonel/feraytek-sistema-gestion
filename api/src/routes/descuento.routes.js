const express = require("express");
const router = express.Router();
const DescuentoController = require("../controllers/descuento.controller");

// LISTAR TODOS LOS DESCUENTOS
router.get("/", DescuentoController.obtenerTodos);

// LISTAR DESCUENTOS VIGENTES
router.get("/vigentes", DescuentoController.obtenerVigentes);

// OBTENER DESCUENTO POR ID
router.get("/:id", DescuentoController.obtenerPorId);

// OBTENER DESCUENTO POR CÓDIGO
router.get("/codigo/:codigo", DescuentoController.obtenerPorCodigo);

// CREAR NUEVO DESCUENTO
router.post("/", DescuentoController.crear);

// ACTUALIZAR DESCUENTO EXISTENTE
router.put("/:id", DescuentoController.actualizar);

// CAMBIAR ESTADO (ACTIVO / INACTIVO)
router.patch("/:id/estado", DescuentoController.cambiarEstado);

// ELIMINAR DESCUENTO
router.delete("/:id", DescuentoController.eliminar);

// APLICAR DESCUENTO A UN MONTO BASE (PRUEBA LÓGICA)
router.post("/aplicar", DescuentoController.aplicar);

module.exports = router;
