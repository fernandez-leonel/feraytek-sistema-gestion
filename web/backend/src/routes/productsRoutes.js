import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { list, detail, create, update, remove, activeCategories, categoryDetail, categoryStats, productImages, addReview, listReviews, approveReview } from "../controllers/productsController.js";

const router = Router();

router.get("/productos", list);
router.get("/productos/:id", detail);
router.get("/productos/:id/reviews", listReviews);
router.post("/productos/:id/reviews", requireAuth, addReview);
// Compatibilidad con documentación: endpoints de reseñas
router.get("/resenas/producto/:id", listReviews);
router.post("/resenas", requireAuth, addReview);
router.patch("/resenas/:id/aprobar", requireAuth, approveReview);
router.post("/productos", requireAuth, create);
router.put("/productos/:id", requireAuth, update);
router.delete("/productos/:id", requireAuth, remove);

router.get("/categorias/activas", activeCategories);
router.get("/categorias/:id", categoryDetail);
router.get("/categorias/stats", categoryStats);
router.get("/imagenes_productos/producto/:id", productImages);

export default router;
