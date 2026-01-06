import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { create, history, order } from "../controllers/ordersController.js";

const router = Router();

router.post("/pedidos", requireAuth, create);
router.get("/pedidos", requireAuth, history);
router.get("/pedidos/usuario", requireAuth, history);
router.get("/historial_pedidos", requireAuth, history);
router.get("/historial_pedidos/pedido/:id", requireAuth, order);
router.get("/pedidos/:id", requireAuth, order);
router.get("/historial-pedidos", requireAuth, history);
router.get("/historial-pedidos/pedido/:id", requireAuth, order);

export default router;