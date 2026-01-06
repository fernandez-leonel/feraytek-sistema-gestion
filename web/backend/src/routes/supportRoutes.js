import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { create, myTickets, detail, schemas } from "../controllers/supportController.js";

const router = Router();

router.post("/soporte", requireAuth, validate(schemas.createSchema), create);
router.get("/soporte/mis-tickets", requireAuth, myTickets);
router.get("/soporte/:id", requireAuth, detail);

export default router;

