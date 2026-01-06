import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { pay, consult, simulateApprove } from "../controllers/paymentsController.js";

const router = Router();

router.post("/pagos", requireAuth, pay);
router.get("/pagos/consulta", requireAuth, consult);
router.post("/pagos/simular-aprobacion/:id_transaccion", requireAuth, simulateApprove);

export default router;