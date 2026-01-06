// ======================================================================
// Define los endpoints RESTful relacionados con los productos y sus variantes.
// ======================================================================

const express = require("express");
const router = express.Router();
const ProductoController = require("../controllers/producto.controller");
const VariantesProductoController = require("../controllers/variantesProducto.controller");
const { verifyToken, isAdmin } = require("../middleware/auth");

// ----------------------------------------------------------------------
// Documentación rápida de endpoints:
// GET    /api/productos                    -> Lista todos los productos
// GET    /api/productos/:id               -> Obtiene un producto por ID
// POST   /api/productos                   -> Crea un nuevo producto
// PUT    /api/productos/:id               -> Actualiza un producto existente
// DELETE /api/productos/:id               -> Elimina un producto (baja lógica)
// 
// GET    /api/productos/:id/variantes     -> Lista variantes de un producto
// POST   /api/productos/:id/variantes     -> Crea una nueva variante para un producto
// PUT    /api/productos/:id/variantes/:id_variante    -> Actualiza una variante
// DELETE /api/productos/:id/variantes/:id_variante    -> Elimina una variante
// ----------------------------------------------------------------------

// Rutas para productos CRUD
router.get("/", ProductoController.getAll); // Público - cualquiera puede ver productos
router.get("/:id", ProductoController.getById); // Público - cualquiera puede ver un producto
router.post("/", verifyToken, isAdmin, ProductoController.create); // Solo admins pueden crear
router.put("/:id", verifyToken, isAdmin, ProductoController.update); // Solo admins pueden actualizar
router.delete("/:id", verifyToken, isAdmin, ProductoController.remove); // Solo admins pueden eliminar

// Rutas para variantes de productos (anidadas)
router.get("/:id/variantes", VariantesProductoController.obtenerPorProducto); // Público
router.post("/:id/variantes", verifyToken, isAdmin, VariantesProductoController.crear); // Solo admins
router.put("/:id/variantes/:id_variante", verifyToken, isAdmin, VariantesProductoController.actualizar); // Solo admins
router.delete("/:id/variantes/:id_variante", verifyToken, isAdmin, VariantesProductoController.eliminar); // Solo admins

module.exports = router;
