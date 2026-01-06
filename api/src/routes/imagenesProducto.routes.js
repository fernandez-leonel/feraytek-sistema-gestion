const express = require("express");
const router = express.Router();
const ImagenesProductoController = require("../controllers/imagenesProducto.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Listar todas las imágenes
router.get("/", ImagenesProductoController.listar);

// Listar imágenes de un producto
router.get(
  "/producto/:id_producto",
  ImagenesProductoController.listarPorProducto
);

// Agregar nueva imagen
router.post("/", verifyToken, isAdmin, ImagenesProductoController.agregar);

// Eliminar imagen por ID
router.delete("/:id_imagen", verifyToken, isAdmin, ImagenesProductoController.eliminar);

module.exports = router;
