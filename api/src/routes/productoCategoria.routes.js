const express = require("express");
const router = express.Router();
const ProductoCategoriaController = require("../controllers/productoCategoria.controller");

// Listar todas las relaciones producto ↔ categoría
router.get("/", ProductoCategoriaController.obtenerTodas);

// Obtener categorías secundarias de un producto
router.get("/:id_producto", ProductoCategoriaController.obtenerPorProducto);

// Asociar un producto con una categoría secundaria
router.post("/", ProductoCategoriaController.agregar);

// Eliminar relación producto ↔ categoría
router.delete(
  "/:id_producto/:id_categoria",
  ProductoCategoriaController.eliminar
);

module.exports = router;
